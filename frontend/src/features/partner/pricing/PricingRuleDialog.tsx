"use client";

import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import {
  createPricingRuleSchema,
  DayOfWeek,
  PRICING_LIMITS,
  PRICING_RULE_TYPES,
  PriceAdjustmentType,
  type CreatePricingRuleInput,
  type PricingRule,
  type RoomType,
  type UpdatePricingRuleInput,
} from "@stayreco/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { getApiErrorMessage, getApiFieldErrors, validateWith, type FieldErrors } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import * as partnerService from "@/services/partner.service";
import { partnerKeys, usePartnerMutation } from "../api/partner-queries";
import { FormAlert, FormField, SubmitButton, toOptionalNumber } from "../components";
import { adjustmentTypeLabels, dayOfWeekLabels, formatMoney, pricingRuleTypeLabels } from "../lib/labels";

type RuleType = (typeof PRICING_RULE_TYPES)[number];

type Values = {
  roomTypeId: string;
  name: string;
  ruleType: RuleType;
  adjustmentType: PriceAdjustmentType;
  adjustmentValue: string;
  validFrom: string;
  validTo: string;
  dayOfWeek: string;
  minDaysBefore: string;
  maxDaysBefore: string;
  priority: string;
  isActive: boolean;
};

function initialValues(rule: PricingRule | undefined, roomTypeId: string): Values {
  return {
    roomTypeId: rule?.roomTypeId ?? roomTypeId,
    name: rule?.name ?? "",
    ruleType: (rule?.ruleType as RuleType | undefined) ?? "SEASON",
    adjustmentType: rule?.adjustmentType ?? "PERCENT",
    adjustmentValue: rule?.adjustmentValue.toString() ?? "",
    validFrom: rule?.validFrom ?? "",
    validTo: rule?.validTo ?? "",
    dayOfWeek: rule?.dayOfWeek ?? "",
    minDaysBefore: rule?.minDaysBefore?.toString() ?? "",
    maxDaysBefore: rule?.maxDaysBefore?.toString() ?? "",
    priority: rule?.priority.toString() ?? "10",
    isActive: rule?.isActive ?? true,
  };
}

const valueHints: Record<PriceAdjustmentType, string> = {
  SET_PRICE: "Giá mỗi đêm mới (VND), lớn hơn 0.",
  AMOUNT: "Số tiền cộng thêm mỗi đêm (VND); số âm để giảm giá.",
  PERCENT: `Phần trăm so với giá cơ bản, từ ${PRICING_LIMITS.percentMin} đến +${PRICING_LIMITS.percentMax}; số âm để giảm giá.`,
};

