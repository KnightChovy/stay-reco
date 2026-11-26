import type {
  APIResponse,
  CompleteOnboardingInput,
  Onboarding,
  OnboardingHotelSuggestion,
  OnboardingHotelsQuery,
  Preferences,
  Recommendations,
} from "@stayreco/shared";
import { apiService } from "./ApiService";

/** Sở thích đã lưu: cặp key-value tự do, `{}` khi chưa lưu gì. */
export type PreferenceMap = Preferences["preferences"];

/**
 * Gợi ý khách sạn phase 5, onboarding lần đầu (kèm voucher chào mừng) và sở thích du lịch
 * (docs/api/assistant.md "Recommendations", onboarding.md, customer-wallet.md "Preferences").
 * Cùng endpoint với frontend/src/services/recommendations.service.ts và rewards.service.ts.
 */

export type RecommendationParams = { city?: string; limit?: number };

/** Khách hàng đã đăng nhập nhận danh sách riêng (`/me/...`); người khác nhận danh sách chung. */
export const getRecommendations = async (params: RecommendationParams, personal: boolean) => {
  const { data } = await apiService.get<APIResponse<Recommendations>>(personal ? "/me/recommendations" : "/recommendations", { params });
  return data.data;
};

export const recommendationsQuery = (params: RecommendationParams, personal: boolean) => ({
  queryKey: ["recommendations", personal ? "me" : "public", params],
  queryFn: () => getRecommendations(params, personal),
  // Danh sách chỉ đổi khi recommender/ chạy lại.
  staleTime: 5 * 60_000,
});

export const getOnboarding = async () => {
  const { data } = await apiService.get<APIResponse<Onboarding>>("/me/onboarding");
  return data.data;
};

/**
 * Bước chọn khách sạn: khách sạn ở các điểm đến đã chọn, hợp phong cách, tiện nghi và tầm nhìn đã chọn, hợp nhất trước.
 * Danh sách gửi dạng key lặp lại (`?cities=Đà Lạt&cities=Hà Nội`), không phải `cities[]`.
 */
export const getOnboardingHotels = async (query: OnboardingHotelsQuery) => {
  const { data } = await apiService.get<APIResponse<OnboardingHotelSuggestion[]>>("/me/onboarding/hotels", {
    params: query,
    paramsSerializer: { indexes: null },
  });
  return data.data;
};

/** Lưu lựa chọn thành sở thích và phát voucher chào mừng (mỗi khách một lần). */
export const completeOnboarding = async (input: CompleteOnboardingInput) => {
  const { data } = await apiService.post<APIResponse<Onboarding>>("/me/onboarding", input);
  return data.data;
};

export const getMyPreferences = async () => {
  const { data } = await apiService.get<APIResponse<Preferences>>("/me/preferences");
  return data.data.preferences;
};

/** Ghi các key được gửi, xoá key có giá trị `null`, giữ nguyên các key khác. */
export const updateMyPreferences = async (preferences: Record<string, string | null>) => {
  const { data } = await apiService.put<APIResponse<Preferences>>("/me/preferences", { preferences });
  return data.data.preferences;
};
