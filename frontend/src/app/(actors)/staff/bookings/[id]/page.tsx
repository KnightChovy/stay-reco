import { StaffBookingDetail } from "@/features/staff/bookings/StaffBookingDetail";

export default async function StaffBookingDetailPage({
  params,
}: PageProps<"/staff/bookings/[id]">) {
  const { id } = await params;
  return <StaffBookingDetail bookingId={id} />;
}
