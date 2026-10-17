'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { OtpVerification } from '@/features/auth/OtpVerification';
import { AlertTriangle } from 'lucide-react';
import { getSafeNextPath } from '@/lib/auth-store';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const next = searchParams.get('next');

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased text-foreground">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
        <div className="w-full max-w-md bg-white rounded-2xl border border-border shadow-sm p-6 sm:p-8">
          {email ? (
            <OtpVerification
              email={email}
              onVerified={() => router.replace(getSafeNextPath(next))}
            />
          ) : (
            <div className="py-4 text-center">
              <div className="size-14 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="size-8" />
              </div>
              <h1 className="text-xl font-bold text-foreground">
                Thiếu thông tin xác thực
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-2 leading-relaxed">
                Không tìm thấy địa chỉ email cần xác thực. Vui lòng đăng ký hoặc
                đăng nhập để nhận mã xác thực mới.
              </p>
              <div className="mt-6 space-y-3">
                <Link href="/login" className="block w-full">
                  <Button className="w-full h-11 bg-primary text-primary-foreground hover:bg-[#193b56] font-semibold text-sm">
                    Đến trang Đăng nhập
                  </Button>
                </Link>
                <Link href="/register" className="block w-full">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 text-sm font-semibold"
                  >
                    Tạo tài khoản mới
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
