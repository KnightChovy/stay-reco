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
        "Tạo mã giảm giá để lấp phòng trống vào mùa thấp điểm",
        "Xem mỗi ưu đãi mang về bao nhiêu booking",
      ]}
    />
  );
}
