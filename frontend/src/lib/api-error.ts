import type { AxiosError } from "axios";
import type { z } from "@stayreco/shared";
import type { APIError } from "@/types/response.type";

/** Field path ("legal.taxCode", "documents.0.fileId") → message shown under the input. */
export type FieldErrors = Record<string, string>;

/** Vietnamese messages for the error codes the partner screens can receive (docs/api-guide.md §4.3). */
const errorMessages: Record<string, string> = {
  VALIDATION_ERROR: "Dữ liệu chưa hợp lệ. Vui lòng kiểm tra các trường được đánh dấu.",
  BAD_REQUEST: "Yêu cầu không hợp lệ.",
  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
  NOT_FOUND: "Không tìm thấy dữ liệu.",
  CONFLICT: "Dữ liệu đã thay đổi. Vui lòng tải lại và thử lại.",
  TOO_MANY_REQUESTS: "Bạn thao tác quá nhanh. Vui lòng thử lại sau.",
  INTERNAL_ERROR: "Máy chủ gặp sự cố. Vui lòng thử lại sau.",
  SERVICE_UNAVAILABLE: "Dịch vụ tạm thời gián đoạn, vui lòng thử lại.",
  AUTH_EMAIL_TAKEN: "Email này đã được sử dụng.",
  AUTH_WRONG_PASSWORD: "Mật khẩu hiện tại không đúng.",
  AUTH_SESSION_NOT_FOUND: "Phiên đăng nhập không còn tồn tại. Danh sách đã được tải lại.",
  AUTH_TOKEN_INVALID: "Liên kết không hợp lệ hoặc đã hết hạn. Vui lòng liên hệ người đã mời bạn để gửi lại.",
  AUTH_INVITATION_ACCEPTED: "Lời mời này đã được chấp nhận. Vui lòng đăng nhập.",
  HOTEL_NOT_FOUND: "Không tìm thấy khách sạn.",
  PARTNER_SUSPENDED: "Tài khoản đối tác đang bị tạm ngưng: bạn chỉ có thể xem dữ liệu, không thể tạo hoặc chỉnh sửa.",
  HOTEL_STATUS_CONFLICT: "Trạng thái hiện tại của khách sạn không cho phép thao tác này.",
  ROOM_TYPE_NOT_FOUND: "Không tìm thấy loại phòng. Danh sách đã được tải lại.",
  ROOM_NOT_FOUND: "Không tìm thấy phòng. Danh sách đã được tải lại.",
  ROOM_NUMBER_TAKEN: "Số phòng này đã tồn tại trong khách sạn.",
  ROOM_LIMIT_REACHED: "Đã đạt giới hạn số phòng. Hãy kiểm tra cấu hình phòng của khách sạn.",
  ROOM_TYPE_IN_USE: "Loại phòng vẫn còn phòng hoặc booking. Hãy xoá các phòng trước.",
  ROOM_NOT_LOCKABLE: "Không thể đổi trạng thái: phòng đang có khách hoặc không ở trạng thái khoá.",
  STAFF_NOT_FOUND: "Không tìm thấy nhân viên. Danh sách đã được tải lại.",
  STAFF_STATUS_CONFLICT: "Trạng thái nhân viên đã thay đổi. Danh sách đã được tải lại.",
  VERIFICATION_PENDING: "Khách sạn đã có hồ sơ đang chờ thẩm định.",
  VERIFICATION_DOCUMENTS_MISSING: "Còn thiếu tài liệu bắt buộc (giấy phép kinh doanh, PCCC, an ninh trật tự).",
  VERIFICATION_NOT_FOUND: "Không tìm thấy hồ sơ hoặc tài liệu.",
  VERIFICATION_ALREADY_DECIDED: "Hồ sơ đã được một quản lý khác xử lý. Hồ sơ đã được tải lại.",
  UPLOAD_INVALID_FILE: "Tệp không hợp lệ: sai định dạng, quá 10 MB hoặc bị hỏng.",
  UPLOAD_UNAVAILABLE: "Tải tệp tạm thời không khả dụng. Vui lòng thử lại sau.",
  IMAGE_NOT_FOUND: "Không tìm thấy ảnh. Danh sách đã được tải lại.",
  IMAGE_LIMIT_REACHED: "Đã đạt tối đa 30 ảnh. Hãy xoá bớt ảnh trước khi thêm.",
  PRICING_RULE_NOT_FOUND: "Không tìm thấy luật giá. Danh sách đã được tải lại.",
  AVAILABILITY_BELOW_BOOKED: "Một số ngày không còn đủ phòng trống để mở bán số lượng này.",
  BOOKING_NOT_FOUND: "Không tìm thấy booking. Danh sách đã được tải lại.",
  BOOKING_STATUS_CONFLICT: "Trạng thái booking đã thay đổi. Danh sách đã được tải lại.",
  REFUND_STATUS_CONFLICT: "Yêu cầu hoàn tiền đã được xử lý. Danh sách đã được tải lại.",
  CHECK_IN_NOT_OPEN: "Chưa đến thời gian check-in của đơn này (từ ngày nhận phòng đến trước ngày trả phòng).",
  CHECK_OUT_NOT_ALLOWED: "Đơn này chưa ở trạng thái có thể check-out.",
  REFUND_DECISION_PENDING: "Đơn đang chờ xử lý yêu cầu hoàn tiền. Hãy xử lý hoàn tiền trước.",
  ROOM_NOT_ASSIGNABLE: "Phòng đã chọn không còn trống hoặc không đúng hạng phòng. Vui lòng chọn lại.",
  NO_SHOW_NOT_ALLOWED: "Chỉ có thể đánh dấu khách không đến sau ngày nhận phòng.",
  VOUCHER_INVALID: "Mã QR voucher không hợp lệ hoặc đã bị chỉnh sửa.",
  ROOM_STATUS_CONFLICT: "Trạng thái phòng đã thay đổi. Danh sách đã được tải lại.",
  CHANGE_REQUEST_STATUS_CONFLICT: "Yêu cầu đổi thông tin đã được xử lý hoặc đã đóng. Booking đã được tải lại.",
  // Phase 4: discounts, points, wallet, reviews (docs/api/promotions.md, loyalty.md, customer-wallet.md, reviews.md).
  BOOKING_PRICE_CHANGED: "Giá đã thay đổi so với lúc bạn xem. Tổng tiền đã được cập nhật, vui lòng kiểm tra lại.",
  ROOM_SOLD_OUT: "Hạng phòng đã hết trong những ngày này. Vui lòng chọn hạng phòng khác.",
  VOUCHER_NOT_FOUND: "Mã giảm giá không tồn tại hoặc không thuộc tài khoản của bạn.",
  VOUCHER_ALREADY_USED: "Mã giảm giá này đã được dùng cho một đặt phòng khác.",
  VOUCHER_EXPIRED: "Mã giảm giá đã hết hạn hoặc chương trình đã kết thúc.",
  VOUCHER_NOT_APPLICABLE: "Mã giảm giá không áp dụng cho khách sạn này hoặc đơn chưa đạt giá trị tối thiểu.",
  LOYALTY_PROGRAM_NOT_FOUND: "Chương trình điểm thưởng StayMiles hiện chưa hoạt động.",
  LOYALTY_POINTS_INSUFFICIENT: "Bạn không đủ điểm StayMiles để dùng số điểm này.",
  WALLET_INSUFFICIENT: "Số dư ví không đủ để thanh toán toàn bộ đơn. Vui lòng chuyển khoản.",
  REVIEW_NOT_FOUND: "Không tìm thấy đánh giá. Danh sách đã được tải lại.",
  REVIEW_NOT_ALLOWED: "Chuyến đi chưa hoàn tất hoặc chưa chấm đủ mọi tiêu chí nên chưa thể gửi đánh giá.",
  REVIEW_ALREADY_EXISTS: "Bạn đã đánh giá chuyến đi này rồi.",
  REVIEW_WINDOW_CLOSED: "Đã quá thời hạn đánh giá chuyến đi này.",
  RATING_CRITERION_NOT_FOUND: "Tiêu chí chấm điểm không còn tồn tại. Vui lòng tải lại trang.",
  // Phase 5: AI marketing (docs/api/marketing.md).
  AI_UNAVAILABLE: "Trợ lý viết AI chưa được cấu hình trên máy chủ (thiếu khoá Gemini) hoặc tạm thời không phản hồi.",
  AI_BUDGET_EXCEEDED: "Khách sạn đã dùng hết ngân sách AI của tháng này. Ngân sách được làm mới vào đầu tháng sau.",
  AI_REFUSED: "AI từ chối viết nội dung này. Hãy diễn đạt lại yêu cầu.",
  CONTENT_NOT_FOUND: "Không tìm thấy nội dung. Danh sách đã được tải lại.",
  CONTENT_STATUS_CONFLICT: "Trạng thái nội dung đã thay đổi nên không thể thực hiện thao tác này. Nội dung đã được tải lại.",
  CONTENT_NOT_APPROVED: "Chỉ nội dung đã được chủ khách sạn duyệt mới lên lịch đăng được.",
  SOCIAL_ACCOUNT_NOT_FOUND: "Không tìm thấy trang mạng xã hội đã kết nối.",
  SCHEDULE_NOT_FOUND: "Không tìm thấy lịch đăng. Danh sách đã được tải lại.",
  SCHEDULE_STATUS_CONFLICT: "Lịch đăng đã thay đổi trạng thái (đã đăng hoặc đã huỷ).",
  SOCIAL_PUBLISH_FAILED: "Nền tảng mạng xã hội từ chối hoặc không phản hồi.",
  SOCIAL_PLATFORM_UNSUPPORTED: "Nền tảng này chưa hỗ trợ đăng bài (TikTok, hoặc Instagram khi chưa có ảnh).",
};

