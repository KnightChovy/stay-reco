"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CompleteOnboardingInput, Onboarding } from "@stayreco/shared";
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
  });
}

export function useOnboarding(enabled: boolean) {
  const customerId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: recommendationKeys.onboarding(customerId),
    queryFn: service.getOnboarding,
    enabled: enabled && Boolean(customerId),
    staleTime: Infinity,
    retry: false,
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
  };
}

export function useCompleteOnboarding() {
  const settle = useOnboardingSettled();
  return useMutation({
    mutationFn: (input: CompleteOnboardingInput) => service.completeOnboarding(input),
    onSuccess: settle,
  });
}

export function useSkipOnboarding() {
  const settle = useOnboardingSettled();
  return useMutation({ mutationFn: service.skipOnboarding, onSuccess: settle });
}
