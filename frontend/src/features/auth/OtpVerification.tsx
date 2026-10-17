'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { MailCheck, RotateCw, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { resendVerification } from '@/services/auth.service';

type OtpVerificationProps = {
  email: string;
  /** Called after the code is accepted; the account is signed in at that point. */
  onVerified: () => void;
};

/**
 * 6-digit email verification form shared by the register flow and `/verify-email`.
 * Verifying the code activates the account and signs the user in (same result as login).
 */
export function OtpVerification({ email, onVerified }: OtpVerificationProps) {
  const verifyEmail = useAuthStore((state) => state.verifyEmail);

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!/^\d{6}$/.test(code)) {
      setError('Vui lòng nhập đủ 6 chữ số của mã xác thực.');
      return;
    }

    setIsVerifying(true);
    try {
      const result = await verifyEmail({ email, code });
      if (!result.success) {
        setError(result.message);
        return;
      }
      onVerified();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    setError('');
    setInfo('');
    setIsResending(true);
    try {
      await resendVerification({ email });
      setInfo('Đã gửi lại mã xác thực. Vui lòng kiểm tra hộp thư của bạn.');
      setCountdown(60);
    } catch {
      setError('Không thể gửi lại mã xác thực lúc này. Vui lòng thử lại sau.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="py-4 text-center">
      <div className="size-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-5">
        <MailCheck className="size-8" />
      </div>
      <h1 className="text-2xl font-bold text-foreground tracking-tight">
        Nhập mã xác thực
      </h1>
      <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
        Chúng tôi đã gửi mã xác thực gồm 6 chữ số đến địa chỉ email:
      </p>
      <p className="font-semibold text-foreground text-base mt-2 bg-slate-50 py-2 px-3 rounded-lg border border-border inline-block break-all">
        {email}
      </p>
      <p className="text-xs text-muted-foreground mt-3">
        Vui lòng nhập mã để kích hoạt tài khoản (mã có hiệu lực trong 10 phút).
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
            pattern="^[0-9]+$"
            inputMode="numeric"
            autoFocus
            aria-label="Mã xác thực gồm 6 chữ số"
          >
            <InputOTPGroup>
              {Array.from({ length: 6 }).map((_, index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className="size-11 text-base"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        {info && (
          <p
            className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700"
            role="status"
          >
            {info}
          </p>
        )}
        {error && (
          <p
            className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
            role="alert"
          >
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={isVerifying || code.length < 6}
          className="w-full h-11 bg-primary text-primary-foreground hover:bg-[#193b56] font-semibold text-sm transition-all shadow-sm gap-2 disabled:opacity-70"
        >
          <ShieldCheck className="size-4" />
          <span>{isVerifying ? 'Đang xác thực...' : 'Xác thực tài khoản'}</span>
          {!isVerifying && <ArrowRight className="size-4" />}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleResend}
          disabled={countdown > 0 || isResending}
          className="w-full h-11 text-sm font-medium gap-2"
        >
          <RotateCw
            className={`size-4 ${countdown > 0 ? 'animate-spin' : ''}`}
          />
          <span>
            {countdown > 0
              ? `Gửi lại mã sau (${countdown}s)`
              : 'Gửi lại mã xác thực'}
          </span>
        </Button>
      </form>
    </div>
  );
}
