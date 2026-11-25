"use client";

import { useState, type FormEvent } from "react";
import { hotelLoyaltyProgramSchema, type HotelLoyaltyProgram, type HotelLoyaltyProgramInput } from "@stayreco/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage, getApiFieldErrors, validateWith, type FieldErrors } from "@/lib/api-error";
import * as partnerService from "@/services/partner.service";
import { partnerKeys, useLoyaltyProgram, usePartnerMutation } from "../api/partner-queries";
import {
  countChanges,
  ErrorPanel,
  FormAlert,
  FormField,
  LoadingPanel,
  NoHotelPanel,
  PartnerPanel,
  PartnerTitle,
  savedMessage,
  StatusBadge,
  StickySaveBar,
  SuspendedBanner,
  toOptionalNumber,
  usePartnerHotel,
  useUnsavedChanges,
} from "../components";
import { formatMoney } from "../lib/labels";

const PER = 1000;

function perThousand(pointsPerCurrency: number) {
  return Number((pointsPerCurrency * PER).toFixed(1)).toString();
}

export default function PartnerLoyalty() {
  const { hotel, hotels, isLoading, error, refetch, isSuspended } = usePartnerHotel();
  const program = useLoyaltyProgram(hotel?.id);

  return (
    <div className="space-y-6">
      <PartnerTitle
        title="Khách hàng thân thiết"
        description="Điểm StayMiles dùng chung toàn nền tảng. Khách sạn có thể đặt quy tắc riêng cho việc tích và dùng điểm khi khách ở tại đây."
      />
      {isSuspended && <SuspendedBanner />}
      {isLoading ? (
        <LoadingPanel />
      ) : error ? (
        <ErrorPanel error={error} onRetry={refetch} />
      ) : !hotel || hotels.length === 0 ? (
        <NoHotelPanel />
      ) : program.isLoading ? (
        <LoadingPanel rows={4} />
      ) : program.error || !program.data ? (
        <ErrorPanel error={program.error} onRetry={() => void program.refetch()} />
      ) : (
        <LoyaltyForm key={hotel.id} hotelId={hotel.id} program={program.data} />
      )}
    </div>
  );
}

