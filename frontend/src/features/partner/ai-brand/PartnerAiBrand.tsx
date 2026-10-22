import { Sparkles } from "lucide-react";
import { PartnerUnavailable } from "../components/PartnerUnavailable";

export default function PartnerAiBrand() {
  return (
    <PartnerUnavailable
      title="Giọng thương hiệu AI"
      description="Phong cách nội dung AI dùng khi soạn mô tả và phản hồi khách thay cho khách sạn."
      phase="Phase 5: AI gợi ý & marketing"
      icon={Sparkles}
      upcoming={[
        "Thiết lập giọng thương hiệu cho AI",
        "Lịch và nội dung marketing",
      ]}
    />
  );
}
