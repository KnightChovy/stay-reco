'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Clipboard,
  Clock3,
  FileText,
  RefreshCw,
  ShieldCheck,
  TimerReset,
  UserRound,
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
import { Textarea } from '@/components/ui/textarea';
import { transactions } from '@/lib/admin-data';
const compare = [
  [
    'Mã tham chiếu đơn',
    'SR-261020-0842',
    'SR-261020-0842',
    '✓ Trùng khớp',
    'success',
  ],
  [
    'Số tiền thanh toán',
    '2.250.000 ₫',
    '2.250.000 ₫',
    '✓ Trùng khớp 100%',
    'success',
  ],
  [
    'Mã giao dịch ngân hàng',
    'VNP142981023',
    'VNP142981023',
    '✓ Ghi nhận thành công',
    'success',
  ],
  [
    'Chữ ký số (SecureHash)',
    '8fbc923a10e... (khóa cũ)',
    'c1a938fe79... (khóa mới)',
    '⊘ Sai lệch Hash',
    'danger',
  ],
  [
    'Trạng thái ghi nhận',
    'Trừ tiền khách OK',
    'Chờ xác nhận',
    '⊖ Cần xác nhận thủ công',
    'warning',
  ],
] as const;
export function TransactionDetail({
  id,
  notify,
}: {
  id?: string;
  notify: (m: string) => void;
}) {
  const tx = transactions.find((x) => x.id === id) ?? transactions[0];
  const [query, setQuery] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [reason, setReason] = useState(
    'Đã kiểm tra số dư sao kê VCB Live, tiền 2.250.000 ₫ đã về tài khoản công ty lúc 15:38:45. Lỗi mã 97 do Key Rotation phiên sáng. Tiến hành duyệt thanh toán và phát hành phiếu xác nhận phòng.',
  );
  const copy = async (v: string, l: string) => {
    try {
      await navigator.clipboard?.writeText(v);
      notify(`Đã sao chép ${l}.`);
    } catch {
      notify(`Không thể sao chép ${l}.`);
    }
  };
  const submit = () => {
    if (reason.trim().length < 20)
      return notify('Vui lòng nhập lý do đối soát tối thiểu 20 ký tự.');
    setResolved(true);
    notify('Đã duyệt đối soát và phát hành xác nhận phòng trong mock.');
  };
  return (
    <div className="space-y-6 pt-4">
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <Link
            href="/admin/transactions"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
          >
            <ArrowLeft size={15} />
            Quay lại nhật ký giao dịch
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-primary">
            Giao dịch #{tx.id}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Chi tiết &amp; xác minh giao dịch · {tx.bookingCode}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className="bg-primary text-primary-foreground hover:bg-(--sr-primary-hover)"
            onClick={() => setQuery(true)}
          >
            <RefreshCw size={16} />
            Kiểm tra trạng thái QueryDR
          </Button>
          <Button
            variant="outline"
            onClick={() => notify('Đã mở quy trình đối soát thủ công.')}
          >
            <ShieldCheck size={16} />
            Đối soát thủ công
          </Button>
          <Button
            variant="outline"
            className="text-destructive"
            onClick={() => notify('Đã gửi yêu cầu nhả Hold PMS trong mock.')}
          >
            <TimerReset size={16} />
            Nhả Hold
          </Button>
        </div>
      </header>
      <Card className="border-l-4 border-l-brand-accent bg-card p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold text-brand-accent">
              CẢNH BÁO ĐỒNG BỘ &amp; RỦI RO THANH TOÁN{' '}
              <span className="ml-2 rounded bg-danger-soft px-2 py-0.5 text-[10px]">
                Risk Score: HIGH
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ngân hàng phát sinh trừ tiền của chủ thẻ, nhưng mã chữ ký xác thực
              IPN trả lỗi Code 97. Hệ thống PMS đang giữ chỗ (Hold room) cho
              khách hàng còn 04:18.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              notify('Đã gia hạn giữ chỗ PMS thêm 30 phút trong mock.')
            }
          >
            <TimerReset size={15} />
            Gia hạn giữ chỗ (+30p)
          </Button>
        </div>
      </Card>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DetailMetric
          label="Tổng tiền giao dịch"
          value="2.250.000 ₫"
          hint="Khớp 100% với giá trị đặt phòng"
        />
        <DetailMetric
          label="Phí cổng VNPay (1.1%)"
          value="24.750 ₫"
          hint="Biểu phí nội địa VNPay-QR Fixed"
        />
        <DetailMetric
          label="Thực nhận về Escrow"
          value="2.225.250 ₫"
          hint="Tài khoản: Vietcombank - 8920199"
          success
        />
        <DetailMetric
          label="Kênh & Thiết bị"
          value="Vietcombank Mobile"
          hint="App-to-App · IP 14.162.184.222"
        />
      </section>
      <Card className="rounded-2xl border-0 bg-card p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="grid gap-3 sm:grid-cols-3">
            <Info label="Mã gateway" value={tx.id} />
            <Info label="Booking liên kết" value={tx.bookingCode} />
            <Info label="Thời điểm giao dịch" value={tx.verifiedAt} />
          </div>
          <span
            className={`w-fit rounded-full px-4 py-2 text-sm font-bold ${resolved ? 'bg-success-soft text-success' : 'bg-danger-soft text-destructive'}`}
          >
            {resolved ? 'Khớp 100%' : 'Cần đối soát thủ công'}
          </span>
        </div>
      </Card>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,1fr)]">
        <div className="space-y-6 xl:contents xl:space-y-0">
          <Card className="rounded-2xl border-0 bg-card p-5 shadow-sm xl:order-1 xl:col-start-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider">
                Thông tin các bên liên quan
              </h2>
              <span className="text-xs text-muted-foreground">
                Khởi tạo bởi Guest Mobile App
              </span>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <section className="rounded-xl bg-muted p-4">
                <div className="flex items-start justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Người đặt phòng
                  </p>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    Thành viên Bạc
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="grid size-9 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    MA
                  </span>
                  <div>
                    <p className="text-sm font-bold">Nguyễn Minh Anh</p>
                    <p className="text-[10px] text-muted-foreground">
                      minhanh.traveler@gmail.com
                    </p>
                  </div>
                </div>
                <dl className="mt-4 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Số điện thoại:</dt>
                    <dd className="font-mono">0912 345 678</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">CCCD/Passport:</dt>
                    <dd>************</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Lịch sử đặt:</dt>
                    <dd className="text-success">4 đơn thành công / 0 hoàn</dd>
                  </div>
                </dl>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 px-0 text-primary"
                >
                  Xem hồ sơ người dùng
                </Button>
              </section>
              <section className="rounded-xl bg-muted p-4">
                <div className="flex items-start justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Khách sạn thụ hưởng
                  </p>
                  <span className="rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-semibold text-success">
                    Đối tác VIP
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-bold">An Nhiên Riverside Hotel</p>
                  <p className="text-[10px] text-muted-foreground">
                    Sơn Trà, Đà Nẵng
                  </p>
                </div>
                <dl className="mt-4 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Mã phòng PMS:</dt>
                    <dd className="font-mono">DLX-RIV-304</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                      Thời gian lưu trú:
                    </dt>
                    <dd>2 đêm (26/10 - 28/10/2026)</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Trạng thái phòng:</dt>
                    <dd className="text-brand-accent">● Đang tạm giữ chỗ</dd>
                  </div>
                </dl>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 px-0 text-primary"
                >
                  Xem phòng trên hệ thống PMS
                </Button>
              </section>
            </div>
          </Card>
          <Card className="rounded-2xl border-0 bg-card p-6 shadow-sm xl:order-2 xl:col-start-1">
            <h2 className="text-sm font-bold uppercase tracking-wider">
              So sánh thông số 3 bên (Đối chiếu dữ liệu)
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-170 text-left text-xs">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    {[
                      'Trường dữ liệu',
                      'Cổng VNPay (Gốc)',
                      'StayReco Backend',
                      'Kết luận đối soát',
                    ].map((x) => (
                      <th key={x} className="px-4 py-3">
                        {x}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {compare.map(([field, gateway, backend, result, tone]) => (
                    <tr
                      key={field}
                      className={`border-b border-border ${tone === 'danger' ? 'bg-(--sr-danger-soft)/45' : ''}`}
                    >
                      <td className="px-4 py-4 font-semibold">{field}</td>
                      <td className="px-4 py-4 font-mono">{gateway}</td>
                      <td className="px-4 py-4">{backend}</td>
                      <td
                        className={`px-4 py-4 font-semibold ${tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-destructive' : 'text-brand-accent'}`}
                      >
                        {result}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card className="rounded-2xl border-0 bg-card p-6 shadow-sm xl:order-3 xl:col-start-2 xl:row-start-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider">
                Gói tin IPN Callback (VNPay)
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary"
                onClick={() =>
                  copy(
                    'vnp_TxnRef=TX-VN-8942&vnp_ResponseCode=97&vnp_Amount=225000000',
                    'IPN payload',
                  )
                }
              >
                <Clipboard size={15} />
                Sao chép payload
              </Button>
            </div>
            <pre className="mt-4 overflow-auto rounded-xl bg-[#2d3135] p-4 text-[11px] leading-5 text-white">{`{\n  "vnp_TmnCode": "STAYRECO_LIVE",\n  "vnp_Amount": "225000000",\n  "vnp_BankCode": "VIETCOMBANK",\n  "vnp_BankTranNo": "VNP142981023",\n  "vnp_CardType": "QR_CODE_PAY",\n  "vnp_OrderInfo": "Thanh toan don phong #SR-261020-0842 An Nhien Riverside Hotel",\n  "vnp_PayDate": "20260524153845",\n  "vnp_ResponseCode": "97",\n  "vnp_TransactionNo": "142981023",\n  "vnp_TransactionStatus": "00",\n  "vnp_TxnRef": "SR-261020-0842",\n  "vnp_SecureHashType": "HMACSHA512",\n  "vnp_SecureHash": "a8f9de23e8412ef84a91c0b392e9d..."\n}`}</pre>
            <div className="mt-3 flex justify-between rounded-xl bg-muted px-3 py-2 text-xs">
              <span className="text-muted-foreground">
                VNPay Response Message:
              </span>
              <b className="font-mono text-destructive">
                97 - Invalid Checksum
              </b>
            </div>
          </Card>
          <Card className="rounded-2xl border-0 bg-card p-6 shadow-sm xl:order-4 xl:col-start-2 xl:row-start-2">
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Nhật ký sự kiện thời gian thực
            </h2>
            <div className="mt-5 space-y-5">
              {[
                [
                  'Khởi tạo giao dịch thanh toán',
                  'Người dùng xác nhận phương thức VNPay-QR trên ứng dụng di động StayReco.',
                  '15:38:20',
                ],
                [
                  'Ngân hàng báo trừ tiền thành công',
                  'Vietcombank Mobile Banking ghi nhận biến động số dư: -2.250.000 ₫ từ tài khoản khách hàng.',
                  '15:38:45',
                ],
                [
                  'IPN Callback trả mã lỗi 97',
                  'Hệ thống xác thực mã Hash thất bại, chuyển trạng thái giao dịch sang lệch kiểm tra an toàn.',
                  '15:39:00',
                ],
                [
                  'Tạo cảnh báo khẩn cấp cho Quản trị viên',
                  'Chuyển tiếp phiên đối soát cho Trần Đình Quân (Super Admin) xử lý thủ công trước khi hết hạn Hold phòng.',
                  '15:42:00',
                ],
              ].map(([title, detail, time], i) => (
                <div key={title} className="flex gap-3">
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-full ${i === 3 && !resolved ? 'bg-warning-soft text-warning' : 'bg-primary/10 text-primary'}`}
                  >
                    <Clock3 size={14} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">
                      {i === 3 && resolved
                        ? 'Quản trị viên đã duyệt đối soát'
                        : title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {detail}
                    </p>
                    <span className="mt-1 block text-[10px] text-muted-foreground">
                      {time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <aside className="space-y-6 xl:hidden">
          <Card className="rounded-2xl border-0 bg-card p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Thông tin các bên liên quan
            </h2>
            <div className="mt-5 space-y-5">
              <Party
                icon={<UserRound size={17} />}
                title="Nguyễn Minh Anh"
                detail="Khách đặt phòng · 0912 345 678"
              />
              <Party
                icon={<FileText size={17} />}
                title="An Nhiên Riverside Hotel"
                detail="Host · Đà Lạt"
              />
              <Party
                icon={<ShieldCheck size={17} />}
                title="VNPay Gateway"
                detail="Production Live · Response 97"
              />
            </div>
          </Card>
          <Card className="rounded-2xl border-0 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Quyết định đối soát nhanh</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Chi tiết căn cứ và kết quả nằm ở khu vực quyết định phía dưới.
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${resolved ? 'bg-success-soft text-success' : 'bg-danger-soft text-destructive'}`}
              >
                {resolved ? 'Đã duyệt' : 'Chờ duyệt'}
              </span>
            </div>
            <Button
              className="mt-4 w-full bg-primary text-primary-foreground hover:bg-(--sr-primary-hover)"
              onClick={() =>
                document
                  .getElementById('reconciliation-decision')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
            >
              <ShieldCheck size={16} />
              Mở khu vực phê duyệt
            </Button>
          </Card>
        </aside>
      </div>
      <Card className="rounded-2xl border-0 bg-card p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider">
          Chẩn đoán kỹ thuật hệ thống (AI &amp; Security Audit Engine)
        </h2>
        <div className="mt-4 rounded-xl bg-muted p-4 text-xs leading-relaxed text-muted-foreground">
          <b className="text-foreground">
            Nguyên nhân cốt lõi phát hiện bởi Security Guard:
          </b>
          <p className="mt-2">
            Khách hàng Nguyễn Minh Anh đã thanh toán thành công qua ứng dụng VCB
            Digibank lúc 15:38:45. Tuy nhiên gói tin IPN Callback bị từ chối
            kiểm tra chữ ký do Key Rotation vừa thực thi vào lúc 09:15:02 cùng
            ngày. <b className="text-success">Tiền đã vào tài khoản công ty</b>,
            hoàn toàn hợp lệ để kích hoạt đơn đặt phòng ngay.
          </p>
        </div>
      </Card>
      <Card
        id="reconciliation-decision"
        className="rounded-2xl border-0 bg-card p-6 shadow-sm"
      >
        <div className="flex gap-2">
          <ShieldCheck className="text-success" />
          <div>
            <h2 className="text-lg font-bold">
              Khu vực Quyết định Đối soát Quản trị viên
            </h2>
            <p className="text-xs text-muted-foreground">
              Quyết định này sẽ ghi nhật ký kiểm toán không thể xóa (Immutable
              Audit Log).
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div>
            <p className="text-xs font-semibold">
              Lý do / Căn cứ can thiệp ghi nhận đối soát{' '}
              <span className="text-destructive">*</span>
            </p>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-2 min-h-28 bg-muted text-xs"
            />
          </div>
          <div className="rounded-xl bg-muted p-4">
            <p className="text-xs font-bold">Kết quả sau khi duyệt:</p>
            <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
              <li>✓ Cập nhật đơn #{tx.bookingCode} sang ĐÃ XÁC NHẬN</li>
              <li>✓ Khóa phòng trên PMS An Nhiên Riverside</li>
              <li>✓ Gửi email Voucher xác nhận cho khách</li>
            </ul>
            <Button
              className="mt-4 w-full bg-primary text-primary-foreground"
              onClick={submit}
            >
              <ShieldCheck size={16} />
              Phê duyệt &amp; Đồng bộ hệ thống
            </Button>
          </div>
        </div>
      </Card>
      <Dialog open={query} onOpenChange={setQuery}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kết quả phản hồi QueryDR VNPay API</DialogTitle>
          </DialogHeader>
          <div className="rounded-xl bg-success-soft p-4 text-sm">
            <p className="font-semibold text-success">
              Cổng thanh toán phản hồi thành công
            </p>
            <p className="mt-2 text-muted-foreground">
              Số tiền xác nhận: {tx.amount}. Dữ liệu này là mock và không ghi
              vào gateway thật.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuery(false)}>
              Đóng
            </Button>
            <Button
              onClick={() => {
                setResolved(true);
                setQuery(false);
                notify('Đã áp dụng kết quả QueryDR vào trạng thái hiển thị.');
              }}
            >
              Áp dụng kết quả
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-muted px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate font-mono text-xs font-semibold text-primary">
        {value}
      </p>
    </div>
  );
}
function DetailMetric({
  label,
  value,
  hint,
  success = false,
}: {
  label: string;
  value: string;
  hint: string;
  success?: boolean;
}) {
  return (
    <Card className="rounded-2xl border-0 bg-card p-5 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-4 text-2xl font-bold ${success ? 'text-success' : 'text-foreground'}`}
      >
        {value}
      </p>
      <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p>
    </Card>
  );
}
function Party({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="grid size-8 place-items-center rounded-lg bg-muted text-primary">
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
