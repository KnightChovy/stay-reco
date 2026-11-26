"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQueries } from "@tanstack/react-query";
import { ImageIcon, Lightbulb, Loader2, PenLine, RefreshCw, Search, Sparkles } from "lucide-react";
import type { ContentStatus, MarketingContent } from "@stayreco/shared";
import Pagination from "@/components/common/pagination/Pagination";
import { EmptyState } from "@/components/common/StateViews";
import { buttonVariants, Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import * as marketingService from "@/services/marketing.service";
import { useStaffHotel } from "@/features/staff/components/StaffHotelProvider";
import { marketingKeys, useBrandVoice, useContentIdeas, useContents } from "@/features/staff/api/marketing-queries";
import { BrandVoiceDialog } from "@/features/staff/marketing/BrandVoiceDialog";
import { toneClasses } from "@/features/staff/lib/labels";
import { contentTypeLabels, ideaKindLabels } from "@/features/staff/lib/marketing-labels";
import { getMarketingErrorMessage, isMissingMarketingPermission } from "@/features/staff/lib/marketing-errors";
import { formatDateTime } from "@/features/stays/lib/format";
import {
  AiBudgetCard,
  ContentStatusPill,
  MarketingErrorPanel,
  MarketingHeader,
  Pill,
  useAiBudgetState,
} from "@/features/staff/marketing/MarketingParts";
import { GenerateContentDialog } from "@/features/staff/marketing/GenerateContentDialog";

const PAGE_SIZE = 9;

const TABS: Array<{ id: string; label: string; status?: ContentStatus[] }> = [
  { id: "all", label: "Tất cả" },
  // PENDING_APPROVAL, APPROVED and REJECTED only remain on pieces from before the approval step was removed.
  { id: "draft", label: "Chưa đăng", status: ["DRAFT", "PENDING_APPROVAL", "REJECTED", "APPROVED"] },
  { id: "scheduled", label: "Đã lên lịch", status: ["SCHEDULED"] },
  { id: "published", label: "Đã đăng", status: ["PUBLISHED"] },
];

/** The one thing to do with a piece, by status. */
function CardAction({ content }: { content: MarketingContent }) {
  const href = `/staff/marketing/content/${content.id}`;
  const cls = "h-10 w-full justify-center whitespace-nowrap";
  switch (content.status) {
    case "DRAFT":
    case "PENDING_APPROVAL":
    case "REJECTED":
      return (
        <Link href={href} className={cn(buttonVariants(), cls)}>
          <PenLine className="size-4" aria-hidden /> Sửa & đăng
        </Link>
      );
    case "APPROVED":
      return (
        <Link href={href} className={cn(buttonVariants(), cls)}>
          Lên lịch
        </Link>
      );
    default:
      return (
        <Link href={href} className={cn(buttonVariants({ variant: "outline" }), cls)}>
          Xem
        </Link>
      );
  }
}

function ContentCard({ content }: { content: MarketingContent }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xs transition hover:border-primary/40 hover:shadow-sm">
      <Link href={`/staff/marketing/content/${content.id}`} className="flex flex-1 flex-col" aria-label={content.title || "Mở nội dung"}>
        <div className="relative h-36 bg-muted">
          {content.mediaUrl ? (
            // Uploaded pictures live on the storage provider; the URL is the one Meta will fetch.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={content.mediaUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <ImageIcon className="size-8" aria-hidden />
            </div>
          )}
          <span className="absolute left-2 top-2 rounded-md bg-card">
            <ContentStatusPill status={content.status} />
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <span className="text-xs font-semibold uppercase text-primary">{contentTypeLabels[content.contentType]}</span>
          <h3 className="line-clamp-2 text-sm font-bold text-foreground group-hover:text-primary">
            {content.title || "(Chưa có tiêu đề)"}
          </h3>
          <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">{content.body}</p>
          <p className="mt-auto pt-2 text-xs text-muted-foreground">
            {content.authorName ?? "Chủ khách sạn"} · {formatDateTime(content.createdAt)}
          </p>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <CardAction content={content} />
      </div>
    </div>
  );
}

