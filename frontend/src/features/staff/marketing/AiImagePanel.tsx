"use client";

import { useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { generateImageSchema, type MarketingContent } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { validateWith } from "@/lib/api-error";
import type { useGenerateContentImage } from "../api/marketing-queries";
import { getMarketingErrorMessage } from "../lib/marketing-errors";
import { AiBudgetNote, useAiBudgetState } from "./MarketingParts";

/**
 * "AI vẽ ảnh" (A4): `POST /marketing-content/:id/image/generate` draws one square picture for a piece not yet published
 * piece and attaches it like an upload. The prompt is optional; the post's own words are used when it is empty. The
 * mutation lives in the editor so its other picture buttons wait while a picture is being drawn.
 */
export function AiImagePanel({
  content,
  draw,
  hotelId,
  open,
  onOpenChange,
}: {
  content: MarketingContent;
  draw: ReturnType<typeof useGenerateContentImage>;
  hotelId: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { exhausted } = useAiBudgetState(hotelId);

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
          onOpenChange(false);
          setPrompt("");
        },
        onError: (err) => setError(getMarketingErrorMessage(err, "AI chưa vẽ được ảnh. Vui lòng thử lại.")),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !draw.isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="size-4 text-primary" aria-hidden /> AI vẽ ảnh
          </DialogTitle>
          <DialogDescription>
            {content.mediaUrl ? "Ảnh mới sẽ thay ảnh hiện tại." : "Ảnh được gắn vào bài như ảnh tải lên."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="ai-image-prompt" className="text-xs font-semibold text-foreground">
            Ảnh nên thể hiện điều gì? <span className="font-normal text-muted-foreground">(không bắt buộc)</span>
          </Label>
          <Textarea
            id="ai-image-prompt"
            rows={3}
            maxLength={500}
            value={prompt}
            disabled={draw.isPending}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ví dụ: Hồ bơi lúc hoàng hôn. Để trống thì AI vẽ theo nội dung bài."
            className="text-sm"
          />
          <AiBudgetNote hotelId={hotelId} cost="$0.07" />
          <p className="text-xs text-muted-foreground">
            AI không vẽ chữ, logo hay khuôn mặt. Kiểm tra kỹ: ảnh không được thể hiện phòng hay tiện ích khách sạn không có.
          </p>
          {error && (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" className="h-10" disabled={draw.isPending} onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button type="button" className="h-10 gap-1.5" disabled={draw.isPending || exhausted} onClick={run}>
            {draw.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden /> AI đang vẽ, có thể mất vài chục giây…
              </>
            ) : (
              <>
                <Wand2 className="size-4" aria-hidden /> Vẽ ảnh
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