/** Custom messages written in the shared zod schemas (packages/shared/src/schemas), also returned in `details`. */
const schemaMessages: Record<string, string> = {
  "phone must be a valid phone number": "Số điện thoại không hợp lệ.",
  "password must contain at least one letter and one number": "Mật khẩu phải có ít nhất một chữ cái và một chữ số.",
  "at least one field is required": "Chưa có thay đổi nào để lưu.",
  "at least one field must be given": "Chưa có thay đổi nào để lưu.",
  "dateOfBirth must be between 1900-01-01 and today": "Ngày sinh phải từ 01/01/1900 đến hôm nay.",
  "time must be HH:mm": "Giờ phải có dạng HH:mm.",
  "ids must be unique": "Danh sách có mục bị trùng.",
  "latitude and longitude must be sent together": "Nhập đủ cả vĩ độ và kinh độ.",
  "policy key must be snake_case": "Mã chỉ gồm chữ thường, số, dấu gạch dưới và bắt đầu bằng chữ.",
  "at most 30 policies": "Tối đa 30 chính sách.",
  "at most 2 decimal places": "Tối đa 2 chữ số thập phân.",
  "bed types must be unique": "Mỗi loại giường chỉ chọn một lần.",
  "permissions must be unique": "Quyền bị trùng.",
  "tax code must be 10 or 13 digits": "Mã số thuế gồm 10 số hoặc dạng 0123456789-001.",
  "ID number must be 8-12 letters or digits": "Gồm 8–12 chữ in hoa hoặc chữ số.",
  "account number must be 6-20 digits": "Số tài khoản gồm 6–20 chữ số.",
  "each document must be a different file": "Mỗi tài liệu phải là một tệp khác nhau.",
  "the new price must be greater than 0": "Giá mới phải lớn hơn 0.",
  "an adjustment of 0 changes nothing": "Mức điều chỉnh phải khác 0.",
  "percent must be between -90 and 300": "Phần trăm phải trong khoảng −90 đến 300.",
  "validFrom and validTo must be sent together": "Nhập đủ ngày bắt đầu và ngày kết thúc.",
  "validTo must not be before validFrom": "Ngày kết thúc không được trước ngày bắt đầu.",
  "a rule covers at most 366 days": "Một luật giá áp dụng tối đa 366 ngày.",
  "a SEASON rule needs validFrom and validTo": "Luật theo mùa cần ngày bắt đầu và ngày kết thúc.",
  "an EARLY_BIRD rule needs minDaysBefore": "Luật đặt sớm cần số ngày đặt trước tối thiểu.",
  "a LAST_MINUTE rule needs maxDaysBefore": "Luật phút chót cần số ngày đặt trước tối đa.",
  "only for EARLY_BIRD rules": "Chỉ dùng cho luật đặt sớm.",
  "only for LAST_MINUTE rules": "Chỉ dùng cho luật phút chót.",
  "to must not be before from": "Ngày kết thúc không được trước ngày bắt đầu.",
  "at most 62 days per request": "Tối đa 62 ngày mỗi lần.",
  "checkInTo must not be before checkInFrom": "Ngày kết thúc không được trước ngày bắt đầu.",
  "at most 1 decimal place": "Điểm chỉ có tối đa 1 chữ số thập phân.",
  "at least one preference must be given": "Chưa có sở thích nào để lưu.",
};

