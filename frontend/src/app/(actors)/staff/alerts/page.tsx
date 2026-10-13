"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Search,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldAlert,
  Wrench,
  Sparkles,
  Plus,
  UserCheck,
  Building,
  Bell,
  Check,
  MessageSquare,
  ArrowLeft,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface IncidentAlert {
  id: string;
  roomNum: string;
  guestName: string;
  title: string;
  category: "Kỹ thuật" | "Buồng phòng" | "Dịch vụ" | "Thanh toán";
  priority: "khẩn cấp" | "cao" | "bình thường";
  description: string;
  aiSuggestedFix: string;
  assignedDept: string;
  status: "Đang xử lý" | "Đã giải quyết" | "Mới";
  timeAgo: string;
}

export default function StaffAlertsPage() {
  const [activeFilter, setActiveFilter] = useState<"all" | "khẩn cấp" | "cao">("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newRoom, setNewRoom] = useState<string>("");

  const [alerts, setAlerts] = useState<IncidentAlert[]>([
    {
      id: "ALT-101",
      roomNum: "P.402",
      guestName: "Phạm Minh Hoàng",
      title: "Hỏng máy điều hòa - Kêu to gây khó ngủ",
      category: "Kỹ thuật",
      priority: "khẩn cấp",
      description: "Khách gọi phản ánh điều hòa phát tiếng động rung mạnh lúc 02:00 sáng.",
      aiSuggestedFix: "Điều nhân viên kỹ thuật Nguyễn Văn Bình mang quạt êm sang hỗ trợ tạm thời, sau đó sắp xếp chuyển sang phòng P.406 cùng hạng.",
      assignedDept: "Bộ phận Kỹ thuật",
      status: "Đang xử lý",
      timeAgo: "15 phút trước",
    },
    {
      id: "ALT-102",
      roomNum: "P.602",
      guestName: "Trần Thị B",
      title: "Cảnh báo quá giờ Check-out 2 tiếng",
      category: "Thanh toán",
      priority: "cao",
      description: "Khách chưa xuống quầy làm thủ tục checkout dù đã 14:00. Đã phát sinh phí late checkout.",
      aiSuggestedFix: "Lễ tân liên lạc điện thoại phòng P.602 để xác nhận thời gian trả phòng hoặc gia hạn lưu trú.",
      assignedDept: "Lễ tân & Thu ngân",
      status: "Mới",
      timeAgo: "45 phút trước",
    },
    {
      id: "ALT-103",
      roomNum: "P.508",
      guestName: "Lê Văn Tùng",
      title: "Yêu cầu bổ sung 2 bộ nệm phụ (Extra bed)",
      category: "Buồng phòng",
      priority: "bình thường",
      description: "Khách đi kèm trẻ nhỏ cần kê thêm nệm trước 18:00.",
      aiSuggestedFix: "Chuyển phiếu công tác cho Buồng phòng tầng 5 hoàn tất trước ca tối.",
      assignedDept: "Buồng phòng",
      status: "Đã giải quyết",
      timeAgo: "2 giờ trước",
    },
  ]);

  const handleResolveAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((alt) => (alt.id === id ? { ...alt, status: "Đã giải quyết" } : alt))
    );
  };

  const filteredAlerts = alerts.filter((alt) => {
    if (activeFilter === "khẩn cấp") return alt.priority === "khẩn cấp";
    if (activeFilter === "cao") return alt.priority === "cao";
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
                <span className="text-slate-800 font-medium">Cảnh báo & Sự cố vận hành</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-7 h-7 text-red-600" /> Cảnh Báo Nghiệp Vụ & Quản Lý Sự Cố
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Button
                className="h-10 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-md"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1.5" /> Tạo Cảnh Báo Khẩn Cấp Mới
              </Button>
            </div>
          </div>

          {/* Filter Bar & Quick Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeFilter === "all"
                    ? "bg-[#934a33] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Tất cả cảnh báo ({alerts.length})
              </button>
              <button
                onClick={() => setActiveFilter("khẩn cấp")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  activeFilter === "khẩn cấp"
                    ? "bg-red-600 text-white"
                    : "bg-red-50 text-red-700 hover:bg-red-100"
                }`}
              >
                🔴 Khẩn cấp (1)
              </button>
              <button
                onClick={() => setActiveFilter("cao")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeFilter === "cao"
                    ? "bg-amber-600 text-white"
                    : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                }`}
              >
                🟡 Ưu tiên cao (1)
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input placeholder="Tìm mã cảnh báo, phòng..." className="pl-9 h-9 text-xs bg-slate-50" />
            </div>
          </div>

          {/* Incident Feed List */}
          <div className="space-y-4">
            {filteredAlerts.map((alt) => (
              <div
                key={alt.id}
                className={`bg-white rounded-xl border-2 p-5 shadow-2xs transition space-y-4 ${
                  alt.priority === "khẩn cấp"
                    ? "border-red-200 bg-red-50/20"
                    : alt.priority === "cao"
                    ? "border-amber-200 bg-amber-50/20"
                    : "border-slate-200"
                }`}
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    {alt.priority === "khẩn cấp" ? (
                      <Badge className="bg-red-600 text-white font-bold text-xs">🔴 Khẩn cấp</Badge>
                    ) : alt.priority === "cao" ? (
                      <Badge className="bg-amber-500 text-white font-bold text-xs">🟡 Cảnh báo</Badge>
                    ) : (
                      <Badge className="bg-blue-600 text-white font-bold text-xs">🔵 Bình thường</Badge>
                    )}
                    <span className="font-bold text-slate-900 text-base">{alt.title}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">Phòng:</span>
                    <Badge variant="outline" className="font-bold text-[#934a33] bg-[#934a33]/10 border-[#934a33]/20">
                      {alt.roomNum}
                    </Badge>
                    <span className="text-slate-400">• {alt.timeAgo}</span>
                  </div>
                </div>

                {/* Description & AI Suggested Fix */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold block">Chi tiết sự cố:</span>
                    <p className="text-slate-800 font-medium leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                      {alt.description}
                    </p>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Khách hàng: <span className="font-bold text-slate-800">{alt.guestName}</span> | Phân công: <span className="font-bold text-[#934a33]">{alt.assignedDept}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-amber-900 font-bold block flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" /> AI Đề xuất hướng xử lý ngay:
                    </span>
                    <p className="text-slate-800 font-medium leading-relaxed bg-amber-50/80 p-3 rounded-lg border border-amber-200">
                      {alt.aiSuggestedFix}
                    </p>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <Badge
                    className={`${
                      alt.status === "Đã giải quyết"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    Trạng thái: {alt.status}
                  </Badge>

                  <div className="flex items-center gap-2">
                    <Link href="/staff/inbox">
                      <Button variant="outline" className="h-8 text-xs font-semibold border-slate-300">
                        <MessageSquare className="w-3.5 h-3.5 mr-1" /> Nhắn tin với khách
                      </Button>
                    </Link>
                    {alt.status !== "Đã giải quyết" && (
                      <Button
                        className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-2xs"
                        onClick={() => handleResolveAlert(alt.id)}
                      >
                        <Check className="w-3.5 h-3.5 mr-1" /> Đã xử lý xong sự cố
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Manual Create Alert Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" /> Tạo Cảnh Báo Nghiệp Vụ Mới
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Số phòng ảnh hưởng:</label>
                <Input
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  placeholder="Ví dụ: P.402"
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tiêu đề sự cố:</label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Hỏng khóa từ cửa chính"
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mức độ ưu tiên:</label>
                <select className="w-full h-9 rounded-md border border-slate-300 bg-white text-xs px-3 font-medium">
                  <option value="khẩn cấp">🔴 Khẩn cấp (Nguy cơ khiếu nại cao)</option>
                  <option value="cao">🟡 Cảnh báo ưu tiên</option>
                  <option value="bình thường">🔵 Bình thường</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                className="h-9 text-xs font-semibold"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Hủy
              </Button>
              <Button
                className="h-9 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4"
                onClick={() => {
                  if (newTitle && newRoom) {
                    setAlerts([
                      {
                        id: `ALT-${Date.now()}`,
                        roomNum: newRoom,
                        guestName: "Khách tại quầy",
                        title: newTitle,
                        category: "Kỹ thuật",
                        priority: "khẩn cấp",
                        description: "Ghi nhận sự cố khẩn cấp từ nhân viên ca trực.",
                        aiSuggestedFix: "Thông báo trưởng ca Lễ tân và cử kỹ thuật xử lý ngay.",
                        assignedDept: "Bộ phận Kỹ thuật",
                        status: "Mới",
                        timeAgo: "Vừa xong",
                      },
                      ...alerts,
                    ]);
                    setIsCreateModalOpen(false);
                    setNewTitle("");
                    setNewRoom("");
                  }
                }}
              >
                Phát Cảnh Báo Khẩn Cấp
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
