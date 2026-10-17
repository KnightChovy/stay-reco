'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Loader2, Mail, ArrowRight } from 'lucide-react';
import { resendVerification, verifyEmail } from '@/services/auth.service';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(() =>
    token ? 'loading' : 'error',
  );
  const [errorMessage, setErrorMessage] = useState(() =>
    token
      ? ''
      : 'Không tìm thấy mã xác thực trong liên kết. Vui lòng kiểm tra lại liên kết trong email.',
  );
  const [resendEmail, setResendEmail] = useState('');
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    let isCancelled = false;

    const performVerify = async () => {
      try {
        await verifyEmail({ token });
        if (!isCancelled) setStatus('success');
      } catch (err: unknown) {
        if (!isCancelled) {
          setStatus('error');
          const errObj = err as { response?: { data?: { message?: string } } };
          setErrorMessage(
            errObj.response?.data?.message ||
              'Mã xác thực không hợp lệ hoặc đã hết hạn (liên kết chỉ có hiệu lực trong 24 giờ).',
          );
        }
      }
    };

    performVerify();
    return () => {
      isCancelled = true;
    };
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;

    setResendLoading(true);
    setResendSuccess('');
    try {
      await resendVerification({ email: resendEmail });
      setResendSuccess('Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư của bạn.');
    } catch {
      setResendSuccess('Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư của bạn.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased text-foreground">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
        <div className="w-full max-w-md bg-white rounded-2xl border border-border shadow-sm p-6 sm:p-8">
          
          {/* LOADING STATE */}
          {status === 'loading' && (
            <div className="text-center py-6">
              <Loader2 className="size-12 text-primary animate-spin mx-auto mb-4" />
              <h1 className="text-xl font-bold text-foreground">Đang xác thực email...</h1>
              <p className="text-muted-foreground text-sm mt-2">
                Vui lòng đợi trong giây lát trong khi chúng tôi kích hoạt tài khoản của bạn.
              </p>
            </div>
          )}

          {/* SUCCESS STATE */}
          {status === 'success' && (
            <div className="text-center py-4">
              <div className="size-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="size-8" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Xác thực thành công!</h1>
              <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                Email của bạn đã được xác thực thành công. Bây giờ bạn có thể đăng nhập và trải nghiệm toàn bộ tiện ích của StayReco.
              </p>

              <div className="mt-6">
                <Link href="/login" className="block w-full">
                  <Button className="w-full h-11 bg-primary text-primary-foreground hover:bg-[#193b56] font-semibold text-sm transition-all shadow-sm gap-2">
                    <span>Đăng nhập ngay</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* ERROR STATE */}
          {status === 'error' && (
            <div className="text-center py-4">
              <div className="size-14 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center mx-auto mb-4">
                <XCircle className="size-8" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Xác thực không thành công</h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-2 leading-relaxed">
                {errorMessage}
              </p>

              {/* Resend form */}
              <div className="mt-6 pt-6 border-t border-border text-left">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Gửi lại email xác thực
                </h3>
                <form onSubmit={handleResend} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="resend-email" className="text-xs font-semibold">
                      Địa chỉ email của bạn
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="resend-email"
                        type="email"
                        placeholder="vidu@email.com"
                        value={resendEmail}
                        onChange={(e) => setResendEmail(e.target.value)}
                        className="pl-10 h-10 text-sm focus-visible:ring-primary"
                        required
                      />
                    </div>
                  </div>

                  {resendSuccess && (
                    <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                      {resendSuccess}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={resendLoading}
                    className="w-full h-10 bg-primary text-primary-foreground hover:bg-[#193b56] font-semibold text-sm transition-all shadow-sm disabled:opacity-70"
                  >
                    {resendLoading ? 'Đang gửi...' : 'Gửi liên kết mới'}
                  </Button>
                </form>
              </div>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-xs text-primary hover:underline font-semibold">
                  Quay lại trang Đăng nhập
                </Link>
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
