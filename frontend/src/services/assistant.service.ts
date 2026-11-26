import { api } from "@/lib/axios";
import type {
  AssistantMessage,
  AssistantReply,
  Booking,
  Conversation,
  ConversationSummary,
} from "@stayreco/shared";
import type { APIResponse } from "@/types/response.type";

/**
 * The customer's booking assistant (docs/api/assistant.md). A reply can take tens of seconds while the model searches
 * and prices rooms, so it is streamed (`streamMessage`): the customer sees what it is doing and the text as it comes.
 */

export async function getConversations() {
  const { data } = await api.get<APIResponse<ConversationSummary[]>>("/me/conversations");
  return data.data;
}

export async function getConversation(conversationId: string) {
  const { data } = await api.get<APIResponse<Conversation>>(`/conversations/${conversationId}`);
  return data.data;
}

/** What a streamed reply reports while it is written. */
export type StreamHandlers = {
  /** What the assistant is doing ("Đang tìm phòng còn trống…"). */
  onStatus: (text: string) => void;
  /** The next piece of the answer. */
  onDelta: (text: string) => void;
  /** Drop the text shown so far: the model went on to use a tool after all. */
  onReset: () => void;
};

/** Shaped like an axios error, so `getApiErrorCode` and `chatErrorMessage` read it the same way. */
function streamError(status: number, data: unknown) {
  return Object.assign(new Error("Assistant stream failed"), { response: { status, data } });
}

function accessToken() {
  return (window as unknown as { __STAYRECO_ACCESS_TOKEN__?: string }).__STAYRECO_ACCESS_TOKEN__;
}

function openStream(path: string, content: string, withChannel: boolean) {
  const token = accessToken();
  return fetch(`${api.defaults.baseURL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      "X-Client-Type": "web",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(withChannel ? { content, channel: "WEB" } : { content }),
  });
}

/**
 * Sends one message and reads the reply as it is written (`POST …/stream`, server-sent events): the status while a
 * tool runs, the text piece by piece, then the stored reply, which is what the promise resolves to. A failure before
 * the stream opens comes back as plain JSON; an expired sign-in is refreshed once through the axios client (which
 * renews the token on a 401) and the message sent again.
 */
export async function streamMessage(
  conversationId: string | null,
  content: string,
  handlers: StreamHandlers,
): Promise<AssistantReply> {
  const path = conversationId ? `/conversations/${conversationId}/messages/stream` : "/me/conversations/stream";
  let res = await openStream(path, content, !conversationId);
  if (res.status === 401) {
    await api.get("/auth/me");
    res = await openStream(path, content, !conversationId);
  }
  if (!res.ok || !res.body) {
    const data: unknown = await res.json().catch(() => ({}));
    throw streamError(res.status, data);
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let end: number;
    while ((end = buffer.indexOf("\n\n")) !== -1) {
      const block = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      const event = /^event: (.*)$/m.exec(block)?.[1];
      const raw = /^data: (.*)$/m.exec(block)?.[1];
      if (!event || raw === undefined) continue;
      const data = JSON.parse(raw) as Record<string, unknown>;
      if (event === "status") handlers.onStatus(String(data.text ?? ""));
      else if (event === "delta") handlers.onDelta(String(data.text ?? ""));
      else if (event === "reset") handlers.onReset();
      else if (event === "done") return data as unknown as AssistantReply;
      else if (event === "error") throw streamError(Number(data.status) || 500, data);
    }
  }
  throw streamError(0, { message: "Kết nối bị ngắt trước khi trợ lý trả lời xong." });
}

/** 👍 or 👎 on an answer; null takes it back. */
export async function rateMessage(conversationId: string, messageId: string, value: "UP" | "DOWN" | null) {
  const { data } = await api.put<APIResponse<AssistantMessage>>(
    `/conversations/${conversationId}/messages/${messageId}/feedback`,
    { value },
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

/**
 * The customer's own click on "Xác nhận huỷ": cancels exactly like `POST /bookings/:id/cancel`. Nothing to refund
 * cancels at once; a refund becomes a request the hotel approves, then the money reaches the wallet.
 */
export async function confirmCancellation(conversationId: string, proposalId: string) {
  const { data } = await api.post<APIResponse<Booking>>(`/conversations/${conversationId}/confirm-cancellation`, {
    proposalId,
  });
  return data.data;
}
