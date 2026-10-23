import { BookOpenCheck } from "lucide-react";
import { PartnerUnavailable } from "../components/PartnerUnavailable";

export default function PartnerBookings() {
  return (
    <PartnerUnavailable
      title="Đặt phòng"
      description="Theo dõi vòng đời booking của khách sạn: xác nhận, check-in, lưu trú và hoàn tất."
      phase="Phase 3: Vận hành khách sạn"
      icon={BookOpenCheck}
      upcoming={[
        "Danh sách booking theo khách sạn, lọc theo trạng thái và ngày",
        "Check-in, check-out và gán phòng",
        "Yêu cầu hoàn tiền và duyệt hoàn tiền",
      ]}
    />
  );
}
