"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Search,
  Sparkles,
  Send,
  User,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  BadgePercent,
  Phone,
  Mail,
  Building,
  MoreVertical,
  Filter,
  Bot,
  Zap,
  CornerDownRight,
  ShieldAlert,
  ArrowRight,
  Smile,
  Frown,
  Meh,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Conversation {
  id: string;
  guestName: string;
  avatar: string;
  channel: "Booking.com" | "Agoda" | "Direct Chat" | "Zalo";
  roomNum: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  sentiment: "bức xúc" | "bình thường" | "hài lòng";
  status: "Chờ phản hồi" | "Đang xử lý" | "Đã giải quyết";
  isEscalated?: boolean;
}

export default function StaffInboxPage() {
  const [selectedId, setSelectedId] = useState<string>("conv-1");
  const [activeFilter, setActiveFilter] = useState<"all" | "complaint" | "ota" | "direct">("all");
  const [inputMessage, setInputMessage] = useState<string>("");
  const [aiDraftActive, setAiDraftActive] = useState<boolean>(true);

  const conversations: Conversation[] = [
    {
      id: "conv-1",
      guestName: "Phạm Minh Hoàng",
      avatar: "MH",
      channel: "Direct Chat",
      roomNum: "Phòng P.402",
      lastMessage: "Điều hòa phòng 402 bị kêu rất to từ 12h đêm, đề nghị nhân viên kỹ thuật sang xem ngay!",
      time: "10:15",
      unreadCount: 2,
      sentiment: "bức xúc",
      status: "Chờ phản hồi",
      isEscalated: true,
    },
    {
      id: "conv-2",
      guestName: "Nguyễn Hương Giang",
      avatar: "HG",
      channel: "Booking.com",
      roomNum: "Phòng P.608",
      lastMessage: "Chào lễ tân, cho mình hỏi khách sạn có hỗ trợ set up bánh sinh nhật trong phòng không?",
      time: "09:40",
      unreadCount: 0,
      sentiment: "hài lòng",
      status: "Đang xử lý",
    },
    {
      id: "conv-3",
      guestName: "David Miller",
      avatar: "DM",
      channel: "Agoda",
      roomNum: "Phòng P.305",
      lastMessage: "Hi, can I request extra 2 towels and late check-out at 1 PM tomorrow?",
      time: "08:20",
      unreadCount: 0,
      sentiment: "bình thường",
      status: "Đã giải quyết",
    },
    {
      id: "conv-4",
      guestName: "Trần Kim Ngân",
      avatar: "KN",
      channel: "Zalo",
      roomNum: "Chưa check-in",
      lastMessage: "Mình đặt xe đưa đón sân bay Đà Nẵng về khách sạn lúc 14:30 chiều nay nhé.",
      time: "Hôm qua",
      unreadCount: 0,
      sentiment: "bình thường",
      status: "Đã giải quyết",
    },
  ];

  const activeConv = conversations.find((c) => c.id === selectedId) || conversations[0];

  const filteredConversations = conversations.filter((c) => {
    if (activeFilter === "complaint") return c.sentiment === "bức xúc" || c.isEscalated;
    if (activeFilter === "ota") return c.channel === "Booking.com" || c.channel === "Agoda";
    if (activeFilter === "direct") return c.channel === "Direct Chat" || c.channel === "Zalo";
    return true;
  });

  const aiSuggestedResponse =
    "Chào anh Hoàng, StayReco xin lỗi chân thành về sự cố điều hòa tại P.402 làm ảnh hưởng giấc ngủ của anh. Lễ tân đã cử Kỹ thuật viên Nguyễn Văn Bình mang quạt êm sang hỗ trợ kiểm tra ngay lập tức. Khách sạn xin gửi tặng anh 1 Voucher trải nghiệm Spa / Ăn sáng bồi thường ạ!";

  return (
    <div className="font-sans antialiased text-foreground">
      <main>
        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header & Title */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <Link href="/staff/dashboard" className="hover:text-[#934a33]">Bàn làm việc</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-slate-800 font-medium">Hộp thư hợp nhất & Khiếu nại</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-7 h-7 text-[#934a33]" /> Hộp Thư Hợp Nhất & AI Hỗ Trợ Khiếu Nại
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/staff/alerts">
                <Button variant="outline" className="h-10 text-xs font-semibold border-red-200 bg-red-50 text-red-700 hover:bg-red-100">
                  <AlertTriangle className="w-4 h-4 mr-1.5" /> Xử lý 1 Cảnh Báo Khiếu Nại
                </Button>
              </Link>
              <Link href="/staff/refunds">
                <Button className="h-10 bg-[#934a33] hover:bg-[#7b3e2b] text-white text-xs font-semibold shadow-md">
                  <BadgePercent className="w-4 h-4 mr-1.5" /> Tạo Đề Xuất Hoàn Tiền
                </Button>
              </Link>
            </div>
          </div>

          {/* Master-Detail Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-180px)] min-h-[640px]">
            {/* Left Column: Conversation List (4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-0 overflow-hidden">
              {/* Filter Tabs & Search */}
              <div className="p-4 border-b border-slate-100 space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Tìm theo tên khách, phòng, tin nhắn..."
                    className="pl-9 h-9 text-xs bg-slate-50 border-slate-200"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <button
                    onClick={() => setActiveFilter("all")}
                    className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
                      activeFilter === "all"
                        ? "bg-[#934a33] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Tất cả (4)
                  </button>
                  <button
                    onClick={() => setActiveFilter("complaint")}
                    className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition flex items-center gap-1 ${
                      activeFilter === "complaint"
                        ? "bg-red-600 text-white"
                        : "bg-red-50 text-red-700 hover:bg-red-100"
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" /> Khiếu nại (1)
                  </button>
                  <button
                    onClick={() => setActiveFilter("direct")}
                    className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
                      activeFilter === "direct"
                        ? "bg-[#934a33] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Trực tiếp
                  </button>
                  <button
                    onClick={() => setActiveFilter("ota")}
                    className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
                      activeFilter === "ota"
                        ? "bg-[#934a33] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    OTA (2)
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {filteredConversations.map((conv) => {
                  const isSelected = conv.id === selectedId;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedId(conv.id)}
                      className={`p-4 cursor-pointer transition flex items-start gap-3 relative ${
                        isSelected
                          ? "bg-[#934a33]/10 border-l-4 border-[#934a33]"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-800 font-bold text-sm flex items-center justify-center shrink-0">
                        {conv.avatar}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{conv.guestName}</h4>
                          <span className="text-[10px] text-slate-400 shrink-0">{conv.time}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-slate-200 text-slate-600">
                            {conv.channel}
                          </Badge>
                          <span className="text-slate-500 font-medium">{conv.roomNum}</span>
                        </div>

                        <p className="text-xs text-slate-600 truncate font-medium">{conv.lastMessage}</p>

                        {conv.sentiment === "bức xúc" && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-red-600 mt-1">
                            <Frown className="w-3 h-3 text-red-600" />
                            <span>AI Cảnh báo: Thái độ bức xúc</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Middle Column: Chat Window & AI Assistant (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-0 overflow-hidden">
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#934a33] text-white font-bold text-xs flex items-center justify-center">
                    {activeConv.avatar}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{activeConv.guestName}</h3>
                    <p className="text-[11px] text-slate-500">{activeConv.channel} • {activeConv.roomNum}</p>
                  </div>
                </div>

                {activeConv.sentiment === "bức xúc" ? (
                  <Badge className="bg-red-100 text-red-800 border-red-200 text-xs font-semibold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Bức xúc - Ưu tiên xử lý
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-100 text-emerald-800 text-xs font-semibold">
                    {activeConv.status}
                  </Badge>
                )}
              </div>

              {/* Message Thread */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/30 text-xs">
                <div className="text-center text-[10px] text-slate-400 my-2">-- Bắt đầu hội thoại hôm nay 10:15 AM --</div>

                {/* Guest Message */}
                <div className="flex items-start gap-2.5 max-w-[85%]">
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {activeConv.avatar}
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl rounded-tl-none border border-slate-200 text-slate-800 space-y-1 shadow-2xs">
                    <p className="font-medium">{activeConv.lastMessage}</p>
                    <span className="text-[10px] text-slate-400 block text-right">10:15 AM</span>
                  </div>
                </div>

                {/* Previous Staff Message */}
                <div className="flex items-start justify-end gap-2.5 ml-auto max-w-[85%]">
                  <div className="bg-[#934a33] text-white p-3.5 rounded-2xl rounded-tr-none space-y-1 shadow-2xs">
                    <p className="font-medium">Chào anh Hoàng, Lễ tân đã nhận được phản hồi và rất tiếc vì sự cố này. Em đang kiểm tra ngay với bộ phận kỹ thuật ạ.</p>
                    <span className="text-[10px] text-orange-200 block text-right">10:16 AM • Đã gửi</span>
                  </div>
                </div>

                {/* AI Co-Pilot Recommendation Box */}
                {aiDraftActive && activeConv.sentiment === "bức xúc" && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3.5 space-y-2 shadow-sm my-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <Bot className="w-4 h-4 text-[#934a33]" /> AI đề xuất câu trả lời & Giải pháp bồi thường
                      </span>
                      <button
                        onClick={() => setInputMessage(aiSuggestedResponse)}
                        className="text-[11px] bg-[#934a33] text-white px-2.5 py-1 rounded-md font-semibold hover:bg-[#7b3e2b] transition flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3" /> Áp dụng mẫu AI
                      </button>
                    </div>
                    <p className="text-xs text-slate-800 bg-white/80 p-2.5 rounded-lg border border-amber-200/60 leading-relaxed font-medium">
                      "{aiSuggestedResponse}"
                    </p>
                  </div>
                )}
              </div>

              {/* Message Input Form */}
              <div className="p-3 border-t border-slate-200 bg-white space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Nhập câu trả lời hoặc chọn gợi ý từ AI..."
                    className="h-10 text-xs bg-slate-50 border-slate-200"
                  />
                  <Button className="h-10 bg-[#934a33] hover:bg-[#7b3e2b] text-white px-4">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column: Guest Context & Quick Escalation Actions (3 cols) */}
            <div className="lg:col-span-3 space-y-5 flex flex-col">
              {/* Guest Profile Details */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                  Hồ sơ khách hàng
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Họ và tên:</span>
                    <span className="font-bold text-slate-900">{activeConv.guestName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hạng khách:</span>
                    <Badge className="bg-amber-100 text-amber-800 text-[10px]">VIP Gold Member</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mã đặt phòng:</span>
                    <Link href="/staff/bookings/BK-8842" className="font-mono text-[#934a33] font-bold hover:underline">
                      #BK-8842
                    </Link>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số phòng hiện tại:</span>
                    <span className="font-bold text-slate-900">{activeConv.roomNum}</span>
                  </div>
                </div>
              </div>

              {/* Fast Action Escalation Buttons */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm flex-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Xử lý sự cố & Bồi thường
                </h4>

                <div className="space-y-2">
                  <Link href="/staff/alerts" className="block">
                    <Button variant="outline" className="w-full h-9 text-xs justify-start border-red-200 text-red-700 bg-red-50 hover:bg-red-100 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 mr-2" /> Điều kỹ thuật sửa điều hòa (P.402)
                    </Button>
                  </Link>

                  <Link href="/staff/refunds" className="block">
                    <Button variant="outline" className="w-full h-9 text-xs justify-start border-slate-300 text-slate-800 hover:bg-slate-50 font-semibold">
                      <BadgePercent className="w-3.5 h-3.5 mr-2 text-[#934a33]" /> Tặng Voucher bồi thường 15%
                    </Button>
                  </Link>

                  <Button variant="outline" className="w-full h-9 text-xs justify-start border-slate-300 text-slate-800 hover:bg-slate-50 font-semibold">
                    <ShieldAlert className="w-3.5 h-3.5 mr-2 text-amber-600" /> Báo cáo Trưởng ca / Quản lý
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
