'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppBreadcrumb from '@/common/breadcrumb/AppBreadcrumb';
import AccountSubNav from '@/components/account/AccountSubNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  User,
  ShieldCheck,
  CheckCircle2,
  Camera,
  Trash2,
  Save,
  RotateCcw,
  ArrowRight,
  Sparkles,
  Lock,
  Phone,
  Mail,
  Calendar,
  Home,
  CreditCard,
  Gift,
  Headset,
  Check
} from 'lucide-react';

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    fullName: 'Nguyễn Minh Anh',
    email: 'minhanh.nguyen@email.vn',
    phone: '+84 0912 345 678',
    birthDate: '18/08/1995',
    gender: 'female',
    address: 'Quận Hải Châu, TP. Đà Nẵng',
    idNumber: '04819500xxxx',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage('Thông tin hồ sơ cá nhân đã được đồng bộ an toàn!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased text-foreground">
      <Header />

      <main className="flex-1 w-full bg-[#f7f9ff]">
        
        {/* Account Sub-navigation */}
        <AccountSubNav activeTab="profile" />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          {/* Breadcrumbs */}
          <AppBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Tài khoản', href: '/account/profile' },
              { label: 'Hồ sơ cá nhân', active: true },
            ]}
          />

          {/* Page Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-[#934a33] text-[11px] font-semibold uppercase tracking-wider">
                Tài khoản cá nhân
              </span>
              <span className="text-xs text-muted-foreground">• Đã xác minh danh tính</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Hồ sơ cá nhân</h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Quản lý thông tin định danh và liên lạc để nhận xác nhận đặt phòng và dịch vụ lưu trú chu đáo nhất từ StayReco.
            </p>
          </div>

          {/* Membership Banner */}
          <div className="w-full rounded-2xl bg-gradient-to-r from-[#124b6d] via-[#193b56] to-[#ae583c] p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md relative overflow-hidden">
            <div className="flex items-center gap-4 z-10">
              <div className="size-12 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-amber-300">
                <Sparkles className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">StayReco Elite Bạc</h3>
                  <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                    Cấp 2/4
                  </span>
                </div>
                <p className="text-xs text-white/80 mt-0.5">
                  Mã hội viên: <span className="font-mono font-bold text-white">SR-99482</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 z-10 w-full md:w-auto justify-between md:justify-end">
              <div className="text-left md:text-right">
                <span className="text-[11px] text-white/70 block">Điểm tích lũy hiện tại</span>
                <span className="text-sm font-bold text-white">2.450 Điểm StayMiles</span>
              </div>
              <Link href="/account/rewards">
                <Button className="h-9 px-4 bg-white text-primary hover:bg-slate-100 font-semibold text-xs shrink-0">
                  Đổi quà
                </Button>
              </Link>
            </div>
          </div>

          {/* Main Card */}
          <Card className="p-6 sm:p-8 bg-white border border-border shadow-xs rounded-2xl space-y-8">
            
            {/* Avatar Module */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-5 rounded-xl bg-slate-50 border border-border">
              <div className="relative shrink-0">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBdlMA-ifD0Y3DpGGrzoeXCxc22mKVS31RDqViBrMVQ8k2eirKGhRyxx1asXqfgwBKXejp6XusmcLoC06oceCmP8tXgZpTJLRty_8jUucLiD7I4wgZiRUTW5jZSIcaNRfF-X5uJYThpums1vDU5iHxgrMW2YNbO2AaQkQfak79iPadU5lYrOAyE_zBijHFLDWuH5QkT1ODpnfONYH8YaFQiCWWEiLR_kkfQFGvPbzsvNY2cNbdFaElr"
                  alt="Avatar"
                  width={80}
                  height={80}
                  className="rounded-full object-cover size-20 shadow-xs"
                />
                <span className="absolute -bottom-1 -right-1 bg-emerald-100 text-emerald-700 p-1 rounded-full border border-white">
                  <CheckCircle2 className="size-3.5" />
                </span>
              </div>

              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-foreground">Nguyễn Minh Anh</h2>
                  <Badge className="bg-orange-50 text-[#934a33] border border-orange-200 hover:bg-orange-50 text-[10px] gap-1 font-bold">
                    <Sparkles className="size-3" /> StayReco Elite Bạc
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Hỗ trợ JPG, PNG hoặc WebP (tối đa 5MB). Ảnh rõ nét giúp lễ tân nhận diện khi làm thủ tục ưu tiên.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <Button variant="outline" className="h-8 text-xs font-semibold gap-1.5">
                    <Camera className="size-3.5" /> Thay đổi ảnh
                  </Button>
                  <Button variant="ghost" className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50">
                    Gỡ ảnh
                  </Button>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Full Name */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="fullName" className="text-xs sm:text-sm font-semibold">
                      Họ và tên đầy đủ <span className="text-red-500">*</span>
                    </Label>
                    <span className="text-[11px] text-muted-foreground">Khớp giấy tờ tùy thân</span>
                  </div>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="h-11 text-sm focus-visible:ring-primary font-medium"
                    required
                  />
                  <span className="text-[11px] text-muted-foreground block">
                    Vui lòng nhập đúng như trên CMND/CCCD/Hộ chiếu để nhận phòng thuận lợi.
                  </span>
                </div>

                {/* Account Role */}
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-semibold">Vai trò tài khoản</Label>
                  <div className="h-11 px-3 bg-slate-100 rounded-lg flex items-center justify-between text-xs font-semibold text-foreground border border-border">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-primary" /> Khách hàng (Customer)
                    </span>
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Đã xác thực
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground block">
                    Cấp phép truy cập tiêu chuẩn dành cho người lưu trú cá nhân.
                  </span>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="email" className="text-xs sm:text-sm font-semibold">
                      Email liên hệ <span className="text-red-500">*</span>
                    </Label>
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                      Đã xác thực
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-11 text-sm focus-visible:ring-primary font-medium pr-10"
                      required
                    />
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-emerald-600" />
                  </div>
                  <span className="text-[11px] text-muted-foreground block">
                    Dùng để nhận mã E-Voucher phòng, hành trình và hóa đơn VAT.
                  </span>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="phone" className="text-xs sm:text-sm font-semibold">
                      Số điện thoại <span className="text-red-500">*</span>
                    </Label>
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                      Đã xác thực OTP
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-11 text-sm focus-visible:ring-primary font-medium pr-10"
                      required
                    />
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-emerald-600" />
                  </div>
                  <span className="text-[11px] text-muted-foreground block">
                    Khách sạn sẽ liên lạc khi cần hỗ trợ đưa đón hoặc nhận phòng sớm.
                  </span>
                </div>

                {/* BirthDate */}
                <div className="space-y-1.5">
                  <Label htmlFor="birthDate" className="text-xs sm:text-sm font-semibold">
                    Ngày sinh
                  </Label>
                  <div className="relative">
                    <Input
                      id="birthDate"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="h-11 text-sm focus-visible:ring-primary font-medium pr-10"
                      placeholder="DD/MM/YYYY"
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  </div>
                  <span className="text-[11px] text-muted-foreground block">
                    Dùng để nhận quà sinh nhật và ưu đãi đặc quyền thường niên.
                  </span>
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-semibold">Giới tính</Label>
                  <div className="h-11 px-3 bg-slate-50 rounded-lg flex items-center justify-around text-xs font-semibold text-foreground border border-border">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={formData.gender === 'male'}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="accent-primary"
                      />
                      <span>Nam</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={formData.gender === 'female'}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="accent-primary"
                      />
                      <span>Nữ</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="other"
                        checked={formData.gender === 'other'}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="accent-primary"
                      />
                      <span>Khác</span>
                    </label>
                  </div>
                  <span className="text-[11px] text-muted-foreground block">
                    Giúp khách sạn chuẩn bị bộ tiện ích phòng phù hợp.
                  </span>
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-xs sm:text-sm font-semibold">
                    Địa chỉ thường trú / Thành phố
                  </Label>
                  <div className="relative">
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="h-11 text-sm focus-visible:ring-primary font-medium pr-10"
                    />
                    <Home className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  </div>
                  <span className="text-[11px] text-muted-foreground block">
                    Dùng đối soát chứng từ cư trú và gợi ý hành trình phù hợp.
                  </span>
                </div>

                {/* ID Number */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="idNumber" className="text-xs sm:text-sm font-semibold">
                      Số CCCD / Hộ chiếu
                    </Label>
                    <span className="text-[11px] text-muted-foreground">Tùy chọn</span>
                  </div>
                  <div className="relative">
                    <Input
                      id="idNumber"
                      value={formData.idNumber}
                      onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                      className="h-11 text-sm focus-visible:ring-primary font-mono pr-10"
                    />
                    <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  </div>
                  <span className="text-[11px] text-muted-foreground block">
                    Giúp rút ngắn thời gian check-in không chạm tại quầy lễ tân.
                  </span>
                </div>

              </div>

              {/* Trust Box */}
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex items-start gap-3 text-xs">
                <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="font-bold text-foreground">Quyền riêng tư & Bảo vệ dữ liệu cá nhân</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Thông tin định danh của bạn được mã hóa chuẩn 256-bit SSL quân sự và tuân thủ tiêu chuẩn PCI-DSS.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    type="submit"
                    className="h-11 px-8 bg-primary text-primary-foreground hover:bg-[#193b56] font-bold text-xs sm:text-sm gap-2 shadow-sm"
                  >
                    <Save className="size-4" /> <span>Lưu thay đổi</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setToastMessage('Đã đặt lại dữ liệu ban đầu')}
                    className="h-11 px-5 text-xs sm:text-sm font-semibold"
                  >
                    Hủy thay đổi / Đặt lại
                  </Button>
                </div>

                <Link href="/account/security" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                  Chuyển sang Đổi mật khẩu & Bảo mật <ArrowRight className="size-3.5" />
                </Link>
              </div>

            </form>
          </Card>

          {/* Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-white border border-border shadow-xs rounded-xl flex items-center gap-3">
              <div className="size-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Chuyến đi đã hoàn tất</span>
                <span className="text-xs sm:text-sm font-bold text-foreground">8 Kỳ nghỉ thành công</span>
              </div>
            </Card>

            <Card className="p-4 bg-white border border-border shadow-xs rounded-xl flex items-center gap-3">
              <div className="size-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Gift className="size-5" />
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">E-Voucher khả dụng</span>
                <span className="text-xs sm:text-sm font-bold text-foreground">3 Phiếu ưu đãi 15%</span>
              </div>
            </Card>

            <Card className="p-4 bg-white border border-border shadow-xs rounded-xl flex items-center gap-3">
              <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Headset className="size-5" />
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Chăm sóc khách hàng</span>
                <span className="text-xs sm:text-sm font-bold text-foreground">Trợ lý riêng 24/7</span>
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
