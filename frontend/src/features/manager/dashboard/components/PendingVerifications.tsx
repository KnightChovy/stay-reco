"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, CheckCircle2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useVerificationQueue } from "../../api/manager-queries";
import { ErrorPanel, ManagerPanel } from "../../components";
import { formatWaiting, verificationTypeLabels } from "../../lib/labels";

const PREVIEW = 3;

/** The dashboard's live block: the oldest requests waiting for a decision, from the real queue. */
export function PendingVerifications() {
  const query = useVerificationQueue({ status: "PENDING", sort: "submitted-asc", page: 1, pageSize: PREVIEW });
  const total = query.data?.meta.total ?? 0;
  const requests = query.data?.requests ?? [];

  if (query.error) return <ErrorPanel error={query.error} onRetry={() => void query.refetch()} />;

  return (
    <ManagerPanel className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <BadgeCheck size={20} />
          </span>
          <div>
            <h2 className="font-bold text-primary">Việc cần xử lý</h2>
            <p className="text-xs text-muted-foreground">Hồ sơ xác minh đang chờ bạn thẩm định, cũ nhất trước.</p>
          </div>
        </div>
        {total > 0 && (
          <Link href="/manager/verifications" className={cn(buttonVariants(), "h-9")}>
            Mở hàng chờ ({total})
            <ArrowRight />
          </Link>
        )}
      </div>

      {query.isLoading ? (
        <div className="mt-4 space-y-2">
          {Array.from({ length: PREVIEW }, (_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : total === 0 ? (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-success-soft p-4 text-sm text-success">
          <CheckCircle2 size={18} className="shrink-0" />
          Không có hồ sơ nào đang chờ. Bạn đã xử lý hết hàng chờ xác minh.
        </p>
      ) : (
        <ul className="mt-4 divide-y rounded-xl border">
          {requests.map((request) => (
            <li key={request.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <span className="min-w-0">
                <strong className="block truncate text-primary">{request.hotelName}</strong>
                <span className="text-xs text-muted-foreground">{verificationTypeLabels[request.requestType]}</span>
              </span>
              <span className="shrink-0 text-xs font-semibold text-warning">
                Đã chờ {formatWaiting(request.submittedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ManagerPanel>
  );
}
