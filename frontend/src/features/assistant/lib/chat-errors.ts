import { getApiErrorCode, getApiErrorMessage } from "@/lib/api-error";

/**
 * The assistant's errors in the words a customer needs; the shared messages for these codes are written for the
 * marketing writer (a hotel's budget), not for a guest chatting.
 */
export function chatErrorMessage(error: unknown): string {
  switch (getApiErrorCode(error)) {
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
      if (error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "ECONNABORTED") {
        return "Trợ lý trả lời quá lâu. Tin nhắn chưa được lưu, bạn gửi lại nhé.";
      }
      return getApiErrorMessage(error, "Không gửi được tin nhắn. Tin nhắn chưa được lưu, bạn gửi lại nhé.");
  }
}

/** The assistant cannot be used at all (no key on the server): the chat is hidden or replaced by a notice. */
export function isAssistantOff(error: unknown) {
  return getApiErrorCode(error) === "AI_UNAVAILABLE";
}
