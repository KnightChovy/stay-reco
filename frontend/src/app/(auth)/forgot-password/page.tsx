'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft, KeyRound, CheckCircle2, RotateCw } from 'lucide-react';
import { forgotPassword } from '@/services/auth.service';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setError('');
    setIsLoading(true);
    try {
      await forgotPassword({ email: email.trim().toLowerCase() });
      setIsSubmitted(true);
    } catch {
      // Backend always returns 204 without account enumeration; if network error:
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    try {
      await forgotPassword({ email: email.trim().toLowerCase() });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased text-foreground">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
        <div className="w-full max-w-md bg-white rounded-2xl border border-border shadow-sm p-6 sm:p-8">
          
          {isSubmitted ? (
            /* SUBMITTED / SENT LINK STATE */
            <div className="text-center py-2">
              <div className="size-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="size-8" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Kiểm tra hộp thư của bạn</h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-2 leading-relaxed">
                Chúng tôi đã gửi liên kết đặt lại mật khẩu đến địa chỉ email:
              </p>
              <p className="font-semibold text-foreground text-sm mt-2 bg-slate-50 py-2 px-3 rounded-lg border border-border inline-block break-all">
                {email}
              </p>
              <p className="text-[11px] text-muted-foreground mt-3">
                Vui lòng kiểm tra hộp thư đến (và cả mục Spam/Thư rác) và nhấn vào liên kết để tạo mật khẩu mới. Liên kết có hiệu lực trong 30 phút.
              </p>

              <div className="mt-6 space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResend}
                  disabled={isLoading}
                  className="w-full h-10 text-sm font-medium gap-2"
                >
                  <RotateCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Đang gửi lại...' : 'Chưa nhận được? Gửi lại'}</span>
                </Button>

                <Link href="/login" className="block w-full">
                  <Button className="w-full h-11 bg-primary text-primary-foreground hover:bg-[#193b56] font-semibold text-sm transition-all shadow-sm">
                    Quay lại Đăng nhập
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* REQUEST RESET LINK FORM */
            <div>
              <div className="text-center mb-6">
                <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="size-6" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Quên mật khẩu?</h1>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1.5">
                  Nhập địa chỉ email của bạn để nhận liên kết đặt lại mật khẩu an toàn.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs sm:text-sm font-semibold">
                    Địa chỉ Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="vidu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-10 sm:h-11 text-sm focus-visible:ring-primary"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700" role="alert">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 sm:h-11 bg-primary text-primary-foreground hover:bg-[#193b56] font-semibold text-sm transition-all shadow-sm disabled:opacity-70"
                >
                  {isLoading ? 'Đang gửi liên kết...' : 'Gửi liên kết đặt lại mật khẩu'}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-border text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowLeft className="size-4" /> Quay lại trang Đăng nhập
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
