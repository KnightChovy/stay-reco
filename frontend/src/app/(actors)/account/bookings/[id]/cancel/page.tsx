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
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  HelpCircle,
  Info,
  Lock,
  MapPin,
  Phone,
  ShieldCheck,
  XCircle,
  MessageSquare
} from 'lucide-react';

export default function CancelBookingPage() {
  const [reason, setReason] = useState('schedule_change');
  const [feedback, setFeedback] = useState('');
  const [confirmedIrreversible, setConfirmedIrreversible] = useState(false);
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased text-foreground">
      <Header />

      <main className="flex-1 w-full bg-[#f7f9ff] py-6 lg:py-10">
        <div className="mx-auto max-w-[100rem] px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb */}
          <AppBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Tài khoản', href: '/account/profile' },
              { label: 'Chuyến đi của tôi', href: '/account/bookings' },
              { label: 'Chi tiết #SR-261020-0842', href: '/account/bookings/SR-261020-0842' },
              { label: 'Hủy đặt phòng & Hoàn tiền', active: true },
            ]}
          />

          {/* Page Header */}
          <div className="mt-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold mb-3">
                <Info className="size-3.5" /> Thao tác xử lý đặt phòng
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Hủy đặt phòng & Yêu cầu hoàn tiền
              </h1>
              <p className="text-muted-foreground text-sm mt-1.5">
                Xem lại chính sách hủy, xác nhận lý do và kiểm tra số tiền hoàn lại trước khi gửi yêu cầu.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-border shadow-xs shrink-0 self-start md:self-auto">
              <div className="size-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Trạng thái hủy</span>
                <span className="text-xs sm:text-sm font-bold text-emerald-600">Miễn phí 100% phí hủy</span>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* 1. Free Cancellation Notice Banner */}
              <Card className="p-4 sm:p-5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl shadow-none flex items-start gap-4">
                <div className="p-2 rounded-lg bg-white text-emerald-600 shrink-0 shadow-xs">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-950">
                    Chính sách hủy phòng miễn phí có hiệu lực
                  </h4>
                  <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    Áp dụng đến <strong className="text-emerald-950 font-bold">14:00 ngày 18/10/2026</strong> (Giờ địa phương Đà Nẵng). Đơn của bạn đủ điều kiện <span className="font-bold text-emerald-700">hoàn tiền 100%</span> không phát sinh phí phụ thu.
                  </p>
                </div>
              </Card>

              {/* 2. Booking Summary Card */}
              <Card className="p-5 sm:p-6 bg-white border border-border shadow-xs rounded-xl space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <Calendar className="size-4 text-primary" /> Thông tin đơn đặt phòng
                  </div>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10 text-xs font-semibold">
                    Mã đơn: SR-261020-0842
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                  <div className="sm:col-span-4 relative h-32 w-full rounded-lg overflow-hidden shrink-0">
                    <Image
                      src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"
                      alt="An Nhiên Riverside Hotel"
                      fill
                      className="object-cover"
                    />
                    <span className="absolute bottom-2 left-2 bg-white/95 text-foreground text-[10px] px-2 py-0.5 rounded font-medium shadow-xs">
                      4-Star Boutique
                    </span>
                  </div>

                  <div className="sm:col-span-8 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-bold text-foreground">An Nhiên Riverside Hotel</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="size-3.5 text-primary" /> Đường Bạch Đằng, Quận Hải Châu, TP. Đà Nẵng
                        </p>
                      </div>
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                        ★ 4.9
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-lg text-xs border border-border mt-3">
                      <div>
                        <span className="text-[10px] text-muted-foreground block uppercase">Hạng phòng</span>
                        <span className="font-semibold text-foreground truncate block">Deluxe River View</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block uppercase">Lịch lưu trú</span>
                        <span className="font-semibold text-foreground block">20/10 – 22/10</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block uppercase">Khách</span>
                        <span className="font-semibold text-foreground block">2 người lớn</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 3. Financial Refund Breakdown */}
              <Card className="p-5 sm:p-6 bg-white border border-border shadow-xs rounded-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h2 className="text-base font-bold text-foreground uppercase tracking-wider">Chi tiết hoàn trả tài chính</h2>
                  <span className="text-xs text-muted-foreground">Phương thức: VNPay QR</span>
                </div>

                <div className="space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Giá niêm yết ban đầu (2 đêm)</span>
                    <span className="font-semibold text-foreground">2.500.000 ₫</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Voucher đã dùng (ANHNIEN250)</span>
                    <span className="font-semibold text-[#934a33]">-250.000 ₫</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      Số tiền thực tế đã thanh toán qua VNPay
                      <CheckCircle2 className="size-3.5 text-emerald-600" />
                    </span>
                    <span className="font-semibold text-foreground">2.250.000 ₫</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      Phí hủy theo chính sách
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold">Hủy trước 18/10</span>
                    </span>
                    <span className="font-semibold text-emerald-600">0 ₫ (Miễn phí)</span>
                  </div>

                  <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs text-muted-foreground uppercase font-semibold block">Ước tính số tiền hoàn lại</span>
                      <span className="text-2xl font-bold text-primary">2.250.000 ₫</span>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
                        <CheckCircle2 className="size-3.5" /> Hoàn 100% không mất phí
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Voucher ANHNIEN250 sẽ hoàn về ví voucher
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-muted-foreground">
                    <div className="p-3 bg-slate-100/60 rounded-lg flex items-start gap-2">
                      <CreditCard className="size-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground block">Tài khoản thụ hưởng:</strong>
                        Hoàn tiền trực tiếp về tài khoản nguồn VNPay / Thẻ ngân hàng đã thanh toán.
                      </div>
                    </div>
                    <div className="p-3 bg-slate-100/60 rounded-lg flex items-start gap-2">
                      <Clock className="size-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground block">Thời gian xử lý:</strong>
                        Từ 2 – 5 ngày làm việc tùy thuộc vào quy định ngân hàng phát hành thẻ.
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 4. Cancellation Reason Form */}
              <Card className="p-5 sm:p-6 bg-white border border-border shadow-xs rounded-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h2 className="text-base font-bold text-foreground uppercase tracking-wider">Lý do hủy đặt phòng</h2>
                  <span className="text-xs text-red-500 font-medium">* Bắt buộc chọn 1 lý do</span>
                </div>

                <div className="space-y-3">
                  {[
                    { id: 'schedule_change', title: 'Thay đổi kế hoạch / công tác', desc: 'Lịch trình cá nhân cần điều chỉnh' },
                    { id: 'better_stay', title: 'Tìm được chỗ nghỉ khác', desc: 'Phù hợp vị trí hoặc ngân sách hơn' },
                    { id: 'health_issue', title: 'Vấn đề sức khỏe cá nhân', desc: 'Lý do sức khỏe gia đình hoặc bản thân' },
                    { id: 'weather_flight', title: 'Thời tiết / chuyến bay hoãn', desc: 'Phương tiện di chuyển gặp sự cố' },
                    { id: 'other', title: 'Lý do khác', desc: 'Vui lòng cung cấp chi tiết bên dưới' },
                  ].map((item) => (
                    <label
                      key={item.id}
                      onClick={() => setReason(item.id)}
                      className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                        reason === item.id ? 'border-primary bg-primary/5 shadow-xs' : 'border-border hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cancel_reason"
                        checked={reason === item.id}
                        onChange={() => setReason(item.id)}
                        className="size-4 accent-primary"
                      />
                      <div>
                        <span className="text-xs sm:text-sm font-semibold text-foreground block">{item.title}</span>
                        <span className="text-[11px] text-muted-foreground">{item.desc}</span>
                      </div>
                    </label>
                  ))}

                  <div className="pt-2 space-y-1.5">
                    <label htmlFor="feedback" className="text-xs font-semibold text-foreground block">
                      Ghi chú thêm hoặc góp ý cho khách sạn <span className="text-muted-foreground font-normal">(Không bắt buộc)</span>
                    </label>
                    <textarea
                      id="feedback"
                      rows={3}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Chia sẻ lý do cụ thể hơn để khách sạn An Nhiên Riverside và StayReco nâng cao chất lượng dịch vụ..."
                      className="w-full p-3 bg-slate-50 text-foreground text-sm rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>
                </div>

                {/* Warning & Irreversible Checkbox */}
                <div className="p-4 bg-red-50/80 rounded-xl border border-red-200/60 space-y-3">
                  <div className="flex items-center gap-2 text-red-700 font-bold text-xs sm:text-sm">
                    <AlertTriangle className="size-4 shrink-0" />
                    <span>Lưu ý quan trọng trước khi hoàn tất hủy</span>
                  </div>
                  <ul className="text-xs text-red-600 space-y-1.5 list-disc pl-5">
                    <li>Sau khi xác nhận hủy, phòng <strong>Deluxe River View (#608)</strong> sẽ được mở lại công khai cho khách hàng khác đặt.</li>
                    <li>Mã QR E-Voucher và quyền lợi check-in ưu tiên hiện tại sẽ bị vô hiệu hóa ngay lập tức.</li>
                    <li>Hệ thống sẽ gửi email biên lai hoàn tiền chính thức về hộp thư của bạn (minhanh.nguyen@email.vn).</li>
                  </ul>

                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="irreversible"
                      checked={confirmedIrreversible}
                      onCheckedChange={(checked) => setConfirmedIrreversible(!!checked)}
                    />
                    <label
                      htmlFor="irreversible"
                      className="text-xs font-semibold text-foreground cursor-pointer select-none"
                    >
                      Tôi hiểu rằng thao tác hủy phòng này không thể đảo ngược.
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
                  <Link href="/account/bookings/SR-261020-0842" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full sm:w-auto h-11 px-6 text-xs sm:text-sm font-semibold gap-2">
                      <ArrowLeft className="size-4" /> Giữ đặt phòng & Quay lại chi tiết đơn
                    </Button>
                  </Link>

                  <Button
                    disabled={!confirmedIrreversible}
                    onClick={() => setShowModal(true)}
                    className={`w-full sm:w-auto h-11 px-6 font-bold text-xs sm:text-sm gap-2 transition-all ${
                      confirmedIrreversible
                        ? 'bg-red-600 text-white hover:bg-red-700 shadow-md'
                        : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <XCircle className="size-4" /> Xác nhận hủy đặt phòng (Nhận hoàn 2.250.000 ₫)
                  </Button>
                </div>
              </Card>

            </div>

            {/* Right Column (4 cols) */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              
              {/* Reschedule Option */}
              <Card className="p-5 bg-linear-to-br from-primary to-[#122e44] text-white rounded-xl shadow-md space-y-4">
                <div className="size-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Calendar className="size-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Cân nhắc dời ngày thay vì hủy?</h3>
                  <p className="text-xs text-white/80 mt-1 leading-relaxed">
                    Bạn vẫn yêu thích An Nhiên Riverside Hotel nhưng vướng lịch bận? Đổi ngày lưu trú linh hoạt hoàn toàn <strong className="text-white font-bold">miễn phí phụ thu</strong> cho các kỳ nghỉ trong 6 tháng tới.
                  </p>
                </div>

                <Link href="/account/bookings/SR-261020-0842/change" className="block pt-2">
                  <Button className="w-full h-10 bg-[#934a33] hover:bg-[#7a341e] text-white font-semibold text-xs gap-2">
                    <Calendar className="size-4" /> Đổi ngày lưu trú miễn phí
                  </Button>
                </Link>
              </Card>

              {/* Property Image Card */}
              <Card className="rounded-xl overflow-hidden border border-border shadow-xs">
                <div className="relative h-36 w-full">
                  <Image
                    src="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80"
                    alt="An Nhiên Riverside Resort"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[10px] font-medium text-emerald-300"> tiêu chuẩn StayReco</span>
                    <h4 className="font-bold text-xs sm:text-sm truncate">An Nhiên Riverside Hotel</h4>
                  </div>
                </div>
                <div className="p-3 bg-white flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <CheckCircle2 className="size-3.5" /> 100% phòng kiểm định
                  </span>
                  <span className="font-medium text-primary">Đà Nẵng</span>
                </div>
              </Card>

              {/* StayReco Support */}
              <Card className="p-5 bg-white border border-border shadow-xs rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-foreground font-bold text-sm border-b border-border pb-3">
                  <Phone className="size-4 text-primary" /> Hỗ trợ khách hàng StayReco Care
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="size-10 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                    MA
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Chuyên viên hỗ trợ cá nhân</h4>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-600" /> Trực tuyến 24/7
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-1 text-xs">
                  <a
                    href="tel:19006868"
                    className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg font-semibold text-foreground border border-border transition-colors w-full"
                  >
                    <span className="flex items-center gap-2">
                      <Phone className="size-4 text-primary" /> 1900 6868
                    </span>
                    <span className="text-[10px] text-muted-foreground font-normal">Miễn phí cước</span>
                  </a>
                  <Button variant="outline" className="w-full h-9 justify-center gap-2 text-xs font-semibold">
                    <MessageSquare className="size-4 text-primary" /> Chat với lễ tân An Nhiên
                  </Button>
                </div>
              </Card>

              {/* Guarantee */}
              <div className="p-4 bg-slate-100 rounded-xl border border-slate-200/80 flex items-start gap-3 text-xs text-muted-foreground">
                <Lock className="size-5 text-primary shrink-0 mt-0.5" />
                <span>Giao dịch hoàn tiền tuân thủ quy chuẩn mã hóa 256-bit SSL và tiêu chuẩn bảo vệ quyền lợi du khách của StayReco Vietnam.</span>
              </div>

            </div>

          </div>

        </div>
      </main>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-xl text-center space-y-4">
            <div className="size-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-8" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Yêu cầu hủy đã được ghi nhận</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Mã đặt phòng <strong className="text-foreground">#SR-261020-0842</strong> đã được hủy thành công. Số tiền <strong className="text-primary font-bold">2.250.000 ₫</strong> đang được hoàn về tài khoản VNPay của bạn.
            </p>

            <div className="bg-slate-50 p-3 rounded-lg text-xs text-left space-y-1.5 border border-border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mã hoàn tiền:</span>
                <span className="font-mono font-bold text-foreground">RF-2026-98124</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Thời gian xử lý dự kiến:</span>
                <span className="font-semibold text-foreground">1 - 3 ngày làm việc</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Voucher hoàn trả:</span>
                <span className="font-semibold text-[#934a33]">ANHNIEN250 (+250k)</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Link href="/account/bookings" className="block">
                <Button className="w-full h-10 bg-primary text-primary-foreground font-semibold text-xs sm:text-sm">
                  Về trang Chuyến đi của tôi
                </Button>
              </Link>
              <Button
                variant="ghost"
                onClick={() => setShowModal(false)}
                className="w-full h-9 text-xs text-muted-foreground hover:text-foreground"
              >
                Đóng thông báo
              </Button>
            </div>
          </Card>
        </div>
      )}

      <Footer />
    </div>
  );
}
