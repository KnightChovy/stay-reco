'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppBreadcrumb from '@/common/breadcrumb/AppBreadcrumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  QrCode,
  Printer,
  Headset,
  Star,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Bed,
  Maximize2,
  Users,
  Award,
  ShieldCheck,
  Check,
  ArrowRight,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

export default function BookingDetailPage() {
  const bookingData = {
    id: 'SR-261020-0842',
    transactionId: 'VNP142981023',
    hotelName: 'An Nhiên Riverside Hotel Đà Nẵng',
    hotelImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
    address: '128 Bạch Đằng, Phường Hải Châu 1, Quận Hải Châu, Thành phố Đà Nẵng',
    phone: '0236 3888 999',
    roomType: 'Deluxe River View',
    roomCode: 'DLR-608',
    checkIn: '14:00 • Thứ Ba, 20/10/2026',
    checkOut: '12:00 • Thứ Năm, 22/10/2026',
    nights: 2,
    guestName: 'Nguyễn Minh Anh',
    guests: '2 Người lớn',
    bedType: '1 Giường King lớn',
    roomArea: '38 m²',
    view: 'Sông Hàn & Cầu Rồng',
    totalPrice: '2.250.000 ₫',
    originalPrice: '2.500.000 ₫',
    discount: '250.000 ₫',
    status: 'Đã xác nhận',
    paymentStatus: 'Đã thanh toán (VNPay)',
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f9ff] font-sans antialiased text-[#202B36]">
      <Header />

      <main className="flex-1 w-full bg-[#f7f9ff]">
        
        {/* TOP CONTEXT BAR */}
        <section className="w-full bg-[#f1f3f9] py-3 border-b border-slate-200/60">
          <div className="max-w-marketplace mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-xs">
            <AppBreadcrumb
              items={[
                { label: 'Tài khoản', href: '/profile' },
                { label: 'Chuyến đi của tôi', href: '/account/bookings' },
                { label: `Chi tiết đặt phòng #${bookingData.id}`, active: true },
              ]}
            />
            <div className="flex items-center gap-2">
              <Badge className="bg-[#EDF4EE] text-[#35624A] hover:bg-[#EDF4EE] font-semibold text-[11px] gap-1.5 border-none">
                <span className="size-1.5 rounded-full bg-[#35624A]" />
                Đơn phòng hiệu lực
              </Badge>
              <span className="text-slate-500">Hồ sơ khách: <strong className="text-[#202B36]">{bookingData.guestName}</strong></span>
            </div>
          </div>
        </section>

        {/* TITLE & QUICK CONTROLS HEADER */}
        <section className="w-full bg-white py-6 shadow-xs border-b border-slate-200/60">
          <div className="max-w-marketplace mx-auto px-4 sm:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#013758] tracking-tight">
                  Chi tiết đặt phòng #{bookingData.id}
                </h1>
                <Badge className="bg-[#EDF4EE] text-[#35624A] hover:bg-[#EDF4EE] font-semibold text-xs border-none gap-1">
                  <CheckCircle2 className="size-3.5" /> {bookingData.status}
                </Badge>
                <Badge className="bg-[#EAF0F5] text-[#013758] hover:bg-[#EAF0F5] font-semibold text-xs border-none">
                  {bookingData.paymentStatus}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Ngày khởi tạo: 20/10/2026 lúc 09:18 • Thời gian lưu trú: 20/10/2026 — 22/10/2026 (2 đêm)
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Link href="/booking/confirmation">
                <Button className="h-10 px-4 bg-[#013758] hover:bg-[#193B56] text-white text-xs font-bold gap-1.5 shadow-xs">
                  <QrCode className="size-4" />
                  <span>Xem QR Voucher</span>
                </Button>
              </Link>
              <Button variant="outline" onClick={() => window.print()} className="h-10 px-4 text-xs font-semibold border-slate-300 gap-1.5">
                <Printer className="size-4 text-slate-500" />
                <span>In hóa đơn điện tử</span>
              </Button>
              <Button variant="outline" className="h-10 px-4 text-xs font-semibold border-slate-300 text-[#013758] gap-1.5">
                <Headset className="size-4" />
                <span>Liên hệ khách sạn</span>
              </Button>
            </div>
          </div>
        </section>

        {/* MAIN SPLIT LAYOUT */}
        <div className="max-w-marketplace mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* CARD 1: Hotel Overview */}
              <Card className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-5/12 relative aspect-4/3 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                  <Image
                    src={bookingData.hotelImage}
                    alt={bookingData.hotelName}
                    fill
                    className="object-cover"
                  />
                  <Badge className="absolute top-2 left-2 bg-white/90 text-[#202B36] font-semibold text-[10px] border-none gap-1">
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    <span>4.8/5.0 Tuyệt hảo (428 đánh giá)</span>
                  </Badge>
                  <Badge className="absolute bottom-2 right-2 bg-[#013758] text-white font-bold text-[10px] border-none">
                    Boutique 4 sao
                  </Badge>
                </div>

                <div className="flex flex-col justify-between flex-1 space-y-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#F5EBE5] text-[#934a33] font-semibold">Đối tác tuyển chọn StayReco</span>
                      <span className="text-xs text-slate-400">• Mã phòng: {bookingData.roomCode}</span>
                    </div>
                    <h2 className="text-xl font-bold text-[#202B36] mt-1">{bookingData.hotelName}</h2>
                    <p className="text-xs text-slate-500 flex items-start gap-1 mt-1">
                      <MapPin className="size-3.5 text-[#934a33] shrink-0 mt-0.5" />
                      <span>{bookingData.address}</span>
                    </p>
                  </div>

                  <div className="p-3 bg-[#f1f3f9] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-[#EAF0F5] text-[#013758] flex items-center justify-center shrink-0">
                        <Phone className="size-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Hotline lễ tân (24/7)</span>
                        <strong className="text-sm text-[#013758]">{bookingData.phone}</strong>
                      </div>
                    </div>

                    <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[#013758] hover:underline flex items-center gap-1">
                      <span>Chỉ đường trên bản đồ</span>
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                </div>
              </Card>

              {/* CARD 2: Detailed Stay Period & Room Specs */}
              <Card className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#202B36] flex items-center gap-2">
                    <Calendar className="size-5 text-[#013758]" />
                    <span>Lịch trình & Phòng đã chọn</span>
                  </h3>
                  <span className="text-xs text-slate-500 bg-[#f1f3f9] px-2.5 py-1 rounded font-medium">
                    2 đêm lưu trú
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-[#f1f3f9] flex items-center gap-4">
                    <div className="size-11 rounded-lg bg-white text-[#013758] flex flex-col items-center justify-center shadow-xs font-bold shrink-0">
                      <span className="text-[10px] uppercase text-[#934a33]">T.10</span>
                      <span className="text-lg leading-none">20</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nhận phòng (Check-in)</span>
                      <span className="font-bold text-[#202B36] block text-sm">14:00 • Thứ Ba</span>
                      <span className="text-slate-500">20 Tháng 10, 2026</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-[#f1f3f9] flex items-center gap-4">
                    <div className="size-11 rounded-lg bg-white text-[#013758] flex flex-col items-center justify-center shadow-xs font-bold shrink-0">
                      <span className="text-[10px] uppercase text-[#934a33]">T.10</span>
                      <span className="text-lg leading-none">22</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Trả phòng (Check-out)</span>
                      <span className="font-bold text-[#202B36] block text-sm">12:00 • Thứ Năm</span>
                      <span className="text-slate-500">22 Tháng 10, 2026</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[#eceef4] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-[#934a33] font-bold uppercase tracking-wide">Hạng phòng cao cấp</span>
                      <h4 className="text-lg font-bold text-[#202B36]">{bookingData.roomType}</h4>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded bg-white font-medium text-[#202B36]">Tầng 6 • Phòng #608</span>
                      <span className="px-2.5 py-1 rounded bg-white font-medium text-[#202B36]">Không hút thuốc</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                    <div className="flex items-center gap-2 bg-white p-2.5 rounded">
                      <Bed className="size-4 text-[#013758]" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400">Loại giường</span>
                        <span className="font-semibold text-[#202B36]">{bookingData.bedType}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white p-2.5 rounded">
                      <Maximize2 className="size-4 text-[#013758]" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400">Diện tích</span>
                        <span className="font-semibold text-[#202B36]">{bookingData.roomArea}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white p-2.5 rounded">
                      <MapPin className="size-4 text-[#013758]" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400">Tầm nhìn</span>
                        <span className="font-semibold text-[#202B36]">{bookingData.view}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white p-2.5 rounded">
                      <Users className="size-4 text-[#013758]" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400">Sức chứa</span>
                        <span className="font-semibold text-[#202B36]">{bookingData.guests}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* CARD 3: Exclusive Privileges */}
              <Card className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#202B36] flex items-center gap-2">
                    <Award className="size-5 text-[#934a33]" />
                    <span>Đặc quyền & Dịch vụ đi kèm theo gói</span>
                  </h3>
                  <Badge className="bg-[#EDF4EE] text-[#35624A] hover:bg-[#EDF4EE] text-xs font-semibold px-2.5 py-0.5 border-none">
                    4 dịch vụ miễn phí
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-lg bg-[#f1f3f9] flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-[#35624A] shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <h4 className="font-bold text-[#202B36]">2 suất Buffet sáng hữu cơ hàng ngày</h4>
                      <p className="text-slate-500 mt-0.5">Phục vụ từ 06:30 - 10:00 tại Nhà hàng Sen Vàng (Tầng 2).</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#f1f3f9] flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-[#35624A] shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <h4 className="font-bold text-[#202B36]">Hồ bơi vô cực ngắm pháo hoa</h4>
                      <p className="text-slate-500 mt-0.5">Tự do sử dụng từ 06:00 - 22:00 tại Tầng 18 với tầm nhìn ôm trọn sông Hàn.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#f1f3f9] flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-[#35624A] shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <h4 className="font-bold text-[#202B36]">Set trà chiều Hội An tại Lounge</h4>
                      <p className="text-slate-500 mt-0.5">01 set trà thảo mộc & bánh ngọt truyền thống áp dụng từ 14:30 - 16:30.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#f1f3f9] flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-[#35624A] shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <h4 className="font-bold text-[#202B36]">Đón tiễn sân bay Đà Nẵng miễn phí</h4>
                      <p className="text-slate-500 mt-0.5">Xe riêng đón tại Cảng Hàng Không Quốc Tế Đà Nẵng.</p>
                    </div>
                  </div>
                </div>
              </Card>

            </div>

            {/* RIGHT COLUMN: Payment Details Sidebar (4 cols sticky) */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
              
              <Card className="bg-white rounded-2xl p-6 shadow-md border border-slate-200/80 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-[#202B36]">Chi tiết thanh toán</h3>
                  <Badge className="bg-[#EDF4EE] text-[#35624A] text-xs font-bold px-2.5 py-0.5 border-none">
                    Đã thanh toán đủ
                  </Badge>
                </div>

                <div className="space-y-2 text-xs text-slate-600 pb-3 border-b border-slate-100">
                  <div className="flex justify-between">
                    <span>Cổng thanh toán</span>
                    <span className="font-semibold text-[#202B36]">VNPay Gateway</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mã giao dịch</span>
                    <span className="font-semibold text-[#202B36]">{bookingData.transactionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thời gian</span>
                    <span className="font-semibold text-[#202B36]">09:22 • 20/10/2026</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Tiền phòng (2 đêm × 1.250.000 ₫)</span>
                    <span className="font-medium text-[#202B36]">{bookingData.originalPrice}</span>
                  </div>
                  <div className="flex justify-between text-[#934a33] font-semibold">
                    <span>Mã ưu đãi (ANHNIEN250)</span>
                    <span>-{bookingData.discount}</span>
                  </div>
                </div>

                <div className="bg-[#f1f3f9] p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">TỔNG ĐÃ THANH TOÁN</span>
                    <span className="text-xs text-[#35624A] font-semibold">Không phát sinh phụ phí</span>
                  </div>
                  <span className="text-xl font-bold text-[#013758]">{bookingData.totalPrice}</span>
                </div>

                {/* Loyalty points card */}
                <div className="bg-[#EAF0F5] p-3.5 rounded-xl flex items-center gap-3">
                  <div className="size-9 rounded-full bg-[#234e70] text-white flex items-center justify-center shrink-0">
                    <Award className="size-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#013758] block">+225 Điểm StayReco Elite</span>
                    <span className="text-[11px] text-slate-500">Điểm thưởng đã tích lũy vào tài khoản.</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <Button className="w-full h-10 bg-[#f1f3f9] hover:bg-slate-200 text-[#202B36] text-xs font-bold gap-2">
                    <MessageSquare className="size-4 text-[#013758]" />
                    <span>Nhắn tin với Lễ tân</span>
                  </Button>
                  <Link href="/account/bookings" className="block">
                    <Button variant="outline" className="w-full h-10 border-slate-300 text-xs font-semibold text-slate-700">
                      Quản lý chuyến đi trong Tài khoản
                    </Button>
                  </Link>
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
