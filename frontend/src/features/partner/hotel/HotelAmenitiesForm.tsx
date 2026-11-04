"use client";

import { useState, type FormEvent } from "react";
import { FolderPlus, Plus, Save } from "lucide-react";
import type { Hotel } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import * as partnerService from "@/services/partner.service";
import { partnerKeys, usePartnerMutation } from "../api/partner-queries";
import { SubmitButton, usePartnerHotel } from "../components";
import { AmenityDialog, type AmenityDialogMode } from "./AmenityDialog";
import { AmenityPicker } from "./AmenityPicker";

export function HotelAmenitiesForm({ hotel }: { hotel: Hotel }) {
  const { canEdit } = usePartnerHotel();
  const [selected, setSelected] = useState(() =>
    hotel.amenities.map((amenity) => amenity.id),
  );
  const [dialog, setDialog] = useState<{
    mode: AmenityDialogMode;
    category?: string;
  }>();
  const mutation = usePartnerMutation(
    (ids: string[]) => partnerService.setHotelAmenities(hotel.id, ids),
    {
      invalidate: () => [partnerKeys.hotel(hotel.id)],
      successMessage: "Đã cập nhật tiện ích.",
    },
  );
  const saved = new Set(hotel.amenities.map((amenity) => amenity.id));
  const isDirty =
    selected.length !== saved.size || selected.some((id) => !saved.has(id));

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate(selected);
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Đã chọn <strong className="text-primary">{selected.length}</strong>{" "}
            tiện ích. Khi lưu, danh sách này thay thế toàn bộ tiện ích hiện tại.
          </p>
          {canEdit && (
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialog({ mode: "category" })}
              >
                <FolderPlus />
                Thêm danh mục
              </Button>
            </div>
          )}
        </div>
        <AmenityPicker
          selected={selected}
          onChange={setSelected}
          disabled={!canEdit}
          onAdd={(category) => setDialog({ mode: "amenity", category })}
        />
        {canEdit && (
          <div className="flex items-center justify-end gap-3">
            {isDirty && (
              <span className="text-xs font-semibold text-warning">
                Có thay đổi chưa lưu
              </span>
            )}
            <SubmitButton pending={mutation.isPending}>
              <Save />
              Lưu tiện ích
            </SubmitButton>
          </div>
        )}
      </form>
      {/* Outside the form: React submit events bubble through the dialog portal and would save the selection too. */}
      <AmenityDialog
        open={!!dialog}
        onOpenChange={(open) => !open && setDialog(undefined)}
        mode={dialog?.mode ?? "amenity"}
        defaultCategory={dialog?.category}
        // A new amenity is meant for this hotel, so it is ticked right away; saving still applies it.
        onCreated={(amenity) => setSelected((prev) => [...prev, amenity.id])}
      />
    </>
  );
}
