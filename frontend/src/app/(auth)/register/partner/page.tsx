import type { Metadata } from "next";
import PartnerRegister from "@/features/auth/PartnerRegister";

export const metadata: Metadata = {
  title: "Đăng ký đối tác | StayReco",
  description: "Đưa khách sạn của bạn lên StayReco: tạo tài khoản đối tác, thêm khách sạn và gửi hồ sơ xác minh.",
};

export default function Page() {
  return <PartnerRegister />;
}
