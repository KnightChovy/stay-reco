"use client";

import Image from "next/image";
import { useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, Star, Trash2 } from "lucide-react";
import { UPLOAD_RULES } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog, StatusBadge } from "./PartnerUi";

type GalleryImage = { id: string; url: string; caption: string | null; isCover?: boolean };

/** Checks type and size before uploading; the backend checks again from the file content. */
export function checkImageFile(file: File): string | undefined {
  if (!(UPLOAD_RULES.image.mimeTypes as readonly string[]).includes(file.type)) {
    return `${file.name}: chỉ nhận ảnh JPG, PNG hoặc WebP.`;
  }
  if (file.size > UPLOAD_RULES.image.maxBytes) return `${file.name}: ảnh vượt quá 10 MB.`;
  return undefined;
}

/**
 * Upload, caption and delete images. Hotels pass `onSetCover` (exactly one cover); room types have no cover and are
 * shown by `sortOrder`.
 */
export function ImageGallery({
  images,
  canEdit,
  uploading,
  onUpload,
  onDelete,
  onCaption,
  onSetCover,
  deletingId,
}: {
  images: GalleryImage[];
  canEdit: boolean;
  uploading: boolean;
  onUpload: (files: File[]) => void;
  onDelete: (imageId: string) => void;
  onCaption: (imageId: string, caption: string | null) => void;
  onSetCover?: (imageId: string) => void;
  deletingId?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string>();
  const [pendingDelete, setPendingDelete] = useState<GalleryImage>();
  const remaining = UPLOAD_RULES.maxImages - images.length;

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    const problems = files.map(checkImageFile).filter(Boolean);
    if (problems.length) {
      setFileError(problems.join(" "));
      return;
    }
    if (files.length > remaining) {
      setFileError(`Chỉ còn có thể thêm ${remaining} ảnh (tối đa ${UPLOAD_RULES.maxImages}).`);
      return;
    }
    setFileError(undefined);
    onUpload(files);
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex flex-col gap-3 rounded-xl border border-dashed p-4 sm:flex-row sm:items-center">
          <div className="flex-1 text-sm text-muted-foreground">
            JPG, PNG hoặc WebP, tối đa 10 MB mỗi ảnh. Đã dùng {images.length}/{UPLOAD_RULES.maxImages} ảnh.
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={UPLOAD_RULES.image.mimeTypes.join(",")}
            multiple
            className="sr-only"
            onChange={handleFiles}
            aria-label="Chọn ảnh tải lên"
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading || remaining <= 0}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Spinner /> : <ImagePlus />}
            {uploading ? "Đang tải lên..." : "Thêm ảnh"}
          </Button>
        </div>
      )}
      {fileError && (
        <p role="alert" className="text-sm text-danger">
          {fileError}
        </p>
      )}

      {images.length === 0 ? (
        <p className="rounded-xl bg-muted p-6 text-center text-sm text-muted-foreground">Chưa có ảnh nào.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((image) => (
            <li key={image.id} className="overflow-hidden rounded-xl border bg-card">
              <div className="relative aspect-[4/3] bg-muted">
                <Image
                  src={image.url}
                  alt={image.caption ?? "Ảnh khách sạn"}
                  fill
                  sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw"
                  className="object-cover"
                />
                {image.isCover && (
                  <StatusBadge tone="success" className="absolute left-2 top-2 shadow-sm">
                    Ảnh bìa
                  </StatusBadge>
                )}
              </div>
              <div className="space-y-2 p-3">
                <Input
                  key={image.caption ?? ""}
                  defaultValue={image.caption ?? ""}
                  placeholder="Chú thích ảnh"
                  aria-label="Chú thích ảnh"
                  maxLength={255}
                  disabled={!canEdit}
                  onBlur={(event) => {
                    const caption = event.target.value.trim() || null;
                    if (caption !== image.caption) onCaption(image.id, caption);
                  }}
                />
                {canEdit && (
                  <div className="flex gap-2">
                    {onSetCover && !image.isCover && (
                      <Button type="button" variant="outline" size="sm" onClick={() => onSetCover(image.id)}>
                        <Star />
                        Đặt làm ảnh bìa
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-auto text-danger"
                      onClick={() => setPendingDelete(image)}
                    >
                      <Trash2 />
                      Xoá
                    </Button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(undefined)}
        title="Xoá ảnh này?"
        description={
          pendingDelete?.isCover
            ? "Đây là ảnh bìa. Sau khi xoá, ảnh kế tiếp sẽ tự động trở thành ảnh bìa."
            : "Ảnh sẽ bị xoá vĩnh viễn."
        }
        confirmLabel="Xoá ảnh"
        destructive
        pending={!!pendingDelete && deletingId === pendingDelete.id}
        onConfirm={() => {
          if (!pendingDelete) return;
          onDelete(pendingDelete.id);
          setPendingDelete(undefined);
        }}
      />
    </div>
  );
}
