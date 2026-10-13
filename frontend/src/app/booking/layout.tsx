import type { ReactNode } from 'react';
import BookingProgress from '@/features/booking/BookingProgress';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';

export default function BookingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f7f9ff] font-sans text-[#202B36] antialiased">
      <Header />
      <BookingProgress />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
