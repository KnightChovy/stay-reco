"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, RefreshCw, Sparkles } from "lucide-react";
import {
  CONTENT_VARIANTS,
  createContentSchema,
  generateContentSchema,
  type ContentType,
  type ContentVariant,
  type GenerateContentInput,
  type SocialPlatform,
} from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { validateWith } from "@/lib/api-error";
import { useCreateContent, useGenerateVariants } from "../api/marketing-queries";
import { AiBudgetNote, useAiBudgetState } from "./MarketingParts";
import { contentTypeLabels, platformLabels } from "../lib/marketing-labels";
import { getMarketingErrorMessage } from "../lib/marketing-errors";

const TYPES: ContentType[] = ["POST", "PROMOTION", "CAPTION", "BLOG"];
// TikTok takes video only, so the writer is not offered for it (M12); Instagram is not offered on screen (2026-11-28).
const PLATFORMS: Array<SocialPlatform | undefined> = ["FACEBOOK", undefined];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "h-10 rounded-lg border px-3 text-xs font-semibold transition",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

/**
 * The AI writer in two steps (A5): `POST .../marketing-content/variants` writes three versions of one brief and saves
 * none; staff pick one, may edit it, and only that one is saved as a draft (`POST .../marketing-content`). The brand
 * voice and the hotel's own figures are added by the backend, so a one-line brief is enough; an idea fills it in.
 */
