"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CompleteOnboardingInput, Onboarding, OnboardingHotelsQuery } from "@stayreco/shared";
import { useAuthStore } from "@/lib/auth-store";
import * as service from "@/services/recommendations.service";
import type { RecommendationParams } from "@/services/recommendations.service";
import { rewardsKeys } from "@/features/account/api/rewards-queries";
import { notificationKeys } from "@/features/notifications/api/notification-queries";

export const recommendationKeys = {
  all: ["recommendations"] as const,
  list: (customerId: string | undefined, params: RecommendationParams) =>
    [...recommendationKeys.all, customerId ?? "public", params] as const,
  /** Per account: kept for ever (`staleTime: Infinity`), so a shared key would show one account's answer to the next one signing in on the same tab. */
  onboarding: (customerId: string | undefined) => [...recommendationKeys.all, "onboarding", customerId ?? "none"] as const,
  onboardingHotels: (query: OnboardingHotelsQuery) => [...recommendationKeys.all, "onboarding-hotels", query] as const,
};

/**
 * The hotels picked for the visitor: a customer's own list, the signed-out list for everyone else (staff and partners
 * browsing the site included, since `/me/recommendations` is customers only). The list changes only when the
 * recommender runs, so it is kept for a while.
 */
export function useRecommendations(params: RecommendationParams = {}) {
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const personal = user?.role === "customer";
  return useQuery({
    queryKey: recommendationKeys.list(personal ? user.id : undefined, params),
    queryFn: () => service.getRecommendations(params, personal),
    // Waiting for the stored sign-in avoids asking for the public list and then the personal one.
    enabled: hasHydrated,
    staleTime: 5 * 60 * 1000,
    // Ranked from the preferences just given: the model's own list follows within seconds (the backend runs the
    // recommender for this customer), so ask again for a minute, then leave it to the next visit.
    refetchInterval: (query) =>
      query.state.data?.source === "PREFERENCES" && query.state.dataUpdateCount < 20 ? 3000 : false,
  });
}

/** The signed-in customer's onboarding status; nothing for anyone else. */
export function useOnboarding() {
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const customerId = user?.role === "customer" ? user.id : undefined;
  return useQuery({
    queryKey: recommendationKeys.onboarding(customerId),
    queryFn: service.getOnboarding,
    enabled: hasHydrated && Boolean(customerId),
    staleTime: Infinity,
    retry: false,
  });
}

/**
 * The hotels offered on the last onboarding step, for the answers given on the earlier ones. Asked only once the
 * customer reaches that step, and again whenever they go back and change an answer (the answers are the key).
 */
export function useOnboardingHotels(query: OnboardingHotelsQuery, enabled: boolean) {
  return useQuery({
    queryKey: recommendationKeys.onboardingHotels(query),
    queryFn: () => service.getOnboardingHotels(query),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

function useOnboardingSettled() {
  const queryClient = useQueryClient();
  const customerId = useAuthStore((state) => state.user?.id);
  return (onboarding: Onboarding) => {
    queryClient.setQueryData(recommendationKeys.onboarding(customerId), onboarding);
    // The picks are now preferences and the welcome code is one of the customer's vouchers.
    void queryClient.invalidateQueries({ queryKey: rewardsKeys.all });
    void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    // The backend ranks a customer the last training run does not know from these answers at once: the list kept
    // from before (the signed-out one) and the search sorted by fit are read again, not left for five minutes.
    void queryClient.invalidateQueries({ queryKey: [...recommendationKeys.all, customerId ?? "public"] });
    void queryClient.invalidateQueries({ queryKey: ["stays", "search"] });
    // And once more when the model has scored them (train.py --customer, a few seconds).
    setTimeout(() => void queryClient.invalidateQueries({ queryKey: ["stays", "search"] }), 10_000);
  };
}

export function useCompleteOnboarding() {
  const settle = useOnboardingSettled();
  return useMutation({
    mutationFn: (input: CompleteOnboardingInput) => service.completeOnboarding(input),
    onSuccess: settle,
  });
}

