'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Edit3,
  User,
  Mail,
  Phone,
  Bed,
  CheckCircle2,
  Gift,
  Star,
  Info,
  Clock,
  ShieldCheck,
  Check,
  ArrowRight,
  Ticket,
  Award,
  Sparkles,
  MapPin,
  Calendar,
  Lock,
  MessageSquare,
  Timer
} from 'lucide-react';

export default function CheckoutPage() {
  const [bookingTarget, setBookingTarget] = useState<'self' | 'other'>('self');
  const [guestName, setGuestName] = useState('Nguyễn Minh Anh');
  const [couponCode, setCouponCode] = useState('ANHNIEN250');
  const [isCouponApplied, setIsCouponApplied] = useState(true);
  const [specialRequests, setSpecialRequests] = useState({
    highFloor: true,
    earlyCheckIn: false,
    extraBed: false,
    teaSet: true,
  });
  const [note, setNote] = useState('Mong khách sạn chuẩn bị giúp phòng yên tĩnh, hướng nhìn thẳng Cầu Rồng. Cảm ơn khách sạn!');
  const [agreedTerms, setAgreedTerms] = useState(true);

  const roomPrice = 1250000;
  const nights = 2;
  const subtotal = roomPrice * nights; // 2.500.000
  const discount = isCouponApplied ? 250000 : 0;
  const total = subtotal - discount; // 2.250.000

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f9ff] font-sans antialiased text-[#202B36]">
      <Header />

      <main className="flex-1 w-full bg-[#f7f9ff]">
        
        {/* STEPPER TRACKER BAR */}
        <div className="w-full bg-white shadow-xs border-b border-slate-200/60">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between gap-2 sm:gap-4 max-w-2xl mx-auto">
              
              {/* Step 1: Active */}
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-full bg-[#234e70] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  <Edit3 className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#013758] font-bold uppercase tracking-wider">Bước 1</span>
                  <span className="text-xs sm:text-sm text-[#202B36] font-bold">Thông tin đặt phòng</span>
                </div>
              </div>

              <div className="flex-1 h-[2px] bg-slate-200 mx-2 rounded-full" />

              {/* Step 2: Next */}
              <div className="flex items-center gap-2.5 opacity-60">
                <div className="size-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-[10px] text-slate-500 font-medium">Bước 2</span>
                  <span className="text-xs sm:text-sm text-slate-600 font-medium">Thanh toán</span>
                </div>
              </div>

              <div className="flex-1 h-[2px] bg-slate-200 mx-2 rounded-full" />

              {/* Step 3: Pending */}
              <div className="flex items-center gap-2.5 opacity-60">
                <div className="size-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-[10px] text-slate-500 font-medium">Bước 3</span>
                  <span className="text-xs sm:text-sm text-slate-600 font-medium">Xác nhận đặt phòng</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* MAIN CONTAINER */}
        <div className="max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
          
          {/* Notice Bar / Trust Cue */}
          <div className="mb-6 bg-[#F5EBE5] rounded-xl p-4 flex items-center justify-between flex-wrap gap-3 border border-[#ebd8cc]">
            <div className="flex items-center gap-2.5 text-[#783520]">
              <Timer className="size-5 text-[#934a33] shrink-0 animate-pulse" />
              <span className="text-xs sm:text-sm">
                Phòng được giữ giá tốt nhất trong <strong className="font-bold">19:45</strong> phút tiếp theo. Hoàn tất thông tin để nhận mã giữ chỗ chính thức.
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1 rounded-full text-[#934a33] text-xs font-semibold">
              <ShieldCheck className="size-4" />
              <span>Cam kết bảo lưu suất phòng 100%</span>
            </div>
          </div>

          {/* 2-COLUMN LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* SECTION 1: Booker Contact Info */}
              <Card className="bg-white rounded-xl p-5 sm:p-7 shadow-xs border border-slate-200/80">
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="size-8 rounded-lg bg-[#EAF0F5] text-[#013758] flex items-center justify-center">
                      <User className="size-4" />
                    </span>
                    <h2 className="text-lg font-bold text-[#202B36]">Thông tin người liên hệ / đặt phòng</h2>
                  </div>
                  <Badge className="bg-[#EDF4EE] text-[#35624A] hover:bg-[#EDF4EE] text-xs font-medium px-3 py-0.5 rounded-full border-none">
                    Tài khoản đã xác thực
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs sm:text-sm font-semibold text-[#202B36]">
                      Họ và tên khách hàng
                    </Label>
                    <Input
                      readOnly
                      value="Nguyễn Minh Anh"
                      className="h-11 bg-[#f1f3f9] border-none text-sm font-medium text-[#202B36] cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm font-semibold text-[#202B36]">
                      Địa chỉ Email
                    </Label>
                    <Input
                      readOnly
                      value="minhanh.traveler@gmail.com"
                      className="h-11 bg-[#f1f3f9] border-none text-sm font-medium text-[#202B36] cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm font-semibold text-[#202B36]">
                      Số điện thoại liên lạc
                    </Label>
                    <Input
                      readOnly
                      value="0912 345 678"
                      className="h-11 bg-[#f1f3f9] border-none text-sm font-medium text-[#202B36] cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Booking Target Choices */}
                <div className="py-2 flex flex-col sm:flex-row gap-4 border-t border-slate-100 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="booking_target"
                      checked={bookingTarget === 'self'}
                      onChange={() => setBookingTarget('self')}
                      className="size-4 text-[#013758] focus:ring-[#013758]"
                    />
                    <span className="text-xs sm:text-sm font-medium text-[#202B36]">Tôi đặt phòng cho chính mình</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none opacity-80 hover:opacity-100 transition-opacity">
                    <input
                      type="radio"
                      name="booking_target"
                      checked={bookingTarget === 'other'}
                      onChange={() => setBookingTarget('other')}
                      className="size-4 text-[#013758] focus:ring-[#013758]"
                    />
                    <span className="text-xs sm:text-sm font-medium text-slate-600">Tôi đặt phòng cho người khác</span>
                  </label>
                </div>

                <div className="mt-4 p-3 bg-[#f1f3f9] rounded-lg flex items-start gap-2 text-xs text-slate-600">
                  <Info className="size-4 text-[#013758] shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Thông tin xác nhận đặt phòng, hóa đơn điện tử và mã QR voucher sẽ được gửi bảo mật về email và số điện thoại này ngay sau khi hoàn tất thanh toán.
                  </p>
                </div>
              </Card>

              {/* SECTION 2: Guests & Special Requests */}
              <Card className="bg-white rounded-xl p-5 sm:p-7 shadow-xs border border-slate-200/80">
                <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-slate-100">
                  <span className="size-8 rounded-lg bg-[#EAF0F5] text-[#013758] flex items-center justify-center">
                    <Bed className="size-4" />
                  </span>
                  <h2 className="text-lg font-bold text-[#202B36]">Danh sách khách lưu trú & Yêu cầu đặc biệt</h2>
                </div>

                <div className="mb-5 space-y-1.5">
                  <Label htmlFor="guestName" className="text-xs sm:text-sm font-semibold text-[#202B36]">
                    Tên khách nhận phòng chính (nhận thẻ chìa khóa)
                  </Label>
                  <Input
                    id="guestName"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="h-11 text-sm bg-white border-slate-300 focus-visible:ring-[#013758]"
                  />
                  <span className="text-[11px] text-slate-500 block">
                    Vui lòng cung cấp đúng tên trên CMND/CCCD hoặc Hộ chiếu khi check-in tại quầy lễ tân.
                  </span>
                </div>

                {/* Special Requests Checklist */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs sm:text-sm font-semibold text-[#202B36]">
                      Tùy chọn yêu cầu thêm (Miễn phí):
                    </span>
                    <span className="text-xs text-slate-500">Khách sạn tiếp nhận và phản hồi tức thì</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-start gap-3 p-3 bg-[#f1f3f9] rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                      <Checkbox
                        checked={specialRequests.highFloor}
                        onCheckedChange={(c) => setSpecialRequests({ ...specialRequests, highFloor: !!c })}
                        className="mt-0.5 border-slate-400 data-[state=checked]:bg-[#013758]"
                      />
                      <div>
                        <span className="text-xs sm:text-sm font-semibold text-[#202B36] block">Phòng tầng cao</span>
                        <span className="text-[11px] text-slate-500">Tầng 6 - 8 để ngắm toàn cảnh sông Hàn</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 bg-[#f1f3f9] rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                      <Checkbox
                        checked={specialRequests.earlyCheckIn}
                        onCheckedChange={(c) => setSpecialRequests({ ...specialRequests, earlyCheckIn: !!c })}
                        className="mt-0.5 border-slate-400 data-[state=checked]:bg-[#013758]"
                      />
                      <div>
                        <span className="text-xs sm:text-sm font-semibold text-[#202B36] block">Nhận phòng sớm</span>
                        <span className="text-[11px] text-slate-500">Tùy thuộc tình trạng phòng thực tế</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 bg-[#f1f3f9] rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                      <Checkbox
                        checked={specialRequests.extraBed}
                        onCheckedChange={(c) => setSpecialRequests({ ...specialRequests, extraBed: !!c })}
                        className="mt-0.5 border-slate-400 data-[state=checked]:bg-[#013758]"
                      />
                      <div>
                        <span className="text-xs sm:text-sm font-semibold text-[#202B36] block">Giường phụ hoặc nôi em bé</span>
                        <span className="text-[11px] text-slate-500">Khách sạn chuẩn bị nôi an toàn</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 bg-[#f1f3f9] rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                      <Checkbox
                        checked={specialRequests.teaSet}
                        onCheckedChange={(c) => setSpecialRequests({ ...specialRequests, teaSet: !!c })}
                        className="mt-0.5 border-slate-400 data-[state=checked]:bg-[#013758]"
                      />
                      <div>
                        <span className="text-xs sm:text-sm font-semibold text-[#202B36] block">Set trà chiều Hội An lúc 15:00</span>
                        <span className="text-[11px] text-[#934a33] font-medium">Bao gồm trong đặc quyền StayReco</span>
                      </div>
                    </label>
                  </div>

                  <div className="mt-4 space-y-1">
                    <Label className="text-xs sm:text-sm font-semibold text-[#202B36]">
                      Ghi chú bổ sung cho bộ phận buồng phòng
                    </Label>
                    <textarea
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full p-3 rounded-lg bg-white border border-slate-300 text-sm text-[#202B36] focus:outline-none focus:ring-2 focus:ring-[#013758] resize-none"
                    />
                  </div>
                </div>
              </Card>

              {/* SECTION 3: Loyalty & Voucher */}
              <Card className="bg-white rounded-xl p-5 sm:p-7 shadow-xs border border-slate-200/80">
                <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-slate-100">
                  <span className="size-8 rounded-lg bg-[#F5EBE5] text-[#934a33] flex items-center justify-center">
                    <Gift className="size-4" />
                  </span>
                  <h2 className="text-lg font-bold text-[#202B36]">Ưu đãi & Điểm thưởng thân thiết</h2>
                </div>

                <div className="space-y-2 mb-5">
                  <Label className="text-xs sm:text-sm font-semibold text-[#202B36]">
                    Mã giảm giá StayReco / Voucher đối tác
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="h-11 pl-4 pr-10 bg-white border-slate-300 text-sm font-bold uppercase tracking-wider text-[#202B36]"
                      />
                      {isCouponApplied && (
                        <CheckCircle2 className="size-5 text-[#35624A] absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                    <Button
                      type="button"
                      onClick={() => setIsCouponApplied(true)}
                      className="h-11 px-5 bg-slate-200 hover:bg-slate-300 text-[#202B36] font-semibold text-xs sm:text-sm"
                    >
                      Áp dụng lại
                    </Button>
                  </div>

                  {isCouponApplied && (
                    <div className="flex items-center gap-2 p-2.5 px-3 bg-[#EDF4EE] rounded-lg text-[#35624A] text-xs font-medium w-fit mt-2">
                      <Sparkles className="size-4 shrink-0" />
                      <span>Đã áp dụng thành công mã ANHNIEN250: Giảm 250.000 ₫ cho đơn từ 2.000.000 ₫</span>
                    </div>
                  )}
                </div>

                {/* Rewards Box */}
                <div className="bg-[#f1f3f9] rounded-xl p-4 flex items-center gap-4">
                  <div className="size-11 rounded-full bg-[#234e70] text-white flex items-center justify-center shrink-0">
                    <Award className="size-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-[#013758]">Hội viên StayReco Elite</span>
                      <span className="px-2 py-0.5 bg-[#EAF0F5] text-[#013758] rounded text-[10px] font-bold">Cấp Bạc</span>
                    </div>
                    <p className="text-xs text-[#202B36] mt-0.5">
                      Bạn sẽ tích luỹ được <span className="font-bold text-[#013758]">+225 điểm StayReco</span> sau khi hoàn thành kỳ nghỉ này (tương đương 45.000 ₫ cho lần đặt tiếp theo).
                    </p>
                  </div>
                </div>
              </Card>

              {/* SECTION 4: Cancellation Policy & Consent */}
              <Card className="bg-white rounded-xl p-5 sm:p-7 shadow-xs border border-slate-200/80">
                <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-slate-100">
                  <span className="size-8 rounded-lg bg-[#EDF4EE] text-[#35624A] flex items-center justify-center">
                    <ShieldCheck className="size-4" />
                  </span>
                  <h2 className="text-lg font-bold text-[#202B36]">Chính sách hủy phòng & Điều khoản minh bạch</h2>
                </div>

                <div className="bg-[#EDF4EE]/70 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-2 mb-1">
                    <CheckCircle2 className="size-5 text-[#35624A] shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm font-semibold text-[#202B36]">
                      Miễn phí hủy phòng trước 14:00 ngày 18/10/2026 (Giờ địa phương Đà Nẵng).
                    </p>
                  </div>
                  <p className="text-xs text-slate-600 pl-7 leading-relaxed">
                    Sau 14:00 ngày 18/10/2026 hoặc không đến nhận phòng: Phí hủy là 100% giá trị đêm đầu tiên (1.250.000 ₫).
                  </p>
                </div>

                <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#f1f3f9] transition-colors cursor-pointer">
                  <Checkbox
                    checked={agreedTerms}
                    onCheckedChange={(c) => setAgreedTerms(!!c)}
                    className="mt-0.5 border-slate-400 data-[state=checked]:bg-[#013758]"
                  />
                  <span className="text-xs sm:text-sm text-[#202B36] leading-relaxed">
                    Tôi đã đọc và đồng ý với <Link href="#" className="text-[#013758] underline font-semibold">Quy định lưu trú của An Nhiên Riverside Hotel</Link> và <Link href="#" className="text-[#013758] underline font-semibold">Điều khoản dịch vụ của StayReco</Link>.
                  </span>
                </label>
              </Card>

            </div>

            {/* RIGHT COLUMN (4 cols sticky sidebar) */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
              
              <Card className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200/80">
                <div className="p-5 bg-[#f1f3f9] border-b border-slate-200/60">
                  <h3 className="text-base font-bold text-[#202B36] tracking-tight">Tóm tắt chuyến đi của bạn</h3>
                  <span className="text-xs text-slate-500">Đảm bảo mức giá cam kết không phụ phí ẩn</span>
                </div>

                <div className="p-5 space-y-4">
                  
                  {/* Hotel Header */}
                  <div className="flex gap-3 items-start">
                    <div className="relative size-20 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                      <Image
                        src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80"
                        alt="An Nhiên Riverside Hotel"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-semibold text-[#934a33]">Khách sạn Boutique</span>
                        <div className="flex text-amber-400">
                          {[...Array(4)].map((_, i) => (
                            <Star key={i} className="size-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-[#202B36] truncate">An Nhiên Riverside Hotel</h4>
                      <p className="text-xs text-slate-500 truncate">Bạch Đằng, Q. Hải Châu, Đà Nẵng</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="px-1.5 py-0.5 bg-[#EAF0F5] text-[#013758] font-bold text-[10px] rounded">
                          9.4/10
                        </span>
                        <span className="text-xs text-slate-500">(312 đánh giá)</span>
                      </div>
                    </div>
                  </div>

                  {/* Room Highlight */}
                  <div className="p-3 bg-[#f1f3f9] rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-[#202B36]">
                      <span>Phòng Deluxe River View</span>
                      <span className="text-[#013758]">Tầng 7</span>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      28 m² • 1 Giường King cỡ lớn • Ban công hướng trực diện sông Hàn & Cầu Rồng
                    </p>
                    <div className="pt-1.5 flex items-center gap-1 text-[#35624A] font-semibold text-[11px]">
                      <span>🍴</span>
                      <span>Bao gồm buffet sáng hữu cơ & Miễn phí hủy</span>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-[#f1f3f9] text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Nhận phòng</span>
                      <span className="font-bold text-[#202B36] block">14:00, Thứ Ba</span>
                      <span className="text-slate-600 block">20/10/2026</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Trả phòng</span>
                      <span className="font-bold text-[#202B36] block">12:00, Thứ Năm</span>
                      <span className="text-slate-600 block">22/10/2026</span>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-slate-200/60 text-slate-600 text-xs flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-[#013758]" />
                      <span>Tổng thời gian: <strong>2 đêm</strong> • 2 người lớn • 1 phòng</span>
                    </div>
                  </div>

                  {/* Price Breakdown Table */}
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="flex justify-between text-[#202B36]">
                      <span>Giá phòng ({nights} đêm × 1.250.000 ₫)</span>
                      <span className="font-medium">{subtotal.toLocaleString('vi-VN')} ₫</span>
                    </div>
                    {isCouponApplied && (
                      <div className="flex justify-between text-[#35624A] font-semibold">
                        <span>Mã ưu đãi (ANHNIEN250)</span>
                        <span>-{discount.toLocaleString('vi-VN')} ₫</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Thuế GTGT (8%) & Phí dịch vụ (5%)</span>
                      <span className="text-[#35624A] font-semibold">Đã bao gồm</span>
                    </div>

                    <div className="w-full h-[1px] bg-slate-200 my-2" />

                    <div className="flex items-baseline justify-between pt-1">
                      <div>
                        <span className="block text-xs font-bold text-[#202B36]">TỔNG TIỀN THANH TOÁN</span>
                        <span className="text-[11px] text-[#35624A] font-medium">Tiết kiệm được 250.000 ₫</span>
                      </div>
                      <span className="text-2xl font-bold text-[#013758]">{total.toLocaleString('vi-VN')} ₫</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Link href="/payment" className="block pt-2">
                    <Button
                      disabled={!agreedTerms}
                      className="w-full h-12 bg-[#234e70] hover:bg-[#193B56] text-white font-bold text-sm rounded-lg shadow-md gap-2 transition-all active:scale-[0.99]"
                    >
                      <span>Tiếp tục thanh toán qua VNPay</span>
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>

                  {/* Security Assurances */}
                  <div className="space-y-1 pt-1 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Lock className="size-3.5 text-[#35624A] shrink-0" />
                      <span>Thanh toán an toàn với mã hóa SSL 256-bit qua VNPay Gateway</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Info className="size-3.5 text-[#013758] shrink-0" />
                      <span>Không trừ tiền ngay nếu chưa xác nhận phương thức ở bước 2</span>
                    </div>
                  </div>

                  {/* Concierge Widget */}
                  <div className="p-3 bg-[#F5EBE5] rounded-xl flex items-center gap-3">
                    <div className="relative size-10 rounded-full overflow-hidden shrink-0 bg-slate-300">
                      <Image
                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80"
                        alt="Minh Anh Concierge"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-[#202B36] truncate">Minh Anh • Trợ lý StayReco</span>
                        <span className="size-2 rounded-full bg-[#35624A] shrink-0" />
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">Sẵn sàng hỗ trợ bạn hoàn tất đặt phòng</p>
                    </div>
                    <button type="button" className="size-8 rounded-full bg-white text-[#934a33] flex items-center justify-center shadow-xs hover:bg-slate-50">
                      <MessageSquare className="size-4" />
                    </button>
                  </div>

                </div>
              </Card>

              {/* Extra Guarantee */}
              <Card className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-xs border border-slate-200/80">
                <ShieldCheck className="size-7 text-[#934a33] shrink-0" />
                <div>
                  <h5 className="text-xs font-bold text-[#202B36]">Bảo lãnh đặt phòng StayReco Protect</h5>
                  <p className="text-[11px] text-slate-500">Hoàn tiền 100% nếu phòng không đúng mô tả thực tế.</p>
                </div>
              </Card>

            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
