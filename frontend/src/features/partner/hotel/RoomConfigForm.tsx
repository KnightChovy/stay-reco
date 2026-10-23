"use client";

import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import { roomConfigSchema, type Hotel, type RoomConfigInput } from "@stayreco/shared";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage, getApiFieldErrors, validateWith, type FieldErrors } from "@/lib/api-error";
import * as partnerService from "@/services/partner.service";
import { partnerKeys, usePartnerMutation } from "../api/partner-queries";
import { FormAlert, FormField, SubmitButton, toOptionalNumber, usePartnerHotel } from "../components";
import { formatMoney } from "../lib/labels";

/** Required before any room can be created; `totalRooms` caps the number of rooms (ROOM_LIMIT_REACHED). */
export function RoomConfigForm({ hotel }: { hotel: Hotel }) {
  const { canEdit } = usePartnerHotel();
  const [totalRooms, setTotalRooms] = useState(hotel.roomConfig?.totalRooms.toString() ?? "");
  const [basePrice, setBasePrice] = useState(hotel.roomConfig?.basePrice.toString() ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();

  const mutation = usePartnerMutation((input: RoomConfigInput) => partnerService.setRoomConfig(hotel.id, input), {
    invalidate: () => [partnerKeys.hotel(hotel.id)],
    successMessage: "Đã lưu cấu hình phòng.",
    errorNotice: false,
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(undefined);
    const result = validateWith(roomConfigSchema, {
      totalRooms: toOptionalNumber(totalRooms),
      basePrice: toOptionalNumber(basePrice),
    });
    if (result.errors) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    mutation.mutate(result.data, {
      onError: (error) => {
        setErrors(getApiFieldErrors(error));
        setFormError(getApiErrorMessage(error));
      },
    });
  }

  const preview = toOptionalNumber(basePrice);

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {!hotel.roomConfig && (
        <p className="rounded-xl bg-warning-soft p-4 text-sm text-warning">
          Khách sạn chưa có cấu hình phòng. Bạn cần khai báo trước khi tạo phòng.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          label="Tổng số phòng vật lý"
          required
          error={errors.totalRooms}
          hint="Không thể thấp hơn số phòng đã tạo."
        >
          <Input
            value={totalRooms}
            onChange={(event) => setTotalRooms(event.target.value)}
            inputMode="numeric"
            aria-invalid={!!errors.totalRooms || undefined}
            disabled={!canEdit}
          />
        </FormField>
        <FormField
          label="Giá cơ bản mỗi đêm (VND)"
          required
          error={errors.basePrice}
          hint={preview !== undefined && !Number.isNaN(preview) ? formatMoney(preview) : "Giá mặc định cho loại phòng mới."}
        >
          <Input
            value={basePrice}
            onChange={(event) => setBasePrice(event.target.value)}
            inputMode="decimal"
            aria-invalid={!!errors.basePrice || undefined}
            disabled={!canEdit}
          />
        </FormField>
      </div>
      <FormAlert message={formError} />
      {canEdit && (
        <div className="flex justify-end">
          <SubmitButton pending={mutation.isPending}>
            <Save />
            Lưu cấu hình
          </SubmitButton>
        </div>
      )}
    </form>
  );
}
