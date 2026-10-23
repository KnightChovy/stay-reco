import { Percent } from "lucide-react";
import { PartnerUnavailable } from "../components/PartnerUnavailable";

export default function PartnerPromotions() {
  return (
    <PartnerUnavailable
      title="Chiến dịch & giảm giá"
      description="Ưu đãi và mã giảm giá áp dụng cho booking của khách sạn."
      phase="Phase 4: Thân thiết, khuyến mãi & đánh giá"
      icon={Percent}
      upcoming={[
        "Tạo chiến dịch khuyến mãi và mã giảm giá",
        "Theo dõi lượt sử dụng ưu đãi",
      ]}
    />
  );
}
