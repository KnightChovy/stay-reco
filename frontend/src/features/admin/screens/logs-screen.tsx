'use client';
import { useMemo, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Clipboard,
  Download,
  Eye,
  FileJson,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { auditEvents, type AuditEvent } from '@/lib/admin-data';
const extra = [
  {
    id: 'evt-05',
    timestamp: '20/10/2026 07:50',
    actor: 'Hệ thống đối soát',
    action: 'Đồng bộ giao dịch T+1',
    target: 'VNPay Gateway',
    severity: 'Thông tin' as const,
    detail:
      'Đồng bộ 8.412 giao dịch thành công. Không có payload nhạy cảm được hiển thị.',
  },
  {
    id: 'evt-06',
    timestamp: '19/10/2026 23:28',
    actor: 'Security Guard',
    action: 'Phát hiện sai lệch checksum',
    target: 'TX-VN-8942',
    severity: 'Cao' as const,
    detail:
      'IPN callback trả mã lỗi 97 sau Key Rotation. Phiên được chuyển tới Super Admin.',
  },
];
export function LogsPage({ notify }: { notify: (message: string) => void }) {
  const [tab, setTab] = useState<'all' | 'security' | 'admin'>('all');
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState('Tất cả mức độ');
  const [selected, setSelected] = useState<AuditEvent | null>(null);
  const [page, setPage] = useState(1);
  const events = [...auditEvents, ...extra];
  const rows = useMemo(
    () =>
      events.filter(
        (e) =>
          `${e.id} ${e.actor} ${e.action} ${e.target}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (severity === 'Tất cả mức độ' || e.severity === severity) &&
          (tab === 'all' ||
            (tab === 'security'
              ? e.severity !== 'Thông tin'
              : e.actor !== 'System Guard' && e.actor !== 'Security Guard')),
      ),
    [events, query, severity, tab],
  );
  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(JSON.stringify(selected, null, 2));
      notify('Đã sao chép JSON Diff Record.');
    } catch {
      notify('Không thể sao chép JSON Diff Record.');
    }
  };
  return (
    <div className="space-y-6 pt-4">
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Audit Trail · Immutable security records
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary md:text-3xl">
            Nhật ký Hoạt động &amp; Sự kiện Bảo mật
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi mọi thao tác quản trị, thay đổi dữ liệu và tín hiệu an toàn
            hệ thống.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="h-10 rounded-xl bg-card"
            onClick={() =>
              notify('Đã chuẩn bị bản xuất audit log đã sanitize.')
            }
          >
            <Download size={16} />
            Xuất nhật ký
          </Button>
          <Button
            variant="outline"
            className="h-10 rounded-xl bg-card"
            onClick={() => notify('Đã làm mới dữ liệu audit mock.')}
          >
            <RefreshCw size={16} />
            Làm mới
          </Button>
          <Button
            className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-(--sr-primary-hover)"
            onClick={() => notify('Đã tạo báo cáo tuân thủ mẫu.')}
          >
            <FileJson size={16} />
            Tạo báo cáo
          </Button>
        </div>
      </header>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <LogMetric
          label="Tổng sự kiện / 24h"
          value="142.580"
          hint="↗ +4.2% so với hôm qua"
          icon={<Activity size={20} />}
        />
        <LogMetric
          label="Toàn vẹn dữ liệu (SHA-256)"
          value="0 Vi phạm"
          hint="⊙ Immutable Ledger OK"
          icon={<ShieldCheck size={20} />}
        />
        <LogMetric
          label="WAF & DDoS Shield"
          value="100.0%"
          hint="● Bảo vệ thời gian thực"
          icon={<ShieldCheck size={20} />}
        />
        <LogMetric
          label="Cảnh báo bảo mật"
          value="03 Sự việc"
          hint="⊘ Đã can thiệp & ngăn chặn"
          icon={<ShieldAlert size={20} />}
          danger
        />
      </section>
      <Card className="border-l-4 border-l-brand-accent bg-card p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-danger-soft text-destructive">
              <ShieldAlert size={20} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <b className="text-sm text-brand-accent">
                  CẢNH BÁO AN NINH MỨC CAO
                </b>
                <span className="rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-semibold text-success">
                  Đã ngăn chặn thành công (Auto-Mitigated)
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  08:12:44 SA (GMT+7)
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold">
                Phát hiện truy cập bất thường từ IP ngoài quốc 103.24.11.89
                (Frankfurt, Đức) đăng nhập tài khoản Lê tân
                nguyenvan.h@stayreco.vn.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                System Guard Bot đã tự động kích hoạt giao thức cô lập, vô hiệu
                hóa phiên làm việc và cưỡng chế khóa tạm thời tài khoản.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              onClick={() => notify('GeoIP Analysis là dữ liệu mock.')}
            >
              Phân tích GeoIP
            </Button>
            <Button onClick={() => notify('Đã mở Incident Forensics mẫu.')}>
              Xem Incident Forensics
            </Button>
          </div>
        </div>
      </Card>
      <Card className="rounded-2xl border-0 bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border pb-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex w-fit rounded-xl bg-muted p-1">
            {[
              ['all', 'Tất cả nhật ký'],
              ['security', 'Sự kiện bảo mật'],
              ['admin', 'Thao tác quản trị'],
            ].map(([value, label]) => (
              <Button
                key={value}
                size="sm"
                variant="ghost"
                onClick={() => setTab(value as typeof tab)}
                className={
                  tab === value
                    ? 'bg-primary text-primary-foreground hover:bg-primary'
                    : 'text-muted-foreground'
                }
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] xl:w-150">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-11 bg-muted pl-9"
                placeholder="ID: USR-829, HTL-003, TX-99..."
              />
            </label>
            <NativeSelect
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full sm:w-44 [&>select]:h-11 [&>select]:bg-muted"
            >
              <option>Tất cả mức độ</option>
              <option>Thông tin</option>
              <option>Cảnh báo</option>
              <option>Cao</option>
            </NativeSelect>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <NativeSelect className="w-full [&>select]:h-10 [&>select]:bg-muted">
            <option>18/05/2026 - 24/05/2026</option>
          </NativeSelect>
          <NativeSelect className="w-full [&>select]:h-10 [&>select]:bg-muted">
            <option>Tất cả tác nhân</option>
          </NativeSelect>
          <NativeSelect className="w-full [&>select]:h-10 [&>select]:bg-muted">
            <option>Tất cả hành động</option>
          </NativeSelect>
          <label className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 bg-muted pl-9"
              placeholder="ID: USR-829, HTL-003, TX-99..."
            />
          </label>
          <NativeSelect
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="w-full [&>select]:h-10 [&>select]:bg-muted"
          >
            <option>Tất cả mức độ</option>
            <option>Thông tin</option>
            <option>Cảnh báo</option>
            <option>Cao</option>
          </NativeSelect>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-275 text-left text-xs">
            <thead className="bg-muted font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                {[
                  'Thời gian (ICT)',
                  'Người thực hiện & Quyền',
                  'Hành động & Thao tác',
                  'Đối tượng tác động',
                  'Địa chỉ IP & Thiết bị',
                  'Mức độ',
                  'Chi tiết',
                ].map((x) => (
                  <th key={x} className="px-5 py-3.5">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((event, i) => (
                <tr
                  key={event.id}
                  className="border-b border-border hover:bg-muted"
                >
                  <td className="px-5 py-4 font-mono text-muted-foreground">
                    {event.timestamp}
                    <br />
                    <span className="text-[10px]">GMT+7 · ICT</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                        {event.actor
                          .split(' ')
                          .map((x) => x[0])
                          .join('')
                          .slice(0, 2)}
                      </span>
                      <div>
                        <b>{event.actor}</b>
                        <p className="text-[10px] text-muted-foreground">
                          {event.actor.includes('Admin')
                            ? 'Super Admin'
                            : 'System service'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <b>{event.action}</b>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Audit ID: {event.id}
                    </p>
                  </td>
                  <td className="px-5 py-4 font-mono text-primary">
                    {event.target}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    118.69.182.{90 + i}
                    <br />
                    <span className="text-[10px]">Chrome · Windows</span>
                  </td>
                  <td className="px-5 py-4">
                    <Severity value={event.severity} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelected(event)}
                    >
                      <Eye size={14} />
                      Chi tiết
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <div className="py-12 text-center">
            <ShieldCheck className="mx-auto text-muted-foreground" />
            <p className="mt-2 font-semibold">Không có sự kiện phù hợp</p>
          </div>
        )}
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
          <span>Hiển thị 1 - {rows.length} trong tổng số 17.822 bản ghi</span>
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
      <section className="grid gap-5 xl:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Chuỗi Mã Hóa Bất Biến (Audit Chain)</h3>
            <span className="size-2 rounded-full bg-success" />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Hash chain được xác nhận tại thời điểm 23:42:18. Không có bản ghi
            nào bị chỉnh sửa sau khi ký.
          </p>
          <dl className="mt-4 space-y-2 rounded-xl bg-muted p-3 font-mono text-[10px]">
            <div className="flex justify-between">
              <dt>Current Block:</dt>
              <dd className="font-bold">#1,829,401</dd>
            </div>
            <div className="flex justify-between">
              <dt>Merkle Root:</dt>
              <dd className="text-primary">0xe3bec44298fc1c...</dd>
            </div>
            <div className="flex justify-between">
              <dt>Khóa KMS:</dt>
              <dd className="font-bold text-success">stayreco-hsm-prod-v1</dd>
            </div>
          </dl>
          <Button
            variant="secondary"
            className="mt-4 h-10 w-full"
            onClick={() =>
              notify('Audit Chain Merkle Tree đã được thẩm định trong mock.')
            }
          >
            <CheckCircle2 size={15} />
            Thẩm định tính toàn vẹn Merkle Tree
          </Button>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-primary" />
            <h3 className="font-bold">Bản Đồ Điểm Truy Cập Quản Trị</h3>
          </div>
          <div className="mt-4 rounded-xl bg-muted p-3">
            <svg viewBox="0 0 240 62" className="h-16 w-full">
              <path
                d="M18 42C50 8 74 12 104 30S166 58 212 12"
                fill="none"
                stroke="var(--sr-border-control)"
                strokeDasharray="4 4"
              />
              <circle cx="92" cy="18" r="4" fill="var(--sr-success)" />
              <circle cx="143" cy="34" r="4" fill="var(--sr-primary)" />
              <circle cx="194" cy="14" r="5" fill="var(--sr-accent)" />
            </svg>
            <div className="flex justify-between text-[10px]">
              <span>98.6% Lưu lượng nội địa Việt Nam</span>
              <span className="text-brand-accent">
                1 Flag Ngoại vi (Đã cô lập)
              </span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
            <div className="rounded-xl bg-muted p-2">
              <p className="text-muted-foreground">
                IP Trụ sở chính (Whitelisted)
              </p>
              <b>118.69.192.0/24</b>
            </div>
            <div className="rounded-xl bg-muted p-2">
              <p className="text-muted-foreground">Chính sách đăng nhập</p>
              <b className="text-success">Bắt buộc Hardware Key (FIDO2)</b>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Lưu Trữ &amp; Tuân Thủ Pháp Lý</h3>
            <span className="rounded bg-success-soft px-2 py-0.5 text-[10px] font-bold text-success">
              ISO 27001
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Lưu giữ audit log 10 năm theo chính sách nội bộ. Bản sao đã mã hóa
            tại vùng DR.
          </p>
          <div className="mt-4">
            <div className="flex justify-between text-xs">
              <span>Dung lượng kho Log nén (S3 Glacier):</span>
              <b>1.48 TB</b>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[42%] rounded-full bg-primary" />
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              <span>Thời gian lưu trữ: 12 tháng</span>
              <span>Hạn sao lưu kế tiếp: 00:00 AM</span>
            </div>
          </div>
          <Button
            variant="secondary"
            className="mt-4 h-10 w-full"
            onClick={() => notify('Kho lưu trữ lạnh là dữ liệu mock.')}
          >
            Kho lưu trữ lạnh
          </Button>
        </Card>
      </section>
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-3xl lg:max-w-4xl">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <FileJson size={18} />
              </span>
              <span>
                Chi tiết Biến động Dữ liệu (JSON Diff Record){' '}
                <small className="mt-1 block font-mono text-[10px] font-normal text-muted-foreground">
                  Trace-ID: TRC-20260524-88902194 | Entity: {selected?.target}
                </small>
              </span>
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <>
              <div className="grid gap-4 p-6 md:grid-cols-2">
                <DiffPanel
                  title="Trạng thái trước (Previous)"
                  version="v2.3.9"
                  tone="text-[var(--sr-accent)]"
                  content={`{\n  "parameter_key": "PMS_HOLD_TIMEOUT_MINUTES",\n  "scope": "GLOBAL_ROOM_LOCK",\n  "value": 10,\n  "unit": "MINUTES",\n  "auto_release_unpaid": true,\n  "pms_sync_interval": 30,\n  "modified_by": "system_default"\n}`}
                />
                <DiffPanel
                  title="Trạng thái sau (Mutated)"
                  version="v2.4.0"
                  tone="text-[var(--sr-success)]"
                  content={`{\n  "parameter_key": "PMS_HOLD_TIMEOUT_MINUTES",\n  "scope": "GLOBAL_ROOM_LOCK",\n  "value": 15,\n  "unit": "MINUTES",\n  "auto_release_unpaid": true,\n  "pms_sync_interval": 30,\n  "modified_by": "USR_SUPERADMIN_01"\n}`}
                />
                <div className="md:col-span-2 rounded-xl bg-muted p-4 text-xs">
                  <p className="font-bold">
                    ⚙ Chữ ký xác thực (Cryptographic Signature)
                  </p>
                  <p className="mt-2 break-all border-b border-border pb-3 font-mono text-[11px] text-primary">
                    SIG:
                    9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
                  </p>
                  <div className="mt-3 flex flex-col justify-between gap-1 text-muted-foreground sm:flex-row">
                    <span>Actor IP: 14.238.10.45 (Hanoi, Vietnam)</span>
                    <span>Auth MFA: Passkey FIDO2 Verified</span>
                  </div>
                </div>
              </div>
              <DialogFooter className="border-t border-border bg-muted/50 px-6 py-6 pb-8 backdrop-blur">
                <Button variant="secondary" onClick={() => setSelected(null)}>
                  Đóng cửa sổ
                </Button>
                <Button onClick={copy}>
                  <Download size={16} />
                  Tải xuống Audit Certificate (.PEM)
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
function Severity({ value }: { value: AuditEvent['severity'] }) {
  const style =
    value === 'Cao'
      ? 'bg-[var(--sr-danger-soft)] text-destructive'
      : value === 'Cảnh báo'
        ? 'bg-[var(--sr-warning-soft)] text-[var(--sr-warning)]'
        : 'bg-[var(--sr-success-soft)] text-[var(--sr-success)]';
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${style}`}
    >
      {value}
    </span>
  );
}
function DiffPanel({
  title,
  version,
  tone,
  content,
}: {
  title: string;
  version: string;
  tone: string;
  content: string;
}) {
  return (
    <section className="rounded-xl bg-muted p-4">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <p className={`font-mono text-xs font-semibold ${tone}`}>{title}</p>
        <span className={`font-mono text-[10px] font-bold ${tone}`}>
          {version}
        </span>
      </div>
      <pre className="mt-3 overflow-auto font-mono text-[11px] leading-5 text-muted-foreground">
        {content}
      </pre>
    </section>
  );
}
function LogMetric({
  label,
  value,
  hint,
  icon,
  danger = false,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <Card className="border-0 bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p
            className={`mt-2 text-2xl font-bold ${danger ? 'text-brand-accent' : 'text-foreground'}`}
          >
            {value}
          </p>
          <p
            className={`mt-1 text-xs ${danger ? 'text-destructive' : 'text-success'}`}
          >
            {hint}
          </p>
        </div>
        <span
          className={`grid size-11 place-items-center rounded-xl ${danger ? 'bg-danger-soft text-destructive' : 'bg-muted text-primary'}`}
        >
          {icon}
        </span>
      </div>
    </Card>
  );
}
