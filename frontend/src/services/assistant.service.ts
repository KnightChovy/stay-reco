import { api } from "@/lib/axios";
import type {
  AssistantReply,
  Booking,
  Conversation,
  ConversationSummary,
} from "@stayreco/shared";
import type { APIResponse } from "@/types/response.type";

/**
 * The customer's booking assistant (docs/api/assistant.md). A reply can take tens of seconds while the model searches
 * and prices rooms, hence the long timeout on the two sending calls.
 */
const REPLY_TIMEOUT_MS = 90_000;

export async function getConversations() {
  const { data } = await api.get<APIResponse<ConversationSummary[]>>("/me/conversations");
  return data.data;
}

export async function getConversation(conversationId: string) {
  const { data } = await api.get<APIResponse<Conversation>>(`/conversations/${conversationId}`);
  return data.data;
}

/** Starts a conversation with its first message. */
export async function startConversation(content: string) {
  const { data } = await api.post<APIResponse<AssistantReply>>(
    "/me/conversations",
    { content, channel: "WEB" },
    { timeout: REPLY_TIMEOUT_MS },
  );
  return data.data;
}

export async function sendMessage(conversationId: string, content: string) {
  const { data } = await api.post<APIResponse<AssistantReply>>(
    `/conversations/${conversationId}/messages`,
    { content },
    { timeout: REPLY_TIMEOUT_MS },
  );
  return data.data;
}

/** The customer's own click on "Xác nhận đặt phòng": books exactly like `POST /bookings` (PENDING, then pay). */
export async function confirmProposal(conversationId: string, proposalId: string) {
  const { data } = await api.post<APIResponse<Booking>>(`/conversations/${conversationId}/confirm-booking`, {
    proposalId,
  });
  return data.data;
}
