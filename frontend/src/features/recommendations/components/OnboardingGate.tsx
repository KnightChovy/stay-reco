"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth-store";
import { useOnboarding } from "../api/recommendation-queries";
import { OnboardingDialog } from "./OnboardingDialog";

/** Pages where a dialog would get in the way of something the customer is in the middle of. */
const QUIET_PATHS = ["/booking", "/login", "/register", "/verify-email", "/reset-password", "/forgot-password"];

/**
 * Shows the first-login preferences dialog once to a customer whose onboarding is `NEW` (docs/api/onboarding.md).
 * Mounted by the site Header, so it appears on the first customer page after signing in.
 */
export function OnboardingGate() {
  const isCustomer = useAuthStore((state) => state.user?.role === "customer");
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const pathname = usePathname();
  const quiet = QUIET_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const query = useOnboarding(hasHydrated && isCustomer);
  const [closed, setClosed] = useState(false);
  // Opened while NEW; once open it stays until the customer closes it, so the voucher shows after finishing.
  const [opened, setOpened] = useState(false);

  const onboarding = query.data;
  if (!onboarding || closed) return null;
  if (!opened && (onboarding.status !== "NEW" || quiet)) return null;
  if (!opened) setOpened(true);

  return <OnboardingDialog onboarding={onboarding} open onClose={() => setClosed(true)} />;
}

/**
 * The way back for a customer who skipped: an offer on /account/preferences that opens the same dialog. Finishing it
 * still earns the welcome voucher. Nothing is shown once it is completed.
 */
export function OnboardingOffer() {
  const isCustomer = useAuthStore((state) => state.user?.role === "customer");
  const query = useOnboarding(isCustomer);
  const [open, setOpen] = useState(false);
  const onboarding = query.data;
  if (!onboarding || (onboarding.status === "COMPLETED" && !open)) return null;

  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Gift className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold text-foreground">Nhận voucher chào mừng</p>
            <p className="text-sm text-muted-foreground">
              Trả lời vài câu về chuyến đi bạn thích (khoảng 1 phút) để nhận mã giảm giá cho lần đặt phòng tới.
            </p>
          </div>
        </div>
        <Button type="button" className="h-10 shrink-0 px-5" onClick={() => setOpen(true)}>
          Bắt đầu
        </Button>
      </div>
      {open && <OnboardingDialog onboarding={onboarding} open onClose={() => setOpen(false)} />}
    </>
  );
}
