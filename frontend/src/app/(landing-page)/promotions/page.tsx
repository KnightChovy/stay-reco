import type { Metadata } from 'next';
import Link from 'next/link';
import { BadgePercent, CalendarClock, Search, Tag, Ticket } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppBreadcrumb from '@/components/common/breadcrumb/AppBreadcrumb';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Ưu đãi | StayReco',
};

const UPCOMING = [
  {
    icon: Tag,
    title: 'Khuyến mãi của khách sạn',
    text: 'Các chương trình giảm giá đang diễn ra, kèm thời hạn và điều kiện áp dụng.',
  },
  {
    icon: Ticket,
    title: 'Mã giảm giá',
    text: 'Nhập mã khi đặt phòng để được trừ thẳng vào tổng tiền.',
  },
  {
    icon: CalendarClock,
    title: 'Ưu đãi đặt sớm và phút chót',
    text: 'Gom các khách sạn đang giảm giá theo ngày bạn chọn.',
  },
];

/** Promotions arrive with phase 4 (docs/phases/phase-4-loyalty-promotions.md); the backend has no API for them yet. */
export default function PromotionsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafbfc] text-[#2D3748]">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-grow px-4 py-6 sm:px-6 lg:px-8">
        <AppBreadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Ưu đãi' }]} className="mb-4" />

        <section className="rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-2xs sm:p-10">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <BadgePercent className="size-7" aria-hidden="true" />
          </div>
          <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            Sắp ra mắt
          </span>
          <h1 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">Ưu đãi đang diễn ra</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-gray-500">
            Trang tổng hợp khuyến mãi đang được hoàn thiện. Trong lúc chờ, giá bạn thấy khi tìm phòng đã gồm các mức
            giảm giá mà khách sạn đang áp dụng (đặt sớm, phút chót, theo mùa).
          </p>
          <Link href="/search" className="mt-6 inline-block">
            <Button className="gap-2">
              <Search className="size-4" aria-hidden="true" /> Tìm khách sạn
            </Button>
          </Link>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3" aria-label="Sắp có trên trang này">
          {UPCOMING.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs">
              <Icon className="mb-3 size-5 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-bold text-gray-900">{title}</h2>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">{text}</p>
            </div>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
