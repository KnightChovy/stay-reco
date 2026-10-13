import {
  BadgeCheck,
  Building2,
  ChartNoAxesCombined,
  CircleDollarSign,
  Landmark,
  ShieldAlert,
  TriangleAlert,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

export type ManagerMode =
  | "dashboard"
  | "partners"
  | "verifications"
  | "compliance"
  | "revenue"
  | "cashflow"
  | "transactions";

export type ManagerWorkspaceMode = Exclude<ManagerMode, "dashboard">;

export type ManagerWorkspaceRow = [name: string, detail: string, state: string];

export type ManagerWorkspace = {
  title: string;
  description: string;
  action: string;
  summary: string;
  icon: LucideIcon;
  rows: ManagerWorkspaceRow[];
};

export type ManagerDashboardMetric = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone: "primary" | "accent" | "warning" | "danger";
};

export type ManagerDashboardSignal = [
  time: string,
  type: string,
  subject: string,
  description: string,
  severity: string,
  owner: string,
];

export const managerDashboardMetrics: ManagerDashboardMetric[] = [
  {
    label: "ĐỐI TÁC ĐANG HOẠT ĐỘNG",
    value: "248",
    hint: "+12 đối tác so với tháng trước",
    icon: Building2,
    tone: "primary",
  },
  {
    label: "HỒ SƠ CHỜ XÁC MINH",
    value: "12",
    hint: "4 hồ sơ sắp vượt SLA",
    icon: BadgeCheck,
    tone: "warning",
  },
  {
    label: "GMV TRONG 30 NGÀY",
    value: "8,55 tỷ ₫",
    hint: "+8,4% so với chu kỳ trước",
    icon: CircleDollarSign,
    tone: "accent",
  },
  {
    label: "CẢNH BÁO RỦI RO",
    value: "3",
    hint: "1 trường hợp cần xử lý ngay",
    icon: TriangleAlert,
    tone: "danger",
  },
];

export const managerDashboardChartHeights = [
  52, 68, 59, 82, 74, 91, 78, 96, 86, 89, 94, 83,
];

export const managerDashboardRegions: Array<
  [region: string, value: string, change: string]
> = [
  ["Miền Bắc", "2,94 tỷ ₫", "+8,2%"],
  ["Miền Trung", "3,28 tỷ ₫", "+12,4%"],
  ["Miền Nam", "2,33 tỷ ₫", "−3,1%"],
];

export const managerDashboardQueue: Array<
  [title: string, detail: string, action: string]
> = [
  [
    "Hồ sơ Sunbay Resort sắp vượt SLA",
    "Còn 01 giờ 42 phút để hoàn tất bước xác minh pháp lý.",
    "Mở hồ sơ",
  ],
  [
    "Đối soát giao dịch SR-20261024-081",
    "Chênh lệch 12.400.000 ₫ giữa cổng thanh toán và sổ đối tác.",
    "Kiểm tra",
  ],
  [
    "Cảnh báo chất lượng An Nhiên Riverside",
    "Điểm CSAT giảm dưới ngưỡng vận hành trong 7 ngày gần nhất.",
    "Phân công",
  ],
];

export const managerDashboardSignalColumns = [
  "Thời gian",
  "Loại tín hiệu",
  "Đối tượng",
  "Nội dung",
  "Mức độ",
  "Phụ trách",
];

export const managerDashboardSignals: ManagerDashboardSignal[] = [
  [
    "10:42",
    "Xác minh",
    "Sunbay Resort",
    "Hồ sơ pháp lý sắp vượt SLA",
    "Cần xử lý",
    "Ngọc Anh",
  ],
  [
    "10:18",
    "Thanh toán",
    "SR-20261024-081",
    "Phát hiện chênh lệch số tiền đối soát",
    "Cảnh báo",
    "Tài chính",
  ],
  [
    "09:56",
    "Chất lượng",
    "An Nhiên Riverside",
    "CSAT 7 ngày giảm còn 4,1/5",
    "Cảnh báo",
    "Thu Hà",
  ],
  [
    "09:31",
    "Đối tác",
    "Maison Central",
    "Hoàn tất kích hoạt cơ sở mới",
    "Ổn định",
    "Minh Quân",
  ],
  [
    "09:08",
    "Thanh toán",
    "Phiên PAY-1024-A",
    "Đã hoàn tất giải ngân cho 18 đối tác",
    "Ổn định",
    "Tài chính",
  ],
  [
    "08:47",
    "Tuân thủ",
    "Ocean Pearl Hotel",
    "Giấy phép kinh doanh còn 14 ngày hiệu lực",
    "Cần xử lý",
    "Lan Chi",
  ],
  [
    "08:25",
    "Xác minh",
    "The Mellow House",
    "Đã bổ sung đủ tài liệu người đại diện",
    "Ổn định",
    "Ngọc Anh",
  ],
  [
    "08:03",
    "Chất lượng",
    "Green Field Đà Lạt",
    "Tỷ lệ phản hồi đánh giá dưới 80%",
    "Cảnh báo",
    "Thu Hà",
  ],
];

