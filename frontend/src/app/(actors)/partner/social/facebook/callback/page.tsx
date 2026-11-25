import { Suspense } from "react";
import FacebookCallback from "@/features/partner/ai-brand/FacebookCallback";

export default function Page() {
  return (
    <Suspense>
      <FacebookCallback />
    </Suspense>
  );
}
