"use client";

import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import {
  PRICING_LIMITS,
  updateAvailabilitySchema,
  type RoomType,
  type UpdateAvailabilityInput,
} from "@stayreco/shared";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  getApiErrorCode,
  getApiErrorDetails,
  getApiErrorMessage,
  getApiFieldErrors,
  validateWith,
  type FieldErrors,
} from "@/lib/api-error";
import * as partnerService from "@/services/partner.service";
import { partnerKeys, usePartnerMutation } from "../api/partner-queries";
import { FormAlert, FormField, SubmitButton, toOptionalNumber } from "../components";
import { formatDate } from "../lib/labels";

export type AvailabilityDraft = { roomTypeId: string; from: string; to: string; onSale?: number };

/** "2026-11-21: at most 3 rooms can be on sale" (one `details` entry per day) → a Vietnamese line. */
function describeShortDay(message: string) {
  const match = message.match(/^(\d{4}-\d{2}-\d{2}): at most (\d+) rooms? can be on sale$/);
  return match ? `${formatDate(match[1])}: chỉ còn tối đa ${match[2]} phòng có thể mở bán` : message;
}

export function AvailabilityDialog({
  draft,
  onOpenChange,
  hotelId,
  roomTypes,
}: {
  /** Opens the dialog pre-filled with this range; closed when undefined. */
  draft: AvailabilityDraft | undefined;
  onOpenChange: (open: boolean) => void;
  hotelId: string;
  roomTypes: RoomType[];
}) {
  return (
    <Dialog open={!!draft} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Điều chỉnh số phòng mở bán</DialogTitle>
          <DialogDescription>
            Số phòng còn bán mỗi ngày, sau khi trừ phòng đã đặt và đang giữ chỗ. Đặt 0 để đóng bán các ngày này. Phòng đã
            đặt và đang giữ không bao giờ bị ảnh hưởng.
          </DialogDescription>
        </DialogHeader>
        {draft && (
          <AvailabilityForm
            key={`${draft.roomTypeId}-${draft.from}-${draft.to}`}
            draft={draft}
            hotelId={hotelId}
            roomTypes={roomTypes}
            onSaved={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AvailabilityForm({
  draft,
  hotelId,
  roomTypes,
  onSaved,
}: {
  draft: AvailabilityDraft;
  hotelId: string;
  roomTypes: RoomType[];
  onSaved: () => void;
}) {
  const [roomTypeId, setRoomTypeId] = useState(draft.roomTypeId);
  const [from, setFrom] = useState(draft.from);
  const [to, setTo] = useState(draft.to);
  const [onSale, setOnSale] = useState(draft.onSale?.toString() ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [shortDays, setShortDays] = useState<string[]>([]);

  const mutation = usePartnerMutation(
    (input: UpdateAvailabilityInput) => partnerService.updateAvailability(hotelId, input),
    {
      invalidate: () => [partnerKeys.availabilityOf(hotelId)],
      successMessage: (_, input) =>
        input.onSale === 0 ? "Đã đóng bán các ngày đã chọn." : `Đã đặt ${input.onSale} phòng mở bán mỗi ngày.`,
      errorNotice: false,
      onSuccess: onSaved,
    },
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(undefined);
    setShortDays([]);
    const result = validateWith(updateAvailabilitySchema, { roomTypeId, from, to, onSale: toOptionalNumber(onSale) });
    if (result.errors) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    mutation.mutate(result.data, {
      onError: (error) => {
        setFormError(getApiErrorMessage(error));
        if (getApiErrorCode(error) === "AVAILABILITY_BELOW_BOOKED") {
          setShortDays(getApiErrorDetails(error).map((detail) => describeShortDay(detail.message)));
        } else {
          setErrors(getApiFieldErrors(error));
        }
      },
    });
  }

  const roomType = roomTypes.find((type) => type.id === roomTypeId);

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormField label="Loại phòng" required error={errors.roomTypeId} hint={roomType ? `${roomType.roomCount} phòng vật lý` : undefined}>
        <NativeSelect value={roomTypeId} onChange={(event) => setRoomTypeId(event.target.value)} className="w-full">
          {roomTypes.map((type) => (
            <NativeSelectOption key={type.id} value={type.id}>
              {type.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Từ ngày" required error={errors.from}>
          <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </FormField>
        <FormField label="Đến ngày" required error={errors.to} hint={`Tối đa ${PRICING_LIMITS.availabilityMaxDays} ngày.`}>
          <Input type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} />
        </FormField>
      </div>
      <FormField label="Số phòng mở bán mỗi ngày" required error={errors.onSale} hint="0 = đóng bán.">
        <Input value={onSale} onChange={(event) => setOnSale(event.target.value)} inputMode="numeric" />
      </FormField>
      <FormAlert message={formError} />
      {shortDays.length > 0 && (
        <ul className="max-h-40 list-disc space-y-1 overflow-y-auto pl-6 text-xs text-danger">
          {shortDays.map((day) => (
            <li key={day}>{day}</li>
          ))}
        </ul>
      )}
      <div className="flex justify-end">
        <SubmitButton pending={mutation.isPending}>
          <Save />
          Lưu
        </SubmitButton>
      </div>
    </form>
  );
}
