"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ImageIcon,
  ImagePlus,
  Loader2,
  Save,
  Send,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import { updateContentSchema, type MarketingContent } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { validateWith } from "@/lib/api-error";
import { formatDateTime } from "@/features/stays/lib/format";
import { useStaffHotel } from "@/features/staff/components/StaffHotelProvider";
import {
  useContent,
  useDeleteContent,
  useRemoveContentImage,
  useSubmitContent,
  useUpdateContent,
  useUploadContentImage,
} from "@/features/staff/api/marketing-queries";
import { contentTypeLabels, EDITABLE_STATUSES } from "@/features/staff/lib/marketing-labels";
import { getMarketingErrorMessage } from "@/features/staff/lib/marketing-errors";
import { ContentStatusPill, MarketingErrorPanel, MarketingHeader } from "@/features/staff/marketing/MarketingParts";
import { SchedulePanel } from "@/features/staff/marketing/SchedulePanel";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const STATUS_HINT: Record<MarketingContent["status"], string> = {
  DRAFT: "Bản nháp: chỉnh sửa thoải mái, xong thì gửi chủ khách sạn duyệt.",
  PENDING_APPROVAL: "Đang chờ chủ khách sạn duyệt. Nội dung tạm khoá chỉnh sửa.",
  APPROVED: "Chủ khách sạn đã duyệt. Nội dung được giữ nguyên như lúc duyệt; hãy lên lịch đăng.",
  SCHEDULED: "Đã lên lịch đăng. Có thể đăng thêm lên trang khác.",
  PUBLISHED: "Bài đã được đăng.",
  REJECTED: "Chủ khách sạn đã từ chối. Sửa theo góp ý rồi gửi duyệt lại.",
};

/** The words and picture of a draft; the piece is remounted (keyed on its status) when the server changes it. */
function useContentEditor(content: MarketingContent) {
  const update = useUpdateContent();
  const upload = useUploadContentImage();
  const removeImage = useRemoveContentImage();
  const [title, setTitle] = useState(content.title ?? "");
  const [body, setBody] = useState(content.body);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageError, setImageError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty = title.trim() !== (content.title ?? "") || body.trim() !== content.body;

  const save = (after?: () => void) => {
    setSaved(false);
    const input = {
      ...(title.trim() !== (content.title ?? "") ? { title: title.trim() || null } : {}),
      ...(body.trim() !== content.body ? { body: body.trim() } : {}),
    };
    const result = validateWith(updateContentSchema, input);
    if (result.errors) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    update.mutate(
      { contentId: content.id, input: result.data },
      {
        onSuccess: () => {
          setSaved(true);
          after?.();
        },
      },
    );
  };

  const pickImage = (file: File | undefined) => {
    setImageError(null);
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      setImageError("Chỉ nhận ảnh JPG, PNG hoặc WebP.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Ảnh tối đa 10 MB.");
      return;
    }
    upload.mutate({ contentId: content.id, file }, { onError: (error) => setImageError(getMarketingErrorMessage(error)) });
  };

  return { title, setTitle, body, setBody, errors, dirty, save, saved, update, upload, removeImage, imageError, pickImage };
}

