"use client";

import { useState } from "react";
import Link from "next/link";
import { ImageIcon, Lightbulb, Loader2, PenLine, RefreshCw, Sparkles } from "lucide-react";
import type { ContentStatus, MarketingContent } from "@stayreco/shared";
import Pagination from "@/components/common/pagination/Pagination";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useStaffHotel } from "@/features/staff/components/StaffHotelProvider";
import { useBrandVoice, useContentIdeas, useContents } from "@/features/staff/api/marketing-queries";
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
} from "@/features/staff/marketing/MarketingParts";
import { GenerateContentDialog } from "@/features/staff/marketing/GenerateContentDialog";

const PAGE_SIZE = 9;

const TABS: Array<{ id: string; label: string; status?: ContentStatus[] }> = [
  { id: "all", label: "Tất cả" },
  { id: "draft", label: "Bản nháp", status: ["DRAFT"] },
  { id: "pending", label: "Chờ duyệt", status: ["PENDING_APPROVAL"] },
  { id: "approved", label: "Đã duyệt", status: ["APPROVED", "SCHEDULED"] },
  { id: "published", label: "Đã đăng", status: ["PUBLISHED"] },
  { id: "rejected", label: "Bị từ chối", status: ["REJECTED"] },
];

function ContentCard({ content }: { content: MarketingContent }) {
  return (
    <Link
      href={`/staff/marketing/content/${content.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs transition hover:border-[#934a33]/40 hover:shadow-sm"
    >
      <div className="relative h-36 bg-slate-100">
        {content.mediaUrl ? (
          // Uploaded pictures live on the storage provider; the URL is the one Meta will fetch.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={content.mediaUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <ImageIcon className="size-8" aria-hidden />
          </div>
        )}
        <span className="absolute left-2 top-2">
          <ContentStatusPill status={content.status} />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-[11px] font-semibold uppercase text-[#934a33]">{contentTypeLabels[content.contentType]}</span>
        <h3 className="line-clamp-2 text-sm font-bold text-slate-900 group-hover:text-[#934a33]">
          {content.title || "(Chưa có tiêu đề)"}
        </h3>
        <p className="line-clamp-3 text-xs leading-relaxed text-slate-500">{content.body}</p>
        <p className="mt-auto pt-2 text-[11px] text-slate-400">
          {content.authorName ?? "Chủ khách sạn"} · {formatDateTime(content.createdAt)}
        </p>
      </div>
    </Link>
  );
}

export default function StaffMarketingContentPage() {
  const { hotel, isLoading: hotelLoading } = useStaffHotel();
  const hotelId = hotel?.summary.id;
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<{ open: boolean; brief: string; key: number }>({ open: false, brief: "", key: 0 });

  const status = TABS.find((item) => item.id === tab)?.status;
  const contentsQuery = useContents(hotelId, { page, pageSize: PAGE_SIZE, status });
  const ideasQuery = useContentIdeas(hotelId);
  const voice = useBrandVoice(hotelId).data;
  const contents = contentsQuery.data?.contents ?? [];
  const meta = contentsQuery.data?.meta;
  const forbidden = isMissingMarketingPermission(contentsQuery.error);

  const openWriter = (brief = "") => setDialog((prev) => ({ open: true, brief, key: prev.key + 1 }));

  return (
    <div className="space-y-5">
      <MarketingHeader
        title="Thư viện nội dung AI"
        icon={<Sparkles className="size-7 text-[#934a33]" />}
        crumbs={[{ label: "Thư viện nội dung" }]}
        description={
          <>
            Nhờ AI viết bài theo giọng thương hiệu của khách sạn, chỉnh sửa rồi <strong>gửi chủ khách sạn duyệt</strong>.
            Bài đã duyệt mới được lên lịch đăng lên Facebook / Instagram.
          </>
        }
        actions={
          !forbidden && (
            <Button
              onClick={() => openWriter()}
              disabled={!hotelId}
              className="gap-1.5 bg-[#934a33] text-xs text-white hover:bg-[#7a341e]"
            >
              <PenLine className="size-4" /> Viết bài bằng AI
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
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs lg:col-span-2">
              <p className="text-[11px] font-semibold uppercase text-slate-500">Giọng thương hiệu</p>
              {voice?.summary ? (
                <div className="mt-1 space-y-1 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">{voice.summary}</p>
                  {voice.audience && <p>Khách mục tiêu: {voice.audience}</p>}
                  {voice.highlights && <p>Điểm nổi bật: {voice.highlights}</p>}
                  {voice.forbiddenWords && <p>Từ cần tránh: {voice.forbiddenWords}</p>}
                </div>
              ) : (
                <p className="mt-1 text-xs text-slate-500">
                  Chưa thiết lập. AI vẫn viết được với giọng ấm áp, trung tính; chủ khách sạn có thể dạy AI giọng văn
                  riêng từ các bài đã đăng.
                </p>
              )}
            </div>
          </div>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Lightbulb className="size-4 text-amber-500" /> Gợi ý chủ đề từ số liệu khách sạn
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs"
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
              <p className="text-xs text-slate-500">{getMarketingErrorMessage(ideasQuery.error)}</p>
            ) : (ideasQuery.data ?? []).length === 0 ? (
              <p className="text-xs text-slate-500">
                Hiện chưa có gợi ý: khách sạn không có phòng trống đáng kể, khuyến mãi đang chạy hay đánh giá 4.5★ mới.
              </p>
            ) : (
              <ul className="grid gap-3 md:grid-cols-3">
                {ideasQuery.data!.map((idea, index) => (
                  <li key={`${idea.kind}-${index}`} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <Pill className={cn("self-start", toneClasses[ideaKindLabels[idea.kind].tone])}>
                      {ideaKindLabels[idea.kind].label}
                    </Pill>
                    <p className="text-xs font-semibold text-slate-800">{idea.brief}</p>
                    <p className="text-[11px] text-slate-500">{idea.detail}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-auto gap-1.5 self-start border-[#934a33]/40 text-xs text-[#934a33]"
                      onClick={() => openWriter(idea.brief)}
                    >
                      <Sparkles className="size-3.5" /> Viết từ gợi ý này
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Lọc theo trạng thái">
              {TABS.map((item) => (
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
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                    tab === item.id ? "bg-[#934a33] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                  )}
                >
                  {item.label}
                </button>
              ))}
              {contentsQuery.isFetching && !contentsQuery.isLoading && (
                <Loader2 className="ml-1 size-4 animate-spin text-slate-400" aria-label="Đang cập nhật" />
              )}
              {meta && <span className="ml-auto text-xs text-slate-500">{meta.total} nội dung</span>}
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
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                <Sparkles className="size-8 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">Chưa có nội dung nào ở mục này</p>
                <p className="max-w-sm text-xs text-slate-500">
                  Chọn một gợi ý phía trên hoặc tự nhập chủ đề, AI sẽ viết bản nháp trong vài giây.
                </p>
                <Button size="sm" onClick={() => openWriter()} className="gap-1.5 bg-[#934a33] text-xs text-white hover:bg-[#7a341e]">
                  <PenLine className="size-3.5" /> Viết bài bằng AI
                </Button>
              </div>
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
    </div>
  );
}
