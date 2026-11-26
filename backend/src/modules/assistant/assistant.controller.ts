import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  assistantMessageResponseSchema,
  assistantReplyResponseSchema,
  bookingResponseSchema,
  conversationResponseSchema,
  conversationSummaryResponseSchema,
  z,
} from '@stayreco/shared';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import {
  ApiData,
  ApiErrors,
  ApiStream,
} from '../../common/swagger/api-docs.decorators';
import { UserRole } from '../../generated/prisma/client';
import type { Response } from 'express';
import { streamTurn } from './assistant-stream';
import { AssistantService } from './assistant.service';
import {
  AssistantFeedbackDto,
  ConfirmBookingProposalDto,
  SendAssistantMessageDto,
} from './dto/assistant.dto';

const STREAM_NOTE =
  ' Answers as server-sent events (`text/event-stream`): `status` {text} while a tool runs ("Đang tìm phòng còn trống…"), `delta` {text} the next piece of the answer, `reset` {} drop the text shown so far, then `done` with the same AssistantReply as the plain route, or `error` {status, code, message}. Errors found before the first event (not your conversation, budget spent, model off) come back as a normal JSON error. The text pieces may carry the quick-reply line `>> …`, which `done` returns as `reply.suggestions`; hide it while streaming.';

const MODEL_ERRORS = [
  ErrorCode.AI_UNAVAILABLE,
  ErrorCode.AI_BUDGET_EXCEEDED,
  ErrorCode.AI_REFUSED,
] as const;

