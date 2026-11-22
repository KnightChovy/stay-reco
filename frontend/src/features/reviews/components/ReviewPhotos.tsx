"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Flag } from "lucide-react";
import type { ReviewImage } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * The photos a guest attached to a review: small thumbnails under the text, opening a viewer with previous / next
 * (buttons or arrow keys) and a way to report the photo on screen.
 */
export function ReviewPhotos({
  images,
  authorName,
  onReport,
}: {
  images: ReviewImage[];
  authorName: string;
  onReport?: (image: ReviewImage) => void;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const current = open === null ? null : images[open];

  useEffect(() => {
    if (open === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") setOpen((index) => (index === null ? index : (index + 1) % images.length));
      if (event.key === "ArrowLeft") setOpen((index) => (index === null ? index : (index - 1 + images.length) % images.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length]);

  if (images.length === 0) return null;

  return (
    <>
      <ul className="flex gap-2 overflow-x-auto pb-1" aria-label={`Ảnh của ${authorName}`}>
        {images.map((image, index) => (
          <li key={image.id} className="shrink-0">
            <button
              type="button"
              onClick={() => setOpen(index)}
              className="block size-20 overflow-hidden rounded-lg bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:size-24"
              aria-label={`Xem ảnh ${index + 1} trên ${images.length} của ${authorName}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- review photos come from storage at their own size */}
              <img src={image.url} alt="" className="size-full object-cover transition-transform hover:scale-105" loading="lazy" />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] gap-3 p-3 sm:max-w-3xl">
          <DialogHeader className="px-1">
            <DialogTitle className="text-sm">
              Ảnh của {authorName} · {open !== null ? open + 1 : 0}/{images.length}
            </DialogTitle>
            <DialogDescription className="sr-only">Dùng phím mũi tên để chuyển ảnh.</DialogDescription>
          </DialogHeader>
          {current && (
            <div className="relative flex items-center justify-center rounded-lg bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element -- review photos come from storage at their own size */}
              <img
                src={current.url}
                alt={`Ảnh ${open! + 1} của ${authorName}`}
                className="max-h-[70dvh] w-auto object-contain"
                width={current.width}
                height={current.height}
              />
              {images.length > 1 && (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={() => setOpen((index) => (index === null ? index : (index - 1 + images.length) % images.length))}
                    className="absolute left-2 size-10 rounded-full bg-white/85"
                    aria-label="Ảnh trước"
                  >
                    <ChevronLeft className="size-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={() => setOpen((index) => (index === null ? index : (index + 1) % images.length))}
                    className="absolute right-2 size-10 rounded-full bg-white/85"
                    aria-label="Ảnh sau"
                  >
                    <ChevronRight className="size-5" />
                  </Button>
                </>
              )}
            </div>
          )}
          {current && onReport && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  const image = current;
                  setOpen(null);
                  onReport(image);
                }}
                className="h-10 gap-1.5 text-sm text-muted-foreground hover:text-red-600"
              >
                <Flag className="size-4" /> Báo cáo ảnh này
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
