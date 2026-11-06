import { ChartNoAxesCombined } from "lucide-react";
import { PartnerUnavailable } from "../components/PartnerUnavailable";

export default function PartnerRevenue() {
  return (
    <PartnerUnavailable
      title="Doanh thu & đối soát"
      description="Doanh thu thực nhận, phí nền tảng, hoàn tiền và các kỳ đối soát của khách sạn."
      phase="Phase 6: Báo cáo & quản trị"
      icon={ChartNoAxesCombined}
      upcoming={[
        "Biết chính xác số tiền thực nhận mỗi kỳ, sau phí nền tảng và hoàn tiền",
        "Đối chiếu từng kỳ thanh toán và tải chứng từ cho kế toán",
        "So sánh doanh thu giữa các tháng để lên kế hoạch giá",
      ]}
    />
  );
}
