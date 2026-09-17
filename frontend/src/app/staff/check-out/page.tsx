"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  LogOut,
  Search,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  CreditCard,
  Key,
  Building,
  Coffee,
  Sparkles,
  Printer,
  ChevronRight,
  ArrowLeft,
  DollarSign,
  Check,
  RotateCcw,
  Sparkle,
  BedDouble,
  ShieldCheck,
  FileText,
  Clock,
  Sparkles as HousekeepingIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function StaffCheckOutPage() {
  const [selectedRoom, setSelectedRoom] = useState<string>("P.602");
  const [keyCardsReturned, setKeyCardsReturned] = useState<number>(2);
  const [housekeepingStatus, setHousekeepingStatus] = useState<string>("Đã kiểm tra - Tốt");
  const [isCheckOutSuccess, setIsCheckOutSuccess] = useState<boolean>(false);

  const extraCharges = [
    { id: 1, name: "Nước khoáng Evian 500ml (Minibar)", qty: 1, price: 75000 },
    { id: 2, name: "Phí Trả phòng Muộn (Late Checkout +2h)", qty: 1, price: 300000 },
    { id: 3, name: "Dịch vụ giặt ủi áo sơ mi", qty: 1, price: 150000 },
  ];

  const subtotalExtra = extraCharges.reduce((acc, item) => acc + item.price * item.qty, 0);
  const initialDeposit = 1000000;
  const netRefund = initialDeposit - subtotalExtra;

  return (
    <div className="font-sans antialiased text-foreground">
      <main>
        <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Breadcrumb & Navigation */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <Link href="/staff/dashboard" className="hover:text-[#934a33]">Bàn làm việc</Link>
                <ChevronRight className="w-3 h-3" />
                <Link href="/staff/bookings" className="hover:text-[#934a33]">Đặt phòng</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-slate-800 font-medium">Quyết toán Check-out P.602</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <LogOut className="w-7 h-7 text-[#934a33]" /> Check-out & Quyết Toán Lưu Trú
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/staff/bookings/BK-8839">
                <Button variant="outline" className="h-10 text-xs md:text-sm font-semibold border-slate-300">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Hồ Sơ Booking BK-8839
                </Button>
              </Link>
              <Button 
                className="h-10 bg-[#934a33] hover:bg-[#7b3e2b] text-white text-xs md:text-sm font-semibold shadow-md"
                onClick={() => setIsCheckOutSuccess(true)}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Xử Lý Quyết Toán P.602
              </Button>
            </div>
          </div>

          {/* Alert Banner for Late Check-out & Housekeeping Inspection */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900">Yêu cầu Check-out Phòng P.602</h4>
              <p className="text-xs text-blue-800 mt-0.5">
                Khách **Trần Thị B** trả phòng lúc 14:00 (Check-out muộn 2 giờ có tính phí). Buồng phòng đã kiểm tra Minibar & tài sản phòng lúc 13:45 — Không có hư hại.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Guest Summary & Housekeeping Inspection */}
            <div className="lg:col-span-1 space-y-6">
              {/* Room & Guest Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Thông tin phòng</span>
                  <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 text-xs font-semibold">
                    Đang Check-out
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-[#934a33] text-2xl">Phòng P.602</h3>
                    <p className="text-xs text-slate-500">Executive Suite Ocean View • Tầng 6</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Khách hàng:</span>
                    <span className="font-bold text-slate-900 text-sm">Trần Thị B</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ngày Check-in:</span>
                    <span className="font-semibold text-slate-800">12/10/2026 14:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ngày Check-out:</span>
                    <span className="font-semibold text-slate-800">14/10/2026 14:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số lượng thẻ đã thu:</span>
                    <span className="font-semibold text-emerald-700 flex items-center gap-1">
                      <Key className="w-3.5 h-3.5" /> 2 / 2 Thẻ từ
                    </span>
                  </div>
                </div>
              </div>

              {/* Housekeeping Report */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Báo cáo nghiệm thu phòng
                  </span>
                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                    Đã duyệt
                  </Badge>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-900">Nhân viên kiểm tra:</span>
                      <span className="text-emerald-800 font-medium">Lê Thị Mai (Housekeeping)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-900">Tình trạng nội thất:</span>
                      <span className="text-emerald-700 font-bold">Hoàn hảo (Không hư hại)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-900">Minibar sử dụng:</span>
                      <span className="text-slate-800">1 Chai Evian 500ml</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 italic">
                    * Đã ghi nhận các khoản sử dụng phát sinh vào hóa đơn thanh toán bên phải.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Folio / Charges Breakdown & Deposit Refund Settlement */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-[#934a33]" /> Bảng Quyết Toán Tài Chính (Folio)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Chi tiết các khoản phòng, phát sinh và hoàn cọc tiền thế chân</p>
                  </div>
                  <Badge variant="outline" className="text-xs bg-slate-100 text-slate-800 border-slate-300">
                    Mã HD: #INV-P602-8839
                  </Badge>
                </div>

                {/* Pre-paid Booking Room Charges */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">1. Tiền phòng cơ bản (Đã thanh toán trước)</h4>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">Executive Suite Ocean View (2 đêm)</span>
                      <span className="text-slate-500">12/10/2026 - 14/10/2026 • 2,500,000 VNĐ / đêm</span>
                    </div>
                    <span className="font-bold text-emerald-700 text-sm">5,000,000 VNĐ (Đã thu)</span>
                  </div>
                </div>

                {/* Extra Charges Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">2. Phát sinh trong quá trình lưu trú</h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Dịch vụ / Hàng hóa</th>
                          <th className="p-3 text-center">SL</th>
                          <th className="p-3 text-right">Đơn giá</th>
                          <th className="p-3 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {extraCharges.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="p-3 font-medium text-slate-800">{item.name}</td>
                            <td className="p-3 text-center text-slate-600">{item.qty}</td>
                            <td className="p-3 text-right text-slate-600">{item.price.toLocaleString("vi-VN")} đ</td>
                            <td className="p-3 text-right font-semibold text-slate-900">
                              {(item.price * item.qty).toLocaleString("vi-VN")} đ
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                        <tr>
                          <td colSpan={3} className="p-3 text-slate-700">Tổng cộng dịch vụ phát sinh:</td>
                          <td className="p-3 text-right text-[#934a33] text-sm">
                            {subtotalExtra.toLocaleString("vi-VN")} VNĐ
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Deposit Refund Calculation */}
                <div className="bg-slate-900 text-white rounded-xl p-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" /> 3. Quyết toán Tiền cọc (Deposit Settlement)
                  </h4>

                  <div className="space-y-2 text-xs border-b border-slate-800 pb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tiền cọc tạm thu lúc check-in:</span>
                      <span className="font-semibold text-white">{initialDeposit.toLocaleString("vi-VN")} VNĐ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Trừ chi phí phát sinh:</span>
                      <span className="font-semibold text-amber-400">- {subtotalExtra.toLocaleString("vi-VN")} VNĐ</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-xs text-slate-300 block">Số tiền HOÀN LẠI CHO KHÁCH:</span>
                      <span className="text-xl font-extrabold text-emerald-400">
                        {netRefund.toLocaleString("vi-VN")} VNĐ
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-10 px-4">
                        <RotateCcw className="w-4 h-4 mr-1.5" /> Hoàn Tiền Mặt / VNPay
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Final Action Bar */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-amber-900 text-sm">Chuyển Trạng Thái Phòng P.602</h4>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Sau khi hoàn tất check-out, phòng **P.602** sẽ tự động chuyển sang trạng thái **"Cần dọn dẹp (Dirty)"** cho bộ phận buồng phòng.
                    </p>
                  </div>
                  <Button 
                    className="bg-[#934a33] hover:bg-[#7b3e2b] text-white font-semibold text-xs md:text-sm px-6 h-11 shadow-md w-full sm:w-auto shrink-0"
                    onClick={() => setIsCheckOutSuccess(true)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Xử Lý Check-out & Giải Phóng Phòng
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Check-out Completion Modal Simulation */}
      {isCheckOutSuccess && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-slate-900">Check-out Hoàn Tất!</h3>
              <p className="text-xs text-slate-600">
                Phòng **P.602** đã hoàn tất quyết toán. Khách **Trần Thị B** đã nhận lại **{netRefund.toLocaleString("vi-VN")} VNĐ**.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Mã hóa đơn:</span>
                <span className="font-mono font-bold text-slate-900">#INV-P602-8839</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số phòng trả:</span>
                <span className="font-bold text-[#934a33]">P.602</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thẻ từ nhận lại:</span>
                <span className="font-semibold text-emerald-700">2 / 2 Thẻ (Đủ)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trạng thái phòng mới:</span>
                <span className="font-semibold text-amber-700">Cần dọn dẹp (Dirty)</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                variant="outline"
                className="flex-1 h-10 text-xs font-semibold border-slate-300"
                onClick={() => setIsCheckOutSuccess(false)}
              >
                <Printer className="w-4 h-4 mr-1.5" /> In Hóa Đơn Quyết Toán
              </Button>
              <Link href="/staff/dashboard" className="flex-1">
                <Button className="w-full h-10 bg-[#934a33] hover:bg-[#7b3e2b] text-white text-xs font-semibold">
                  Về Bàn Làm Việc
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
