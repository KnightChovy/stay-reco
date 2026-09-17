'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  QrCode,
  Search,
  UserPlus,
  LogIn,
  LogOut,
  Hotel,
  Sparkles,
  BedDouble,
  CheckCircle2,
  Clock,
  MessageSquare,
  MoreVertical,
  CreditCard,
  Headset,
  Info,
  Calendar,
  Phone,
  ChevronRight
} from 'lucide-react';

export default function StaffDashboardPage() {
  const [activeTab, setActiveTab] = useState<'checkin' | 'checkout'>('checkin');
  const [searchQuery, setSearchQuery] = useState('');

  const checkInGuests = [
    {
      id: 'SR-261020-0842',
      channel: 'StayReco App',
      name: 'Nguyễn Minh Anh',
      initials: 'NA',
      phone: '0905 128 442',
      tier: 'Elite Bạc',
      roomType: 'Deluxe River View',
      pkg: 'Gói linh hoạt ăn sáng Buffet',
      arrivalTime: '14:00',
      roomNum: 'P.608 (Tầng 6)',
      roomStatus: 'Sạch & Kiểm duyệt',
      paymentStatus: 'Đã thanh toán VNPay',
      amount: '2.250.000 ₫',
    },
    {
      id: 'SR-261020-0850',
      channel: 'Booking.com',
      name: 'Trần Thanh Lan',
      initials: 'TL',
      phone: '0912 456 789',
      tier: 'Khách thông thường',
      roomType: 'Superior Garden Twin',
      pkg: 'Tiêu chuẩn không hoàn tiền',
      arrivalTime: '12:30',
      roomNum: 'Chưa gán phòng',
      roomStatus: 'Ưu tiên tầng 2 hoặc 3',
      paymentStatus: 'Thu tại quầy',
      amount: '1.680.000 ₫',
    },
    {
      id: 'SR-261020-0855',
      channel: 'StayReco VIP',
      name: 'Đỗ Quốc Khánh',
      initials: 'DK',
      phone: '0988 333 901',
      tier: 'Elite Kim Cương',
      roomType: 'Executive Riverside Suite',
      pkg: 'Bao gồm trà chiều & Spa 60p',
      arrivalTime: '11:15 (Sớm)',
      roomNum: 'P.802 (Tầng 8)',
      roomStatus: 'Welcome card đặt bàn',
      paymentStatus: 'Thẻ tín dụng doanh nghiệp',
      amount: '4.850.000 ₫',
    },
    {
      id: 'SR-261020-0862',
      channel: 'Agoda',
      name: 'Vũ Hoàng Long',
      initials: 'VL',
      phone: '0934 991 228',
      tier: 'Thành viên mới',
      roomType: 'Deluxe City Corner',
      pkg: 'Không gồm bữa sáng',
      arrivalTime: '14:30',
      roomNum: 'P.405 (Tầng 4)',
      roomStatus: 'Đang làm phòng',
      paymentStatus: 'Chờ cọc 500k',
      amount: '1.950.000 ₫',
    },
    {
      id: 'SR-261020-0870',
      channel: 'Lễ tân Walk-in',
      name: 'Phạm Thị Mai',
      initials: 'PM',
      phone: '0971 002 119',
      tier: 'Elite Vàng',
      roomType: 'Family Connecting Suite',
      pkg: 'Bao gồm ăn sáng 4 người',
      arrivalTime: '15:00',
      roomNum: 'P.501-502',
      roomStatus: 'Đã mở cửa thông',
      paymentStatus: 'Chuyển khoản Vietcombank',
      amount: '3.800.000 ₫',
    },
  ];

  return (
    <div className="font-sans antialiased text-foreground">
      <main>
        <div className="p-8 space-y-7 pb-16">
          
          {/* Top Operational Context & Action Command Bar */}
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5 pt-2">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 tracking-wide">
                  <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Ca Sáng • 20/10/2026
                </span>
                <span className="text-muted-foreground text-xs font-mono">Bàn giao ca: 14:00</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-primary">
                Tổng quan ca làm việc — Lễ tân & Vận hành
              </h1>
              <p className="text-xs lg:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Theo dõi tình hình nhận/trả phòng hôm nay, phòng chờ gán số và các yêu cầu khẩn cần xử lý kịp thời tại An Nhiên Riverside.
              </p>
            </div>

            {/* Quick Action Command Bar */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link href="/staff/check-in">
                <Button className="h-11 px-4 bg-primary text-primary-foreground hover:bg-[#193b56] text-xs font-bold gap-2 shadow-xs">
                  <QrCode className="size-4" />
                  <span>Quét QR Voucher</span>
                </Button>
              </Link>
              <Link href="/staff/bookings">
                <Button variant="outline" className="h-11 px-4 bg-white text-foreground hover:bg-slate-50 text-xs font-semibold gap-2 border-border shadow-2xs">
                  <Search className="size-4 text-primary" />
                  <span>Tìm nhanh đặt phòng</span>
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 rounded text-muted-foreground">⌘K</kbd>
                </Button>
              </Link>
              <Link href="/staff/check-in">
                <Button variant="outline" className="h-11 px-4 bg-white text-foreground hover:bg-slate-50 text-xs font-semibold gap-2 border-border shadow-2xs">
                  <UserPlus className="size-4 text-[#934a33]" />
                  <span>Tạo đặt phòng tại quầy</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Operational KPI Metric Matrix (4 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Card 1: Check-in */}
            <Card className="p-5 bg-white border border-border rounded-xl shadow-2xs hover:shadow-xs transition-shadow space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Khách nhận phòng</span>
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <LogIn className="size-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">14</span>
                <span className="text-xs text-muted-foreground font-medium">lượt dự kiến</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: '28.5%' }} />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-primary" /> Đã nhận: <strong className="text-foreground">4</strong>
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-slate-300" /> Chờ nhận: <strong className="text-[#934a33]">10</strong>
                </span>
              </div>
            </Card>

            {/* Card 2: Check-out */}
            <Card className="p-5 bg-white border border-border rounded-xl shadow-2xs hover:shadow-xs transition-shadow space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Khách trả phòng</span>
                <div className="size-8 rounded-lg bg-orange-100 text-[#934a33] flex items-center justify-center">
                  <LogOut className="size-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">12</span>
                <span className="text-xs text-muted-foreground font-medium">lượt trong ngày</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex">
                <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: '75%' }} />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-600" /> Đã xong: <strong className="text-foreground">9</strong>
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-[#934a33]" /> Đang đợi: <strong className="text-[#934a33]">3</strong>
                </span>
              </div>
            </Card>

            {/* Card 3: Room Occupancy */}
            <Card className="p-5 bg-white border border-border rounded-xl shadow-2xs hover:shadow-xs transition-shadow space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Công suất phòng</span>
                <div className="size-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Hotel className="size-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-primary">88%</span>
                <span className="text-xs text-muted-foreground font-medium">32 / 36 phòng</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: '88%' }} />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Còn trống: <strong className="text-emerald-700 font-semibold">4 phòng sạch</strong></span>
                <span className="text-muted-foreground">Đạt chỉ tiêu ca</span>
              </div>
            </Card>

            {/* Card 4: AI Concierge & Direct Requests */}
            <Card className="p-5 bg-white border border-border rounded-xl shadow-2xs hover:shadow-xs transition-shadow space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tin nhắn & AI duyệt</span>
                <div className="size-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Sparkles className="size-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#934a33]">3</span>
                <span className="text-xs text-muted-foreground font-medium">mục cần phản hồi</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#934a33] h-1.5 rounded-full" style={{ width: '65%' }} />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>2 tin hỏi view tầng cao</span>
                <span className="text-[#934a33] font-semibold">1 đổi lịch</span>
              </div>
            </Card>
          </div>

          {/* Action-First Priority Queue Banner (Việc khẩn cần xử lý trong ca) */}
          <Card className="bg-white border border-border rounded-xl shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="size-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Việc khẩn ưu tiên trong ca làm
                </span>
                <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-[10px] font-bold">
                  3 cần xử lý
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground">Tự động cập nhật thời gian thực từ PMS</span>
            </div>

            <div className="divide-y divide-border">
              {/* Item 1 */}
              <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    <BedDouble className="size-5" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">SR-261020-0842</span>
                      <span className="text-xs font-bold text-foreground">Nguyễn Minh Anh</span>
                      <Badge variant="outline" className="text-[10px] font-semibold">Elite Bạc</Badge>
                      <span className="text-[11px] text-muted-foreground">• Deluxe River View (#608)</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Dự kiến đến lúc <strong className="text-foreground font-bold">14:00</strong> — Yêu cầu đặc biệt: Khách cần gối lông vũ tự nhiên, yên tĩnh, chuẩn bị trước trà thảo mộc chào mừng.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <Link href="/staff/check-in">
                    <Button className="h-9 px-3.5 bg-primary text-primary-foreground hover:bg-[#193b56] text-xs font-semibold gap-1.5 shadow-2xs">
                      <CheckCircle2 className="size-4" /> Gán phòng & Chuẩn bị
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="size-4" />
                  </Button>
                </div>
              </div>

              {/* Item 2 */}
              <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="size-9 rounded-lg bg-orange-100 text-[#934a33] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    <Clock className="size-5" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">SR-261020-0791</span>
                      <span className="text-xs font-bold text-foreground">Trần Văn Hoàng</span>
                      <span className="text-[11px] text-muted-foreground">• Superior Garden (#204)</span>
                      <Badge className="bg-orange-100 text-[#934a33] hover:bg-orange-100 text-[10px] font-bold">Trả phòng muộn</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Khách xin gia hạn trả phòng đến <strong className="text-foreground font-bold">13:00</strong> (quy định 12:00). Cần kiểm tra lượt đặt kế tiếp và chốt phụ phí gia hạn 150.000 ₫.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <Link href="/staff/check-out">
                    <Button variant="outline" className="h-9 px-3.5 text-xs font-semibold gap-1.5 border-border">
                      <CreditCard className="size-4 text-[#934a33]" /> Xác nhận phụ phí
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="size-4" />
                  </Button>
                </div>
              </div>

              {/* Item 3 */}
              <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="size-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    <Headset className="size-5" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-foreground">Khách trao đổi qua AI Concierge</span>
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px] font-bold">Cần xác nhận xe</Badge>
                      <span className="text-[11px] text-muted-foreground">Chuyến bay VN128 hạ cánh 15:30</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Khách muốn đặt shuttle bus đón sân bay Đà Nẵng về khách sạn cho 2 người lớn kèm 2 kiện hành lý cồng kềnh.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <Link href="/staff/inbox">
                    <Button className="h-9 px-3.5 bg-primary text-primary-foreground hover:bg-[#193b56] text-xs font-semibold gap-1.5 shadow-2xs">
                      <MessageSquare className="size-4" /> Tiếp nhận chat
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Primary Operations Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
            {/* Left Column: Master Tabs & Operational Guests Table */}
            <div className="lg:col-span-8 space-y-4 min-w-0">
              <Card className="bg-white border border-border shadow-2xs rounded-xl overflow-hidden">
                {/* Tab Bar */}
                <div className="p-3 bg-slate-50 border-b border-border flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex rounded-lg bg-slate-200/70 p-1 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setActiveTab('checkin')}
                      className={`px-3.5 py-1.5 rounded-md text-xs font-semibold gap-2 flex items-center transition-all ${
                        activeTab === 'checkin'
                          ? 'bg-white text-primary shadow-2xs font-bold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <LogIn className="size-4" />
                      <span>Hôm nay nhận phòng (Check-in)</span>
                      <Badge className="bg-primary/10 text-primary font-bold text-[10px] px-1.5 py-0">14</Badge>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('checkout')}
                      className={`px-3.5 py-1.5 rounded-md text-xs font-semibold gap-2 flex items-center transition-all ${
                        activeTab === 'checkout'
                          ? 'bg-white text-primary shadow-2xs font-bold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <LogOut className="size-4" />
                      <span>Hôm nay trả phòng (Check-out)</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">12</Badge>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Lọc theo tên, mã phòng..."
                        className="h-8 pl-8 pr-3 text-xs rounded-lg bg-white text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-1 focus:ring-primary w-44 sm:w-56 shadow-2xs font-medium"
                      />
                      <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
                    </div>
                  </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-foreground">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">
                        <th className="py-3 px-4">Mã đơn</th>
                        <th className="py-3 px-4">Khách hàng</th>
                        <th className="py-3 px-4">Hạng phòng & Gói</th>
                        <th className="py-3 px-3 text-center">Giờ đến</th>
                        <th className="py-3 px-4">Phòng vật lý</th>
                        <th className="py-3 px-4">Thanh toán</th>
                        <th className="py-3 px-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {checkInGuests.map((guest) => (
                        <tr key={guest.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-primary whitespace-nowrap">
                            <Link href={`/staff/bookings/${guest.id}`} className="hover:underline">
                              {guest.id}
                            </Link>
                            <span className="block text-[10px] font-normal text-muted-foreground">Kênh: {guest.channel}</span>
                          </td>
                          <td className="py-3.5 px-4 min-w-[160px]">
                            <div className="flex items-center gap-2">
                              <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                                {guest.initials}
                              </div>
                              <div>
                                <div className="font-bold text-foreground">{guest.name}</div>
                                <div className="text-[11px] text-muted-foreground font-mono">{guest.phone}</div>
                              </div>
                            </div>
                            <div className="mt-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#934a33]">
                                ★ {guest.tier}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 min-w-[170px]">
                            <div className="font-semibold text-foreground">{guest.roomType}</div>
                            <div className="text-[11px] text-muted-foreground">{guest.pkg}</div>
                          </td>
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-slate-100 text-foreground">
                              {guest.arrivalTime}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary">
                              <BedDouble className="size-3.5" />
                              {guest.roomNum}
                            </span>
                            <span className="block text-[10px] text-emerald-600 font-medium mt-0.5">{guest.roomStatus}</span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="size-3 text-emerald-600" />
                              {guest.paymentStatus}
                            </span>
                            <div className="text-[11px] font-mono font-bold text-foreground mt-0.5">{guest.amount}</div>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <Link href="/staff/check-in">
                                <Button size="sm" className="h-8 px-3 bg-primary text-primary-foreground hover:bg-[#193b56] text-[11px] font-semibold">
                                  Check-in
                                </Button>
                              </Link>
                              <Link href={`/staff/bookings/${guest.id}`}>
                                <Button size="sm" variant="ghost" className="size-8 p-0 text-muted-foreground hover:text-foreground">
                                  <MoreVertical className="size-4" />
                                </Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Right Column: Physical Room Inventory & Contacts */}
            <div className="lg:col-span-4 space-y-6">
              {/* Panel 1: Room Status Overview */}
              <Card className="p-5 bg-white border border-border shadow-2xs rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hotel className="size-5 text-primary" />
                    <h2 className="text-sm font-bold text-foreground">Tình trạng phòng vật lý</h2>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-muted-foreground">Tổng 36 phòng</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="bg-emerald-600 h-full" style={{ width: '50%' }} title="Sạch: 18 phòng" />
                    <div className="bg-[#934a33] h-full" style={{ width: '11.1%' }} title="Đang dọn: 4 phòng" />
                    <div className="bg-primary h-full" style={{ width: '33.3%' }} title="Đang có khách: 12 phòng" />
                    <div className="bg-slate-300 h-full" style={{ width: '5.6%' }} title="Bảo trì: 2 phòng" />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground px-0.5">
                    <span>50% Sẵn sàng</span>
                    <span>33% Có khách</span>
                    <span>17% Dọn/Bảo trì</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full bg-emerald-600" /> Phòng sạch sẵn sàng
                    </span>
                    <span className="font-mono font-bold text-emerald-700">18 phòng</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full bg-[#934a33]" /> Đang dọn dẹp (Housekeeping)
                    </span>
                    <span className="font-mono font-bold text-[#934a33]">04 phòng</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full bg-primary" /> Đang có khách lưu trú
                    </span>
                    <span className="font-mono font-bold text-primary">12 phòng</span>
                  </div>
                </div>
              </Card>

              {/* Panel 2: Internal Contacts */}
              <Card className="p-5 bg-white border border-border shadow-2xs rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Phone className="size-4 text-[#934a33]" />
                    <h2 className="text-sm font-bold text-foreground">Liên hệ bộ phận nội bộ</h2>
                  </div>
                  <span className="size-2 rounded-full bg-emerald-500" />
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <div>
                      <div className="font-bold text-foreground">Tổ Buồng phòng</div>
                      <div className="text-[11px] text-muted-foreground">Giám sát: Cô Hoa (Ca 1)</div>
                    </div>
                    <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">Ext: 102</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <div>
                      <div className="font-bold text-foreground">Bếp & Nhà hàng Sen Vàng</div>
                      <div className="text-[11px] text-muted-foreground">Bếp trưởng: Bùi Anh Tuấn</div>
                    </div>
                    <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">Ext: 105</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <div>
                      <div className="font-bold text-foreground">Hỗ trợ kỹ thuật StayReco</div>
                      <div className="text-[11px] text-muted-foreground">Kênh ưu tiên 24/7</div>
                    </div>
                    <a href="tel:19006868" className="font-mono font-bold text-[#934a33] hover:underline">1900 6868</a>
                  </div>
                </div>
              </Card>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
