"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { generateContentSchema, type ContentType, type SocialPlatform } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { validateWith } from "@/lib/api-error";
import { useGenerateContent } from "../api/marketing-queries";
import { contentTypeLabels, platformLabels } from "../lib/marketing-labels";
import { getMarketingErrorMessage } from "../lib/marketing-errors";

const TYPES: ContentType[] = ["POST", "PROMOTION", "CAPTION", "BLOG"];
// TikTok takes video only, so the writer is not offered for it (M12).
const PLATFORMS: Array<SocialPlatform | undefined> = ["FACEBOOK", "INSTAGRAM", undefined];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
        active ? "border-[#934a33] bg-[#934a33] text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Asks the AI writer for a draft (`POST /hotels/:id/marketing-content/generate`). The brand voice and the hotel's
 * own figures are added by the backend, so a one-line brief is enough; an idea fills it in.
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
  const generate = useGenerateContent();
  const [brief, setBrief] = useState(initialBrief);
  const [contentType, setContentType] = useState<ContentType>("POST");
  const [platform, setPlatform] = useState<SocialPlatform | undefined>("FACEBOOK");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = validateWith(generateContentSchema, { contentType, brief: brief.trim(), platform });
    if (result.errors) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    generate.mutate(
      { hotelId, input: result.data },
      {
        onSuccess: (content) => {
          onOpenChange(false);
          router.push(`/staff/marketing/content/${content.id}?generated=1`);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !generate.isPending && onOpenChange(next)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-[#934a33]" /> Viết nội dung bằng AI
          </DialogTitle>
          <DialogDescription>
            AI viết theo giọng thương hiệu của khách sạn và không tự bịa giá, ngày hay ưu đãi. Bản nháp cần chủ khách
            sạn duyệt trước khi đăng.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="brief" className="text-xs font-semibold">
              Bài viết nói về điều gì? <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="brief"
              rows={4}
              maxLength={500}
              value={brief}
              disabled={generate.isPending}
              onChange={(event) => setBrief(event.target.value)}
              placeholder="Ví dụ: Cuối tuần này còn phòng hướng biển, mời khách gia đình"
              aria-invalid={!!errors.brief}
              className="text-sm"
            />
            <div className="flex justify-between text-[11px]">
              <span className={errors.brief ? "text-red-600" : "text-slate-400"}>
                {errors.brief ?? "Một câu là đủ; tối thiểu 5 ký tự."}
              </span>
              <span className="text-slate-400">{brief.trim().length}/500</span>
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
            <p className="text-[11px] text-slate-400">Nền tảng quyết định độ dài và giọng điệu của bài.</p>
          </div>

          {generate.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
              {getMarketingErrorMessage(generate.error, "Không tạo được bản nháp. Vui lòng thử lại.")}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={generate.isPending}>
              Huỷ
            </Button>
            <Button type="submit" disabled={generate.isPending} className="gap-1.5 bg-[#934a33] text-white hover:bg-[#7a341e]">
              {generate.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> AI đang viết…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" /> Tạo bản nháp
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
