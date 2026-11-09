"use client";

import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";

/**
 * The check-in QR of a booking voucher, drawn in the browser: the token is the booking code plus the hotel's
 * signature, so it is never sent to a third-party QR service. Staff scan it on /staff/check-in and /staff/check-out.
 */
export function VoucherQr({
  token,
  code,
  size = 208,
  className,
}: {
  token: string;
  code: string;
  size?: number;
  className?: string;
}) {
  const [rendered, setRendered] = useState<{ token: string; url: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(token, { width: size * 2, margin: 1, errorCorrectionLevel: "M" })
      .then((url) => {
        if (!cancelled) setRendered({ token, url });
      })
      .catch(() => {
        if (!cancelled) setRendered(null);
      });
    return () => {
      cancelled = true;
    };
  }, [token, size]);

  const dataUrl = rendered?.token === token ? rendered.url : null;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2"
        style={{ width: size + 16, height: size + 16 }}
      >
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- a data URL drawn in the browser, nothing to optimize
          <img src={dataUrl} alt={`Mã QR check-in của đơn ${code}`} width={size} height={size} />
        ) : (
          <Loader2 className="size-6 animate-spin text-slate-400" aria-label="Đang tạo mã QR" />
        )}
      </div>
      <p className="mt-3 font-mono text-sm font-bold text-[#013758]">{code}</p>
      {dataUrl && (
        <a
          href={dataUrl}
          download={`stayreco-voucher-${code}.png`}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Download className="size-3.5" /> Tải mã QR
        </a>
      )}
    </div>
  );
}
