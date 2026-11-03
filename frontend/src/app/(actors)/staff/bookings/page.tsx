'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { BookingStatus, PaymentStatus } from '@stayreco/shared';
import {
  CalendarDays,
  Check,
  Copy,
  Download,
  Loader2,
  ReceiptText,
  Search,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import Pagination from '@/components/common/pagination/Pagination';
import { useStaffHotel } from '@/features/staff/components/StaffHotelProvider';
import { useHotelBookings } from '@/features/staff/api/staff-queries';
import {
  bookingStatusLabels,
  formatCalendarDate,
  formatDateTime,
  formatMoney,
  paymentStatusLabels,
  toneClasses,
} from '@/features/staff/lib/labels';
import { getApiErrorMessage } from '@/lib/api-error';
import { useDebounce } from '@/hooks/use-debounce';

type StatusTab = 'all' | 'pending' | 'confirmed' | 'staying' | 'completed' | 'cancelled';

const STATUS_TABS: { id: StatusTab; label: string; statuses?: BookingStatus[] }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending', label: 'Chờ thanh toán', statuses: ['PENDING'] },
  { id: 'confirmed', label: 'Đã xác nhận', statuses: ['CONFIRMED'] },
  { id: 'staying', label: 'Đang lưu trú', statuses: ['CHECKED_IN'] },
  { id: 'completed', label: 'Đã hoàn tất', statuses: ['COMPLETED', 'NO_SHOW'] },
  { id: 'cancelled', label: 'Đã huỷ', statuses: ['CANCELLED', 'EXPIRED'] },
];

const PAYMENT_OPTIONS: { value: 'all' | PaymentStatus; label: string }[] = [
  { value: 'all', label: 'Tất cả thanh toán' },
  { value: 'UNPAID', label: 'Chưa thanh toán' },
  { value: 'PAID', label: 'Đã thanh toán' },
  { value: 'REFUND_PENDING', label: 'Chờ hoàn tiền' },
  { value: 'PARTIALLY_REFUNDED', label: 'Đã hoàn một phần' },
  { value: 'REFUNDED', label: 'Đã hoàn tiền' },
  { value: 'FAILED', label: 'Thanh toán thất bại' },
];

const SORT_OPTIONS = [
  { value: 'check-in-asc', label: 'Check-in sớm nhất' },
  { value: 'check-in-desc', label: 'Check-in muộn nhất' },
  { value: 'created-desc', label: 'Mới đặt gần đây' },
] as const;

const PAGE_SIZE = 10;

