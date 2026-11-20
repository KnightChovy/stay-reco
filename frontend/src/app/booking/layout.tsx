import type { ReactNode } from 'react';
import BookingProgress from '@/features/booking/BookingProgress';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';

export default function BookingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f7f9ff] font-sans text-[#202B36] antialiased">
      {/* Printing the confirmation keeps the voucher and the stay, not the site chrome. */}
      <div className="contents print:hidden">
        <Header />
        <BookingProgress />
      </div>
      <main className="flex-1">{children}</main>
      <div className="contents print:hidden">
        <Footer />
      </div>
    </div>
  );
}
