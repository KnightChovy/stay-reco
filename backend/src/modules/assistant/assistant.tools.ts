import type { FunctionDeclaration } from '@google/genai';
import { HttpException, Injectable } from '@nestjs/common';
import {
  type AssistantHotel,
  type AssistantMessage,
  type BookingProposal,
  type CancellationProposal,
  createBookingSchema,
  daysBetween,
  hotelSearchQuerySchema,
  isCalendarDate,
  MY_BOOKING_TABS,
  stayQuerySchema,
} from '@stayreco/shared';
import { randomUUID } from 'crypto';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../generated/prisma/client';
import { todayInVietnam } from '../../common/http/calendar-date';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingCancellationService } from '../bookings/booking-cancellation.service';
import { BookingsService } from '../bookings/bookings.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { campaignUsable } from '../promotions/discount';
import { PromotionsService } from '../promotions/promotions.service';
import { StayDiscountService } from '../promotions/stay-discount.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { StaysService } from '../stays/stays.service';
import { CustomerWalletService } from '../wallets/customer-wallet.service';
import { STYLE_LABELS as STYLE_WORDS } from './assistant.prompt';

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
  priorRecommendations: Map<string, string>;
  proposal: BookingProposal | null;
  /** A cancellation the customer can confirm; like a booking, only ever proposed. */
  cancellation: CancellationProposal | null;
  /** Room types looked at, so the next turn can book one by its real id instead of guessing it. */
  roomTypes: Map<string, { hotelName: string; name: string }>;
  /** The model needs the dates and guests: a picker is shown under the reply, filled with what is known. */
  askTrip: AssistantMessage['askTrip'];
}

