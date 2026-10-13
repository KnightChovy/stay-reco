"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Share2,
  Zap,
  Wand2,
  RefreshCw,
  ThumbsUp,
  MessageCircle,
  Eye,
  Bot,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function StaffMarketingContentEditPage() {
  const [selectedTone, setSelectedTone] = useState<string>("Sang trọng & Cuốn hút");
  const [promoOffer, setPromoOffer] = useState<string>("Giảm 15% + Miễn phí Spa 300K");
  const [contentTitle, setContentTitle] = useState<string>(
    "Ưu Đãi Mùa Thu — Đặt Phòng Deluxe Ocean King Tặng Voucher Spa 300K"
  );
  const [contentBody, setContentBody] = useState<string>(
    `🍂 Thưởng thức cảnh bình minh sông Hàn ngoạn mục ngay từ ban công phòng Deluxe Ocean King!

Đặt phòng tuần này qua hệ thống StayReco để nhận ngay gói ưu đãi độc quyền:
✨ Tặng Voucher Spa thư giãn trị giá 300.000 VNĐ
✨ Buffet sáng hữu cơ cao cấp phục vụ tại nhà hàng Riverside
✨ Hỗ trợ Check-in sớm linh hoạt theo tình trạng phòng

📍 An Nhiên Riverside Hotel — 128 Bạch Đằng, Đà Nẵng
👉 Đặt ngay để giữ giá tốt nhất!`
  );

  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const handleAiPolish = (type: "short" | "engaging" | "emoji") => {
    setIsGenerating(true);
    setTimeout(() => {
      if (type === "short") {
        setContentBody(
          `🌊 Nghỉ dưỡng sang trọng tại An Nhiên Riverside! Đặt Deluxe Ocean King tuần này nhận ngay Voucher Spa 300K & Buffet sáng hữu cơ. Đặt phòng ngay trên StayReco!`
        );
      } else if (type === "engaging") {
        setContentBody(
          `✨ Bạn đã sẵn sàng cho chuyến đi Đà Nẵng hoàn hảo? Phòng Deluxe Ocean King hướng sông Hàn thơ mộng đang chờ bạn! Tặng kèm Voucher Spa 300K & Buffet sáng cao cấp khi đặt phòng hôm nay!`
        );
      } else {
        setContentBody(
          `🍂 ✨ 🌿 NGHỈ DƯỠNG MÙA THU TẠI AN NHIÊN RIVERSIDE! 🏨 🌊
🎁 Đặt Deluxe Ocean King tặng ngay Voucher Spa 300.000đ & Buffet hữu cơ!
👉 Đặt ngay qua StayReco! #StayReco #AnNhienRiverside #DaNangTrip #LuxuriousStay`
        );
      }
      setIsGenerating(false);
    }, 600);
  };

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
                <Link href="/staff/marketing/content" className="hover:text-[#934a33]">Nội dung AI</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-slate-800 font-medium">Soạn & Duyệt Nội Dung AI</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Wand2 className="w-7 h-7 text-[#934a33]" /> AI Marketing Co-Pilot Editor
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/staff/marketing/content">
                <Button variant="outline" className="h-10 text-xs font-semibold border-slate-300">
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> Thư Viện Nội Dung
                </Button>
              </Link>
              <Link href="/staff/marketing/calendar">
                <Button className="h-10 bg-[#934a33] hover:bg-[#7b3e2b] text-white text-xs font-semibold shadow-md">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Duyệt & Lên Lịch Đăng Bài
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: AI Prompt Controls (3 cols) */}
            <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-[#934a33]" /> Cấu hình gợi ý AI
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phong cách giọng văn (Tone):</label>
                  <select
                    value={selectedTone}
                    onChange={(e) => setSelectedTone(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-300 bg-slate-50 text-xs px-3 font-medium text-slate-800"
                  >
                    <option value="Sang trọng & Cuốn hút">✨ Sang trọng & Cuốn hút</option>
                    <option value="Thân thiện & Đô thị">😊 Thân thiện & Trẻ trung</option>
                    <option value="Khuyến mãi & Thúc đẩy">🔥 Khuyến mãi & Thúc đẩy booking</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Gói ưu đãi đính kèm:</label>
                  <Input
                    value={promoOffer}
                    onChange={(e) => setPromoOffer(e.target.value)}
                    className="h-9 text-xs bg-slate-50"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Hạng phòng trọng tâm:</label>
                  <Input defaultValue="Deluxe Ocean King" className="h-9 text-xs bg-slate-50" />
                </div>

                <Button
                  className="w-full h-10 bg-[#934a33] hover:bg-[#7b3e2b] text-white text-xs font-semibold shadow-2xs"
                  onClick={() => handleAiPolish("engaging")}
                  disabled={isGenerating}
                >
                  <RefreshCw className={`w-4 h-4 mr-1.5 ${isGenerating ? "animate-spin" : ""}`} />
                  Tạo lại bản nháp bằng AI
                </Button>
              </div>
            </div>

            {/* Middle Column: Text Editor & Quick Polish Actions (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Trình biên tập văn bản & AI Polish
                </h3>
                <span className="text-[11px] text-slate-400">Đã lưu tự động</span>
              </div>

              {/* Quick AI Polish Action Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => handleAiPolish("short")}
                  className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-semibold hover:bg-amber-100 transition shrink-0 flex items-center gap-1"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-600" /> ✨ Rút ngắn bài viết
                </button>
                <button
                  onClick={() => handleAiPolish("engaging")}
                  className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-900 border border-purple-200 font-semibold hover:bg-purple-100 transition shrink-0 flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" /> ✨ Tăng sức thuyết phục
                </button>
                <button
                  onClick={() => handleAiPolish("emoji")}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 font-semibold hover:bg-blue-100 transition shrink-0 flex items-center gap-1"
                >
                  ✨ Thêm Emoji & Hashtag
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tiêu đề bài viết (Headline):</label>
                  <Input
                    value={contentTitle}
                    onChange={(e) => setContentTitle(e.target.value)}
                    className="h-10 text-xs font-bold bg-slate-50 border-slate-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nội dung chi tiết (Caption):</label>
                  <textarea
                    rows={12}
                    value={contentBody}
                    onChange={(e) => setContentBody(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3.5 text-xs text-slate-800 font-medium leading-relaxed bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#934a33]"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Live Device Social Preview (4 cols) */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-[#934a33]" /> Xem trước hiển thị trên Facebook
                  </h3>
                  <Badge className="bg-amber-100 text-amber-800 text-[10px]">Độ dài lý tưởng</Badge>
                </div>

                {/* Facebook Post Card Simulation */}
                <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white shadow-2xs text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#934a33] text-white font-bold text-xs flex items-center justify-center">
                      AN
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">An Nhiên Riverside Hotel</h4>
                      <span className="text-[10px] text-slate-400">Được tài trợ • 🌐</span>
                    </div>
                  </div>

                  <p className="text-slate-800 whitespace-pre-line leading-relaxed text-xs">
                    {contentBody}
                  </p>

                  <div className="relative h-44 w-full rounded-lg overflow-hidden border border-slate-200">
                    <Image
                      src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 font-semibold">
                    <span className="flex items-center gap-1 text-[#934a33]"><ThumbsUp className="w-3.5 h-3.5" /> 142 Thích</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> 28 Bình luận</span>
                    <span className="flex items-center gap-1"><Share2 className="w-3.5 h-3.5" /> 12 Chia sẻ</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href="/staff/marketing/calendar">
                    <Button className="w-full h-10 bg-[#934a33] hover:bg-[#7b3e2b] text-white font-semibold text-xs shadow-md">
                      <Calendar className="w-4 h-4 mr-2" /> Duyệt Nội Dung & Đưa Vào Lịch Đăng Bài
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
