import { Suspense } from "react";
import ManagerCompliance from "@/features/manager/compliance/ManagerCompliance";

export default function Page() {
  return (
    <Suspense>
      <ManagerCompliance />
    </Suspense>
  );
}
