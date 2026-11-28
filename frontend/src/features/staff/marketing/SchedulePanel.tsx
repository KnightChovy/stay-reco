"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle2, Loader2, Send, XCircle } from "lucide-react";
import type { ContentSchedule, MarketingContent, SocialAccount } from "@stayreco/shared";
import { ActionMenu } from "@/components/common/ActionBar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DateInput, TimeSelect } from "@/features/partner/components/DateTimeInputs";
import { todayInVietnam } from "@/features/partner/lib/dates";
import { formatDateTime } from "@/features/stays/lib/format";
import {
  marketingKeys,
  useCancelSchedule,
  useScheduleContent,
  useSchedules,
  useSocialAccounts,
} from "../api/marketing-queries";
import { platformLabels, SCHEDULABLE_STATUSES } from "../lib/marketing-labels";
import { getMarketingErrorMessage } from "../lib/marketing-errors";
import { ConfirmDialog, PlatformPill, ScheduleStatusPill } from "./MarketingParts";

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
        "flex min-h-12 w-full items-center justify-between gap-2 rounded-lg border p-3 text-left transition",
        selected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40",
        disabledReason && "cursor-not-allowed opacity-60 hover:border-border",
      )}
    >
      <span className="min-w-0 space-y-0.5">
        <span className="flex items-center gap-2">
          <PlatformPill platform={account.platform} />
          <span className="truncate font-mono text-xs text-foreground">{account.accountName}</span>
        </span>
        <span className="block text-xs text-muted-foreground">
          {disabledReason ?? (account.expiresAt ? `Token hết hạn ${formatDateTime(account.expiresAt)}` : "Đang kết nối")}
        </span>
      </span>
      <span
        aria-hidden
        className={cn(
          "size-4 shrink-0 rounded-full border-2",
          selected ? "border-primary bg-primary" : "border-border",
        )}
      />
    </button>
  );
}

