'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CreditCard,
  Download,
  History,
  Hotel,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldUser,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Badge } from '@/features/admin/admin-primitives';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const periods = ['Hôm nay (20/10/2026)', '7 ngày qua', '30 ngày qua'];

const incidents = [
  {
    title: 'Lệch trạng thái GD #TX-8921',
    tag: 'VNPay Error 97',
    time: '14 phút trước',
    description:
      'Ngân hàng trừ 4.250.000 ₫ từ tài khoản khách nhưng cổng VNPay timeout không ghi nhận webhook. Cần đối soát thủ công để giữ phòng.',
    action: 'Xử lý ngay',
    icon: CreditCard,
    tone: 'danger',
  },
  {
    title: 'Yêu cầu đình chỉ đối tác #HT-042',
    tag: 'Vi phạm huỷ phòng',
    time: '1 giờ trước',
    description:
      'Platform Manager gửi yêu cầu khóa danh sách phòng của Hội An Riverside Villa do đơn phương huỷ 5 booking cận ngày mà không bồi hoàn.',
    action: 'Xem hồ sơ',
    icon: Hotel,
    tone: 'secondary',
  },
  {
    title: 'Cảnh báo đăng nhập IP bất thường',
    tag: 'IP 103.24.11.89 (DE)',
    time: '2 giờ trước',
    description:
      'Tài khoản Lễ tân nguyen.van.h@stayreco.vn đăng nhập từ Frankfurt (Đức) trái với hồ sơ vị trí địa lý thường nhật tại Đà Nẵng.',
    action: 'Khóa tạm thời',
    icon: ShieldUser,
    tone: 'neutral',
  },
] as const;

const services = [
  ['API Gateway (Kong)', 'Latency 18ms • 0 err/sec', 'Bình thường'],
  ['Cơ sở dữ liệu Postgres', 'Connection pool: 48/200', 'Tải 24%'],
  ['AI Recommendation Core', 'GPU-T4 cluster • 3 workers', 'Bình thường'],
  ['VNPay Webhook Listener', 'Queue depth: 0 • 200 OK', 'Bình thường'],
] as const;

const activities = [
  [
    'Q',
    'Trần Đình Quân',
    '10:28 SA',
    'Cập nhật chính sách hoàn hủy cho đối tác An Lam Retreats.',
    'primary',
  ],
  [
    'M',
    'Platform Manager',
    '09:45 SA',
    'Gửi cảnh báo vi phạm chất lượng dịch vụ tới chủ homestay Mây Sapa #HT-109.',
    'secondary',
  ],
  [
    'S',
    'System Guard',
    '08:12 SA',
    'Tự động thu hồi token API hết hạn cho ứng dụng tích hợp PMS HotelLink.',
    'success',
  ],
  [
    'L',
    'Lê Hoàng Nam',
    '07:50 SA',
    'Xác thực định danh đối tác mới: Tam Cốc Garden Resort (Ninh Bình).',
    'neutral',
  ],
] as const;

