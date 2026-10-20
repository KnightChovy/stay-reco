'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { resetPassword } from '@/services/auth.service';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="text-center py-4">
        <div className="size-14 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="size-8" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Liên kết không hợp lệ</h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-2 leading-relaxed">
          Không tìm thấy mã đặt lại mật khẩu trong liên kết của bạn. Vui lòng yêu cầu một liên kết mới.
        </p>
        <div className="mt-6">
          <Link href="/forgot-password">
            <Button className="w-full h-10 bg-primary text-primary-foreground hover:bg-[#193b56] font-semibold text-sm">
              Yêu cầu liên kết mới
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(newPassword)) {
      setError('Mật khẩu phải chứa ít nhất một chữ cái và một chữ số.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận chưa khớp.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({ token, newPassword });
      setIsSuccess(true);
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } } };
      setError(
        errObj.response?.data?.message ||
          'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn (liên kết chỉ có hiệu lực trong 30 phút).',
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-4">
        <div className="size-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="size-8" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Đặt lại mật khẩu thành công!</h1>
        <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
          Mật khẩu của bạn đã được cập nhật thành công. Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.
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
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
          <Lock className="size-6" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Đặt mật khẩu mới</h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1.5">
          Tạo mật khẩu mới an toàn gồm ít nhất 8 ký tự, có chữ và số.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="newPassword" className="text-xs sm:text-sm font-semibold">
            Mật khẩu mới
          </Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="Ít nhất 8 ký tự, có chữ và số"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10 pr-10 h-10 sm:h-11 text-sm focus-visible:ring-primary"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
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
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 pr-10 h-10 sm:h-11 text-sm focus-visible:ring-primary"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
            >
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
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
          {isLoading ? 'Đang cập nhật mật khẩu...' : 'Cập nhật mật khẩu'}
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-border text-center">
        <Link
          href="/login"
          className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          Quay lại trang Đăng nhập
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased text-foreground">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
        <div className="w-full max-w-md bg-white rounded-2xl border border-border shadow-sm p-6 sm:p-8">
          <Suspense fallback={null}>
            <ResetPasswordContent />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
