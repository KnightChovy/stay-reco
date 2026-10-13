'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Printer,
  Mail,
  Download,
  Copy,
  Star,
  MapPin,
  Phone,
  Calendar,
  User,
  Bed,
  Sparkles,
  ShieldCheck,
  Headset,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  Award
} from 'lucide-react';

export default function BookingConfirmationPage() {
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const bookingCode = 'SR-261020-0842';
  const pinCode = '8492';
  const transactionId = 'VNP142981023';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(bookingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = () => {
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  };

  return (
    <div className="max-w-marketplace mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-12 w-full">
          
          {/* HERO SUCCESS CARD */}
          <Card className="bg-white rounded-xl p-6 sm:p-8 shadow-xs mb-8 relative overflow-hidden border border-slate-200/80">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <Badge className="bg-[#EDF4EE] text-[#35624A] hover:bg-[#EDF4EE] font-semibold px-3 py-1 rounded-full border-none gap-1">
                    <CheckCircle2 className="size-3.5" /> Thanh toán thành công qua VNPay Gateway
                  </Badge>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                    Mã giao dịch: {transactionId}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#202B36] tracking-tight">
                  Đặt phòng đã được xác nhận thành công!
                </h1>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Mã đặt phòng của bạn là <strong className="text-[#013758] font-bold">{bookingCode}</strong>. Chúng tôi đã gửi email xác nhận cùng voucher điện tử đến hòm thư <span className="font-semibold text-[#202B36] underline decoration-[#013758]/40">minhanh.traveler@gmail.com</span>.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="h-11 px-4 text-xs font-semibold gap-2 border-slate-300 hover:bg-slate-50"
                >
                  <Printer className="size-4 text-slate-500" />
                  <span>In xác nhận</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSendEmail}
                  className="h-11 px-4 text-xs font-semibold gap-2 border-slate-300 hover:bg-slate-50"
                >
                  <Mail className="size-4 text-slate-500" />
                  <span>{emailSent ? 'Đã gửi lại!' : 'Gửi vào Email'}</span>
                </Button>
                <Button className="h-11 px-5 bg-[#234e70] hover:bg-[#193B56] text-white text-xs font-bold gap-2 shadow-xs">
                  <Download className="size-4" />
                  <span>Tải voucher PDF</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* MAIN SPLIT LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN (8 cols) */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* E-VOUCHER TICKET CARD */}
              <Card className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-200/80">
                <div className="h-2 w-full bg-linear-to-r from-[#013758] via-[#234e70] to-[#934a33]" />

                <div className="p-6 sm:p-8 space-y-6">
                  
                  {/* Pass Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 bg-[#f1f3f9]/70 p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Image
                        src="/images/logo_stayreco.png"
                        alt="StayReco"
                        width={110}
                        height={36}
                        className="h-9 w-auto object-contain"
                      />
                      <div className="h-6 w-px bg-slate-300 hidden sm:block" />
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide block">Giấy chứng nhận lưu trú điện tử</span>
                        <span className="text-xs font-bold text-[#013758]">Official E-Voucher Pass</span>
                      </div>
                    </div>

                    <Badge className="bg-[#EDF4EE] text-[#35624A] hover:bg-[#EDF4EE] text-xs font-bold px-3 py-1 rounded-full border-none gap-1.5 self-start sm:self-auto">
                      <span className="size-2 rounded-full bg-[#35624A] animate-pulse" />
                      Đã xác nhận & Đã thanh toán
                    </Badge>
                  </div>

                  {/* Fast Check-in Express & QR Box */}
                  <div className="bg-[#f7f9ff] p-5 sm:p-6 rounded-xl border border-slate-100 flex flex-col md:flex-row items-center gap-6">
                    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-xs shrink-0 border border-slate-200/60">
                      <div className="relative size-36 bg-white p-2 rounded-md flex items-center justify-center">
                        <Image
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=STAYRECO_VOUCHER_${bookingCode}`}
                          alt="Mã QR Voucher"
                          width={140}
                          height={140}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium mt-1">Mã check-in tự động</span>
                    </div>

                    <div className="space-y-3 text-center md:text-left flex-1">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EAF0F5] text-[#013758]">
                          Fast Check-in Express
                        </span>
                        <span className="text-xs text-slate-500">Xuất trình tại quầy Lễ tân</span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="bg-white px-4 py-2 rounded-lg shadow-xs flex items-center gap-2 border border-slate-200/60">
                          <span className="text-xs text-slate-500 uppercase">Mã nhận phòng:</span>
                          <span className="text-lg font-bold text-[#013758] tracking-wide">{bookingCode}</span>
                          <button
                            type="button"
                            onClick={handleCopyCode}
                            className="p-1 text-slate-400 hover:text-[#013758] transition-colors"
                            title="Sao chép mã"
                          >
                            <Copy className="size-4" />
                          </button>
                        </div>

                        <div className="bg-white px-4 py-2 rounded-lg shadow-xs flex items-center gap-2 border border-slate-200/60">
                          <span className="text-xs text-slate-500 uppercase">Mã PIN:</span>
                          <span className="text-lg font-bold text-[#934a33] tracking-widest">{pinCode}</span>
                        </div>
                      </div>

                      {copied && <p className="text-xs text-[#35624A] font-semibold">Đã sao chép mã đặt phòng!</p>}
                      <p className="text-xs text-slate-500">
                        Quét mã QR trực tiếp hoặc cung cấp Mã nhận phòng cùng CCCD chính chủ khi làm thủ tục nhận phòng.
                      </p>
                    </div>
                  </div>

                  {/* Hotel Info Banner */}
                  <div className="flex flex-col sm:flex-row gap-4 p-5 rounded-xl bg-[#f1f3f9]">
                    <div className="relative w-full sm:w-48 h-36 rounded-lg overflow-hidden shrink-0 shadow-xs">
                      <Image
                        src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80"
                        alt="An Nhiên Riverside Hotel"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col justify-between flex-1 space-y-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-[#F5EBE5] text-[#934a33] font-semibold">Boutique 4 Sao</span>
                          <div className="flex items-center text-amber-500 text-xs font-bold">
                            <Star className="size-3.5 fill-amber-400 text-amber-400" />
                            <span className="ml-1 text-[#202B36]">4.8</span>
                            <span className="text-slate-500 text-[11px] font-normal ml-1">(524 đánh giá xác thực)</span>
                          </div>
                        </div>
                        <h2 className="text-lg font-bold text-[#202B36] mt-1">An Nhiên Riverside Hotel</h2>
                        <p className="text-xs text-slate-500 flex items-start gap-1 mt-0.5">
                          <MapPin className="size-3.5 text-[#934a33] shrink-0 mt-0.5" />
                          <span>128 Đường Bạch Đằng, Phường Hải Châu 1, Quận Hải Châu, TP. Đà Nẵng</span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                        <span className="flex items-center gap-1.5"><Phone className="size-3.5 text-[#013758]" /> Hotline: <strong className="text-[#202B36]">0236 3888 999</strong></span>
                        <span className="flex items-center gap-1.5"><Mail className="size-3.5 text-[#013758]" /> reservation@annhienriverside.vn</span>
                      </div>
                    </div>
                  </div>

                  {/* Dates Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#f7f9ff] p-4 rounded-xl flex items-center gap-4 border border-slate-100">
                      <div className="size-11 rounded-xl bg-[#EAF0F5] text-[#013758] flex items-center justify-center shrink-0 font-bold">
                        <Calendar className="size-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nhận phòng (Check-in)</span>
                        <span className="text-base font-bold text-[#202B36]">14:00 • Thứ Ba</span>
                        <span className="text-xs text-slate-500 block">20 Tháng 10, 2026</span>
                      </div>
                    </div>

                    <div className="bg-[#f7f9ff] p-4 rounded-xl flex items-center gap-4 border border-slate-100">
                      <div className="size-11 rounded-xl bg-[#F5EBE5] text-[#934a33] flex items-center justify-center shrink-0 font-bold">
                        <Calendar className="size-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Trả phòng (Check-out)</span>
                        <span className="text-base font-bold text-[#202B36]">12:00 • Thứ Năm</span>
                        <span className="text-xs text-slate-500 block">22 Tháng 10, 2026 (2 đêm)</span>
                      </div>
                    </div>
                  </div>

                  {/* Room Spec Details */}
                  <div className="p-5 rounded-xl bg-[#f1f3f9] space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/60">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Thông tin phòng nghỉ</span>
                        <h3 className="text-base font-bold text-[#202B36]">Phòng Deluxe River View</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-[#EAF0F5] text-[#013758] hover:bg-[#EAF0F5] text-xs font-semibold px-3 py-1 border-none">
                          Tầng 6 • Phòng #608
                        </Badge>
                        <Badge className="bg-[#F5EBE5] text-[#934a33] hover:bg-[#F5EBE5] text-xs font-semibold px-3 py-1 border-none">
                          Tầm nhìn Cầu Rồng
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <User className="size-4 text-[#013758]" />
                        <span>Khách lưu trú chính: <strong className="text-[#202B36]">Nguyễn Minh Anh</strong> (2 người lớn)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bed className="size-4 text-[#013758]" />
                        <span>Cấu hình: <strong className="text-[#202B36]">1 Giường King lớn</strong> (Ban công kính)</span>
                      </div>
                    </div>

                    {/* Inclusive Perks */}
                    <div className="p-4 bg-white rounded-xl space-y-2 border border-slate-100">
                      <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wide block">Đặc quyền & Dịch vụ bao gồm trong gói</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-[#202B36]">
                        <div className="flex items-center gap-2 text-[#35624A]">
                          <CheckCircle2 className="size-4 shrink-0" />
                          <span className="text-[#202B36]">2 suất buffet sáng hữu cơ mỗi ngày</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#35624A]">
                          <CheckCircle2 className="size-4 shrink-0" />
                          <span className="text-[#202B36]">Miễn phí hồ bơi vô cực ngắm pháo hoa</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#35624A]">
                          <CheckCircle2 className="size-4 shrink-0" />
                          <span className="text-[#202B36]">Set trà chiều Hội An tại Lounge</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#35624A]">
                          <CheckCircle2 className="size-4 shrink-0" />
                          <span className="text-[#202B36]">Đón tiễn sân bay Đà Nẵng miễn phí</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </Card>

            </div>

            {/* RIGHT COLUMN: Payment Details Sticky Sidebar (4 cols) */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
              
              <Card className="bg-white rounded-2xl p-6 shadow-md border border-slate-200/80 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-[#202B36]">Chi tiết thanh toán</h3>
                  <Badge className="bg-[#EDF4EE] text-[#35624A] text-xs font-bold px-2.5 py-0.5 border-none">
                    Đã thanh toán đủ
                  </Badge>
                </div>

                <div className="space-y-2.5 text-xs text-slate-600 pb-3 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <span>Cổng thanh toán</span>
                    <span className="font-semibold text-[#202B36] flex items-center gap-1">
                      <span className="size-2 rounded-full bg-[#013758]" />
                      VNPay Gateway
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Mã giao dịch</span>
                    <span className="font-semibold text-[#202B36]">{transactionId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Thời gian</span>
                    <span className="font-semibold text-[#202B36]">09:22 • 20/10/2026</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Tiền phòng (2 đêm × 1.250.000 ₫)</span>
                    <span className="font-medium text-[#202B36]">2.500.000 ₫</span>
                  </div>
                  <div className="flex justify-between text-[#934a33] font-semibold">
                    <span>Mã ưu đãi (ANHNIEN250)</span>
                    <span>-250.000 ₫</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Thuế GTGT (8%) & Phí phục vụ</span>
                    <span className="text-[#35624A] font-semibold">Đã bao gồm</span>
                  </div>
                </div>

                <div className="bg-[#f1f3f9] p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">TỔNG ĐÃ THANH TOÁN</span>
                    <span className="text-xs text-[#35624A] font-semibold">Không phát sinh phụ phí</span>
                  </div>
                  <span className="text-xl font-bold text-[#013758]">2.250.000 ₫</span>
                </div>

                {/* Loyalty points card */}
                <div className="bg-[#EAF0F5]/80 p-3.5 rounded-xl flex items-center gap-3">
                  <div className="size-9 rounded-full bg-[#234e70] text-white flex items-center justify-center shrink-0">
                    <Award className="size-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#013758] block">+225 Điểm StayReco Elite</span>
                    <span className="text-[11px] text-slate-500">Điểm thưởng đã được tích lũy vào tài khoản.</span>
                  </div>
                </div>

                {/* Return Action */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <Link href="/account/bookings" className="block">
                    <Button className="w-full h-11 bg-[#234e70] hover:bg-[#193B56] text-white text-xs font-bold gap-2">
                      <Calendar className="size-4" />
                      <span>Quản lý chuyến đi trong Tài khoản</span>
                    </Button>
                  </Link>
                  <Link href="/" className="block text-center">
                    <Button variant="ghost" className="w-full h-10 text-xs font-semibold text-slate-600 hover:text-[#013758]">
                      Quay về Trang chủ
                    </Button>
                  </Link>
                </div>
              </Card>

            </div>

          </div>
    </div>
  );
}