export function Dashboard({ notify }: { notify: (message: string) => void }) {
  const [period, setPeriod] = useState(periods[1]);
  const [refreshing, setRefreshing] = useState(false);
  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      notify('Dữ liệu Dashboard đã được làm mới.');
    }, 750);
  };

  return (
    <div className="flex w-full flex-col gap-8">
      <section className="flex flex-col gap-4 pb-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#bceecf] px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-[#002112]">
              VẬN HÀNH LIVE
            </span>
            <span className="font-mono text-xs text-[#72777e]">
              v2.4.12 • Node VN-SGN-01
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#013758] lg:text-3xl">
            Tổng quan vận hành hệ thống StayReco
          </h1>
          <p className="text-xs text-[#42474e] lg:text-sm">
            Hệ sinh thái lưu trú boutique &amp; đề xuất AI cá nhân hóa toàn quốc
            • Cập nhật lần cuối: 10:42 SA
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex rounded-xl bg-[#eceef4] p-1 shadow-inner">
            {periods.map((item) => (
              <Button
                key={item}
                variant="ghost"
                onClick={() => setPeriod(item)}
                className={`h-auto rounded-lg px-3 py-1.5 text-xs font-medium ${period === item ? 'bg-white text-[#013758] shadow-sm' : 'text-[#181c20] hover:text-[#013758]'}`}
              >
                {item}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            className="h-10 rounded-xl border-0 bg-white px-3.5 text-xs font-semibold shadow-sm hover:bg-[#eceef4]"
            onClick={() =>
              notify(`Đã chuẩn bị báo cáo ${period.toLowerCase()}.`)
            }
          >
            <Download size={18} className="text-[#72777e]" />
            Xuất báo cáo
          </Button>
          <Button
            size="icon"
            className="size-10 rounded-xl bg-[#013758] text-white shadow-sm hover:bg-[#234e70]"
            title="Làm mới dữ liệu"
            aria-label="Làm mới dữ liệu"
            onClick={refresh}
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border-0 bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tổng tài khoản hệ thống
              </p>
              <div className="mt-1.5 flex items-baseline gap-2">
                <strong className="text-3xl tracking-tight">48.290</strong>
                <span className="inline-flex items-center text-xs font-semibold text-success">
                  <TrendingUp size={14} />
                  +12.4%
                </span>
              </div>
            </div>
            <span className="grid size-10 place-items-center rounded-xl bg-primary/5 text-primary">
              <Users size={20} />
            </span>
          </div>
          <div className="mt-6">
            <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
              <i className="h-full w-[88%] bg-primary" />
              <i className="h-full w-[8%] bg-brand-accent" />
              <i className="h-full w-[4%] bg-success" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] text-[#42474e]">
              <MetricDetail
                color="bg-[#013758]"
                label="Khách hàng"
                value="47.120"
              />
              <MetricDetail
                color="bg-[#934a33]"
                label="Khách sạn"
                value="980"
              />
              <MetricDetail
                color="bg-[#0b3c27]"
                label="Nhân viên"
                value="182"
              />
              <MetricDetail color="bg-[#72777e]" label="Quản trị" value="8" />
            </div>
          </div>
        </Card>
        <Card className="rounded-2xl border-0 bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Đặt phòng tháng này
              </p>
              <div className="mt-1.5 flex items-baseline gap-2">
                <strong className="text-3xl tracking-tight text-primary">
                  3.420
                </strong>
                <span className="text-xs text-muted-foreground">
                  đơn xác nhận
                </span>
              </div>
            </div>
            <span className="grid size-10 place-items-center rounded-xl bg-warning-soft text-warning">
              <Hotel size={20} />
            </span>
          </div>
          <div className="mt-6 space-y-2">
            <Row
              label="Doanh số GMV"
              value="8.55 tỷ ₫"
              valueClass="text-[#934a33] text-sm"
            />
            <Row
              label="Tỷ lệ thanh toán thành công"
              value="98.6%"
              valueClass="rounded-md bg-[#bceecf]/60 px-2 py-0.5 text-[#0b3c27]"
            />
            <p className="flex items-center gap-1 pt-1 text-[11px] text-[#72777e]">
              <CheckCircle2 size={13} className="text-[#0b3c27]" />
              Cao hơn 4.2% so với cùng kỳ tháng 9
            </p>
          </div>
        </Card>
        <Card className="rounded-2xl border-0 bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#72777e]">
                Cảnh báo thanh toán
              </p>
              <div className="mt-1.5 flex items-baseline gap-2">
                <strong className="text-3xl tracking-tight text-[#934a33]">
                  03
                </strong>
                <span className="rounded-full bg-[#fea184]/40 px-2 py-0.5 text-[11px] font-semibold text-[#934a33]">
                  Cần đối soát
                </span>
              </div>
            </div>
            <span className="grid size-10 place-items-center rounded-xl bg-[#fea184]/30 text-[#934a33]">
              <CircleAlert size={20} />
            </span>
          </div>
          <div className="mt-5">
            <p className="text-xs leading-relaxed text-[#42474e]">
              Phát hiện 2 lệnh lệch webhook cổng VNPay và 1 giao dịch timeout
              cần kiểm tra trước phiên quyết toán 15:00.
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-mono text-[11px] text-[#72777e]">
                Tổn thất dự báo: 0 đ
              </span>
              <Link
                href="/admin/transactions"
                className="flex items-center gap-1 text-xs font-semibold text-[#934a33]"
              >
                Chi tiết <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </Card>
        <Card className="rounded-2xl border-0 bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#72777e]">
                Khả dụng AI Engine
              </p>
              <div className="mt-1.5 flex items-baseline gap-2">
                <strong className="text-3xl tracking-tight text-[#0b3c27]">
                  99.94%
                </strong>
                <span className="size-2 animate-pulse rounded-full bg-[#0b3c27]" />
              </div>
            </div>
            <span className="grid size-10 place-items-center rounded-xl bg-[#26533c]/10 text-[#0b3c27]">
              <Bot size={20} />
            </span>
          </div>
          <div className="mt-5 space-y-2">
            <Row label="Lượt gợi ý cá nhân hóa:" value="24.850 req" />
            <Row label="Độ trễ trung bình (p95):" value="420 ms" />
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#eceef4]">
              <div className="h-full w-[94%] rounded-full bg-[#0b3c27]" />
            </div>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-8 lg:col-span-8">
          <Card className="rounded-2xl border-0 bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-3 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#72777e]">
                  Hiệu suất kinh doanh
                </p>
                <h2 className="text-lg font-bold">
                  Lưu lượng truy cập &amp; Giao dịch 30 ngày
                </h2>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <i className="size-3 rounded-sm bg-[#013758]" />{' '}
                  Số đơn đặt
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="size-3 rounded-sm bg-[#934a33]" />{' '}
                  GMV (triệu ₫)
                </span>
              </div>
            </div>
            <Chart />
            <div className="flex items-center justify-between pt-3 font-mono text-[11px] text-[#72777e]">
              <span>20 Th09</span>
              <span>27 Th09</span>
              <span>04 Th10</span>
              <span>11 Th10</span>
              <span>Hôm nay (20 Th10)</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f1f3f9] p-3.5 text-xs text-[#42474e]">
              <span className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#0b3c27]" />
                Khối lượng đặt phòng qua AI Recommendation tăng trưởng{' '}
                <strong>31.8%</strong> so với tìm kiếm thủ công truyền thống.
              </span>
              <span className="font-mono text-[11px] text-[#72777e]">
                Mô hình Hybrid LightFM v4.2
              </span>
            </div>
          </Card>
          <Card className="rounded-2xl border-0 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between pb-5">
              <div className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-lg bg-[#ffdad6] text-[#ba1a1a]">
                  <ShieldAlert size={18} />
                </span>
                <div>
                  <h2 className="text-lg font-bold">
                    Hàng đợi sự vụ cần xử lý ngay
                  </h2>
                  <p className="text-xs text-[#42474e]">
                    3 sự vụ đang chờ Quản trị viên cấp cao phê duyệt hoặc kiểm
                    tra
                  </p>
                </div>
              </div>
              <Badge>3 việc</Badge>
            </div>
            <div className="space-y-3.5">
              {incidents.map((incident) => (
                <Incident key={incident.title} {...incident} notify={notify} />
              ))}
            </div>
          </Card>
        </div>
        <div className="flex flex-col gap-8 lg:col-span-4">
          <Card className="rounded-2xl border-0 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-2">
                <Server size={20} className="text-[#0b3c27]" />
                <h2 className="text-base font-bold">
                  Giám sát hạ tầng &amp; Dịch vụ
                </h2>
              </div>
              <span className="rounded bg-[#bceecf] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#002112]">
                ALL HEALTHY
              </span>
            </div>
            <div className="space-y-3.5 pt-2">
              {services.map(([name, detail, state], index) => (
                <Service
                  key={name}
                  name={name}
                  detail={detail}
                  state={state}
                  database={index === 1}
                />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#eceef4] pt-3 text-[11px] text-[#42474e]">
              <span className="flex items-center gap-1">
                <History size={13} />
                Chu kỳ ping: 10 giây
              </span>
              <Link href="#" className="font-medium text-[#013758]">
                Báo cáo SLA →
              </Link>
            </div>
          </Card>
          <Card className="rounded-2xl border-0 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-2">
                <History size={20} className="text-[#013758]" />
                <h2 className="text-base font-bold">
                  Nhật ký quản trị gần đây
                </h2>
              </div>
              <span className="font-mono text-[11px] text-[#72777e]">
                Hôm nay
              </span>
            </div>
            <div className="relative space-y-4 before:absolute before:bottom-3 before:left-3.5 before:top-3 before:w-0.5 before:bg-[#eceef4]">
              {activities.map(([initial, actor, time, detail, tone]) => (
                <ActivityItem
                  key={actor}
                  initial={initial}
                  actor={actor}
                  time={time}
                  detail={detail}
                  tone={tone}
                />
              ))}
            </div>
            <div className="mt-4 border-t border-[#eceef4] pt-3 text-center">
              <Link
                href="/admin/logs"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#013758]"
              >
                Xem toàn bộ nhật ký kiểm toán (Audit Trail)
                <ChevronRight size={14} />
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

function MetricDetail({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5">
        <i className={`size-1.5 rounded-full ${color}`} />
        {label}
      </span>
      <strong className="text-foreground">{value}</strong>
    </div>
  );
}
function Row({
  label,
  value,
  valueClass = '',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <strong className={`font-mono text-foreground ${valueClass}`}>
        {value}
      </strong>
    </div>
  );
}
function Chart() {
  return (
    <div className="h-64">
      <svg
        className="size-full overflow-visible"
        preserveAspectRatio="none"
        viewBox="0 0 720 220"
        role="img"
        aria-label="Biểu đồ số đơn đặt và GMV trong 30 ngày"
      >
        <defs>
          <linearGradient
            id="dashboard-primary-area"
            x1="0"
            x2="0"
            y1="0"
            y2="1"
          >
            <stop offset="0%" stopColor="var(--sr-primary)" stopOpacity=".18" />
            <stop offset="100%" stopColor="var(--sr-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 20H720M0 70H720M0 120H720M0 170H720"
          stroke="var(--sr-border-subtle)"
          strokeDasharray="4 4"
        />
        <path d="M0 210H720" stroke="var(--sr-border-control)" />
        <path
          d="M0 170Q120 130 240 150T480 80T720 50L720 210L0 210Z"
          fill="url(#dashboard-primary-area)"
        />
        <path
          d="M0 170Q120 130 240 150T480 80T720 50"
          fill="none"
          stroke="var(--sr-primary)"
          strokeLinecap="round"
          strokeWidth="2.5"
        />
        <path
          d="M0 190Q130 165 250 135T500 105T720 35"
          fill="none"
          stroke="var(--sr-accent)"
          strokeDasharray="5 4"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <circle cx="240" cy="150" r="4" fill="var(--sr-primary)" />
        <circle cx="480" cy="80" r="4" fill="var(--sr-primary)" />
        <circle cx="720" cy="50" r="5" fill="var(--sr-primary)" />
        <circle cx="720" cy="35" r="5" fill="var(--sr-accent)" />
      </svg>
    </div>
  );
}
function Incident({
  title,
  tag,
  time,
  description,
  action,
  icon: Icon,
  tone,
  notify,
}: (typeof incidents)[number] & { notify: (message: string) => void }) {
  const styles = {
    danger: {
      icon: 'bg-destructive/10 text-destructive',
      tag: 'bg-[var(--sr-danger-soft)] text-destructive',
      button:
        'bg-primary text-primary-foreground hover:bg-[var(--sr-primary-hover)]',
    },
    secondary: {
      icon: 'bg-[var(--sr-warning-soft)] text-[var(--sr-warning)]',
      tag: 'bg-[var(--sr-warning-soft)] text-[var(--sr-warning)]',
      button: 'bg-card text-foreground hover:bg-muted',
    },
    neutral: {
      icon: 'bg-muted text-muted-foreground',
      tag: 'bg-secondary text-secondary-foreground',
      button: 'bg-[var(--sr-accent)] text-white hover:bg-[var(--sr-accent)]/90',
    },
  }[tone];
  return (
    <article className="flex flex-col gap-4 rounded-xl bg-muted p-4 transition hover:bg-(--sr-surface-hover) md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${styles.icon}`}
        >
          <Icon size={20} />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-sm">{title}</strong>
            <span
              className={`rounded px-2 py-0.5 font-mono text-[10px] font-medium ${styles.tag}`}
            >
              {tag}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {time}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <Button
        className={`h-9 shrink-0 rounded-lg px-4 text-xs font-semibold shadow-sm ${styles.button}`}
        onClick={() => notify(`Đã mở xử lý: ${title}`)}
      >
        {action}
      </Button>
    </article>
  );
}
function Service({
  name,
  detail,
  state,
  database,
}: {
  name: string;
  detail: string;
  state: string;
  database: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-muted p-3">
      <div className="flex items-center gap-2.5">
        <span className="size-2.5 rounded-full bg-success" />
        <div>
          <strong className="block text-xs">{name}</strong>
          <span className="font-mono text-[10px] text-muted-foreground">
            {detail}
          </span>
        </div>
      </div>
      {database ? (
        <div className="text-right">
          <strong className="text-xs font-medium">{state}</strong>
          <div className="mt-1 h-1 w-12 overflow-hidden rounded-full bg-(--sr-surface-hover)">
            <i className="block h-full w-[24%] bg-success" />
          </div>
        </div>
      ) : (
        <span className="text-xs font-medium text-success">
          {state}
        </span>
      )}
    </div>
  );
}
function ActivityItem({
  initial,
  actor,
  time,
  detail,
  tone,
}: {
  initial: string;
  actor: string;
  time: string;
  detail: string;
  tone: string;
}) {
  const colors: Record<string, string> = {
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-[var(--sr-accent)] text-white',
    success: 'bg-[var(--sr-success)] text-white',
    neutral: 'bg-border text-foreground',
  };
  return (
    <div className="relative z-10 flex items-start gap-3">
      <span
        className={`grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-bold ${colors[tone]}`}
      >
        {initial}
      </span>
      <div className="text-xs">
        <div className="flex flex-wrap items-baseline gap-1.5">
          <strong>{actor}</strong>
          <span className="font-mono text-[10px] text-muted-foreground">
            {time}
          </span>
        </div>
        <p className="mt-0.5 text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
