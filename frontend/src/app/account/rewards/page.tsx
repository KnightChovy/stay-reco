'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppBreadcrumb from '@/common/breadcrumb/AppBreadcrumb';
import AccountSubNav from '@/components/account/AccountSubNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Award,
  Gift,
  Sparkles,
  Ticket,
  Copy,
  CheckCircle2,
  ArrowRight,
  Clock,
  Building2,
  Percent,
  Search
} from 'lucide-react';

export default function RewardsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const vouchers = [
    {
      code: 'STAYAUTUMN15',
      title: 'Giảm 15% cho Resort Đà Lạt & Sapa',
      desc: 'Áp dụng cho đơn phòng từ 2.000.000 ₫. Giảm tối đa 400.000 ₫.',
      expiry: 'Hạn dùng: 30/11/2026',
      tag: 'Ưu đãi mùa Thu',
    },
    {
      code: 'ANHNIEN250',
      title: 'Giảm trực tiếp 250.000 ₫ tại An Nhiên Riverside',
      desc: 'Bảo lưu từ chuyến đi trước. Không giới hạn giá trị đơn tối thiểu.',
      expiry: 'Hạn dùng: 31/12/2026',
      tag: 'Voucher bảo lưu',
    },
    {
      code: 'WELCOME100',
      title: 'Giảm 100.000 ₫ dành cho Thành viên Mới',
      desc: 'Áp dụng cho tất cả khách sạn & resort đối tác StayReco.',
      expiry: 'Hạn dùng: 15/10/2026',
      tag: 'Chào thành viên mới',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased text-foreground">
      <Header />

      <main className="flex-1 w-full bg-[#f7f9ff]">
        <AccountSubNav activeTab="rewards" />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <AppBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Tài khoản', href: '/account/profile' },
              { label: 'Voucher & Điểm thưởng', active: true },
            ]}
          />

          {/* Points Banner */}
          <div className="w-full rounded-2xl bg-gradient-to-r from-[#124b6d] via-[#934a33] to-[#ae583c] p-6 sm:p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md relative overflow-hidden">
            <div className="space-y-2 z-10">
              <span className="inline-flex items-center gap-1 bg-black/25 px-3 py-1 rounded-full text-xs font-semibold border border-white/20">
                <Sparkles className="size-3.5 text-amber-300" /> Hạng thẻ StayReco Elite Bạc
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Ví điểm StayMiles: 2.450 pts</h1>
              <p className="text-xs sm:text-sm text-white/90 max-w-md">
                Tích lũy thêm 550 điểm nữa để thăng hạng <strong className="text-white">StayReco Elite Vàng</strong> và mở khóa ưu đãi giảm 20% độc quyền.
              </p>
            </div>

            <div className="z-10 bg-black/25 p-4 rounded-xl border border-white/20 text-center w-full md:w-auto shrink-0 shadow-inner">
              <span className="text-xs text-white/80 block">Điểm thưởng sắp hết hạn</span>
              <span className="text-lg font-bold text-white block">0 pts</span>
              <span className="text-[10px] text-emerald-300 block mt-0.5">Điểm có giá trị đến 31/12/2027</span>
            </div>
          </div>

          {/* My Vouchers Section */}
          <Card className="p-6 sm:p-8 bg-white border border-border shadow-xs rounded-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Ticket className="size-5 text-amber-500" />
                <h2 className="text-lg font-bold text-foreground">Voucher của tôi ({vouchers.length})</h2>
              </div>
              <div className="flex gap-2">
                <Input placeholder="Nhập mã voucher..." className="h-9 text-xs w-40 sm:w-48" />
                <Button className="h-9 px-4 text-xs font-semibold bg-primary text-primary-foreground">
                  Áp dụng
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {vouchers.map((v) => (
                <div
                  key={v.code}
                  className="p-4 rounded-xl border border-border bg-slate-50 hover:bg-white hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="size-12 rounded-xl bg-orange-100 text-[#934a33] flex items-center justify-center font-bold shrink-0">
                      <Percent className="size-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#934a33] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                          {v.tag}
                        </span>
                        <h3 className="text-sm font-bold text-foreground">{v.title}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">{v.desc}</p>
                      <span className="text-[11px] text-muted-foreground block flex items-center gap-1">
                        <Clock className="size-3" /> {v.expiry}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(v.code)}
                      className="h-9 px-3 text-xs font-semibold gap-1.5 border-dashed text-foreground"
                    >
                      <Copy className="size-3.5" />
                      {copiedCode === v.code ? 'Đã chép!' : v.code}
                    </Button>

                    <Link href="/search">
                      <Button className="h-9 px-4 text-xs font-semibold bg-primary text-primary-foreground gap-1">
                        Dùng ngay <ArrowRight className="size-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Rewards Catalog */}
          <Card className="p-6 sm:p-8 bg-white border border-border shadow-xs rounded-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Gift className="size-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Đổi điểm StayMiles nhận quà</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border bg-slate-50 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Voucher 100.000 ₫</h4>
                    <p className="text-xs text-muted-foreground">Áp dụng cho mọi khách sạn 4-5 sao</p>
                  </div>
                  <Badge className="bg-primary/10 text-primary font-bold">500 pts</Badge>
                </div>
                <Button className="w-full h-9 text-xs font-semibold bg-primary text-primary-foreground">
                  Đổi ngay (500 pts)
                </Button>
              </div>

              <div className="p-4 rounded-xl border border-border bg-slate-50 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Trà chiều miễn phí</h4>
                    <p className="text-xs text-muted-foreground">Tặng 1 set trà chiều tại An Nhiên Riverside</p>
                  </div>
                  <Badge className="bg-orange-100 text-[#934a33] font-bold border border-orange-200">1.000 pts</Badge>
                </div>
                <Button className="w-full h-9 text-xs font-semibold bg-[#934a33] text-white hover:bg-[#7a341e]">
                  Đổi ngay (1.000 pts)
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
