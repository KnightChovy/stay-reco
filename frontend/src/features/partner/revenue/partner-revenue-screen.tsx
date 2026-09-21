'use client';

import { useState } from 'react';
import { Download, ReceiptText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PartnerPanel, PartnerTitle } from '@/features/partner/partner-primitives';
import AppFilter, { type FilterDefinition, type FilterValues } from '@/components/common/filter/AppFilter';
import { TablePagination } from '@/components/common/table/TablePagination';
import {
  partnerCashflowBreakdown,
  partnerRevenueChartHeights,
  partnerRevenueMetrics,
  partnerSettlementColumns,
  partnerSettlements,
  partnerSettlementStatuses,
} from '@/lib/partner-data';

type Notify = (message: string) => void;

const settlementFilters: FilterDefinition[] = [{ key: 'status', label: 'trạng thái', type: 'select', allLabel: 'Tất cả trạng thái', options: partnerSettlementStatuses.map((status) => ({ label: status, value: status })) }];

export function PartnerRevenueScreen({ notify }: { notify: Notify }) {
  const [page, setPage] = useState(1);
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const pageSize = 4;
  const selectedStatus = typeof filterValues.status === 'string' ? filterValues.status : '';
  const filteredSettlements = partnerSettlements.filter((settlement) => !selectedStatus || settlement[5] === selectedStatus);
  const visibleSettlements = filteredSettlements.slice((page - 1) * pageSize, page * pageSize);

  return <div className="space-y-6">
    <PartnerTitle title="Doanh thu, Thanh toán & Đối soát" description="Kiểm soát doanh thu thực nhận, phí nền tảng, hoàn tiền và lịch chuyển khoản của An Nhiên Riverside Hotel." action={<><Button variant="outline" onClick={() => notify('Xuất báo cáo doanh thu')}><Download />Xuất báo cáo</Button><Button onClick={() => notify('Tạo yêu cầu đối soát')}><ReceiptText />Tạo yêu cầu đối soát</Button></>} />
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-muted p-2"><AppFilter showSearch={false} filters={settlementFilters} onFiltersChange={(values) => { setFilterValues(values); setPage(1); }} className="rounded-none border-0 bg-transparent p-0 shadow-none" /><span className="ml-auto self-center rounded-full bg-success-soft px-3 py-1.5 text-xs font-semibold text-success">Đã đồng bộ lúc 10:42</span></div>
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{partnerRevenueMetrics.map(({ label, value, hint, icon: Icon, tone }) => <PartnerPanel key={label} className="p-5"><div className="flex justify-between"><div><p className="text-xs font-semibold text-muted-foreground">{label}</p><strong className={`mt-2 block text-2xl ${tone ?? 'text-primary'}`}>{value}</strong></div><Icon className="text-primary" size={21}/></div><p className="mt-5 text-xs text-muted-foreground">{hint}</p></PartnerPanel>)}</section>
    <section className="grid gap-6 xl:grid-cols-[1.55fr_.72fr]"><PartnerPanel className="p-6"><div className="flex justify-between"><div><h2 className="font-bold text-primary">Dòng tiền thực nhận theo tuần</h2><p className="mt-1 text-xs text-muted-foreground">Doanh thu phòng sau khi trừ voucher, hoàn tiền và phí nền tảng</p></div><span className="text-xs font-semibold text-success">↑ 18,4% so với tháng trước</span></div><div className="mt-8 flex h-64 items-end gap-4 border-b border-l px-4">{partnerRevenueChartHeights.map((height,i) => <div key={i} className="group relative flex-1 rounded-t bg-primary/20" style={{height:`${height}%`}}><div className="absolute inset-x-0 bottom-0 rounded-t bg-primary" style={{height:`${Math.max(35,height-20)}%`}} /><span className="absolute -top-6 hidden whitespace-nowrap text-[10px] font-semibold text-primary group-hover:block">{height},2 tr</span></div>)}</div><div className="mt-3 flex justify-between text-[10px] text-muted-foreground"><span>01/10</span><span>Tuần 2</span><span>Tuần 3</span><span>31/10</span></div></PartnerPanel><PartnerPanel className="p-5"><h2 className="font-bold text-primary">Cấu trúc dòng tiền</h2><div className="mt-5 space-y-4">{partnerCashflowBreakdown.map(([label,value,width],i)=><div key={label}><div className="flex justify-between text-sm"><span>{label}</span><strong className={i ? 'text-brand-accent':'text-primary'}>{value}</strong></div><div className="mt-2 h-1.5 rounded bg-muted"><div className="h-full rounded bg-primary" style={{width}}/></div></div>)}</div><div className="mt-6 rounded-xl bg-success-soft p-4"><p className="text-xs text-success">Số dư có thể rút</p><strong className="mt-1 block text-xl text-success">164.350.000 ₫</strong><Button onClick={() => notify('Yêu cầu rút doanh thu')} className="mt-4 w-full">Yêu cầu rút tiền</Button></div></PartnerPanel></section>
    <PartnerPanel className="overflow-hidden"><div className="flex items-center justify-between border-b p-5"><div><h2 className="font-bold text-primary">Các kỳ đối soát gần đây</h2><p className="mt-1 text-xs text-muted-foreground">Minh bạch từng khoản thu và khấu trừ</p></div><Button variant="outline" onClick={() => notify('Tải chứng từ đối soát')}><Download />Tải chứng từ</Button></div><div className="overflow-x-auto"><Table className="w-full min-w-[760px] text-left text-sm"><TableHeader className="bg-muted text-xs text-muted-foreground"><TableRow>{partnerSettlementColumns.map(x=><TableHead key={x} className="px-5 py-3">{x}</TableHead>)}</TableRow></TableHeader><TableBody>{visibleSettlements.map(row=><TableRow key={row[0]} className="border-t">{row.map((cell,i)=><TableCell key={cell} className={`px-5 py-4 ${i===4?'font-bold text-primary':''}`}>{i===5?<span className={`rounded-full px-2 py-1 text-xs ${cell === 'Đang đối soát' ? 'bg-warning-soft text-warning' : 'bg-success-soft text-success'}`}>● {cell}</span>:cell}</TableCell>)}<TableCell className="px-5 py-4"><Button type="button" variant="ghost" size="sm" className="font-semibold text-primary" onClick={() => notify(`Tải chứng từ ${row[0]}`)}>PDF</Button></TableCell></TableRow>)}</TableBody></Table></div><TablePagination page={page} pageSize={pageSize} total={filteredSettlements.length} onPageChange={setPage} /></PartnerPanel>
  </div>;
}
