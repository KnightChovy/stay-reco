import { api } from "@/lib/axios";
import type {
  CompleteOnboardingInput,
  Onboarding,
  OnboardingHotelSuggestion,
  OnboardingHotelsQuery,
  Recommendations,
} from "@stayreco/shared";
import type { APIResponse } from "@/types/response.type";

/**
 * Phase 5 personal hotel recommendations (docs/api/assistant.md "Recommendations") and the first-login preferences that
 * feed them, with the platform's welcome voucher (docs/api/onboarding.md).
 */

export type RecommendationParams = { city?: string; limit?: number };

/** A signed-in customer gets their own list (`/me/...`); everyone else the signed-out one. */
export async function getRecommendations(params: RecommendationParams, personal: boolean) {
  const { data } = await api.get<APIResponse<Recommendations>>(personal ? "/me/recommendations" : "/recommendations", {
    params,
  });
  return data.data;
}

export async function getOnboarding() {
  const { data } = await api.get<APIResponse<Onboarding>>("/me/onboarding");
  return data.data;
}

/**
 * The hotel step: hotels in the cities picked that fit the style, amenities and views picked, best fit first.
 * Lists go as repeated keys (`?cities=Đà Lạt&cities=Hà Nội`), not `cities[]`.
 */
export async function getOnboardingHotels(query: OnboardingHotelsQuery) {
  const { data } = await api.get<APIResponse<OnboardingHotelSuggestion[]>>("/me/onboarding/hotels", {
    params: query,
    paramsSerializer: { indexes: null },
  });
  return data.data;
}

/** Saves the picks as preferences and issues the welcome voucher (once per customer). */
export async function completeOnboarding(input: CompleteOnboardingInput) {
  const { data } = await api.post<APIResponse<Onboarding>>("/me/onboarding", input);
  return data.data;
}

export async function skipOnboarding() {
  const { data } = await api.post<APIResponse<Onboarding>>("/me/onboarding/skip");
  return data.data;
}
