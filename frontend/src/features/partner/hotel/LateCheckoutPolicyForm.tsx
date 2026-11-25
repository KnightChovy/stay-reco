"use client";

import { useState, type FormEvent } from "react";
import {
  lateCheckoutPolicySchema,
  SUGGESTED_LATE_CHECKOUT_POLICY,
  type Hotel,
  type LateCheckoutPolicyInput,
} from "@stayreco/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage, getApiFieldErrors, validateWith, type FieldErrors } from "@/lib/api-error";
import { useRemoveLateCheckoutPolicy, useSetLateCheckoutPolicy } from "../api/partner-queries";
import {
  ConfirmDialog,
  countChanges,
  FormAlert,
  FormField,
  StickySaveBar,
  TimeSelect,
  toOptionalNumber,
  usePartnerHotel,
  useUnsavedChanges,
} from "../components";

const DEFAULT_CHECK_OUT_TIME = "12:00";

type Draft = { grace: string; cutoff: string; before: string; after: string };

function toDraft(policy: LateCheckoutPolicyInput): Draft {
  return {
    grace: policy.graceMinutes.toString(),
    cutoff: policy.cutoffTime,
    before: policy.beforeCutoffPercent.toString(),
    after: policy.afterCutoffPercent.toString(),
  };
}

function addMinutes(time: string, minutes: number) {
  const [hours, mins] = time.split(":").map(Number);
  const total = Math.min(hours * 60 + mins + minutes, 23 * 60 + 59);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function describePolicy(policy: LateCheckoutPolicyInput, checkOutTime: string) {
  const feeStart = addMinutes(checkOutTime, policy.graceMinutes);
  const lines = [
    policy.graceMinutes > 0
      ? `Miễn phí ${policy.graceMinutes} phút sau giờ trả phòng ${checkOutTime}.`
      : `Tính phí ngay sau giờ trả phòng ${checkOutTime}.`,
  ];
  if (feeStart < policy.cutoffTime) {
    lines.push(`Từ ${feeStart} đến trước ${policy.cutoffTime}: ${policy.beforeCutoffPercent}% giá đêm cuối mỗi phòng.`);
  }
  lines.push(
    `Từ ${policy.cutoffTime}: ${policy.afterCutoffPercent}% giá đêm cuối mỗi phòng; mỗi ngày ở thêm cộng ${policy.afterCutoffPercent}%.`,
  );
  return lines;
}

export function LateCheckoutPolicyForm({ hotel }: { hotel: Hotel }) {
  const { canEdit } = usePartnerHotel();
  const stored = hotel.lateCheckoutPolicy;
  const checkOutTime = hotel.checkOutTime ?? DEFAULT_CHECK_OUT_TIME;
  const initial = toDraft(stored ?? SUGGESTED_LATE_CHECKOUT_POLICY);

  const [enabled, setEnabled] = useState(stored !== null);
  const [draft, setDraft] = useState<Draft>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const saveMutation = useSetLateCheckoutPolicy(hotel.id);
  const removeMutation = useRemoveLateCheckoutPolicy(hotel.id);
  const pending = saveMutation.isPending || removeMutation.isPending;

  const changes = canEdit
    ? countChanges(
        enabled ? { enabled, ...trimmed(draft) } : { enabled },
        stored ? { enabled: true, ...toDraft(stored) } : { enabled: false },
      )
    : 0;
  useUnsavedChanges(changes > 0);

  const preview = validateWith(lateCheckoutPolicySchema, {
    graceMinutes: toOptionalNumber(draft.grace),
    cutoffTime: draft.cutoff,
    beforeCutoffPercent: toOptionalNumber(draft.before),
    afterCutoffPercent: toOptionalNumber(draft.after),
  });

  function update(field: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function discard() {
    setEnabled(stored !== null);
    setDraft(initial);
    setErrors({});
    setFormError(undefined);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(undefined);
    if (!enabled) {
      if (stored) setConfirmOpen(true);
      return;
    }
    if (preview.errors) {
      setErrors(preview.errors);
      return;
    }
    setErrors({});
    saveMutation.mutate(preview.data, {
      onError: (error) => {
        setErrors(getApiFieldErrors(error));
        setFormError(getApiErrorMessage(error));
      },
    });
  }

  function confirmRemove() {
    removeMutation.mutate(undefined, {
      onSuccess: () => {
        setConfirmOpen(false);
        setDraft(toDraft(SUGGESTED_LATE_CHECKOUT_POLICY));
      },
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Phí trả phòng muộn được thu tại quầy, không qua ví StayReco và không tính hoa hồng. Chính sách đang áp dụng lúc
          khách trả phòng sẽ được dùng, kể cả với booking đã đặt trước đó. Mốc giờ là giờ trả phòng của khách sạn
          ({checkOutTime}).
        </p>

        <label className="flex items-center gap-2.5 text-sm">
          <Checkbox checked={enabled} onCheckedChange={setEnabled} disabled={!canEdit} />
          Thu phí khi khách trả phòng muộn
        </label>

        {enabled && (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              label="Thời gian miễn phí sau giờ trả phòng (phút)"
              required
              error={errors.graceMinutes}
              hint="0–240."
            >
              <Input
                value={draft.grace}
                onChange={(event) => update("grace", event.target.value)}
                inputMode="numeric"
                disabled={!canEdit}
              />
            </FormField>
            <FormField
              label="Mốc giờ chuyển sang mức phí cao"
              required
              error={errors.cutoffTime}
              hint={`Nên sau giờ trả phòng ${checkOutTime}.`}
            >
              <TimeSelect value={draft.cutoff} onChange={(event) => update("cutoff", event.target.value)} disabled={!canEdit} />
            </FormField>
            <FormField
              label="Phí trước mốc giờ (% giá đêm cuối mỗi phòng)"
              required
              error={errors.beforeCutoffPercent}
              hint="0–100, số nguyên."
            >
              <Input
                value={draft.before}
                onChange={(event) => update("before", event.target.value)}
                inputMode="numeric"
                disabled={!canEdit}
              />
            </FormField>
            <FormField
              label="Phí từ mốc giờ (% giá đêm cuối mỗi phòng)"
              required
              error={errors.afterCutoffPercent}
              hint="0–100, số nguyên, không thấp hơn phí trước mốc giờ."
            >
              <Input
                value={draft.after}
                onChange={(event) => update("after", event.target.value)}
                inputMode="numeric"
                disabled={!canEdit}
              />
            </FormField>
          </div>
        )}

        <div className="rounded-xl bg-muted p-4 text-sm">
          <p className="text-xs font-semibold text-muted-foreground">Khách sẽ thấy</p>
          {!enabled ? (
            <p className="mt-1 text-foreground">Trả phòng muộn không mất phí.</p>
          ) : preview.data ? (
            <ul className="mt-1 list-disc space-y-1 pl-5 text-foreground">
              {describePolicy(preview.data, checkOutTime).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-foreground">Nhập giá trị hợp lệ để xem trước.</p>
          )}
        </div>

        <FormAlert message={formError} />
        <StickySaveBar
          changes={changes}
          pending={pending}
          onDiscard={discard}
          submitLabel={enabled ? "Lưu chính sách trả phòng muộn" : "Tắt phí trả phòng muộn"}
        />
      </form>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Tắt phí trả phòng muộn?"
        description="Từ bây giờ khách trả phòng muộn sẽ không mất phí, kể cả các booking đang lưu trú."
        confirmLabel="Tắt phí"
        destructive
        pending={removeMutation.isPending}
        onConfirm={confirmRemove}
      />
    </>
  );
}

function trimmed(draft: Draft): Draft {
  return {
    grace: draft.grace.trim(),
    cutoff: draft.cutoff,
    before: draft.before.trim(),
    after: draft.after.trim(),
  };
}
