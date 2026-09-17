'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft, KeyRound, CheckCircle2, ShieldAlert, Lock, Eye, EyeOff } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setStep(2);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Khôi phục mật khẩu thành công! Bạn có thể đăng nhập ngay.');
    window.location.href = '/login';
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased text-foreground">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
        <div className="w-full max-w-md bg-white rounded-2xl border border-border shadow-sm p-6 sm:p-8">
          
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === s ? 'w-8 bg-primary' : s < step ? 'w-4 bg-primary/40' : 'w-4 bg-muted'
                }`}
              />
            ))}
          </div>

          {/* STEP 1: REQUEST EMAIL */}
          {step === 1 && (
            <div>
              <div className="text-center mb-6">
                <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="size-6" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Quên mật khẩu?</h1>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1.5">
                  Nhập địa chỉ email của bạn để nhận mã xác minh OTP khôi phục mật khẩu.
                </p>
              </div>

              <form onSubmit={handleSendEmail} className="space-y-4">
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

                <Button
                  type="submit"
                  className="w-full h-10 sm:h-11 bg-primary text-primary-foreground hover:bg-[#193b56] font-semibold text-sm transition-all shadow-sm"
                >
                  Gửi mã xác minh OTP
                </Button>
              </form>
            </div>
          )}

          {/* STEP 2: VERIFY OTP */}
          {step === 2 && (
            <div>
              <div className="text-center mb-6">
                <div className="size-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="size-6" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Nhập mã OTP</h1>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1.5">
                  Mã OTP 6 chữ số đã được gửi đến email <span className="font-semibold text-foreground">{email}</span>.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="flex justify-between items-center gap-2">
                  {otp.map((digit, idx) => (
                    <Input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      className="size-11 sm:size-12 text-center text-lg font-bold p-0 focus-visible:ring-primary"
                    />
                  ))}
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 sm:h-11 bg-primary text-primary-foreground hover:bg-[#193b56] font-semibold text-sm transition-all shadow-sm"
                >
                  Xác nhận mã OTP
                </Button>

                <div className="text-center text-xs text-muted-foreground">
                  Chưa nhận được mã?{' '}
                  <button type="button" className="text-primary font-semibold hover:underline">
                    Gửi lại mã (60s)
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: NEW PASSWORD */}
          {step === 3 && (
            <div>
              <div className="text-center mb-6">
                <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="size-6" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Đặt mật khẩu mới</h1>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1.5">
                  Tạo mật khẩu mới an toàn gồm ít nhất 8 ký tự.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-xs sm:text-sm font-semibold">
                    Mật khẩu mới
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Mật khẩu mới"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 pr-10 h-10 sm:h-11 text-sm focus-visible:ring-primary"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs sm:text-sm font-semibold">
                    Xác nhận mật khẩu mới
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 h-10 sm:h-11 text-sm focus-visible:ring-primary"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 sm:h-11 bg-primary text-primary-foreground hover:bg-[#193b56] font-semibold text-sm transition-all shadow-sm"
                >
                  Hoàn tất & Đăng nhập
                </Button>
              </form>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-border text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="size-4" /> Quay lại trang Đăng nhập
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