export function GenerateContentDialog({
  hotelId,
  open,
  onOpenChange,
  initialBrief = "",
}: {
  hotelId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialBrief?: string;
}) {
  const router = useRouter();
  const variants = useGenerateVariants();
  const create = useCreateContent();
  const [brief, setBrief] = useState(initialBrief);
  const [contentType, setContentType] = useState<ContentType>("POST");
  const [platform, setPlatform] = useState<SocialPlatform | undefined>("FACEBOOK");
  const [errors, setErrors] = useState<Record<string, string>>({});
  // The request the versions on screen came from, so "Viết lại" asks the same thing again.
  const [request, setRequest] = useState<GenerateContentInput>();
  const [versions, setVersions] = useState<ContentVariant[]>([]);
  const [picked, setPicked] = useState<number>();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const { exhausted } = useAiBudgetState(hotelId);
  const busy = variants.isPending || create.isPending;
  const choosing = versions.length > 0;

  const write = (input: GenerateContentInput) => {
    setRequest(input);
    variants.mutate(
      { hotelId, input },
      {
        onSuccess: (result) => {
          setVersions(result);
          setPicked(undefined);
        },
      },
    );
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = validateWith(generateContentSchema, { contentType, brief: brief.trim(), platform });
    if (result.errors) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    write(result.data);
  };

  const pick = (index: number) => {
    setPicked(index);
    setTitle(versions[index].title ?? "");
    setBody(versions[index].body);
    setErrors({});
  };

  const save = () => {
    if (picked === undefined || !request) return;
    const result = validateWith(createContentSchema, {
      contentType: request.contentType,
      title: title.trim() || null,
      body: body.trim(),
    });
    if (result.errors) {
      setErrors(result.errors);
      return;
    }
    create.mutate(
      { hotelId, input: result.data },
      {
        onSuccess: (content) => {
          onOpenChange(false);
          router.push(`/staff/marketing/content/${content.id}?generated=1`);
        },
      },
    );
  };

  const back = () => {
    setVersions([]);
    setPicked(undefined);
    setErrors({});
    variants.reset();
    create.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className={cn("max-h-[90dvh] overflow-y-auto", choosing ? "sm:max-w-5xl" : "sm:max-w-lg")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            {choosing ? `Chọn 1 trong ${versions.length} phương án` : "Viết nội dung bằng AI"}
          </DialogTitle>
          <DialogDescription>
            {choosing
              ? "Chưa phương án nào được lưu. Chọn bản ưng ý nhất, sửa nếu cần, rồi lưu thành bản nháp. Các bản còn lại sẽ bị bỏ."
              : `AI viết ${CONTENT_VARIANTS} phương án theo giọng thương hiệu của khách sạn và không tự bịa giá, ngày hay ưu đãi. Bạn đọc lại và chỉnh sửa trước khi đăng.`}
          </DialogDescription>
        </DialogHeader>

        {choosing ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3" role="radiogroup" aria-label="Phương án">
              {versions.map((version, index) => (
                <button
                  key={index}
                  type="button"
                  role="radio"
                  aria-checked={picked === index}
                  disabled={busy}
                  onClick={() => pick(index)}
                  className={cn(
                    "flex flex-col rounded-xl border p-3 text-left transition",
                    picked === index
                      ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                      : "border-border bg-card hover:bg-muted/50",
                  )}
                >
                  <span className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Phương án {index + 1}
                    {picked === index && (
                      <span className="flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground normal-case">
                        <Check className="size-3" /> Đã chọn
                      </span>
                    )}
                  </span>
                  {version.title && <span className="mb-1 text-sm font-bold text-foreground">{version.title}</span>}
                  <span className="line-clamp-[12] whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                    {version.body}
                  </span>
                </button>
              ))}
            </div>

            {picked !== undefined && (
              <div className="space-y-3 rounded-xl border border-border bg-muted/50 p-3">
                <p className="text-xs font-semibold text-foreground">Sửa phương án {picked + 1} trước khi lưu (không bắt buộc)</p>
                <div className="space-y-1.5">
                  <Label htmlFor="variant-title" className="text-xs font-semibold">
                    Tiêu đề
                  </Label>
                  <Input
                    id="variant-title"
                    maxLength={255}
                    value={title}
                    disabled={busy}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Không bắt buộc"
                    aria-invalid={!!errors.title}
                    className="bg-card text-sm"
                  />
                  {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="variant-body" className="text-xs font-semibold">
                    Nội dung <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="variant-body"
                    rows={8}
                    value={body}
                    disabled={busy}
                    onChange={(event) => setBody(event.target.value)}
                    aria-invalid={!!errors.body}
                    className="bg-card text-sm"
                  />
                  {errors.body && <p className="text-xs text-destructive">{errors.body}</p>}
                </div>
              </div>
            )}

            {(variants.error || create.error) && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
                {getMarketingErrorMessage(
                  variants.error ?? create.error,
                  variants.error ? "Không viết lại được. Vui lòng thử lại." : "Không lưu được bản nháp. Vui lòng thử lại.",
                )}
              </p>
            )}

            <AiBudgetNote hotelId={hotelId} cost="$0.0015 (3 bản)" />

            <DialogFooter className="gap-2 sm:justify-between">
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={back} disabled={busy} className="h-10 gap-1.5">
                  <ArrowLeft className="size-4" /> Sửa yêu cầu
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => request && write(request)}
                  disabled={busy || !request || exhausted}
                  className="h-10 gap-1.5"
                >
                  {variants.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                  Viết lại {CONTENT_VARIANTS} bản
                </Button>
              </div>
              <Button
                type="button"
                onClick={save}
                disabled={busy || picked === undefined || !body.trim()}
                className="h-10 gap-1.5"
              >
                {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                {picked === undefined ? "Chọn một phương án" : "Lưu thành bản nháp"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="brief" className="text-xs font-semibold">
                Bài viết nói về điều gì? <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="brief"
                rows={4}
                maxLength={500}
                value={brief}
                disabled={busy}
                onChange={(event) => setBrief(event.target.value)}
                placeholder="Ví dụ: Cuối tuần này còn phòng hướng biển, mời khách gia đình"
                aria-invalid={!!errors.brief}
                className="text-sm"
              />
              <div className="flex justify-between text-xs">
                <span className={errors.brief ? "text-destructive" : "text-muted-foreground"}>
                  {errors.brief ?? "Một câu là đủ; tối thiểu 5 ký tự."}
                </span>
                <span className="text-muted-foreground">{brief.trim().length}/500</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold">Loại nội dung</span>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Loại nội dung">
                {TYPES.map((type) => (
                  <Chip key={type} active={contentType === type} onClick={() => setContentType(type)}>
                    {contentTypeLabels[type]}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold">Viết cho nền tảng</span>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Nền tảng">
                {PLATFORMS.map((item) => (
                  <Chip key={item ?? "any"} active={platform === item} onClick={() => setPlatform(item)}>
                    {item ? platformLabels[item] : "Chung"}
                  </Chip>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Nền tảng quyết định độ dài và giọng điệu của bài.</p>
            </div>

            {variants.error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
                {getMarketingErrorMessage(variants.error, "Không viết được nội dung. Vui lòng thử lại.")}
              </p>
            )}

            <AiBudgetNote hotelId={hotelId} cost="$0.0015 (3 bản)" />

            <DialogFooter>
              <Button type="button" variant="outline" className="h-10" onClick={() => onOpenChange(false)} disabled={busy}>
                Huỷ
              </Button>
              <Button type="submit" disabled={busy || exhausted} className="h-10 gap-1.5">
                {variants.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> AI đang viết {CONTENT_VARIANTS} phương án…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" /> Viết {CONTENT_VARIANTS} phương án
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
