'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AuthSocialActions } from '@/components/features/auth/AuthSocialActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Star } from 'lucide-react';
import { demoAccounts, getSafeNextPath, roleDashboardPaths, useAuthStore } from '@/lib/auth-store';

function LoginPageContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const next = searchParams.get('next');
  const registerHref = next ? `/register?next=${encodeURIComponent(next)}` : '/register';
  const forgotPasswordHref = next ? `/forgot-password?next=${encodeURIComponent(next)}` : '/forgot-password';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = login(email, password);
    if (!result.success) {
      setError(result.message);
      return;
    }

    router.replace(
      result.user.role === 'customer'
        ? getSafeNextPath(next)
        : roleDashboardPaths[result.user.role],
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased text-foreground">
      <Header />

      <main className="flex-1 flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          
          {/* Left Form Section */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
              <div className="mb-8">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
                  <ShieldCheck className="size-3.5" /> Chốn nghỉ an tâm & hợp gu
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  Chào mừng trở lại!
                </h1>
                <p className="text-muted-foreground text-sm mt-1.5">
                  Đăng nhập để khám phá các ưu đãi độc quyền và quản lý chuyến đi của bạn.
                </p>
              </div>

              <div className="mb-6 rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs">
                <p className="font-semibold text-primary">Tài khoản demo theo vai trò</p>
                <div className="mt-2 space-y-1 text-muted-foreground">
                  {demoAccounts.map((account) => (
                    <p key={account.role} className="flex flex-wrap justify-between gap-x-3 gap-y-0.5">
                      <span className="capitalize">{account.role}</span>
                      <span className="font-mono text-foreground">{account.email} / {account.password}</span>
                    </p>
                  ))}
                </div>
              </div>

              <AuthSocialActions dividerLabel="hoặc đăng nhập bằng Email" />

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs sm:text-sm font-semibold">
                    Email hoặc Số điện thoại
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="text"
                      placeholder="vidu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-10 sm:h-11 text-sm focus-visible:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs sm:text-sm font-semibold">
                      Mật khẩu
                    </Label>
                    <Link
                      href={forgotPasswordHref}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
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

                {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700" role="alert">{error}</p>}

                <Button
                  type="submit"
                  className="w-full h-10 sm:h-11 bg-primary text-primary-foreground hover:bg-[#193b56] font-semibold text-sm transition-all shadow-sm gap-2 mt-2"
                >
                  <span>Đăng nhập</span>
                  <ArrowRight className="size-4" />
                </Button>
              </form>

              <div className="mt-8 text-center text-xs sm:text-sm text-muted-foreground">
                Chưa có tài khoản?{' '}
                <Link href={registerHref} className="font-semibold text-primary hover:underline">
                  Đăng ký ngay
                </Link>
              </div>
            </div>
          </div>

          {/* Right Hero Image Section */}
          <div className="hidden lg:col-span-5 bg-gradient-to-br from-primary/95 to-[#0b1f30] text-white p-8 lg:p-10 flex-col justify-between relative overflow-hidden lg:flex">
            <Image
              src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80"
              alt="Hero Resort Background"
              fill
              className="object-cover opacity-30 mix-blend-overlay pointer-events-none"
              priority
            />
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <Image
                  src="/images/logo_stayreco.png"
                  alt="StayReco Logo"
                  width={120}
                  height={40}
                  className="brightness-0 invert"
                />
              </div>
              <h2 className="text-2xl font-bold leading-tight">
                Tìm chốn nghỉ hợp gu, chuẩn trải nghiệm cùng AI.
              </h2>
              <p className="text-white/80 text-xs sm:text-sm mt-3 leading-relaxed">
                Hệ thống đề xuất thông minh giúp bạn khám phá khách sạn, resort & homestay hoàn hảo cho mọi hành trình.
              </p>
            </div>

            <div className="relative z-10 mt-12 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-1 text-amber-400 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-white/90 italic leading-relaxed">
                &ldquo;Nhờ StayReco gợi ý, gia đình tôi đã tìm được resort Đà Lạt cực kỳ yên tĩnh với view rừng thông tuyệt đẹp.&rdquo;
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="size-7 rounded-full bg-amber-400 text-primary font-bold text-xs flex items-center justify-center">
                  MN
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Minh Nhật</div>
                  <div className="text-[10px] text-white/70">Khách hàng thân thiết</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={null}><LoginPageContent /></Suspense>;
}
