'use client';

import { AdminUnavailable, PageTitle } from '@/features/admin/admin-primitives';
import { InvitePlatformManager } from '@/features/admin/invite-platform-manager';

type Mode = 'dashboard' | 'users' | 'payment-settings' | 'transactions' | 'logs' | 'ai-settings';

const screens: Record<Mode, { title: string; description: string; upcoming: string[] }> = {
  dashboard: {
    title: 'Tổng quan hệ thống',
    description: 'Số liệu vận hành toàn nền tảng.',
    upcoming: ['Doanh thu, số booking và tài khoản mới', 'Cảnh báo giao dịch cần đối soát'],
  },
  users: {
    title: 'Người dùng & Phân quyền',
    description: 'Mời quản lý nền tảng và quản lý tài khoản.',
    upcoming: ['Danh sách tài khoản, lọc theo vai trò và trạng thái', 'Khóa / mở khóa tài khoản'],
  },
  'payment-settings': {
    title: 'Cấu hình thanh toán',
    description: 'Cổng thanh toán và quy tắc đối soát.',
    upcoming: ['Thông tin cổng thanh toán', 'Phí và chu kỳ đối soát'],
  },
  transactions: {
    title: 'Nhật ký giao dịch',
    description: 'Mọi giao dịch thanh toán và hoàn tiền trên nền tảng.',
    upcoming: ['Danh sách giao dịch theo trạng thái', 'Chi tiết và lịch sử đối soát'],
  },
  logs: {
    title: 'Nhật ký & Bảo mật',
    description: 'Nhật ký thao tác và sự kiện bảo mật.',
    upcoming: ['Nhật ký thao tác theo tài khoản', 'Sự kiện đăng nhập bất thường'],
  },
  'ai-settings': {
    title: 'Cấu hình AI toàn hệ thống',
    description: 'Mô hình và giới hạn cho các tính năng AI.',
    upcoming: ['Mô hình đang dùng', 'Hạn mức và bộ lọc nội dung'],
  },
};

export function AdminScreen({ mode }: { mode: Mode }) {
  const { title, description, upcoming } = screens[mode];
  return (
    <div className="space-y-6">
      <PageTitle eyebrow="Quản trị hệ thống" title={title} description={description} />
      {mode === 'users' && <InvitePlatformManager />}
      <AdminUnavailable upcoming={upcoming} />
    </div>
  );
}
