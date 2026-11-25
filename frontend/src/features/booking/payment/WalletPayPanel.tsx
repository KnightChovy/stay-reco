'use client';

import { useState } from 'react';
import { Loader2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { useMyWallet, usePayWithWallet } from '@/features/account/api/rewards-queries';
import { formatMoney } from '@/features/stays/lib/format';

/** `details` of 409 WALLET_INSUFFICIENT carries `balance` and `total` (docs/api/customer-wallet.md); read it defensively. */
function shortfallOf(error: unknown): number | null {
  const details = (error as { response?: { data?: { details?: unknown } } } | undefined)?.response?.data?.details;
  if (details && typeof details === 'object' && !Array.isArray(details)) {
    const { balance, total } = details as { balance?: unknown; total?: unknown };
    if (typeof balance === 'number' && typeof total === 'number') return Math.max(0, total - balance);
  }
  return null;
}

/**
 * The secondary way to pay (decision W1: the wallet pays the whole booking or nothing). Hidden when the wallet is
 * empty; with too little in it, it says how much is missing so the transfer stays the obvious route.
 */
export function WalletPayPanel({ bookingId, total }: { bookingId: string; total: number }) {
  const walletQuery = useMyWallet();
  const payWithWallet = usePayWithWallet();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<{ message: string; shortfall: number | null } | null>(null);
  const balance = walletQuery.data?.balanceAvailable ?? 0;

  if (walletQuery.isLoading || walletQuery.error || balance <= 0) return null;
  const enough = balance >= total;

  const pay = () => {
    setError(null);
    payWithWallet.mutate(bookingId, {
      // On success the booking query reads CONFIRMED and the page moves to the confirmation.
      onError: (mutationError) => {
        setConfirming(false);
        const insufficient = getApiErrorCode(mutationError) === 'WALLET_INSUFFICIENT';
        setError({
          message: insufficient
            ? 'Số dư ví không đủ trả toàn bộ đơn. Vui lòng chuyển khoản.'
            : getApiErrorMessage(mutationError, 'Không thanh toán được bằng ví. Vui lòng chuyển khoản.'),
          shortfall: insufficient ? shortfallOf(mutationError) : null,
        });
        void walletQuery.refetch();
      },
    });
  };

  return (
    <section aria-labelledby="wallet-title" className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="wallet-title" className="flex items-center gap-2 text-base font-bold text-foreground">
            <Wallet className="size-5 text-primary" aria-hidden /> Hoặc trả bằng ví StayReco
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Trừ trọn đơn từ ví, xác nhận ngay, không cần chuyển khoản.
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="block text-xs text-muted-foreground">Số dư ví</span>
          <span className="text-base font-bold text-foreground">{formatMoney(balance)}</span>
        </div>
      </div>

      {!enough ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Ví còn thiếu <strong>{formatMoney(total - balance)}</strong>. Ví chỉ trả được trọn đơn, nên hãy chuyển khoản ở
          trên.
        </p>
      ) : confirming ? (
        <div className="space-y-3 rounded-lg border border-border bg-muted/60 p-4">
          <p className="text-sm text-foreground">
            Trừ <strong>{formatMoney(total)}</strong> từ ví? Số dư còn lại <strong>{formatMoney(balance - total)}</strong>.
          </p>
          <div className="flex items-center gap-2">
            <Button onClick={pay} disabled={payWithWallet.isPending} className="h-10 gap-1.5 px-5 whitespace-nowrap">
              {payWithWallet.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Xác nhận trừ ví
            </Button>
            <Button
              variant="ghost"
              onClick={() => setConfirming(false)}
              disabled={payWithWallet.isPending}
              className="h-10 px-4"
            >
              Quay lại
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setConfirming(true)} className="h-10 w-full gap-2 sm:w-auto sm:px-5">
          <Wallet className="size-4" aria-hidden /> Trả {formatMoney(total)} bằng ví
        </Button>
      )}

      {error && (
        <p role="alert" className="text-sm font-semibold text-red-700">
          {error.message}
          {error.shortfall !== null && ` Còn thiếu ${formatMoney(error.shortfall)}.`}
        </p>
      )}
    </section>
  );
}
