"use client";

import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import {
  AddOnTiming,
  createAddOnSchema,
  updateAddOnSchema,
  type CreateAddOnInput,
  type HotelAddOn,
  type UpdateAddOnInput,
} from "@stayreco/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { addOnKeys } from "@/features/booking/api/add-on-queries";
import { addOnTimingLabels } from "@/features/booking/lib/booking-labels";
import { getApiErrorMessage, getApiFieldErrors, validateWith, type FieldErrors } from "@/lib/api-error";
import * as addOnsService from "@/services/add-ons.service";
import { usePartnerMutation } from "../api/partner-queries";
import { FormAlert, FormField, SubmitButton, toOptionalNumber, toOptionalText } from "../components";

export function AddOnDialog({
  open,
  onOpenChange,
  hotelId,
  addOn,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotelId: string;
  addOn?: HotelAddOn;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{addOn ? `Sửa dịch vụ ${addOn.name}` : "Thêm dịch vụ"}</DialogTitle>
          <DialogDescription>
            Booking đã đặt giữ nguyên tên và giá lúc bán; thay đổi chỉ áp dụng cho lần bán sau.
          </DialogDescription>
        </DialogHeader>
        {open && <AddOnForm hotelId={hotelId} addOn={addOn} onSaved={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function AddOnForm({ hotelId, addOn, onSaved }: { hotelId: string; addOn?: HotelAddOn; onSaved: () => void }) {
  const [name, setName] = useState(addOn?.name ?? "");
  const [description, setDescription] = useState(addOn?.description ?? "");
  const [price, setPrice] = useState(addOn?.price.toString() ?? "");
  const [timing, setTiming] = useState<AddOnTiming>(addOn?.timing ?? AddOnTiming.DURING_STAY);
  const [prebookable, setPrebookable] = useState(addOn?.prebookable ?? true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();

  const mutation = usePartnerMutation(
    (input: CreateAddOnInput | UpdateAddOnInput) =>
      addOn
        ? addOnsService.updateAddOn(addOn.id, input)
        : addOnsService.createAddOn(hotelId, input as CreateAddOnInput),
    {
      invalidate: () => [addOnKeys.hotel(hotelId)],
      successMessage: addOn ? "Đã cập nhật dịch vụ." : "Đã thêm dịch vụ.",
      errorNotice: false,
      onSuccess: onSaved,
    },
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(undefined);
    const body = {
      name,
      description: addOn ? (toOptionalText(description) ?? null) : toOptionalText(description),
      price: toOptionalNumber(price),
      timing,
      prebookable,
    };
    const result = validateWith(addOn ? updateAddOnSchema : createAddOnSchema, body);
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

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormField label="Tên dịch vụ" required error={errors.name}>
        <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={200} />
      </FormField>
      <FormField label="Mô tả" error={errors.description}>
        <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} maxLength={1000} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Giá mỗi lượt (₫)" required error={errors.price}>
          <Input value={price} onChange={(event) => setPrice(event.target.value)} inputMode="numeric" />
        </FormField>
        <FormField label="Thời điểm" required error={errors.timing} hint={addOnTimingLabels[timing].description}>
          <NativeSelect
            value={timing}
            onChange={(event) => setTiming(event.target.value as AddOnTiming)}
            className="w-full"
          >
            {Object.values(AddOnTiming).map((value) => (
              <NativeSelectOption key={value} value={value}>
                {addOnTimingLabels[value].label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
      </div>
      <label className="flex items-start gap-2.5 text-sm">
        <Checkbox checked={prebookable} onCheckedChange={setPrebookable} className="mt-0.5" />
        <span>
          Khách đặt trước được khi đặt phòng
          <span className="block text-xs text-muted-foreground">
            Bỏ chọn nếu dịch vụ chỉ được nhân viên thêm và thu tiền tại quầy.
          </span>
        </span>
      </label>
      <FormAlert message={formError} />
      <div className="flex justify-end">
        <SubmitButton pending={mutation.isPending}>
          <Save />
          {addOn ? "Lưu dịch vụ" : "Thêm dịch vụ"}
        </SubmitButton>
      </div>
    </form>
  );
}