export function PricingRuleDialog({
  open,
  onOpenChange,
  hotelId,
  roomTypes,
  rule,
  defaultRoomTypeId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotelId: string;
  roomTypes: RoomType[];
  /** Edits this rule; creates a new one when omitted. */
  rule?: PricingRule;
  defaultRoomTypeId?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{rule ? `Sửa luật giá ${rule.name}` : "Thêm luật giá"}</DialogTitle>
          <DialogDescription>
            Mỗi đêm chỉ áp dụng một luật: luật đang bật có độ ưu tiên cao nhất khớp với đêm đó. Thay đổi chỉ áp dụng cho
            booking mới.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <PricingRuleForm
            hotelId={hotelId}
            roomTypes={roomTypes}
            rule={rule}
            defaultRoomTypeId={defaultRoomTypeId ?? roomTypes[0]?.id ?? ""}
            onSaved={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PricingRuleForm({
  hotelId,
  roomTypes,
  rule,
  defaultRoomTypeId,
  onSaved,
}: {
  hotelId: string;
  roomTypes: RoomType[];
  rule?: PricingRule;
  defaultRoomTypeId: string;
  onSaved: () => void;
}) {
  const [values, setValues] = useState(() => initialValues(rule, defaultRoomTypeId));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((prev) => ({ ...prev, [key]: value }));

  const mutation = usePartnerMutation(
    (input: CreatePricingRuleInput | UpdatePricingRuleInput) =>
      rule
        ? partnerService.updatePricingRule(rule.id, input)
        : // Validated with createPricingRuleSchema in handleSubmit.
          partnerService.createPricingRule(hotelId, input as CreatePricingRuleInput),
    {
      invalidate: () => [partnerKeys.pricingRules(hotelId), [...partnerKeys.all, "price-preview"]],
      successMessage: rule ? "Đã cập nhật luật giá." : "Đã thêm luật giá.",
      errorNotice: false,
      onSuccess: onSaved,
    },
  );

  const roomType = roomTypes.find((type) => type.id === values.roomTypeId);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(undefined);
    const { ruleType } = values;
    // Fields that do not belong to the rule type are sent as null so a type change clears them.
    const body = {
      name: values.name,
      ruleType,
      adjustmentType: values.adjustmentType,
      adjustmentValue: toOptionalNumber(values.adjustmentValue),
      validFrom: values.validFrom || null,
      validTo: values.validTo || null,
      dayOfWeek: values.dayOfWeek || null,
      minDaysBefore: ruleType === "EARLY_BIRD" ? (toOptionalNumber(values.minDaysBefore) ?? null) : null,
      maxDaysBefore: ruleType === "LAST_MINUTE" ? (toOptionalNumber(values.maxDaysBefore) ?? null) : null,
      priority: toOptionalNumber(values.priority),
      isActive: values.isActive,
    };

    // The form always holds the whole rule, so both create and edit are checked with the create schema (including
    // the rules between fields). The room type cannot change, so PATCH leaves it out.
    const result = validateWith(createPricingRuleSchema, {
      ...body,
      roomTypeId: rule?.roomTypeId ?? (values.roomTypeId || undefined),
    });
    if (result.errors) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    const { roomTypeId, ...changes } = result.data;
    mutation.mutate(rule ? (changes satisfies UpdatePricingRuleInput) : { roomTypeId, ...changes }, {
      onError: (error) => {
        const fieldErrors = getApiFieldErrors(error);
        setErrors(fieldErrors);
        // Field-level problems are already shown under their inputs.
        if (!Object.keys(fieldErrors).length) setFormError(getApiErrorMessage(error));
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          label="Loại phòng"
          required
          error={errors.roomTypeId}
          hint={roomType ? `Giá cơ bản ${formatMoney(roomType.basePrice)} / đêm` : undefined}
        >
          <NativeSelect
            value={values.roomTypeId}
            onChange={(event) => set("roomTypeId", event.target.value)}
            disabled={!!rule}
            className="w-full"
          >
            {roomTypes.map((type) => (
              <NativeSelectOption key={type.id} value={type.id}>
                {type.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Tên luật" required error={errors.name} hint="Ví dụ: Tết 2027, Cuối tuần hè">
          <Input value={values.name} onChange={(event) => set("name", event.target.value)} maxLength={100} />
        </FormField>
      </div>

      <fieldset>
        <legend className="mb-2 text-xs font-semibold">Loại luật</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {PRICING_RULE_TYPES.map((type) => (
            <label
              key={type}
              className={cn(
                "cursor-pointer rounded-xl border p-3 text-sm",
                values.ruleType === type && "border-primary/50 bg-primary/5",
              )}
            >
              <input
                type="radio"
                name="ruleType"
                value={type}
                checked={values.ruleType === type}
                onChange={() => set("ruleType", type)}
                className="sr-only"
              />
              <strong className="block text-primary">{pricingRuleTypeLabels[type].label}</strong>
              <span className="text-xs text-muted-foreground">{pricingRuleTypeLabels[type].description}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Cách điều chỉnh" required error={errors.adjustmentType}>
          <NativeSelect
            value={values.adjustmentType}
            onChange={(event) => set("adjustmentType", event.target.value as PriceAdjustmentType)}
            className="w-full"
          >
            {Object.values(PriceAdjustmentType).map((type) => (
              <NativeSelectOption key={type} value={type}>
                {adjustmentTypeLabels[type]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
        <FormField
          label={values.adjustmentType === "PERCENT" ? "Mức điều chỉnh (%)" : "Mức điều chỉnh (VND)"}
          required
          error={errors.adjustmentValue}
          hint={valueHints[values.adjustmentType]}
        >
          <Input
            value={values.adjustmentValue}
            onChange={(event) => set("adjustmentValue", event.target.value)}
            inputMode="decimal"
          />
        </FormField>
        <FormField
          label="Áp dụng từ đêm"
          required={values.ruleType === "SEASON"}
          error={errors.validFrom}
          hint={values.ruleType === "SEASON" ? undefined : "Để trống để áp dụng mọi ngày."}
        >
          <Input type="date" value={values.validFrom} onChange={(event) => set("validFrom", event.target.value)} />
        </FormField>
        <FormField label="Đến đêm (gồm cả đêm này)" required={values.ruleType === "SEASON"} error={errors.validTo}>
          <Input type="date" value={values.validTo} onChange={(event) => set("validTo", event.target.value)} />
        </FormField>
        <FormField label="Chỉ áp dụng vào" error={errors.dayOfWeek}>
          <NativeSelect value={values.dayOfWeek} onChange={(event) => set("dayOfWeek", event.target.value)} className="w-full">
            <NativeSelectOption value="">Mọi ngày trong tuần</NativeSelectOption>
            {Object.values(DayOfWeek).map((day) => (
              <NativeSelectOption key={day} value={day}>
                {dayOfWeekLabels[day]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
        {values.ruleType === "EARLY_BIRD" && (
          <FormField
            label="Đặt trước ít nhất (ngày)"
            required
            error={errors.minDaysBefore}
            hint={`1–${PRICING_LIMITS.earlyBirdMaxDays} ngày trước ngày nhận phòng.`}
          >
            <Input
              value={values.minDaysBefore}
              onChange={(event) => set("minDaysBefore", event.target.value)}
              inputMode="numeric"
            />
          </FormField>
        )}
        {values.ruleType === "LAST_MINUTE" && (
          <FormField
            label="Đặt trước nhiều nhất (ngày)"
            required
            error={errors.maxDaysBefore}
            hint={`0–${PRICING_LIMITS.lastMinuteMaxDays}; 0 = đặt ngay trong ngày nhận phòng.`}
          >
            <Input
              value={values.maxDaysBefore}
              onChange={(event) => set("maxDaysBefore", event.target.value)}
              inputMode="numeric"
            />
          </FormField>
        )}
        <FormField
          label="Độ ưu tiên"
          required
          error={errors.priority}
          hint={`0–${PRICING_LIMITS.maxPriority}; số lớn hơn thắng khi nhiều luật cùng khớp.`}
        >
          <Input value={values.priority} onChange={(event) => set("priority", event.target.value)} inputMode="numeric" />
        </FormField>
      </div>

      <label className="flex items-center gap-2.5 text-sm">
        <Checkbox checked={values.isActive} onCheckedChange={(checked) => set("isActive", checked)} />
        Bật luật này
      </label>

      <FormAlert message={formError} />
      <div className="flex justify-end">
        <SubmitButton pending={mutation.isPending}>
          <Save />
          {rule ? "Lưu luật giá" : "Thêm luật giá"}
        </SubmitButton>
      </div>
    </form>
  );
}