function ContentDetail({ contentId }: { contentId: string }) {
  const router = useRouter();
  const generated = useSearchParams().get("generated") === "1";
  const { hotel } = useStaffHotel();
  const contentQuery = useContent(contentId);
  const content = contentQuery.data;

  if (contentQuery.isLoading) {
    return (
      <div className="grid gap-5 lg:grid-cols-3">
        <Skeleton className="h-96 rounded-xl lg:col-span-2" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }
  if (contentQuery.error || !content) {
    return <MarketingErrorPanel error={contentQuery.error} onRetry={() => void contentQuery.refetch()} />;
  }

  return (
    <ContentWorkspace
      key={`${content.id}-${content.status}`}
      content={content}
      hotelId={hotel?.summary.id}
      generated={generated}
      onDeleted={() => router.replace("/staff/marketing/content")}
    />
  );
}

function ContentWorkspace({
  content,
  hotelId,
  generated,
  onDeleted,
}: {
  content: MarketingContent;
  hotelId: string | undefined;
  generated: boolean;
  onDeleted: () => void;
}) {
  const editor = useContentEditor(content);
  const fileRef = useRef<HTMLInputElement>(null);
  const submit = useSubmitContent();
  const remove = useDeleteContent();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const editable = EDITABLE_STATUSES.includes(content.status);
  const busy = editor.update.isPending || submit.isPending || editor.upload.isPending || editor.removeImage.isPending;

  const sendForApproval = () => {
    // Unsaved words go first: what is submitted is what the owner reads.
    if (editor.dirty) editor.save(() => submit.mutate(content.id));
    else submit.mutate(content.id);
  };

  const actionError = submit.error ?? editor.update.error ?? remove.error;

  return (
    <div className="space-y-5">
      <MarketingHeader
        title={content.title || "Nội dung chưa có tiêu đề"}
        icon={<Sparkles className="size-7 shrink-0 text-[#934a33]" />}
        crumbs={[{ label: "Thư viện nội dung", href: "/staff/marketing/content" }, { label: "Chi tiết" }]}
        description={STATUS_HINT[content.status]}
        actions={
          <Link href="/staff/marketing/content">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="size-3.5" /> Thư viện
            </Button>
          </Link>
        }
      />

      {generated && content.status === "DRAFT" && (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="size-4" /> AI đã viết xong bản nháp. Đọc lại, chỉnh sửa và thêm ảnh trước khi gửi duyệt.
        </p>
      )}
      {content.status === "REJECTED" && content.rejectedReason && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          <XCircle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-semibold">Chủ khách sạn góp ý:</p>
            <p>{content.rejectedReason}</p>
          </div>
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs sm:p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <ContentStatusPill status={content.status} />
            <span className="text-[11px] font-semibold uppercase text-[#934a33]">{contentTypeLabels[content.contentType]}</span>
            <span className="ml-auto flex items-center gap-1 text-[11px] text-slate-400">
              <Clock className="size-3" /> {content.authorName ?? "Chủ khách sạn"} · {formatDateTime(content.createdAt)}
            </span>
          </div>

          {editable ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-semibold">
                  Tiêu đề
                </Label>
                <Input
                  id="title"
                  value={editor.title}
                  maxLength={255}
                  disabled={busy}
                  onChange={(event) => editor.setTitle(event.target.value)}
                  aria-invalid={!!editor.errors.title}
                />
                {editor.errors.title && <p className="text-xs text-red-600">{editor.errors.title}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="body" className="text-xs font-semibold">
                  Nội dung bài đăng <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="body"
                  rows={12}
                  value={editor.body}
                  maxLength={10_000}
                  disabled={busy}
                  onChange={(event) => editor.setBody(event.target.value)}
                  aria-invalid={!!editor.errors.body}
                  className="min-h-64 text-sm leading-relaxed"
                />
                <div className="flex justify-between text-[11px]">
                  <span className={editor.errors.body ? "text-red-600" : "text-slate-400"}>
                    {editor.errors.body ?? "AI không tự thêm giá, ngày hay ưu đãi. Kiểm tra lại mọi con số trước khi gửi."}
                  </span>
                  <span className="text-slate-400">{editor.body.trim().length}/10.000</span>
                </div>
              </div>
            </>
          ) : (
            <article className="space-y-2">
              {content.title && <h2 className="text-lg font-bold text-slate-900">{content.title}</h2>}
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{content.body}</p>
            </article>
          )}

          <div className="space-y-2 border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-700">Ảnh minh hoạ</p>
            {content.mediaUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={content.mediaUrl} alt="Ảnh minh hoạ bài đăng" className="max-h-72 w-full rounded-lg object-cover" />
            ) : (
              <div className="flex h-32 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">
                <ImageIcon className="size-6" /> Chưa có ảnh. Instagram bắt buộc phải có ảnh.
              </div>
            )}
            {editable && (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept={IMAGE_TYPES.join(",")}
                  className="sr-only"
                  aria-label="Chọn ảnh minh hoạ"
                  onChange={(event) => {
                    editor.pickImage(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                >
                  {editor.upload.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
                  {content.mediaUrl ? "Đổi ảnh" : "Tải ảnh lên"}
                </Button>
                {content.mediaUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs text-red-600"
                    disabled={busy}
                    onClick={() => editor.removeImage.mutate(content.id)}
                  >
                    <Trash2 className="size-3.5" /> Gỡ ảnh
                  </Button>
                )}
                <span className="text-[11px] text-slate-400">JPG, PNG, WebP · tối đa 10 MB</span>
              </div>
            )}
            {editor.imageError && <p className="text-xs text-red-600">{editor.imageError}</p>}
          </div>

          {actionError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
              {getMarketingErrorMessage(actionError)}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
            {editor.saved && !editor.dirty && (
              <span className="mr-auto flex items-center gap-1 text-xs font-semibold text-emerald-700" role="status">
                <CheckCircle2 className="size-3.5" /> Đã lưu
              </span>
            )}
            {content.status !== "PUBLISHED" &&
              content.status !== "SCHEDULED" &&
              (confirmDelete ? (
                <span className="flex items-center gap-2 text-xs">
                  Xoá nội dung này?
                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-xs"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(content.id, { onSuccess: onDeleted })}
                  >
                    {remove.isPending ? <Loader2 className="size-3.5 animate-spin" /> : "Xoá"}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => setConfirmDelete(false)}>
                    Không
                  </Button>
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5 text-xs text-red-600"
                  disabled={busy}
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="size-3.5" /> Xoá
                </Button>
              ))}
            {editable && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  disabled={!editor.dirty || busy}
                  onClick={() => editor.save()}
                >
                  {editor.update.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                  Lưu nháp
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5 bg-[#934a33] text-xs text-white hover:bg-[#7a341e]"
                  disabled={busy || !editor.body.trim()}
                  onClick={sendForApproval}
                >
                  {submit.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                  Gửi chủ khách sạn duyệt
                </Button>
              </>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          {hotelId && <SchedulePanel hotelId={hotelId} content={content} />}
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500 shadow-2xs">
            <p className="mb-1 font-semibold text-slate-700">Quy trình</p>
            <ol className="list-decimal space-y-0.5 pl-4">
              <li>AI viết bản nháp, nhân viên chỉnh sửa và thêm ảnh</li>
              <li>Gửi chủ khách sạn duyệt (chủ có thể từ chối kèm góp ý)</li>
              <li>Bài đã duyệt được lên lịch đăng lên trang đã kết nối</li>
              <li>Sau khi đăng, theo dõi hiệu quả ở mục Hiệu quả tiếp thị</li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function StaffMarketingContentDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
      <ContentDetail contentId={id} />
    </Suspense>
  );
}