function LoyaltyForm({ hotelId, program }: { hotelId: string; program: HotelLoyaltyProgram }) {
  const { canEdit } = usePartnerHotel();
  const { platform, limits } = program;
  const [isActive, setIsActive] = useState(program.isActive);
  const [earn, setEarn] = useState(perThousand(program.pointsPerCurrency));
  const [acceptsPoints, setAcceptsPoints] = useState(program.acceptsPoints);
  const [maxRedeem, setMaxRedeem] = useState(program.maxRedeemPercent.toString());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();

  const mutation = usePartnerMutation(
    (input: HotelLoyaltyProgramInput) => partnerService.setLoyaltyProgram(hotelId, input),
    {
      invalidate: () => [partnerKeys.loyaltyProgram(hotelId)],
      successMessage: () => savedMessage("quy tắc điểm thưởng"),
      errorNotice: false,
    },
  );

  const minEarn = limits.minPointsPerCurrency * PER;
  const maxEarn = limits.maxPointsPerCurrency * PER;
  const earnFixed = minEarn === maxEarn;
  const fieldsDisabled = !canEdit || !isActive;

  const changes = canEdit
    ? countChanges(
        { isActive, earn: earn.trim(), acceptsPoints, maxRedeem: maxRedeem.trim() },
        {
          isActive: program.isActive,
          earn: perThousand(program.pointsPerCurrency),
          acceptsPoints: program.acceptsPoints,
          maxRedeem: program.maxRedeemPercent.toString(),
        },
      )
    : 0;
  useUnsavedChanges(changes > 0);

  function discard() {
    setIsActive(program.isActive);
    setEarn(perThousand(program.pointsPerCurrency));
    setAcceptsPoints(program.acceptsPoints);
    setMaxRedeem(program.maxRedeemPercent.toString());
    setErrors({});
    setFormError(undefined);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(undefined);
    const earnValue = toOptionalNumber(earn);
    const result = validateWith(hotelLoyaltyProgramSchema, {
      isActive,
      pointsPerCurrency: earnValue === undefined ? undefined : Number((earnValue / PER).toFixed(4)),
      acceptsPoints,
      maxRedeemPercent: toOptionalNumber(maxRedeem),
    });
    if (result.errors) {
      setErrors(result.errors);
      return;
    }
    if (earnValue !== undefined && (earnValue < minEarn || earnValue > maxEarn)) {
      setErrors({
        pointsPerCurrency: earnFixed
          ? `Hiện chỉ được ${minEarn} điểm cho mỗi 1.000 ₫.`
          : `Chọn từ ${minEarn} đến ${maxEarn} điểm cho mỗi 1.000 ₫.`,
      });
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
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <PartnerPanel className="p-4">
          <p className="text-xs font-semibold text-muted-foreground">Chương trình nền tảng</p>
          <p className="mt-1 flex items-center gap-2 font-bold text-primary">
            {platform.name}
            <StatusBadge tone={platform.isActive ? "success" : "muted"}>
              {platform.isActive ? "Đang chạy" : "Tạm dừng"}
            </StatusBadge>
          </p>
        </PartnerPanel>
        <PartnerPanel className="p-4">
          <p className="text-xs font-semibold text-muted-foreground">Quy tắc nền tảng</p>
          <p className="mt-1 text-sm text-foreground">
            {perThousand(platform.pointsPerCurrency)} điểm / 1.000 ₫ · 1 điểm = {formatMoney(platform.pointValue)}
          </p>
        </PartnerPanel>
        <PartnerPanel className="p-4">
          <p className="text-xs font-semibold text-muted-foreground">Đang áp dụng tại khách sạn</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {program.appliesNow ? "Quy tắc riêng của khách sạn" : "Quy tắc nền tảng"}
          </p>
        </PartnerPanel>
      </div>

      <PartnerPanel className="overflow-visible! p-5">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <label className="flex items-start gap-2.5 text-sm">
            <Checkbox checked={isActive} onCheckedChange={setIsActive} disabled={!canEdit} className="mt-0.5" />
            <span>
              Dùng quy tắc riêng của khách sạn
              <span className="block text-xs text-muted-foreground">
                Tắt để quay về quy tắc nền tảng; các giá trị bên dưới vẫn được giữ lại.
              </span>
            </span>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              label="Điểm tích cho mỗi 1.000 ₫ khách trả"
              required
              error={errors.pointsPerCurrency}
              hint={
                earnFixed
                  ? `Nền tảng hiện chỉ cho phép ${minEarn} điểm / 1.000 ₫.`
                  : `Từ ${minEarn} đến ${maxEarn} điểm / 1.000 ₫.`
              }
            >
              <Input
                value={earn}
                onChange={(event) => setEarn(event.target.value)}
                inputMode="decimal"
                disabled={fieldsDisabled || earnFixed}
              />
            </FormField>
            <FormField
              label="Điểm được trả tối đa (% tiền phòng sau giảm giá)"
              required
              error={errors.maxRedeemPercent}
              hint={`${limits.minRedeemPercent}–${limits.maxRedeemPercent}.`}
            >
              <Input
                value={maxRedeem}
                onChange={(event) => setMaxRedeem(event.target.value)}
                inputMode="decimal"
                disabled={fieldsDisabled || !acceptsPoints}
              />
            </FormField>
          </div>

          <label className="flex items-center gap-2.5 text-sm">
            <Checkbox checked={acceptsPoints} onCheckedChange={setAcceptsPoints} disabled={fieldsDisabled} />
            Cho phép khách dùng điểm khi đặt phòng tại khách sạn
          </label>

          <FormAlert message={formError} />
          <StickySaveBar
            changes={changes}
            pending={mutation.isPending}
            onDiscard={discard}
            submitLabel="Lưu quy tắc điểm"
          />
        </form>
      </PartnerPanel>
    </div>
  );
}
