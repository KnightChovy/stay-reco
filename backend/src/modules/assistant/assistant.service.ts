import type { Content, Part } from '@google/genai';
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  AssistantHotel,
  AssistantMessage,
  AssistantReply,
  Booking,
  BookingProposal,
  CancellationProposal,
  Conversation,
  ConversationSummary,
  SendAssistantMessageInput,
} from '@stayreco/shared';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import { isUuid } from '../../common/hotel-access/hotel-access.service';
import { todayInVietnam } from '../../common/http/calendar-date';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingCancellationService } from '../bookings/booking-cancellation.service';
import { BookingsService } from '../bookings/bookings.service';
import { AiService } from '../marketing/ai.service';
import { stripInternalNotes } from './assistant-text';
import { systemPrompt } from './assistant.prompt';
import {
  AssistantTools,
  TOOL_DECLARATIONS,
  type ToolCustomer,
  type TurnState,
} from './assistant.tools';

/** Tool rounds per customer message. A search, a look at the rooms and a proposal is three; five leaves slack. */
const MAX_TOOL_ROUNDS = 5;
/** Earlier messages sent back to the model. Older ones rarely matter and every one is paid for on every turn. */
const HISTORY = 20;

/** What a stored message carries besides its text (`message.metadata`). */
interface MessageMeta {
  hotels?: AssistantHotel[];
  proposal?: BookingProposal & { claimedAt?: string };
  cancellation?: CancellationProposal & { claimedAt?: string };
  /** Room types the tools looked at this turn: replayed to the model, not shown to the customer. */
  roomTypes?: { id: string; hotelName: string; name: string }[];
}

const conversationNotFound = () =>
  new NotFoundException({
    code: ErrorCode.CONVERSATION_NOT_FOUND,
    message: 'Conversation not found',
  });

/**
 * The customer assistant: a chat that answers from the platform's own data and ends, when the customer wants, in a
 * booking they confirm themselves.
 *
 * Each customer message is one request: the history is replayed to the model with the tools of AssistantTools, the
 * tools it asks for are run, and the loop stops at a text answer. Only then are the customer's message and the reply
 * stored, together, so a failed turn (budget, model down) leaves no half-answered question behind.
 */
