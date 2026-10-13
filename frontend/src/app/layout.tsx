import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import AuthRouteGuard from '@/features/auth/AuthRouteGuard';
import { Providers } from '../provider/query-provider';
import './globals.css';

const beVietnamPro = Be_Vietnam_Pro({
  variable: '--font-be-vietnam-pro',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'StayReco - Nền tảng Đặt phòng Khách sạn & Du lịch',
  description: 'Trải nghiệm đặt phòng tốt nhất cùng StayReco',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>
          <AuthRouteGuard>{children}</AuthRouteGuard>
        </Providers>
      </body>
    </html>
  );
}
