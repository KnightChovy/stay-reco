"use client";

import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import { cancellationPolicySchema, type CancellationPolicyInput, type Hotel } from "@stayreco/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage, getApiFieldErrors, validateWith, type FieldErrors } from "@/lib/api-error";
import * as partnerService from "@/services/partner.service";
import { partnerKeys, usePartnerMutation } from "../api/partner-queries";
import { FormAlert, FormField, SubmitButton, toOptionalNumber, usePartnerHotel } from "../components";

/** Ready-made policies; the partner can still type any value. */
const presets: Array<{ label: string; value: CancellationPolicyInput }> = [
  { label: "Linh hoạt", value: { freeCancellationDays: 1, feePercent: 100 } },
  { label: "Trung bình", value: { freeCancellationDays: 3, feePercent: 50 } },
  { label: "Nghiêm ngặt", value: { freeCancellationDays: 7, feePercent: 100 } },
  { label: "Không hoàn tiền", value: { freeCancellationDays: null, feePercent: 100 } },
];

function describePolicy(policy: CancellationPolicyInput, checkInTime: string) {
  const fee =
    policy.feePercent === 0
      ? "khách vẫn được hoàn toàn bộ tiền"
      : `khách chịu phí ${policy.feePercent}% số tiền đã thanh toán`;
  if (policy.freeCancellationDays === null) {
    return policy.feePercent === 100
      ? "Không hoàn tiền: huỷ bất kỳ lúc nào khách cũng mất toàn bộ tiền đã thanh toán."
      : `Không có thời gian huỷ miễn phí: huỷ bất kỳ lúc nào ${fee}.`;
  }
  const deadline =
    policy.freeCancellationDays === 0
      ? `trước ${checkInTime} ngày nhận phòng`
      : `trước ${checkInTime}, ${policy.freeCancellationDays} ngày trước ngày nhận phòng`;
  return `Huỷ miễn phí ${deadline}; sau thời điểm đó ${fee}.`;
}

/** BR-07: the policy is copied onto each booking when it is made, so a change only affects new bookings. */
export function CancellationPolicyForm({ hotel }: { hotel: Hotel }) {
  const { canEdit } = usePartnerHotel();
  const [hasFreePeriod, setHasFreePeriod] = useState(hotel.cancellationPolicy.freeCancellationDays !== null);
  const [days, setDays] = useState(hotel.cancellationPolicy.freeCancellationDays?.toString() ?? "1");
  const [feePercent, setFeePercent] = useState(hotel.cancellationPolicy.feePercent.toString());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();

  const mutation = usePartnerMutation(
    (input: CancellationPolicyInput) => partnerService.setCancellationPolicy(hotel.id, input),
    {
      invalidate: () => [partnerKeys.hotel(hotel.id)],
      successMessage: "Đã lưu chính sách huỷ. Chính sách mới áp dụng cho các booking tạo từ bây giờ.",
      errorNotice: false,
    },
  );

  const draft = {
    freeCancellationDays: hasFreePeriod ? toOptionalNumber(days) : null,
    feePercent: toOptionalNumber(feePercent),
  };
  const preview = validateWith(cancellationPolicySchema, draft);

  function applyPreset(value: CancellationPolicyInput) {
    setHasFreePeriod(value.freeCancellationDays !== null);
    if (value.freeCancellationDays !== null) setDays(value.freeCancellationDays.toString());
    setFeePercent(value.feePercent.toString());
    setErrors({});
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(undefined);
    if (preview.errors) {
      setErrors(preview.errors);
      return;
    }
    setErrors({});
    mutation.mutate(preview.data, {
      onError: (error) => {
        setErrors(getApiFieldErrors(error));
        setFormError(getApiErrorMessage(error));
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Chính sách được ghi cố định vào từng booking lúc khách đặt: thay đổi ở đây không ảnh hưởng các booking đã có.
        Mốc giờ là giờ nhận phòng của khách sạn ({hotel.checkInTime ?? "14:00"}).
      </p>

      {canEdit && (
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset.value)}
              className="rounded-full border px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      <label className="flex items-center gap-2.5 text-sm">
        <Checkbox checked={hasFreePeriod} onCheckedChange={setHasFreePeriod} disabled={!canEdit} />
        Cho phép huỷ miễn phí trong một khoảng thời gian
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        {hasFreePeriod && (
          <FormField
            label="Huỷ miễn phí đến trước ngày nhận phòng (ngày)"
            required
            error={errors.freeCancellationDays}
            hint="0–30. 0 = miễn phí đến giờ nhận phòng của chính ngày nhận phòng."
          >
            <Input value={days} onChange={(event) => setDays(event.target.value)} inputMode="numeric" disabled={!canEdit} />
          </FormField>
        )}
        <FormField
          label="Phí huỷ sau hạn (% số tiền đã thanh toán)"
          required
          error={errors.feePercent}
          hint="0–100. 100 = không hoàn tiền sau hạn."
        >
          <Input
            value={feePercent}
            onChange={(event) => setFeePercent(event.target.value)}
            inputMode="decimal"
            disabled={!canEdit}
          />
        </FormField>
      </div>

      <div className="rounded-xl bg-muted p-4 text-sm">
        <p className="text-xs font-semibold text-muted-foreground">Khách sẽ thấy</p>
        <p className="mt-1 text-foreground">
          {preview.data ? describePolicy(preview.data, hotel.checkInTime ?? "14:00") : "Nhập giá trị hợp lệ để xem trước."}
        </p>
      </div>

      <FormAlert message={formError} />
      {canEdit && (
        <div className="flex justify-end">
          <SubmitButton pending={mutation.isPending}>
            <Save />
            Lưu chính sách huỷ
          </SubmitButton>
        </div>
      )}
    </form>
  );
}