/**
 * The functions the model may call. Each one checks its arguments with the same zod schema the HTTP API uses and
 * goes through the same service, so the assistant can only see what a customer could see on the website and cannot
 * skip a rule the website enforces.
 *
 * None of them writes anything. The two actions with consequences are only *proposed* here: a booking, made by
 * POST /conversations/:id/confirm-booking, and a cancellation, made by POST /conversations/:id/confirm-cancellation,
 * each the customer's own click. The "my_" tools read the customer's own data only (vouchers, wallet, bookings).
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
        pricePerNightMax: {
          type: 'number',
          description:
            'Giá tối đa MỖI ĐÊM (VND), đúng như khách nói, ví dụ "dưới 2 triệu một đêm" là 2000000. Không tự nhân với số đêm.',
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
        code: {
          type: 'string',
          description:
            'Mã giảm giá (voucher) khách muốn dùng, lấy từ my_vouchers hoặc khách tự gõ. Bỏ trống thì hệ thống tự áp chiến dịch tốt nhất nếu có.',
        },
        pointsToUse: {
          type: 'integer',
          description:
            'Số điểm StayMiles khách muốn dùng (xem my_wallet). Chỉ dùng khi khách nói muốn dùng điểm.',
        },
        addOns: {
          type: 'array',
          description:
            'Dịch vụ đặt kèm (lấy id từ addOns của get_hotel_rooms, chỉ loại prebookable).',
          items: {
            type: 'object',
            properties: {
              addOnId: { type: 'string' },
              quantity: { type: 'integer', description: 'Mặc định 1.' },
            },
            required: ['addOnId'],
          },
        },
      },
      required: ['hotelId', 'roomTypeId', 'checkIn', 'checkOut', 'guests'],
    },
  },
  {
    name: 'ask_trip_details',
    description:
      'Hiện khung chọn ngày nhận/trả phòng và số khách ngay dưới tin nhắn, để khách bấm chọn thay vì gõ. Gọi khi cần tìm phòng trống hay đặt phòng mà còn thiếu ngày hoặc số khách. Truyền những gì đã biết để điền sẵn.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        destination: {
          type: 'string',
          description: 'Nơi đến khách đã nói, nếu có.',
        },
        checkIn: { type: 'string', description: 'YYYY-MM-DD, nếu đã biết.' },
        checkOut: { type: 'string', description: 'YYYY-MM-DD, nếu đã biết.' },
        guests: { type: 'integer', description: 'Số khách, nếu đã biết.' },
      },
    },
  },
  {
    name: 'my_vouchers',
    description:
      'Các mã giảm giá (voucher) khách đang có và còn dùng được: mã, mức giảm, đơn tối thiểu, hạn dùng, khách sạn áp dụng. Dùng khi khách hỏi về mã giảm giá, khuyến mãi.',
    parametersJsonSchema: { type: 'object', properties: {} },
  },
  {
    name: 'my_wallet',
    description:
      'Số dư ví StayReco và điểm StayMiles của khách (kèm giá trị quy ra tiền, hạng thành viên).',
    parametersJsonSchema: { type: 'object', properties: {} },
  },
  {
    name: 'my_bookings',
    description:
      'Lịch sử đặt phòng của khách: mã đặt phòng, khách sạn, ngày, trạng thái, tiền. Dùng khi khách hỏi về đơn đã đặt, chuyến đi, hoặc trước khi huỷ.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        tab: {
          type: 'string',
          enum: ['upcoming', 'staying', 'completed', 'cancelled', 'all'],
          description:
            'upcoming: sắp tới (chờ thanh toán, đã xác nhận); staying: đang ở; completed: đã ở xong; cancelled: đã huỷ/hết hạn; all: tất cả. Mặc định all.',
        },
      },
    },
  },
  {
    name: 'propose_cancellation',
    description:
      'Tính phí huỷ và số tiền được hoàn cho một đơn đã thanh toán, rồi tạo đề xuất huỷ để khách tự bấm "Xác nhận huỷ". KHÔNG huỷ. Chỉ gọi khi khách nói muốn huỷ một đơn cụ thể.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        bookingCode: {
          type: 'string',
          description: 'Mã đặt phòng dạng SR-YYMMDD-XXXX (lấy từ my_bookings).',
        },
        reason: { type: 'string', description: 'Lý do huỷ khách nói, nếu có.' },
      },
      required: ['bookingCode'],
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
    private readonly stayDiscount: StayDiscountService,
    private readonly promotions: PromotionsService,
    private readonly loyalty: LoyaltyService,
    private readonly wallet: CustomerWalletService,
    private readonly bookings: BookingsService,
    private readonly cancellations: BookingCancellationService,
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
        case 'ask_trip_details':
          return askTrip(args, state);
        case 'my_vouchers':
          return await this.myVouchers(customer);
        case 'my_wallet':
          return await this.myWallet(customer);
        case 'my_bookings':
          return await this.myBookings(args, customer);
        case 'propose_cancellation':
          return await this.proposeCancellation(args, customer, state);
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
    // The search filters on the total of the stay; the customer speaks of a price per night, so the code multiplies
    // (the model was asked to before, and could not be relied on to).
    const perNight = Number(args.pricePerNightMax);
    const nights =
      typeof args.checkIn === 'string' &&
      typeof args.checkOut === 'string' &&
      isCalendarDate(args.checkIn) &&
      isCalendarDate(args.checkOut)
        ? daysBetween(args.checkIn, args.checkOut)
        : 0;
    const parsed = hotelSearchQuerySchema.safeParse({
      destination: args.destination,
      checkIn: args.checkIn,
      checkOut: args.checkOut,
      guests: args.guests ?? 2,
      rooms: args.rooms ?? 1,
      priceMax:
        perNight > 0 && nights > 0 ? Math.round(perNight * nights) : undefined,
      starRating: args.starRating,
      amenityIds: amenityIds.length ? amenityIds : undefined,
      freeCancellation:
        typeof args.freeCancellation === 'boolean'
          ? String(args.freeCancellation)
          : undefined,
      page: 1,
      pageSize: SEARCH_RESULTS,
    });
    if (!parsed.success) return invalid(parsed.error);

    const found = await this.stays.search(parsed.data, customer.id);
    const ids = found.items.map((h) => h.id);
    const [scores, cards] = await Promise.all([
      this.recommendations.personalScores(customer.id, ids),
      this.recommendations.cards(ids),
    ]);
    const hotels = found.items.map((h) => {
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
        recommendationId: score?.recommendationId ?? null,
        styles: h.styles,
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
        styles: h.styles.map((s) => STYLE_WORDS[s] ?? s),
        recommendedForThisGuest: score ? score.rank : null,
        whyRecommended: score?.reason ?? null,
      };
    });
    return {
      nights: found.items[0]?.nights ?? null,
      matching: found.meta.total,
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
        recommendationId: h.recommendationId ?? null,
        styles: h.styles,
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
        styles: h.styles.map((s) => STYLE_WORDS[s] ?? s),
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
      // The model once invented spa and dinner offers with prices: this says the list is the whole catalogue.
      addOnsNote:
        'Đây là toàn bộ dịch vụ khách sạn bán qua StayReco, giá tính theo lần. Không có trong danh sách thì không được nêu tên hay giá; khách cần thì ghi vào specialRequests.',
      // Services sold with the stay; only prebookable ones can go on propose_booking, the rest are paid at the desk.
      addOns: h.addOns.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        price: a.price,
        timing: a.timing,
        prebookable: a.prebookable,
      })),
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

    const code =
      typeof args.code === 'string' && args.code.trim()
        ? args.code.trim()
        : undefined;
    const pointsToUse =
      Number.isInteger(args.pointsToUse) && Number(args.pointsToUse) > 0
        ? Number(args.pointsToUse)
        : undefined;
    const addOns = Array.isArray(args.addOns)
      ? (args.addOns as Args[]).map((a) => ({
          addOnId: String(a.addOnId),
          quantity: Number(a.quantity ?? 1),
        }))
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
      code,
      pointsToUse,
      addOns: addOns?.length ? addOns : undefined,
      expectedTotal: offer.total,
    });
    if (!input.success) return invalid(input.error);

    // Priced exactly as the booking page prices it: the best campaign or the code, the points, the add-ons. A code
    // that does not apply, or points the guest does not have, throw here and reach the model as an error to explain.
    const quote = await this.stayDiscount.quote(customer.id, {
      items: input.data.items,
      checkIn: input.data.checkIn,
      checkOut: input.data.checkOut,
      code,
      pointsToUse,
      addOns: input.data.addOns,
    });
    const addOnNames = new Map(listing.hotel.addOns.map((a) => [a.id, a]));
    const addOnLines = (input.data.addOns ?? []).map((line) => {
      const a = addOnNames.get(line.addOnId);
      return {
        id: line.addOnId,
        name: a?.name ?? 'Dịch vụ',
        quantity: line.quantity,
        amount: (a?.price ?? 0) * line.quantity,
      };
    });

    const proposal: BookingProposal = {
      id: randomUUID(),
      hotelId: listing.hotel.id,
      recommendationId:
        state.hotels.get(listing.hotel.id)?.recommendationId ??
        state.priorRecommendations.get(listing.hotel.id),
      hotelName: listing.hotel.name,
      roomTypeId: item.roomType.id,
      roomTypeName: item.roomType.name,
      checkIn: stay.data.checkIn,
      checkOut: stay.data.checkOut!,
      guests: stay.data.guests,
      rooms,
      total: quote.expectedTotal,
      freeCancellationUntil: offer.freeCancellationUntil,
      guestName,
      contactPhone,
      specialRequests: specialRequests ?? null,
      expiresAt: new Date(Date.now() + PROPOSAL_TTL_MS).toISOString(),
      bookingId: null,
      subtotal: quote.subtotal + quote.addOnsTotal,
      discount: quote.discount && {
        name: quote.discount.name,
        code: quote.discount.code,
        amount: quote.discount.amount,
      },
      points:
        quote.points && quote.points.pointsUsed > 0
          ? { used: quote.points.pointsUsed, amount: quote.points.amount }
          : null,
      addOns: addOnLines,
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
      rooms_total: quote.subtotal,
      discount: proposal.discount,
      points: proposal.points,
      addOns: addOnLines.map((a) => `${a.quantity} × ${a.name}: ${a.amount}`),
      total: proposal.total,
      freeCancellationUntil: proposal.freeCancellationUntil,
      guestName,
      contactPhone,
      note: 'Chưa đặt. Khách phải bấm nút "Xác nhận đặt phòng" hiện dưới tin nhắn trong 30 phút. Sau khi bấm, mã QR chuyển khoản hiện ngay trong khung chat, hoặc khách trả bằng ví StayReco.',
    };
  }

  private async myVouchers(customer: ToolCustomer) {
    const page = await this.promotions.listMine(customer.id, {
      active: true,
      page: 1,
      pageSize: 20,
    });
    const vouchers = page.items;
    const hotelIds = [
      ...new Set(vouchers.map((v) => v.hotelId).filter(Boolean)),
    ] as string[];
    const hotels = await this.prisma.hotel.findMany({
      where: { hotelId: { in: hotelIds } },
      select: { hotelId: true, name: true },
    });
    const nameOf = new Map(hotels.map((h) => [h.hotelId, h.name]));
    return {
      vouchers: vouchers.map((v) => ({
        code: v.code,
        campaign: v.promotionName,
        discount:
          v.discountType === 'PERCENTAGE'
            ? `${v.discountValue}%`
            : `${v.discountValue} VND`,
        maxDiscount: v.maxDiscount,
        minBookingAmount: v.minBookingAmount,
        expiresAt: v.expiresAt,
        hotel: v.hotelId
          ? (nameOf.get(v.hotelId) ?? 'một khách sạn')
          : 'mọi khách sạn',
      })),
      campaigns: await this.runningCampaigns(),
      note: vouchers.length
        ? 'Khách chọn mã nào thì truyền vào code của propose_booking. Chiến dịch (campaigns) không cần mã, tự trừ khi đề xuất ở đúng khách sạn.'
        : 'Khách chưa có mã riêng. Gợi ý các chiến dịch (campaigns) đang chạy: không cần mã, tự trừ khi đề xuất đặt phòng ở đúng khách sạn.',
    };
  }

  /** Campaigns that apply without a code (the same rule as DiscountService), to suggest when the customer has no voucher. */
  private async runningCampaigns() {
    const today = todayInVietnam();
    const rows = await this.prisma.promotion.findMany({
      where: { isActive: true, requiresCode: false },
      include: { hotel: { select: { name: true, city: true } } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    return rows
      .filter((p) => campaignUsable(p, today))
      .slice(0, 10)
      .map((p) => ({
        name: p.name,
        discount:
          p.discountType === 'PERCENTAGE'
            ? `${Number(p.discountValue)}%`
            : `${Number(p.discountValue)} VND`,
        minBookingAmount: p.minBookingAmount
          ? Number(p.minBookingAmount)
          : null,
        validTo: p.validTo?.toISOString().slice(0, 10) ?? null,
        hotel: p.hotel ? `${p.hotel.name} (${p.hotel.city})` : 'mọi khách sạn',
      }));
  }

  private async myWallet(customer: ToolCustomer) {
    const wallet = await this.wallet.balance(customer.id);
    // No loyalty programme running is a normal state, not a reason to hide the wallet: the points part is then null.
    const loyalty = await this.loyalty.account(customer.id).catch((err) => {
      if (err instanceof HttpException) return null;
      throw err;
    });
    return {
      walletBalance: wallet.balanceAvailable,
      walletPending: wallet.balancePending,
      points: loyalty?.pointsBalance ?? null,
      pointsValue: loyalty?.balanceValue ?? null,
      pointValue: loyalty?.pointValue ?? null,
      tier: loyalty?.tier ?? null,
      note: loyalty
        ? 'Ví trả được trọn một đơn (không trả một phần). Điểm dùng khi đặt phòng qua pointsToUse của propose_booking.'
        : 'Ví trả được trọn một đơn (không trả một phần). Chương trình điểm StayMiles hiện chưa chạy.',
    };
  }

  private async myBookings(args: Args, customer: ToolCustomer) {
    const wanted =
      typeof args.tab === 'string' &&
      (MY_BOOKING_TABS as readonly string[]).includes(args.tab)
        ? [args.tab as (typeof MY_BOOKING_TABS)[number]]
        : [...MY_BOOKING_TABS];
    const lists = await Promise.all(
      wanted.map((tab) =>
        this.bookings.listMine(asCustomer(customer), {
          tab,
          page: 1,
          pageSize: 10,
        }),
      ),
    );
    return {
      bookings: lists
        .flatMap((l) => l.items)
        .map((b) => ({
          code: b.code,
          hotel: b.hotel.name,
          city: b.hotel.city,
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          nights: b.nights,
          guests: b.guests,
          status: b.status,
          paymentStatus: b.paymentStatus,
          total: b.totalAmount,
        })),
      note: 'PENDING = đang giữ phòng chờ thanh toán (tự hết hạn sau 15 phút, không cần huỷ). Chỉ huỷ được đơn CONFIRMED đã thanh toán và chưa nhận phòng.',
    };
  }

  private async proposeCancellation(
    args: Args,
    customer: ToolCustomer,
    state: TurnState,
  ) {
    const code =
      typeof args.bookingCode === 'string' ? args.bookingCode.trim() : '';
    // Found by code among the customer's own bookings only: another customer's code answers "not found".
    const booking = await this.prisma.booking.findFirst({
      where: {
        customerId: customer.id,
        invoice: { invoiceNumber: { equals: code, mode: 'insensitive' } },
      },
      select: {
        bookingId: true,
        checkInDate: true,
        checkOutDate: true,
        invoice: { select: { invoiceNumber: true } },
        hotel: { select: { name: true } },
      },
    });
    if (!booking) {
      return {
        error: `Không tìm thấy đơn ${code} của khách. Dùng my_bookings để xem mã đúng.`,
      };
    }
    // Throws BOOKING_STATUS_CONFLICT / CANCELLATION_NOT_ALLOWED for a booking that cannot be cancelled.
    const quote = await this.cancellations.quote(
      asCustomer(customer),
      booking.bookingId,
    );
    const reason =
      typeof args.reason === 'string' && args.reason.trim()
        ? args.reason.trim().slice(0, 200)
        : 'Khách huỷ qua trợ lý StayReco';
    const proposal: CancellationProposal = {
      id: randomUUID(),
      bookingId: booking.bookingId,
      bookingCode: booking.invoice!.invoiceNumber,
      hotelName: booking.hotel.name,
      checkIn: booking.checkInDate.toISOString().slice(0, 10),
      checkOut: booking.checkOutDate.toISOString().slice(0, 10),
      paid: quote.paid,
      fee: quote.fee,
      refund: quote.refund,
      freeUntil: quote.freeUntil,
      needsApproval: quote.needsApproval,
      reason,
      expiresAt: new Date(Date.now() + PROPOSAL_TTL_MS).toISOString(),
      outcome: null,
    };
    state.cancellation = proposal;
    return {
      proposalId: proposal.id,
      bookingCode: proposal.bookingCode,
      hotel: proposal.hotelName,
      paid: quote.paid,
      fee: quote.fee,
      refund: quote.refund,
      freeUntil: quote.freeUntil,
      refundNeedsHotelApproval: quote.needsApproval,
      note: 'Chưa huỷ. Khách phải bấm "Xác nhận huỷ" dưới tin nhắn. Nói rõ phí huỷ và số tiền hoàn: tiền hoàn về ví StayReco, sau khi khách sạn duyệt nếu refundNeedsHotelApproval.',
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

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * `ask_trip_details`: nothing to look up, only a picker to show. What the model already knows is passed through when
 * it looks right, so the customer only fills in the rest; the answer tells the model not to ask again in words.
 */
function askTrip(args: Args, state: TurnState) {
  const date = (v: unknown) =>
    typeof v === 'string' && DATE.test(v) ? v : null;
  const guests = Number(args.guests);
  state.askTrip = {
    destination:
      typeof args.destination === 'string' && args.destination.trim()
        ? args.destination.trim().slice(0, 100)
        : null,
    checkIn: date(args.checkIn),
    checkOut: date(args.checkOut),
    guests:
      Number.isInteger(guests) && guests > 0 && guests <= 30 ? guests : null,
  };
  return {
    shown: true,
    note: 'Khung chọn ngày và số khách đã hiện dưới tin nhắn. Viết một câu ngắn mời khách chọn ở khung đó, không hỏi lại bằng chữ và không thêm dòng gợi ý trả lời.',
  };
}

/** Lowercase without Vietnamese accents. */
export const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim();

/** The customer as the booking services expect a signed-in caller: the tools act only as them. */
const asCustomer = (customer: ToolCustomer): AuthUser => ({
  accountId: customer.id,
  role: UserRole.CUSTOMER,
  sessionId: 'assistant',
});
