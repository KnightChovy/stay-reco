import { Tags } from "lucide-react";
import { PartnerUnavailable } from "../components/PartnerUnavailable";

export default function PartnerPricing() {
  return (
    <PartnerUnavailable
      title="Luật giá & mùa vụ"
      description="Giá theo ngày và quy tắc điều chỉnh theo mùa dựa trên giá cơ bản của loại phòng."
      phase="Phase 2: Tìm kiếm & đặt phòng"
      icon={Tags}
      upcoming={[
        "Giá theo ngày cho từng loại phòng",
        "Luật giá theo mùa áp dụng trên giá cơ bản",
      ]}
    />
  );
}
