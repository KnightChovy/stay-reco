'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Copy,
  Clock,
  QrCode,
  CreditCard,
  Building2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Headset,
  Lock,
  ExternalLink,
  Star,
  RefreshCw,
  Timer
} from 'lucide-react';

export default function PaymentPage() {
  const [selectedMethod, setSelectedMethod] = useState<'vnpay' | 'atm' | 'card'>('vnpay');
  const [timeLeft, setTimeLeft] = useState(438); // 07:18 in seconds
  const [qrTimer, setQrTimer] = useState(298); // 04:58 in seconds
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    if (qrTimer <= 0) return;
    const timer = setInterval(() => setQrTimer((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [qrTimer]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
        {/* Countdown Hold Banner */}
        <section className="w-full bg-[#FBF2E3] px-4 sm:px-6 py-2.5 shadow-xs border-b border-[#f3e3c8]">
          <div className="max-w-marketplace mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[#865D23] text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <Timer className="size-4 text-[#865D23] animate-pulse shrink-0" />
              <p>
                Đơn đặt phòng đang được giữ chỗ tạm thời trong <span className="font-bold font-mono bg-white/60 px-1.5 py-0.5 rounded">{formatTimer(timeLeft)}</span> phút. Vui lòng hoàn tất thanh toán trước khi hết hạn giữ phòng.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold shrink-0">
              <Lock className="size-3.5" />
              <span>Cam kết không tăng giá phòng</span>
            </div>
          </div>
        </section>

        {/* MAIN CANVAS */}
        <div className="max-w-marketplace mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Payment Selection & QR (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Booking ID Header Card */}
              <Card className="bg-white rounded-xl p-5 shadow-xs border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">Mã đơn đặt phòng lưu trú</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xl font-bold text-[#202B36] tracking-tight">SR-261020-0842</span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode('SR-261020-0842')}
                      className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-[#013758] transition-colors"
                      title="Sao chép mã đơn"
                    >
                      <Copy className="size-4" />
                    </button>
                    {copied && <span className="text-xs text-[#35624A] font-semibold">Đã chép!</span>}
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBF2E3] text-[#865D23] text-xs font-semibold">
                    <span className="size-2 rounded-full bg-[#865D23] animate-ping" />
                    Chờ thanh toán / Payment Pending
                  </span>
                  <span className="text-[11px] text-slate-400">Khởi tạo lúc 09:18 - 20/10/2026</span>
                </div>
              </Card>

              {/* Payment Gateway Panel */}
              <Card className="bg-white rounded-xl p-5 sm:p-7 shadow-xs border border-slate-200/80 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#202B36]">Phương thức thanh toán</h2>
                  <p className="text-xs text-slate-500 mt-1">Chọn phương thức thuận tiện nhất để kích hoạt mã voucher nhận phòng tức thì.</p>
                </div>

                {/* Method 1: VNPay QR */}
                <div
                  onClick={() => setSelectedMethod('vnpay')}
                  className={`rounded-xl p-5 shadow-xs transition-all cursor-pointer ${
                    selectedMethod === 'vnpay'
                      ? 'bg-[#f1f3f9] border-2 border-[#234e70]'
                      : 'bg-white border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="size-5 mt-0.5 rounded-full bg-[#234e70] flex items-center justify-center shrink-0">
                        <div className="size-2 rounded-full bg-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-[#202B36]">Cổng thanh toán VNPay Gateway</span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-[#EDF4EE] text-[#35624A] font-semibold">Khuyên dùng • Tức thì</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Hỗ trợ quét VNPAY-QR qua 40+ ứng dụng ngân hàng và ví điện tử, Thẻ ATM nội địa hoặc Quốc tế.
                        </p>
                      </div>
                    </div>
                    <span className="font-black text-sm text-[#013758] bg-white px-2 py-1 rounded shadow-xs shrink-0">
                      VN<span className="text-[#934a33]">PAY</span>
                    </span>
                  </div>

                  {/* Bank Badges */}
                  <div className="bg-white rounded-lg p-3 mt-4 space-y-1.5">
                    <span className="text-[11px] text-slate-400 block">Ứng dụng ngân hàng & thẻ được hỗ trợ phổ biến:</span>
                    <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
                      {['Vietcombank', 'Techcombank', 'BIDV', 'MBBank', 'Agribank'].map((bank) => (
                        <span key={bank} className="px-2 py-0.5 rounded bg-[#eceef4] text-[#202B36]">{bank}</span>
                      ))}
                      <span className="px-2 py-0.5 rounded bg-[#EAF0F5] text-[#013758]">Visa</span>
                      <span className="px-2 py-0.5 rounded bg-[#F5EBE5] text-[#934a33]">Mastercard</span>
                      <span className="px-2 py-0.5 rounded bg-[#234e70] text-white">VNPAY-QR</span>
                    </div>
                  </div>

                  {/* QR Box Visual */}
                  <div className="bg-white rounded-xl p-5 mt-4 flex flex-col md:flex-row items-center gap-6 shadow-xs border border-slate-100">
                    <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg shrink-0">
                      <div className="relative size-44 bg-white p-2 rounded-md shadow-xs flex items-center justify-center">
                        <Image
                          src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=STAYRECO_ORDER_SR-261020-0842"
                          alt="Mã QR Thanh toán VNPay"
                          width={160}
                          height={160}
                          className="rounded-md"
                        />
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                        <RefreshCw className="size-3 text-slate-400" />
                        <span>Mã làm mới sau <strong className="text-[#202B36]">{formatTimer(qrTimer)}</strong></span>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs flex-1">
                      <span className="px-2.5 py-1 rounded-full bg-[#F5EBE5] text-[#934a33] font-semibold text-xs inline-block">
                        Quét mã VNPAY-QR để thanh toán nhanh
                      </span>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Số tiền thanh toán chính xác:</span>
                        <span className="text-2xl font-bold text-[#013758]">2.250.000 ₫</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        Mở ứng dụng <strong>Mobile Banking</strong> hoặc ví <strong>VNPAY</strong>, chọn <strong>Quét QR</strong> và hướng camera vào mã bên trái.
                      </p>
                      <div className="bg-[#f1f3f9] rounded-lg p-2.5 text-xs text-slate-600 flex items-center gap-1.5">
                        <CheckCircle2 className="size-4 text-[#35624A] shrink-0" />
                        <span>Nội dung giao dịch tự động: <strong className="font-mono text-[#202B36]">STAYRECO SR2610200842</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5 text-[11px] text-slate-500 mt-4">
                    <ShieldCheck className="size-4 text-[#013758] shrink-0 mt-0.5" />
                    <span>Toàn bộ giao dịch được bảo mật và mã hóa chuẩn PCI-DSS Level 1 bởi VNPay Payment Gateway.</span>
                  </div>
                </div>

                {/* Method 2: Domestic ATM */}
                <div
                  onClick={() => setSelectedMethod('atm')}
                  className={`rounded-xl p-4 shadow-xs transition-all cursor-pointer flex items-center justify-between ${
                    selectedMethod === 'atm'
                      ? 'bg-[#f1f3f9] border-2 border-[#234e70]'
                      : 'bg-white border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`size-5 rounded-full border flex items-center justify-center ${selectedMethod === 'atm' ? 'border-[#234e70] bg-[#234e70]' : 'border-slate-300'}`}>
                      {selectedMethod === 'atm' && <div className="size-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-[#202B36] block">Thẻ ATM / Tài khoản ngân hàng nội địa (qua VNPay)</span>
                      <span className="text-xs text-slate-500">Miễn phí giao dịch • Chuyển hướng nhập số thẻ ATM an toàn</span>
                    </div>
                  </div>
                  <CreditCard className="size-5 text-slate-400" />
                </div>

                {/* Method 3: Credit Card */}
                <div
                  onClick={() => setSelectedMethod('card')}
                  className={`rounded-xl p-4 shadow-xs transition-all cursor-pointer flex items-center justify-between ${
                    selectedMethod === 'card'
                      ? 'bg-[#f1f3f9] border-2 border-[#234e70]'
                      : 'bg-white border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`size-5 rounded-full border flex items-center justify-center ${selectedMethod === 'card' ? 'border-[#234e70] bg-[#234e70]' : 'border-slate-300'}`}>
                      {selectedMethod === 'card' && <div className="size-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-[#202B36] block">Thẻ quốc tế Visa / Mastercard / JCB (qua VNPay)</span>
                      <span className="text-xs text-slate-500">Áp dụng công nghệ 3D Secure OTP xác thực hai lớp</span>
                    </div>
                  </div>
                  <CreditCard className="size-5 text-slate-400" />
                </div>

                {/* Checkout Actions */}
                <div className="space-y-3 pt-2">
                  <Link href="/booking/confirmation" className="block">
                    <Button className="w-full h-12 bg-[#234e70] hover:bg-[#193B56] text-white font-bold text-sm rounded-lg shadow-md gap-2">
                      <RefreshCw className="size-4" />
                      <span>Xác nhận đã chuyển khoản / Kiểm tra trạng thái thanh toán</span>
                    </Button>
                  </Link>

                  <Button variant="outline" className="w-full h-11 border-slate-300 text-[#202B36] font-semibold text-xs gap-1.5">
                    <span>Thanh toán qua cổng VNPay chuyển hướng</span>
                    <ExternalLink className="size-4 text-slate-500" />
                  </Button>

                  <div className="text-center pt-2">
                    <Link href="/booking" className="text-xs text-slate-500 hover:text-[#013758] inline-flex items-center gap-1">
                      <ArrowLeft className="size-3.5" /> Quay lại chỉnh sửa thông tin đặt phòng
                    </Link>
                  </div>
                </div>

                {/* Support Callout */}
                <div className="bg-[#f1f3f9] rounded-xl p-4 flex items-start gap-3 text-xs">
                  <Headset className="size-6 text-[#013758] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-[#202B36] text-sm">Cần trợ giúp trong lúc thanh toán?</h4>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">
                      Đội ngũ StayReco sẵn sàng hỗ trợ 24/7. Gọi ngay hotline <strong className="text-[#013758]">1900 6868</strong> hoặc nhắn tin trực tiếp với <span className="font-semibold underline cursor-pointer">Lễ tân An Nhiên Riverside Hotel</span>.
                    </p>
                  </div>
                </div>
              </Card>

            </div>

            {/* RIGHT COLUMN: Order Summary Card (5 cols sticky) */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
              
              <Card className="bg-white rounded-xl shadow-md p-5 sm:p-6 border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-[#202B36]">Tóm tắt đơn phòng</h3>
                  <Badge className="bg-[#EAF0F5] text-[#013758] text-[10px] font-mono font-bold">
                    SR-261020-0842
                  </Badge>
                </div>

                {/* Hotel Card Details */}
                <div className="flex gap-3 items-start">
                  <div className="relative size-20 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                    <Image
                      src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80"
                      alt="An Nhiên Riverside Hotel"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="font-semibold text-slate-700">Boutique 4 sao</span>
                      <div className="flex text-amber-400 items-center font-bold ml-1">
                        <Star className="size-3 fill-amber-400" />
                        <span className="text-xs text-[#934a33] ml-0.5">4.8/5</span>
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-[#202B36] truncate">An Nhiên Riverside Hotel</h4>
                    <p className="text-xs text-slate-500 truncate">128 Đường Bạch Đằng, Q. Hải Châu, Đà Nẵng</p>
                    <div className="flex items-center gap-1 mt-1 text-[#35624A] text-[11px] font-medium">
                      <CheckCircle2 className="size-3.5" />
                      <span>Đối tác khách sạn xuất sắc StayReco</span>
                    </div>
                  </div>
                </div>

                {/* Room Info */}
                <div className="bg-[#f1f3f9] rounded-lg p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold text-[#202B36]">
                    <span>Phòng Deluxe River View</span>
                    <span className="text-[#934a33]">Tầng 5 - 8</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
                    <div>• Hướng sông Hàn & Cầu Rồng</div>
                    <div>• 1 Giường King cỡ lớn</div>
                    <div>• 2 Người lớn</div>
                    <div>• 38 m² • Ban công kính</div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="flex items-center justify-between bg-[#f7f9ff] rounded-lg p-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Nhận phòng</span>
                    <span className="font-bold text-[#202B36] block">14:00</span>
                    <span className="text-slate-500">20/10/2026</span>
                  </div>
                  <div className="text-center px-2">
                    <span className="px-2 py-0.5 rounded-full bg-[#EAF0F5] text-[#013758] font-bold text-[10px]">
                      2 Đêm
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Trả phòng</span>
                    <span className="font-bold text-[#202B36] block">12:00</span>
                    <span className="text-slate-500">22/10/2026</span>
                  </div>
                </div>

                {/* Price Table */}
                <div className="space-y-2 text-xs pt-1 border-t border-slate-100">
                  <div className="flex justify-between text-slate-600">
                    <span>Giá gốc (2 đêm × 1.250.000 ₫)</span>
                    <span className="font-semibold text-[#202B36]">2.500.000 ₫</span>
                  </div>
                  <div className="flex justify-between text-[#934a33] font-semibold">
                    <span>Mã ưu đãi (ANHNIEN250)</span>
                    <span>-250.000 ₫</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Thuế GTGT (8%) & Phí dịch vụ (5%)</span>
                    <span className="text-[#35624A] font-semibold">Đã bao gồm</span>
                  </div>

                  <div className="mt-2 p-3 rounded-lg bg-[#f1f3f9] flex justify-between items-baseline">
                    <span className="text-xs font-bold text-[#202B36]">TỔNG TIỀN THANH TOÁN</span>
                    <span className="text-xl font-bold text-[#013758]">2.250.000 ₫</span>
                  </div>
                </div>

              </Card>

              {/* Host contact card */}
              <Card className="bg-white rounded-xl p-4 shadow-xs border border-slate-200/80 flex items-center gap-3">
                <div className="relative size-10 rounded-full overflow-hidden shrink-0 bg-slate-200">
                  <Image
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80"
                    alt="Lễ tân An Nhiên"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="text-xs">
                  <span className="text-slate-400 block text-[11px]">Đại diện khách sạn quản lý:</span>
                  <span className="font-bold text-[#202B36] block">Văn phòng Lễ tân An Nhiên Riverside</span>
                  <span className="text-[#35624A] font-medium">Sẵn sàng nhận phòng từ 14:00 ngày 20/10</span>
                </div>
              </Card>

            </div>

          </div>
        </div>

    </>
  );
}
