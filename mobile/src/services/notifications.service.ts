import type { APIResponse, Notification, NotificationListQuery, PageMeta, ReadAllResult, UnreadCount } from "@stayreco/shared";
import { apiService } from "./ApiService";

/** Thông báo trong app của người đang đăng nhập, mới nhất trước. */
export const getNotifications = async (query: Partial<NotificationListQuery> = {}) => {
  const { data } = await apiService.get<APIResponse<Notification[]>>("/me/notifications", {
    params: query,
    // `type` lặp key (`?type=BOOKING&type=PAYMENT`), không dùng `type[]`.
    paramsSerializer: { indexes: null },
  });
  return { notifications: data.data, meta: data.meta as PageMeta };
};

export const getUnreadCount = async () => {
  const { data } = await apiService.get<APIResponse<UnreadCount>>("/me/notifications/unread-count");
  return data.data;
};

export const markNotificationRead = async (id: string) => {
  const { data } = await apiService.post<APIResponse<Notification>>(`/me/notifications/${id}/read`);
  return data.data;
};

export const markAllNotificationsRead = async () => {
  const { data } = await apiService.post<APIResponse<ReadAllResult>>("/me/notifications/read-all");
  return data.data;
};
