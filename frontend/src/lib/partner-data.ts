import {
  ArrowDownToLine,
  BadgeDollarSign,
  BedDouble,
  Building2,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  LayoutDashboard,
  Landmark,
  Percent,
  Sparkles,
  Tags,
  UserCog,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export type PartnerMode =
  | "dashboard"
  | "bookings"
  | "revenue"
  | "hotel"
  | "rooms"
  | "availability"
  | "pricing"
  | "promotions"
  | "loyalty"
  | "ai-brand"
  | "staff"
  | "verification";

export type PartnerWorkspaceMode = Exclude<
  PartnerMode,
  "bookings" | "revenue" | "verification"
>;

export type PartnerWorkspaceRow = [
  name: string,
  detail: string,
  state: string,
];

export type PartnerWorkspace = {
  title: string;
  description: string;
  action: string;
  summary: string;
  icon: LucideIcon;
  rows: PartnerWorkspaceRow[];
};

export type PartnerBooking = [
  code: string,
  guest: string,
  roomType: string,
  dates: string,
  stayLength: string,
  status: string,
  total: string,
];

export type PartnerMetric = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone?: string;
};

export type PartnerSettlement = [
  code: string,
  period: string,
  grossRevenue: string,
  deductions: string,
  netRevenue: string,
  status: string,
];

export type PartnerVerificationField = {
  label: string;
  value: string;
  wide?: boolean;
};

export const partnerBookingStatuses = [
  "Đã xác nhận",
  "Sắp check-in",
  "Chờ xác nhận",
  "Đang lưu trú",
];

export const partnerBookingMetrics: PartnerMetric[] = [
  {
    label: "Đến hôm nay",
    value: "12",
    hint: "4 khách cần check-in",
    icon: CalendarDays,
    tone: "text-primary",
  },
  {
    label: "Đang lưu trú",
    value: "18",
    hint: "25 khách tại cơ sở",
    icon: BedDouble,
    tone: "text-success",
  },
  {
    label: "Chờ xác nhận",
    value: "05",
    hint: "Cần xử lý trước 14:00",
    icon: Clock3,
    tone: "text-brand-accent",
  },
  {
    label: "Hoàn tất tháng này",
    value: "128",
    hint: "Tỷ lệ hoàn thành 96,8%",
    icon: CheckCircle2,
    tone: "text-primary",
  },
];

export const partnerBookingColumns = [
  "Booking",
  "Khách lưu trú",
  "Hạng phòng",
  "Thời gian",
  "Trạng thái",
  "Thành tiền",
  "Thao tác",
];

export const partnerBookings: PartnerBooking[] = [
  [
    "SR-261024-0842",
    "Nguyễn Thanh Hà",
    "Deluxe River View",
    "24–27/10/2026",
    "3 đêm · 2 khách",
    "Sắp check-in",
    "8.400.000 ₫",
  ],
  [
    "SR-261024-0839",
    "Trần Quốc Minh",
    "Premier Balcony",
    "24–26/10/2026",
    "2 đêm · 2 khách",
    "Đã xác nhận",
    "5.900.000 ₫",
  ],
  [
    "SR-261024-0835",
    "Lê Ngọc Anh",
    "Family Suite",
    "23–26/10/2026",
    "3 đêm · 4 khách",
    "Đang lưu trú",
    "12.600.000 ₫",
  ],
  [
    "SR-261024-0831",
    "Phạm Gia Bảo",
    "Superior City View",
    "25–27/10/2026",
    "2 đêm · 1 khách",
    "Chờ xác nhận",
    "3.800.000 ₫",
  ],
  [
    "SR-261024-0827",
    "Hoàng Thu Trang",
    "Deluxe River View",
    "26–29/10/2026",
    "3 đêm · 2 khách",
    "Đã xác nhận",
    "8.700.000 ₫",
  ],
  [
    "SR-261024-0822",
    "Vũ Minh Khôi",
    "Premier Balcony",
    "24–25/10/2026",
    "1 đêm · 2 khách",
    "Sắp check-in",
    "2.950.000 ₫",
  ],
  [
    "SR-261024-0818",
    "Đỗ Mỹ Linh",
    "Family Suite",
    "22–25/10/2026",
    "3 đêm · 3 khách",
    "Đang lưu trú",
    "11.900.000 ₫",
  ],
  [
    "SR-261024-0813",
    "Bùi Anh Tuấn",
    "Superior City View",
    "27–29/10/2026",
    "2 đêm · 2 khách",
    "Chờ xác nhận",
    "4.200.000 ₫",
  ],
];

