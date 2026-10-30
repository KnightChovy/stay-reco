'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AccountSubNav from '@/features/account/AccountSubNav';
import AppBreadcrumb from '@/components/common/breadcrumb/AppBreadcrumb';
import Pagination from '@/components/common/pagination/Pagination';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertCircle,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Headset,
  MapPin,
  QrCode,
  Search,
  ShieldCheck,
  Star,
} from 'lucide-react';
import type { BookingStatus, MyBookingsQuery, PaymentStatus } from '@stayreco/shared';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAuthStore } from '@/lib/auth-store';
import { useMyBookings } from '@/features/booking/api/booking-queries';
import { useDebounce } from '@/hooks/use-debounce';
import { formatDate, formatMoney } from '@/features/stays/lib/format';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80';

type BookingTab = NonNullable<MyBookingsQuery['tab']>;

const STATUS_TABS: { id: BookingTab; label: string }[] = [
  { id: 'upcoming', label: 'Sắp tới' },
  { id: 'staying', label: 'Đang lưu trú' },
  { id: 'completed', label: 'Đã hoàn tất' },
  { id: 'cancelled', label: 'Đã hủy' },
];

const BOOKING_STATUS: Record<BookingStatus, string> = {
  PENDING: 'Chờ thanh toán',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đang lưu trú',
  COMPLETED: 'Đã hoàn tất',
  CANCELLED: 'Đã hủy',
  EXPIRED: 'Hết hạn giữ chỗ',
  NO_SHOW: 'Không đến nhận phòng',
};

const PAYMENT_STATUS: Record<PaymentStatus, string> = {
  UNPAID: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  REFUND_PENDING: 'Chờ hoàn tiền',
  PARTIALLY_REFUNDED: 'Đã hoàn một phần',
  REFUNDED: 'Đã hoàn tiền',
  FAILED: 'Thanh toán thất bại',
};

function tabForStatus(status: BookingStatus): BookingTab {
  if (status === 'PENDING') return 'upcoming';
  if (status === 'CONFIRMED') return 'upcoming';
  if (status === 'CHECKED_IN') return 'staying';
  if (status === 'COMPLETED' || status === 'NO_SHOW') return 'completed';
  return 'cancelled';
}

