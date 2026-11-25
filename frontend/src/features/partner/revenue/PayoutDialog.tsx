"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { createPayoutSchema, PAYOUT_PROCESSING_DAYS, type HotelBeneficiary } from "@stayreco/shared";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage, getApiFieldErrors, validateWith, type FieldErrors } from "@/lib/api-error";
import * as partnerService from "@/services/partner.service";
import { partnerKeys, usePartnerMutation } from "../api/partner-queries";
import { FormAlert, FormField, SubmitButton, toOptionalNumber } from "../components";
import { formatMoney } from "../lib/labels";

export function PayoutDialog({
  open,
  onOpenChange,
  hotelId,
  available,
  beneficiary,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotelId: string;
  available: number | undefined;
  beneficiary: HotelBeneficiary | undefined;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rút tiền về tài khoản</DialogTitle>
          <DialogDescription>
            Yêu cầu được nền tảng xử lý trong {PAYOUT_PROCESSING_DAYS} ngày làm việc. Mỗi khách sạn chỉ có một yêu cầu
            đang chờ.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <PayoutForm
            hotelId={hotelId}
            available={available}
            beneficiary={beneficiary}
            onSaved={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PayoutForm({
  hotelId,
  available,
  beneficiary,
  onSaved,
}: {
  hotelId: string;
  available: number | undefined;
  beneficiary: HotelBeneficiary | undefined;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const account = beneficiary?.account;

  const mutation = usePartnerMutation((value: number) => partnerService.createPayout(hotelId, { amount: value }), {
    invalidate: () => [partnerKeys.walletOf(hotelId), partnerKeys.statsOf(hotelId)],
    successMessage: (data) => `Đã gửi yêu cầu rút ${formatMoney(data.amount)}.`,
    errorNotice: false,
    onSuccess: onSaved,
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(undefined);
    const result = validateWith(createPayoutSchema, { amount: toOptionalNumber(amount) });
    if (result.errors) {
      setErrors(result.errors);
      return;
    }
    if (available !== undefined && result.data.amount > available) {
      setErrors({ amount: `Số dư khả dụng chỉ còn ${formatMoney(available)}.` });
      return;
    }
    setErrors({});
    mutation.mutate(result.data.amount, {
      onError: (error) => {
        setErrors(getApiFieldErrors(error));
        setFormError(getApiErrorMessage(error));
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <dl className="space-y-2 rounded-xl bg-muted p-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Số dư khả dụng</dt>
          <dd className="font-bold tabular-nums text-primary">{formatMoney(available)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Chuyển đến</dt>
          <dd className="text-right">
            {account ? (
              <>
                <span className="block font-semibold text-foreground">{account.bankName}</span>
                <span className="text-xs text-muted-foreground">
                  {account.accountNumber} · {account.accountHolder}
                </span>
              </>
            ) : (
              <span className="text-danger">Chưa có tài khoản đã xác minh</span>
            )}
          </dd>
        </div>
      </dl>
      <FormField label="Số tiền rút (₫)" required error={errors.amount} hint="Số nguyên, không vượt quá số dư khả dụng.">
        <div className="flex gap-2">
          <Input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="numeric" />
          {available !== undefined && available > 0 && (
            <button
              type="button"
              onClick={() => setAmount(Math.floor(available).toString())}
              className="shrink-0 rounded-lg border px-3 text-xs font-semibold text-primary hover:bg-primary/5"
            >
              Rút hết
            </button>
          )}
        </div>
      </FormField>
      <FormAlert message={formError} />
      <div className="flex justify-end">
        <SubmitButton pending={mutation.isPending} disabled={!account || mutation.isPending}>
          <Send />
          Gửi yêu cầu
        </SubmitButton>
      </div>
    </form>
  );
}
