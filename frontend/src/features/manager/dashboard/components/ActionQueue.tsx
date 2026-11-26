"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Banknote, Flag, ShieldAlert, UserX, type LucideIcon } from "lucide-react";
import type { PlatformOverview } from "@stayreco/shared";
import { cn } from "@/lib/utils";
import { ManagerPanel } from "../../components";
import { formatMoney, formatWaiting } from "../../lib/labels";

type Tone = "clear" | "warning" | "danger";

type QueueItem = {
  title: string;
  count: number;
  detail: string;
  icon: LucideIcon;
  tone: Tone;
  href?: string;
  note?: string;
};

const toneClasses: Record<Tone, { icon: string; count: string }> = {
  clear: { icon: "bg-success-soft text-success", count: "text-muted-foreground" },
  warning: { icon: "bg-warning-soft text-warning", count: "text-foreground" },
  danger: { icon: "bg-danger-soft text-danger", count: "text-danger" },
};

function waiting(iso: string | null, prefix: string) {
  return iso ? `${prefix} ${formatWaiting(iso)}` : "Không có việc đang chờ";
}

export function ActionQueue({ queue }: { queue: PlatformOverview["queue"] }) {
  const { verifications, payouts, contentReports, complianceCases, suspensionRequests } = queue;

  const items: QueueItem[] = [
    {
      title: "Hồ sơ xác minh",
      count: verifications.pending,
      detail: waiting(verifications.oldestSubmittedAt, "Cũ nhất đã chờ"),
      icon: BadgeCheck,
      tone: verifications.pending > 0 ? "warning" : "clear",
      href: "/manager/verifications",
    },
    {
      title: "Yêu cầu rút tiền",
      count: payouts.pending,
      detail:
        payouts.pending > 0
          ? `${formatMoney(payouts.amount)}${payouts.overdue > 0 ? ` · ${payouts.overdue} quá hạn` : ""}`
          : "Không có việc đang chờ",
      icon: Banknote,
      tone: payouts.overdue > 0 ? "danger" : payouts.pending > 0 ? "warning" : "clear",
      href: "/manager/payouts",
    },
    {
      title: "Báo cáo nội dung",
      count: contentReports.open,
      detail: waiting(contentReports.oldestCreatedAt, "Cũ nhất đã mở"),
      icon: Flag,
      tone: contentReports.open > 0 ? "warning" : "clear",
      note: "Màn hình xử lý sắp có",
    },
    {
      title: "Hồ sơ vi phạm",
      count: complianceCases.open,
      detail:
        complianceCases.open > 0
          ? complianceCases.critical > 0
            ? `${complianceCases.critical} hồ sơ nghiêm trọng`
            : "Không có hồ sơ nghiêm trọng"
          : "Không có hồ sơ đang mở",
      icon: ShieldAlert,
      tone: complianceCases.critical > 0 ? "danger" : complianceCases.open > 0 ? "warning" : "clear",
      note: "Màn hình xử lý sắp có",
    },
    {
      title: "Đề nghị tạm ngưng",
      count: suspensionRequests.pending,
      detail: suspensionRequests.pending > 0 ? "Đang chờ admin quyết định" : "Không có đề nghị đang chờ",
      icon: UserX,
      tone: suspensionRequests.pending > 0 ? "warning" : "clear",
    },
  ];

  return (
    <section aria-labelledby="queue-heading" className="space-y-3">
      <h2 id="queue-heading" className="font-bold text-primary">
        Việc cần xử lý
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {items.map((item) => (
          <li key={item.title}>
            <QueueCard item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function QueueCard({ item }: { item: QueueItem }) {
  const Icon = item.icon;
  const tone = toneClasses[item.tone];
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", tone.icon)}>
          <Icon size={20} aria-hidden />
        </span>
        <strong className={cn("text-3xl font-bold tabular-nums", tone.count)}>{item.count}</strong>
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground">{item.title}</p>
      <p className={cn("text-xs", item.tone === "danger" ? "font-semibold text-danger" : "text-muted-foreground")}>
        {item.detail}
      </p>
      {item.href ? (
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
          Mở danh sách
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      ) : (
        item.note && <span className="mt-3 block text-xs text-muted-foreground">{item.note}</span>
      )}
    </>
  );

  if (item.href) {
    return (
      <Link
        href={item.href}
        className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ManagerPanel className="h-full p-4 transition-shadow group-hover:shadow-md">{body}</ManagerPanel>
      </Link>
    );
  }
  return <ManagerPanel className="h-full p-4">{body}</ManagerPanel>;
}
