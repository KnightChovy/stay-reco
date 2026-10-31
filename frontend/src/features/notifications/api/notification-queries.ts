"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as notificationService from "@/services/notification.service";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (params: notificationService.NotificationListParams) =>
    [...notificationKeys.all, "list", params] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

export function useNotifications(params: notificationService.NotificationListParams = {}) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => notificationService.getNotifications(params),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: true,
  });
}

/** The red badge on the header bell. Disable it on public pages and for signed-out visitors. */
export function useUnreadNotificationCount(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: notificationService.getUnreadCount,
    enabled,
    refetchOnWindowFocus: true,
    select: (data) => data.count,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => notificationService.markNotificationRead(notificationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...notificationKeys.all, "list"] });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationService.markAllNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...notificationKeys.all, "list"] });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}