export default function StaffMarketingContentPage() {
  const { hotel, isLoading: hotelLoading } = useStaffHotel();
  const hotelId = hotel?.summary.id;
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<{ open: boolean; brief: string; key: number }>({ open: false, brief: "", key: 0 });

  const status = TABS.find((item) => item.id === tab)?.status;
  const contentsQuery = useContents(hotelId, { page, pageSize: PAGE_SIZE, status });
  const forbidden = isMissingMarketingPermission(contentsQuery.error);
  const ideasQuery = useContentIdeas(hotelId);
  const voice = useBrandVoice(hotelId).data;
  const [voiceOpen, setVoiceOpen] = useState(false);
  const loaded = contentsQuery.data?.contents;
  // The API has no text search, so this narrows the page on screen only.
  const needle = search.trim().toLowerCase();
  const contents = useMemo(() => {
    const all = loaded ?? [];
    return needle ? all.filter((item) => `${item.title ?? ""} ${item.body}`.toLowerCase().includes(needle)) : all;
  }, [loaded, needle]);
  const { exhausted } = useAiBudgetState(hotelId);
  // One cheap request per tab for its count (page size 1: only `meta.total` is read).
  const counts = useQueries({
    queries: TABS.map((item) => ({
      queryKey: marketingKeys.contents(hotelId ?? "", { page: 1, pageSize: 1, status: item.status }),
      queryFn: () => marketingService.getContents(hotelId!, { page: 1, pageSize: 1, status: item.status }),
      enabled: !!hotelId && !forbidden,
      retry: false,
    })),
  });
  const meta = contentsQuery.data?.meta;

  const openWriter = (brief = "") => setDialog((prev) => ({ open: true, brief, key: prev.key + 1 }));

  return (
    <div className="space-y-5">
      <MarketingHeader
        title="Thư viện nội dung AI"
        icon={<Sparkles className="size-7 shrink-0 text-primary" aria-hidden />}
        crumbs={[{ label: "Thư viện nội dung" }]}
        description={
          <>
            Nhờ AI viết bài theo giọng thương hiệu của khách sạn, chỉnh sửa, thêm ảnh rồi <strong>lên lịch đăng</strong> lên
            Facebook / Instagram.
          </>
        }
        actions={
          !forbidden && (
            <Button onClick={() => openWriter()} disabled={!hotelId || exhausted} className="h-10 gap-1.5 whitespace-nowrap">
              <PenLine className="size-4" aria-hidden /> Viết bài bằng AI
            </Button>
          )
        }
      />

      {forbidden ? (
        <MarketingErrorPanel error={contentsQuery.error} />
      ) : (
        <>
          <div className="grid gap-3 lg:grid-cols-3">
            <AiBudgetCard hotelId={hotelId} />
            <div className="rounded-xl border border-border bg-card p-4 shadow-2xs lg:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Giọng thương hiệu</p>
                {hotelId && (
                  <Button variant="outline" className="h-10 gap-1.5" onClick={() => setVoiceOpen(true)}>
                    <PenLine className="size-4" aria-hidden /> Sửa giọng
                  </Button>
                )}
              </div>
              {voice?.summary ? (
                <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">{voice.summary}</p>
                  {voice.audience && <p>Khách mục tiêu: {voice.audience}</p>}
                  {voice.highlights && <p>Điểm nổi bật: {voice.highlights}</p>}
                  {voice.forbiddenWords && <p>Từ cần tránh: {voice.forbiddenWords}</p>}
                </div>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  Chưa thiết lập. AI vẫn viết được với giọng ấm áp, trung tính. Bấm “Sửa giọng” để tự mô tả hoặc dạy AI
                  từ các bài mẫu.
                </p>
              )}
            </div>
          </div>

          <section className="rounded-xl border border-border bg-card p-4 shadow-2xs">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Lightbulb className="size-4 text-amber-500" aria-hidden /> Gợi ý chủ đề từ số liệu khách sạn
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 gap-1.5"
                onClick={() => void ideasQuery.refetch()}
                disabled={ideasQuery.isFetching}
              >
                <RefreshCw className={cn("size-3.5", ideasQuery.isFetching && "animate-spin")} /> Làm mới
              </Button>
            </div>
            {ideasQuery.isLoading ? (
              <div className="grid gap-3 md:grid-cols-3">
                {[0, 1, 2].map((key) => (
                  <Skeleton key={key} className="h-24 rounded-lg" />
                ))}
              </div>
            ) : ideasQuery.error ? (
              <p className="text-xs text-muted-foreground">{getMarketingErrorMessage(ideasQuery.error)}</p>
            ) : (ideasQuery.data ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Hiện chưa có gợi ý: khách sạn không có phòng trống đáng kể, khuyến mãi đang chạy hay đánh giá 4.5★ mới.
              </p>
            ) : (
              <ul className="grid gap-3 md:grid-cols-3">
                {ideasQuery.data!.map((idea, index) => (
                  <li key={`${idea.kind}-${index}`} className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3">
                    <Pill className={cn("self-start", toneClasses[ideaKindLabels[idea.kind].tone])}>
                      {ideaKindLabels[idea.kind].label}
                    </Pill>
                    <p className="text-xs font-semibold text-foreground">{idea.brief}</p>
                    <p className="text-xs text-muted-foreground">{idea.detail}</p>
                    <Button
                      variant="outline"
                      disabled={exhausted}
                      className="mt-auto h-10 gap-1.5 self-start whitespace-nowrap"
                      onClick={() => openWriter(idea.brief)}
                    >
                      <Sparkles className="size-3.5" aria-hidden /> Viết từ gợi ý này
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Lọc theo trạng thái">
                {TABS.map((item, index) => {
                  const count = counts[index]?.data?.meta.total;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={tab === item.id}
                      onClick={() => {
                        setTab(item.id);
                        setPage(1);
                      }}
                      className={cn(
                        "h-10 shrink-0 whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition",
                        tab === item.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
                      )}
                    >
                      {item.label}
                      {count !== undefined && <span className="ml-1.5 tabular-nums opacity-80">{count}</span>}
                    </button>
                  );
                })}
              </div>
              <div className="relative sm:ml-auto sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm trong trang này"
                  aria-label="Tìm nội dung trong trang đang xem"
                  className="h-10 pl-9 text-sm"
                />
              </div>
              {contentsQuery.isFetching && !contentsQuery.isLoading && (
                <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Đang cập nhật" />
              )}
            </div>

            {hotelLoading || contentsQuery.isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2].map((key) => (
                  <Skeleton key={key} className="h-72 rounded-xl" />
                ))}
              </div>
            ) : contentsQuery.error ? (
              <MarketingErrorPanel error={contentsQuery.error} onRetry={() => void contentsQuery.refetch()} />
            ) : contents.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title={needle ? "Không có nội dung khớp từ khoá" : "Chưa có nội dung nào ở mục này"}
                description={
                  needle
                    ? "Tìm kiếm chỉ áp dụng cho trang đang xem. Xoá từ khoá hoặc chuyển trang."
                    : "Chọn một gợi ý phía trên hoặc tự nhập chủ đề, AI sẽ viết bản nháp trong vài giây."
                }
                action={
                  needle ? (
                    <Button variant="outline" className="h-10" onClick={() => setSearch("")}>
                      Xoá từ khoá
                    </Button>
                  ) : (
                    <Button onClick={() => openWriter()} disabled={exhausted} className="h-10 gap-1.5">
                      <PenLine className="size-4" aria-hidden /> Viết bài bằng AI
                    </Button>
                  )
                }
              />
            ) : (
              <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", contentsQuery.isPlaceholderData && "opacity-60")}>
                {contents.map((content) => (
                  <ContentCard key={content.id} content={content} />
                ))}
              </div>
            )}

            {meta && meta.totalPages > 1 && (
              <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
            )}
          </section>
        </>
      )}

      {hotelId && (
        <GenerateContentDialog
          key={dialog.key}
          hotelId={hotelId}
          open={dialog.open}
          initialBrief={dialog.brief}
          onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
        />
      )}
      {hotelId && (
        <BrandVoiceDialog
          key={`${voiceOpen}-${voice?.updatedAt ?? "empty"}`}
          hotelId={hotelId}
          voice={voice}
          open={voiceOpen}
          onOpenChange={setVoiceOpen}
        />
      )}
    </div>
  );
}
