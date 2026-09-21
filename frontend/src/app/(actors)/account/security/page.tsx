'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppBreadcrumb from '@/components/common/breadcrumb/AppBreadcrumb';
import AccountSubNav from '@/features/account/AccountSubNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  Check,
  Smartphone,
  Laptop,
  Mail,
  Phone,
  AlertTriangle,
  LogOut,
  Download,
  KeyRound,
  ShieldAlert
} from 'lucide-react';

export default function SecurityPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Validation rules
  const hasMinLength = newPassword.length >= 8;
  const hasUpperAndNum = /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const strengthScore = [hasMinLength, hasUpperAndNum, hasSpecial, isMatch].filter(Boolean).length;

  const getStrengthLabel = () => {
    if (!newPassword) return 'Chưa nhập';
    if (strengthScore <= 1) return 'Yếu';
    if (strengthScore === 2) return 'Trung bình';
    if (strengthScore === 3) return 'Khá';
    return 'Rất mạnh';
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatch) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }
    setToastMessage('Mật khẩu của bạn đã được cập nhật thành công!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased text-foreground">
      <Header />

      <main className="flex-1 w-full bg-[#f7f9ff]">
        
        {/* Account Sub-navigation */}
        <AccountSubNav activeTab="security" />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          {/* Breadcrumbs */}
          <AppBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Tài khoản', href: '/account/profile' },
              { label: 'Mật khẩu & bảo mật', active: true },
            ]}
          />

          {/* Editorial Banner */}
          <Card className="p-6 sm:p-8 bg-white border border-border shadow-xs rounded-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-100 text-[#934a33] text-[11px] font-semibold">
                  <ShieldCheck className="size-3.5" /> Bảo mật cấp độ cao cho đặt phòng
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  Mật khẩu & Bảo mật
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Bảo vệ tài khoản và đơn đặt phòng nghỉ dưỡng của bạn với các tiêu chuẩn an toàn cao nhất.
                </p>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-border shrink-0">
                <div className="size-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Trạng thái bảo mật</span>
                  <span className="text-xs font-bold text-emerald-600">Được bảo vệ tối đa</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Security Sections Stack */}
          <div className="space-y-6">
            
            {/* CARD 1: Change Password */}
            <Card className="p-6 sm:p-8 bg-white border border-border shadow-xs rounded-2xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <KeyRound className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-foreground">Đổi mật khẩu</h2>
                    <p className="text-xs text-muted-foreground">Cập nhật mật khẩu định kỳ để nâng cao tính an toàn</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="currentPassword" className="text-xs sm:text-sm font-semibold">
                      Mật khẩu hiện tại <span className="text-red-500">*</span>
                    </Label>
                    <Link href="/forgot-password" className="text-xs text-primary hover:underline font-semibold">
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Nhập mật khẩu bạn đang dùng"
                      className="h-11 text-sm focus-visible:ring-primary pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* New & Confirm */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="newPassword" className="text-xs sm:text-sm font-semibold">
                      Mật khẩu mới <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Tối thiểu 8 ký tự"
                        className="h-11 text-sm focus-visible:ring-primary pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-xs sm:text-sm font-semibold">
                      Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới"
                        className="h-11 text-sm focus-visible:ring-primary pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Strength Meter */}
                <div className="p-4 bg-slate-50 rounded-xl space-y-3 border border-border">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-muted-foreground">Độ mạnh mật khẩu:</span>
                    <span className="text-foreground">{getStrengthLabel()}</span>
                  </div>

                  <div className="flex gap-1.5 h-1.5 w-full">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-full flex-1 rounded-full transition-colors ${
                          step <= strengthScore
                            ? strengthScore <= 2
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 font-semibold' : 'text-muted-foreground'}`}>
                      <Check className="size-3.5" /> Tối thiểu 8 ký tự
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasUpperAndNum ? 'text-emerald-600 font-semibold' : 'text-muted-foreground'}`}>
                      <Check className="size-3.5" /> Chữ hoa (A-Z) & chữ số (0-9)
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-600 font-semibold' : 'text-muted-foreground'}`}>
                      <Check className="size-3.5" /> Ký tự đặc biệt (!@#$%)
                    </div>
                    <div className={`flex items-center gap-1.5 ${isMatch ? 'text-emerald-600 font-semibold' : 'text-muted-foreground'}`}>
                      <Check className="size-3.5" /> Khớp với mật khẩu mới
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    className="h-11 px-8 bg-primary text-primary-foreground hover:bg-[#193b56] font-bold text-xs sm:text-sm gap-2 shadow-sm"
                  >
                    <CheckCircle2 className="size-4" /> Cập nhật mật khẩu mới
                  </Button>
                </div>
              </form>
            </Card>

            {/* CARD 2: Auth Methods */}
            <Card className="p-6 sm:p-8 bg-white border border-border shadow-xs rounded-2xl space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="size-9 rounded-lg bg-orange-100 text-[#934a33] flex items-center justify-center font-bold">
                  <Smartphone className="size-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground">Trạng thái xác thực & Phương thức bảo mật</h2>
                  <p className="text-xs text-muted-foreground">Dùng nhận mã OTP đặt phòng và cảnh báo đăng nhập</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-border gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-white text-primary flex items-center justify-center shrink-0 shadow-xs">
                      <Mail className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-foreground">minhanh.nguyen@email.vn</span>
                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 text-[10px]">
                          Đã xác minh
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Địa chỉ nhận E-Voucher và hóa đơn VAT</p>
                    </div>
                  </div>
                  <Button variant="outline" className="h-9 text-xs font-semibold shrink-0">
                    Đổi email
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-border gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-white text-primary flex items-center justify-center shrink-0 shadow-xs">
                      <Phone className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-foreground">+84 0912 345 678</span>
                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 text-[10px]">
                          Đã xác minh OTP
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">SĐT nhận mã xác nhận SMS</p>
                    </div>
                  </div>
                  <Button variant="outline" className="h-9 text-xs font-semibold shrink-0">
                    Cập nhật SĐT
                  </Button>
                </div>
              </div>
            </Card>

            {/* CARD 3: Active Sessions */}
            <Card className="p-6 sm:p-8 bg-white border border-border shadow-xs rounded-2xl space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="size-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                  <Laptop className="size-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground">Phiên đăng nhập & Thiết bị hoạt động</h2>
                  <p className="text-xs text-muted-foreground">Quản lý thiết bị đang truy cập tài khoản</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-border space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Laptop className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-foreground">Chrome trên macOS</h4>
                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 text-[10px]">
                          Phiên hiện tại
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Đà Nẵng, Việt Nam • IP: 118.69.192.83
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <Smartphone className="size-4 text-muted-foreground" />
                    <span>StayReco iOS App • iPhone 15 Pro (Hội An, 3 ngày trước)</span>
                  </div>
                  <Button variant="ghost" className="h-7 text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50">
                    Đăng xuất
                  </Button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" className="h-10 text-xs font-semibold text-red-600 border-red-200 hover:bg-red-50 gap-2">
                  <LogOut className="size-4" /> Đăng xuất khỏi tất cả thiết bị khác
                </Button>
              </div>
            </Card>

          </div>

        </div>
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
          <div>
            <h4 className="text-xs sm:text-sm font-bold">Cập nhật thành công!</h4>
            <p className="text-[11px] text-white/80">{toastMessage}</p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
