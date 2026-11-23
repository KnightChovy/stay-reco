import type { FunctionDeclaration } from '@google/genai';
import { HttpException, Injectable } from '@nestjs/common';
import {
  type AssistantHotel,
  type BookingProposal,
  createBookingSchema,
  hotelSearchQuerySchema,
  stayQuerySchema,
} from '@stayreco/shared';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { StaysService } from '../stays/stays.service';

/** How long a priced proposal can be confirmed: prices and free rooms move, so it does not wait for ever. */
export const PROPOSAL_TTL_MS = 30 * 60_000;
/** Hotels returned to the model per search: enough to compare, few enough to keep the prompt small. */
const SEARCH_RESULTS = 8;

/** What the customer is, as far as the tools need: their id and the defaults for a booking. */
export interface ToolCustomer {
  id: string;
  fullName: string;
  phone: string | null;
}

/** What the tools collected during one turn, shown to the customer next to the reply. */
export interface TurnState {
  hotels: Map<string, AssistantHotel>;
  proposal: BookingProposal | null;
  /** Room types looked at, so the next turn can book one by its real id instead of guessing it. */
  roomTypes: Map<string, { hotelName: string; name: string }>;
}

/**
 * The functions the model may call. Each one checks its arguments with the same zod schema the HTTP API uses and
 * goes through the same service, so the assistant can only see what a customer could see on the website and cannot
 * skip a rule the website enforces.
 *
 * None of them writes anything. The one action with consequences, booking, is only *proposed* here; the booking is
 * made by POST /conversations/:id/confirm-booking, which is the customer's own click.
 */
export const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'search_hotels',
    description:
      'Tìm khách sạn còn phòng cho một kỳ ở cụ thể. Kết quả đã được xếp theo mức phù hợp với khách này (model gợi ý), rồi đến điểm đánh giá. Dùng khi khách đã nói nơi đến và ngày.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        destination: {
          type: 'string',
          description: 'Thành phố, tên hoặc địa chỉ, ví dụ "Đà Lạt".',
        },
        checkIn: { type: 'string', description: 'YYYY-MM-DD' },
        checkOut: { type: 'string', description: 'YYYY-MM-DD' },
        guests: { type: 'integer', description: 'Tổng số khách, mặc định 2.' },
        rooms: { type: 'integer', description: 'Số phòng, mặc định 1.' },
        priceMax: {
          type: 'number',
          description:
            'Tổng tiền tối đa cho CẢ kỳ ở (VND), không phải giá mỗi đêm.',
        },
        starRating: {
          type: 'array',
          items: { type: 'integer' },
          description: 'Hạng sao chấp nhận, ví dụ [4, 5].',
        },
        amenities: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tiện nghi bắt buộc, ví dụ ["Hồ bơi", "Bữa sáng"].',
        },
        freeCancellation: { type: 'boolean' },
      },
      required: ['destination', 'checkIn', 'checkOut'],
    },
  },
  {
    name: 'recommend_hotels',
    description:
      'Danh sách khách sạn model gợi ý riêng cho khách này (học từ lịch sử đặt phòng, đánh giá và sở thích đã lưu), kèm lý do. Không cần ngày. Dùng khi khách hỏi chung chung "nên ở đâu", "gợi ý giúp".',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: 'Chỉ lấy khách sạn ở thành phố này.',
        },
        limit: { type: 'integer', description: '1-10, mặc định 5.' },
      },
    },
  },
  {
    name: 'get_hotel_rooms',
    description:
      'Chi tiết một khách sạn: mô tả, tiện nghi, chính sách huỷ và từng loại phòng. Có ngày thì kèm giá, số phòng trống và có vừa số khách không.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        hotelId: { type: 'string' },
        checkIn: { type: 'string', description: 'YYYY-MM-DD' },
        checkOut: { type: 'string', description: 'YYYY-MM-DD' },
        guests: { type: 'integer' },
        rooms: { type: 'integer' },
      },
      required: ['hotelId'],
    },
  },
  {
    name: 'propose_booking',
    description:
      'Tính giá và tạo một đề xuất đặt phòng để khách tự bấm "Xác nhận đặt phòng". KHÔNG đặt phòng. Chỉ gọi khi khách đã chọn khách sạn, loại phòng, ngày và số khách, và nói muốn đặt.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        hotelId: { type: 'string' },
        roomTypeId: { type: 'string' },
        checkIn: { type: 'string', description: 'YYYY-MM-DD' },
        checkOut: { type: 'string', description: 'YYYY-MM-DD' },
        guests: { type: 'integer' },
        rooms: { type: 'integer', description: 'Mặc định 1.' },
        guestName: {
          type: 'string',
          description: 'Tên người nhận phòng nếu khác chủ tài khoản.',
        },
        contactPhone: {
          type: 'string',
          description: 'Bắt buộc nếu tài khoản chưa có số điện thoại.',
        },
        specialRequests: { type: 'string' },
      },
      required: ['hotelId', 'roomTypeId', 'checkIn', 'checkOut', 'guests'],
    },
  },
];