/** The customer assistant: chat that searches, recommends and proposes bookings the customer confirms. */
@ApiTags('assistant')
@Roles(UserRole.CUSTOMER)
@Controller()
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @ApiOperation({
    summary: 'My assistant conversations',
    description: 'Newest first, at most 50.',
  })
  @ApiData(z.array(conversationSummaryResponseSchema))
  @Get('me/conversations')
  list(@CurrentUser() user: AuthUser) {
    return this.assistant.listMine(user.accountId);
  }

  @ApiOperation({
    summary: 'Start a conversation with the assistant',
    description:
      'Sends the first message and answers with the reply (a few seconds: the model may search and price rooms first). `reply.hotels` are cards to show under the text; `reply.proposal`, when set, is a priced booking to show with a "Xác nhận đặt phòng" button. Nothing is stored when the model fails, so the client can simply resend. Costs come out of the customer\'s monthly assistant budget.',
  })
  @ApiData(assistantReplyResponseSchema, HttpStatus.CREATED)
  @ApiErrors(...MODEL_ERRORS)
  @Post('me/conversations')
  start(@CurrentUser() user: AuthUser, @Body() dto: SendAssistantMessageDto) {
    return this.assistant.start(user, dto);
  }

  @ApiOperation({
    summary: 'A conversation with its messages',
    description:
      'Messages oldest first, with the cards and proposals they carried.',
  })
  @ApiData(conversationResponseSchema)
  @ApiErrors(ErrorCode.CONVERSATION_NOT_FOUND)
  @Get('conversations/:id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.assistant.get(user.accountId, id);
  }

  @ApiOperation({
    summary: 'Send the assistant a message',
    description: 'Same answer as starting a conversation, continuing this one.',
  })
  @ApiData(assistantReplyResponseSchema, HttpStatus.CREATED)
  @ApiErrors(ErrorCode.CONVERSATION_NOT_FOUND, ...MODEL_ERRORS)
  @Post('conversations/:id/messages')
  send(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SendAssistantMessageDto,
  ) {
    return this.assistant.send(user, id, dto);
  }

  @ApiOperation({
    summary: 'Start a conversation, streamed',
    description: 'As `POST /me/conversations`.' + STREAM_NOTE,
  })
  @ApiStream(
    'The turn as server-sent events: status, delta, reset, then done or error.',
  )
  @ApiErrors(...MODEL_ERRORS)
  @Post('me/conversations/stream')
  startStream(
    @CurrentUser() user: AuthUser,
    @Body() dto: SendAssistantMessageDto,
    @Res() res: Response,
  ) {
    return streamTurn(res, (events) => this.assistant.start(user, dto, events));
  }

  @ApiOperation({
    summary: 'Send the assistant a message, streamed',
    description: 'As `POST /conversations/:id/messages`.' + STREAM_NOTE,
  })
  @ApiStream(
    'The turn as server-sent events: status, delta, reset, then done or error.',
  )
  @ApiErrors(ErrorCode.CONVERSATION_NOT_FOUND, ...MODEL_ERRORS)
  @Post('conversations/:id/messages/stream')
  sendStream(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SendAssistantMessageDto,
    @Res() res: Response,
  ) {
    return streamTurn(res, (events) =>
      this.assistant.send(user, id, dto, events),
    );
  }

  @ApiOperation({
    summary: 'Rate an answer of the assistant',
    description:
      "👍 (`UP`) or 👎 (`DOWN`) on one of the assistant's answers; `null` takes it back. Answers with the message.",
  })
  @ApiData(assistantMessageResponseSchema)
  @ApiErrors(ErrorCode.CONVERSATION_NOT_FOUND, ErrorCode.MESSAGE_NOT_FOUND)
  @Put('conversations/:id/messages/:messageId/feedback')
  feedback(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @Body() dto: AssistantFeedbackDto,
  ) {
    return this.assistant.feedback(user.accountId, id, messageId, dto.value);
  }

  @ApiOperation({
    summary: 'Book a proposal the assistant made',
    description:
      'The customer\'s click on "Xác nhận đặt phòng". Books exactly as `POST /bookings` does, with the proposal\'s room, dates and total as `expectedTotal`: the answer is the PENDING booking, to pay as usual. If the price moved, answers BOOKING_PRICE_CHANGED; ask the assistant for a new proposal. A proposal books once and expires after 30 minutes.',
  })
  @ApiData(bookingResponseSchema, HttpStatus.CREATED)
  @ApiErrors(
    ErrorCode.CONVERSATION_NOT_FOUND,
    ErrorCode.BOOKING_PROPOSAL_NOT_FOUND,
    ErrorCode.BOOKING_PROPOSAL_INVALID,
    ErrorCode.ROOM_TYPE_NOT_FOUND,
    ErrorCode.ROOM_SOLD_OUT,
    ErrorCode.BOOKING_PRICE_CHANGED,
  )
  @Post('conversations/:id/confirm-booking')
  confirmBooking(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ConfirmBookingProposalDto,
  ) {
    return this.assistant.confirmBooking(user, id, dto.proposalId);
  }
  @ApiOperation({
    summary: 'Cancel a booking the assistant proposed to cancel',
    description:
      'The customer\x27s click on "Xác nhận huỷ". Cancels exactly as `POST /bookings/:id/cancel` does, with the reason the customer gave: nothing to refund cancels at once; a refund becomes a request the hotel approves, after which the money reaches the customer wallet (the booking stays CONFIRMED until then). The proposal records the outcome (`CANCELLED` or `REFUND_PENDING`) and a system note says it. A proposal cancels once and expires after 30 minutes.',
  })
  @ApiData(bookingResponseSchema, HttpStatus.CREATED)
  @ApiErrors(
    ErrorCode.CONVERSATION_NOT_FOUND,
    ErrorCode.BOOKING_PROPOSAL_NOT_FOUND,
    ErrorCode.BOOKING_PROPOSAL_INVALID,
    ErrorCode.BOOKING_STATUS_CONFLICT,
    ErrorCode.CANCELLATION_NOT_ALLOWED,
  )
  @Post('conversations/:id/confirm-cancellation')
  confirmCancellation(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ConfirmBookingProposalDto,
  ) {
    return this.assistant.confirmCancellation(user, id, dto.proposalId);
  }
}