export const partnerOperationShifts: Array<
  [time: string, task: string, state: string]
> = [
  ["06:30", "Mở quầy lễ tân", "Đã hoàn tất"],
  ["11:30", "Chuẩn bị 7 phòng check-out", "Đang xử lý"],
  ["14:00", "Check-in 4 booking mới", "Sắp tới"],
  ["18:00", "Đối soát tiền cọc", "Sắp tới"],
];

export const partnerSettlementStatuses = ["Đang đối soát", "Đã chuyển"];

export const partnerRevenueMetrics: PartnerMetric[] = [
  {
    label: "Doanh thu gộp",
    value: "285.000.000 ₫",
    hint: "228 booking",
    icon: CircleDollarSign,
  },
  {
    label: "Doanh thu thực nhận",
    value: "250.550.000 ₫",
    hint: "Sau phí và voucher",
    icon: Landmark,
  },
  {
    label: "Sắp chuyển khoản",
    value: "86.200.000 ₫",
    hint: "Ngày 28/10/2026",
    icon: ArrowDownToLine,
  },
  {
    label: "Hoàn tiền đang xử lý",
    value: "4.850.000 ₫",
    hint: "3 giao dịch",
    icon: BadgeDollarSign,
    tone: "text-brand-accent",
  },
];

export const partnerRevenueChartHeights = [
  42, 57, 66, 54, 76, 88, 69, 96, 82, 91, 74, 86,
];

export const partnerCashflowBreakdown: Array<
  [label: string, value: string, width: string]
> = [
  ["Tiền phòng", "285.000.000 ₫", "100%"],
  ["Voucher khách sạn", "−18.500.000 ₫", "36%"],
  ["Phí StayReco (6%)", "−15.950.000 ₫", "28%"],
  ["Hoàn tiền", "−4.850.000 ₫", "18%"],
];

export const partnerSettlementColumns = [
  "Mã kỳ",
  "Thời gian",
  "Doanh thu gộp",
  "Khấu trừ",
  "Thực nhận",
  "Trạng thái",
  "Chứng từ",
];

export const partnerSettlements: PartnerSettlement[] = [
  [
    "SET-2026-10-04",
    "22–28/10/2026",
    "86.200.000 ₫",
    "−9.450.000 ₫",
    "76.750.000 ₫",
    "Đang đối soát",
  ],
  [
    "SET-2026-10-03",
    "15–21/10/2026",
    "72.850.000 ₫",
    "−8.120.000 ₫",
    "64.730.000 ₫",
    "Đã chuyển",
  ],
  [
    "SET-2026-10-02",
    "08–14/10/2026",
    "68.400.000 ₫",
    "−7.680.000 ₫",
    "60.720.000 ₫",
    "Đã chuyển",
  ],
  [
    "SET-2026-10-01",
    "01–07/10/2026",
    "57.550.000 ₫",
    "−6.240.000 ₫",
    "51.310.000 ₫",
    "Đã chuyển",
  ],
  [
    "SET-2026-09-04",
    "24–30/09/2026",
    "63.900.000 ₫",
    "−7.030.000 ₫",
    "56.870.000 ₫",
    "Đã chuyển",
  ],
  [
    "SET-2026-09-03",
    "17–23/09/2026",
    "59.250.000 ₫",
    "−6.510.000 ₫",
    "52.740.000 ₫",
    "Đã chuyển",
  ],
];

export const partnerVerificationSteps: Array<
  [title: string, subtitle: string]
> = [
  ["Pháp nhân", "Thông tin doanh nghiệp"],
  ["Cơ sở lưu trú", "Định vị và vận hành"],
  ["Tài liệu", "Giấy phép & chứng nhận"],
  ["Xác nhận", "Kiểm tra trước khi gửi"],
];