/** Backend messages that carry a value, so they cannot be keys of `schemaMessages`. */
const patternMessages: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [
    /^the price would be 0 or less \(base price ([\d.]+)\)$/,
    (match) =>
      `Giá mỗi đêm sẽ bằng 0 hoặc âm (giá cơ bản ${new Intl.NumberFormat("vi-VN").format(Number(match[1]))} ₫).`,
  ],
];

function translateMessage(message: string): string {
  if (schemaMessages[message]) return schemaMessages[message];
  for (const [pattern, format] of patternMessages) {
    const match = message.match(pattern);
    if (match) return format(match);
  }
  return message;
}

function getErrorBody(error: unknown): Partial<APIError> | undefined {
  return (error as AxiosError<APIError> | undefined)?.response?.data;
}

/** Branch on this, never on the message (api-guide §4.2). */
export function getApiErrorCode(error: unknown): string | undefined {
  return getErrorBody(error)?.code;
}

export function getApiErrorMessage(error: unknown, fallback = "Đã có lỗi xảy ra. Vui lòng thử lại."): string {
  const code = getApiErrorCode(error);
  if (code && errorMessages[code]) return errorMessages[code];
  if ((error as AxiosError | undefined)?.isAxiosError && !(error as AxiosError).response) {
    return "Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.";
  }
  return fallback;
}