type Args = Record<string, unknown>;

@Injectable()
export class AssistantTools {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stays: StaysService,
    private readonly recommendations: RecommendationsService,
  ) {}

  /** Runs one call. Errors become a result the model can read and explain, never an exception for the customer. */
  async run(
    name: string,
    args: Args,
    customer: ToolCustomer,
    state: TurnState,
  ): Promise<Record<string, unknown>> {
    try {
      switch (name) {
        case 'search_hotels':
          return await this.searchHotels(args, customer, state);
        case 'recommend_hotels':
          return await this.recommendHotels(args, customer, state);
        case 'get_hotel_rooms':
          return await this.hotelRooms(args, state);
        case 'propose_booking':
          return await this.proposeBooking(args, customer, state);
        default:
          return { error: `Không có công cụ ${name}` };
      }
    } catch (err) {
      if (err instanceof HttpException) {
        const body = err.getResponse();
        return {
          error:
            typeof body === 'object' && body && 'message' in body
              ? String(body.message)
              : err.message,
          code:
            typeof body === 'object' && body && 'code' in body
              ? String(body.code)
              : undefined,
        };
      }
      throw err;
    }
  }

  private async searchHotels(
    args: Args,
    customer: ToolCustomer,
    state: TurnState,
  ) {
    const amenityIds = await this.amenityIds(args.amenities);
    const parsed = hotelSearchQuerySchema.safeParse({
      destination: args.destination,
      checkIn: args.checkIn,
      checkOut: args.checkOut,
      guests: args.guests ?? 2,
      rooms: args.rooms ?? 1,
      priceMax: args.priceMax,
      starRating: args.starRating,
      amenityIds: amenityIds.length ? amenityIds : undefined,
      freeCancellation:
        typeof args.freeCancellation === 'boolean'
          ? String(args.freeCancellation)
          : undefined,
      page: 1,
      pageSize: 100,
    });
    if (!parsed.success) return invalid(parsed.error);

    const found = await this.stays.search(parsed.data);
    const ids = found.items.map((h) => h.id);
    const [scores, cards] = await Promise.all([
      this.recommendations.personalScores(customer.id, ids),
      this.recommendations.cards(ids),
    ]);
    // The model's list first, in its order; then the rest by guest rating, then price.
    const ranked = [...found.items].sort((a, b) => {
      const ra = scores.get(a.id)?.rank ?? Infinity;
      const rb = scores.get(b.id)?.rank ?? Infinity;
      if (ra !== rb) return ra - rb;
      const ga = cards.get(a.id)?.rating ?? 0;
      const gb = cards.get(b.id)?.rating ?? 0;
      return gb - ga || a.fromTotal - b.fromTotal;
    });

    const hotels = ranked.slice(0, SEARCH_RESULTS).map((h) => {
      const card = cards.get(h.id);
      const score = scores.get(h.id);
      const shown: AssistantHotel = {
        id: h.id,
        name: h.name,
        city: h.city,
        starRating: h.starRating,
        coverImageUrl: h.coverImageUrl,
        rating: card?.rating ?? null,
        fromTotal: h.fromTotal,
        nights: h.nights,
        pricePerNightFrom: card?.pricePerNightFrom ?? null,
        reason: score?.reason ?? null,
      };
      state.hotels.set(h.id, shown);
      return {
        id: h.id,
        name: h.name,
        city: h.city,
        stars: h.starRating,
        rating: card?.rating ?? null,
        reviews: card?.reviewCount ?? 0,
        totalForStay: h.fromTotal,
        freeCancellation: h.freeCancellation,
        recommendedForThisGuest: score ? score.rank : null,
        whyRecommended: score?.reason ?? null,
      };
    });
    return {
      nights: found.items[0]?.nights ?? null,
      matching: found.items.length,
      hotels,
    };
  }

  private async recommendHotels(
    args: Args,
    customer: ToolCustomer,
    state: TurnState,
  ) {
    const limit = Math.min(10, Math.max(1, Number(args.limit) || 5));
    const city =
      typeof args.city === 'string' && args.city.trim()
        ? args.city.trim()
        : undefined;
    const list = await this.recommendations.list(customer.id, {
      city,
      limit,
    });
    for (const h of list.items) {
      state.hotels.set(h.id, {
        id: h.id,
        name: h.name,
        city: h.city,
        starRating: h.starRating,
        coverImageUrl: h.coverImageUrl,
        rating: h.rating,
        fromTotal: null,
        nights: null,
        pricePerNightFrom: h.pricePerNightFrom,
        reason: h.reason,
      });
    }
    return {
      personalized: list.personalized,
      hotels: list.items.map((h) => ({
        id: h.id,
        name: h.name,
        city: h.city,
        stars: h.starRating,
        rating: h.rating,
        reviews: h.reviewCount,
        pricePerNightFrom: h.pricePerNightFrom,
        isNew: h.isNew,
        why: h.reason,
      })),
    };
  }

  private async hotelRooms(args: Args, state: TurnState) {
    const hasDates = args.checkIn !== undefined || args.checkOut !== undefined;
    const parsed = stayQuerySchema.safeParse({
      checkIn: args.checkIn,
      checkOut: args.checkOut,
      guests: args.guests ?? (hasDates ? 2 : 1),
      rooms: args.rooms ?? 1,
    });
    if (!parsed.success) return invalid(parsed.error);
    const listing = await this.stays.hotelListing(
      String(args.hotelId),
      parsed.data,
    );
    const h = listing.hotel;
    for (const { roomType } of listing.roomTypes) {
      state.roomTypes.set(roomType.id, {
        hotelName: h.name,
        name: roomType.name,
      });
    }
    return {
      hotel: {
        id: h.id,
        name: h.name,
        city: h.city,
        address: h.address,
        stars: h.starRating,
        description: h.description?.slice(0, 600) ?? null,
        amenities: h.amenities.map((a) => a.name),
        checkInTime: h.checkInTime,
        checkOutTime: h.checkOutTime,
        cancellationPolicy: h.cancellationPolicy,
      },
      roomTypes: listing.roomTypes.map(({ roomType: rt, offer }) => ({
        id: rt.id,
        name: rt.name,
        description: rt.description,
        maxOccupancy: rt.maxOccupancy,
        areaSqm: rt.areaSqm,
        beds: rt.beds.map((b) => `${b.quantity} ${b.name}`),
        amenities: rt.amenities.map((a) => a.name),
        offer: offer && {
          available: offer.available,
          fitsGuests: offer.fitsGuests,
          total: offer.total,
          perRoomTotal: offer.perRoomTotal,
          freeCancellationUntil: offer.freeCancellationUntil,
        },
      })),
    };
  }

  private async proposeBooking(
    args: Args,
    customer: ToolCustomer,
    state: TurnState,
  ) {
    const rooms = Number(args.rooms ?? 1);
    const stay = stayQuerySchema.safeParse({
      checkIn: args.checkIn,
      checkOut: args.checkOut,
      guests: args.guests,
      rooms,
    });
    if (!stay.success) return invalid(stay.error);
    if (!stay.data.checkIn) return { error: 'Cần ngày nhận và trả phòng' };

    const listing = await this.stays.hotelListing(
      String(args.hotelId),
      stay.data,
    );
    const item = listing.roomTypes.find(
      (r) => r.roomType.id === args.roomTypeId,
    );
    if (!item) {
      return { error: 'Loại phòng này không thuộc khách sạn đã chọn' };
    }
    const offer = item.offer!;
    if (!offer.fitsGuests) {
      return {
        error: `Loại phòng này chỉ ở tối đa ${item.roomType.maxOccupancy} khách mỗi phòng; cần thêm phòng hoặc loại phòng khác`,
      };
    }
    if (offer.available < rooms) {
      return {
        error: `Chỉ còn ${offer.available} phòng loại này cho các đêm đó`,
      };
    }

    const guestName =
      typeof args.guestName === 'string' && args.guestName.trim()
        ? args.guestName.trim()
        : customer.fullName;
    const contactPhone =
      typeof args.contactPhone === 'string' && args.contactPhone.trim()
        ? args.contactPhone.trim()
        : customer.phone;
    if (!contactPhone) {
      return {
        error:
          'Tài khoản chưa có số điện thoại: hỏi khách số điện thoại liên hệ rồi gọi lại',
      };
    }
    const specialRequests =
      typeof args.specialRequests === 'string' && args.specialRequests.trim()
        ? args.specialRequests.trim()
        : undefined;

    // The request the confirm button will send, checked now so a proposal that cannot be booked is never shown.
    const input = createBookingSchema.safeParse({
      items: [{ roomTypeId: item.roomType.id, rooms }],
      checkIn: stay.data.checkIn,
      checkOut: stay.data.checkOut,
      guests: stay.data.guests,
      guestName,
      contactPhone,
      specialRequests,
      expectedTotal: offer.total,
    });
    if (!input.success) return invalid(input.error);

    const proposal: BookingProposal = {
      id: randomUUID(),
      hotelId: listing.hotel.id,
      hotelName: listing.hotel.name,
      roomTypeId: item.roomType.id,
      roomTypeName: item.roomType.name,
      checkIn: stay.data.checkIn,
      checkOut: stay.data.checkOut!,
      guests: stay.data.guests,
      rooms,
      total: offer.total,
      freeCancellationUntil: offer.freeCancellationUntil,
      guestName,
      contactPhone,
      specialRequests: specialRequests ?? null,
      expiresAt: new Date(Date.now() + PROPOSAL_TTL_MS).toISOString(),
      bookingId: null,
    };
    state.proposal = proposal;
    return {
      proposalId: proposal.id,
      hotel: proposal.hotelName,
      roomType: proposal.roomTypeName,
      checkIn: proposal.checkIn,
      checkOut: proposal.checkOut,
      guests: proposal.guests,
      rooms: proposal.rooms,
      total: proposal.total,
      freeCancellationUntil: proposal.freeCancellationUntil,
      guestName,
      contactPhone,
      note: 'Chưa đặt. Khách phải bấm nút "Xác nhận đặt phòng" hiện dưới tin nhắn trong 30 phút, sau đó thanh toán.',
    };
  }

  /** Amenity names the model wrote, matched to the catalog ignoring case and accents. */
  private async amenityIds(names: unknown): Promise<string[]> {
    if (!Array.isArray(names) || !names.length) return [];
    const catalog = await this.prisma.amenity.findMany({
      select: { amenityId: true, name: true },
    });
    return names.flatMap((n) => {
      const wanted = fold(String(n));
      const hit = catalog.find(
        (a) => fold(a.name).includes(wanted) || wanted.includes(fold(a.name)),
      );
      return hit ? [hit.amenityId] : [];
    });
  }
}

const invalid = (error: {
  issues: { path: PropertyKey[]; message: string }[];
}) => ({
  error: 'Tham số không hợp lệ',
  issues: error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
});

/** Lowercase without Vietnamese accents. */
export const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim();
