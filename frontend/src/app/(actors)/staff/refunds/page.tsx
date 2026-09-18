"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BadgePercent,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  DollarSign,
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Sliders,
  Check,
  X,
  CreditCard,
  User,
  Info,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface RefundRequest {
  id: string;
  bookingId: string;
  guestName: string;
  roomType: string;
  totalPaid: number;
  requestedRefund: number;
  reason: string;
  policyComplianceScore: number; // 0 - 100%
  systemRecommendation: "Duyệt 100%" | "Hoàn 80% (Trừ 20% phí)" | "Hoàn 50%" | "Không hợp lệ";
  status: "Chờ thẩm định" | "Đã duyệt hoàn tiền" | "Từ chối";
  createdAt: string;
}

export default function StaffRefundsPage() {
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
  const [refundPercent, setRefundPercent] = useState<number>(80);
  const [overrideReason, setOverrideReason] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([
    {
      id: "RF-901",
      bookingId: "BK-8840",
      guestName: "Trần Đức Nam",
      roomType: "Executive Suite Ocean View",
      totalPaid: 5000000,
      requestedRefund: 4000000,
      reason: "Hủy chuyến do hoãn chuyến bay (Có xác nhận từ hãng)",
      policyComplianceScore: 92,
      systemRecommendation: "Hoàn 80% (Trừ 20% phí)",
      status: "Chờ thẩm định",
      createdAt: "14/10/2026 09:30",
    },
    {
      id: "RF-902",
      bookingId: "BK-8835",
      guestName: "Lê Mỹ Duyên",
      roomType: "Deluxe Ocean King",
      totalPaid: 3200000,
      requestedRefund: 3200000,
      reason: "Bão lớn tại miền Trung - Lý do bất khả kháng",
      policyComplianceScore: 100,
      systemRecommendation: "Duyệt 100%",
      status: "Đã duyệt hoàn tiền",
      createdAt: "13/10/2026 15:45",
    },
    {
      id: "RF-903",
      bookingId: "BK-8829",
      guestName: "Vũ Hoàng Bách",
      roomType: "Superior Garden Twin",
      totalPaid: 1800000,
      requestedRefund: 1800000,
      reason: "Thay đổi kế hoạch cá nhân trước 12h check-in",
      policyComplianceScore: 40,
      systemRecommendation: "Không hợp lệ",
      status: "Chờ thẩm định",
      createdAt: "14/10/2026 08:15",
    },
  ]);

  const handleApprove = (id: string) => {
    setRefundRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: "Đã duyệt hoàn tiền" } : req))
    );
    setSelectedRequest(null);
  };

  const handleReject = (id: string) => {
    setRefundRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: "Từ chối" } : req))
    );
    setSelectedRequest(null);
  };

  const filteredRequests = refundRequests.filter((req) => {
    if (filterStatus === "pending") return req.status === "Chờ thẩm định";
    if (filterStatus === "approved") return req.status === "Đã duyệt hoàn tiền";
    if (filterStatus === "rejected") return req.status === "Từ chối";
    return true;
  });

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
                <span className="text-slate-800 font-medium">Hoàn tiền & Thẩm định chính sách</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <BadgePercent className="w-7 h-7 text-[#934a33]" /> Thẩm Định Yêu Cầu Hoàn Tiền & Chính Sách
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/staff/inbox">
                <Button variant="outline" className="h-10 text-xs font-semibold border-slate-300">
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> Xem Hộp Thư Khiếu Nại
                </Button>
              </Link>
            </div>
          </div>

          {/* Metric Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-xs text-slate-500 font-semibold uppercase">Tổng yêu cầu chờ thẩm định</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900">2 Yêu cầu</span>
                <Badge className="bg-amber-100 text-amber-800 text-xs">Cần duyệt</Badge>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-xs text-slate-500 font-semibold uppercase">Tổng giá trị đề xuất hoàn</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-[#934a33]">5,800,000 đ</span>
                <span className="text-xs text-slate-500">2 đơn</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-xs text-slate-500 font-semibold uppercase">Tỷ lệ AI thẩm định tự động</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-emerald-600">85% Tự động</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-xs text-slate-500 font-semibold uppercase">Đã giải ngân hôm nay</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900">3,200,000 đ</span>
                <Badge className="bg-emerald-100 text-emerald-800 text-xs">Đã chuyển khoản</Badge>
              </div>
            </div>
          </div>

          {/* Refund Table Container */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filterStatus === "all"
                      ? "bg-[#934a33] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Tất cả yêu cầu ({refundRequests.length})
                </button>
                <button
                  onClick={() => setFilterStatus("pending")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filterStatus === "pending"
                      ? "bg-amber-600 text-white"
                      : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                  }`}
                >
                  Chờ thẩm định (2)
                </button>
                <button
                  onClick={() => setFilterStatus("approved")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filterStatus === "approved"
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  }`}
                >
                  Đã duyệt (1)
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input placeholder="Tìm mã đơn, tên khách..." className="pl-9 h-9 text-xs bg-slate-50" />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Mã đơn / Khách hàng</th>
                    <th className="p-3">Lý do yêu cầu</th>
                    <th className="p-3 text-right">Đã thanh toán</th>
                    <th className="p-3 text-right">Số tiền yêu cầu hoàn</th>
                    <th className="p-3 text-center">Đánh giá AI chính sách</th>
                    <th className="p-3 text-center">Trạng thái</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50 transition">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{req.guestName}</div>
                        <div className="text-[11px] text-slate-500">Mã đơn: <span className="font-mono text-[#934a33] font-semibold">{req.bookingId}</span></div>
                      </td>

                      <td className="p-3 max-w-xs">
                        <p className="text-slate-800 font-medium truncate" title={req.reason}>{req.reason}</p>
                        <span className="text-[10px] text-slate-400">{req.createdAt}</span>
                      </td>

                      <td className="p-3 text-right font-semibold text-slate-900">
                        {req.totalPaid.toLocaleString("vi-VN")} đ
                      </td>

                      <td className="p-3 text-right font-bold text-[#934a33]">
                        {req.requestedRefund.toLocaleString("vi-VN")} đ
                      </td>

                      <td className="p-3 text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${
                            req.policyComplianceScore >= 80
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          {req.policyComplianceScore}% Hợp lệ chính sách
                        </Badge>
                      </td>

                      <td className="p-3 text-center">
                        <Badge
                          className={`text-[10px] font-bold ${
                            req.status === "Đã duyệt hoàn tiền"
                              ? "bg-emerald-100 text-emerald-800"
                              : req.status === "Từ chối"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {req.status}
                        </Badge>
                      </td>

                      <td className="p-3 text-right">
                        <Button
                          className="h-8 text-xs bg-[#934a33] hover:bg-[#7b3e2b] text-white font-semibold shadow-2xs"
                          onClick={() => {
                            setSelectedRequest(req);
                            setRefundPercent(req.policyComplianceScore >= 80 ? 80 : 50);
                          }}
                        >
                          <Sliders className="w-3.5 h-3.5 mr-1" /> Thẩm định chi tiết
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* S07 Modal: Detailed Refund Audit Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#934a33]" /> Thẩm Định Yêu Cầu Hoàn Tiền Chi Tiết #{selectedRequest.id}
                </h3>
                <p className="text-xs text-slate-500">Đơn đặt phòng: **{selectedRequest.bookingId}** • Khách hàng **{selectedRequest.guestName}**</p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Policy Breakdown & AI Recommendation Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" /> AI Đánh Giá Điều Khoản Hủy Phòng Tự Động
                </span>
                <Badge className="bg-amber-200 text-amber-900 font-bold text-[10px]">
                  Khả dụng: {selectedRequest.policyComplianceScore}%
                </Badge>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Hệ thống đối soát thời gian hủy phòng trước **24-48 giờ**. Mức phạt tiêu chuẩn của hạng phòng **{selectedRequest.roomType}** là **20% tổng giá trị**. AI đề xuất mức hoàn tiền hợp lý: **{(selectedRequest.totalPaid * 0.8).toLocaleString("vi-VN")} VNĐ (80%)**.
              </p>
            </div>

            {/* Adjust Refund Amount & Percentage Slider */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Tùy chỉnh mức hoàn tiền thực tế
              </h4>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600">Tỷ lệ hoàn tiền:</span>
                  <span className="text-lg font-bold text-[#934a33]">{refundPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={refundPercent}
                  onChange={(e) => setRefundPercent(Number(e.target.value))}
                  className="w-full accent-[#934a33] cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Số tiền khách đã thanh toán:</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedRequest.totalPaid.toLocaleString("vi-VN")} đ</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Số tiền HOÀN TRẢ CUỐI CÙNG:</span>
                  <span className="font-extrabold text-emerald-700 text-base">
                    {((selectedRequest.totalPaid * refundPercent) / 100).toLocaleString("vi-VN")} VNĐ
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Ghi chú thẩm định / Lý do điều chỉnh (Manager Override Note):
                </label>
                <Input
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Ví dụ: Khách xuất trình xác nhận hoãn chuyến bay từ Vietnam Airlines..."
                  className="h-9 text-xs bg-white border-slate-300"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                className="h-10 text-xs font-semibold border-red-200 text-red-700 hover:bg-red-50"
                onClick={() => handleReject(selectedRequest.id)}
              >
                <XCircle className="w-4 h-4 mr-1.5" /> Từ chối hoàn tiền
              </Button>
              <Button
                className="h-10 bg-[#934a33] hover:bg-[#7b3e2b] text-white font-semibold text-xs px-6 shadow-md"
                onClick={() => handleApprove(selectedRequest.id)}
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Xác Nhận Duyệt Hoàn {refundPercent}%
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