export default function StaffBookingsPage() {
  const { hotel, isLoading: hotelLoading } = useStaffHotel();
  const hotelId = hotel?.summary.id;

  const [tab, setTab] = useState<StatusTab>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [payment, setPayment] = useState<'all' | PaymentStatus>('all');
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]['value']>('check-in-asc');
  const [checkInFrom, setCheckInFrom] = useState('');
  const [checkInTo, setCheckInTo] = useState('');
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      status: STATUS_TABS.find((item) => item.id === tab)?.statuses,
      paymentStatus: payment === 'all' ? undefined : [payment],
      search: debouncedSearch.trim() || undefined,
      checkInFrom: checkInFrom || undefined,
      checkInTo: checkInTo || undefined,
      sort,
      page,
      pageSize: PAGE_SIZE,
    }),
    [tab, payment, debouncedSearch, checkInFrom, checkInTo, sort, page],
  );

  const { data, isLoading, isFetching, error, refetch } = useHotelBookings(hotelId, params);
  const bookings = data?.bookings ?? [];
  const meta = data?.meta;

  const resetPage = () => setPage(1);

  const copyToClipboard = (code: string) => {
    void navigator.clipboard.writeText(code);
    setCopiedId(code);
    window.setTimeout(() => setCopiedId(null), 1800);
  };

  const exportCsv = () => {
    const header = ['Mã đơn', 'Hạng phòng', 'Check-in', 'Check-out', 'Số đêm', 'Phòng', 'Khách', 'Tổng tiền', 'Thanh toán', 'Trạng thái'];
    const lines = bookings.map((booking) => [
      booking.code,
      booking.roomType.name,
      booking.checkIn,
      booking.checkOut,
      booking.nights,
      booking.rooms,
      booking.guests,
      booking.totalAmount,
      paymentStatusLabels[booking.paymentStatus].label,
      bookingStatusLabels[booking.status].label,
    ]);
    const csv = [header, ...lines]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stayreco-bookings-${hotelId ?? 'hotel'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setTab('all');
    setSearch('');
    setPayment('all');
    setSort('check-in-asc');
    setCheckInFrom('');
    setCheckInTo('');
    setPage(1);
  };

  const activeFilters = [
    tab !== 'all' ? STATUS_TABS.find((item) => item.id === tab)?.label : null,
    payment !== 'all' ? PAYMENT_OPTIONS.find((item) => item.value === payment)?.label : null,
    checkInFrom ? `Từ ${formatCalendarDate(checkInFrom)}` : null,
    checkInTo ? `Đến ${formatCalendarDate(checkInTo)}` : null,
  ].filter(Boolean);

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold uppercase text-primary-foreground">
              Staff Operations
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              Dữ liệu trực tiếp từ PMS
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            Danh sách đặt phòng
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground lg:text-sm">
            {hotel?.summary.name ?? 'Khách sạn của bạn'} · chỉ đọc, cần quyền BOOKING hoặc REFUND
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 rounded-xl border border-border bg-white px-3.5 py-2 shadow-2xs sm:flex">
            <ReceiptText className="size-4 text-primary" />
            <div>
              <span className="block text-[10px] font-semibold uppercase text-muted-foreground">
                Tổng đơn khớp bộ lọc
              </span>
              <span className="text-xs font-bold text-foreground">
                {meta?.total ?? (isLoading ? '…' : bookings.length)} đơn
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={exportCsv}
            disabled={bookings.length === 0}
            className="h-11 gap-2 border-border bg-white text-xs font-semibold shadow-2xs"
          >
            <Download className="size-4" />
            <span>Xuất CSV</span>
          </Button>
        </div>
      </div>

      <Card className="space-y-4 rounded-xl border border-border bg-white p-4 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {STATUS_TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id);
                resetPage();
              }}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                tab === item.id
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'bg-slate-100 text-muted-foreground hover:bg-slate-200/70 hover:text-foreground'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="relative md:col-span-4">
            <Search className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                resetPage();
              }}
              placeholder="Tìm mã đơn hoặc tên khách…"
              className="h-11 border-border bg-slate-50 pl-10 text-xs font-medium"
            />
          </div>

          <div className="md:col-span-2">
            <Input
              type="date"
              aria-label="Check-in từ ngày"
              value={checkInFrom}
              onChange={(event) => {
                setCheckInFrom(event.target.value);
                resetPage();
              }}
              className="h-11 bg-slate-50 text-xs"
            />
          </div>
          <div className="md:col-span-2">
            <Input
              type="date"
              aria-label="Check-in đến ngày"
              min={checkInFrom || undefined}
              value={checkInTo}
              onChange={(event) => {
                setCheckInTo(event.target.value);
                resetPage();
              }}
              className="h-11 bg-slate-50 text-xs"
            />
          </div>

          <div className="md:col-span-2">
            <Select
              value={payment}
              onValueChange={(value) => {
                if (typeof value === 'string') {
                  setPayment(value as 'all' | PaymentStatus);
                  resetPage();
                }
              }}
            >
              <SelectTrigger className="h-11 w-full bg-slate-50 text-xs font-medium">
                <SelectValue>
                  {(value) => PAYMENT_OPTIONS.find((item) => item.value === value)?.label ?? PAYMENT_OPTIONS[0].label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Select
              value={sort}
              onValueChange={(value) => {
                if (typeof value === 'string') {
                  setSort(value as (typeof SORT_OPTIONS)[number]['value']);
                  resetPage();
                }
              }}
            >
              <SelectTrigger className="h-11 w-full bg-slate-50 text-xs font-medium">
                <SelectValue>
                  {(value) => SORT_OPTIONS.find((item) => item.value === value)?.label ?? SORT_OPTIONS[0].label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <span className="text-xs font-medium text-muted-foreground">Đang lọc:</span>
            {activeFilters.map((label) => (
              <Badge key={label} variant="outline" className="bg-[#EAF2F7] text-[#1b4360]">
                {label}
              </Badge>
            ))}
            <button
              type="button"
              onClick={clearFilters}
              className="ml-1 text-xs font-semibold text-[#df7a42] hover:underline"
            >
              Xoá bộ lọc
            </button>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden rounded-xl border border-border bg-white shadow-2xs">
        {error ? (
          <div className="p-5">
            <Alert variant="destructive">
              <AlertTitle>Không tải được danh sách đặt phòng</AlertTitle>
              <AlertDescription className="mt-1 flex flex-col items-start gap-3">
                <span>{getApiErrorMessage(error)}</span>
                <Button size="sm" variant="outline" onClick={() => void refetch()}>
                  Thử lại
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="h-11 border-b border-border bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="pl-5 pr-3">Mã đơn</th>
                    <th className="px-3">Hạng phòng</th>
                    <th className="px-3">Lịch lưu trú</th>
                    <th className="px-3 text-center">Phòng / khách</th>
                    <th className="px-3 text-right">Tổng tiền</th>
                    <th className="px-3 text-center">Thanh toán</th>
                    <th className="px-3 text-center">Trạng thái</th>
                    <th className="pr-5 pl-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading &&
                    [0, 1, 2, 3, 4].map((row) => (
                      <tr key={row}>
                        <td colSpan={8} className="px-5 py-3">
                          <Skeleton className="h-8 w-full" />
                        </td>
                      </tr>
                    ))}

                  {!isLoading &&
                    bookings.map((booking) => {
                      const status = bookingStatusLabels[booking.status];
                      const paymentStatus = paymentStatusLabels[booking.paymentStatus];
                      return (
                        <tr key={booking.id} className="transition-colors hover:bg-slate-50/70">
                          <td className="py-3.5 pl-5 pr-3">
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/staff/bookings/${booking.id}`}
                                className="font-mono font-bold text-primary hover:underline"
                              >
                                {booking.code}
                              </Link>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(booking.code)}
                                className="rounded p-1 text-muted-foreground transition-colors hover:text-primary"
                                title="Sao chép mã đơn"
                              >
                                {copiedId === booking.code ? (
                                  <Check className="size-3 text-emerald-600" />
                                ) : (
                                  <Copy className="size-3" />
                                )}
                              </button>
                            </div>
                            <span className="mt-0.5 block text-[10px] text-muted-foreground">
                              Đặt lúc {formatDateTime(booking.createdAt)}
                            </span>
                          </td>

                          <td className="px-3 py-3.5">
                            <span className="block font-semibold text-foreground">{booking.roomType.name}</span>
                            <span className="text-[11px] text-muted-foreground">
                              {booking.hotel.name}
                            </span>
                          </td>

                          <td className="px-3 py-3.5">
                            <span className="flex items-center gap-1.5 font-semibold text-foreground">
                              <CalendarDays className="size-3.5 text-muted-foreground" />
                              {formatCalendarDate(booking.checkIn)} → {formatCalendarDate(booking.checkOut)}
                            </span>
                            <span className="text-[11px] text-muted-foreground">{booking.nights} đêm</span>
                          </td>

                          <td className="px-3 py-3.5 text-center">
                            <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 font-mono font-bold text-foreground">
                              {booking.rooms} phòng
                            </span>
                            <span className="mt-0.5 block text-[11px] text-muted-foreground">
                              {booking.guests} khách
                            </span>
                          </td>

                          <td className="px-3 py-3.5 text-right font-mono font-bold text-foreground">
                            {formatMoney(booking.totalAmount)}
                          </td>

                          <td className="px-3 py-3.5 text-center">
                            <Badge variant="outline" className={`text-[10px] font-semibold ${toneClasses[paymentStatus.tone]}`}>
                              {paymentStatus.label}
                            </Badge>
                          </td>

                          <td className="px-3 py-3.5 text-center">
                            <Badge variant="outline" className={`text-[10px] font-semibold ${toneClasses[status.tone]}`}>
                              {status.label}
                            </Badge>
                          </td>

                          <td className="py-3.5 pr-5 pl-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Link href={`/staff/bookings/${booking.id}`}>
                                <Button size="sm" variant="outline" className="h-8 text-[11px] font-semibold">
                                  Chi tiết
                                </Button>
                              </Link>
                              {booking.paymentStatus === 'REFUND_PENDING' && (
                                <Link href={`/staff/bookings/${booking.id}`}>
                                  <Button size="sm" className="h-8 bg-[#934a33] text-[11px] font-semibold text-white hover:bg-[#7a341e]">
                                    Hoàn tiền
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {!isLoading && bookings.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
                <ReceiptText className="size-9 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">Không có đơn đặt phòng phù hợp</p>
                <p className="text-xs text-muted-foreground">Thử đổi trạng thái, ngày hoặc từ khoá tìm kiếm.</p>
                <Button size="sm" variant="outline" onClick={clearFilters} className="mt-2">
                  Xoá bộ lọc
                </Button>
              </div>
            )}

            {isFetching && !isLoading && (
              <div className="flex items-center justify-center gap-2 border-t border-border py-2 text-[11px] text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Đang cập nhật…
              </div>
            )}

            <div className="flex flex-col items-center justify-between gap-3 border-t border-border bg-slate-50 px-5 py-3.5 text-xs text-muted-foreground sm:flex-row">
              <span>
                {meta && meta.total > 0
                  ? `Hiển thị ${(meta.page - 1) * meta.pageSize + 1} - ${Math.min(meta.page * meta.pageSize, meta.total)} trên ${meta.total} đơn`
                  : 'Không có đơn nào'}
              </span>
              {meta && meta.totalPages > 1 && (
                <Pagination
                  currentPage={meta.page}
                  totalPages={meta.totalPages}
                  onPageChange={setPage}
                />
              )}
            </div>
          </>
        )}
      </Card>

      {hotelLoading && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Đang tải khách sạn…
        </div>
      )}
    </div>
  );
}
