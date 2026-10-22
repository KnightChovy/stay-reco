"use client";

import type { Hotel } from "@stayreco/shared";
import * as partnerService from "@/services/partner.service";
import { partnerKeys, usePartnerMutation } from "../api/partner-queries";
import { usePartnerHotel } from "../components";
import { ImageGallery } from "../components/ImageGallery";

export function HotelImagesManager({ hotel }: { hotel: Hotel }) {
  const { canEdit } = usePartnerHotel();
  // The cover shows in the hotel list too.
  const invalidate = () => [partnerKeys.hotel(hotel.id), partnerKeys.hotels()];

  const upload = usePartnerMutation(
    async (files: File[]) => {
      // One at a time: the first image of a hotel becomes the cover, so the order matters.
      for (const file of files) await partnerService.uploadHotelImage(hotel.id, file);
    },
    { invalidate, successMessage: (_, files) => `Đã tải lên ${files.length} ảnh.` },
  );
  const update = usePartnerMutation(
    ({ id, ...input }: { id: string; caption?: string | null; isCover?: true }) =>
      partnerService.updateHotelImage(id, input),
    { invalidate, successMessage: (_, vars) => (vars.isCover ? "Đã đổi ảnh bìa." : "Đã lưu chú thích.") },
  );
  const remove = usePartnerMutation((id: string) => partnerService.deleteHotelImage(id), {
    invalidate,
    successMessage: "Đã xoá ảnh.",
  });

  const images = [...hotel.images].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <ImageGallery
      images={images}
      canEdit={canEdit}
      uploading={upload.isPending}
      onUpload={(files) => upload.mutate(files)}
      onDelete={(id) => remove.mutate(id)}
      deletingId={remove.isPending ? remove.variables : undefined}
      onCaption={(id, caption) => update.mutate({ id, caption })}
      onSetCover={(id) => update.mutate({ id, isCover: true })}
    />
  );
}
