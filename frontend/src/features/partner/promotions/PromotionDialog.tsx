"use client";

import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import {
  createPromotionSchema,
  DiscountType,
  type CreatePromotionInput,
  type Promotion,
  type UpdatePromotionInput,
} from "@stayreco/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage, getApiFieldErrors, validateWith, type FieldErrors } from "@/lib/api-error";
import * as partnerService from "@/services/partner.service";
import { partnerKeys, usePartnerMutation } from "../api/partner-queries";
import { DateInput, FormAlert, FormField, SubmitButton, toOptionalNumber, toOptionalText } from "../components";

const discountTypeLabels: Record<DiscountType, string> = {
  PERCENTAGE: "Phần trăm (%)",
  FIXED_AMOUNT: "Số tiền cố định (₫)",
};

const clearableFields = ["description", "minBookingAmount", "maxUses", "validFrom", "validTo"] as const;

export function PromotionDialog({
  open,
  onOpenChange,
  hotelId,
  promotion,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotelId: string;
  promotion?: Promotion;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{promotion ? `Sửa chiến dịch ${promotion.name}` : "Tạo chiến dịch giảm giá"}</DialogTitle>
          <DialogDescription>
            Giảm giá chỉ trừ vào tiền phòng và do hệ thống tính khi khách đặt; các booking đã giảm giữ nguyên.
          </DialogDescription>
        </DialogHeader>
        {open && <PromotionForm hotelId={hotelId} promotion={promotion} onSaved={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function PromotionForm({
  hotelId,
  promotion,
  onSaved,
}: {
  hotelId: string;
  promotion?: Promotion;
  onSaved: () => void;
}) {
  const [name, setName] = useState(promotion?.name ?? "");
  const [description, setDescription] = useState(promotion?.description ?? "");
  const [discountType, setDiscountType] = useState<DiscountType>(promotion?.discountType ?? DiscountType.PERCENTAGE);
  const [discountValue, setDiscountValue] = useState(promotion?.discountValue.toString() ?? "");
  const [minBookingAmount, setMinBookingAmount] = useState(promotion?.minBookingAmount?.toString() ?? "");
  const [maxUses, setMaxUses] = useState(promotion?.maxUses?.toString() ?? "");
  const [validFrom, setValidFrom] = useState(promotion?.validFrom ?? "");
  const [validTo, setValidTo] = useState(promotion?.validTo ?? "");
  const [requiresCode, setRequiresCode] = useState(promotion?.requiresCode ?? false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();

  const mutation = usePartnerMutation(
    (input: CreatePromotionInput | UpdatePromotionInput) =>
      promotion
        ? partnerService.updatePromotion(promotion.id, input)
        : partnerService.createPromotion(hotelId, input as CreatePromotionInput),
    {
      invalidate: () => [partnerKeys.promotionsOf(hotelId)],
      successMessage: promotion ? "Đã cập nhật chiến dịch." : "Đã tạo chiến dịch.",
      errorNotice: false,
      onSuccess: onSaved,
    },
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(undefined);
    const result = validateWith(createPromotionSchema, {
      name,
      description: toOptionalText(description),
      discountType,
      discountValue: toOptionalNumber(discountValue),
      minBookingAmount: toOptionalNumber(minBookingAmount),
      maxUses: toOptionalNumber(maxUses),
      validFrom: validFrom || undefined,
      validTo: validTo || undefined,
      requiresCode,
    });
    if (result.errors) {
      setErrors(result.errors);
      return;
    }

    let input: CreatePromotionInput | UpdatePromotionInput = result.data;
    if (promotion) {
      const cleared = clearableFields.filter((field) => promotion[field] != null && result.data[field] === undefined);
      if (cleared.length > 0) {
        setErrors(
          Object.fromEntries(cleared.map((field) => [field, "Không bỏ trống được giá trị đã lưu, hãy nhập giá trị mới."])),
        );
        return;
      }
      input = Object.fromEntries(
        Object.entries(result.data).filter(
          ([key, value]) => value !== undefined && value !== promotion[key as keyof Promotion],
        ),
      ) as UpdatePromotionInput;
      if (Object.keys(input).length === 0) {
        onSaved();
        return;
      }
    }

    setErrors({});
    mutation.mutate(input, {
      onError: (error) => {
        setErrors(getApiFieldErrors(error));
        setFormError(getApiErrorMessage(error));
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormField label="Tên chiến dịch" required error={errors.name}>
        <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={200} />
      </FormField>
      <FormField label="Mô tả" error={errors.description}>
        <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} maxLength={2000} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Kiểu giảm" required error={errors.discountType}>
          <NativeSelect
            value={discountType}
            onChange={(event) => setDiscountType(event.target.value as DiscountType)}
            className="w-full"
          >
            {Object.values(DiscountType).map((value) => (
              <NativeSelectOption key={value} value={value}>
                {discountTypeLabels[value]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
        <FormField
          label={discountType === "PERCENTAGE" ? "Mức giảm (%)" : "Mức giảm (₫)"}
          required
          error={errors.discountValue}
          hint={discountType === "PERCENTAGE" ? "Lớn hơn 0, tối đa 100." : "Trừ thẳng vào tiền phòng."}
        >
          <Input
            value={discountValue}
            onChange={(event) => setDiscountValue(event.target.value)}
            inputMode="decimal"
          />
        </FormField>
        <FormField label="Đơn tối thiểu (₫)" error={errors.minBookingAmount} hint="Để trống nếu không yêu cầu.">
          <Input
            value={minBookingAmount}
            onChange={(event) => setMinBookingAmount(event.target.value)}
            inputMode="numeric"
          />
        </FormField>
        <FormField label="Số lượt tối đa" error={errors.maxUses} hint="Để trống nếu không giới hạn.">
          <Input value={maxUses} onChange={(event) => setMaxUses(event.target.value)} inputMode="numeric" />
        </FormField>
        <FormField label="Từ ngày" error={errors.validFrom}>
          <DateInput value={validFrom} onChange={setValidFrom} clearable className="w-full" />
        </FormField>
        <FormField label="Đến hết ngày" error={errors.validTo}>
          <DateInput value={validTo} onChange={setValidTo} min={validFrom || undefined} clearable className="w-full" />
        </FormField>
      </div>
      <label className="flex items-start gap-2.5 text-sm">
        <Checkbox checked={requiresCode} onCheckedChange={setRequiresCode} className="mt-0.5" />
        <span>
          Chỉ áp dụng qua mã riêng
          <span className="block text-xs text-muted-foreground">
            Bỏ chọn để giảm tự động cho mọi khách đặt phòng trong thời gian chạy chiến dịch.
          </span>
        </span>
      </label>
      <FormAlert message={formError} />
      <div className="flex justify-end">
        <SubmitButton pending={mutation.isPending}>
          <Save />
          {promotion ? "Lưu chiến dịch" : "Tạo chiến dịch"}
        </SubmitButton>
      </div>
    </form>
  );
}
