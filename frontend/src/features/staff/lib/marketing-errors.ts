import { getApiErrorCode, getApiErrorMessage } from "@/lib/api-error";

/**
 * The marketing endpoints need the MARKETING permission on top of being a member of the hotel; `/me/hotels` does not
 * say which permissions a staff member has, so a 403 FORBIDDEN is the only signal and is worded for it.
 */
export function getMarketingErrorMessage(error: unknown, fallback?: string) {
  if (getApiErrorCode(error) === "FORBIDDEN") {
    return "Tài khoản của bạn chưa có quyền Marketing. Hãy nhờ chủ khách sạn cấp quyền trong mục Nhân viên.";
  }
  return getApiErrorMessage(error, fallback);
}

export function isMissingMarketingPermission(error: unknown) {
  return getApiErrorCode(error) === "FORBIDDEN";
}
