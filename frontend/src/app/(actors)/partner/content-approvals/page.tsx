import { Suspense } from "react";
import PartnerContentApprovals from "@/features/partner/content-approvals/PartnerContentApprovals";

export default function Page() {
  return (
    <Suspense>
      <PartnerContentApprovals />
    </Suspense>
  );
}
