"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Plus,
  ChevronRight,
  Clock,
  Mail,
  Share2,
  Sparkles,
  Zap,
  Globe,
  Settings,
  ArrowLeft,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ScheduledPost {
  id: string;
  title: string;
  channel: "Facebook" | "Instagram" | "Email" | "Zalo";
  scheduledTime: string;
  status: "Chờ đăng" | "Đã đăng thành công" | "Bản nháp";
  author: string;
}

export default function StaffMarketingCalendarPage() {
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([
    {
      id: "sch-1",
      title: "Ưu Đãi Mùa Thu — Đặt Phòng Deluxe Ocean King Tặng Voucher Spa 300K",
      channel: "Facebook",
      scheduledTime: "20/10/2026 18:00",
      status: "Chờ đăng",
      author: "Nguyễn Hương Ly",
    },
    {
      id: "sch-2",
      title: "Story Visual: Trải nghiệm Buffet Sáng Hữu Cơ tại An Nhiên Riverside",
      channel: "Instagram",
      scheduledTime: "21/10/2026 09:00",
      status: "Chờ đăng",
      author: "AI Marketing",
    },
    {
      id: "sch-3",
      title: "Email Tri Ân Hội Viên VIP Gold — Tặng Voucher Late Check-out 14:00",
      channel: "Email",
      scheduledTime: "15/10/2026 10:00",
      status: "Đã đăng thành công",
      author: "Nguyễn Hương Ly",
    },
  ]);

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
                <span className="text-slate-800 font-medium">Lịch đăng bài & Kết nối kênh</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-7 h-7 text-[#934a33]" /> Lịch Đăng Bài & Quản Lý Kênh Truyền Thông
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/staff/marketing/content">
                <Button variant="outline" className="h-10 text-xs font-semibold border-slate-300">
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> Thư Viện Nội Dung AI
                </Button>
              </Link>
              <Link href="/staff/marketing/analytics">
                <Button className="h-10 bg-[#934a33] hover:bg-[#7b3e2b] text-white text-xs font-semibold shadow-md">
                  <Sparkles className="w-4 h-4 mr-1.5" /> Hiệu Quả Marketing
                </Button>
              </Link>
            </div>
          </div>

          {/* Social Channel Connections Cards (4 Channels) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Trạng thái kết nối kênh Social Media
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-blue-600" /> Facebook Fanpage
                  </span>
                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Đã kết nối</Badge>
                </div>
                <p className="text-[11px] text-slate-500">15.2k Theo dõi • Tự động đăng ON</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-pink-600" /> Instagram Business
                  </span>
                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Đã kết nối</Badge>
                </div>
                <p className="text-[11px] text-slate-500">8.4k Theo dõi • Story & Reels</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-emerald-600" /> Zalo Official Account
                  </span>
                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Đã kết nối</Badge>
                </div>
                <p className="text-[11px] text-slate-500">Gửi ZNS CSKH tự động</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-amber-600" /> Email Marketing API
                  </span>
                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Đã kết nối</Badge>
                </div>
                <p className="text-[11px] text-slate-500">SendGrid / StayReco Mailer</p>
              </div>
            </div>
          </div>

          {/* Calendar Schedule Grid / Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Danh Sách Bài Đăng Theo Lịch (Tháng 10/2026)</h3>
                <p className="text-xs text-slate-500">Hệ thống sẽ tự động đăng bài lên các kênh đúng mốc giờ đã chọn</p>
              </div>
              <Link href="/staff/marketing/content">
                <Button className="h-9 bg-[#934a33] hover:bg-[#7b3e2b] text-white text-xs font-semibold shadow-2xs">
                  <Plus className="w-4 h-4 mr-1.5" /> Thêm Bài Đăng Mới
                </Button>
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Kênh truyền thông</th>
                    <th className="p-3">Tiêu đề bài đăng</th>
                    <th className="p-3">Thời gian đăng dự kiến</th>
                    <th className="p-3">Người biên soạn</th>
                    <th className="p-3 text-center">Trạng thái</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scheduledPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-slate-50 transition">
                      <td className="p-3">
                        <Badge variant="outline" className="font-bold text-slate-800 bg-slate-100">
                          {post.channel}
                        </Badge>
                      </td>
                      <td className="p-3 font-semibold text-slate-900 max-w-sm truncate">
                        {post.title}
                      </td>
                      <td className="p-3 font-mono font-bold text-[#934a33]">
                        {post.scheduledTime}
                      </td>
                      <td className="p-3 text-slate-600">{post.author}</td>
                      <td className="p-3 text-center">
                        <Badge
                          className={`${
                            post.status === "Đã đăng thành công"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {post.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Link href="/staff/marketing/content/sch-1">
                          <Button variant="outline" className="h-8 text-xs font-semibold border-slate-300">
                            Chỉnh sửa
                          </Button>
                        </Link>
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
