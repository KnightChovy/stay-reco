import type { NotificationType } from '@stayreco/shared';
import { Calendar, CreditCard, Gift, Info, ShieldAlert, Star } from 'lucide-react';

export const NOTIFICATION_TYPE_ICON: Record<NotificationType, typeof Calendar> = {
  BOOKING: Calendar,
  PAYMENT: CreditCard,
  PROMOTION: Gift,
  REVIEW: Star,
  ALERT: ShieldAlert,
  SYSTEM: Info,
};

export const NOTIFICATION_TYPE_TONE: Record<NotificationType, string> = {
  BOOKING: 'text-primary bg-primary/10',
  PAYMENT: 'text-emerald-600 bg-emerald-50',
  PROMOTION: 'text-amber-500 bg-amber-50',
  REVIEW: 'text-violet-600 bg-violet-50',
  ALERT: 'text-red-500 bg-red-50',
  SYSTEM: 'text-slate-500 bg-slate-100',
};

export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  BOOKING: 'Đặt phòng',
  PAYMENT: 'Thanh toán',
  PROMOTION: 'Ưu đãi',
  REVIEW: 'Đánh giá',
  ALERT: 'Cảnh báo',
  SYSTEM: 'Hệ thống',
};

/** "Vừa xong", "12 phút trước"… then a date after a month. */
export function notificationTimeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60_000));
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
