"use client";

import { useState, type FormEvent } from "react";
import { FolderPlus } from "lucide-react";
import type { Hotel } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import * as partnerService from "@/services/partner.service";
import { partnerKeys, usePartnerMutation } from "../api/partner-queries";
import {
  savedMessage,
  StickySaveBar,
  usePartnerHotel,
  useUnsavedChanges,
} from "../components";
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
      successMessage: () => savedMessage("tiện ích"),
    },
  );
  const saved = new Set(hotel.amenities.map((amenity) => amenity.id));
  // Each amenity ticked or unticked since the last save is one change.
  const changes = canEdit
    ? selected.filter((id) => !saved.has(id)).length +
      [...saved].filter((id) => !selected.includes(id)).length
    : 0;
  useUnsavedChanges(changes > 0);

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
        <StickySaveBar
          changes={changes}
          pending={mutation.isPending}
          onDiscard={() =>
            setSelected(hotel.amenities.map((amenity) => amenity.id))
          }
          submitLabel="Lưu tiện ích"
        />
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
