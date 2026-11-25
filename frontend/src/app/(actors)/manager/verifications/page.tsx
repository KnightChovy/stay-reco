import { Suspense } from "react";
import ManagerVerifications from "@/features/manager/verifications/ManagerVerifications";

export default function Page() {
  // ManagerVerifications reads the header search (`?search=`) from useSearchParams.
  return (
    <Suspense>
      <ManagerVerifications />
    </Suspense>
  );
}
