"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FileCheck2, Sparkles } from "lucide-react";
import type { MarketingContent } from "@stayreco/shared";
import { TablePagination } from "@/components/common/table/TablePagination";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { contentStatusLabels, contentTypeLabels } from "@/features/staff/lib/marketing-labels";
import { cn } from "@/lib/utils";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
  NoHotelPanel,
  PartnerPanel,
  PartnerTitle,
  StatusBadge,
  SuspendedBanner,
  usePartnerHotel,
} from "../components";
import { formatDateTime } from "../lib/labels";
import { ApprovalDetail } from "./ApprovalDetail";
import {
  APPROVAL_PAGE_SIZE,
  approvalTabs,
  useApprovalContents,
  usePendingContentCount,
  type ApprovalTab,
} from "./approval-queries";

const emptyCopy: Record<ApprovalTab, { title: string; description: string }> = {
  pending: {
    title: "Không có bài nào chờ duyệt",
    description: "Khi nhân viên gửi bài, bài sẽ xuất hiện ở đây để bạn đọc và quyết định.",
  },
  approved: { title: "Chưa duyệt bài nào", description: "Bài bạn đã duyệt, đã lên lịch hoặc đã đăng nằm ở đây." },
  rejected: { title: "Chưa từ chối bài nào", description: "Bài bạn trả về cho nhân viên kèm lý do nằm ở đây." },
};

function isTab(value: string | null): value is ApprovalTab {
  return approvalTabs.some((tab) => tab.id === value);
}

export default function PartnerContentApprovals() {
  const { hotel, hotels, isLoading, error, refetch, isSuspended } = usePartnerHotel();

  return (
    <div className="space-y-6">
      <PartnerTitle
        title="Duyệt bài marketing"
        description="Nhân viên soạn bài với AI, bạn đọc và quyết định. Bài được khoá khi duyệt nên đăng lên đúng như bạn đã đọc."
        action={
          <Link href="/partner/ai-brand" className={buttonVariants({ variant: "outline" })}>
            <Sparkles />
            Giọng thương hiệu
          </Link>
        }
      />
      {isSuspended && <SuspendedBanner />}
      {isLoading ? (
        <LoadingPanel />
      ) : error ? (
        <ErrorPanel error={error} onRetry={refetch} />
      ) : !hotel || hotels.length === 0 ? (
        <NoHotelPanel />
      ) : (
        <ApprovalWorkspace key={hotel.id} hotelId={hotel.id} />
      )}
    </div>
  );
}

function ApprovalWorkspace({ hotelId }: { hotelId: string }) {
  const { canEdit } = usePartnerHotel();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const tab: ApprovalTab = isTab(requestedTab) ? requestedTab : "pending";
  const selectedId = searchParams.get("id");
  const [page, setPage] = useState(1);
  const pendingCount = usePendingContentCount(hotelId);
  const query = useApprovalContents(hotelId, tab, page);
  const contents = query.data?.contents ?? [];
  const meta = query.data?.meta;
  const selected = contents.find((item) => item.id === selectedId) ?? (selectedId ? undefined : contents[0]);

  function navigate(next: { tab?: ApprovalTab; id?: string | null }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.tab) params.set("tab", next.tab);
    if (next.id === null) params.delete("id");
    else if (next.id) params.set("id", next.id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function changeTab(next: ApprovalTab) {
    setPage(1);
    navigate({ tab: next, id: null });
  }

  function afterDecision(contentId: string) {
    const index = contents.findIndex((item) => item.id === contentId);
    const next = contents[index + 1] ?? contents[index - 1];
    navigate({ id: next ? next.id : null });
  }

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Trạng thái bài" className="flex flex-wrap gap-2">
        {approvalTabs.map((item) => (
          <Button
            key={item.id}
            role="tab"
            aria-selected={tab === item.id}
            variant={tab === item.id ? "default" : "outline"}
            onClick={() => changeTab(item.id)}
          >
            {item.label}
            {item.id === "pending" && pendingCount > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs font-bold tabular-nums",
                  tab === item.id ? "bg-primary-foreground/20" : "bg-warning-soft text-warning",
                )}
              >
                {pendingCount}
              </span>
            )}
          </Button>
        ))}
      </div>

      {query.isLoading ? (
        <LoadingPanel rows={4} />
      ) : query.error ? (
        <ErrorPanel error={query.error} onRetry={() => void query.refetch()} />
      ) : contents.length === 0 ? (
        <EmptyPanel icon={FileCheck2} title={emptyCopy[tab].title} description={emptyCopy[tab].description} />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(280px,360px)_1fr]">
          <PartnerPanel className={cn("overflow-hidden p-0", selectedId && "hidden lg:block")}>
            <ul aria-label="Danh sách bài" className={cn("divide-y", query.isFetching && "opacity-60 transition-opacity")}>
              {contents.map((content) => (
                <li key={content.id}>
                  <ContentRow
                    content={content}
                    active={content.id === selected?.id}
                    showStatus={tab !== "pending"}
                    onSelect={() => navigate({ id: content.id })}
                  />
                </li>
              ))}
            </ul>
            {meta && meta.total > APPROVAL_PAGE_SIZE && (
              <TablePagination page={page} pageSize={APPROVAL_PAGE_SIZE} total={meta.total} onPageChange={setPage} />
            )}
          </PartnerPanel>

          <PartnerPanel className={cn("min-w-0 overflow-visible! p-0", !selectedId && "hidden lg:block")}>
            {selectedId && (
              <div className="border-b p-3 lg:hidden">
                <Button variant="ghost" size="sm" onClick={() => navigate({ id: null })}>
                  <ArrowLeft />
                  Danh sách bài
                </Button>
              </div>
            )}
            {selected ? (
              <ApprovalDetail
                key={selected.id}
                content={selected}
                hotelId={hotelId}
                canDecide={canEdit}
                onDecided={afterDecision}
              />
            ) : query.isFetching ? (
              <Skeleton className="m-5 h-64" />
            ) : (
              <p className="p-5 text-sm text-muted-foreground">Bài này không còn trong danh sách. Chọn một bài khác.</p>
            )}
          </PartnerPanel>
        </div>
      )}
    </div>
  );
}

function ContentRow({
  content,
  active,
  showStatus,
  onSelect,
}: {
  content: MarketingContent;
  active: boolean;
  showStatus: boolean;
  onSelect: () => void;
}) {
  const status = contentStatusLabels[content.status];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex w-full gap-3 border-l-[3px] border-transparent p-3 text-left transition-colors hover:bg-muted/60",
        active && "border-primary bg-primary/5",
      )}
    >
      {content.mediaUrl ? (
        <Image
          src={content.mediaUrl}
          alt=""
          width={56}
          height={56}
          className="size-14 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
          <FileCheck2 className="size-5" aria-hidden />
        </span>
      )}
      <span className="min-w-0 flex-1 space-y-0.5">
        <span className="line-clamp-1 text-sm font-semibold text-foreground">
          {content.title ?? content.body.slice(0, 80)}
        </span>
        <span className="line-clamp-2 text-xs text-muted-foreground">{content.body}</span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {contentTypeLabels[content.contentType]} · {content.authorName ?? "Bạn"} · {formatDateTime(content.createdAt)}
          {showStatus && <StatusBadge tone={status.tone}>{status.label}</StatusBadge>}
        </span>
      </span>
    </button>
  );
}