export const managerWorkspaces: Record<ManagerWorkspaceMode, ManagerWorkspace> =
  {
    partners: {
      title: "Đối tác khách sạn",
      description:
        "Theo dõi trạng thái hoạt động, hiệu suất và sức khỏe vận hành của toàn bộ mạng lưới đối tác.",
      action: "Thêm đối tác",
      summary: "248 đối tác",
      icon: Building2,
      rows: [
        ["An Nhiên Riverside", "Đà Nẵng · 86 phòng", "Đang hoạt động"],
        ["Sunbay Resort", "Phú Quốc · 142 phòng", "Cần bổ sung"],
        ["Maison Central", "Hà Nội · 54 phòng", "Mới kích hoạt"],
      ],
    },
    verifications: {
      title: "Xác minh đối tác",
      description:
        "Kiểm duyệt hồ sơ pháp lý, thông tin thụ hưởng và tiêu chuẩn cơ sở trước khi kích hoạt.",
      action: "Tạo yêu cầu xác minh",
      summary: "12 hồ sơ chờ",
      icon: BadgeCheck,
      rows: [
        ["Sunbay Resort", "Thiếu xác nhận tài khoản thụ hưởng", "Cần bổ sung"],
        ["The Mellow House", "Đã nhận đủ tài liệu đại diện", "Chờ duyệt"],
        [
          "Lotus Boutique Huế",
          "Đang đối chiếu giấy phép kinh doanh",
          "Kiểm tra",
        ],
      ],
    },
    compliance: {
      title: "Tuân thủ & chất lượng",
      description:
        "Giám sát giấy phép, tiêu chuẩn dịch vụ và các tín hiệu rủi ro trong mạng lưới.",
      action: "Tạo đợt kiểm tra",
      summary: "3 cảnh báo",
      icon: ShieldAlert,
      rows: [
        ["Ocean Pearl Hotel", "Giấy phép còn 14 ngày hiệu lực", "Cảnh báo"],
        ["Green Field Đà Lạt", "Tỷ lệ phản hồi đánh giá dưới 80%", "Theo dõi"],
        ["An Nhiên Riverside", "CSAT 7 ngày giảm còn 4,1/5", "Kiểm tra"],
      ],
    },
    revenue: {
      title: "Doanh thu nền tảng",
      description:
        "Theo dõi GMV, doanh thu hoa hồng và hiệu suất tài chính theo khu vực.",
      action: "Tạo báo cáo doanh thu",
      summary: "8,55 tỷ ₫",
      icon: ChartNoAxesCombined,
      rows: [
        ["Miền Bắc", "GMV 2,94 tỷ ₫ · tăng 8,2%", "Đạt kế hoạch"],
        ["Miền Trung", "GMV 3,28 tỷ ₫ · tăng 12,4%", "Vượt kế hoạch"],
        ["Miền Nam", "GMV 2,33 tỷ ₫ · giảm 3,1%", "Theo dõi"],
      ],
    },
    cashflow: {
      title: "Dòng tiền & đối soát",
      description:
        "Quản lý các phiên đối soát, khoản ký quỹ và lịch giải ngân cho đối tác.",
      action: "Tạo phiên đối soát",
      summary: "3,82 tỷ ₫",
      icon: Landmark,
      rows: [
        ["Phiên PAY-1024-A", "18 đối tác · 1,24 tỷ ₫", "Đã hoàn tất"],
        ["Phiên PAY-1024-B", "26 đối tác · 1,68 tỷ ₫", "Đang xử lý"],
        ["Phiên PAY-1024-C", "14 đối tác · 902 triệu ₫", "Chờ duyệt"],
      ],
    },
    transactions: {
      title: "Giao dịch & quyết toán",
      description:
        "Tra cứu giao dịch đặt phòng, phí nền tảng, hoàn tiền và trạng thái quyết toán.",
      action: "Tạo yêu cầu xử lý",
      summary: "1.284 giao dịch",
      icon: WalletCards,
      rows: [
        [
          "SR-20261024-081",
          "12.400.000 ₫ · An Nhiên Riverside",
          "Cần đối soát",
        ],
        ["SR-20261024-080", "8.750.000 ₫ · Maison Central", "Đã quyết toán"],
        ["SR-20261024-079", "21.600.000 ₫ · Sunbay Resort", "Chờ giải ngân"],
      ],
    },
  };

