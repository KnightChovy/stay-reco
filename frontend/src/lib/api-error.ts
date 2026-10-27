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
  UPLOAD_INVALID_FILE: "Tệp không hợp lệ: sai định dạng, quá 10 MB hoặc bị hỏng.",
  UPLOAD_UNAVAILABLE: "Tải tệp tạm thời không khả dụng. Vui lòng thử lại sau.",
  IMAGE_NOT_FOUND: "Không tìm thấy ảnh. Danh sách đã được tải lại.",
  IMAGE_LIMIT_REACHED: "Đã đạt tối đa 30 ảnh. Hãy xoá bớt ảnh trước khi thêm.",
  PRICING_RULE_NOT_FOUND: "Không tìm thấy luật giá. Danh sách đã được tải lại.",
  AVAILABILITY_BELOW_BOOKED: "Một số ngày không còn đủ phòng trống để mở bán số lượng này.",
  BOOKING_NOT_FOUND: "Không tìm thấy booking. Danh sách đã được tải lại.",
  BOOKING_STATUS_CONFLICT: "Trạng thái booking đã thay đổi. Danh sách đã được tải lại.",
  REFUND_STATUS_CONFLICT: "Yêu cầu hoàn tiền đã được xử lý. Danh sách đã được tải lại.",
};

/** Custom messages written in the shared zod schemas (packages/shared/src/schemas), also returned in `details`. */
const schemaMessages: Record<string, string> = {
  "phone must be a valid phone number": "Số điện thoại không hợp lệ.",
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
