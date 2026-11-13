"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  GenerateContentInput,
  MarketingContent,
  ScheduleContentInput,
  UpdateContentInput,
} from "@stayreco/shared";
import * as marketingService from "@/services/marketing.service";
import type { ContentListParams, ScheduleListParams } from "@/services/marketing.service";

/** Query keys of the staff marketing screens (phase 5, docs/api/marketing.md). */
export const marketingKeys = {
  all: ["marketing"] as const,
  budget: (hotelId: string) => [...marketingKeys.all, "budget", hotelId] as const,
  voice: (hotelId: string) => [...marketingKeys.all, "voice", hotelId] as const,
  ideas: (hotelId: string) => [...marketingKeys.all, "ideas", hotelId] as const,
  contents: (hotelId: string, params: ContentListParams) =>
    [...marketingKeys.all, "contents", hotelId, params] as const,
  content: (contentId: string) => [...marketingKeys.all, "content", contentId] as const,
  accounts: (hotelId: string) => [...marketingKeys.all, "accounts", hotelId] as const,
  schedules: (hotelId: string, params: ScheduleListParams) =>
    [...marketingKeys.all, "schedules", hotelId, params] as const,
  metrics: (scheduleId: string) => [...marketingKeys.all, "metrics", scheduleId] as const,
};

export function useAiBudget(hotelId: string | undefined) {
  return useQuery({
    queryKey: marketingKeys.budget(hotelId ?? ""),
    queryFn: () => marketingService.getAiBudget(hotelId!),
    enabled: !!hotelId,
    retry: false,
  });
}

export function useBrandVoice(hotelId: string | undefined) {
  return useQuery({
    queryKey: marketingKeys.voice(hotelId ?? ""),
    queryFn: () => marketingService.getBrandVoice(hotelId!),
    enabled: !!hotelId,
    retry: false,
  });
}

export function useContentIdeas(hotelId: string | undefined) {
  return useQuery({
    queryKey: marketingKeys.ideas(hotelId ?? ""),
    queryFn: () => marketingService.getContentIdeas(hotelId!),
    enabled: !!hotelId,
    retry: false,
  });
}

export function useContents(hotelId: string | undefined, params: ContentListParams) {
  return useQuery({
    queryKey: marketingKeys.contents(hotelId ?? "", params),
    queryFn: () => marketingService.getContents(hotelId!, params),
    enabled: !!hotelId,
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useContent(contentId: string | undefined) {
  return useQuery({
    queryKey: marketingKeys.content(contentId ?? ""),
    queryFn: () => marketingService.getContent(contentId!),
    enabled: !!contentId,
    retry: false,
  });
}

export function useSocialAccounts(hotelId: string | undefined) {
  return useQuery({
    queryKey: marketingKeys.accounts(hotelId ?? ""),
    queryFn: () => marketingService.getSocialAccounts(hotelId!),
    enabled: !!hotelId,
    retry: false,
  });
}

export function useSchedules(hotelId: string | undefined, params: ScheduleListParams, options: { poll?: boolean } = {}) {
  return useQuery({
    queryKey: marketingKeys.schedules(hotelId ?? "", params),
    queryFn: () => marketingService.getSchedules(hotelId!, params),
    enabled: !!hotelId,
    placeholderData: keepPreviousData,
    retry: false,
    // The publisher runs every minute: while something is waiting, the calendar follows it.
    refetchInterval: (query) =>
      options.poll && query.state.data?.schedules.some((item) => item.status === "SCHEDULED") ? 20_000 : false,
  });
}

export function useScheduleMetrics(scheduleId: string | undefined) {
  return useQuery({
    queryKey: marketingKeys.metrics(scheduleId ?? ""),
    queryFn: () => marketingService.getScheduleMetrics(scheduleId!),
    enabled: !!scheduleId,
    retry: false,
  });
}

/** A piece changed: its detail takes the answer, every list and the budget are read again. */
function useContentChanged() {
  const queryClient = useQueryClient();
  return (content?: MarketingContent) => {
    if (content) queryClient.setQueryData(marketingKeys.content(content.id), content);
    void queryClient.invalidateQueries({ queryKey: [...marketingKeys.all, "contents"] });
    void queryClient.invalidateQueries({ queryKey: [...marketingKeys.all, "budget"] });
  };
}

export function useGenerateContent() {
  const changed = useContentChanged();
  return useMutation({
    mutationFn: ({ hotelId, input }: { hotelId: string; input: GenerateContentInput }) =>
      marketingService.generateContent(hotelId, input),
    onSuccess: changed,
  });
}

export function useUpdateContent() {
  const changed = useContentChanged();
  return useMutation({
    mutationFn: ({ contentId, input }: { contentId: string; input: UpdateContentInput }) =>
      marketingService.updateContent(contentId, input),
    onSuccess: changed,
  });
}

export function useUploadContentImage() {
  const changed = useContentChanged();
  return useMutation({
    mutationFn: ({ contentId, file }: { contentId: string; file: File }) =>
      marketingService.uploadContentImage(contentId, file),
    onSuccess: changed,
  });
}

export function useRemoveContentImage() {
  const changed = useContentChanged();
  return useMutation({
    mutationFn: (contentId: string) => marketingService.removeContentImage(contentId),
    onSuccess: changed,
  });
}

export function useSubmitContent() {
  const changed = useContentChanged();
  return useMutation({
    mutationFn: (contentId: string) => marketingService.submitContent(contentId),
    onSuccess: changed,
  });
}

export function useDeleteContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contentId: string) => marketingService.deleteContent(contentId),
    onSuccess: (_, contentId) => {
      queryClient.removeQueries({ queryKey: marketingKeys.content(contentId) });
      void queryClient.invalidateQueries({ queryKey: [...marketingKeys.all, "contents"] });
    },
  });
}

export function useScheduleContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contentId, input }: { contentId: string; input: ScheduleContentInput }) =>
      marketingService.scheduleContent(contentId, input),
    onSuccess: (_, { contentId }) => {
      void queryClient.invalidateQueries({ queryKey: marketingKeys.content(contentId) });
      void queryClient.invalidateQueries({ queryKey: [...marketingKeys.all, "contents"] });
      void queryClient.invalidateQueries({ queryKey: [...marketingKeys.all, "schedules"] });
    },
  });
}

export function useCancelSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scheduleId: string) => marketingService.cancelSchedule(scheduleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...marketingKeys.all, "schedules"] });
      void queryClient.invalidateQueries({ queryKey: [...marketingKeys.all, "contents"] });
      // Cancelling the last waiting post puts the piece back to APPROVED: its detail must follow.
      void queryClient.invalidateQueries({ queryKey: [...marketingKeys.all, "content"] });
    },
  });
}

export function useRefreshMetrics() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scheduleId: string) => marketingService.refreshScheduleMetrics(scheduleId),
    onSuccess: (_, scheduleId) =>
      void queryClient.invalidateQueries({ queryKey: marketingKeys.metrics(scheduleId) }),
  });
}
