"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Download, Loader2, Maximize2, Sun } from "lucide-react";
import QRCode from "qrcode";
import type { BookingVoucher } from "@stayreco/shared";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatDate } from "@/features/stays/lib/format";

/** Drawn once at this width, sharp enough for both the card and the enlarged view. */
const QR_PIXELS = 720;

function useQrDataUrl(token: string) {
  const [rendered, setRendered] = useState<{ token: string; url: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(token, { width: QR_PIXELS, margin: 1, errorCorrectionLevel: "M" })
      .then((url) => {
        if (!cancelled) setRendered({ token, url });
      })
      .catch(() => {
        if (!cancelled) setRendered(null);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);
  return rendered?.token === token ? rendered.url : null;
}

/** Copies the booking code and says so for two seconds. */
export function CopyCodeButton({ code, className }: { code: string; className?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const copied = state === "copied";
  useEffect(() => {
    if (state === "idle") return;
    const timer = window.setTimeout(() => setState("idle"), 2500);
    return () => window.clearTimeout(timer);
  }, [state]);

  if (state === "failed") {
    return (
      <span role="status" className={cn("text-xs font-semibold text-amber-700", className)}>
        Không chép được, hãy chép thủ công
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (!navigator.clipboard) {
          setState("failed");
          return;
        }
        navigator.clipboard.writeText(code).then(
          () => setState("copied"),
          () => setState("failed"),
        );
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#013758]",
        className,
      )}
      aria-label={copied ? "Đã sao chép mã đặt phòng" : `Sao chép mã ${code}`}
    >
      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
      {copied ? "Đã chép" : "Chép mã"}
    </button>
  );
}

/**
 * The check-in QR of a booking voucher, drawn in the browser: the token is the booking code plus the hotel's
 * signature, so it is never sent to a third-party QR service. Staff scan it on /staff/check-in and /staff/check-out.
 * Tapping the code opens it full size, with the stay details, for the front desk to scan from a phone.
 */
export function VoucherQr({
  token,
  code,
  voucher,
  size = 208,
  className,
}: {
  token: string;
  code: string;
  /** The stay shown under the enlarged code; optional so a bare QR still works. */
  voucher?: BookingVoucher;
  size?: number;
  className?: string;
}) {
  const dataUrl = useQrDataUrl(token);
  const [zoomed, setZoomed] = useState(false);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <button
        type="button"
        onClick={() => setZoomed(true)}
        disabled={!dataUrl}
        className="group relative flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#013758] disabled:cursor-wait"
        style={{ width: size + 16, height: size + 16 }}
        aria-label={`Phóng to mã QR check-in của đơn ${code}`}
      >
        {dataUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- a data URL drawn in the browser, nothing to optimize */}
            <img src={dataUrl} alt="" width={size} height={size} />
            <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-md bg-[#013758]/90 px-1.5 py-1 text-[10px] font-semibold text-white opacity-90 transition-opacity group-hover:opacity-100">
              <Maximize2 className="size-3" /> Phóng to
            </span>
          </>
        ) : (
          <Loader2 className="size-6 animate-spin text-slate-400" aria-label="Đang tạo mã QR" />
        )}
      </button>
      <div className="mt-3 flex items-center gap-1">
        <p className="font-mono text-sm font-bold text-[#013758]">{code}</p>
        <CopyCodeButton code={code} />
      </div>
      {dataUrl && (
        <a
          href={dataUrl}
          download={`stayreco-voucher-${code}.png`}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Download className="size-3.5" /> Tải mã QR
        </a>
      )}

      <Dialog open={zoomed} onOpenChange={setZoomed}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:max-w-md">
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-base">Mã QR check-in</DialogTitle>
            <DialogDescription>Đưa màn hình này cho lễ tân quét khi nhận và trả phòng.</DialogDescription>
          </DialogHeader>

          {dataUrl && (
            <div className="mx-auto w-full max-w-[min(100%,22rem)] rounded-2xl border-2 border-[#013758]/15 bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- a data URL drawn in the browser, nothing to optimize */}
              <img
                src={dataUrl}
                alt={`Mã QR check-in của đơn ${code}`}
                className="aspect-square h-auto w-full [image-rendering:pixelated]"
              />
            </div>
          )}

          <div className="flex items-center justify-center gap-1">
            <span className="font-mono text-xl font-bold tracking-wider text-[#013758]">{code}</span>
            <CopyCodeButton code={code} />
          </div>

          {voucher && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl bg-[#f1f3f9] p-3 text-xs">
              <div className="col-span-2">
                <dt className="text-[10px] font-semibold uppercase text-slate-400">Khách sạn</dt>
                <dd className="font-semibold text-[#202B36]">{voucher.hotelName}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase text-slate-400">Khách nhận phòng</dt>
                <dd className="font-semibold text-[#202B36]">{voucher.guestName}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase text-slate-400">Phòng · khách</dt>
                <dd className="font-semibold text-[#202B36]">
                  {voucher.rooms} phòng · {voucher.guests} khách
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase text-slate-400">Nhận phòng</dt>
                <dd className="font-semibold text-[#202B36]">{formatDate(voucher.checkIn)}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase text-slate-400">Trả phòng</dt>
                <dd className="font-semibold text-[#202B36]">{formatDate(voucher.checkOut)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[10px] font-semibold uppercase text-slate-400">Hạng phòng</dt>
                <dd className="font-semibold text-[#202B36]">
                  {voucher.items.map((item) => `${item.roomTypeName} × ${item.rooms}`).join(", ")}
                </dd>
              </div>
            </dl>
          )}

          <p className="flex items-start gap-1.5 text-[11px] text-slate-500">
            <Sun className="mt-px size-3.5 shrink-0 text-amber-500" />
            Tăng độ sáng màn hình để máy quét đọc nhanh hơn. Không chia sẻ mã này cho người khác.
          </p>

          {dataUrl && (
            <a
              href={dataUrl}
              download={`stayreco-voucher-${code}.png`}
              className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#013758] text-xs font-semibold text-white hover:bg-[#193B56]"
            >
              <Download className="size-3.5" /> Lưu ảnh mã QR
            </a>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