export default function MyBookingsPage() {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<BookingTab>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(searchQuery);

  const params = useMemo(
    () => ({
      tab: activeTab,
      search: debouncedSearch.trim() || undefined,
      page,
      pageSize: 6,
    }),
    [activeTab, debouncedSearch, page],
  );

  const { data, isLoading, error, refetch } = useMyBookings(params);
  const bookings = data?.bookings ?? [];
  const meta = data?.meta;

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f9ff] font-sans text-[#202B36] antialiased">
      <Header />

      <main className="w-full flex-1 bg-[#f7f9ff]">
        <AccountSubNav activeTab="bookings" />

        <div className="mx-auto w-full max-w-marketplace px-4 py-6 sm:px-6 sm:py-8">
          <AppBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Tài khoản', href: '/account/profile' },
              { label: 'Chuyến đi của tôi', active: true },
            ]}
          />

          <section className="my-6 flex flex-col justify-between gap-4 border-b border-slate-200/60 pb-4 md:flex-row md:items-end">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#934a33]">
                Tài khoản • {user?.name ?? 'Khách hàng'}
              </span>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#013758] sm:text-3xl">
                Chuyến đi của tôi
              </h1>
              <p className="mt-1 max-w-2xl text-xs text-slate-600 sm:text-sm">
                Quản lý đặt phòng, theo dõi lịch trình lưu trú và mở voucher điện tử khi cần check-in.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs">
              <div className="flex size-10 items-center justify-center rounded-lg bg-[#EAF0F5] text-[#013758]">
                <Award className="size-5" />
              </div>
              <div className="text-xs">
                <span className="block text-slate-400">Điểm tích lũy</span>
                <span className="font-bold text-[#202B36]">1.420 điểm (Hạng Bạc)</span>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
              <Card className="space-y-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5">
                <div className="relative w-full">
                  <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Tìm theo mã đơn (ví dụ: SR-261020-0842)…"
                    className="w-full rounded-lg bg-[#f1f3f9] py-2.5 pl-10 pr-4 text-xs text-[#202B36] outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#013758] sm:text-sm"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {STATUS_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setPage(1);
                      }}
                      className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                        activeTab === tab.id
                          ? 'bg-[#234e70] text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-[#202B36]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </Card>

              {error && (
                <Alert variant="destructive" className="bg-red-50 p-4">
                  <AlertTitle>Không tải được chuyến đi</AlertTitle>
                  <AlertDescription className="mt-1 flex flex-col items-start gap-3">
                    <span>{getApiErrorMessage(error, 'Vui lòng thử lại sau.')}</span>
                    <Button size="sm" variant="outline" onClick={() => void refetch()}>
                      Thử lại
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {isLoading && (
                <div className="space-y-4">
                  {[0, 1].map((item) => (
                    <Skeleton key={item} className="h-56 w-full rounded-xl" />
                  ))}
                </div>
              )}

              {!isLoading && !error && bookings.length === 0 && (
                <Card className="rounded-xl border border-slate-200/80 bg-white p-10 text-center shadow-xs">
                  <Calendar className="mx-auto size-9 text-slate-400" />
                  <p className="mt-3 text-sm font-semibold text-[#202B36]">Chưa có chuyến đi nào</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {searchQuery ? 'Không tìm thấy đơn khớp mã đã nhập.' : 'Đặt phòng đầu tiên của bạn ngay hôm nay.'}
                  </p>
                  <Link href="/search">
                    <Button className="mt-4 bg-[#013758] text-white">Tìm chỗ nghỉ</Button>
                  </Link>
                </Card>
              )}

              <div className="space-y-4">
                {bookings.map((booking) => {
                  const tab = tabForStatus(booking.status);
                  const isUpcoming = tab === 'upcoming';
                  const isPending = booking.status === 'PENDING';
                  return (
                    <Card
                      key={booking.id}
                      className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs transition-all hover:shadow-md"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 bg-[#EAF0F5]/60 px-5 py-3 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-[#013758]">Mã đặt phòng: {booking.code}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500">
                            Đặt ngày {formatDate(booking.createdAt.slice(0, 10))}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="gap-1 border-none bg-slate-100 text-[11px] font-semibold text-slate-700">
                            {isPending ? <Clock className="size-3" /> : <CheckCircle2 className="size-3" />}
                            {BOOKING_STATUS[booking.status]}
                          </Badge>
                          <Badge className="border-none bg-[#EAF0F5] text-[11px] font-semibold text-[#013758]">
                            {PAYMENT_STATUS[booking.paymentStatus]}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-col gap-5 p-5 md:flex-row">
                        <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-lg bg-slate-100 md:h-auto md:w-52">
                          <Image
                            src={booking.hotel.coverImageUrl ?? FALLBACK_IMAGE}
                            alt={booking.hotel.name}
                            fill
                            className="object-cover"
                          />
                          <span className="absolute bottom-2 left-2 rounded bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-[#202B36] shadow-xs">
                            {booking.rooms} phòng
                          </span>
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                          <div className="space-y-1.5">
                            <span className="flex items-center gap-1 truncate text-xs text-slate-500">
                              <MapPin className="size-3 text-slate-400" /> {booking.hotel.city}
                            </span>
                            <h3 className="text-lg font-bold tracking-tight text-[#202B36]">
                              {booking.hotel.name}
                            </h3>
                            <p className="text-xs text-slate-600">
                              <strong>{booking.roomType.name}</strong> • {booking.guests} khách
                            </p>

                            <div className="flex items-center justify-between rounded-lg bg-[#f1f3f9] p-2.5 text-xs text-[#202B36]">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="size-4 text-[#013758]" />
                                <span>
                                  <strong>Nhận:</strong> {formatDate(booking.checkIn)}
                                </span>
                              </div>
                              <span>→</span>
                              <div>
                                <span>
                                  <strong>Trả:</strong> {formatDate(booking.checkOut)}
                                </span>
                                <span className="ml-1 text-slate-500">({booking.nights} đêm)</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-start justify-between gap-3 pt-2 sm:flex-row sm:items-end">
                            <div>
                              <span className="block text-xl font-bold text-[#013758]">
                                {formatMoney(booking.totalAmount)}
                              </span>
                              <span className="text-[11px] text-slate-400">Đã bao gồm thuế &amp; phí dịch vụ</span>
                            </div>

                            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                              {isPending ? (
                                <Link href={`/booking/payment?id=${booking.id}`}>
                                  <Button className="h-9 gap-1.5 bg-[#013758] px-4 text-xs font-bold text-white hover:bg-[#193B56]">
                                    Thanh toán ngay
                                  </Button>
                                </Link>
                              ) : (
                                <>
                                  {isUpcoming && (
                                    <Link href={`/booking/confirmation?id=${booking.id}`}>
                                      <Button className="h-9 gap-1.5 bg-[#013758] px-4 text-xs font-bold text-white hover:bg-[#193B56]">
                                        <QrCode className="size-4" />
                                        <span>Xem voucher</span>
                                      </Button>
                                    </Link>
                                  )}
                                  {booking.status === 'COMPLETED' && (
                                    <Link href={`/account/bookings/${booking.id}/review`}>
                                      <Button
                                        variant="outline"
                                        className="h-9 gap-1.5 border-[#934a33] px-3 text-xs font-semibold text-[#934a33] hover:bg-[#F5EBE5]"
                                      >
                                        <Star className="size-3.5 fill-[#934a33]" />
                                        <span>Viết đánh giá</span>
                                      </Button>
                                    </Link>
                                  )}
                                </>
                              )}
                              <Link href={`/account/bookings/${booking.id}`}>
                                <Button
                                  variant="outline"
                                  className="h-9 border-slate-300 px-3 text-xs font-semibold"
                                >
                                  Chi tiết
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {meta && meta.totalPages > 1 && (
                <div className="pt-2">
                  <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
                </div>
              )}
            </div>

            <aside className="space-y-6 lg:sticky lg:top-24 lg:col-span-4">
              <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[#202B36]">
                  <ShieldCheck className="size-4 text-[#35624A]" /> StayReco Protect
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Hỗ trợ 24/7, hoàn tiền theo chính sách hủy của khách sạn và voucher điện tử xác thực.
                </p>
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-[#35624A]" /> Thanh toán an toàn qua SePay
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-[#35624A]" /> Xác nhận tự động trong vài giây
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-[#35624A]" /> Voucher QR chống làm giả
                  </p>
                </div>
              </Card>

              <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[#202B36]">
                  <Headset className="size-4 text-[#934a33]" /> Cần hỗ trợ?
                </h3>
                <p className="mt-2 text-xs text-slate-500">
                  Liên hệ StayReco nếu bạn cần thay đổi thông tin khách hoặc hủy đặt phòng.
                </p>
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#F5EBE5] p-3 text-xs text-[#783520]">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>Hotline 1900 6868 · 8:00 – 22:00</span>
                </div>
              </Card>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
