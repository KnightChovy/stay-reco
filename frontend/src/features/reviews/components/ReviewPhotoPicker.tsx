"use client";

import { useEffect, useMemo, useRef } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { REVIEW_IMAGE_RULES, type ReviewImage } from "@stayreco/shared";
import { cn } from "@/lib/utils";

/** A photo picked on this device, not uploaded yet: its review may not exist until the form is sent. */
export type PendingPhoto = { id: string; file: File; url: string };

const MAX_MB = REVIEW_IMAGE_RULES.maxBytes / 1024 / 1024;

function readSize(url: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("unreadable"));
    image.src = url;
  });
}

/**
 * The same checks the backend makes (R10), done before anything is sent so a guest learns at once that a panorama or
 * a 15 MB photo will not go through. The server still checks the bytes; this only saves a round trip.
 */
export async function checkReviewPhoto(file: File): Promise<string | null> {
  if (!(REVIEW_IMAGE_RULES.mimeTypes as readonly string[]).includes(file.type)) {
    return `"${file.name}" không phải ảnh JPEG, PNG hoặc WebP.`;
  }
  if (file.size > REVIEW_IMAGE_RULES.maxBytes) return `"${file.name}" lớn hơn ${MAX_MB} MB.`;
  const url = URL.createObjectURL(file);
  try {
    const { width, height } = await readSize(url);
    if (Math.min(width, height) < REVIEW_IMAGE_RULES.minPixels) {
      return `"${file.name}" quá nhỏ (cạnh ngắn cần từ ${REVIEW_IMAGE_RULES.minPixels}px).`;
    }
    if (Math.max(width, height) / Math.min(width, height) > REVIEW_IMAGE_RULES.maxAspectRatio + 0.001) {
      return `"${file.name}" quá dài hoặc quá hẹp: tỉ lệ cần từ 1:1 đến 4:3 (ngang hoặc dọc).`;
    }
    return null;
  } catch {
    return `Không đọc được "${file.name}".`;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * The photos of a review: the ones already saved (removed at once through the API) and the ones picked on this
 * device (uploaded after the review is sent). At most five in all.
 */
export function ReviewPhotoPicker({
  saved,
  pending,
  onAdd,
  onRemovePending,
  onRemoveSaved,
  removingId,
  disabled,
  error,
}: {
  saved: ReviewImage[];
  pending: PendingPhoto[];
  onAdd: (files: File[]) => void;
  onRemovePending: (id: string) => void;
  onRemoveSaved?: (image: ReviewImage) => void;
  removingId?: string | null;
  disabled?: boolean;
  error?: string | null;
}) {
  const input = useRef<HTMLInputElement>(null);
  const total = saved.length + pending.length;
  const left = REVIEW_IMAGE_RULES.maxPerReview - total;
  const hintId = "review-photo-rules";

  // Previews are object URLs: free them when a photo leaves the list or the form unmounts.
  const urls = useMemo(() => pending.map((photo) => photo.url), [pending]);
  const latest = useRef(urls);
  useEffect(() => {
    const previous = latest.current;
    previous.filter((url) => !urls.includes(url)).forEach((url) => URL.revokeObjectURL(url));
    latest.current = urls;
  }, [urls]);
  useEffect(() => () => latest.current.forEach((url) => URL.revokeObjectURL(url)), []);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">
          Ảnh kỳ nghỉ <span className="font-normal text-muted-foreground">(không bắt buộc)</span>
        </p>
        <span className="text-xs text-muted-foreground">
          {total}/{REVIEW_IMAGE_RULES.maxPerReview}
        </span>
      </div>
      <p id={hintId} className="text-xs text-muted-foreground">
        Tối đa {REVIEW_IMAGE_RULES.maxPerReview} ảnh JPEG, PNG hoặc WebP, mỗi ảnh đến {MAX_MB} MB, tỉ lệ từ 1:1 đến 4:3
        (ngang hoặc dọc). Không chụp rõ mặt người khác hay giấy tờ cá nhân.
      </p>

      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {saved.map((image) => (
          <li key={image.id} className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element -- review photos come from storage at their own size */}
            <img src={image.url} alt="Ảnh đã đăng" className="size-full object-cover" />
            {onRemoveSaved && (
              <button
                type="button"
                onClick={() => onRemoveSaved(image)}
                disabled={disabled || removingId === image.id}
                className="absolute top-1 right-1 flex size-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-60"
                aria-label="Xoá ảnh này"
              >
                {removingId === image.id ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
              </button>
            )}
          </li>
        ))}
        {pending.map((photo) => (
          <li key={photo.id} className="relative aspect-square overflow-hidden rounded-lg border border-dashed border-primary/40 bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element -- a local preview (object URL) */}
            <img src={photo.url} alt={`Ảnh sẽ tải lên: ${photo.file.name}`} className="size-full object-cover" />
            <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-xs font-semibold text-white">
              Chưa tải lên
            </span>
            <button
              type="button"
              onClick={() => onRemovePending(photo.id)}
              disabled={disabled}
              className="absolute top-1 right-1 flex size-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-60"
              aria-label={`Bỏ ảnh ${photo.file.name}`}
            >
              <X className="size-4" />
            </button>
          </li>
        ))}
        {left > 0 && (
          <li>
            <button
              type="button"
              onClick={() => input.current?.click()}
              disabled={disabled}
              aria-describedby={hintId}
              className={cn(
                "flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-60",
              )}
            >
              <ImagePlus className="size-5" aria-hidden />
              Thêm ảnh
            </button>
          </li>
        )}
      </ul>
      <input
        ref={input}
        type="file"
        accept={REVIEW_IMAGE_RULES.mimeTypes.join(",")}
        multiple
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []).slice(0, Math.max(0, left));
          event.target.value = "";
          if (files.length > 0) onAdd(files);
        }}
      />
      {error && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
