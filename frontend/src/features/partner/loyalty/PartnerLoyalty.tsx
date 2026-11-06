import { UsersRound } from "lucide-react";
import { PartnerUnavailable } from "../components/PartnerUnavailable";

export default function PartnerLoyalty() {
  return (
    <PartnerUnavailable
      title="Khách hàng thân thiết"
      description="Chương trình điểm thưởng và hạng thành viên của khách sạn."
      phase="Phase 4: Thân thiết, khuyến mãi & đánh giá"
      icon={UsersRound}
      upcoming={[
        "Giữ chân khách quen bằng điểm thưởng và hạng thành viên",
        "Nhận biết khách quay lại để chăm sóc tốt hơn",
      ]}
    />
  );
}