export const partnerLegalFields: PartnerVerificationField[] = [
  {
    label: "Tên pháp nhân",
    value: "Công ty TNHH Khách sạn An Nhiên Đà Nẵng",
    wide: true,
  },
  { label: "Mã số thuế", value: "0401988234" },
  { label: "Loại hình doanh nghiệp", value: "Công ty TNHH" },
  { label: "Người đại diện pháp luật", value: "Trần Nam" },
  { label: "Chức vụ", value: "Giám đốc" },
  { label: "Số CCCD / Hộ chiếu", value: "048091002341" },
  { label: "Số điện thoại liên hệ", value: "0236 3888 999" },
  {
    label: "Email nhận thông báo",
    value: "contact@annhienriverside.vn",
    wide: true,
  },
];

export const partnerPropertyFields: PartnerVerificationField[] = [
  { label: "Tên thương mại", value: "An Nhiên Riverside Hotel" },
  { label: "Mô hình cơ sở", value: "Khách sạn Boutique · 4 sao" },
  { label: "Số phòng vật lý", value: "36 phòng" },
  { label: "Người quản lý cơ sở", value: "Nguyễn Minh Anh" },
  {
    label: "Địa chỉ trên giấy phép",
    value: "128 Đường Bạch Đằng, Hải Châu, Đà Nẵng",
    wide: true,
  },
  { label: "Khoảng cách điểm nhận diện", value: "Cách Cầu Rồng 350m" },
  { label: "Giờ trực lễ tân", value: "24/7" },
];

export const partnerVerificationDocuments: Array<
  [name: string, file: string, status: string]
> = [
  [
    "Giấy chứng nhận đăng ký doanh nghiệp",
    "gpkd_annhien_riverside_signed.pdf",
    "Hợp lệ",
  ],
  [
    "Giấy chứng nhận đủ điều kiện ANTT & PCCC",
    "pccc_verified_2025.pdf",
    "Đã kiểm tra",
  ],
  ["Chứng nhận tiêu chuẩn xếp hạng cơ sở", "Chưa tải tài liệu", "Cần bổ sung"],
];

export const partnerVerificationReview: Array<
  [title: string, detail: string, status: string]
> = [
  ["Pháp nhân & đại diện", "Đã điền đủ 8 trường bắt buộc", "Hoàn tất"],
  ["Thông tin cơ sở lưu trú", "Địa chỉ và quy mô đã xác nhận", "Hoàn tất"],
  ["Tài liệu pháp lý", "2/3 tài liệu đã tải lên", "Cần bổ sung"],
];

export const partnerWorkspaces: Record<
  PartnerWorkspaceMode,
  PartnerWorkspace
