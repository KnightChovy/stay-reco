'use client';

import { useState } from 'react';
import { CalendarDays, Plus, UserRoundCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PartnerPanel, PartnerTitle, usePartnerActions } from '@/features/partner/components';
import AppFilter, { type FilterDefinition, type FilterValues } from '@/components/common/filter/AppFilter';
import { TablePagination } from '@/components/common/table/TablePagination';
import {
  partnerBookingColumns,
  partnerBookingMetrics,
  partnerBookings,
  partnerBookingStatuses,
  partnerOperationShifts,
} from '@/lib/partner-data';

const bookingFilters: FilterDefinition[] = [
  {
    key: 'status',
    label: 'trạng thái',
    type: 'select',
    allLabel: 'Tất cả trạng thái',
    options: partnerBookingStatuses.map((status) => ({ label: status, value: status })),
  },
];

export default function PartnerBookings() {
  const { notify } = usePartnerActions();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const pageSize = 4;
  const selectedStatus = typeof filterValues.status === 'string' ? filterValues.status : '';
  const normalizedQuery = searchQuery.toLocaleLowerCase();
  const filteredBookings = partnerBookings.filter((booking) => {
    const matchesQuery = booking.slice(0, 3).some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
    return matchesQuery && (!selectedStatus || booking[5] === selectedStatus);
  });
  const visibleBookings = filteredBookings.slice((page - 1) * pageSize, page * pageSize);

  return <div className="space-y-6">
    <PartnerTitle title="Đặt phòng & Điều phối lưu trú" description="Theo dõi toàn bộ vòng đời booking, từ xác nhận giữ phòng đến check-in, lưu trú và hoàn tất thanh toán." action={<><Button variant="outline" onClick={() => notify('Xuất danh sách booking')}><CalendarDays />Xuất lịch đặt phòng</Button><Button onClick={() => notify('Tạo booking trực tiếp')}><Plus />Tạo booking mới</Button></>} />

    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {partnerBookingMetrics.map(({ label, value, hint, icon: Icon, tone }) => <PartnerPanel key={label} className="p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-muted-foreground">{label}</p><strong className={`mt-2 block text-3xl ${tone}`}>{value}</strong></div><span className="grid size-10 place-items-center rounded-xl bg-muted text-primary"><Icon size={19} /></span></div><p className="mt-5 text-xs text-muted-foreground">{hint}</p></PartnerPanel>)}
    </section>

    <section className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <PartnerPanel className="overflow-hidden">
        <AppFilter filters={bookingFilters} searchPlaceholder="Tìm mã booking, khách hoặc phòng..." onSearchChange={(value) => { setSearchQuery(value); setPage(1); }} onFiltersChange={(values) => { setFilterValues(values); setPage(1); }} className="rounded-none border-0 border-b p-5 shadow-none" />
        <div className="overflow-x-auto"><Table className="w-full min-w-[900px] text-left text-sm"><TableHeader className="bg-muted text-xs text-muted-foreground"><TableRow>{partnerBookingColumns.map(item => <TableHead key={item} className="px-5 py-4 font-semibold">{item}</TableHead>)}</TableRow></TableHeader><TableBody>{visibleBookings.map((row) => <TableRow key={row[0]} className="border-t"><TableCell className="px-5 py-5"><strong className="text-primary">#{row[0]}</strong><p className="mt-1 text-xs text-muted-foreground">StayReco Direct</p></TableCell><TableCell className="px-5 py-5 font-medium">{row[1]}</TableCell><TableCell className="px-5 py-5">{row[2]}</TableCell><TableCell className="px-5 py-5">{row[3]}<p className="text-xs text-muted-foreground">{row[4]}</p></TableCell><TableCell className="px-5 py-5"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row[5] === 'Chờ xác nhận' ? 'bg-brand-accent-soft text-brand-accent' : 'bg-success-soft text-success'}`}>● {row[5]}</span></TableCell><TableCell className="px-5 py-5 font-semibold text-primary">{row[6]}</TableCell><TableCell className="px-5 py-5"><Button type="button" variant="ghost" size="sm" onClick={() => notify(`Xử lý booking ${row[0]}`)} className="font-semibold text-primary">Xử lý</Button></TableCell></TableRow>)}</TableBody></Table></div>
        <TablePagination page={page} pageSize={pageSize} total={filteredBookings.length} onPageChange={setPage} />
      </PartnerPanel>

      <aside className="space-y-5"><PartnerPanel className="p-5"><h2 className="font-bold text-primary">Ca vận hành hôm nay</h2><div className="mt-5 space-y-4">{partnerOperationShifts.map(([time,task,state]) => <div key={time} className="flex gap-3"><span className="font-mono text-xs font-bold text-primary">{time}</span><div><p className="text-sm font-medium">{task}</p><p className="mt-1 text-xs text-muted-foreground">{state}</p></div></div>)}</div></PartnerPanel><PartnerPanel className="bg-primary p-5 text-primary-foreground"><UserRoundCheck size={20}/><h2 className="mt-3 font-bold">Check-in nhanh bằng QR</h2><p className="mt-2 text-sm text-primary-foreground/75">Xác thực booking, giấy tờ và gán phòng trong một luồng.</p><Button onClick={() => notify('Check-in nhanh bằng QR')} className="mt-5 w-full bg-card text-primary hover:bg-card/90">Mở máy quét QR</Button></PartnerPanel></aside>
    </section>
  </div>;
}
