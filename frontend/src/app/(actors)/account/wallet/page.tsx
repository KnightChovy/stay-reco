'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppBreadcrumb from '@/components/common/breadcrumb/AppBreadcrumb';
import AccountSubNav from '@/features/account/AccountSubNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Building2,
  CreditCard
} from 'lucide-react';

export default function WalletPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const transactions = [
    {
      id: 'TX-981240',
      type: 'refund',
      title: 'Hoàn tiền hủy phòng #SR-261020-0842',
      amount: '+2.250.000 ₫',
      date: '14/09/2026 (15:30)',
      status: 'Đã hoàn thành',
      method: 'VNPay QR',
    },
    {
      id: 'TX-771020',
      type: 'payment',
      title: 'Thanh toán đơn phòng #SR-892410',
      amount: '-3.920.000 ₫',
      date: '10/09/2026 (09:15)',
      status: 'Thành công',
      method: 'Ví StayReco',
    },
    {
      id: 'TX-651200',
      type: 'withdraw',
      title: 'Rút tiền về Vietcombank (****8899)',
      amount: '-1.500.000 ₫',
      date: '01/09/2026 (18:45)',
      status: 'Thành công',
      method: 'Chuyển khoản NH',
    },
  ];

  const handleWithdraw = () => {
    setToastMessage('Yêu cầu rút 2.250.000 ₫ về ngân hàng đã được gửi thành công! Tiền sẽ về trong 24h.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased text-foreground">
      <Header />

      <main className="flex-1 w-full bg-[#f7f9ff]">
        <AccountSubNav activeTab="wallet" />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <AppBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Tài khoản', href: '/account/profile' },
              { label: 'Ví StayReco Wallet & Hoàn tiền', active: true },
            ]}
          />

          {/* Wallet Balance Card */}
          <div className="w-full rounded-2xl bg-linear-to-r from-[#124b6d] via-[#193b56] to-[#ae583c] p-6 sm:p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold">
                <Wallet className="size-3.5" /> Ví điện tử StayReco Wallet
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">2.250.000 ₫</h1>
              <p className="text-xs sm:text-sm text-white/80">
                Số dư khả dụng từ tiền hoàn trả và tích lũy giao dịch.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
              <Button
                onClick={handleWithdraw}
                className="h-11 px-5 bg-white text-primary hover:bg-slate-100 font-bold text-xs sm:text-sm shadow-xs"
              >
                Rút tiền về Ngân hàng
              </Button>
              <Link href="/search">
                <Button className="h-11 px-5 bg-[#ae583c] text-white hover:bg-[#934a33] font-bold text-xs sm:text-sm shadow-xs border-0">
                  Dùng thanh toán đơn mới
                </Button>
              </Link>
            </div>
          </div>

          {/* Transaction History */}
          <Card className="p-6 sm:p-8 bg-white border border-border shadow-xs rounded-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Lịch sử giao dịch ví & Hoàn tiền</h2>
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 text-xs">
                PCI-DSS Secured
              </Badge>
            </div>

            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 rounded-xl border border-border bg-slate-50 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                        tx.type === 'refund'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tx.type === 'refund' ? (
                        <ArrowDownLeft className="size-5" />
                      ) : (
                        <ArrowUpRight className="size-5" />
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-foreground">{tx.title}</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {tx.date} • Phương thức: {tx.method}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm sm:text-base font-bold block ${
                        tx.type === 'refund' ? 'text-emerald-600' : 'text-foreground'
                      }`}
                    >
                      {tx.amount}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
          <div>
            <h4 className="text-xs sm:text-sm font-bold">Thao tác thành công!</h4>
            <p className="text-[11px] text-white/80">{toastMessage}</p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
