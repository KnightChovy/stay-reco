"use client";

import { useState, type FormEvent } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import {
  createRoomTypeSchema,
  updateRoomTypeSchema,
  type CreateRoomTypeInput,
  type RoomType,
  type UpdateRoomTypeInput,
} from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage, getApiFieldErrors, validateWith, type FieldErrors } from "@/lib/api-error";
import * as partnerService from "@/services/partner.service";
import { partnerKeys, useBedTypes, usePartnerMutation } from "../api/partner-queries";
import { FormAlert, FormField, SubmitButton, toOptionalNumber, toOptionalText } from "../components";
import { AmenityPicker } from "../hotel/AmenityPicker";
import { formatMoney } from "../lib/labels";

type BedRow = { key: number; bedTypeId: string; quantity: string };

export function RoomTypeDialog({
  open,
  onOpenChange,
  hotelId,
  roomType,
  defaultBasePrice,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotelId: string;
  /** Edits this room type; creates a new one when omitted. */
  roomType?: RoomType;
  /** The hotel's room-config base price, suggested for a new room type. */
  defaultBasePrice?: number;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{roomType ? `Sửa loại phòng ${roomType.name}` : "Thêm loại phòng"}</DialogTitle>
          <DialogDescription>Giá cơ bản là giá mỗi đêm trước khi áp dụng luật giá theo mùa.</DialogDescription>
        </DialogHeader>
        {open && (
          <RoomTypeForm
            hotelId={hotelId}
            roomType={roomType}
            defaultBasePrice={defaultBasePrice}
            onSaved={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RoomTypeForm({
  hotelId,
  roomType,
  defaultBasePrice,
  onSaved,
}: {
  hotelId: string;
  roomType?: RoomType;
  defaultBasePrice?: number;
  onSaved: () => void;
}) {
  const bedTypes = useBedTypes();
  const [name, setName] = useState(roomType?.name ?? "");
  const [description, setDescription] = useState(roomType?.description ?? "");
  const [maxOccupancy, setMaxOccupancy] = useState(roomType?.maxOccupancy.toString() ?? "2");
  const [areaSqm, setAreaSqm] = useState(roomType?.areaSqm.toString() ?? "");
  const [basePrice, setBasePrice] = useState((roomType?.basePrice ?? defaultBasePrice)?.toString() ?? "");
  const [beds, setBeds] = useState<BedRow[]>(() =>
    roomType?.beds.length
      ? roomType.beds.map((bed, index) => ({ key: index, bedTypeId: bed.bedTypeId, quantity: bed.quantity.toString() }))
      : [{ key: 0, bedTypeId: "", quantity: "1" }],
  );
  const [amenityIds, setAmenityIds] = useState(() => roomType?.amenities.map((amenity) => amenity.id) ?? []);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();

  const mutation = usePartnerMutation(
    (input: CreateRoomTypeInput | UpdateRoomTypeInput) =>
      roomType
        ? partnerService.updateRoomType(roomType.id, input)
        : // Validated with createRoomTypeSchema in handleSubmit.
          partnerService.createRoomType(hotelId, input as CreateRoomTypeInput),
    {
      invalidate: () => [partnerKeys.roomTypes(hotelId)],
      successMessage: roomType ? "Đã cập nhật loại phòng." : "Đã thêm loại phòng.",
      errorNotice: false,
      onSuccess: onSaved,
    },
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(undefined);
    const body = {
      name,
      description: roomType ? (toOptionalText(description) ?? null) : toOptionalText(description),
      maxOccupancy: toOptionalNumber(maxOccupancy),
      areaSqm: toOptionalNumber(areaSqm),
      basePrice: toOptionalNumber(basePrice),
      beds: beds.map((bed) => ({ bedTypeId: bed.bedTypeId || undefined, quantity: toOptionalNumber(bed.quantity) })),
      amenityIds,
    };
    const result = validateWith(roomType ? updateRoomTypeSchema : createRoomTypeSchema, body);
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

  const pricePreview = toOptionalNumber(basePrice);

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Tên loại phòng" required error={errors.name} className="md:col-span-2">
          <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} />
        </FormField>
        <FormField label="Mô tả" error={errors.description} className="md:col-span-2">
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
        </FormField>
        <FormField label="Số khách tối đa" required error={errors.maxOccupancy}>
          <Input value={maxOccupancy} onChange={(event) => setMaxOccupancy(event.target.value)} inputMode="numeric" />
        </FormField>
        <FormField label="Diện tích (m²)" required error={errors.areaSqm}>
          <Input value={areaSqm} onChange={(event) => setAreaSqm(event.target.value)} inputMode="decimal" />
        </FormField>
        <FormField
          label="Giá cơ bản mỗi đêm (VND)"
          required
          error={errors.basePrice}
          hint={pricePreview !== undefined && !Number.isNaN(pricePreview) ? formatMoney(pricePreview) : undefined}
          className="md:col-span-2"
        >
          <Input value={basePrice} onChange={(event) => setBasePrice(event.target.value)} inputMode="decimal" />
        </FormField>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-bold text-primary">
          Giường <span className="text-danger">*</span>
        </legend>
        {beds.map((bed, index) => (
          <div key={bed.key} className="grid grid-cols-[1fr_96px_auto] items-start gap-2">
            <FormField label={`Loại giường ${index + 1}`} error={errors[`beds.${index}.bedTypeId`]}>
              <NativeSelect
                value={bed.bedTypeId}
                onChange={(event) =>
                  setBeds((prev) =>
                    prev.map((row) => (row.key === bed.key ? { ...row, bedTypeId: event.target.value } : row)),
                  )
                }
                className="w-full"
              >
                <NativeSelectOption value="">{bedTypes.isLoading ? "Đang tải..." : "Chọn loại giường"}</NativeSelectOption>
                {(bedTypes.data ?? []).map((type) => (
                  <NativeSelectOption key={type.id} value={type.id}>
                    {type.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Số lượng" error={errors[`beds.${index}.quantity`]}>
              <Input
                value={bed.quantity}
                onChange={(event) =>
                  setBeds((prev) =>
                    prev.map((row) => (row.key === bed.key ? { ...row, quantity: event.target.value } : row)),
                  )
                }
                inputMode="numeric"
              />
            </FormField>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="mt-6"
              aria-label="Xoá dòng giường"
              disabled={beds.length === 1}
              onClick={() => setBeds((prev) => prev.filter((row) => row.key !== bed.key))}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        {errors.beds && (
          <p role="alert" className="text-xs text-danger">
            {errors.beds}
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={beds.length >= 10}
          onClick={() => setBeds((prev) => [...prev, { key: Date.now(), bedTypeId: "", quantity: "1" }])}
        >
          <Plus />
          Thêm giường
        </Button>
      </fieldset>

      <div>
        <h3 className="mb-3 text-sm font-bold text-primary">Tiện ích trong phòng</h3>
        <AmenityPicker selected={amenityIds} onChange={setAmenityIds} />
      </div>

      <FormAlert message={formError} />
      <div className="flex justify-end">
        <SubmitButton pending={mutation.isPending}>
          <Save />
          {roomType ? "Lưu loại phòng" : "Thêm loại phòng"}
        </SubmitButton>
      </div>
    </form>
  );
}
