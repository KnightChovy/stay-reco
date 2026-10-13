'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Printer,
  MessageSquare,
  KeyRound,
  User,
  CheckCircle2,
  Phone,
  Mail,
  ShieldCheck,
  BedDouble,
  Calendar,
  Utensils,
  Coffee,
  Car,
  CreditCard,
  History,
  Lock,
  Save,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';

export default function StaffBookingDetailPage() {
  const [internalNote, setInternalNote] = useState('');
  const [noteSavedToast, setNoteSavedToast] = useState(false);

  const handleSaveNote = () => {
    if (!internalNote.trim()) return;
    setNoteSavedToast(true);
    setInternalNote('');
    setTimeout(() => setNoteSavedToast(false), 3000);
  };

  return (
    <div className="font-sans antialiased text-foreground">
      <main>
        <div className="p-8 space-y-6 pb-16">
          
          {/* Top Navigation & Action Banner */}
          <Card className="p-6 bg-white border border-border shadow-2xs rounded-2xl space-y-4">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <Link href="/staff/dashboard" className="hover:text-primary transition-colors">Tác vụ vận hành</Link>
              <ChevronRight className="size-3.5" />
              <Link href="/staff/bookings" className="hover:text-primary transition-colors">Danh sách đặt phòng</Link>
              <ChevronRight className="size-3.5" />
              <span className="font-bold text-foreground">Đơn #SR-261020-0842</span>
            </div>

            {/* Title & Primary Actions Area */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
                    Chi tiết & Xác nhận đặt phòng <span className="font-mono text-primary font-bold">#SR-261020-0842</span>
                  </h1>
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 font-semibold text-xs gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
                    Đã xác nhận tự động (StayReco App)
                  </Badge>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10 font-semibold text-xs gap-1">
                    <ShieldCheck className="size-3.5" />
                    Đã thanh toán 100% qua VNPay (2.250.000 ₫)
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                  <span>Kênh phân phối: <strong className="text-foreground">StayReco Direct OTA</strong></span>
                  <span>•</span>
                  <span>Thời gian tạo: <strong className="text-foreground">20/10/2026, 09:18</strong></span>
                  <span>•</span>
                  <span className="text-[#934a33] font-semibold">Boutique Riverfront Collection</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="h-11 px-4 bg-slate-50 text-foreground hover:bg-slate-100 text-xs font-semibold gap-2 border-border shadow-2xs"
                >
                  <Printer className="size-4" /> In phiếu đăng ký
                </Button>

                <Link href="/staff/inbox">
                  <Button variant="outline" className="h-11 px-4 bg-slate-50 text-primary hover:bg-slate-100 text-xs font-semibold gap-2 border-border">
                    <MessageSquare className="size-4" /> Nhắn tin cho khách
                  </Button>
                </Link>

                <Link href="/staff/check-in">
                  <Button className="h-11 px-5 bg-primary text-primary-foreground hover:bg-[#193b56] font-bold text-xs gap-2 shadow-xs">
                    <KeyRound className="size-4" /> Bắt đầu thủ tục Check-in
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* 2-Column Responsive Layout: 68% Left, 32% Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column (68%) */}
            <div className="lg:col-span-8 flex flex-col space-y-6">
              
              {/* Card 1: Guest Information & Identification */}
              <Card className="p-6 bg-white border border-border shadow-2xs rounded-2xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-orange-100 text-[#934a33] flex items-center justify-center font-bold">
                      <User className="size-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-foreground">Thông tin khách hàng & Định danh</h2>
                      <p className="text-xs text-muted-foreground">Hồ sơ luân chuyển du khách và xác thực cư trú</p>
                    </div>
                  </div>
                  <Badge className="bg-orange-100 text-[#934a33] font-bold text-xs border border-orange-200">
                    ★ Elite Bạc
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-border text-xs">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">Họ và tên khách</span>
                    <span className="text-sm font-bold text-foreground block mt-0.5">Nguyễn Minh Anh</span>
                    <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-600" /> Khách quen (3 lượt lưu trú)
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">Số điện thoại / Di động</span>
                    <span className="text-sm font-bold text-foreground font-mono block mt-0.5">0912 345 678</span>
                    <span className="text-[11px] text-muted-foreground block">Hỗ trợ Zalo / WhatsApp</span>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">Thư điện tử</span>
                    <span className="text-sm font-bold text-foreground font-mono truncate block mt-0.5">minhanh.traveler@gmail.com</span>
                    <span className="text-[11px] text-muted-foreground block">Đã gửi E-voucher</span>
                  </div>
                </div>

                {/* Identity Document Verification */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-border gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="size-6 text-primary shrink-0" />
                    <div>
                      <span className="font-bold text-foreground block">CCCD / Hộ chiếu điện tử: <span className="font-mono text-primary">04819500xxxx</span></span>
                      <span className="text-[11px] text-muted-foreground block">Tải lên qua eKYC StayReco cùng chữ ký số bảo mật</span>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200">
                    <CheckCircle2 className="size-3.5 mr-1 text-emerald-600" />
                    Đã khai báo trực tuyến hợp lệ
                  </Badge>
                </div>

                {/* Guest Notes */}
                <div className="p-4 rounded-xl bg-orange-50/80 border border-orange-200/70 space-y-1">
                  <div className="flex items-center gap-2 text-[#934a33] font-bold text-xs">
                    <Sparkles className="size-4" />
                    <span>Ghi chú & Nguyện vọng đặc biệt từ khách:</span>
                  </div>
                  <p className="text-xs text-foreground italic leading-relaxed pl-6">
                    “Phòng tầng cao, yên tĩnh tuyệt đối, view ngắm Cầu Rồng phun lửa cuối tuần. Chuẩn bị gối lông vũ mềm.”
                  </p>
                </div>
              </Card>

              {/* Card 2: Stay Information & Room Type */}
              <Card className="p-6 bg-white border border-border shadow-2xs rounded-2xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <BedDouble className="size-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-foreground">Thông tin kỳ nghỉ & Hạng phòng</h2>
                      <p className="text-xs text-muted-foreground">Thời gian lưu trú và đặc quyền dịch vụ kèm theo</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 text-xs font-mono font-bold rounded-lg bg-slate-100 text-foreground border border-border">
                    Phòng #608 (Tầng 6)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                  <div className="md:col-span-5 relative rounded-xl overflow-hidden min-h-[160px] shadow-2xs bg-slate-100">
                    <Image
                      src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"
                      alt="Deluxe River View"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-3 text-white">
                      <span className="text-[11px] font-bold uppercase">Deluxe River View</span>
                      <span className="text-xs font-semibold">28 m² • Hướng sông Hàn trực diện</span>
                    </div>
                  </div>

                  <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                    <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-border text-xs">
                      <div className="space-y-0.5 border-r border-border pr-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Nhận phòng (Check-in)</span>
                        <span className="text-sm font-bold text-primary block">14:00</span>
                        <span className="text-xs font-semibold text-foreground block">Thứ Ba, 20/10/2026</span>
                      </div>
                      <div className="space-y-0.5 pl-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Trả phòng (Check-out)</span>
                        <span className="text-sm font-bold text-[#934a33] block">12:00</span>
                        <span className="text-xs font-semibold text-foreground block">Thứ Năm, 22/10/2026</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-lg bg-slate-100 border border-border">
                        <span className="text-[10px] text-muted-foreground font-semibold block">Thời gian</span>
                        <span className="font-bold text-foreground block">2 đêm</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-100 border border-border">
                        <span className="text-[10px] text-muted-foreground font-semibold block">Số lượng khách</span>
                        <span className="font-bold text-foreground block">2 người lớn</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-100 border border-border">
                        <span className="text-[10px] text-muted-foreground font-semibold block">Quy cách giường</span>
                        <span className="font-bold text-foreground block">1 Giường King</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 text-xs">
                  <span className="font-bold text-foreground uppercase tracking-wider block">Gói dịch vụ và đặc quyền bao gồm:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-border">
                      <Utensils className="size-5 text-emerald-700 shrink-0" />
                      <span className="font-medium text-foreground">Buffet sáng hữu cơ hàng ngày</span>
                    </div>
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-border">
                      <Coffee className="size-5 text-[#934a33] shrink-0" />
                      <span className="font-medium text-foreground">Set trà chiều Hội An miễn phí</span>
                    </div>
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-border">
                      <Car className="size-5 text-primary shrink-0" />
                      <span className="font-medium text-foreground">Đưa đón sân bay 1 chiều</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Card 3: Financial Settlement & Invoicing */}
              <Card className="p-6 bg-white border border-border shadow-2xs rounded-2xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <CreditCard className="size-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-foreground">Chi tiết quyết toán tài chính</h2>
                      <p className="text-xs text-muted-foreground">Minh bạch biểu phí, ưu đãi & xác nhận thanh toán cổng trực tuyến</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-semibold text-muted-foreground bg-slate-100 px-2.5 py-1 rounded border border-border">
                    Mã GD: VNP142981023
                  </span>
                </div>

                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-muted-foreground uppercase text-[10px] font-bold border-b border-border">
                        <th className="py-2.5 px-3">Khoản mục chi phí</th>
                        <th className="py-2.5 px-3 text-center">Đơn vị tính</th>
                        <th className="py-2.5 px-3 text-right">Đơn giá</th>
                        <th className="py-2.5 px-3 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-foreground">Deluxe River View (2 khách)</div>
                          <div className="text-[11px] text-muted-foreground">Giai đoạn: 20/10 - 22/10/2026</div>
                        </td>
                        <td className="py-3 px-3 text-center">2 đêm</td>
                        <td className="py-3 px-3 text-right font-mono">1.250.000 ₫</td>
                        <td className="py-3 px-3 text-right font-mono font-bold">2.500.000 ₫</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-[#934a33]">Voucher đối tác: ANHNIEN250</div>
                          <div className="text-[11px] text-muted-foreground">Ưu đãi đón mùa thu StayReco Premium</div>
                        </td>
                        <td className="py-3 px-3 text-center">1 gói</td>
                        <td className="py-3 px-3 text-right font-mono text-[#934a33]">-250.000 ₫</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#934a33]">-250.000 ₫</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-foreground">Thuế giá trị gia tăng (GTGT 8%) & Phí dịch vụ (5%)</div>
                          <div className="text-[11px] text-muted-foreground">Quy chuẩn chính sách phòng nghỉ boutique</div>
                        </td>
                        <td className="py-3 px-3 text-center">Định mức</td>
                        <td className="py-3 px-3 text-right font-mono">—</td>
                        <td className="py-3 px-3 text-right font-semibold text-emerald-700">Đã bao gồm</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-4 rounded-xl bg-primary text-primary-foreground flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="size-6 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold block">Tình trạng: Đã thanh toán đầy đủ (0 ₫ dư nợ)</span>
                      <span className="text-[11px] text-white/80 block">Đã khớp lệnh đối soát hệ thống kế toán nội bộ</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-white/80 uppercase font-semibold block">Tổng quyết toán</span>
                    <span className="text-xl font-bold font-mono text-white block">2.250.000 ₫</span>
                  </div>
                </div>
              </Card>

              {/* Card 4: Event Timeline & Audit Log */}
              <Card className="p-6 bg-white border border-border shadow-2xs rounded-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-slate-100 text-foreground flex items-center justify-center font-bold">
                      <History className="size-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-foreground">Dòng thời gian sự kiện & Nhật ký thao tác</h2>
                      <p className="text-xs text-muted-foreground">Lịch sử tác vụ hệ thống không thể sửa đổi (Audit Log)</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono">3 bản ghi</span>
                </div>

                <div className="relative pl-6 space-y-5 border-l-2 border-slate-200 ml-2 text-xs">
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1 size-3.5 rounded-full bg-primary ring-4 ring-white" />
                    <div className="font-mono font-bold text-foreground">20/10/2026 • 09:30</div>
                    <p className="text-muted-foreground mt-0.5">
                      Lễ tân <strong className="text-foreground">Nguyễn Hương Ly</strong> đã kiểm tra yêu cầu phòng tầng cao và gắn ghi chú bố trí phòng 608 sẵn sàng.
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[31px] top-1 size-3.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                    <div className="font-mono font-bold text-foreground">20/10/2026 • 09:22</div>
                    <p className="text-muted-foreground mt-0.5">
                      Cổng <strong className="text-foreground">VNPay Gateway</strong> xác nhận thanh toán thành công giao dịch <strong className="text-foreground font-mono">2.250.000 ₫</strong> (IPN Token verified).
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[31px] top-1 size-3.5 rounded-full bg-slate-400 ring-4 ring-white" />
                    <div className="font-mono font-bold text-foreground">20/10/2026 • 09:18</div>
                    <p className="text-muted-foreground mt-0.5">
                      Khách hàng <strong className="text-foreground">Nguyễn Minh Anh</strong> tạo đơn trực tuyến qua StayReco Web App trên di động.
                    </p>
                  </div>
                </div>
              </Card>

            </div>

            {/* Right Column (32%) */}
            <div className="lg:col-span-4 flex flex-col space-y-6">
              
              {/* Card A: Operational Quick Tasks */}
              <Card className="p-6 bg-white border border-border shadow-2xs rounded-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <BedDouble className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Thao tác nghiệp vụ nhanh</h3>
                    <p className="text-[11px] text-muted-foreground">Điều phối buồng phòng & lưu chuyển</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-border space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-muted-foreground">Phân phòng vật lý</span>
                    <Badge className="bg-emerald-100 text-emerald-800 font-bold text-[10px]">Sạch sẵn sàng</Badge>
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-foreground block">Phòng 608</span>
                    <span className="text-xs text-muted-foreground">Tầng 6 (Góc sông yên tĩnh)</span>
                  </div>
                  <Link href="/staff/check-in" className="block">
                    <Button variant="outline" className="w-full h-9 text-xs font-semibold">
                      Đổi phòng vật lý
                    </Button>
                  </Link>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-border flex items-start gap-3 text-xs">
                  <Info className="size-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-foreground block">Yêu cầu thay đổi đặt phòng</span>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">Không có yêu cầu thay đổi ngày/khách từ khách hàng.</span>
                  </div>
                </div>

                <Link href="/staff/inbox" className="block pt-1">
                  <Button className="w-full h-11 bg-primary text-primary-foreground hover:bg-[#193b56] font-bold text-xs gap-2">
                    <MessageSquare className="size-4" /> Chuyển sang Unified Inbox
                  </Button>
                </Link>
              </Card>

              {/* Card B: Internal Department Notes */}
              <Card className="p-6 bg-white border border-border shadow-2xs rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-xl bg-orange-100 text-[#934a33] flex items-center justify-center font-bold">
                      <Lock className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Ghi chú nội bộ bộ phận</h3>
                      <span className="text-[10px] text-[#934a33] font-bold uppercase tracking-wider block">Chỉ nhân viên xem</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Textarea
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    placeholder="Nhập ghi chú cho ca tiếp theo (ví dụ: lưu ý chế độ ăn, giờ nhận phòng đặc biệt)..."
                    rows={3}
                    className="text-xs bg-slate-50 border-border focus-visible:ring-primary"
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleSaveNote} size="sm" className="h-8 bg-[#934a33] hover:bg-[#7a341e] text-white text-xs font-semibold gap-1.5">
                      <Save className="size-3.5" /> Lưu ghi chú
                    </Button>
                  </div>
                  {noteSavedToast && (
                    <p className="text-[11px] text-emerald-700 font-bold text-right">Đã cập nhật ghi chú nội bộ thành công!</p>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-border">
                  <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">Lịch sử ghi chú nội bộ</span>
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-border text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-primary">Lễ tân • Hương Ly</span>
                      <span className="font-mono text-muted-foreground">09:32 hôm nay</span>
                    </div>
                    <p className="text-foreground leading-relaxed">
                      “Khách quen StayReco, thích uống trà thảo mộc hoa cúc. Đã nhắc buồng phòng chuẩn bị sẵn set trà ấm trước 14:00.”
                    </p>
                  </div>
                </div>
              </Card>

              {/* Card C: Emergency Hotline */}
              <Card className="p-5 bg-white border border-border shadow-2xs rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
                    <Phone className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">StayReco Ops Support</h4>
                    <span className="text-[11px] text-muted-foreground block">Hotline hỗ trợ kỹ thuật</span>
                  </div>
                </div>
                <a href="tel:19006868" className="px-3 py-2 rounded-xl bg-red-600 text-white font-mono font-bold text-xs hover:bg-red-700 transition-colors shadow-2xs">
                  1900 6868
                </a>
              </Card>

            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