/** `details` of a 400 VALIDATION_ERROR, keyed by field path. */
export function getApiFieldErrors(error: unknown): FieldErrors {
  const details = getErrorBody(error)?.details ?? [];
  return Object.fromEntries(details.map((detail) => [detail.field, translateMessage(detail.message)]));
}

/** Every `details` entry as sent; for errors that list several items under one field (AVAILABILITY_BELOW_BOOKED). */
export function getApiErrorDetails(error: unknown) {
  return getErrorBody(error)?.details ?? [];
}

function describeIssue(issue: z.core.$ZodIssue): string {
  if (schemaMessages[issue.message]) return schemaMessages[issue.message];
  switch (issue.code) {
    case "too_small":
      if (issue.origin === "string") {
        return Number(issue.minimum) <= 1 ? "Không được để trống." : `Tối thiểu ${issue.minimum} ký tự.`;
      }
      if (issue.origin === "array") return `Chọn ít nhất ${issue.minimum} mục.`;
      return `Giá trị tối thiểu là ${issue.minimum}.`;
    case "too_big":
      if (issue.origin === "string") return `Tối đa ${issue.maximum} ký tự.`;
      if (issue.origin === "array") return `Tối đa ${issue.maximum} mục.`;
      return `Giá trị tối đa là ${issue.maximum}.`;
    case "invalid_type":
      // Issues drop `input` by default; zod's own message still says what was received.
      return issue.message.endsWith("received undefined") ? "Trường này là bắt buộc." : "Giá trị không hợp lệ.";
    case "invalid_format":
      if (issue.format === "email") return "Email không hợp lệ.";
      if (issue.format === "date") return "Ngày không hợp lệ.";
      return "Định dạng không hợp lệ.";
    case "invalid_value":
      return "Giá trị không hợp lệ.";
    default:
      return "Giá trị không hợp lệ.";
  }
}

/**
 * Validates with the same shared zod schema the backend uses. Returns the parsed value, or Vietnamese messages keyed
 * by field path so the form can show them before the request is sent.
 */
export function validateWith<S extends z.ZodType>(
  schema: S,
  value: unknown,
): { data: z.output<S>; errors?: undefined } | { data?: undefined; errors: FieldErrors } {
  const result = schema.safeParse(value);
  if (result.success) return { data: result.data };
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".");
    errors[key] ??= describeIssue(issue);
  }
  return { errors };
}
