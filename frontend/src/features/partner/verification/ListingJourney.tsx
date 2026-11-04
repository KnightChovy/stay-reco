"use client";

import Link from "next/link";
import { Check, TriangleAlert } from "lucide-react";
import type { Hotel, VerificationRequest } from "@stayreco/shared";
import { cn } from "@/lib/utils";
import { PartnerPanel } from "../components";
import { useHotelSetupSteps } from "../hotel/HotelSetupChecklist";

type StageState = "done" | "current" | "attention" | "todo";

type Stage = {
  title: string;
  detail: string;
  state: StageState;
  href?: string;
};

/** Where the hotel stands on the way from draft to selling, derived from its status and the latest request. */
function buildStages(
  hotel: Hotel,
  latest: VerificationRequest | undefined,
  setupDone: number,
  setupTotal: number,
): Stage[] {
  const isActive = hotel.status === "ACTIVE";
  const setupComplete = setupDone === setupTotal || isActive;
  const submitted = !!latest || hotel.status !== "DRAFT";
  const reviewState: StageState =
    latest?.status === "APPROVED" || isActive
      ? "done"
      : latest?.status === "PENDING"
        ? "current"
        : latest?.status === "NEEDS_REVISION" || latest?.status === "REJECTED"
          ? "attention"
          : "todo";

  const stages: Stage[] = [
    { title: "Tạo khách sạn", detail: "Đã tạo bản nháp", state: "done" },
    {
      title: "Hoàn thiện thông tin",
      detail: setupComplete
        ? "Đã đủ thông tin"
        : `${setupDone}/${setupTotal} mục đã xong`,
      state: setupComplete ? "done" : "todo",
      href: setupComplete ? undefined : "/partner/hotel",
    },
    {
      title: "Gửi hồ sơ",
      detail: submitted ? "Đã gửi" : "Điền hồ sơ bên dưới",
      state: submitted ? "done" : "todo",
    },
    {
      title: "Thẩm định",
      detail:
        reviewState === "done"
          ? "Đã duyệt"
          : reviewState === "current"
            ? "Đang chờ StayReco"
            : reviewState === "attention"
              ? "Cần bổ sung"
              : "1–3 ngày làm việc",
      state: reviewState,
    },
    {
      title: "Mở bán",
      detail: isActive
        ? "Đang hiển thị với khách"
        : hotel.status === "SUSPENDED"
          ? "Đang tạm ngưng"
          : "Sau khi được duyệt",
      state: isActive
        ? "done"
        : hotel.status === "SUSPENDED"
          ? "attention"
          : "todo",
    },
  ];

  // The first unfinished stage is the one the partner works on now.
  const next = stages.find((stage) => stage.state === "todo");
  if (next && !stages.some((stage) => stage.state === "current" || stage.state === "attention")) {
    next.state = "current";
  }
  return stages;
}

export function ListingJourney({
  hotel,
  latest,
}: {
  hotel: Hotel;
  latest: VerificationRequest | undefined;
}) {
  const setupSteps = useHotelSetupSteps(hotel);
  const stages = buildStages(
    hotel,
    latest,
    setupSteps.filter((step) => step.done).length,
    setupSteps.length,
  );
  const doneCount = stages.filter((stage) => stage.state === "done").length;

  return (
    <PartnerPanel className="p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-primary">Hành trình mở bán</h2>
        <span className="text-xs font-semibold text-muted-foreground">
          {doneCount}/{stages.length} bước
        </span>
      </div>
      <ol className="grid gap-3 sm:grid-cols-5 sm:gap-2">
        {stages.map((stage, index) => {
          const body = (
            <>
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ring-4",
                  stage.state === "done" &&
                    "bg-success text-white ring-success-soft",
                  stage.state === "current" &&
                    "bg-primary text-primary-foreground ring-primary/15",
                  stage.state === "attention" &&
                    "bg-danger text-white ring-danger-soft",
                  stage.state === "todo" &&
                    "bg-muted text-muted-foreground ring-transparent",
                )}
              >
                {stage.state === "done" ? (
                  <Check size={15} />
                ) : stage.state === "attention" ? (
                  <TriangleAlert size={14} />
                ) : (
                  index + 1
                )}
              </span>
              <span className="min-w-0">
                <strong
                  className={cn(
                    "block text-sm",
                    stage.state === "todo"
                      ? "text-muted-foreground"
                      : "text-primary",
                  )}
                >
                  {stage.title}
                </strong>
                <span
                  className={cn(
                    "block text-xs",
                    stage.state === "attention"
                      ? "font-semibold text-danger"
                      : "text-muted-foreground",
                    stage.href && "underline underline-offset-2",
                  )}
                >
                  {stage.detail}
                </span>
              </span>
            </>
          );
          return (
            <li
              key={stage.title}
              aria-current={stage.state === "current" ? "step" : undefined}
              className="relative"
            >
              {/* The connector to the next stage, drawn on wide screens where the stages sit in one row. */}
              {index < stages.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-4 left-10 hidden h-0.5 w-[calc(100%-2.5rem)] sm:block",
                    stage.state === "done" ? "bg-success" : "bg-border",
                  )}
                />
              )}
              {stage.href ? (
                <Link
                  href={stage.href}
                  className="relative flex items-center gap-3 rounded-lg sm:flex-col sm:items-start sm:gap-2 hover:[&_strong]:underline"
                >
                  {body}
                </Link>
              ) : (
                <div className="relative flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </PartnerPanel>
  );
}
