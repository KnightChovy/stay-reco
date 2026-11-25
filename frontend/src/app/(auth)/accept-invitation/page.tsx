'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, Eye, EyeOff, Lock, UserCheck } from 'lucide-react';
import { passwordSchema } from '@stayreco/shared';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateWith } from '@/lib/api-error';
import { roleDashboardPaths, useAuthStore } from '@/lib/auth-store';

/** The invitation email (staff of a hotel, or a platform manager) links here with `?token=…`, valid 72 hours. */
function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const acceptInvitation = useAuthStore((state) => state.acceptInvitation);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [alreadyAccepted, setAlreadyAccepted] = useState(false);

  if (!token) {
    return (
      <div className="text-center py-4">
        <div className="size-14 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="size-8" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Liên kết không hợp lệ</h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-2 leading-relaxed">
          Không tìm thấy mã lời mời trong liên kết. Vui lòng mở lại liên kết trong email mời hoặc liên hệ người đã mời bạn.
        </p>
        <div className="mt-6">
          <Link href="/login">
            <Button variant="outline" className="w-full h-10 font-semibold text-sm">
              Quay lại trang Đăng nhập
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');

    const parsed = validateWith(passwordSchema, password);
    if (parsed.errors) {
      setError(Object.values(parsed.errors)[0] ?? 'Mật khẩu không hợp lệ.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận chưa khớp.');
      return;
    }

    setIsLoading(true);
    const result = await acceptInvitation({ token, password });
    setIsLoading(false);

    if (result.success) {
      router.replace(roleDashboardPaths[result.user.role]);
      return;
    }
    setAlreadyAccepted(result.code === 'AUTH_INVITATION_ACCEPTED');
    setError(result.message);
  };

  return (
    <div>
      <div className="text-center mb-6">
        <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
          <UserCheck className="size-6" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Chấp nhận lời mời</h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1.5">
          Tạo mật khẩu cho tài khoản của bạn (ít nhất 8 ký tự, có chữ và số) để bắt đầu làm việc trên StayReco.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs sm:text-sm font-semibold">
            Mật khẩu
          </Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Ít nhất 8 ký tự, có chữ và số"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            Xác nhận mật khẩu
          </Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-10 sm:h-11 text-sm focus-visible:ring-primary"
              required
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700" role="alert">
            {error}
            {alreadyAccepted && (
              <Link href="/login" className="ml-1 font-semibold underline">
                Đăng nhập
              </Link>
            )}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 sm:h-11 bg-primary text-primary-foreground hover:bg-[#193b56] font-semibold text-sm transition-all shadow-sm disabled:opacity-70"
        >
          {isLoading ? 'Đang kích hoạt tài khoản...' : 'Kích hoạt tài khoản'}
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-border text-center">
        <Link
          href="/login"
          className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          Đã có tài khoản? Đăng nhập
        </Link>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased text-foreground">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
        <div className="w-full max-w-md bg-white rounded-2xl border border-border shadow-sm p-6 sm:p-8">
          <Suspense fallback={null}>
            <AcceptInvitationContent />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
