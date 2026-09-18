'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ChevronRight, Download, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { transactions } from '@/lib/admin-data';

const statusClass: Record<string, string> = {
  'Khớp 100%': 'bg-[var(--sr-success-soft)] text-[var(--sr-success)]',
  'Chờ IPN': 'bg-[var(--sr-warning-soft)] text-[var(--sr-warning)]',
  'Cần đối soát': 'bg-[var(--sr-danger-soft)] text-destructive',
  'Hoàn tiền một phần': 'bg-accent text-accent-foreground',
};
export function TransactionsPage({
  notify,
}: {
  notify: (message: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Tất cả trạng thái');
  const [provider, setProvider] = useState('Tất cả cổng');
  const [page, setPage] = useState(1);
  const rows = useMemo(
    () =>
      transactions.filter(
        (x) =>
          `${x.id} ${x.bookingCode} ${x.hotel}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (status === 'Tất cả trạng thái' || x.status === status) &&
          (provider === 'Tất cả cổng' || x.provider === provider),
      ),
    [query, status, provider],
  );
  return (
    <div className="space-y-6 pt-4">
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Hệ thống đối soát tài chính T+1
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary md:text-3xl">
            Nhật ký &amp; Đối soát Cổng giao dịch
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi luồng thanh toán, đối soát tự động và xử lý giao dịch lệch
            trạng thái.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="h-10 rounded-xl bg-card"
            onClick={() =>
              notify('Đã chuẩn bị tệp CSV mẫu theo bộ lọc hiện tại.')
            }
          >
            <Download size={16} />
            Xuất báo cáo
          </Button>
          <Button
            className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-(--sr-primary-hover)"
            onClick={() =>
              notify('Đã đồng bộ dữ liệu giao dịch mock mới nhất.')
            }
          >
            <RefreshCw size={16} />
            Đồng bộ ngay
          </Button>
        </div>
      </header>
      <Card className="rounded-2xl border-0 bg-card p-5 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-3 xl:flex-row xl:items-end">
          <div>
            <h2 className="text-lg font-bold">
              Chi tiết giao dịch &amp; Kết quả đối soát
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Bảng đối soát chi tiết giữa hệ thống cổng thanh toán và dữ liệu
              đặt phòng StayReco PMS.
            </p>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm mã giao dịch, booking, khách sạn..."
              className="h-10 bg-muted pl-9"
            />
          </label>
          <NativeSelect
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full lg:w-40 [&>select]:h-10 [&>select]:bg-muted"
          >
            <option>Tất cả cổng</option>
            <option>VNPay</option>
            <option>SePay</option>
          </NativeSelect>
          <NativeSelect
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full lg:w-44 [&>select]:h-10 [&>select]:bg-muted"
          >
            <option>Tất cả trạng thái</option>
            <option>Khớp 100%</option>
            <option>Chờ IPN</option>
            <option>Cần đối soát</option>
            <option>Hoàn tiền một phần</option>
          </NativeSelect>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-295 text-left text-xs">
            <thead className="bg-muted uppercase tracking-wider text-muted-foreground">
              <tr>
                {[
                  'Thời gian & Mã TX',
                  'Booking & Khách sạn',
                  'Cổng',
                  'Số tiền',
                  'Kết quả Gateway',
                  'Trạng thái nghiệp vụ',
                  'Đối soát',
                  '',
                ].map((x, i) => (
                  <th key={i} className="px-4 py-3">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((x) => (
                <tr
                  key={x.id}
                  className={`border-b border-border hover:bg-muted ${x.status === 'Cần đối soát' ? 'border-l-4 border-l-destructive' : ''}`}
                >
                  <td className="px-4 py-4 font-mono">
                    <div>{x.verifiedAt.split(' ')[0]}</div>
                    <b className="text-primary">#{x.id}</b>
                  </td>
                  <td className="px-4 py-4">
                    <b>{x.bookingCode}</b>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {x.hotel}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={
                        x.provider === 'VNPay'
                          ? 'rounded-full bg-primary/10 px-2 py-1 font-bold text-primary'
                          : 'rounded-full bg-brand-accent-soft px-2 py-1 font-bold text-brand-accent'
                      }
                    >
                      {x.provider === 'SePay' ? 'SePay VietQR' : 'VNPay'}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-mono font-bold">{x.amount}</td>
                  <td className="px-4 py-4">
                    <span
                      className={
                        x.status === 'Cần đối soát'
                          ? 'font-semibold text-destructive'
                          : 'font-semibold text-success'
                      }
                    >
                      {x.status === 'Chờ IPN'
                        ? 'Chờ webhook IPN'
                        : x.status === 'Cần đối soát'
                          ? 'Lỗi mã 97'
                          : 'Thành công (Code 00)'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {x.status === 'Chờ IPN'
                      ? 'Hold PMS (15 phút)'
                      : x.status === 'Cần đối soát'
                        ? 'Chờ Admin xử lý'
                        : 'Đã xác nhận phòng'}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 font-semibold ${statusClass[x.status]}`}
                    >
                      {x.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      href={`/admin/transactions/${x.id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 font-semibold text-primary hover:bg-(--sr-surface-hover)"
                    >
                      Chi tiết log <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-col justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <span>
            Hiển thị <b className="text-foreground">1 - {rows.length}</b> trong
            tổng số <b className="text-foreground">8.412</b> giao dịch
          </span>
          <div className="flex gap-1">
            {[1, 2, 3].map((n) => (
              <Button
                key={n}
                size="sm"
                variant={page === n ? 'default' : 'outline'}
                onClick={() => setPage(n)}
              >
                {n}
              </Button>
            ))}
          </div>
        </div>
      </Card>
      <Card className="rounded-2xl border-0 bg-card p-6 shadow-sm lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">
              Lịch sử thay đổi cấu hình &amp; Sự kiện đối soát (Audit Trail)
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Ghi nhận minh bạch mọi thao tác can thiệp tham số cổng thanh toán
              của đội ngũ Quản trị.
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            Hiển thị 3 bản ghi mới nhất
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-190 text-left text-xs">
            <thead className="bg-muted uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">Người thực hiện</th>
                <th className="px-4 py-3">Tham số thay đổi</th>
                <th className="px-4 py-3">Mô tả hành động chi tiết</th>
                <th className="px-4 py-3 text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  '15:42:19',
                  'Hôm nay, 24/05/2026',
                  'Hold Timeout PMS',
                  'Điều chỉnh thời gian giữ phòng chờ thanh toán từ 10 phút sang 15 phút (Mùa du lịch cao điểm).',
                ],
                [
                  '09:15:02',
                  '18/05/2026',
                  'VNPay Secret Key',
                  'Thực hiện xoay chu kỳ bảo mật định kỳ 90 ngày (Key Rotation) cho cổng VNPay Live theo khuyến nghị PCI-DSS.',
                ],
                [
                  '14:20:45',
                  '02/05/2026',
                  'SePay Fallback Rule',
                  'Kích hoạt quy tắc tự động kích hoạt cổng VietQR SePay dự phòng khi phản hồi VNPay trễ quá 3.500ms.',
                ],
              ].map(([time, date, field, detail]) => (
                <tr
                  key={field}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-4 font-mono text-muted-foreground">
                    {time}
                    <br />
                    <span className="text-[10px]">{date}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="mr-2 inline-grid size-7 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      TQ
                    </span>
                    <b>Trần Đình Quân</b>
                    <span className="ml-1 text-muted-foreground">
                      Super Admin
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded bg-muted px-2 py-1 font-mono">
                      {field}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{detail}</td>
                  <td className="px-4 py-4 text-right font-semibold text-success">
                    Thành công
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
