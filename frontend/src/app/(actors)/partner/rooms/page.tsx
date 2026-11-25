import { Suspense } from "react";
import PartnerRooms from "@/features/partner/rooms/PartnerRooms";

export default function Page() {
  // PartnerRooms reads the opening status filter from useSearchParams.
  return (
    <Suspense>
      <PartnerRooms />
    </Suspense>
  );
}
