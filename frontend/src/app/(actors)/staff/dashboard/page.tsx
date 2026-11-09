'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  AlertTriangle,
  BedDouble,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Info,
  Loader2,
  LogIn,
  LogOut,
  QrCode,
  RefreshCw,
  Search,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import type { ActionItem, ActionItemSeverity, HotelTodayStats, TodayArrival } from '@stayreco/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api-error';
import { useStaffHotel } from '@/features/staff/components/StaffHotelProvider';
import { useActionItems, useOccupancyForecast, useTodayStats } from '@/features/staff/api/staff-queries';
import {
  bookingStatusLabels,
  formatCalendarDate,
  formatDateTime,
  paymentStatusLabels,
  roomStatusLabels,
  toneClasses,
} from '@/features/staff/lib/labels';

const FORECAST_DAYS = 14;

export default function StaffDashboardPage() {
  const { hotel, isLoading: hotelLoading } = useStaffHotel();
  const hotelId = hotel?.summary.id;
  const today = useTodayStats(hotelId);

  return (
    <div className="font-sans antialiased text-foreground">
      <main>
        <div className="p-4 sm:p-8 space-y-7 pb-16">
          {/* Header & quick actions */}
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5 pt-2">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 tracking-wide">
                  <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  {today.data ? `Hôm nay • ${formatCalendarDate(today.data.date)}` : 'Hôm nay'}
                </span>
                {today.data && (
                  <span className="text-muted-foreground text-xs font-mono">
                    Cập nhật {formatDateTime(today.data.generatedAt)}
                  </span>
                )}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-primary">
                Tổng quan ca làm việc — Lễ tân & Vận hành
              </h1>
              <p className="text-xs lg:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Theo dõi tình hình nhận/trả phòng hôm nay và các việc cần xử lý
                {hotel ? ` tại ${hotel.summary.name}` : ''}.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link href="/staff/check-in">
                <Button className="h-11 px-4 bg-primary text-primary-foreground hover:bg-[#193b56] text-xs font-bold gap-2 shadow-xs">
                  <QrCode className="size-4" />
                  <span>Check-in / Quét QR</span>
                </Button>
              </Link>
              <Link href="/staff/check-out">
                <Button variant="outline" className="h-11 px-4 bg-white text-foreground hover:bg-slate-50 text-xs font-semibold gap-2 border-border shadow-2xs">
                  <LogOut className="size-4 text-[#934a33]" />
                  <span>Check-out</span>
                </Button>
              </Link>
              <Link href="/staff/bookings">
                <Button variant="outline" className="h-11 px-4 bg-white text-foreground hover:bg-slate-50 text-xs font-semibold gap-2 border-border shadow-2xs">
                  <Search className="size-4 text-primary" />
                  <span>Danh sách đặt phòng</span>
                </Button>
              </Link>
            </div>
          </div>

          {hotelLoading || today.isLoading ? (
            <Card className="p-10 bg-white border border-border rounded-xl flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Đang tải số liệu hôm nay...
            </Card>
          ) : !hotelId ? (
            <Card className="p-8 bg-white border border-border rounded-xl text-sm text-muted-foreground text-center">
              Tài khoản chưa được gán khách sạn nào.
            </Card>
          ) : today.isError || !today.data ? (
            <ErrorCard
              message={getApiErrorMessage(today.error, 'Không tải được số liệu hôm nay.')}
              onRetry={() => void today.refetch()}
            />
          ) : (
            <TodayKpis stats={today.data} />
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              {today.data && <UpcomingArrivals arrivals={today.data.upcomingArrivals} />}
              {hotelId && <OccupancyStrip hotelId={hotelId} />}
            </div>
            <div className="space-y-6">
              {hotelId && <ActionItemsCard hotelId={hotelId} />}
              {today.data && <RoomStatusCard stats={today.data} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="p-5 bg-white border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 text-amber-800">
        <AlertTriangle className="size-4 shrink-0" /> {message}
      </span>
      <Button variant="outline" onClick={onRetry} className="h-8 text-xs gap-1.5 shrink-0">
        <RefreshCw className="size-3.5" /> Thử lại
      </Button>
    </Card>
  );
}

function percentOf(part: number, total: number) {
  return total > 0 ? Math.min(100, Math.round((part / total) * 100)) : 0;
}

function TodayKpis({ stats }: { stats: HotelTodayStats }) {
  const occupancy = stats.tonight.occupancyRate;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <KpiCard
        title="Khách nhận phòng"
        icon={LogIn}
        iconClass="bg-primary/10 text-primary"
        value={stats.arrivals.expected}
        unit="lượt dự kiến"
        progress={percentOf(stats.arrivals.checkedIn, stats.arrivals.expected)}
        barClass="bg-primary"
        left={['Đã nhận', stats.arrivals.checkedIn]}
        right={['Chờ nhận', Math.max(0, stats.arrivals.expected - stats.arrivals.checkedIn)]}
      />
      <KpiCard
        title="Khách trả phòng"
        icon={LogOut}
        iconClass="bg-orange-100 text-[#934a33]"
        value={stats.departures.expected}
        unit="lượt trong ngày"
        progress={percentOf(stats.departures.checkedOut, stats.departures.expected)}
        barClass="bg-emerald-600"
        left={['Đã trả', stats.departures.checkedOut]}
        right={['Chờ trả', Math.max(0, stats.departures.expected - stats.departures.checkedOut)]}
      />
      <KpiCard
        title="Đang lưu trú"
        icon={UsersRound}
        iconClass="bg-sky-50 text-sky-700"
        value={stats.inHouse.bookings}
        unit="booking"
        left={['Số khách', stats.inHouse.guests]}
        right={['Giữ phòng', stats.holds.active]}
      />
      <KpiCard
        title="Công suất đêm nay"
        icon={BedDouble}
        iconClass="bg-emerald-50 text-emerald-700"
        value={occupancy == null ? '—' : `${occupancy}%`}
        unit=""
        progress={occupancy ?? 0}
        barClass="bg-emerald-600"
        left={['Đã bán', stats.tonight.roomsSold]}
        right={['Còn trống', stats.tonight.roomsAvailable]}
      />
    </div>
  );
}

function KpiCard({
  title,
  icon: Icon,
  iconClass,
  value,
  unit,
  progress,
  barClass,
  left,
  right,
}: {
  title: string;
  icon: LucideIcon;
  iconClass: string;
  value: number | string;
  unit: string;
  progress?: number;
  barClass?: string;
  left: [string, number];
  right: [string, number];
}) {
  return (
    <Card className="p-5 bg-white border border-border rounded-xl shadow-2xs space-y-3">
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
        <div className={cn('size-8 rounded-lg flex items-center justify-center', iconClass)}>
          <Icon className="size-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-foreground">{value}</span>
        {unit && <span className="text-xs text-muted-foreground font-medium">{unit}</span>}
      </div>
      {progress !== undefined && (
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div className={cn('h-1.5 rounded-full', barClass)} style={{ width: `${progress}%` }} />
        </div>
      )}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {left[0]}: <strong className="text-foreground">{left[1]}</strong>
        </span>
        <span>
          {right[0]}: <strong className="text-[#934a33]">{right[1]}</strong>
        </span>
      </div>
    </Card>
  );
}

function UpcomingArrivals({ arrivals }: { arrivals: TodayArrival[] }) {
  return (
    <Card className="bg-white border border-border rounded-xl shadow-2xs overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h2 className="text-sm font-bold text-foreground">Khách đến hôm nay chưa check-in</h2>
          <p className="text-[11px] text-muted-foreground">Sắp xếp theo giờ đến dự kiến</p>
        </div>
        <Link href="/staff/check-in" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
          Mở quầy check-in <ChevronRight className="size-3.5" />
        </Link>
      </div>
      {arrivals.length === 0 ? (
        <p className="px-5 py-8 text-center text-xs text-muted-foreground">Không còn khách nào chờ check-in hôm nay.</p>
      ) : (
        <ul className="divide-y divide-border">
          {arrivals.map((arrival) => {
            const status = bookingStatusLabels[arrival.status];
            const payment = paymentStatusLabels[arrival.paymentStatus];
            return (
              <li key={arrival.bookingId}>
                <Link
                  href={`/staff/bookings/${arrival.bookingId}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-foreground">{arrival.guestName}</span>
                      <span className="text-[11px] font-mono text-muted-foreground">{arrival.code}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {arrival.roomTypeName} • {arrival.rooms} phòng • {arrival.nights} đêm
                      {arrival.numGuests ? ` • ${arrival.numGuests} khách` : ''}
                      {arrival.roomNumbers.length > 0 ? ` • P.${arrival.roomNumbers.join(', ')}` : ''}
                    </p>
                    {arrival.specialRequests && (
                      <p className="text-[11px] text-[#934a33] truncate">Yêu cầu: {arrival.specialRequests}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold text-foreground">{arrival.arrivalTime ?? '—'}</span>
                    <Badge variant="outline" className={cn('text-[10px]', toneClasses[status.tone])}>
                      {status.label}
                    </Badge>
                    <Badge variant="outline" className={cn('text-[10px]', toneClasses[payment.tone])}>
                      {payment.label}
                    </Badge>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function RoomStatusCard({ stats }: { stats: HotelTodayStats }) {
  const statuses = ['AVAILABLE', 'OCCUPIED', 'CLEANING', 'MAINTENANCE'] as const;
  return (
    <Card className="p-5 bg-white border border-border rounded-xl shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground">Tình trạng phòng</h2>
        <span className="text-[11px] text-muted-foreground">{stats.rooms.total} phòng</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {statuses.map((status) => {
          const label = roomStatusLabels[status];
          return (
            <div key={status} className={cn('rounded-lg border px-3 py-2.5', toneClasses[label.tone])}>
              <span className="text-[11px] font-semibold block">{label.label}</span>
              <span className="text-xl font-bold">{stats.rooms[status]}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

const severityStyles: Record<ActionItemSeverity, { icon: LucideIcon; className: string }> = {
  CRITICAL: { icon: CircleAlert, className: 'text-red-600 bg-red-50' },
  WARNING: { icon: AlertTriangle, className: 'text-amber-600 bg-amber-50' },
  INFO: { icon: Info, className: 'text-sky-600 bg-sky-50' },
};

/** Items a front-desk staff member can act on; owner-only items (setup, verification, pricing…) are skipped. */
function present(item: ActionItem): { title: string; detail?: string; href: string } | null {
  switch (item.type) {
    case 'OVERDUE_CHECKOUTS':
      return {
        title: `${item.count} booking quá giờ trả phòng`,
        detail: 'Khách vẫn đang lưu trú sau giờ trả phòng.',
        href: '/staff/check-out',
      };
    case 'REFUND_REQUESTS_PENDING':
      return {
        title: `${item.count} yêu cầu hoàn tiền chờ xử lý`,
        detail: `Yêu cầu cũ nhất lúc ${formatDateTime(item.params.oldestAt)}`,
        href: '/staff/bookings',
      };
    case 'CHANGE_REQUESTS_PENDING':
      return {
        title: `${item.count} yêu cầu đổi booking chờ xử lý`,
        detail: `Yêu cầu cũ nhất lúc ${formatDateTime(item.params.oldestAt)}`,
        href: '/staff/bookings',
      };
    case 'HIGH_DEMAND_DATES':
      return {
        title: `${item.count} ngày tới công suất từ ${item.params.threshold}%`,
        detail: `Sớm nhất ${formatCalendarDate(item.params.firstDate)}.`,
        href: '/staff/bookings',
      };
    default:
      return null;
  }
}

function ActionItemsCard({ hotelId }: { hotelId: string }) {
  const query = useActionItems(hotelId);
  const items = (query.data?.items ?? [])
    .map((item) => ({ item, view: present(item) }))
    .filter((entry): entry is { item: ActionItem; view: NonNullable<ReturnType<typeof present>> } => !!entry.view);

  return (
    <Card className="bg-white border border-border rounded-xl shadow-2xs overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-bold text-foreground">Việc cần xử lý</h2>
        <p className="text-[11px] text-muted-foreground">Tự động cập nhật mỗi phút</p>
      </div>
      {query.isLoading ? (
        <div className="px-5 py-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Đang tải...
        </div>
      ) : query.isError ? (
        <div className="px-5 py-4 flex items-center justify-between gap-3 text-xs text-amber-800">
          <span>{getApiErrorMessage(query.error, 'Không tải được danh sách việc cần xử lý.')}</span>
          <Button variant="outline" className="h-7 text-[11px]" onClick={() => void query.refetch()}>
            Thử lại
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="px-5 py-6 flex items-center gap-2 text-xs text-emerald-700">
          <CircleCheck className="size-4" /> Không có việc nào cần xử lý.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map(({ item, view }) => {
            const severity = severityStyles[item.severity];
            const Icon = severity.icon;
            return (
              <li key={item.type}>
                <Link href={view.href} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <span className={cn('size-7 rounded-lg flex items-center justify-center shrink-0', severity.className)}>
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-foreground block">{view.title}</span>
                    {view.detail && <span className="text-[11px] text-muted-foreground block">{view.detail}</span>}
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-1.5" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function occupancyClass(rate: number | null) {
  if (rate == null) return 'bg-slate-100 text-slate-500';
  if (rate >= 90) return 'bg-red-100 text-red-800';
  if (rate >= 70) return 'bg-amber-100 text-amber-800';
  if (rate >= 40) return 'bg-emerald-100 text-emerald-800';
  return 'bg-slate-50 text-slate-600';
}

function OccupancyStrip({ hotelId }: { hotelId: string }) {
  const query = useOccupancyForecast(hotelId, FORECAST_DAYS);
  return (
    <Card className="p-5 bg-white border border-border rounded-xl shadow-2xs space-y-4">
      <div>
        <h2 className="text-sm font-bold text-foreground">Công suất {FORECAST_DAYS} ngày tới</h2>
        <p className="text-[11px] text-muted-foreground">Số phòng đã đặt / phòng còn trống mỗi đêm</p>
      </div>
      {query.isLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Đang tải...
        </div>
      ) : query.isError || !query.data ? (
        <div className="flex items-center justify-between gap-3 text-xs text-amber-800">
          <span>{getApiErrorMessage(query.error, 'Không tải được dự báo công suất.')}</span>
          <Button variant="outline" className="h-7 text-[11px]" onClick={() => void query.refetch()}>
            Thử lại
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {query.data.days.map((day) => (
            <div
              key={day.date}
              className={cn('rounded-lg px-2 py-2 text-center', occupancyClass(day.occupancyRate))}
              title={`${formatCalendarDate(day.date)}: ${day.booked} đã đặt, ${day.held} đang giữ, ${day.free} trống`}
            >
              <span className="text-[10px] font-semibold block">{format(new Date(`${day.date}T00:00:00`), 'EEEEEE', { locale: vi })}</span>
              <span className="text-[10px] block">{formatCalendarDate(day.date).slice(0, 5)}</span>
              <span className="text-sm font-bold block">{day.occupancyRate == null ? '—' : `${day.occupancyRate}%`}</span>
              <span className="text-[10px] block">{day.free} trống</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
