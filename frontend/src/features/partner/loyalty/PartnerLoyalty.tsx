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
        "Chương trình khách hàng thân thiết theo khách sạn",
        "Thành viên và điểm thưởng",
      ]}
    />
  );
}
