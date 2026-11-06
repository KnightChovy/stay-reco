"use client";

import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { hotelPoliciesSchema, type Hotel } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage, validateWith } from "@/lib/api-error";
import * as partnerService from "@/services/partner.service";
import { partnerKeys, usePartnerMutation } from "../api/partner-queries";
import {
  countChanges,
  FormAlert,
  FormField,
  savedMessage,
  StickySaveBar,
  usePartnerHotel,
  useUnsavedChanges,
} from "../components";

/** Suggested policy keys (snake_case, as the API requires) with their Vietnamese titles. */
const presetPolicies: Array<{ key: string; label: string; placeholder: string }> = [
  { key: "cancellation", label: "Huỷ phòng", placeholder: "Miễn phí huỷ trước 48 giờ so với ngày nhận phòng..." },
  { key: "children", label: "Trẻ em", placeholder: "Trẻ dưới 6 tuổi ở miễn phí khi dùng giường có sẵn..." },
  { key: "pets", label: "Thú cưng", placeholder: "Không nhận thú cưng." },
  { key: "smoking", label: "Hút thuốc", placeholder: "Không hút thuốc trong phòng." },
  { key: "payment", label: "Thanh toán", placeholder: "Chấp nhận thẻ Visa, Mastercard, chuyển khoản..." },
];

type CustomPolicy = { id: number; key: string; value: string };

const presetKeys = new Set(presetPolicies.map((policy) => policy.key));

const presetOf = (hotel: Hotel) =>
  Object.fromEntries(presetPolicies.map(({ key }) => [key, hotel.policies[key] ?? ""]));

const customOf = (hotel: Hotel): CustomPolicy[] =>
  Object.entries(hotel.policies)
    .filter(([key]) => !presetKeys.has(key))
    .map(([key, value], index) => ({ id: index, key, value }));

export function HotelPoliciesForm({ hotel }: { hotel: Hotel }) {
  const { canEdit } = usePartnerHotel();
  const [preset, setPreset] = useState<Record<string, string>>(() => presetOf(hotel));
  const [custom, setCustom] = useState<CustomPolicy[]>(() => customOf(hotel));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();

  const mutation = usePartnerMutation(
    (policies: Record<string, string>) => partnerService.setHotelPolicies(hotel.id, policies),
    {
      invalidate: () => [partnerKeys.hotel(hotel.id)],
      successMessage: () => savedMessage("chính sách"),
      errorNotice: false,
    },
  );

  // Empty texts are left out, which removes that policy (the list replaces the stored one).
  const policies = Object.fromEntries(
    [
      ...Object.entries(preset),
      ...custom.map((policy) => [policy.key.trim(), policy.value] as [string, string]),
    ].filter(([key, value]) => key && value.trim()),
  );
  // A blank custom row is not a change until it gets a key and a text.
  const changes = canEdit ? countChanges(policies, hotel.policies) : 0;
  useUnsavedChanges(changes > 0);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(undefined);
    const result = validateWith(hotelPoliciesSchema, { policies });
    if (result.errors) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    mutation.mutate(result.data.policies, { onError: (error) => setFormError(getApiErrorMessage(error)) });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        {presetPolicies.map((policy) => (
          <FormField key={policy.key} label={policy.label} error={errors[`policies.${policy.key}`]}>
            <Textarea
              value={preset[policy.key]}
              onChange={(event) => setPreset((prev) => ({ ...prev, [policy.key]: event.target.value }))}
              placeholder={policy.placeholder}
              maxLength={2000}
              rows={3}
              disabled={!canEdit}
            />
          </FormField>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-primary">Chính sách khác</h3>
        {custom.map((policy) => (
          <div key={policy.id} className="grid gap-2 rounded-xl bg-muted/60 p-3 md:grid-cols-[220px_1fr_auto]">
            <FormField label="Mã chính sách" hint="chữ thường, số, gạch dưới" error={errors[`policies.${policy.key}`] ?? errors.policies}>
              <Input
                value={policy.key}
                onChange={(event) =>
                  setCustom((prev) =>
                    prev.map((item) => (item.id === policy.id ? { ...item, key: event.target.value } : item)),
                  )
                }
                placeholder="extra_bed"
                disabled={!canEdit}
              />
            </FormField>
            <FormField label="Nội dung">
              <Textarea
                value={policy.value}
                onChange={(event) =>
                  setCustom((prev) =>
                    prev.map((item) => (item.id === policy.id ? { ...item, value: event.target.value } : item)),
                  )
                }
                maxLength={2000}
                rows={2}
                disabled={!canEdit}
              />
            </FormField>
            {canEdit && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="self-center"
                aria-label="Xoá chính sách"
                onClick={() => setCustom((prev) => prev.filter((item) => item.id !== policy.id))}
              >
                <Trash2 />
              </Button>
            )}
          </div>
        ))}
        {canEdit && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCustom((prev) => [...prev, { id: Date.now(), key: "", value: "" }])}
          >
            <Plus />
            Thêm chính sách
          </Button>
        )}
      </div>

      <FormAlert message={formError ?? errors.policies} />
      <StickySaveBar
        changes={changes}
        pending={mutation.isPending}
        onDiscard={() => {
          setPreset(presetOf(hotel));
          setCustom(customOf(hotel));
          setErrors({});
          setFormError(undefined);
        }}
        submitLabel="Lưu chính sách"
      />
    </form>
  );
}