export const managerAdditionalRows: Record<
  ManagerWorkspaceMode,
  ManagerWorkspaceRow[]
> = {
  partners: [
    ["Ocean Pearl Hotel", "Nha Trang · 104 phòng", "Đang hoạt động"],
    ["Green Field Đà Lạt", "Đà Lạt · 42 phòng", "Theo dõi"],
    ["Lotus Boutique Huế", "Huế · 38 phòng", "Đang hoạt động"],
  ],
  verifications: [
    ["Ocean Pearl Hotel", "Chờ gia hạn giấy phép", "Cần bổ sung"],
    ["Green Field Đà Lạt", "Đã xác minh tài khoản ngân hàng", "Chờ duyệt"],
    ["Maison Central", "Hoàn tất thẩm định cơ sở", "Đã duyệt"],
  ],
  compliance: [
    ["Sunbay Resort", "Đã cập nhật quy trình PCCC", "Đã hoàn tất"],
    ["Maison Central", "Kiểm tra định kỳ quý IV", "Theo dõi"],
    ["Lotus Boutique Huế", "Không có vi phạm đang mở", "Ổn định"],
  ],
  revenue: [
    ["Hà Nội", "GMV 1,42 tỷ ₫ · tăng 7,9%", "Đạt kế hoạch"],
    ["Đà Nẵng", "GMV 1,18 tỷ ₫ · tăng 15,2%", "Vượt kế hoạch"],
    ["TP. Hồ Chí Minh", "GMV 1,67 tỷ ₫ · giảm 1,8%", "Theo dõi"],
  ],
  cashflow: [
    ["Phiên PAY-1023-C", "22 đối tác · 1,05 tỷ ₫", "Đã hoàn tất"],
    ["Phiên PAY-1023-B", "16 đối tác · 786 triệu ₫", "Đã hoàn tất"],
    ["Phiên PAY-1023-A", "19 đối tác · 948 triệu ₫", "Đã hoàn tất"],
  ],
  transactions: [
    ["SR-20261024-078", "6.920.000 ₫ · Ocean Pearl Hotel", "Đã quyết toán"],
    ["SR-20261024-077", "15.300.000 ₫ · Green Field Đà Lạt", "Kiểm tra"],
    ["SR-20261024-076", "9.480.000 ₫ · Lotus Boutique Huế", "Đã quyết toán"],
  ],
};

export const managerWorkspaceTableHeads: Record<
  ManagerWorkspaceMode,
  string[]
> = {
  partners: [
    "Đối tác / Hồ sơ",
    "Thông tin theo dõi",
    "Trạng thái",
    "SLA",
    "Thao tác",
  ],
  verifications: [
    "Đối tác / Hồ sơ",
    "Thông tin theo dõi",
    "Trạng thái",
    "SLA",
    "Thao tác",
  ],
  compliance: [
    "Đối tác / Hồ sơ",
    "Thông tin theo dõi",
    "Trạng thái",
    "SLA",
    "Thao tác",
  ],
  revenue: ["Khu vực / Phiên", "Giá trị", "Trạng thái", "Cập nhật", "Thao tác"],
  cashflow: [
    "Khu vực / Phiên",
    "Giá trị",
    "Trạng thái",
    "Cập nhật",
    "Thao tác",
  ],
  transactions: ["Giao dịch", "Chi tiết", "Trạng thái", "SLA", "Thao tác"],
};

export const managerQueueSummary: Array<
  [label: string, value: string, tone: string]
> = [
  ["Cần xử lý ngay", "3", "text-danger"],
  ["Sắp vượt SLA", "4", "text-warning"],
  ["Đã hoàn tất hôm nay", "28", "text-success"],
];
