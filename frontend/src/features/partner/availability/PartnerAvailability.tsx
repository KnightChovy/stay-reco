import { CalendarDays } from "lucide-react";
import { PartnerUnavailable } from "../components/PartnerUnavailable";

export default function PartnerAvailability() {
  return (
    <PartnerUnavailable
      title="Lịch tồn & khả dụng"
      description="Số phòng mở bán theo ngày và theo loại phòng."
      phase="Phase 2: Tìm kiếm & đặt phòng"
      icon={CalendarDays}
      upcoming={[
        "Tồn phòng và giá theo từng ngày",
        "Số phòng đã giữ chỗ và đã đặt",
      ]}
    />
  );
}
