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
 * Shows the first-login preferences dialog to a customer whose onboarding is `NEW` (docs/api/onboarding.md), and
 * keeps it until they finish: it cannot be skipped, since the recommendations of a customer with no stays start from
 * these answers. Mounted by the site Header, so it appears on the first customer page after signing in.
 */
export function OnboardingGate() {
  const accountId = useAuthStore((state) => state.user?.id ?? null);
  const pathname = usePathname();
  const quiet = QUIET_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const query = useOnboarding();
  // Both remember which account they were about, so a sign-out and another sign-in on this tab starts over.
  const [closedFor, setClosedFor] = useState<string | null>(null);
  // Opened while NEW; once open it stays until the customer closes it, so the voucher shows after finishing.
  const [openedFor, setOpenedFor] = useState<string | null>(null);

  const onboarding = query.data;
  if (!onboarding || !accountId || closedFor === accountId) return null;
  const opened = openedFor === accountId;
  if (!opened && (onboarding.status !== "NEW" || quiet)) return null;
  if (!opened) setOpenedFor(accountId);

  return (
    // Keyed by account so the dialog's picks and step never carry over to another customer.
    <OnboardingDialog key={accountId} onboarding={onboarding} open required onClose={() => setClosedFor(accountId)} />
  );
}

/**
 * The way back for a customer who skipped: an offer on /account/preferences that opens the same dialog. Finishing it
 * still earns the welcome voucher. Nothing is shown once it is completed.
 */
export function OnboardingOffer() {
  const query = useOnboarding();
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
