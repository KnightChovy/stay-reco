import { Body, Controller, Get, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
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
import { ApiData, ApiErrors } from '../../common/swagger/api-docs.decorators';
import { UserRole } from '../../generated/prisma/client';
import { AssistantService } from './assistant.service';
import {
  ConfirmBookingProposalDto,
  SendAssistantMessageDto,
} from './dto/assistant.dto';

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
