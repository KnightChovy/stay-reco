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
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Lock, Mail, User, Phone, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { getSafeNextPath, useAuthStore } from '@/lib/auth-store';

function RegisterPageContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const register = useAuthStore((state) => state.register);
  const next = searchParams.get('next');
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : '/login';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password.length < 8) {
      setError('Mật khẩu cần có ít nhất 8 ký tự.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận chưa khớp.');
      return;
    }
    if (!formData.agreeTerms) {
      setError('Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật.');
      return;
    }

    const result = register({
      name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
    });
    if (!result.success) {
      setError(result.message);
      return;
    }

    router.replace(getSafeNextPath(next));
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased text-foreground">
      <Header />

      <main className="flex-1 flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          
          {/* Left / Branding Section */}
          <div className="hidden lg:col-span-5 bg-gradient-to-br from-primary to-[#122e44] text-white p-8 lg:p-10 flex-col justify-between relative overflow-hidden lg:flex">
            <Image
              src="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1000&q=80"
              alt="Hero Resort Background"
              fill
              className="object-cover opacity-30 mix-blend-overlay pointer-events-none"
              priority
            />
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
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
                Tham gia cộng đồng du lịch thông minh StayReco
              </h2>
              <p className="text-white/80 text-xs sm:text-sm mt-3 leading-relaxed">
                Tạo tài khoản miễn phí để nhận ngay ưu đãi độc quyền dành cho thành viên mới.
              </p>
            </div>

            <div className="relative z-10 space-y-4 my-8">
              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15">
                <CheckCircle2 className="size-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold">Gợi ý phòng thông minh AI</h4>
                  <p className="text-[11px] text-white/70">Phân tích sở thích để đề xuất khách sạn hợp gu nhất.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15">
                <CheckCircle2 className="size-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold">Tích điểm & Ưu đãi độc quyền</h4>
                  <p className="text-[11px] text-white/70">Tích lũy xu voucher cho mọi chuyến đặt phòng thành công.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15">
                <CheckCircle2 className="size-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold">Quản lý lịch trình dễ dàng</h4>
                  <p className="text-[11px] text-white/70">Xem thông tin đặt phòng, voucher & QR check-in tiện lợi.</p>
                </div>
              </div>
            </div>

            <div className="relative z-10 text-[11px] text-white/60">
              © {new Date().getFullYear()} StayReco. Tất cả các quyền được bảo lưu.
            </div>
          </div>

          {/* Right / Register Form Section */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
              <div className="mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-semibold mb-3">
                  <Sparkles className="size-3.5" /> Ưu đãi thành viên mới
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  Tạo tài khoản mới
                </h1>
                <p className="text-muted-foreground text-sm mt-1.5">
                  Điền thông tin bên dưới để bắt đầu trải nghiệm dịch vụ StayReco.
                </p>
              </div>

              <AuthSocialActions dividerLabel="hoặc đăng ký bằng Form" />

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <Label htmlFor="fullName" className="text-xs sm:text-sm font-semibold">
                    Họ và tên
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="pl-10 h-10 sm:h-11 text-sm focus-visible:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-xs sm:text-sm font-semibold">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="vidu@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-10 h-10 sm:h-11 text-sm focus-visible:ring-primary"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phone" className="text-xs sm:text-sm font-semibold">
                      Số điện thoại
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="0912345678"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="pl-10 h-10 sm:h-11 text-sm focus-visible:ring-primary"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password" className="text-xs sm:text-sm font-semibold">
                    Mật khẩu
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Ít nhất 8 ký tự"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

                <div className="space-y-1">
                  <Label htmlFor="confirmPassword" className="text-xs sm:text-sm font-semibold">
                    Nhập lại mật khẩu
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Xác nhận mật khẩu"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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

                <div className="flex items-start space-x-2 pt-1">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeTerms}
                    onCheckedChange={(checked) => setFormData({ ...formData, agreeTerms: !!checked })}
                    className="mt-0.5"
                  />
                  <Label htmlFor="terms" className="text-xs text-muted-foreground leading-normal cursor-pointer">
                    Tôi đồng ý với <Link href="/terms" className="text-primary hover:underline font-semibold">Điều khoản sử dụng</Link> và <Link href="/privacy" className="text-primary hover:underline font-semibold">Chính sách bảo mật</Link> của StayReco.
                  </Label>
                </div>

                {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700" role="alert">{error}</p>}

                <Button
                  type="submit"
                  className="w-full h-10 sm:h-11 bg-primary text-primary-foreground hover:bg-[#193b56] font-semibold text-sm transition-all shadow-sm gap-2 mt-2"
                >
                  <span>Tạo tài khoản StayReco</span>
                  <ArrowRight className="size-4" />
                </Button>
              </form>

              <div className="mt-6 text-center text-xs sm:text-sm text-muted-foreground">
                Đã có tài khoản?{' '}
                <Link href={loginHref} className="font-semibold text-primary hover:underline">
                  Đăng nhập tại đây
                </Link>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense fallback={null}><RegisterPageContent /></Suspense>;
}
