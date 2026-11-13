"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle2, Loader2, Send, XCircle } from "lucide-react";
import type { ContentSchedule, MarketingContent, SocialAccount } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DateInput, TimeSelect } from "@/features/partner/components/DateTimeInputs";
import { todayInVietnam } from "@/features/partner/lib/dates";
import { formatDateTime } from "@/features/stays/lib/format";
import { useCancelSchedule, useScheduleContent, useSchedules, useSocialAccounts } from "../api/marketing-queries";
import { platformLabels, SCHEDULABLE_STATUSES } from "../lib/marketing-labels";
import { getMarketingErrorMessage } from "../lib/marketing-errors";
import { PlatformPill, ScheduleStatusPill } from "./MarketingParts";

/** "YYYY-MM-DD" + "HH:mm" picked in Vietnam time → the ISO instant the API takes. */
function toInstant(date: string, time: string) {
  return new Date(`${date}T${time}:00+07:00`).toISOString();
}

function AccountOption({
  account,
  selected,
  disabledReason,
  onSelect,
}: {
  account: SocialAccount;
  selected: boolean;
  disabledReason: string | null;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={!!disabledReason}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-lg border p-3 text-left transition",
        selected ? "border-[#934a33] bg-[#F5EBE5]/60" : "border-slate-200 bg-white hover:border-[#934a33]/40",
        disabledReason && "cursor-not-allowed opacity-60 hover:border-slate-200",
      )}
    >
      <span className="min-w-0 space-y-0.5">
        <span className="flex items-center gap-2">
          <PlatformPill platform={account.platform} />
          <span className="truncate font-mono text-xs text-slate-700">{account.accountName}</span>
        </span>
        <span className="block text-[11px] text-slate-500">
          {disabledReason ?? (account.expiresAt ? `Token hết hạn ${formatDateTime(account.expiresAt)}` : "Đang kết nối")}
        </span>
      </span>
      <span
        aria-hidden
        className={cn(
          "size-4 shrink-0 rounded-full border-2",
          selected ? "border-[#934a33] bg-[#934a33]" : "border-slate-300",
        )}
      />
    </button>
  );
}

function ScheduleRow({ schedule }: { schedule: ContentSchedule }) {
  const cancel = useCancelSchedule();
  return (
    <li className="space-y-1.5 rounded-lg border border-slate-200 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <PlatformPill platform={schedule.platform} />
          <ScheduleStatusPill status={schedule.status} />
        </span>
        {schedule.status === "SCHEDULED" && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-xs text-red-600 hover:text-red-700"
            disabled={cancel.isPending}
            onClick={() => cancel.mutate(schedule.id)}
          >
            {cancel.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <XCircle className="size-3.5" />} Huỷ lịch
          </Button>
        )}
      </div>
      <p className="text-[11px] text-slate-500">
        {schedule.publishedAt
          ? `Đã đăng lúc ${formatDateTime(schedule.publishedAt)}`
          : schedule.scheduledAt
            ? `Hẹn đăng ${formatDateTime(schedule.scheduledAt)}`
            : "Đăng ở lượt chạy kế tiếp (trong vòng 1 phút)"}
      </p>
      {schedule.failureReason && (
        <p className="rounded bg-red-50 px-2 py-1 text-[11px] text-red-700">Lý do: {schedule.failureReason}</p>
      )}
      {schedule.status === "PUBLISHED" && (
        <Link href={`/staff/marketing/analytics?schedule=${schedule.id}`} className="text-[11px] font-semibold text-[#934a33] hover:underline">
          Xem hiệu quả bài đăng
        </Link>
      )}
      {cancel.error && <p className="text-[11px] text-red-600">{getMarketingErrorMessage(cancel.error)}</p>}
    </li>
  );
}

/**
 * Puts approved content on the calendar (`POST /marketing-content/:id/schedule`) and lists where it already goes.
 * Pages are connected by the owner; staff only pick one. There is no publish-now endpoint: "Đăng ngay" schedules for
 * the next run of the publisher (M14).
 */
