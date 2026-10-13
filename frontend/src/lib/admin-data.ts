export type UserRole = 'Khách hàng' | 'Đối tác' | 'Nhân viên' | 'Quản trị viên';
export type UserStatus = 'Hoạt động' | 'Tạm khóa' | 'Chờ xác minh';
export type TransactionStatus =
  'Khớp 100%' | 'Chờ IPN' | 'Cần đối soát' | 'Hoàn tiền một phần';

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
  lastActive: string;
  initials: string;
};

export type Transaction = {
  id: string;
  bookingCode: string;
  hotel: string;
  provider: 'VNPay' | 'SePay';
  amount: string;
  type: 'Thanh toán' | 'Hoàn tiền';
  status: TransactionStatus;
  verifiedAt: string;
};

export type AuditEvent = {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  severity: 'Thông tin' | 'Cảnh báo' | 'Cao';
  detail: string;
};

export const adminUsers: AdminUser[] = [
  {
    id: 'u-001',
    name: 'Võ Hoàng Long',
    email: 'long.vo@stayreco.vn',
    role: 'Quản trị viên',
    status: 'Hoạt động',
    joinedAt: '12/03/2026',
    lastActive: '10:28 hôm nay',
    initials: 'VL',
  },
  {
    id: 'u-002',
    name: 'Lê Hoàng Nam',
    email: 'nam.le@stayreco.vn',
    role: 'Đối tác',
    status: 'Hoạt động',
    joinedAt: '24/04/2026',
    lastActive: '09:14 hôm nay',
    initials: 'LN',
  },
  {
    id: 'u-003',
    name: 'Nguyễn Hương Giang',
    email: 'giang.nguyen@stayreco.vn',
    role: 'Nhân viên',
    status: 'Tạm khóa',
    joinedAt: '08/02/2026',
    lastActive: 'Hôm qua',
    initials: 'NG',
  },
  {
    id: 'u-004',
    name: 'Trần Bảo An',
    email: 'an.tran@example.vn',
    role: 'Khách hàng',
    status: 'Chờ xác minh',
    joinedAt: '20/05/2026',
    lastActive: '19/05/2026',
    initials: 'TA',
  },
  {
    id: 'u-005',
    name: 'Phạm Minh Châu',
    email: 'chau.pham@example.vn',
    role: 'Khách hàng',
    status: 'Hoạt động',
    joinedAt: '18/05/2026',
    lastActive: '18/05/2026',
    initials: 'PC',
  },
];

export const transactions: Transaction[] = [
  {
    id: 'TX-VN-8942',
    bookingCode: 'SR-261020-0842',
    hotel: 'An Nhiên Riverside, Đà Lạt',
    provider: 'VNPay',
    amount: '2.250.000 ₫',
    type: 'Thanh toán',
    status: 'Cần đối soát',
    verifiedAt: '15:38 20/10/2026',
  },
  {
    id: 'TX-SP-3129',
    bookingCode: 'SR-261020-0841',
    hotel: 'Sunset Bay Boutique, Phú Quốc',
    provider: 'SePay',
    amount: '4.300.000 ₫',
    type: 'Thanh toán',
    status: 'Khớp 100%',
    verifiedAt: '15:35 20/10/2026',
  },
  {
    id: 'TX-VN-8941',
    bookingCode: 'SR-261020-0840',
    hotel: 'The Wooden Villa, Sa Pa',
    provider: 'VNPay',
    amount: '1.850.000 ₫',
    type: 'Thanh toán',
    status: 'Khớp 100%',
    verifiedAt: '15:28 20/10/2026',
  },
  {
    id: 'TX-SP-3128',
    bookingCode: 'SR-261020-0838',
    hotel: 'Hội An Nostalgia Eco Lodge',
    provider: 'SePay',
    amount: '2.250.000 ₫',
    type: 'Thanh toán',
    status: 'Chờ IPN',
    verifiedAt: '15:12 20/10/2026',
  },
  {
    id: 'TX-VN-8939',
    bookingCode: 'SR-261020-0837',
    hotel: 'Sơn Trà Seaside Boutique, Đà Nẵng',
    provider: 'VNPay',
    amount: '5.600.000 ₫',
    type: 'Thanh toán',
    status: 'Khớp 100%',
    verifiedAt: '15:04 20/10/2026',
  },
  {
    id: 'TX-VN-8920',
    bookingCode: 'SR-261020-0812',
    hotel: 'Mây Homestay, Nha Trang',
    provider: 'VNPay',
    amount: '750.000 ₫',
    type: 'Hoàn tiền',
    status: 'Hoàn tiền một phần',
    verifiedAt: '14:22 20/10/2026',
  },
];

export const auditEvents: AuditEvent[] = [
  {
    id: 'evt-01',
    timestamp: '20/10/2026 10:28',
    actor: 'Trần Đình Quân',
    action: 'Cập nhật chính sách hoàn hủy',
    target: 'Đối tác An Lam Retreats',
    severity: 'Thông tin',
    detail:
      'Thay đổi thời hạn hủy miễn phí từ 48 giờ sang 72 giờ. Dữ liệu so sánh đã được che thông tin nhạy cảm.',
  },
  {
    id: 'evt-02',
    timestamp: '20/10/2026 09:45',
    actor: 'Platform Manager',
    action: 'Gửi cảnh báo vi phạm',
    target: 'Mây Sapa #HT-109',
    severity: 'Cảnh báo',
    detail: 'Yêu cầu đối tác bổ sung mô tả điều kiện phòng trước 22/10/2026.',
  },
  {
    id: 'evt-03',
    timestamp: '20/10/2026 08:12',
    actor: 'System Guard',
    action: 'Thu hồi phiên đăng nhập',
    target: 'Tài khoản nhân viên',
    severity: 'Cao',
    detail:
      'Phiên truy cập bất thường đã bị vô hiệu hóa. Không lưu mật khẩu, token hoặc payload riêng tư trong nhật ký này.',
  },
  {
    id: 'evt-04',
    timestamp: '19/10/2026 17:40',
    actor: 'Võ Hoàng Long',
    action: 'Kiểm tra kết nối thanh toán',
    target: 'VNPay Production',
    severity: 'Thông tin',
    detail:
      'Kiểm tra kết nối hoàn tất, phản hồi từ cổng thanh toán trong 423 ms.',
  },
];

export const navItems = [
  { href: '/admin/dashboard', label: 'Tổng quan', icon: 'LayoutDashboard' },
  {
    href: '/admin/users',
    label: 'Người dùng & Phân quyền',
    icon: 'UsersRound',
  },
  {
    href: '/admin/payment-settings',
    label: 'Cấu hình thanh toán',
    icon: 'Landmark',
  },
  {
    href: '/admin/transactions',
    label: 'Nhật ký giao dịch',
    icon: 'ReceiptText',
  },
  { href: '/admin/logs', label: 'Nhật ký & Bảo mật', icon: 'ShieldCheck' },
  {
    href: '/admin/ai-settings',
    label: 'Cấu hình AI toàn hệ thống',
    icon: 'Bot',
  },
] as const;
