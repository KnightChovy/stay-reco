import type { APIResponse, AssistantReply, Booking, Conversation, ConversationSummary } from "@stayreco/shared";
import { isAxiosError } from "axios";
import { apiService } from "./ApiService";

/**
 * Trợ lý đặt phòng của khách (docs/api/assistant.md), cùng endpoint với frontend/src/services/assistant.service.ts.
 * Một câu trả lời có thể mất vài chục giây (model tìm phòng, tính giá) nên hai lệnh gửi có timeout 90s.
 */
const REPLY_TIMEOUT_MS = 90_000;

export const getConversations = async () => {
  const { data } = await apiService.get<APIResponse<ConversationSummary[]>>("/me/conversations");
  return data.data;
};

export const getConversation = async (conversationId: string) => {
  const { data } = await apiService.get<APIResponse<Conversation>>(`/conversations/${conversationId}`);
  return data.data;
};

/** Mở cuộc trò chuyện mới bằng tin nhắn đầu tiên. */
export const startConversation = async (content: string) => {
  const { data } = await apiService.post<APIResponse<AssistantReply>>(
    "/me/conversations",
    { content, channel: "MOBILE" },
    { timeout: REPLY_TIMEOUT_MS },
  );
  return data.data;
};

export const sendMessage = async (conversationId: string, content: string) => {
  const { data } = await apiService.post<APIResponse<AssistantReply>>(
    `/conversations/${conversationId}/messages`,
    { content },
    { timeout: REPLY_TIMEOUT_MS },
  );
  return data.data;
};

/** Khách tự bấm "Xác nhận đặt phòng": tạo đơn PENDING như `POST /bookings`, sau đó thanh toán. */
export const confirmProposal = async (conversationId: string, proposalId: string) => {
  const { data } = await apiService.post<APIResponse<Booking>>(`/conversations/${conversationId}/confirm-booking`, { proposalId });
  return data.data;
};

const errorCode = (error: unknown) =>
  isAxiosError(error) ? (error.response?.data as { code?: string } | undefined)?.code : undefined;

/** Lỗi của trợ lý theo lời khách cần đọc; cùng nội dung với frontend/src/features/assistant/lib/chat-errors.ts. */
export function chatErrorMessage(error: unknown): string {
  switch (errorCode(error)) {
    case "AI_UNAVAILABLE":
      return "Trợ lý AI đang tạm nghỉ. Bạn vẫn có thể tìm và đặt phòng như bình thường.";
    case "AI_BUDGET_EXCEEDED":
      return "Bạn đã dùng hết lượt trò chuyện với trợ lý trong tháng này. Lượt mới có vào đầu tháng sau.";
    case "AI_REFUSED":
      return "Trợ lý không trả lời được câu này. Bạn thử hỏi theo cách khác nhé.";
    case "CONVERSATION_NOT_FOUND":
      return "Không tìm thấy cuộc trò chuyện này. Hãy bắt đầu cuộc trò chuyện mới.";
    case "BOOKING_PROPOSAL_INVALID":
      return "Đề xuất này đã được đặt hoặc đã hết hạn (30 phút). Nhắn trợ lý báo giá lại nhé.";
    case "BOOKING_PROPOSAL_NOT_FOUND":
      return "Không tìm thấy đề xuất đặt phòng này.";
    case "BOOKING_PRICE_CHANGED":
      return "Giá phòng vừa thay đổi. Nhắn trợ lý báo giá lại để xem giá mới.";
    case "ROOM_SOLD_OUT":
      return "Hạng phòng này vừa hết. Nhắn trợ lý tìm phòng khác nhé.";
    default:
      if (isAxiosError(error) && error.code === "ECONNABORTED") return "Trợ lý trả lời quá lâu. Tin nhắn chưa được lưu, bạn gửi lại nhé.";
      return (
        (isAxiosError(error) && (error.response?.data as { message?: string } | undefined)?.message) ||
        "Không gửi được tin nhắn. Tin nhắn chưa được lưu, bạn gửi lại nhé."
      );
  }
}

export const isConversationNotFound = (error: unknown) => errorCode(error) === "CONVERSATION_NOT_FOUND";
