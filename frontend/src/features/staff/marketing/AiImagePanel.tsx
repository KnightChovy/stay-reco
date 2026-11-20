"use client";

import { useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { generateImageSchema, type MarketingContent } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { validateWith } from "@/lib/api-error";
import type { useGenerateContentImage } from "../api/marketing-queries";
import { getMarketingErrorMessage } from "../lib/marketing-errors";

/**
 * "AI vẽ ảnh" (A4): `POST /marketing-content/:id/image/generate` draws one square picture for a DRAFT or REJECTED
 * piece and attaches it like an upload. The prompt is optional; the post's own words are used when it is empty. The
 * mutation lives in the editor so its other picture buttons wait while a picture is being drawn.
 */
export function AiImagePanel({
  content,
  draw,
  disabled,
}: {
  content: MarketingContent;
  draw: ReturnType<typeof useGenerateContentImage>;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    const trimmed = prompt.trim();
    const result = validateWith(generateImageSchema, trimmed ? { prompt: trimmed } : {});
    if (result.errors) {
      setError(result.errors.prompt ?? "Mô tả ảnh cần từ 5 đến 500 ký tự.");
      return;
    }
    setError(null);
    draw.mutate(
      { contentId: content.id, input: result.data },
      {
        onSuccess: () => {
          setOpen(false);
          setPrompt("");
        },
        onError: (err) => setError(getMarketingErrorMessage(err, "AI chưa vẽ được ảnh. Vui lòng thử lại.")),
      },
    );
  };

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 border-[#934a33]/40 text-xs text-[#934a33] hover:bg-[#934a33]/5"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <Wand2 className="size-3.5" /> AI vẽ ảnh
      </Button>
    );
  }

  return (
    <div className="w-full space-y-2 rounded-lg border border-[#934a33]/20 bg-[#934a33]/5 p-3">
      <Label htmlFor="ai-image-prompt" className="text-xs font-semibold text-slate-700">
        Ảnh nên thể hiện điều gì? <span className="font-normal text-slate-400">(không bắt buộc)</span>
      </Label>
      <Textarea
        id="ai-image-prompt"
        rows={2}
        maxLength={500}
        value={prompt}
        disabled={draw.isPending}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Ví dụ: Hồ bơi lúc hoàng hôn. Để trống thì AI vẽ theo nội dung bài."
        className="bg-white text-sm"
      />
      <ul className="list-disc space-y-0.5 pl-4 text-[11px] text-slate-500">
        <li>Mỗi ảnh tốn khoảng $0.07, trừ vào cùng ngân sách AI hằng tháng với phần chữ.</li>
        <li>{content.mediaUrl ? "Ảnh mới sẽ thay ảnh hiện tại." : "Ảnh được gắn vào bài như ảnh tải lên."}</li>
        <li>AI không vẽ chữ, logo hay khuôn mặt. Kiểm tra kỹ: ảnh không được thể hiện phòng hay tiện ích khách sạn không có.</li>
      </ul>
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          className="gap-1.5 bg-[#934a33] text-xs text-white hover:bg-[#7a341e]"
          disabled={disabled || draw.isPending}
          onClick={run}
        >
          {draw.isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" /> AI đang vẽ, có thể mất vài chục giây…
            </>
          ) : (
            <>
              <Wand2 className="size-3.5" /> Vẽ ảnh
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs"
          disabled={draw.isPending}
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
        >
          Huỷ
        </Button>
      </div>
    </div>
  );
}
