"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Scan,
  ShieldCheck,
  BedDouble,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Key,
  UserCheck,
  Building,
  Sparkles,
  Printer,
  ChevronRight,
  ArrowLeft,
  DollarSign,
  QrCode,
  Check,
  Coffee,
  Clock,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function StaffCheckInPage() {
  const [selectedRoom, setSelectedRoom] = useState<string>("P.608");
  const [scannedDocument, setScannedDocument] = useState<boolean>(true);
  const [keyCardCount, setKeyCardCount] = useState<number>(2);
  const [depositPaid, setDepositPaid] = useState<boolean>(true);
  const [isCheckInSuccess, setIsCheckInSuccess] = useState<boolean>(false);

  // Mock available rooms for assignment
  const availableRooms = [
    { id: "P.608", floor: "Tầng 6", type: "Deluxe Ocean King", status: "Sẵn sàng (Đã dọn dẹp)", isRecommended: true, score: "98% trùng hợp" },
    { id: "P.610", floor: "Tầng 6", type: "Deluxe Ocean King", status: "Sẵn sàng (Đã dọn dẹp)", isRecommended: false },
    { id: "P.702", floor: "Tầng 7", type: "Deluxe Ocean King", status: "Đang kiểm tra chất lượng", isRecommended: false },
    { id: "P.504", floor: "Tầng 5", type: "Deluxe Ocean Twin", status: "Sẵn sàng (Đã dọn dẹp)", isRecommended: false },
  ];

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
                <span className="text-slate-800 font-medium">Quy trình Check-in #BK-8842</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-7 h-7 text-[#934a33]" /> Check-in & Gán Phòng Khách Hàng
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/staff/bookings/BK-8842">
                <Button variant="outline" className="h-10 text-xs md:text-sm font-semibold border-slate-300">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Xem Chi Tiết Đặt Phòng
                </Button>
              </Link>
              <Button 
                className="h-10 bg-[#934a33] hover:bg-[#7b3e2b] text-white text-xs md:text-sm font-semibold shadow-md"
                onClick={() => setIsCheckInSuccess(true)}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Hoàn Tất Check-in P.608
              </Button>
            </div>
          </div>

          {/* Top Banner Alert */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-900">Gợi ý AI Gán Phòng Tối Ưu</h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Khách hàng **Nguyễn Văn An** yêu cầu tầng cao, hướng biển quiet zone. AI đề xuất phòng **P.608** (đã dọn dẹp sạch 100%, cách ly tiếng ồn tốt nhất phân khu tầng 6).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Guest & Booking Info + Document Scanner */}
            <div className="lg:col-span-1 space-y-6">
              {/* Guest Card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Thông tin khách hàng</span>
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold">
                    Đã thanh toán 100%
                  </Badge>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#934a33]/10 text-[#934a33] font-bold text-lg flex items-center justify-center">
                    NV
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Nguyễn Văn An</h3>
                    <p className="text-xs text-slate-500">SĐT: 0912 *** 890 • VIP Silver</p>
                    <p className="text-xs text-[#934a33] font-medium mt-0.5">Mã đơn: #BK-8842</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-500 block">Loại phòng mua:</span>
                    <span className="font-semibold text-slate-800">Deluxe Ocean King</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Thời gian lưu trú:</span>
                    <span className="font-semibold text-slate-800">2 đêm (14/10 - 16/10)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Số lượng khách:</span>
                    <span className="font-semibold text-slate-800">2 Người lớn, 1 Trẻ em</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Gói ăn sáng:</span>
                    <span className="font-semibold text-emerald-700 flex items-center gap-1">
                      <Coffee className="w-3 h-3" /> Đã bao gồm
                    </span>
                  </div>
                </div>
              </div>

              {/* CCCD / Passport Scanning Section */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Scan className="w-4 h-4 text-[#934a33]" /> Quét & Xác thực định danh (eKYC)
                  </span>
                  {scannedDocument && (
                    <Badge className="bg-blue-100 text-blue-800 text-[10px] font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> CCCD chip hợp lệ
                    </Badge>
                  )}
                </div>

                {scannedDocument ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-600">Số CCCD:</span>
                        <span className="font-mono font-bold text-slate-900">001092008891</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-600">Họ và tên:</span>
                        <span className="font-bold text-slate-900">NGUYỄN VĂN AN</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-600">Ngày sinh:</span>
                        <span className="text-slate-800">15/08/1988</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-600">Thường trú:</span>
                        <span className="text-slate-800 text-right">Q. Cầu Giấy, Hà Nội</span>
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full h-9 text-xs text-slate-600 border-slate-300 hover:bg-slate-50"
                      onClick={() => setScannedDocument(false)}
                    >
                      <Scan className="w-3.5 h-3.5 mr-1.5" /> Quét lại giấy tờ khác
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center space-y-3 bg-slate-50 hover:bg-slate-100/60 transition cursor-pointer"
                    onClick={() => setScannedDocument(true)}>
                    <Scan className="w-8 h-8 text-[#934a33] mx-auto animate-pulse" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Đặt CCCD/Passport lên đầu đọc NFC / Đặt máy quét</p>
                      <p className="text-[11px] text-slate-500 mt-1">Hoặc nhấp vào đây để tải ảnh chụp 2 mặt CCCD</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Deposit Payment & Card Key */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-[#934a33]" /> Đặt cọc & Phát hành Thẻ Từ
                </h4>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <span className="font-medium text-slate-700 block">Tiền thế chân (Deposit)</span>
                      <span className="text-[11px] text-slate-500">Hoàn lại 100% khi check-out</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">1,000,000 VNĐ</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-600 font-medium">Trạng thái đặt cọc:</span>
                    <Badge className={depositPaid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>
                      {depositPaid ? "Đã thu tiền mặt / Thẻ" : "Chưa thu cọc"}
                    </Badge>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-amber-600" />
                      <span className="font-medium text-slate-700">Số lượng thẻ từ:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7 text-xs"
                        onClick={() => setKeyCardCount(Math.max(1, keyCardCount - 1))}
                      >
                        -
                      </Button>
                      <span className="font-bold text-slate-900 w-4 text-center">{keyCardCount}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7 text-xs"
                        onClick={() => setKeyCardCount(keyCardCount + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Room Matrix & Selection */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Building className="w-5 h-5 text-[#934a33]" /> Sơ đồ Gán Phòng Khả Dụng
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Vui lòng chọn phòng trống thuộc hạng **Deluxe Ocean King**</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                      3 Phòng trống đã dọn
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      1 Phòng đang nghiệm thu
                    </Badge>
                  </div>
                </div>

                {/* Available Rooms Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableRooms.map((room) => {
                    const isSelected = selectedRoom === room.id;
                    return (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoom(room.id)}
                        className={`p-4 rounded-xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? "border-[#934a33] bg-[#934a33]/5 shadow-sm"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        {room.isRecommended && (
                          <div className="absolute top-3 right-3 bg-amber-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                            <Sparkles className="w-3 h-3" /> AI Đề xuất ({room.score})
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xl font-bold text-slate-900">{room.id}</h4>
                            <span className="text-xs font-semibold text-slate-500">({room.floor})</span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium mt-1">{room.type}</p>
                          <div className="mt-3 flex items-center gap-2 text-xs">
                            <span className={`inline-block w-2 h-2 rounded-full ${
                              room.status.includes("Sẵn sàng") ? "bg-emerald-500" : "bg-blue-500"
                            }`}></span>
                            <span className="text-slate-600 font-medium">{room.status}</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-500">Giường King • Hướng biển</span>
                          <span className={`font-semibold ${isSelected ? "text-[#934a33]" : "text-slate-400"}`}>
                            {isSelected ? "✓ Đang chọn" : "Bấm để chọn"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Check-in Checklist */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-[#934a33]" /> Quy Trình Kiểm Tra Check-in Chuẩn
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded text-[#934a33] focus:ring-[#934a33]" />
                      <span>Xác minh chính chủ qua CCCD/Passport</span>
                    </label>
                    <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded text-[#934a33] focus:ring-[#934a33]" />
                      <span>Thu tiền thế chân deposit 1.000.000đ</span>
                    </label>
                    <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded text-[#934a33] focus:ring-[#934a33]" />
                      <span>Ghi đĩa/mã hóa 2 Thẻ từ phòng {selectedRoom}</span>
                    </label>
                    <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded text-[#934a33] focus:ring-[#934a33]" />
                      <span>In & Hướng dẫn Phiếu nhận phòng</span>
                    </label>
                  </div>
                </div>

                {/* Confirm Action Container */}
                <div className="bg-[#934a33]/10 border border-[#934a33]/20 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#934a33] text-sm">Xác nhận hoàn tất Check-in</h4>
                    <p className="text-xs text-slate-700 mt-0.5">
                      Gán thành công phòng **{selectedRoom}** cho khách **Nguyễn Văn An**. Mã thẻ từ: **CARD-{selectedRoom}-01/02**.
                    </p>
                  </div>
                  <Button 
                    className="bg-[#934a33] hover:bg-[#7b3e2b] text-white font-semibold text-xs md:text-sm px-6 h-11 shadow-md w-full sm:w-auto shrink-0"
                    onClick={() => setIsCheckInSuccess(true)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Hoàn Tất & In Thẻ Phòng
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Success Modal Simulation */}
      {isCheckInSuccess && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-slate-900">Check-in Thành Công!</h3>
              <p className="text-xs text-slate-600">
                Phòng **{selectedRoom}** đã chính thức kích hoạt cho khách **Nguyễn Văn An**.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Mã đặt phòng:</span>
                <span className="font-mono font-bold text-slate-900">#BK-8842</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số phòng gán:</span>
                <span className="font-bold text-[#934a33]">{selectedRoom}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thẻ từ đã ghi:</span>
                <span className="font-semibold text-slate-800">{keyCardCount} thẻ từ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tiền cọc nhận:</span>
                <span className="font-semibold text-emerald-700">1,000,000 VNĐ</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                variant="outline"
                className="flex-1 h-10 text-xs font-semibold border-slate-300"
                onClick={() => setIsCheckInSuccess(false)}
              >
                <Printer className="w-4 h-4 mr-1.5" /> In Welcome Voucher
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
