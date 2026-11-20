"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type GalleryImage = { id: string; url: string; caption: string | null };

/**
 * The photos of a hotel or a room type: one large and up to four small on desktop, a swipeable strip on phones.
 * Any photo opens the lightbox, which pages with the arrow buttons or the keyboard arrows.
 */
export function StayGallery({ images, alt, className }: { images: GalleryImage[]; alt: string; className?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const count = images.length;
  const thumbs = images.slice(1, 5);

  return (
    <div className={className}>
      {/* Phones: one swipeable row, every photo full width. */}
      <div className="relative sm:hidden">
        <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-2xl">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setOpen(index)}
              className="relative aspect-[4/3] w-full shrink-0 snap-center bg-muted"
              aria-label={`Xem ảnh ${index + 1} trên ${count}`}
            >
              <Image
                src={image.url}
                alt={image.caption ?? `${alt} – ảnh ${index + 1}`}
                fill
                sizes="100vw"
                className="object-cover"
                priority={index === 0}
              />
            </button>
          ))}
        </div>
        {count > 1 && (
          <span className="pointer-events-none absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs font-semibold text-white">
            <Images className="size-3.5" aria-hidden /> {count} ảnh · vuốt để xem
          </span>
        )}
      </div>

      {/* Tablet and up: one large photo and a 2×2 grid. */}
      <div
        className={cn(
          "hidden h-80 gap-2 overflow-hidden rounded-2xl sm:grid lg:h-96",
          thumbs.length > 0 ? "grid-cols-4 grid-rows-2" : "grid-cols-1",
        )}
      >
        {images.slice(0, 1 + thumbs.length).map((image, index) => {
          const isLast = index === thumbs.length && count > 5;
          return (
            <button
              key={image.id}
              type="button"
              onClick={() => setOpen(index)}
              className={cn(
                "group relative bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
                index === 0 && thumbs.length > 0 && "col-span-2 row-span-2",
                index === 0 && thumbs.length === 1 && "col-span-2",
                thumbs.length === 1 && index === 1 && "col-span-2 row-span-2",
                // Two or three thumbnails: widen the ones that would leave an empty cell in the 2×2 block.
                thumbs.length === 2 && index > 0 && "col-span-2",
                thumbs.length === 3 && index === 3 && "col-span-2",
              )}
              aria-label={`Xem ảnh ${index + 1} trên ${count}`}
            >
              <Image
                src={image.url}
                alt={image.caption ?? `${alt} – ảnh ${index + 1}`}
                fill
                sizes={index === 0 ? "(min-width: 1024px) 50vw, 60vw" : "25vw"}
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                priority={index === 0}
              />
              {isLast && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-semibold text-white">
                  +{count - 5} ảnh
                </span>
              )}
            </button>
          );
        })}
      </div>
      {count > 1 && (
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(0)}
          className="mt-2 hidden h-10 gap-1.5 sm:inline-flex"
        >
          <Images className="size-4" /> Xem tất cả {count} ảnh
        </Button>
      )}

      <Lightbox images={images} alt={alt} index={open} onIndexChange={setOpen} />
    </div>
  );
}

function Lightbox({
  images,
  alt,
  index,
  onIndexChange,
}: {
  images: GalleryImage[];
  alt: string;
  index: number | null;
  onIndexChange: (index: number | null) => void;
}) {
  const count = images.length;
  const go = (step: number) => {
    if (index === null) return;
    onIndexChange((index + step + count) % count);
  };

  useEffect(() => {
    if (index === null || count < 2) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") onIndexChange((index + 1) % count);
      if (event.key === "ArrowLeft") onIndexChange((index - 1 + count) % count);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, count, onIndexChange]);

  const image = index === null ? undefined : images[index];

  return (
    <Dialog open={index !== null} onOpenChange={(open) => !open && onIndexChange(null)}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-3 bg-black p-3 text-white ring-white/10 sm:max-w-5xl">
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <DialogDescription className="sr-only">
          Ảnh {index === null ? 0 : index + 1} trên {count}. Dùng phím mũi tên để chuyển ảnh.
        </DialogDescription>
        {image && (
          <div className="relative h-[min(70dvh,40rem)] w-full">
            <Image
              src={image.url}
              alt={image.caption ?? `${alt} – ảnh ${(index ?? 0) + 1}`}
              fill
              sizes="(min-width: 1024px) 64rem, 100vw"
              className="object-contain"
            />
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="size-10"
            onClick={() => go(-1)}
            disabled={count < 2}
            aria-label="Ảnh trước"
          >
            <ChevronLeft className="size-5" />
          </Button>
          <p className="min-w-0 truncate text-center text-sm text-white/80">
            {(index ?? 0) + 1} / {count}
            {image?.caption ? ` · ${image.caption}` : ""}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="size-10"
            onClick={() => go(1)}
            disabled={count < 2}
            aria-label="Ảnh sau"
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
