'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AccountSubNav from '@/components/features/account/AccountSubNav';
import AppBreadcrumb from '@/common/breadcrumb/AppBreadcrumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  CheckCircle2,
  Clock,
  QrCode,
  Star,
  MapPin,
  Calendar,
  RefreshCcw,
  MoreVertical,
  ShieldCheck,
  Award,
  Headset,
  Map,
  ArrowUpRight,
  FileText
} from 'lucide-react';

type BookingTab = 'all' | 'upcoming' | 'pending' | 'completed' | 'cancelled';

export default function MyBookingsPage() {
  const [activeTab, setActiveTab] = useState<BookingTab>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');

  const bookings = [
    {
      id: 'SR-261020-0842',
      hotelName: 'An Nhiên Riverside Hotel',
      hotelImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80',
      address: '128 Bạch Đằng, Quận Hải Châu, Đà Nẵng',
      category: 'Boutique 4 sao',
      roomType: 'Phòng Deluxe River View',
      bedType: '1 Giường King',
      guests: '2 khách lớn',
      checkIn: '20/10/2026 (14:00)',
      checkOut: '22/10/2026 (12:00)',
      nights: 2,
      originalPrice: '2.500.000 ₫',
      finalPrice: '2.250.000 ₫',
      status: 'upcoming',
      statusLabel: 'Đã xác nhận',
      paymentLabel: 'Đã thanh toán (VNPay)',
      floorInfo: 'Tầng 6 • View sông',
      dateCreated: '12/10/2026',
    },
    {
      id: 'SR-151120-1102',
      hotelName: 'Mộc Nhiên Eco Lodge',
      hotelImage: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=400&q=80',
      address: 'Thung Lũng Hoa Vàng, Đường Khe Sanh, Đà Lạt',
      category: 'Eco Boutique Resort',
      roomType: 'Phòng Pine Hill Suite',
      bedType: '1 Giường Đôi Lớn',
      guests: 'Bao gồm ăn sáng',
      checkIn: '15/11/2026',
      checkOut: '16/11/2026',
      nights: 1,
      originalPrice: '1.450.000 ₫',
      finalPrice: '1.450.000 ₫',
      status: 'pending',
      statusLabel: 'Giữ chỗ tạm thời',
      paymentLabel: 'Chờ thanh toán',
      floorInfo: 'Đồi thông • Ban công gỗ',
      dateCreated: 'Hôm nay, 14:15',
    },
    {
      id: 'SR-020820-0419',
      hotelName: 'Phố Hoài Heritage Villa',
      hotelImage: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=400&q=80',
      address: '45 Trần Phú, Cẩm Phô, Hội An',
      category: 'Di sản kiến trúc',
      roomType: 'Superior Heritage Room',
      bedType: '1 Giường Đôi',
      guests: 'Kèm trà thảo mộc chiều',
      checkIn: '02/08/2026',
      checkOut: '05/08/2026',
      nights: 3,
      originalPrice: '3.180.000 ₫',
      finalPrice: '3.180.000 ₫',
      status: 'completed',
      statusLabel: 'Đã hoàn tất kỳ nghỉ',
      paymentLabel: 'Đã thanh toán đủ',
      floorInfo: 'Khu phố cổ • Sân vườn',
      dateCreated: '02/08/2026',
    },
  ];

  const filteredBookings = bookings.filter((item) => {
    const matchesTab = activeTab === 'all' || item.status === activeTab;
    const matchesSearch =
      item.hotelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f9ff] font-sans antialiased text-[#202B36]">
      <Header />

      <main className="flex-1 w-full bg-[#f7f9ff]">
        <AccountSubNav activeTab="bookings" />

        <div className="max-w-marketplace mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
          
          <AppBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Tài khoản', href: '/account/profile' },
              { label: 'Chuyến đi của tôi', active: true },
            ]}
          />

          {/* PAGE TITLE */}
          <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 my-6 pb-4 border-b border-slate-200/60">
            <div>
              <span className="text-xs font-bold text-[#934a33] uppercase tracking-wider">Tài khoản • Nguyễn Minh Anh</span>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#013758] tracking-tight mt-1">Chuyến đi của tôi</h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                Quản lý các đặt phòng, theo dõi lịch trình lưu trú và kiểm tra voucher điện tử tức thì với dịch vụ hỗ trợ độc quyền StayReco Protect.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-xs border border-slate-200/80 shrink-0">
              <div className="size-10 rounded-lg bg-[#EAF0F5] text-[#013758] flex items-center justify-center">
                <Award className="size-5" />
              </div>
              <div className="text-xs">
                <span className="text-slate-400 block">Điểm tích lũy</span>
                <span className="font-bold text-[#202B36]">1.420 điểm (Hạng Bạc)</span>
              </div>
            </div>
          </section>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* SEARCH & TABS CARD */}
              <Card className="bg-white p-4 sm:p-5 rounded-xl shadow-xs border border-slate-200/80 space-y-4">
                <div className="relative w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo mã đơn (ví dụ: SR-261020-0842) hoặc tên khách sạn..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#f1f3f9] text-xs sm:text-sm text-[#202B36] placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-[#013758] transition-all"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {[
                    { id: 'all', label: 'Tất cả chuyến đi', count: 5 },
                    { id: 'upcoming', label: 'Sắp tới', count: 1 },
                    { id: 'pending', label: 'Chờ thanh toán', count: 1 },
                    { id: 'completed', label: 'Đã hoàn tất', count: 3 },
                    { id: 'cancelled', label: 'Đã hủy', count: 1 },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as BookingTab)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                        activeTab === tab.id
                          ? 'bg-[#234e70] text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-[#202B36]'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-[#f1f3f9] text-slate-500'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </Card>

              {/* BOOKINGS LIST */}
              <div className="space-y-4">
                {filteredBookings.map((item) => (
                  <Card key={item.id} className="bg-white rounded-xl shadow-xs overflow-hidden border border-slate-200/80 hover:shadow-md transition-all">
                    
                    {/* Header bar */}
                    <div className="bg-[#EAF0F5]/60 px-5 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[#013758]">Mã đặt phòng: {item.id}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500">Đặt ngày {item.dateCreated}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.status === 'upcoming' && (
                          <>
                            <Badge className="bg-[#EDF4EE] text-[#35624A] hover:bg-[#EDF4EE] border-none font-semibold text-[11px] gap-1">
                              <CheckCircle2 className="size-3" /> {item.statusLabel}
                            </Badge>
                            <Badge className="bg-[#EAF0F5] text-[#013758] hover:bg-[#EAF0F5] border-none font-semibold text-[11px]">
                              {item.paymentLabel}
                            </Badge>
                          </>
                        )}
                        {item.status === 'pending' && (
                          <Badge className="bg-[#FBF2E3] text-[#865D23] hover:bg-[#FBF2E3] border-none font-semibold text-[11px] gap-1">
                            <Clock className="size-3" /> {item.statusLabel}
                          </Badge>
                        )}
                        {item.status === 'completed' && (
                          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none font-semibold text-[11px] gap-1">
                            <CheckCircle2 className="size-3" /> {item.statusLabel}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex flex-col md:flex-row gap-5">
                      <div className="relative w-full md:w-52 h-40 md:h-auto rounded-lg overflow-hidden shrink-0 bg-slate-100">
                        <Image
                          src={item.hotelImage}
                          alt={item.hotelName}
                          fill
                          className="object-cover"
                        />
                        <span className="absolute bottom-2 left-2 bg-white/90 px-2 py-0.5 rounded text-[10px] font-semibold text-[#202B36] shadow-xs">
                          {item.floorInfo}
                        </span>
                      </div>

                      <div className="flex flex-col justify-between flex-1 min-w-0 space-y-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-[#934a33] uppercase">{item.category}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-500 truncate flex items-center gap-1">
                              <MapPin className="size-3 text-slate-400" /> {item.address}
                            </span>
                          </div>

                          <h3 className="text-lg font-bold text-[#202B36] tracking-tight">{item.hotelName}</h3>
                          <p className="text-xs text-slate-600">
                            <strong>{item.roomType}</strong> • {item.bedType} • {item.guests}
                          </p>

                          <div className="p-2.5 bg-[#f1f3f9] rounded-lg text-xs flex items-center justify-between text-[#202B36]">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="size-4 text-[#013758]" />
                              <span><strong>Nhận:</strong> {item.checkIn}</span>
                            </div>
                            <span>→</span>
                            <div>
                              <span><strong>Trả:</strong> {item.checkOut}</span>
                              <span className="text-slate-500 ml-1">({item.nights} đêm)</span>
                            </div>
                          </div>
                        </div>

                        {/* Footer Price & Buttons */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 pt-2">
                          <div>
                            <span className="text-xl font-bold text-[#013758] block">{item.finalPrice}</span>
                            <span className="text-[11px] text-slate-400">Đã bao gồm thuế & phí dịch vụ</span>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                            {item.status === 'upcoming' && (
                              <>
                                <Link href="/booking/confirmation">
                                  <Button className="h-9 px-4 bg-[#013758] hover:bg-[#193B56] text-white text-xs font-bold gap-1.5 shadow-xs">
                                    <QrCode className="size-4" />
                                    <span>Xem voucher & Check-in</span>
                                  </Button>
                                </Link>
                                <Link href={`/account/bookings/${item.id}`}>
                                  <Button variant="outline" className="h-9 px-3 text-xs font-semibold border-slate-300">
                                    Chi tiết
                                  </Button>
                                </Link>
                              </>
                            )}

                            {item.status === 'pending' && (
                              <Link href="/booking/payment">
                                <Button className="h-9 px-4 bg-[#013758] hover:bg-[#193B56] text-white text-xs font-bold gap-1.5 shadow-xs">
                                  <span>Thanh toán ngay</span>
                                </Button>
                              </Link>
                            )}

                            {item.status === 'completed' && (
                              <>
                                <Button variant="outline" className="h-9 px-3 text-xs font-semibold border-[#934a33] text-[#934a33] hover:bg-[#F5EBE5] gap-1.5">
                                  <Star className="size-3.5 fill-[#934a33]" />
                                  <span>Viết đánh giá (+50 điểm)</span>
                                </Button>
                                <Link href="/booking">
                                  <Button variant="ghost" className="h-9 px-3 text-xs font-semibold text-slate-600 hover:text-[#013758] gap-1">
                                    <RefreshCcw className="size-3.5" />
                                    <span>Đặt lại</span>
                                  </Button>
                                </Link>
                              </>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>

                  </Card>
                ))}
              </div>

            </div>

            {/* RIGHT COLUMN: Sidebar (4 cols sticky) */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
              
              <Card className="bg-white rounded-xl p-5 shadow-xs border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-[#EDF4EE] text-[#35624A] flex items-center justify-center">
                    <ShieldCheck className="size-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#202B36]">StayReco Protect</h4>
                    <span className="text-xs text-[#35624A] font-semibold">Bảo vệ quyền lợi 100%</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mọi đặt phòng đều được bảo vệ toàn diện: Miễn phí hỗ trợ dời ngày khi có lý do chính đáng, xác nhận phòng tức thì, và đường dây nóng ưu tiên.
                </p>
                <div className="pt-2">
                  <Button variant="outline" className="w-full h-10 border-slate-300 text-xs font-bold text-[#013758] gap-2">
                    <Headset className="size-4" />
                    <span>Gọi tổng đài hỗ trợ: 1900 8899</span>
                  </Button>
                </div>
              </Card>

              {/* Guidelines */}
              <Card className="bg-white rounded-xl p-5 shadow-xs border border-slate-200/80 space-y-3">
                <h4 className="text-sm font-bold text-[#202B36]">Lưu ý nhận phòng (Check-in)</h4>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-[#934a33] font-bold">•</span>
                    <span>Xuất trình CCCD / Hộ chiếu bản gốc của người đại diện đặt phòng tại quầy lễ tân.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#934a33] font-bold">•</span>
                    <span>Sử dụng mã QR Voucher điện tử trên ứng dụng StayReco để thủ tục nhanh gọn dưới 2 phút.</span>
                  </li>
                </ul>
              </Card>

            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
