'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ExternalLink, Loader2, Maximize2, RefreshCw, ShieldCheck, Sun } from 'lucide-react';
import type { BookingPayment } from '@stayreco/shared';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatMoney } from '@/features/stays/lib/format';
import { CopyField } from './CopyField';

/**
 * The bank transfer, the primary way to pay: the VietQR (tap to enlarge for another phone to scan), then every field
 * with its own copy button, the amount and the transfer content highlighted because both must match exactly.
 */
export function TransferPanel({
  payment,
  bookingCode,
  checking,
  onCheckNow,
}: {
  payment: BookingPayment;
  bookingCode: string;
  checking: boolean;
  onCheckNow: () => void;
}) {
  const [zoomed, setZoomed] = useState(false);

  return (
    <section aria-labelledby="transfer-title" className="space-y-5 rounded-xl border border-border bg-card p-5 shadow-xs sm:p-6">
      <div>
        <h2 id="transfer-title" className="text-lg font-bold text-foreground">
          Chuyển khoản qua VietQR
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Mở ứng dụng ngân hàng, quét mã. Số tiền và nội dung đã điền sẵn, đừng sửa.
        </p>
      </div>

      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <div className="flex shrink-0 flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setZoomed(true)}
            className="group relative rounded-xl border border-border bg-white p-2 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label={`Phóng to mã VietQR của đơn ${bookingCode}`}
          >
            <Image
              src={payment.qrImageUrl}
              alt=""
              width={224}
              height={224}
              unoptimized
              className="size-56 object-contain"
            />
            <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-md bg-primary/90 px-1.5 py-1 text-xs font-semibold text-primary-foreground">
              <Maximize2 className="size-3" aria-hidden /> Phóng to
            </span>
          </button>
          <p className="text-center text-xs text-muted-foreground">Quét bằng app ngân hàng hoặc ví điện tử</p>
        </div>

        <div className="w-full min-w-0 space-y-2">
          <CopyField
            label="Số tiền"
            value={formatMoney(payment.amount)}
            copyValue={String(payment.amount)}
            emphasis
          />
          <CopyField label="Nội dung chuyển khoản" value={payment.transferContent} mono emphasis />
          <CopyField label="Số tài khoản" value={payment.accountNumber} mono />
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg bg-muted/60 px-3 py-2">
              <span className="block text-xs text-muted-foreground">Ngân hàng</span>
              <span className="block text-sm font-bold text-foreground">{payment.bankName}</span>
            </div>
            <div className="rounded-lg bg-muted/60 px-3 py-2">
              <span className="block text-xs text-muted-foreground">Chủ tài khoản</span>
              <span className="block text-sm font-bold uppercase text-foreground">{payment.accountName}</span>
            </div>
          </div>
        </div>
      </div>

      <p className="flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          Chuyển đúng <strong>{formatMoney(payment.amount)}</strong> với nội dung <strong>{payment.transferContent}</strong>.
          Sai số tiền hoặc nội dung thì hệ thống không tự xác nhận được.
        </span>
      </p>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="size-4 shrink-0 animate-spin text-primary motion-reduce:animate-none" aria-hidden />
          Đang chờ xác nhận chuyển khoản… trang tự chuyển khi nhận được tiền.
        </p>
        <button
          type="button"
          onClick={onCheckNow}
          className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-muted"
        >
          <RefreshCw className={checking ? 'size-4 animate-spin' : 'size-4'} aria-hidden /> Kiểm tra ngay
        </button>
      </div>

      <Dialog open={zoomed} onOpenChange={setZoomed}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:max-w-md">
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-base">Mã VietQR · {bookingCode}</DialogTitle>
            <DialogDescription>Quét bằng ứng dụng ngân hàng trên điện thoại khác.</DialogDescription>
          </DialogHeader>
          <div className="mx-auto w-full max-w-[min(100%,22rem)] rounded-2xl border-2 border-primary/15 bg-white p-3">
            <Image
              src={payment.qrImageUrl}
              alt={`Mã VietQR chuyển ${formatMoney(payment.amount)} cho đơn ${bookingCode}`}
              width={480}
              height={480}
              unoptimized
              className="aspect-square h-auto w-full object-contain"
            />
          </div>
          <div className="space-y-2">
            <CopyField label="Số tiền" value={formatMoney(payment.amount)} copyValue={String(payment.amount)} emphasis />
            <CopyField label="Nội dung chuyển khoản" value={payment.transferContent} mono emphasis />
          </div>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Sun className="mt-px size-3.5 shrink-0 text-amber-500" aria-hidden />
            Tăng độ sáng màn hình để quét nhanh hơn.
          </p>
          {/* The image is served by qr.sepay.vn: a cross-origin `download` is ignored, so it opens for a long-press save. */}
          <a
            href={payment.qrImageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted"
          >
            <ExternalLink className="size-4" aria-hidden /> Mở ảnh mã QR để lưu
          </a>
        </DialogContent>
      </Dialog>
    </section>
  );
}
