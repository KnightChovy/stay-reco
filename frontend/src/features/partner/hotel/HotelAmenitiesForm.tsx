"use client";

import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import type { Hotel } from "@stayreco/shared";
import * as partnerService from "@/services/partner.service";
import { partnerKeys, usePartnerMutation } from "../api/partner-queries";
import { SubmitButton, usePartnerHotel } from "../components";
import { AmenityPicker } from "./AmenityPicker";

export function HotelAmenitiesForm({ hotel }: { hotel: Hotel }) {
  const { canEdit } = usePartnerHotel();
  const [selected, setSelected] = useState(() => hotel.amenities.map((amenity) => amenity.id));
  const mutation = usePartnerMutation((ids: string[]) => partnerService.setHotelAmenities(hotel.id, ids), {
    invalidate: () => [partnerKeys.hotel(hotel.id)],
    successMessage: "Đã cập nhật tiện ích.",
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate(selected);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Đã chọn <strong className="text-primary">{selected.length}</strong> tiện ích. Khi lưu, danh sách này thay thế toàn
        bộ tiện ích hiện tại.
      </p>
      <AmenityPicker selected={selected} onChange={setSelected} disabled={!canEdit} />
      {canEdit && (
        <div className="flex justify-end">
          <SubmitButton pending={mutation.isPending}>
            <Save />
            Lưu tiện ích
          </SubmitButton>
        </div>
      )}
    </form>
  );
}
