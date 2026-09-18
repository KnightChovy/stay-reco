"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  Search,
  Plus,
  ChevronRight,
  Calendar,
  Share2,
  ThumbsUp,
  Edit,
  Eye,
  CheckCircle2,
  Clock,
  BarChart3,
  Mail,
  Zap,
  Camera,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ContentCardItem {
  id: string;
  title: string;
  previewText: string;
  coverImage: string;
  platform: "Facebook" | "Instagram" | "Email" | "Zalo";
  aiScore: number;
  status: "Bản nháp" | "Đã duyệt" | "Đã xuất bản";
  updatedAt: string;
  targetAudience: string;
}

export default function StaffMarketingContentPage() {
  const [activeTab, setActiveTab] = useState<"all" | "fb" | "insta" | "email">("all");

  const contents: ContentCardItem[] = [
    {
      id: "cnt-1",
      title: "Ưu Đãi Mùa Thu — Đặt Phòng Deluxe Ocean King Tặng Voucher Spa 300K",
      previewText: "🍂 Thưởng thức cảnh bình minh sông Hàn ngoạn mục ngay từ ban công phòng Deluxe Ocean King! Đặt phòng tuần này nhận ngay Voucher Spa & Buffet hữu cơ...",
      coverImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
      platform: "Facebook",
      aiScore: 95,
      status: "Đã duyệt",
      updatedAt: "Hôm nay 10:00",
      targetAudience: "Khách gia đình & Cặp đôi",
    },
    {
      id: "cnt-2",
      title: "Story Visual: Trải nghiệm Buffet Sáng Hữu Cơ tại An Nhiên Riverside",
      previewText: "Bắt đầu ngày mới đầy năng lượng với nguyên liệu rau củ sạch trồng tại trang trại hữu cơ riêng. Đặt ngay qua StayReco để nhận thêm VIP Lounge...",
      coverImage: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80",
      platform: "Instagram",
      aiScore: 91,
      status: "Bản nháp",
      updatedAt: "13/10/2026",
      targetAudience: "Gen Z & Khách du lịch trẻ",
    },
    {
      id: "cnt-3",
      title: "Email Newsletter: Tri Ân Hội Viên VIP Gold — Đặc Quyền Late Check-out 14:00",
      previewText: "Kính gửi quý khách VIP, cảm ơn bạn đã đồng hành cùng StayReco. Khách sạn trân trọng gửi tặng ưu đãi Nâng hạng phòng miễn phí...",
      coverImage: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80",
      platform: "Email",
      aiScore: 88,
      status: "Đã xuất bản",
      updatedAt: "12/10/2026",
      targetAudience: "Hội viên VIP Gold",
    },
  ];

  const filteredContents = contents.filter((c) => {
    if (activeTab === "fb") return c.platform === "Facebook";
    if (activeTab === "insta") return c.platform === "Instagram";
    if (activeTab === "email") return c.platform === "Email";
    return true;
  });

  return (
    <div className="font-sans antialiased text-foreground">
      <main>
        <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Breadcrumb & Title */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <Link href="/staff/dashboard" className="hover:text-[#934a33]">Bàn làm việc</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-slate-800 font-medium">Marketing & Thư viện nội dung AI</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-7 h-7 text-[#934a33]" /> Thư Viện Nội Dung Marketing AI
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/staff/marketing/calendar">
                <Button variant="outline" className="h-10 text-xs font-semibold border-slate-300">
                  <Calendar className="w-4 h-4 mr-1.5" /> Xem Lịch Đăng Bài
                </Button>
              </Link>
              <Link href="/staff/marketing/content/cnt-1">
                <Button className="h-10 bg-[#934a33] hover:bg-[#7b3e2b] text-white text-xs font-semibold shadow-md">
                  <Plus className="w-4 h-4 mr-1.5" /> Tạo Nội Dung Mới Bằng AI
                </Button>
              </Link>
            </div>
          </div>

          {/* Metric Stats Header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-xs text-slate-500 font-semibold uppercase">Nội dung đã khởi tạo AI</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900">24 Bài viết</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-xs text-slate-500 font-semibold uppercase">Dự đoán tỷ lệ tương tác AI</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-emerald-600">92% Điểm cao</span>
                <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Tối ưu tốt</Badge>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-xs text-slate-500 font-semibold uppercase">Bài viết đã xuất bản</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900">18 Bài</span>
                <span className="text-xs text-slate-500">Trên 3 kênh</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-xs text-slate-500 font-semibold uppercase">Doanh thu chuyển đổi</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-[#934a33]">145,000,000 đ</span>
                <Badge className="bg-amber-100 text-amber-800 text-[10px]">ROI 4.8x</Badge>
              </div>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === "all"
                    ? "bg-[#934a33] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Tất cả bài viết ({contents.length})
              </button>
              <button
                onClick={() => setActiveTab("fb")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === "fb"
                    ? "bg-[#934a33] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Facebook (1)
              </button>
              <button
                onClick={() => setActiveTab("insta")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === "insta"
                    ? "bg-[#934a33] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Instagram (1)
              </button>
              <button
                onClick={() => setActiveTab("email")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === "email"
                    ? "bg-[#934a33] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Email (1)
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input placeholder="Tìm nội dung, chiến dịch..." className="pl-9 h-9 text-xs bg-slate-50" />
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContents.map((cnt) => (
              <div
                key={cnt.id}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 w-full bg-slate-100">
                    <Image
                      src={cnt.coverImage}
                      alt={cnt.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <Badge className="bg-slate-900/80 backdrop-blur-md text-white font-bold text-[10px]">
                        {cnt.platform}
                      </Badge>
                      <Badge className="bg-amber-500 text-white font-bold text-[10px] flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> AI {cnt.aiScore} pts
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Đối tượng: <strong className="text-slate-800">{cnt.targetAudience}</strong></span>
                      <span>{cnt.updatedAt}</span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug">{cnt.title}</h3>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-medium">
                      {cnt.previewText}
                    </p>
                  </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <Badge
                    className={`${
                      cnt.status === "Đã xuất bản"
                        ? "bg-emerald-100 text-emerald-800"
                        : cnt.status === "Đã duyệt"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {cnt.status}
                  </Badge>

                  <Link href={`/staff/marketing/content/${cnt.id}`}>
                    <Button className="h-8 text-xs bg-[#934a33] hover:bg-[#7b3e2b] text-white font-semibold">
                      <Edit className="w-3.5 h-3.5 mr-1" /> Chỉnh sửa AI
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
