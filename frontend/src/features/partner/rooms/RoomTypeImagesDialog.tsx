"use client";

import type { RoomType } from "@stayreco/shared";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import * as partnerService from "@/services/partner.service";
import { partnerKeys, usePartnerMutation } from "../api/partner-queries";
import { ImageGallery } from "../components/ImageGallery";

export function RoomTypeImagesDialog({
  roomType,
  canEdit,
  onOpenChange,
}: {
  /** Opens the dialog for this room type; the latest list data is passed in, so uploads show up after refetch. */
  roomType: RoomType | undefined;
  canEdit: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const hotelId = roomType?.hotelId ?? "";
  const invalidate = () => [partnerKeys.roomTypes(hotelId)];

  const upload = usePartnerMutation(
    async (files: File[]) => {
      for (const file of files) await partnerService.uploadRoomTypeImage(roomType!.id, file);
    },
    { invalidate, successMessage: (_, files) => `Đã tải lên ${files.length} ảnh.` },
  );
  const caption = usePartnerMutation(
    ({ id, caption }: { id: string; caption: string | null }) => partnerService.updateRoomTypeImage(id, { caption }),
    { invalidate, successMessage: "Đã lưu chú thích." },
  );
  const remove = usePartnerMutation((id: string) => partnerService.deleteRoomTypeImage(id), {
    invalidate,
    successMessage: "Đã xoá ảnh.",
  });

  const images = [...(roomType?.images ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <Dialog open={!!roomType} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Ảnh loại phòng {roomType?.name}</DialogTitle>
          <DialogDescription>Ảnh hiển thị theo thứ tự tải lên; ảnh đầu tiên được dùng làm ảnh đại diện.</DialogDescription>
        </DialogHeader>
        {roomType && (
          <ImageGallery
            images={images}
            canEdit={canEdit}
            uploading={upload.isPending}
            onUpload={(files) => upload.mutate(files)}
            onDelete={(id) => remove.mutate(id)}
            deletingId={remove.isPending ? remove.variables : undefined}
            onCaption={(id, value) => caption.mutate({ id, caption: value })}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
