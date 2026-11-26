import { Suspense } from "react";
import { FacebookCallback } from "@/features/staff/marketing/FacebookCallback";

/** Facebook's return page (`META_OAUTH_REDIRECT_URI`); the staff shell is already around it. */
export default function Page() {
  return (
    <Suspense>
      <FacebookCallback />
    </Suspense>
  );
}
