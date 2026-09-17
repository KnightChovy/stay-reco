"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LineChart,
  TrendingUp,
  Search,
  ChevronRight,
  Sparkles,
  BarChart3,
  DollarSign,
  Users,
  MousePointerClick,
  ArrowUpRight,
  Zap,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function StaffMarketingAnalyticsPage() {
  const topCampaigns = [
    {
      rank: 1,
      title: "Ưu Đãi Mùa Thu — Đặt Phòng Deluxe Ocean King Tặng Voucher Spa 300K",
      platform: "Facebook",
      clicks: "4,520",
      bookings: 142,
      revenue: 71000000,
      roi: "5.2x",
      coverImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
    },
    {
      rank: 2,
      title: "Story Visual: Trải nghiệm Buffet Sáng Hữu Cơ tại An Nhiên Riverside",
      platform: "Instagram",
      clicks: "2,890",
      bookings: 98,
      revenue: 49000000,
      roi: "4.5x",
      coverImage: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80",
    },
    {
      rank: 3,
      title: "Email Newsletter: Tri Ân Hội Viên VIP Gold — Late Check-out 14:00",
      platform: "Email",
      clicks: "1,120",
      bookings: 62,
      revenue: 25000000,
      roi: "4.1x",
      coverImage: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80",
    },
  ];

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
                <span className="text-slate-800 font-medium">Báo cáo & Hiệu quả Marketing</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <LineChart className="w-7 h-7 text-[#934a33]" /> Phân Tích Hiệu Quả Tiếp Thị & ROI
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/staff/marketing/content">
                <Button variant="outline" className="h-10 text-xs font-semibold border-slate-300">
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> Thư Viện Nội Dung AI
                </Button>
              </Link>
              <Link href="/staff/marketing/calendar">
                <Button className="h-10 bg-[#934a33] hover:bg-[#7b3e2b] text-white text-xs font-semibold shadow-md">
                  <Sparkles className="w-4 h-4 mr-1.5" /> Xem Lịch Đăng Bài
                </Button>
              </Link>
            </div>
          </div>

          {/* Metric Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-xs text-slate-500 font-semibold uppercase">Doanh thu từ Marketing</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-[#934a33]">145,000,000 đ</span>
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> +24%
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-xs text-slate-500 font-semibold uppercase">Tổng lượt đặt phòng từ Camp</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900">302 Booking</span>
                <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Tăng trưởng</Badge>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-xs text-slate-500 font-semibold uppercase">Tỷ lệ chuyển đổi (CVR)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900">3.4%</span>
                <span className="text-xs text-slate-500">8,530 Clicks</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-xs text-slate-500 font-semibold uppercase">Chỉ số ROI trung bình</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-emerald-600">4.8x ROI</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
            </div>
          </div>

          {/* AI Strategy Insights Box */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-amber-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#934a33]" /> AI Khuyên: Chiến Lược Tối Ưu Cho Tuần Tới
              </span>
              <Badge className="bg-amber-200 text-amber-900 font-bold text-xs">AI Recommendation</Badge>
            </div>
            <p className="text-xs text-slate-800 leading-relaxed font-medium">
              * Các bài viết định dạng **Story Visual (Instagram)** kèm góc nhìn sông Hàn có tỷ lệ tương tác cao vượt trội **+38%** so với bài viết thông thường.
              <br />
              * Đề xuất: Tăng tần suất xuất bản nội dung loại này vào các khung giờ vàng **18:00 - 20:00 Thứ 5 & Thứ 6**.
            </p>
          </div>

          {/* Top Campaign Leaderboard Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Bảng Xếp Hạng Bài Viết Chuyển Đổi Cao Nhất</h3>
              <Badge variant="outline" className="text-xs font-semibold bg-slate-50">Tháng 10/2026</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Thứ hạng</th>
                    <th className="p-3">Bài viết & Kênh</th>
                    <th className="p-3 text-right">Lượt Clicks</th>
                    <th className="p-3 text-right">Lượt Booking</th>
                    <th className="p-3 text-right">Doanh thu phát sinh</th>
                    <th className="p-3 text-center">Hiệu quả ROI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topCampaigns.map((cmp) => (
                    <tr key={cmp.rank} className="hover:bg-slate-50 transition">
                      <td className="p-3">
                        <span className="w-6 h-6 rounded-full bg-[#934a33] text-white font-bold text-xs flex items-center justify-center">
                          #{cmp.rank}
                        </span>
                      </td>

                      <td className="p-3 max-w-sm">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                            <Image src={cmp.coverImage} alt={cmp.title} fill className="object-cover" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 truncate" title={cmp.title}>{cmp.title}</div>
                            <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-700 mt-0.5">
                              {cmp.platform}
                            </Badge>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 text-right font-medium text-slate-700">{cmp.clicks}</td>

                      <td className="p-3 text-right font-bold text-slate-900">{cmp.bookings} đơn</td>

                      <td className="p-3 text-right font-extrabold text-[#934a33]">
                        {cmp.revenue.toLocaleString("vi-VN")} đ
                      </td>

                      <td className="p-3 text-center">
                        <Badge className="bg-emerald-100 text-emerald-800 font-bold text-xs">
                          {cmp.roi}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
