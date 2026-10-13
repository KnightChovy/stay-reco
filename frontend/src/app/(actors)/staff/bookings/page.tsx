'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Download,
  Search,
  Calendar,
  BedDouble,
  CreditCard,
  CheckCircle2,
  Copy,
  Printer,
  MoreVertical,
  LogIn,
  LogOut,
  Plus,
  Phone,
  Clock,
  Keyboard,
  Check,
  UserCheck
} from 'lucide-react';

export default function StaffBookingsPage() {
  const [activeStatus, setActiveStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const bookings = [
    {
      id: 'SR-261020-0842',
      time: 'Đặt lúc 08:32 sáng',
      channel: 'StayReco App',
      guestName: 'Nguyễn Minh Anh',
      initials: 'NM',
      phone: '0905 *** 882',
      tier: 'Elite Bạc',
      tierType: 'elite',
      roomType: 'Deluxe River View',
      pkg: 'Gói linh hoạt ăn sáng Buffet',
      stayDates: '20/10 → 22/10/2026',
      roomNum: 'P.608 (Tầng 6)',
      roomClean: 'Sạch & Kiểm duyệt',
      amount: '2.250.000 ₫',
      paymentStatus: 'Đã thanh toán VNPay',
      status: 'Sẵn sàng Check-in',
      statusType: 'ready',
      action: 'checkin',
    },
    {
      id: 'SR-261020-0841',
      time: 'Đặt lúc 08:15 sáng',
      channel: 'Booking.com',
      guestName: 'Trần Quốc Bảo',
      initials: 'TB',
      phone: '0912 *** 450',
      tier: 'Khách thông thường',
      tierType: 'normal',
      roomType: 'Superior Garden View',
      pkg: '2 người lớn • Giường đôi King',
      stayDates: '20/10 → 21/10/2026',
      roomNum: 'Chưa gán phòng',
      roomClean: 'Ưu tiên tầng 2 hoặc 3',
      amount: '980.000 ₫',
      paymentStatus: 'Đã thanh toán (Thẻ)',
      status: 'Đã xác nhận',
      statusType: 'confirmed',
      action: 'assign',
    },
    {
      id: 'SR-261020-0839',
      time: 'Đặt lúc 07:45 sáng',
      channel: 'StayReco VIP',
      guestName: 'Lê Thị Mai Hoa',
      initials: 'LH',
      phone: '0938 *** 999',
      tier: 'Elite Kim Cương',
      tierType: 'vip',
      roomType: 'Riverside Suite Ban Công Lớn',
      pkg: '2 lớn, 1 trẻ em • Kèm ăn sáng',
      stayDates: '20/10 → 23/10/2026',
      roomNum: 'P.501 (Tầng 5)',
      roomStatus: 'Sẵn sàng đón khách',
      amount: '5.550.000 ₫',
      paymentStatus: 'Đã thanh toán (Napas)',
      status: 'Sẵn sàng đón khách',
      statusType: 'ready',
      action: 'welcome',
    },
    {
      id: 'SR-261020-0835',
      time: 'Nhận phòng hôm qua',
      channel: 'Agoda',
      guestName: 'David Miller',
      initials: 'DM',
      phone: 'david.m@global.com',
      tier: 'Quốc tế 🇺🇸',
      tierType: 'intl',
      roomType: 'Deluxe River View',
      pkg: '1 khách • Yêu cầu tầng cao',
      stayDates: '19/10 → 21/10/2026',
      roomNum: 'P.604 (Tầng 6)',
      roomStatus: 'Đang ở ngày thứ 2/2',
      amount: '2.500.000 ₫',
      paymentStatus: 'Visa Quốc tế',
      status: 'Đang lưu trú',
      statusType: 'staying',
      action: 'service',
    },
    {
      id: 'SR-261020-0820',
      time: 'Đến hạn trả phòng',
      channel: 'Hotline',
      guestName: 'Hoàng Trọng Nghĩa',
      initials: 'HN',
      phone: '0977 *** 219',
      tier: 'Elite Vàng',
      tierType: 'gold',
      roomType: 'Deluxe River View',
      pkg: '2 người lớn',
      stayDates: '18/10 → 20/10/2026',
      roomNum: 'P.602 (Tầng 6)',
      roomStatus: 'Hết hạn ca này (12:00)',
      amount: '2.250.000 ₫',
      paymentStatus: 'Đã quyết toán phòng',
      status: 'Chờ Check-out',
      statusType: 'checkout',
      action: 'checkout',
    },
  ];

  return (
    <div className="font-sans antialiased text-foreground">
      <main>
        <div className="p-8 space-y-6 pb-16">
          
          {/* Top Operational Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-primary text-primary-foreground">
                  PMS Operational Hub
                </span>
                <span className="text-xs text-muted-foreground font-medium">Cập nhật theo thời gian thực (Real-time sync)</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                Danh sách đặt phòng lưu trú
              </h1>
              <p className="text-xs lg:text-sm text-muted-foreground mt-0.5">
                Quản lý, tra cứu và xử lý toàn bộ các đơn đặt phòng tại An Nhiên Riverside Hotel.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3 px-3.5 py-2 rounded-xl bg-white border border-border shadow-2xs">
                <div className="flex items-center gap-2">
                  <BedDouble className="size-4 text-primary" />
                  <div className="text-left">
                    <span className="block text-[10px] text-muted-foreground font-semibold uppercase">Hôm nay đến</span>
                    <span className="text-xs font-bold text-foreground">14 lượt</span>
                  </div>
                </div>
                <div className="h-6 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-[#934a33]" />
                  <div className="text-left">
                    <span className="block text-[10px] text-muted-foreground font-semibold uppercase">Chưa gán phòng</span>
                    <span className="text-xs font-bold text-[#934a33]">2 phòng</span>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => alert('StayReco PMS: Đang xuất dữ liệu danh sách 48 đơn đặt phòng thành tệp Excel (.xlsx)...')}
                className="h-11 px-4 bg-white text-foreground hover:bg-slate-50 text-xs font-semibold gap-2 border-border shadow-2xs"
              >
                <Download className="size-4" />
                <span>Xuất Excel / CSV</span>
              </Button>
            </div>
          </div>

          {/* Filter Panel & Quick Nav Tabs */}
          <Card className="p-4 bg-white border border-border rounded-xl shadow-2xs space-y-4">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'all', label: 'Tất cả', count: 48, active: true },
                { id: 'pending', label: 'Chờ xác nhận', count: 2 },
                { id: 'arriving', label: 'Sắp đến hôm nay', count: 14 },
                { id: 'staying', label: 'Đang lưu trú', count: 12 },
                { id: 'completed', label: 'Đã hoàn tất', count: 18 },
                { id: 'cancelled', label: 'Đã hủy & Hoàn tiền', count: 2 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveStatus(tab.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${
                    activeStatus === tab.id
                      ? 'bg-primary text-primary-foreground shadow-2xs'
                      : 'bg-slate-100 text-muted-foreground hover:text-foreground hover:bg-slate-200/70'
                  }`}
                >
                  <span>{tab.label}</span>
                  <Badge className={`text-[10px] font-bold px-1.5 py-0 ${
                    activeStatus === tab.id ? 'bg-primary-foreground/20 text-white' : 'bg-slate-200 text-slate-800'
                  }`}>
                    {tab.count}
                  </Badge>
                </button>
              ))}
            </div>

            {/* Multifaceted Search & Filters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
              <div className="md:col-span-5 relative">
                <Search className="size-4 text-muted-foreground absolute left-3.5 top-3.5" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo mã đơn (SR-XXXXXX), tên khách, SĐT..."
                  className="h-11 pl-10 pr-10 text-xs bg-slate-50 border-border font-medium focus-visible:ring-primary"
                />
              </div>

              <div className="md:col-span-3">
                <div className="h-11 px-3 rounded-lg bg-slate-50 border border-border flex items-center justify-between text-xs text-foreground cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span className="font-semibold">Hôm nay: 20/10/2026</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <select className="w-full h-11 px-3 rounded-lg bg-slate-50 border border-border text-xs font-medium text-foreground focus:outline-none cursor-pointer">
                  <option value="">Tất cả loại phòng</option>
                  <option value="deluxe">Deluxe River View</option>
                  <option value="superior">Superior Garden View</option>
                  <option value="suite">Riverside Suite Ban Công</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <select className="w-full h-11 px-3 rounded-lg bg-slate-50 border border-border text-xs font-medium text-foreground focus:outline-none cursor-pointer">
                  <option value="">Tất cả thanh toán</option>
                  <option value="paid">Đã thanh toán (VNPay / Thẻ)</option>
                  <option value="pending">Chờ thanh toán quầy</option>
                  <option value="refunded">Đã hoàn tiền</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Operational Bookings Table */}
          <Card className="bg-white border border-border shadow-2xs rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 text-muted-foreground uppercase tracking-wider font-bold text-[11px] h-11 border-b border-border">
                    <th className="pl-5 pr-3">Mã đơn</th>
                    <th className="px-3">Khách hàng</th>
                    <th className="px-3">Hạng phòng & Khách</th>
                    <th className="px-3">Lịch lưu trú</th>
                    <th className="px-3 text-center">Phòng vật lý</th>
                    <th className="px-3 text-right">Tổng tiền & Thanh toán</th>
                    <th className="px-3 text-center">Trạng thái</th>
                    <th className="pr-5 pl-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="pl-5 pr-3 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/staff/bookings/${b.id}`} className="font-mono font-bold text-primary hover:underline">
                            {b.id}
                          </Link>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(b.id)}
                            className="p-1 rounded text-muted-foreground hover:text-primary transition-colors"
                            title="Sao chép mã"
                          >
                            {copiedId === b.id ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                          </button>
                        </div>
                        <span className="text-[10px] text-muted-foreground block">{b.time}</span>
                      </td>

                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px]">
                            {b.initials}
                          </div>
                          <div>
                            <span className="font-bold text-foreground block leading-tight">{b.guestName}</span>
                            <span className="text-[11px] text-muted-foreground font-mono">{b.phone}</span>
                          </div>
                        </div>
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#934a33]">
                            ★ {b.tier}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-3.5">
                        <div className="font-semibold text-foreground">{b.roomType}</div>
                        <div className="text-[11px] text-muted-foreground">{b.pkg}</div>
                      </td>

                      <td className="px-3 py-3.5">
                        <div className="font-semibold text-foreground">{b.stayDates}</div>
                        <span className="text-[10px] font-semibold text-primary block">Xác nhận 2 đêm</span>
                      </td>

                      <td className="px-3 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-mono font-bold text-xs bg-slate-100 text-foreground">
                          {b.roomNum}
                        </span>
                      </td>

                      <td className="px-3 py-3.5 text-right">
                        <div className="font-bold font-mono text-foreground">{b.amount}</div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                          <CheckCircle2 className="size-3 text-emerald-600" /> {b.paymentStatus}
                        </span>
                      </td>

                      <td className="px-3 py-3.5 text-center">
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 font-bold text-[11px]">
                          {b.status}
                        </Badge>
                      </td>

                      <td className="pr-5 pl-3 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {b.action === 'checkin' && (
                            <Link href="/staff/check-in">
                              <Button size="sm" className="h-8 px-3 bg-primary text-primary-foreground hover:bg-[#193b56] text-[11px] font-semibold">
                                <LogIn className="size-3.5 mr-1" /> Check-in
                              </Button>
                            </Link>
                          )}
                          {b.action === 'assign' && (
                            <Link href="/staff/check-in">
                              <Button size="sm" className="h-8 px-3 bg-[#934a33] text-white hover:bg-[#7a341e] text-[11px] font-semibold">
                                Gán phòng ngay
                              </Button>
                            </Link>
                          )}
                          {b.action === 'checkout' && (
                            <Link href="/staff/check-out">
                              <Button size="sm" className="h-8 px-3 bg-red-600 text-white hover:bg-red-700 text-[11px] font-semibold">
                                <LogOut className="size-3.5 mr-1" /> Check-out
                              </Button>
                            </Link>
                          )}
                          {b.action === 'welcome' && (
                            <Link href={`/staff/bookings/${b.id}`}>
                              <Button size="sm" variant="outline" className="h-8 px-3 text-[11px] font-semibold">
                                Đón khách
                              </Button>
                            </Link>
                          )}
                          {b.action === 'service' && (
                            <Link href={`/staff/bookings/${b.id}`}>
                              <Button size="sm" variant="outline" className="h-8 px-3 text-[11px] font-semibold">
                                Dịch vụ
                              </Button>
                            </Link>
                          )}
                          <Link href={`/staff/bookings/${b.id}`}>
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

            <div className="px-5 py-3.5 bg-slate-50 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>Hiển thị <strong className="text-foreground">1 - 5</strong> trên tổng số <strong className="text-foreground">48</strong> đơn đặt phòng</span>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" className="h-8 text-xs font-semibold" disabled>Trước</Button>
                <Button size="sm" className="h-8 px-3 bg-primary text-primary-foreground text-xs font-bold">1</Button>
                <Button size="sm" variant="outline" className="h-8 px-3 text-xs font-semibold">2</Button>
                <Button size="sm" variant="outline" className="h-8 px-3 text-xs font-semibold">3</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs font-semibold">Tiếp</Button>
              </div>
            </div>
          </Card>

          {/* Operational Insights Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-white border border-border shadow-2xs rounded-xl flex items-center gap-3">
              <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                <Clock className="size-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Thời gian check-in TB</span>
                <span className="text-sm font-bold text-foreground">1 phút 42 giây <span className="text-emerald-700 text-[11px] font-normal">(-18s)</span></span>
              </div>
            </Card>

            <Card className="p-4 bg-white border border-border shadow-2xs rounded-xl flex items-center gap-3">
              <div className="size-10 rounded-lg bg-orange-100 text-[#934a33] flex items-center justify-center font-bold shrink-0">
                <UserCheck className="size-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Khách StayReco Elite</span>
                <span className="text-sm font-bold text-foreground">6/14 khách hôm nay <span className="text-muted-foreground text-[11px] font-normal">(Ưu tiên)</span></span>
              </div>
            </Card>

            <Card className="p-4 bg-white border border-border shadow-2xs rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Keyboard className="size-5 text-primary shrink-0" />
                <div className="text-xs text-foreground truncate">
                  <strong className="font-semibold">Phím tắt nhanh:</strong>
                  <span className="text-muted-foreground ml-1">Nhấn <kbd className="px-1 py-0.5 text-[10px] font-mono bg-slate-100 rounded text-foreground font-bold">C</kbd> quét QR, <kbd className="px-1 py-0.5 text-[10px] font-mono bg-slate-100 rounded text-foreground font-bold">F</kbd> tìm kiếm</span>
                </div>
              </div>
              <span className="size-2 rounded-full bg-emerald-500 shrink-0" title="Hệ thống sẵn sàng" />
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
