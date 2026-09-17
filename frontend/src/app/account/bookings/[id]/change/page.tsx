'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppBreadcrumb from '@/common/breadcrumb/AppBreadcrumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Building2,
  Users,
  Info,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  HelpCircle,
  Phone,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function ChangeBookingPage() {
  const [selectedRoom, setSelectedRoom] = useState<'keep' | 'upgrade'>('keep');
  const [reason, setReason] = useState('business');
  const [specialRequests, setSpecialRequests] = useState('');
  const [checkInDate, setCheckInDate] = useState('22/10/2026');
  const [checkOutDate, setCheckOutDate] = useState('24/10/2026');

  const additionalPayment = selectedRoom === 'upgrade' ? 1200000 : 200000;

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased text-foreground">
      <Header />

      <main className="flex-1 w-full bg-[#f7f9ff] py-6 lg:py-10">
        <div className="mx-auto max-w-[100rem] px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumbs */}
          <AppBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Tài khoản', href: '/account/profile' },
              { label: 'Chuyến đi của tôi', href: '/account/bookings' },
              { label: 'Chi tiết #SR-261020-0842', href: '/account/bookings/SR-261020-0842' },
              { label: 'Yêu cầu thay đổi đặt phòng', active: true },
            ]}
          />

          {/* Page Header */}
          <div className="mt-6 mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
              <Calendar className="size-3.5" /> Quản lý lịch lưu trú linh hoạt
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Yêu cầu thay đổi đặt phòng
            </h1>
            <p className="text-muted-foreground text-sm mt-1.5 max-w-3xl">
              Điều chỉnh ngày lưu trú, số lượng khách hoặc loại phòng cho đơn <span className="font-semibold text-foreground">#SR-261020-0842</span>. Hệ thống sẽ kiểm tra phòng trống thực tế và chính sách áp dụng.
            </p>
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Form & Matrix (~68%) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* 1. Notice Card */}
              <Card className="p-4 sm:p-5 bg-slate-100/80 border border-slate-200/80 rounded-xl shadow-none flex items-start gap-3">
                <div className="size-8 rounded-full bg-white text-primary flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Info className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Đảm bảo trạng thái phòng hiện tại</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Đơn phòng hiện tại vẫn được giữ nguyên cho đến khi yêu cầu thay đổi được duyệt hoặc thanh toán phần chênh lệch (nếu có). Bạn không bị hủy phòng khi đang thao tác.
                  </p>
                </div>
              </Card>

              {/* 2. Side-by-Side Comparison Matrix */}
              <Card className="p-5 sm:p-6 bg-white border border-border shadow-xs rounded-xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <h2 className="text-lg font-bold text-foreground">So sánh chi tiết trước và sau thay đổi</h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-primary text-xs font-semibold">
                    <RefreshCw className="size-3.5" /> Cập nhật tức thời
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Current Selection */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 relative flex flex-col justify-between">
                    <div className="absolute top-0 right-0 bg-slate-200 text-slate-700 text-[11px] px-2.5 py-0.5 rounded-bl-lg font-semibold">
                      Đang kích hoạt
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">
                        <Building2 className="size-4 text-primary" /> Lựa chọn hiện tại
                      </div>
                      <h3 className="font-bold text-sm text-foreground">An Nhiên Riverside Hotel</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Phòng Deluxe River View • Tầng 6 (P.608)
                      </p>

                      <div className="my-4 p-3 bg-white rounded-lg border border-slate-200/60 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nhận phòng:</span>
                          <span className="font-semibold text-foreground">14:00 • 20/10/2026 (T3)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Trả phòng:</span>
                          <span className="font-semibold text-foreground">12:00 • 22/10/2026 (T5)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Số khách:</span>
                          <span className="font-semibold text-foreground">2 người lớn (2 đêm)</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-muted-foreground block">Đã thanh toán trước:</span>
                      <span className="text-xl font-bold text-primary">2.250.000 ₫</span>
                      <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                        <CheckCircle2 className="size-3.5" /> Đã áp voucher ANHNIEN250 (-250k)
                      </p>
                    </div>
                  </div>

                  {/* New Selection (Interactive) */}
                  <div className="bg-white rounded-xl p-4 border-2 border-primary/30 shadow-xs flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5 text-xs text-[#934a33] uppercase tracking-wider font-bold">
                          <Calendar className="size-4" /> Lựa chọn đề xuất mới
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 text-[11px]">
                          Còn 3 phòng trống
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-border">
                            <label className="text-[11px] text-muted-foreground block">Ngày nhận mới</label>
                            <input
                              type="text"
                              value={checkInDate}
                              onChange={(e) => setCheckInDate(e.target.value)}
                              className="font-bold text-xs text-foreground bg-transparent w-full focus:outline-none"
                            />
                            <span className="text-[10px] text-muted-foreground block">Thứ Năm (14:00)</span>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-border">
                            <label className="text-[11px] text-muted-foreground block">Ngày trả mới</label>
                            <input
                              type="text"
                              value={checkOutDate}
                              onChange={(e) => setCheckOutDate(e.target.value)}
                              className="font-bold text-xs text-foreground bg-transparent w-full focus:outline-none"
                            />
                            <span className="text-[10px] text-muted-foreground block">Thứ Bảy (12:00)</span>
                          </div>
                        </div>

                        {/* Room Select */}
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground block font-medium">Loại phòng đề xuất</label>
                          <select
                            value={selectedRoom}
                            onChange={(e) => setSelectedRoom(e.target.value as 'keep' | 'upgrade')}
                            className="w-full h-10 px-3 bg-slate-50 text-foreground text-xs font-semibold rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="keep">Giữ nguyên: Deluxe River View (Giá cuối tuần)</option>
                            <option value="upgrade">Nâng cấp: Grand Suite Riverfront (+500.000 ₫/đêm)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground block font-medium">Số lượng khách</label>
                          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs border border-border">
                            <span className="font-semibold text-foreground">2 người lớn (Tiêu chuẩn)</span>
                            <span className="text-muted-foreground text-[11px]">Tối đa 2 khách</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-muted-foreground">Đơn giá mới ước tính:</span>
                        <span className="text-xl font-bold text-foreground">
                          {selectedRoom === 'upgrade' ? '3.450.000 ₫' : '2.450.000 ₫'}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground text-right mt-0.5">
                        Đã tính 2 đêm cuối tuần & bảo lưu voucher
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 3. Reason & Notes Form */}
              <Card className="p-5 sm:p-6 bg-white border border-border shadow-xs rounded-xl space-y-4">
                <h2 className="text-lg font-bold text-foreground">Lý do & Yêu cầu gửi khách sạn</h2>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-semibold text-foreground block">
                      Lý do thay đổi lịch trình <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full h-11 px-3 bg-slate-50 text-foreground text-sm font-medium rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="flight">Lịch trình máy bay thay đổi / delay chuyến</option>
                      <option value="business">Kế hoạch công tác dời ngày sang cuối tuần</option>
                      <option value="personal">Lý do sức khỏe hoặc việc gia đình cá nhân</option>
                      <option value="other">Lý do khác</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-semibold text-foreground block">
                      Ghi chú bổ sung gửi lễ tân
                    </label>
                    <textarea
                      rows={3}
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="Nhắn gửi cụ thể yêu cầu của bạn, ví dụ: hỗ trợ nhận phòng sớm nếu phòng sẵn sàng, yêu cầu nôi em bé hoặc tầng cao..."
                      className="w-full p-3 bg-slate-50 text-foreground text-sm rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                    <span className="text-xs text-muted-foreground block">Khách sạn sẽ ghi nhận và phản hồi kèm xác nhận thay đổi phòng.</span>
                  </div>
                </div>
              </Card>

              {/* 4. Financial Difference Breakdown */}
              <Card className="p-5 sm:p-6 bg-white border border-border shadow-xs rounded-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h2 className="text-lg font-bold text-foreground">Chi tiết chênh lệch tài chính</h2>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10 text-xs">
                    Bảo lưu 100% quyền lợi
                  </Badge>
                </div>

                <div className="space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      Tiền phòng mới ({selectedRoom === 'upgrade' ? '2 đêm Suite × 1.850.000 ₫' : '2 đêm cuối tuần × 1.350.000 ₫'})
                      <HelpCircle className="size-3.5 text-muted-foreground" />
                    </span>
                    <span className="font-semibold text-foreground">
                      {selectedRoom === 'upgrade' ? '3.700.000 ₫' : '2.700.000 ₫'}
                    </span>
                  </div>

                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span className="flex items-center gap-1">
                      <Sparkles className="size-3.5" /> Voucher ANHNIEN250 bảo lưu
                    </span>
                    <span className="font-semibold">-250.000 ₫</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg font-semibold text-foreground">
                    <span>Tổng giá trị đơn phòng mới</span>
                    <span>{selectedRoom === 'upgrade' ? '3.450.000 ₫' : '2.450.000 ₫'}</span>
                  </div>

                  <div className="flex justify-between text-muted-foreground">
                    <span>Số tiền đã thanh toán trước đó (#SR-261020-0842)</span>
                    <span className="font-semibold text-foreground">-2.250.000 ₫</span>
                  </div>

                  <div className="flex justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      Phí thay đổi dịch vụ (Chính sách trước 18/10)
                      <span className="px-1.5 py-0.5 text-emerald-700 bg-emerald-50 rounded text-[11px] font-semibold">Miễn phí</span>
                    </span>
                    <span className="font-semibold text-emerald-600">0 ₫</span>
                  </div>

                  <div className="mt-4 p-4 bg-orange-50/80 rounded-xl border border-orange-200/60 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#934a33] text-sm block">Số tiền cần thanh toán bổ sung:</span>
                      <span className="text-xs text-muted-foreground">Chênh lệch do dời vào 2 đêm cuối tuần</span>
                    </div>
                    <span className="text-2xl font-bold text-[#934a33]">
                      {additionalPayment.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>
              </Card>

              {/* 5. Actions CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 mb-10">
                <Link href="/account/bookings/SR-261020-0842" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto h-11 px-6 font-semibold text-xs sm:text-sm gap-2"
                  >
                    <ArrowLeft className="size-4" />
                    <span>Giữ nguyên đơn phòng & Quay lại</span>
                  </Button>
                </Link>

                <Button
                  onClick={() => alert(`Yêu cầu thay đổi đặt phòng đã gửi thành công! Số tiền thanh toán bổ sung: ${additionalPayment.toLocaleString('vi-VN')} ₫`)}
                  className="w-full sm:w-auto h-11 px-8 bg-primary text-primary-foreground hover:bg-[#193b56] font-bold text-xs sm:text-sm gap-2 shadow-md"
                >
                  <span>Gửi yêu cầu thay đổi (Thanh toán bổ sung {additionalPayment.toLocaleString('vi-VN')} ₫)</span>
                  <ArrowRight className="size-4" />
                </Button>
              </div>

            </div>

            {/* Right Column: Sidebar (~32%) */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              
              {/* Hotel Banner */}
              <Card className="rounded-xl overflow-hidden border border-border shadow-xs">
                <div className="relative h-36 w-full">
                  <Image
                    src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"
                    alt="An Nhiên Riverside Hotel"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white">
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-white/20 backdrop-blur-md px-2 py-0.5 rounded">
                      Verified Partner
                    </span>
                    <h3 className="font-bold text-sm mt-1">An Nhiên Riverside Hotel Đà Nẵng</h3>
                  </div>
                </div>
              </Card>

              {/* Policy Card */}
              <Card className="p-5 bg-white border border-border shadow-xs rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-sm border-b border-border pb-3">
                  <ShieldCheck className="size-5" />
                  <span>Chính sách thay đổi linh hoạt</span>
                </div>

                <ul className="space-y-3 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong className="text-foreground">Miễn phí thay đổi:</strong> Hoàn toàn miễn phí khi gửi yêu cầu trước <strong className="text-foreground">14:00 ngày 18/10/2026</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                    <span><strong className="text-foreground">Chênh lệch giá:</strong> Phụ thuộc vào loại phòng mới, ngày trong tuần hoặc cuối tuần tại thời điểm xác nhận.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                    <span><strong className="text-foreground">Thời gian xử lý:</strong> Lễ tân An Nhiên Riverside sẽ tiếp nhận và duyệt trong vòng <strong className="text-foreground">30 phút</strong> làm việc.</span>
                  </li>
                </ul>

                <div className="p-3 bg-amber-50 rounded-lg text-xs text-amber-800 border border-amber-200/60 font-medium">
                  Voucher ANHNIEN250 vẫn giữ nguyên hiệu lực nếu dời trước 30/11/2026.
                </div>
              </Card>

              {/* Front Desk Support */}
              <Card className="p-5 bg-white border border-border shadow-xs rounded-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h3 className="font-bold text-sm text-foreground">Lễ tân hỗ trợ trực tiếp</h3>
                  <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 text-[10px] gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" /> Đang trực
                  </Badge>
                </div>

                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                    HL
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-foreground">Nguyễn Hương Ly</h4>
                    <p className="text-[11px] text-muted-foreground">Trưởng ca lễ tân • An Nhiên Riverside</p>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <a
                    href="tel:02363888999"
                    className="flex items-center justify-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-semibold text-foreground border border-border transition-colors w-full"
                  >
                    <Phone className="size-4 text-primary" /> Hotline: 0236 3888 999
                  </a>
                  <Button
                    variant="outline"
                    className="w-full h-9 justify-center gap-2 border-border text-xs font-semibold"
                  >
                    <MessageSquare className="size-4 text-primary" /> Nhắn tin trực tiếp với Lễ tân
                  </Button>
                </div>
              </Card>

              {/* Guarantee Shield */}
              <div className="p-4 bg-slate-100 rounded-xl border border-slate-200/80 flex items-start gap-3">
                <ShieldCheck className="size-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-foreground">StayReco Guarantee</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Bảo đảm quyền lợi tối đa cho khách hàng. Nếu yêu cầu thay đổi ngày không thể thực hiện, đơn phòng gốc của bạn được bảo lưu 100% không tổn thất.
                  </p>
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