function ScheduleRow({ schedule }: { schedule: ContentSchedule }) {
  const cancel = useCancelSchedule();
  const [confirm, setConfirm] = useState(false);
  return (
    <li className="space-y-1.5 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <PlatformPill platform={schedule.platform} />
          <ScheduleStatusPill status={schedule.status} />
        </span>
        {schedule.status === "SCHEDULED" && (
          <ActionMenu
            variant="icon"
            label="Thao tác với lịch đăng"
            items={[
              {
                label: "Huỷ lịch",
                description: "Bài sẽ không được đăng lên trang này nữa.",
                icon: XCircle,
                destructive: true,
                onSelect: () => setConfirm(true),
              },
            ]}
          />
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {schedule.publishedAt
          ? `Đã đăng lúc ${formatDateTime(schedule.publishedAt)}`
          : schedule.scheduledAt
            ? `Hẹn đăng ${formatDateTime(schedule.scheduledAt)}`
            : schedule.status === "PUBLISHING"
              ? "Đang đăng…"
              : schedule.status === "SCHEDULED"
                ? "Đang chờ đăng (trong vòng 1 phút)"
                : "Đăng ngay (không hẹn giờ)"}
      </p>
      {schedule.failureReason && (
        <p className="rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">Lý do: {schedule.failureReason}</p>
      )}
      {schedule.status === "PUBLISHED" && (
        <Link href={`/staff/marketing/analytics?schedule=${schedule.id}`} className="inline-flex h-10 items-center text-xs font-semibold text-primary hover:underline">
          Xem hiệu quả bài đăng
        </Link>
      )}
      {cancel.error && <p className="text-xs text-destructive">{getMarketingErrorMessage(cancel.error)}</p>}
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Huỷ lịch đăng này?"
        description={`Bài sẽ không được đăng lên ${platformLabels[schedule.platform]} (${schedule.accountName}). Bạn có thể lên lịch lại sau.`}
        confirmLabel="Huỷ lịch"
        pending={cancel.isPending}
        onConfirm={() => cancel.mutate(schedule.id, { onSettled: () => setConfirm(false) })}
      />
    </li>
  );
}

/**
 * Puts a piece on the calendar (`POST /marketing-content/:id/schedule`) and lists where it already goes. There is no
 * approval step: a draft is scheduled directly. Pages are connected under "Lịch đăng & Kết nối kênh". `unsaved`
 * holds it back while the editor has changes, so what goes out is what is on screen. "Đăng ngay" schedules with no time,
 * sent with `publishNow`, which the backend posts during the request: the answer already says whether it went out (M14, revised 2026-11-28).
 */
export function SchedulePanel({
  hotelId,
  content,
  unsaved = false,
}: {
  hotelId: string;
  content: MarketingContent;
  unsaved?: boolean;
}) {
  const accountsQuery = useSocialAccounts(hotelId);
  const schedulesQuery = useSchedules(hotelId, { contentId: content.id, pageSize: 100 }, { poll: true });
  const scheduleContent = useScheduleContent();
  const [accountId, setAccountId] = useState<string | null>(null);
  const [mode, setMode] = useState<"now" | "later">("later");
  const [date, setDate] = useState(todayInVietnam());
  const [time, setTime] = useState("09:00");
  const [formError, setFormError] = useState<string | null>(null);
  /** What the last submit led to: put on the calendar, posted now, or refused by the platform (with its words). */
  const [done, setDone] = useState<{ kind: "scheduled" | "published" | "failed"; text: string } | null>(null);

  const schedules = schedulesQuery.data?.schedules ?? [];

  // The calendar is polled; when one of this piece's posts goes out or fails, the piece itself has moved too
  // (PUBLISHED, or back to DRAFT), so its detail is read again rather than left saying SCHEDULED.
  const queryClient = useQueryClient();
  const statuses = schedules.map((item) => `${item.id}:${item.status}`).join(",");
  const seen = useRef<string | null>(null);
  useEffect(() => {
    if (seen.current !== null && seen.current !== statuses) {
      void queryClient.invalidateQueries({ queryKey: marketingKeys.content(content.id) });
    }
    seen.current = statuses;
  }, [statuses, content.id, queryClient]);
  const accounts = accountsQuery.data ?? [];
  const canSchedule = SCHEDULABLE_STATUSES.includes(content.status);

  const reasonFor = (account: SocialAccount) => {
    if (!account.usable) return "Token đã hết hạn, hãy kết nối lại trang ở mục Lịch đăng & Kết nối kênh";
    if (account.platform === "TIKTOK") return "TikTok chỉ nhận video, chưa hỗ trợ đăng";
    if (account.platform === "INSTAGRAM" && !content.mediaUrl) return "Instagram cần bài có ảnh";
    return null;
  };

  const submit = () => {
    setFormError(null);
    setDone(null);
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
      { contentId: content.id, input: mode === "now" ? { socialAccountId: accountId, publishNow: true } : { socialAccountId: accountId, scheduledAt } },
      {
        onSuccess: (schedule) => {
          const page = `${platformLabels[schedule.platform]} (${schedule.accountName})`;
          setDone(
            schedule.status === "PUBLISHED"
              ? { kind: "published", text: `Đã đăng lên ${page}. Có thể đăng thêm lên trang khác.` }
              : schedule.status === "FAILED"
                ? { kind: "failed", text: `Không đăng được lên ${page}: ${schedule.failureReason ?? "nền tảng từ chối"}` }
                : { kind: "scheduled", text: "Đã lên lịch. Có thể đăng thêm lên trang khác." },
          );
          setAccountId(null);
        },
        onError: (error) => setFormError(getMarketingErrorMessage(error, "Không lên lịch được. Vui lòng thử lại.")),
      },
    );
  };

  return (
    <section className="space-y-4 rounded-xl border border-border bg-white p-4 shadow-2xs">
      <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
        <CalendarClock className="size-4 text-primary" aria-hidden /> Lên lịch đăng
      </h2>

      {!canSchedule ? (
        <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">Bài này không lên lịch được.</p>
      ) : accountsQuery.isLoading ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" /> Đang tải các trang đã kết nối…
        </p>
      ) : accountsQuery.error ? (
        <p className="text-xs text-destructive">{getMarketingErrorMessage(accountsQuery.error)}</p>
      ) : accounts.length === 0 ? (
        <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            Khách sạn chưa kết nối trang Facebook / Instagram nào.{" "}
            <Link href="/staff/marketing/calendar" className="font-semibold underline">
              Kết nối trang
            </Link>{" "}
            trước khi lên lịch.
          </span>
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

          <div className="flex gap-1 rounded-lg bg-muted p-1 text-xs font-semibold" role="radiogroup" aria-label="Thời điểm đăng">
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
                  "h-10 flex-1 rounded-md px-3 transition",
                  mode === value ? "bg-card text-foreground shadow-xs" : "text-muted-foreground",
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
            <p className="text-xs text-muted-foreground">Bài sẽ được đăng ở lượt chạy kế tiếp, trong vòng khoảng 1 phút.</p>
          )}

          {formError && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
              {formError}
            </p>
          )}
          {done &&
            (done.kind === "failed" ? (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
                {done.text}
              </p>
            ) : (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700" role="status">
                <CheckCircle2 className="size-4" /> {done.text}
              </p>
            ))}

          {unsaved && (
            <p className="text-xs font-semibold text-amber-700" role="status">
              Lưu thay đổi của bài trước khi đăng.
            </p>
          )}
          <Button
            onClick={submit}
            disabled={scheduleContent.isPending || unsaved}
            className="h-10 w-full gap-1.5"
          >
            {scheduleContent.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {mode === "now" ? (scheduleContent.isPending ? "Đang đăng…" : "Đăng ngay") : "Lên lịch đăng"}
          </Button>
        </div>
      )}

      {schedules.length > 0 && (
        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Lịch đăng của bài này</p>
          <ul className="space-y-2">
            {schedules.map((schedule) => (
              <ScheduleRow key={schedule.id} schedule={schedule} />
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Đăng lên: {Object.values(platformLabels).slice(0, 2).join(", ")}. TikTok chỉ nhận video nên chưa hỗ trợ.
      </p>
    </section>
  );
}
