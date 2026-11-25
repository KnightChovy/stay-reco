"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  ImageIcon,
  ImagePlus,
  Loader2,
  Lock,
  Save,
  Send,
  Sparkles,
  Trash2,
  Wand2,
  XCircle,
} from "lucide-react";
import { updateContentSchema, type MarketingContent } from "@stayreco/shared";
import { ActionBar, ActionMenu, type ActionMenuItem } from "@/components/common/ActionBar";
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
  useGenerateContentImage,
  useRemoveContentImage,
  useSubmitContent,
  useUpdateContent,
  useUploadContentImage,
} from "@/features/staff/api/marketing-queries";
import { contentTypeLabels, EDITABLE_STATUSES } from "@/features/staff/lib/marketing-labels";
import { getMarketingErrorMessage } from "@/features/staff/lib/marketing-errors";
import {
  ConfirmDialog,
  ContentStatusPill,
  MarketingErrorPanel,
  MarketingHeader,
  useAiBudgetState,
} from "@/features/staff/marketing/MarketingParts";
import { SchedulePanel } from "@/features/staff/marketing/SchedulePanel";
import { AiImagePanel } from "@/features/staff/marketing/AiImagePanel";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const STATUS_HINT: Record<MarketingContent["status"], string> = {
  DRAFT: "Bản nháp: chỉnh sửa thoải mái, xong thì gửi chủ khách sạn duyệt.",
  PENDING_APPROVAL: "Đang chờ chủ khách sạn duyệt. Nội dung tạm khoá chỉnh sửa.",
  APPROVED: "Chủ khách sạn đã duyệt. Nội dung được giữ nguyên như lúc duyệt; hãy lên lịch đăng.",
  SCHEDULED: "Đã lên lịch đăng. Khi chưa có lịch nào đăng xong, bạn có thể đăng thêm lên trang khác.",
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
  const drawImage = useGenerateContentImage();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const { exhausted } = useAiBudgetState(hotelId);
  const editable = EDITABLE_STATUSES.includes(content.status);
  const busy =
    editor.update.isPending ||
    submit.isPending ||
    editor.upload.isPending ||
    editor.removeImage.isPending ||
    drawImage.isPending;

  // Unsaved words are lost on reload or closing the tab: ask first.
  const dirty = editable && editor.dirty;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const sendForApproval = () => {
    // Unsaved words go first: what is submitted is what the owner reads.
    if (editor.dirty) editor.save(() => submit.mutate(content.id));
    else submit.mutate(content.id);
  };

  const actionError = submit.error ?? editor.update.error ?? remove.error;
  const lockedReason =
    content.status === "PENDING_APPROVAL"
      ? "Đang chờ chủ khách sạn duyệt nên chữ và ảnh tạm khoá, để chủ đọc đúng bản đã gửi."
      : content.status === "PUBLISHED"
        ? "Bài đã đăng nên chữ và ảnh không sửa được nữa."
        : "Bài đã được duyệt nên chữ và ảnh giữ nguyên như lúc duyệt. Muốn sửa, hãy tạo bài mới.";

  const imageMenu: ActionMenuItem[] = [
    {
      label: content.mediaUrl ? "Đổi ảnh bằng ảnh tải lên" : "Tải ảnh lên",
      description: "JPG, PNG hoặc WebP, tối đa 10 MB.",
      icon: ImagePlus,
      onSelect: () => fileRef.current?.click(),
      disabled: busy,
    },
    {
      label: "AI vẽ ảnh",
      description: exhausted ? "Đã hết ngân sách AI tháng này." : "Khoảng $0.07 mỗi ảnh, trừ vào ngân sách AI.",
      icon: Wand2,
      onSelect: () => setAiOpen(true),
      disabled: busy || exhausted,
    },
    ...(content.mediaUrl
      ? [
          {
            label: "Gỡ ảnh",
            description: "Bài sẽ không còn ảnh; Instagram bắt buộc có ảnh.",
            icon: Trash2,
            destructive: true,
            onSelect: () => editor.removeImage.mutate(content.id),
            disabled: busy,
          },
        ]
      : []),
  ];

  const submitMenu: ActionMenuItem[] = [
    {
      label: "Lưu nháp",
      description: "Giữ lại chỉnh sửa, chưa gửi duyệt.",
      icon: Save,
      onSelect: () => editor.save(),
      disabled: !editor.dirty || busy,
    },
    {
      label: "Xoá nội dung",
      description: "Xoá hẳn bài này, không khôi phục được.",
      icon: Trash2,
      destructive: true,
      onSelect: () => setConfirmDelete(true),
      disabled: busy,
    },
  ];

  return (
    <div className="space-y-5">
      <MarketingHeader
        title={content.title || "Nội dung chưa có tiêu đề"}
        icon={<Sparkles className="size-7 shrink-0 text-primary" aria-hidden />}
        crumbs={[{ label: "Thư viện nội dung", href: "/staff/marketing/content" }, { label: "Chi tiết" }]}
        description={STATUS_HINT[content.status]}
      />

      {generated && content.status === "DRAFT" && (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden /> AI đã viết xong bản nháp. Đọc lại, chỉnh sửa và thêm ảnh
          trước khi gửi duyệt.
        </p>
      )}
      {content.status === "REJECTED" && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border-2 border-destructive/40 bg-destructive/5 px-4 py-4">
          <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-bold text-destructive">Chủ khách sạn đã từ chối bài này</p>
            <p className="whitespace-pre-line text-sm text-foreground">
              {content.rejectedReason || "Chủ khách sạn không ghi lý do. Hãy đọc lại bài và liên hệ chủ nếu cần."}
            </p>
            <p className="text-xs text-muted-foreground">Sửa theo góp ý rồi gửi duyệt lại.</p>
          </div>
        </div>
      )}
      {!editable && (
        <p className="flex items-start gap-2 rounded-xl border border-border bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden /> {lockedReason}
        </p>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <section className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-2xs sm:p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <ContentStatusPill status={content.status} />
            <span className="text-xs font-semibold uppercase text-primary">{contentTypeLabels[content.contentType]}</span>
            <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" aria-hidden /> {content.authorName ?? "Chủ khách sạn"} · {formatDateTime(content.createdAt)}
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
                  className="h-10"
                />
                {editor.errors.title && <p className="text-xs text-destructive">{editor.errors.title}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="body" className="text-xs font-semibold">
                  Nội dung bài đăng <span className="text-destructive">*</span>
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
                <div className="flex justify-between gap-3 text-xs">
                  <span className={editor.errors.body ? "text-destructive" : "text-muted-foreground"}>
                    {editor.errors.body ?? "AI không tự thêm giá, ngày hay ưu đãi. Kiểm tra lại mọi con số trước khi gửi."}
                  </span>
                  <span className="shrink-0 text-muted-foreground">{editor.body.trim().length}/10.000</span>
                </div>
              </div>
            </>
          ) : (
            <article className="space-y-2">
              {content.title && <h2 className="text-lg font-bold text-foreground">{content.title}</h2>}
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{content.body}</p>
            </article>
          )}

          <div className="space-y-2 border-t border-border pt-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-foreground">Ảnh minh hoạ</p>
              {editable && <ActionMenu items={imageMenu} label="Ảnh" />}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept={IMAGE_TYPES.join(",")}
              className="sr-only"
              aria-label="Chọn ảnh minh hoạ"
              tabIndex={-1}
              onChange={(event) => {
                editor.pickImage(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            {content.mediaUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={content.mediaUrl} alt="Ảnh minh hoạ bài đăng" className="max-h-72 w-full rounded-lg object-cover" />
            ) : (
              <div className="flex h-32 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-muted/40 text-xs text-muted-foreground">
                <ImageIcon className="size-6" aria-hidden /> Chưa có ảnh. Instagram bắt buộc phải có ảnh.
              </div>
            )}
            {(editor.upload.isPending || editor.removeImage.isPending || drawImage.isPending) && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
                <Loader2 className="size-3.5 animate-spin" aria-hidden /> Đang xử lý ảnh…
              </p>
            )}
            {editor.imageError && <p className="text-xs text-destructive">{editor.imageError}</p>}
          </div>

          {actionError && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
              {getMarketingErrorMessage(actionError)}
            </p>
          )}

          {/* The backend deletes only what may still be edited (DRAFT, REJECTED). */}
          {editable && (
            <div className="flex items-center gap-2 border-t border-border pt-4">
              <p className="mr-auto min-w-0 text-xs" role="status">
                {dirty ? (
                  <span className="font-semibold text-amber-700">Có thay đổi chưa lưu. Gửi duyệt sẽ lưu luôn.</span>
                ) : editor.saved ? (
                  <span className="flex items-center gap-1 font-semibold text-emerald-700">
                    <CheckCircle2 className="size-3.5" aria-hidden /> Đã lưu
                  </span>
                ) : (
                  <span className="text-muted-foreground">Gửi duyệt xong, chữ và ảnh sẽ khoá đến khi chủ quyết định.</span>
                )}
              </p>
              <ActionBar
                primary={
                  <Button className="h-10 gap-1.5 whitespace-nowrap" disabled={busy || !editor.body.trim()} onClick={sendForApproval}>
                    {submit.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" aria-hidden />}
                    Gửi chủ duyệt
                  </Button>
                }
                menu={submitMenu}
              />
            </div>
          )}
          {content.status === "PENDING_APPROVAL" && (
            <p className="flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
              <Clock className="size-4 shrink-0" aria-hidden /> Không cần làm gì thêm: bạn sẽ thấy trạng thái đổi khi chủ khách
              sạn duyệt hoặc từ chối.
            </p>
          )}
        </section>

        <aside className="space-y-4">
          {hotelId && <SchedulePanel hotelId={hotelId} content={content} />}
          <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground shadow-2xs">
            <p className="mb-1 font-semibold text-foreground">Quy trình</p>
            <ol className="list-decimal space-y-0.5 pl-4">
              <li>AI viết bản nháp, nhân viên chỉnh sửa và thêm ảnh</li>
              <li>Gửi chủ khách sạn duyệt (chủ có thể từ chối kèm góp ý)</li>
              <li>Bài đã duyệt được lên lịch đăng lên trang đã kết nối</li>
              <li>Sau khi đăng, theo dõi hiệu quả ở mục Hiệu quả tiếp thị</li>
            </ol>
          </div>
        </aside>
      </div>

      {editable && <AiImagePanel content={content} draw={drawImage} hotelId={hotelId} open={aiOpen} onOpenChange={setAiOpen} />}
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Xoá nội dung này?"
        description="Bài viết và ảnh sẽ bị xoá hẳn, không khôi phục được."
        confirmLabel="Xoá nội dung"
        pending={remove.isPending}
        onConfirm={() => remove.mutate(content.id, { onSuccess: onDeleted, onSettled: () => setConfirmDelete(false) })}
      />
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