export function SchedulePanel({ hotelId, content }: { hotelId: string; content: MarketingContent }) {
  const accountsQuery = useSocialAccounts(hotelId);
  const schedulesQuery = useSchedules(hotelId, { pageSize: 100 }, { poll: true });
  const scheduleContent = useScheduleContent();
  const [accountId, setAccountId] = useState<string | null>(null);
  const [mode, setMode] = useState<"now" | "later">("later");
  const [date, setDate] = useState(todayInVietnam());
  const [time, setTime] = useState("09:00");
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const schedules = (schedulesQuery.data?.schedules ?? []).filter((item) => item.contentId === content.id);
  const accounts = accountsQuery.data ?? [];
  const canSchedule = SCHEDULABLE_STATUSES.includes(content.status);

  const reasonFor = (account: SocialAccount) => {
    if (!account.usable) return "Token đã hết hạn, nhờ chủ khách sạn kết nối lại";
    if (account.platform === "TIKTOK") return "TikTok chỉ nhận video, chưa hỗ trợ đăng";
    if (account.platform === "INSTAGRAM" && !content.mediaUrl) return "Instagram cần bài có ảnh";
    return null;
  };

  const submit = () => {
    setFormError(null);
    setDone(false);
    if (!accountId) {
      setFormError("Chọn trang sẽ đăng bài.");
      return;
    }
    let scheduledAt: string | null = null;
    if (mode === "later") {
      if (!date || !time) {
        setFormError("Chọn ngày và giờ đăng.");
        return;
      }
      scheduledAt = toInstant(date, time);
      if (new Date(scheduledAt).getTime() <= Date.now()) {
        setFormError("Thời điểm đăng phải ở tương lai. Chọn “Đăng ngay” nếu muốn đăng luôn.");
        return;
      }
    }
    scheduleContent.mutate(
      { contentId: content.id, input: { socialAccountId: accountId, scheduledAt } },
      {
        onSuccess: () => {
          setDone(true);
          setAccountId(null);
        },
        onError: (error) => setFormError(getMarketingErrorMessage(error, "Không lên lịch được. Vui lòng thử lại.")),
      },
    );
  };

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
      <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <CalendarClock className="size-4 text-[#934a33]" /> Lên lịch đăng
      </h2>

      {!canSchedule ? (
        <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          {content.status === "PUBLISHED"
            ? "Bài đã được đăng."
            : "Chỉ bài đã được chủ khách sạn duyệt mới lên lịch được. Gửi duyệt sau khi chỉnh sửa xong."}
        </p>
      ) : accountsQuery.isLoading ? (
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="size-3.5 animate-spin" /> Đang tải các trang đã kết nối…
        </p>
      ) : accountsQuery.error ? (
        <p className="text-xs text-red-600">{getMarketingErrorMessage(accountsQuery.error)}</p>
      ) : accounts.length === 0 ? (
        <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          Khách sạn chưa kết nối trang Facebook / Instagram nào. Chủ khách sạn cần kết nối trang trước khi lên lịch.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2" role="radiogroup" aria-label="Trang sẽ đăng">
            {accounts.map((account) => (
              <AccountOption
                key={account.id}
                account={account}
                selected={accountId === account.id}
                disabledReason={reasonFor(account)}
                onSelect={() => setAccountId(account.id)}
              />
            ))}
          </div>

          <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-xs font-semibold" role="radiogroup" aria-label="Thời điểm đăng">
            {(
              [
                ["later", "Hẹn giờ"],
                ["now", "Đăng ngay"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={mode === value}
                onClick={() => setMode(value)}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 transition",
                  mode === value ? "bg-white text-slate-900 shadow-xs" : "text-slate-500",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === "later" ? (
            <div className="grid grid-cols-2 gap-2">
              <DateInput value={date} onChange={setDate} min={todayInVietnam()} aria-label="Ngày đăng" />
              <TimeSelect value={time} onChange={(event) => setTime(event.target.value)} aria-label="Giờ đăng" />
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">Bài sẽ được đăng ở lượt chạy kế tiếp, trong vòng khoảng 1 phút.</p>
          )}

          {formError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
              {formError}
            </p>
          )}
          {done && (
            <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700" role="status">
              <CheckCircle2 className="size-4" /> Đã lên lịch. Có thể đăng thêm lên trang khác.
            </p>
          )}

          <Button
            onClick={submit}
            disabled={scheduleContent.isPending}
            className="w-full gap-1.5 bg-[#934a33] text-xs text-white hover:bg-[#7a341e]"
          >
            {scheduleContent.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {mode === "now" ? "Đăng ngay" : "Lên lịch đăng"}
          </Button>
        </div>
      )}

      {schedules.length > 0 && (
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <p className="text-[11px] font-semibold uppercase text-slate-500">Lịch đăng của bài này</p>
          <ul className="space-y-2">
            {schedules.map((schedule) => (
              <ScheduleRow key={schedule.id} schedule={schedule} />
            ))}
          </ul>
        </div>
      )}
      <p className="text-[11px] text-slate-400">
        Đăng lên: {Object.values(platformLabels).slice(0, 2).join(", ")}. TikTok chỉ nhận video nên chưa hỗ trợ.
      </p>
    </section>
  );
}
