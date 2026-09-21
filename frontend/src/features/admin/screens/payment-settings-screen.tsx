'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  Clipboard,
  Eye,
  EyeOff,
  KeyRound,
  Landmark,
  QrCode,
  Save,
  ShieldCheck,
  Terminal,
  Timer,
  Wifi,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const endpoints = [
  ['Payment URL', 'https://payment.vnpay.vn/vpcpay.html'],
  ['IPN Callback', 'https://api.stayreco.vn/v1/payments/vnpay/callback'],
  ['Return URL', 'https://stayreco.vn/bookings/payment-result'],
] as const;
const audits = [
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
] as const;

export function PaymentSettings({
  notify,
}: {
  notify: (message: string) => void;
}) {
  const [environment, setEnvironment] = useState<'production' | 'sandbox'>(
    'production',
  );
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState<'save' | 'ping' | null>(null);
  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard?.writeText(value);
      notify(`Đã sao chép ${label}.`);
    } catch {
      notify(`Không thể sao chép ${label}.`);
    }
  };
  const action = (type: 'save' | 'ping') => {
    setBusy(type);
    window.setTimeout(() => {
      setBusy(null);
      notify(
        type === 'save'
          ? 'Đã lưu cấu hình thanh toán mẫu.'
          : 'VNPay Live phản hồi ổn định: 423 ms.',
      );
    }, 600);
  };
  return (
    <div className="space-y-6 pt-4">
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            A04 // Payment Operations
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary md:text-3xl">
            Cấu hình Thanh toán &amp; Đối soát Cổng giao dịch
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Điều phối cổng thanh toán, đối soát tự động và bảo chứng giao dịch
            StayReco.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="h-10 rounded-xl bg-card"
            disabled={busy !== null}
            onClick={() => action('ping')}
          >
            <Wifi size={16} />
            {busy === 'ping' ? 'Đang kiểm tra...' : 'Kiểm tra kết nối Live'}
          </Button>
          <Button
            className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-(--sr-primary-hover)"
            disabled={busy !== null}
            onClick={() => action('save')}
          >
            <Save size={16} />
            {busy === 'save' ? 'Đang lưu...' : 'Lưu thay đổi cấu hình'}
          </Button>
        </div>
      </header>
      <div className="flex items-center gap-3 rounded-2xl border border-(--sr-success)/15 bg-success-soft p-4">
        <span className="grid size-9 place-items-center rounded-full bg-success text-white">
          <CheckCircle2 size={19} />
        </span>
        <div>
          <p className="text-sm font-semibold text-success">
            Hệ thống thanh toán đang vận hành ổn định
          </p>
          <p className="text-xs text-muted-foreground">
            99.8% giao dịch xử lý dưới 1.2 giây · Đối soát tự động T+1 đang hoạt
            động.
          </p>
        </div>
      </div>
      <Card className="rounded-2xl border-0 bg-card shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-12 lg:p-8">
          <div className="space-y-6 lg:col-span-8">
            <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row">
              <div className="flex gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Landmark size={22} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">
                      Cổng thanh toán chính thức VNPay Gateway
                    </h2>
                    <span className="rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-semibold text-success">
                      Live
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Kết nối trực tiếp hạ tầng VNPay qua MPLS riêng.
                  </p>
                </div>
              </div>
              <div className="flex h-9 items-center rounded-xl bg-muted p-1">
                {(['production', 'sandbox'] as const).map((item) => (
                  <Button
                    key={item}
                    size="sm"
                    variant="ghost"
                    onClick={() => setEnvironment(item)}
                    className={
                      environment === item
                        ? 'h-7 bg-primary text-primary-foreground hover:bg-primary'
                        : 'h-7 text-muted-foreground'
                    }
                  >
                    {item === 'production' ? 'Production' : 'Sandbox'}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Merchant Code" value="STAYRECO_CORP_VN" />
              <Field label="TMN Code" value="VNPAY_STAYRECO_2026" copy={copy} />
              <div className="md:col-span-2">
                <Label>Hash Secret</Label>
                <div className="mt-1.5 flex gap-2">
                  <Input
                    readOnly
                    type={visible ? 'text' : 'password'}
                    value="3Xk9VnPayStayRecoLive2026Secure"
                    className="h-10 bg-muted font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setVisible(!visible)}
                    aria-label="Ẩn hoặc hiện Hash Secret"
                  >
                    {visible ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                  <Button
                    variant="outline"
                    className="shrink-0"
                    onClick={() =>
                      notify('Yêu cầu xoay Hash Secret đã được tạo trong mock.')
                    }
                  >
                    <KeyRound size={16} />
                    Xoay key
                  </Button>
                </div>
              </div>
              {endpoints.map(([label, value]) => (
                <Field
                  key={label}
                  label={label}
                  value={value}
                  copy={copy}
                  wide
                />
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Setting
                label="ATM nội địa"
                value="1.1%"
                hint="Đối soát tự động T+1"
              />
              <Setting
                label="Visa/Master"
                value="2.2%"
                hint="+2.500₫ · 3D Secure"
              />
              <Setting
                label="Hold Timeout PMS"
                value="15 phút"
                hint="Tự nhả phòng khi quá hạn"
                icon={<Timer size={16} />}
              />
            </div>
          </div>
          <aside className="flex flex-col justify-between rounded-2xl bg-muted p-5 lg:col-span-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Hiệu suất định tuyến thanh toán
              </p>
              <h3 className="mt-1 text-sm font-bold">
                99.8% Giao dịch xử lý dưới 1.2s
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Hạ tầng Data Center VNPay Tân Bình &amp; Hòa Lạc đường truyền
                riêng MPLS.
              </p>
            </div>
            <svg
              className="mt-5 h-12 w-full text-primary"
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 240 40"
            >
              <path
                d="M0 32Q20 28 40 22T80 18T120 25T160 12T200 15T240 8"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2.5"
              />
            </svg>
          </aside>
        </div>
      </Card>
      <Card className="rounded-2xl border-0 bg-card p-6 shadow-sm lg:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row">
          <div className="flex gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-warning-soft text-warning">
              <QrCode size={21} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Cổng SePay QR Banking</h2>
                <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-semibold text-warning">
                  Dự phòng tự động
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Chuyển khoản VietQR tự động tích hợp AI Vision &amp; Webhook đối
                soát tức thời.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => notify('Chế độ giả lập đối soát QR được bật.')}
          >
            <Terminal size={16} />
            Chạy thử nghiệm Webhook
          </Button>
        </div>
        <div className="grid gap-5 pt-6 md:grid-cols-2 xl:grid-cols-4">
          <Account
            label="Tài khoản thụ hưởng chính"
            state="Active"
            number="9823 8888 6666"
            bank="MBBank"
            owner="CTCP DU LICH STAYRECO"
          />
          <Account
            label="Tài khoản phụ dự phòng"
            state="Standby"
            number="0071 000 892 119"
            bank="Vietcombank"
            owner="VCB CN Tân Định"
          />
          <Field
            label="Webhook SePay URL"
            value="https://api.stayreco.vn/v1/webhooks/sepay"
            copy={copy}
          />
          <div>
            <Label>Cú pháp nhận diện giao dịch</Label>
            <div className="mt-1.5 flex h-20 flex-col justify-between rounded-xl bg-muted p-3">
              <strong className="font-mono text-xs text-primary">
                STAYRECO [MA_DAT_PHONG]
              </strong>
              <p className="text-[10px] text-muted-foreground">
                Xác nhận phòng tự động trong vòng 3 giây.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-col justify-between gap-4 rounded-xl bg-muted p-4 sm:flex-row sm:items-center">
          <div className="flex gap-3">
            <span className="grid size-8 place-items-center rounded-full bg-success-soft text-success">
              <ShieldCheck size={17} />
            </span>
            <div>
              <h3 className="text-xs font-bold">
                Bảo chứng Escrow 24h StayReco áp dụng chung cho mọi cổng
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Khoản tiền đặt phòng chỉ giải ngân cho host sau khi khách nhận
                phòng 24h.
              </p>
            </div>
          </div>
          <span className="w-fit rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
            Đã bảo vệ 100%
          </span>
        </div>
      </Card>
      <Card className="rounded-2xl border-0 bg-card p-6 shadow-sm lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">
              Lịch sử thay đổi cấu hình &amp; Sự kiện đối soát (Audit Trail)
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Ghi nhận minh bạch mọi thao tác can thiệp tham số cổng thanh toán.
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            Hiển thị 3 bản ghi mới nhất
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-175 text-left text-xs">
            <thead className="bg-muted text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="rounded-l-xl px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">Người thực hiện</th>
                <th className="px-4 py-3">Tham số thay đổi</th>
                <th className="px-4 py-3">Mô tả hành động chi tiết</th>
                <th className="rounded-r-xl px-4 py-3 text-right">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody>
              {audits.map(([time, date, field, detail]) => (
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
                    <strong>Trần Đình Quân</strong>
                    <span className="ml-1 text-muted-foreground">
                      Super Admin
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded bg-muted px-2 py-1 font-mono text-[11px]">
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
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}
function Field({
  label,
  value,
  copy,
  wide,
}: {
  label: string;
  value: string;
  copy?: (value: string, label: string) => void;
  wide?: boolean;
}) {
  return (
    <div className={wide ? 'md:col-span-2' : ''}>
      <Label>{label}</Label>
      <div className="mt-1.5 flex gap-2">
        <Input
          readOnly
          value={value}
          className="h-10 min-w-0 bg-muted font-mono text-xs"
        />
        {copy && (
          <Button
            variant="outline"
            size="icon"
            aria-label={`Sao chép ${label}`}
            onClick={() => copy(value, label)}
          >
            <Clipboard size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}
function Setting({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-muted p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center justify-between">
        <strong>{value}</strong>
        {icon}
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p>
    </div>
  );
}
function Account({
  label,
  state,
  number,
  bank,
  owner,
}: {
  label: string;
  state: string;
  number: string;
  bank: string;
  owner: string;
}) {
  return (
    <div>
      <p className="flex justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        <span className="normal-case text-success">{state}</span>
      </p>
      <div className="mt-1.5 flex h-20 flex-col justify-between rounded-xl bg-muted p-3">
        <strong className="font-mono text-sm">{number}</strong>
        <p className="flex justify-between text-[10px] text-muted-foreground">
          <span>{bank}</span>
          <span>{owner}</span>
        </p>
      </div>
    </div>
  );
}
