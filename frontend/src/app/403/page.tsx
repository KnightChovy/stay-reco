'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft, Home, KeyRound } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased text-foreground">
      <Header />

      <main className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-8 sm:p-10 rounded-2xl border border-border shadow-xs">
          <div className="size-20 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-xs">
            <ShieldAlert className="size-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full">
              Lỗi 403 - Forbidden
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Không có quyền truy cập
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Trang bạn đang truy cập yêu cầu quyền quản trị viên hoặc cấp tài khoản đối tác StayReco cao hơn.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-11 px-6 bg-primary text-primary-foreground font-semibold text-xs sm:text-sm gap-2">
                <Home className="size-4" /> Về trang chủ
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto h-11 px-6 font-semibold text-xs sm:text-sm gap-2">
                <KeyRound className="size-4" /> Đăng nhập lại
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
