import {
  assistantFeedbackSchema,
  confirmBookingProposalSchema,
  sendAssistantMessageSchema,
} from '@stayreco/shared';
import { zodDto } from '../../../common/pipes/validation';

export class SendAssistantMessageDto extends zodDto(
  sendAssistantMessageSchema,
) {}
export class ConfirmBookingProposalDto extends zodDto(
  confirmBookingProposalSchema,
) {}
export class AssistantFeedbackDto extends zodDto(assistantFeedbackSchema) {}
