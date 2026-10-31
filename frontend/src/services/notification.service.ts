import { api } from "@/lib/axios";
import type {
  Notification,
  NotificationListQuery,
  ReadAllResult,
  UnreadCount,
} from "@stayreco/shared";
import type { APIResponse, PageMeta } from "@/types/response.type";

/**
 * In-app notifications, for every signed-in role (decision O12). A notification is only visible to its recipient;
 * `link` is the app path it opens.
 */

export type NotificationListParams = Partial<NotificationListQuery>;

export async function getNotifications(params: NotificationListParams = {}) {
  const { data } = await api.get<APIResponse<Notification[]>>("/me/notifications", {
    params,
    // `type` is a repeated query key (`?type=BOOKING&type=PAYMENT`).
    paramsSerializer: { indexes: null },
  });
  return { notifications: data.data, meta: data.meta as PageMeta };
}

export async function getUnreadCount() {
  const { data } = await api.get<APIResponse<UnreadCount>>("/me/notifications/unread-count");
  return data.data;
}

export async function markNotificationRead(notificationId: string) {
  const { data } = await api.post<APIResponse<Notification>>(`/me/notifications/${notificationId}/read`);
  return data.data;
}

export async function markAllNotificationsRead() {
  const { data } = await api.post<APIResponse<ReadAllResult>>("/me/notifications/read-all");
  return data.data;
}
