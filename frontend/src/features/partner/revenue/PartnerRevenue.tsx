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
        "Doanh thu theo kỳ sau phí nền tảng và hoàn tiền",
        "Các kỳ đối soát và chứng từ",
        "Dashboard số liệu cho đối tác",
      ]}
    />
  );
}