@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly tools: AssistantTools,
    private readonly bookings: BookingsService,
    private readonly cancellations: BookingCancellationService,
  ) {}

  async listMine(customerId: string): Promise<ConversationSummary[]> {
    const rows = await this.prisma.conversation.findMany({
      where: { customerId },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        conversationId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          where: { role: 'USER' },
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { content: true },
        },
      },
    });
    return rows.map((c) => ({
      id: c.conversationId,
      status: c.status,
      preview: (c.messages[0]?.content ?? '').slice(0, 120),
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  async get(customerId: string, conversationId: string): Promise<Conversation> {
    const c = await this.own(customerId, conversationId);
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
    const firstQuestion = messages.find((m) => m.role === 'USER');
    return {
      id: c.conversationId,
      status: c.status,
      preview: (firstQuestion?.content ?? '').slice(0, 120),
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      messages: messages.map(toMessage),
    };
  }

  /** A new conversation, opened with its first message. */
  start(user: AuthUser, input: SendAssistantMessageInput) {
    return this.turn(user, null, input);
  }

  async send(
    user: AuthUser,
    conversationId: string,
    input: SendAssistantMessageInput,
  ) {
    await this.own(user.accountId, conversationId);
    return this.turn(user, conversationId, input);
  }

  /**
   * The customer pressed "Xác nhận đặt phòng" on a proposal: books it through the same service as POST /bookings.
   *
   * The proposal is claimed first with a conditional update, so a double click books once. If booking fails (the
   * price moved, the room went), the claim is released and the error returned as is: the customer can ask the
   * assistant for a fresh proposal.
   */
  async confirmBooking(
    user: AuthUser,
    conversationId: string,
    proposalId: string,
  ): Promise<Booking> {
    await this.own(user.accountId, conversationId);
    const message = await this.prisma.message.findFirst({
      where: {
        conversationId,
        metadata: { path: ['proposal', 'id'], equals: proposalId },
      },
      select: { messageId: true, metadata: true },
    });
    if (!message) {
      throw new NotFoundException({
        code: ErrorCode.BOOKING_PROPOSAL_NOT_FOUND,
        message: 'Booking proposal not found',
      });
    }
    const proposal = (message.metadata as MessageMeta).proposal!;
    const invalid = (why: string) =>
      new ConflictException({
        code: ErrorCode.BOOKING_PROPOSAL_INVALID,
        message: why,
      });
    if (proposal.bookingId) throw invalid('This proposal is already booked');
    if (new Date(proposal.expiresAt) < new Date()) {
      throw invalid('This proposal has expired; ask the assistant again');
    }

    const claimed = await this.prisma.$executeRaw`
      UPDATE message
      SET metadata = jsonb_set(metadata, '{proposal,claimedAt}', to_jsonb(now()::text))
      WHERE message_id = ${message.messageId}::uuid AND NOT (metadata->'proposal' ? 'claimedAt')`;
    if (!claimed) throw invalid('This proposal is being booked already');

    let booking: Booking;
    try {
      booking = await this.bookings.create(user, {
        recommendationId: proposal.recommendationId,
        items: [{ roomTypeId: proposal.roomTypeId, rooms: proposal.rooms }],
        checkIn: proposal.checkIn,
        checkOut: proposal.checkOut,
        guests: proposal.guests,
        guestName: proposal.guestName,
        contactPhone: proposal.contactPhone,
        specialRequests: proposal.specialRequests ?? undefined,
        // What the proposal was priced with, sent again so the booking is priced the same way (or answers
        // BOOKING_PRICE_CHANGED, VOUCHER_* when the code went in between).
        code: proposal.discount?.code ?? undefined,
        pointsToUse: proposal.points?.used || undefined,
        addOns: proposal.addOns?.length
          ? proposal.addOns.map((a) => ({
              addOnId: a.id,
              quantity: a.quantity,
            }))
          : undefined,
        expectedTotal: proposal.total,
      });
    } catch (err) {
      await this.prisma.$executeRaw`
        UPDATE message SET metadata = metadata #- '{proposal,claimedAt}'
        WHERE message_id = ${message.messageId}::uuid`;
      throw err;
    }

    await this.prisma.$transaction([
      this.prisma.message.update({
        where: { messageId: message.messageId },
        data: {
          metadata: {
            ...(message.metadata as object),
            proposal: { ...proposal, bookingId: booking.id },
          },
        },
      }),
      this.prisma.conversation.update({
        where: { conversationId },
        data: { bookingId: booking.id, hotelId: proposal.hotelId },
      }),
      this.prisma.message.create({
        data: {
          conversationId,
          role: 'SYSTEM',
          content: `Đã giữ phòng ${proposal.roomTypeName} tại ${proposal.hotelName}, mã đặt phòng ${booking.code}. Quét mã QR bên dưới hoặc trả bằng ví trong 15 phút để hoàn tất.`,
        },
      }),
    ]);
    return booking;
  }

  /**
   * The customer pressed "Xác nhận huỷ" on a cancellation proposal: cancels through the same service as
   * POST /bookings/:id/cancel, so the policy, the refund and the hotel's approval are exactly the website's.
   *
   * Claimed first like a booking proposal, so a double click cancels once. The outcome is stored on the proposal and
   * said in a system note: cancelled at once (nothing to refund), or a refund request waiting for the hotel, after
   * which the money reaches the customer wallet.
   */
  async confirmCancellation(
    user: AuthUser,
    conversationId: string,
    proposalId: string,
  ): Promise<Booking> {
    await this.own(user.accountId, conversationId);
    const message = await this.prisma.message.findFirst({
      where: {
        conversationId,
        metadata: { path: ['cancellation', 'id'], equals: proposalId },
      },
      select: { messageId: true, metadata: true },
    });
    if (!message) {
      throw new NotFoundException({
        code: ErrorCode.BOOKING_PROPOSAL_NOT_FOUND,
        message: 'Cancellation proposal not found',
      });
    }
    const proposal = (message.metadata as MessageMeta).cancellation!;
    const invalid = (why: string) =>
      new ConflictException({
        code: ErrorCode.BOOKING_PROPOSAL_INVALID,
        message: why,
      });
    if (proposal.outcome) throw invalid('This booking is already cancelled');
    if (new Date(proposal.expiresAt) < new Date()) {
      throw invalid('This proposal has expired; ask the assistant again');
    }

    const claimed = await this.prisma.$executeRaw`
      UPDATE message
      SET metadata = jsonb_set(metadata, '{cancellation,claimedAt}', to_jsonb(now()::text))
      WHERE message_id = ${message.messageId}::uuid AND NOT (metadata->'cancellation' ? 'claimedAt')`;
    if (!claimed) throw invalid('This cancellation is being processed already');

    let booking: Booking;
    try {
      booking = await this.cancellations.cancel(user, proposal.bookingId, {
        reason: proposal.reason,
      });
    } catch (err) {
      await this.prisma.$executeRaw`
        UPDATE message SET metadata = metadata #- '{cancellation,claimedAt}'
        WHERE message_id = ${message.messageId}::uuid`;
      throw err;
    }

    const outcome: CancellationProposal['outcome'] =
      booking.paymentStatus === 'REFUND_PENDING'
        ? 'REFUND_PENDING'
        : 'CANCELLED';
    const money = (n: number) => `${n.toLocaleString('vi-VN')} đ`;
    const note =
      outcome === 'REFUND_PENDING'
        ? `Đã gửi yêu cầu huỷ đơn ${proposal.bookingCode}. Khách sạn sẽ duyệt hoàn ${money(proposal.refund)}; tiền về ví StayReco ngay khi được duyệt. Phòng vẫn giữ cho bạn tới lúc đó.`
        : `Đã huỷ đơn ${proposal.bookingCode}.${proposal.refund > 0 ? ` ${money(proposal.refund)} đã về ví StayReco.` : ' Đơn này không được hoàn tiền theo chính sách huỷ.'}`;
    await this.prisma.$transaction([
      this.prisma.message.update({
        where: { messageId: message.messageId },
        data: {
          metadata: {
            ...(message.metadata as object),
            cancellation: { ...proposal, claimedAt: undefined, outcome },
          },
        },
      }),
      this.prisma.message.create({
        data: { conversationId, role: 'SYSTEM', content: note },
      }),
    ]);
    return booking;
  }

  // ── The turn ──────────────────────────────────────────────

  private async turn(
    user: AuthUser,
    conversationId: string | null,
    input: SendAssistantMessageInput,
  ): Promise<AssistantReply> {
    const customer = await this.customer(user.accountId);
    const priorRecommendations = new Map<string, string>();
    const { contents: history, lookup } = conversationId
      ? await this.history(conversationId, priorRecommendations)
      : { contents: [], lookup: [] };
    const contents: Content[] = merge([
      ...history,
      { role: 'user', parts: [{ text: input.content }] },
    ]);
    const state: TurnState = {
      hotels: new Map(),
      priorRecommendations,
      proposal: null,
      cancellation: null,
      roomTypes: new Map(),
    };
    const calls: Prisma.AiFunctionCallCreateManyInput[] = [];
    const context = {
      customerId: customer.id,
      purpose: 'assistant',
    } as const;
    const system = systemPrompt({
      today: todayInVietnam(),
      customerName: customer.fullName,
      hasPhone: customer.phone !== null,
      preferences: customer.preferences,
      lookup,
    });

    let text = '';
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const response = await this.ai.chat(context, {
        system,
        contents,
        tools: round < MAX_TOOL_ROUNDS ? TOOL_DECLARATIONS : [],
      });
      const requested = response.functionCalls ?? [];
      if (!requested.length) {
        // The last layer: whatever the model wrote, no internal note with an id is stored or shown.
        text = stripInternalNotes(response.text ?? '');
        break;
      }
      const modelTurn = response.candidates?.[0]?.content;
      if (modelTurn) contents.push(modelTurn);
      const results: Part[] = [];
      for (const call of requested) {
        const started = Date.now();
        const args = call.args ?? {};
        const result = await this.tools.run(
          call.name ?? '',
          args,
          customer,
          state,
        );
        calls.push({
          messageId: '',
          functionName: call.name ?? '',
          arguments: args as Prisma.InputJsonValue,
          result: result as Prisma.InputJsonValue,
          durationMs: Date.now() - started,
        });
        results.push({
          functionResponse: { id: call.id, name: call.name, response: result },
        });
      }
      contents.push({ role: 'user', parts: results });
    }
    if (!text) {
      text = state.proposal
        ? 'Mình đã chuẩn bị đề xuất đặt phòng bên dưới, bạn kiểm tra và bấm "Xác nhận đặt phòng" nhé.'
        : state.cancellation
          ? 'Mình đã chuẩn bị đề xuất huỷ bên dưới, bạn kiểm tra số tiền hoàn rồi bấm "Xác nhận huỷ" nếu đồng ý nhé.'
          : 'Xin lỗi, mình chưa tìm được câu trả lời. Bạn có thể nói rõ hơn nơi đến, ngày và số khách không?';
    }

    const meta: MessageMeta = {
      hotels: [...state.hotels.values()].filter((h) =>
        mentions(text, h.name, state),
      ),
      ...(state.proposal && { proposal: state.proposal }),
      ...(state.cancellation && { cancellation: state.cancellation }),
      ...(state.roomTypes.size && {
        roomTypes: [...state.roomTypes].map(([id, rt]) => ({ id, ...rt })),
      }),
    };

    const { conversation, question, reply } = await this.prisma.$transaction(
      async (tx) => {
        const conversation = conversationId
          ? await tx.conversation.update({
              where: { conversationId },
              data: { updatedAt: new Date() },
              select: { conversationId: true },
            })
          : await tx.conversation.create({
              data: { customerId: customer.id, channel: input.channel },
              select: { conversationId: true },
            });
        const question = await tx.message.create({
          data: {
            conversationId: conversation.conversationId,
            role: 'USER',
            content: input.content,
          },
        });
        const reply = await tx.message.create({
          data: {
            conversationId: conversation.conversationId,
            role: 'ASSISTANT',
            content: text,
            metadata: meta as Prisma.InputJsonValue,
            // A moment after the question, so ordering by time never puts the answer first.
            createdAt: new Date(question.createdAt.getTime() + 1),
          },
        });
        if (calls.length) {
          await tx.aiFunctionCall.createMany({
            data: calls.map((c) => ({ ...c, messageId: reply.messageId })),
          });
        }
        return { conversation, question, reply };
      },
    );
    this.logger.debug(
      `assistant turn: ${calls.map((c) => c.functionName).join(', ') || 'no tools'}`,
    );
    return {
      conversationId: conversation.conversationId,
      message: toMessage(question),
      reply: toMessage(reply),
    };
  }

  /**
   * The stored messages as model turns, and the ids of what was shown in them as separate lookup lines.
   *
   * The model needs the ids to act on "the second one" without searching again, but they go in the system
   * instruction (`lookup`), never in its own past turns: written into a model turn, they taught the model to write
   * such notes into its answers, ids and all (FE request "Trợ lý AI lộ ghi chú nội bộ có ID").
   */
  private async history(
    conversationId: string,
    priorRecommendations: Map<string, string>,
  ): Promise<{ contents: Content[]; lookup: string[] }> {
    const rows = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: HISTORY,
    });
    const lookup: string[] = [];
    const contents: Content[] = rows.reverse().map((m) => {
      if (m.role === 'USER')
        return { role: 'user', parts: [{ text: m.content }] };
      const meta = (m.metadata ?? {}) as MessageMeta;
      for (const hotel of meta.hotels ?? []) {
        if (hotel.recommendationId)
          priorRecommendations.set(hotel.id, hotel.recommendationId);
        lookup.push(`khách sạn ${hotel.name}: hotelId=${hotel.id}`);
      }
      for (const r of meta.roomTypes ?? []) {
        lookup.push(
          `loại phòng ${r.name} tại ${r.hotelName}: roomTypeId=${r.id}`,
        );
      }
      if (meta.proposal) {
        const p = meta.proposal;
        lookup.push(
          `đề xuất đặt ${p.roomTypeName} tại ${p.hotelName} (roomTypeId=${p.roomTypeId}), ${p.checkIn} → ${p.checkOut}, ${p.guests} khách, ${p.total} VND: ${p.bookingId ? 'khách ĐÃ XÁC NHẬN, đang chờ thanh toán hoặc đã thanh toán' : 'chưa xác nhận'}`,
        );
      }
      if (meta.cancellation) {
        const c = meta.cancellation;
        lookup.push(
          `đề xuất huỷ đơn ${c.bookingCode}, hoàn ${c.refund} VND: ${c.outcome ? `khách ĐÃ XÁC NHẬN (${c.outcome})` : 'chưa xác nhận'}`,
        );
      }
      // A system note (a booking made, a cancellation done) is the platform speaking: said as the model's own turn,
      // in words, with no ids, so there is nothing for the model to imitate.
      return {
        role: 'model',
        parts: [{ text: stripInternalNotes(m.content) }],
      };
    });
    // The newest first: when the same hotel comes back, the latest line is the one to read.
    return { contents, lookup: [...new Set(lookup.reverse())].slice(0, 40) };
  }

  private async own(customerId: string, conversationId: string) {
    if (!isUuid(conversationId)) throw conversationNotFound();
    const c = await this.prisma.conversation.findFirst({
      where: { conversationId, customerId },
      select: {
        conversationId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!c) throw conversationNotFound();
    return c;
  }

  private async customer(
    customerId: string,
  ): Promise<ToolCustomer & { preferences: Record<string, string> }> {
    const account = await this.prisma.userAccount.findUniqueOrThrow({
      where: { userAccountId: customerId },
      select: {
        fullName: true,
        phone: true,
        customer: {
          select: {
            customerPreferences: {
              select: { preferenceKey: true, preferenceValue: true },
            },
          },
        },
      },
    });
    return {
      id: customerId,
      fullName: account.fullName,
      phone: account.phone,
      preferences: Object.fromEntries(
        (account.customer?.customerPreferences ?? []).map((p) => [
          p.preferenceKey,
          p.preferenceValue,
        ]),
      ),
    };
  }
}

function toMessage(m: {
  messageId: string;
  role: AssistantMessage['role'];
  content: string;
  metadata: Prisma.JsonValue;
  createdAt: Date;
}): AssistantMessage {
  const meta = (m.metadata ?? {}) as MessageMeta;
  let proposal: BookingProposal | null = null;
  if (meta.proposal) {
    // claimedAt is bookkeeping for the double-click guard, not part of the proposal.
    proposal = { ...meta.proposal };
    delete (proposal as MessageMeta['proposal'])!.claimedAt;
  }
  let cancellation: CancellationProposal | null = null;
  if (meta.cancellation) {
    cancellation = { ...meta.cancellation };
    delete (cancellation as MessageMeta['cancellation'])!.claimedAt;
  }
  return {
    id: m.messageId,
    role: m.role,
    // Answers stored before the notes were kept out of model turns may carry one: never shown.
    content: m.role === 'ASSISTANT' ? stripInternalNotes(m.content) : m.content,
    hotels: meta.hotels ?? [],
    proposal,
    cancellation,
    createdAt: m.createdAt.toISOString(),
  };
}

/**
 * The cards to show with a reply: the hotels the reply names. When it names none (a short "here are a few options"),
 * all the hotels the tools found this turn, so the customer still sees what the model saw.
 */
function mentions(text: string, name: string, state: TurnState) {
  const named = [...state.hotels.values()].some((h) => text.includes(h.name));
  return named ? text.includes(name) : true;
}

/** Gemini wants turns to alternate; history can hold two model turns in a row (a reply, then a booking note). */
function merge(contents: Content[]): Content[] {
  const out: Content[] = [];
  for (const c of contents) {
    const last = out[out.length - 1];
    if (last && last.role === c.role) {
      last.parts = [...(last.parts ?? []), ...(c.parts ?? [])];
    } else {
      out.push({ role: c.role, parts: [...(c.parts ?? [])] });
    }
  }
  // A conversation must open with the customer.
  while (out.length && out[0].role !== 'user') out.shift();
  return out;
}