> = {
  dashboard: {
    title: "Tổng quan vận hành đối tác",
    description:
      "Theo dõi nhanh công suất phòng, doanh thu, booking và các công việc cần xử lý tại An Nhiên Riverside Hotel.",
    action: "Xem báo cáo hôm nay",
    summary: "78% công suất",
    icon: LayoutDashboard,
    rows: [
      ["Booking hôm nay", "12 lượt đến · 7 lượt rời", "Ổn định"],
      ["Kho phòng", "28/36 phòng đang khả dụng", "Đã đồng bộ"],
      ["Doanh thu tháng", "250.550.000 ₫ thực nhận", "Tăng 18,4%"],
      ["Hồ sơ đối tác", "2/3 tài liệu đã được xác minh", "Cần bổ sung"],
    ],
  },
  hotel: {
    title: "Khách sạn & cơ sở",
    description:
      "Quản lý thông tin công khai, tiện nghi, chính sách và trạng thái hoạt động của cơ sở lưu trú.",
    action: "Cập nhật thông tin cơ sở",
    summary: "1 cơ sở",
    icon: Building2,
    rows: [
      ["An Nhiên Riverside Hotel", "128 Bạch Đằng, Hải Châu, Đà Nẵng", "Đang mở bán"],
      ["Hồ sơ tiện nghi", "42 tiện nghi đã công bố", "Đầy đủ"],
      ["Chính sách lưu trú", "Check-in 14:00 · Check-out 12:00", "Đã cập nhật"],
    ],
  },
  rooms: {
    title: "Kho phòng",
    description:
      "Quản lý hạng phòng, phòng vật lý, tình trạng vệ sinh và khả năng mở bán.",
    action: "Thêm hạng phòng",
    summary: "36 phòng",
    icon: BedDouble,
    rows: [
      ["Deluxe River View", "12 phòng · giá từ 2.800.000 ₫", "Còn 8 phòng"],
      ["Premier Balcony", "10 phòng · giá từ 2.950.000 ₫", "Còn 7 phòng"],
      ["Family Suite", "6 phòng · giá từ 4.200.000 ₫", "Còn 3 phòng"],
      ["Superior City View", "8 phòng · giá từ 1.900.000 ₫", "Còn 6 phòng"],
    ],
  },
  availability: {
    title: "Lịch tồn & khả dụng",
    description:
      "Điều chỉnh số phòng mở bán và theo dõi tình trạng tồn theo ngày, hạng phòng và kênh phân phối.",
    action: "Cập nhật tồn phòng",
    summary: "24 phòng trống",
    icon: CalendarRange,
    rows: [
      ["24/10/2026", "28 phòng mở bán · 12 phòng đã đặt", "Còn phòng"],
      ["25/10/2026", "30 phòng mở bán · 22 phòng đã đặt", "Sắp đầy"],
      ["26/10/2026", "32 phòng mở bán · 18 phòng đã đặt", "Còn phòng"],
    ],
  },
  pricing: {
    title: "Luật giá & mùa vụ",
    description:
      "Thiết lập giá cơ sở, phụ thu và quy tắc điều chỉnh theo mùa hoặc mức công suất.",
    action: "Tạo luật giá",
    summary: "8 luật đang chạy",
    icon: Tags,
    rows: [
      ["Cuối tuần Đà Nẵng", "+12% từ thứ Sáu đến Chủ Nhật", "Đang áp dụng"],
      ["Công suất trên 85%", "+18% khi tồn phòng xuống thấp", "Tự động"],
      ["Mùa thấp điểm", "−10% cho kỳ ở từ 3 đêm", "Đã lên lịch"],
    ],
  },
  promotions: {
    title: "Chiến dịch & giảm giá",
    description:
      "Quản lý ưu đãi trực tiếp, voucher và chương trình kích cầu theo từng phân khúc khách.",
    action: "Tạo chiến dịch",
    summary: "4 chiến dịch",
    icon: Percent,
    rows: [
      ["Stay 3 Pay 2", "Áp dụng hạng Deluxe trong tháng 11", "Đang chạy"],
      ["Ưu đãi đặt sớm", "Giảm 12% trước ngày nhận phòng 30 ngày", "Đang chạy"],
      ["Khách quay lại", "Voucher 300.000 ₫ cho thành viên", "Bản nháp"],
    ],
  },
  loyalty: {
    title: "Khách hàng thân thiết",
    description:
      "Theo dõi thành viên, hạng khách và hiệu quả ưu đãi dành cho khách quay lại.",
    action: "Tạo ưu đãi thành viên",
    summary: "1.284 thành viên",
    icon: UsersRound,
    rows: [
      ["Hạng Riverside", "842 thành viên · 1–2 kỳ lưu trú", "Hoạt động"],
      ["Hạng Signature", "356 thành viên · 3–5 kỳ lưu trú", "Hoạt động"],
      ["Hạng Ambassador", "86 thành viên · trên 5 kỳ lưu trú", "Ưu tiên"],
    ],
  },
  "ai-brand": {
    title: "Giọng thương hiệu AI",
    description:
      "Thiết lập cách StayReco hỗ trợ soạn nội dung và phản hồi khách hàng theo phong cách của khách sạn.",
    action: "Lưu cấu hình AI",
    summary: "Prototype",
    icon: Sparkles,
    rows: [
      ["Phong cách giao tiếp", "Ấm áp, tinh tế và am hiểu địa phương", "Đã thiết lập"],
      ["Ngôn ngữ ưu tiên", "Tiếng Việt · Tiếng Anh", "Đã thiết lập"],
      ["Kênh áp dụng", "Mô tả phòng · phản hồi đánh giá", "Chưa kết nối"],
    ],
  },
  staff: {
    title: "Nhân viên & phân quyền",
    description:
      "Quản lý tài khoản nhân sự, vai trò vận hành và phạm vi quyền tại cơ sở.",
    action: "Mời nhân viên",
    summary: "18 nhân sự",
    icon: UserCog,
    rows: [
      ["Nguyễn Minh Anh", "Quản lý cơ sở · toàn quyền vận hành", "Đang hoạt động"],
      ["Lê Thảo Vy", "Trưởng ca lễ tân · booking và check-in", "Đang hoạt động"],
      ["Trần Gia Hân", "Kế toán · doanh thu và đối soát", "Đang hoạt động"],
    ],
  },
};
