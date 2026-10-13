'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Download,
  Gavel,
  Lock,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NativeSelect } from '@/components/ui/native-select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const permissions = [
  [
    'Quản lý phòng & Giá linh hoạt',
    'Cho phép cập nhật bảng giá mùa vụ và đóng/mở tồn kho',
  ],
  [
    'Tạo mã ưu đãi & Flash Sale',
    'Phát hành voucher độc quyền hiển thị trên công cụ tìm kiếm',
  ],
  [
    'Cấu hình thương hiệu AI (P13)',
    'Huấn luyện trợ lý tư vấn theo gu hiếu khách của khách sạn',
  ],
  [
    'Xem báo cáo doanh thu chi tiết',
    'Truy cập sao kê ngân hàng đối soát và xuất file VAT',
  ],
];
const audits = [
  [
    'Đơn phương thao tác hủy 5 lượt đặt phòng cận ngày',
    'Hôm nay, 14:15:32',
    'Thao tác qua Partner Web Panel. Mã giao dịch liên đới: #SR-261020-0831, #SR-261020-0835, #SR-261020-0836, #SR-261020-0837, #SR-261020-0839.',
  ],
  [
    'Cập nhật thông tin phòng & Bảng giá Lễ Quốc Khánh',
    '24/10/2026, 09:22:18',
    'Điều chỉnh giá hạng phòng Deluxe River View từ 1.450.000 ₫ lên 2.200.000 ₫/đêm cho giai đoạn cao điểm.',
  ],
  [
    'Gửi hồ sơ đối soát doanh thu kỳ II',
    '18/10/2026, 17:40:02',
    'Nộp bảng kê 142 lượt check-out hoàn tất, đề nghị thanh toán qua tài khoản Vietcombank đã định danh.',
  ],
  [
    'Đổi mật khẩu tài khoản & Cập nhật bảo mật 2 lớp (2FA)',
    '05/10/2026, 11:05:44',
    'Xác thực thành công mã OTP gửi về số điện thoại chính thức 0983 *** 104.',
  ],
];

export function UserDetail({
  notify,
}: {
  id?: string;
  notify: (message: string) => void;
}) {
  const [rationale, setRationale] = useState('');
  const [confirm, setConfirm] = useState<string | null>(null);
  const [access, setAccess] = useState([true, true, true, true]);
  const decide = (action: string) => {
    if (rationale.trim().length < 20) {
      notify('Vui lòng nhập giải trình tối thiểu 20 ký tự.');
      return;
    }
    setConfirm(action);
  };
  return (
    <div className="space-y-6 pt-4">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách tài khoản
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">
              Võ Hoàng Long{' '}
              <span className="ml-1 rounded-full bg-muted px-2 py-0.5 font-mono text-xs font-medium text-muted-foreground">
                USR-PTR-0042
              </span>
            </h1>
            <span className="rounded-full bg-accent px-2.5 py-1 text-xs text-accent-foreground">
              Đối tác Khách sạn (Partner)
            </span>
            <span className="rounded-full bg-success-soft px-2.5 py-1 text-xs text-success">
              Đã xác minh KYC & GPKD
            </span>
            <span className="rounded-full bg-warning-soft px-2.5 py-1 text-xs text-warning">
              Cần xem xét tuân thủ
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button variant="outline" onClick={() => decide('Khóa tạm thời')}>
            <Lock size={16} />
            Khóa tạm thời
          </Button>
          <Button
            className="bg-brand-accent text-white hover:bg-(--sr-accent)/90"
            onClick={() => decide('Đình chỉ đối tác')}
          >
            <Gavel size={16} />
            Đình chỉ đối tác
          </Button>
          <Button
            className="bg-[#013758] text-white"
            onClick={() => notify('Đã lưu thay đổi phân quyền mock.')}
          >
            <Save size={16} />
            Lưu thay đổi phân quyền
          </Button>
        </div>
      </header>
      <Card className="overflow-hidden rounded-2xl border-0 bg-white p-6 shadow-sm">
        <div className="border-l-4 border-[#934a33] pl-4">
          <div className="flex flex-col justify-between gap-4 lg:flex-row">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#934a33]">
                Hồ sơ đề nghị xử lý từ Platform Manager{' '}
                <span className="ml-2 rounded bg-[#eceef4] px-2 font-mono text-[#42474e]">
                  #CASE-CP-2026-089
                </span>
              </p>
              <p className="mt-2 text-sm font-medium">
                Đối tác đơn phương hủy 5 booking cận ngày cao điểm tại{' '}
                <strong className="text-[#013758]">
                  An Nhiên Riverside Hotel
                </strong>{' '}
                mà không tiến hành thu xếp phòng thay thế hoặc bồi hoàn cho
                khách theo cam kết StayReco Protect™.
              </p>
              <p className="mt-2 text-xs text-[#42474e]">
                Khiếu nại kiểm chứng: #SR-261020-0831 và #SR-261020-0835 •{' '}
                <strong className="text-[#934a33]">
                  Mức tổn thất uy tín bảo chứng: 14.800.000 ₫
                </strong>
              </p>
            </div>
            <span className="h-fit rounded-lg bg-[#eceef4] px-3 py-1.5 font-mono text-xs font-bold text-[#934a33]">
              19 giờ : 42 phút còn lại
            </span>
          </div>
        </div>
        <div className="mt-6 -mx-6 -mb-6 bg-[#f1f3f9] p-6">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-wider">
                Quyết định xử lý từ Quản trị viên
              </p>
              <Textarea
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                className="mt-3 min-h-20 bg-white"
                placeholder="Nhập lý do phân tích hoặc chỉ thị điều tra bổ sung (Bắt buộc lưu vết Audit Log cho ban Điều hành)..."
              />
              <div className="mt-1 flex justify-between text-[11px] text-[#42474e]">
                <span>Biên bản tự động gắn định danh Quản trị viên.</span>
                <span>Tối thiểu 20 ký tự</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 lg:w-72">
              <Button
                className="bg-[#934a33] text-white"
                onClick={() => decide('Đình chỉ 30 ngày')}
              >
                Đình chỉ 30 ngày
              </Button>
              <Button
                variant="outline"
                onClick={() => decide('Cảnh cáo & Giải trình')}
              >
                Cảnh cáo & Giải trình
              </Button>
              <Button
                variant="ghost"
                onClick={() => decide('Bác bỏ đề nghị kỷ luật')}
              >
                Bác bỏ đề nghị kỷ luật
              </Button>
            </div>
          </div>
        </div>
      </Card>
      <Card className="rounded-2xl border-0 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-6 lg:flex-row">
          <div className="flex gap-5">
            <div className="grid size-20 place-items-center rounded-2xl bg-[#eaf0f5] text-2xl font-bold text-[#013758]">
              VL
            </div>
            <div>
              <h2 className="text-xl font-bold">
                Võ Hoàng Long{' '}
                <span className="text-xs font-medium text-[#42474e]">
                  | Chủ sở hữu & Đại diện ký kết
                </span>
              </h2>
              <p className="mt-2 text-xs text-[#42474e]">
                long.vo@annhienhotel.vn · 0983 992 104 · CCCD:{' '}
                <strong className="font-mono text-[#181c20]">
                  048089004211
                </strong>
              </p>
              <p className="mt-2 text-[11px] text-[#42474e]">
                Ngày khởi tạo: 12/03/2024 • Hoạt động cuối:{' '}
                <strong className="text-[#0b3c27]">
                  15 phút trước (Web Portal)
                </strong>{' '}
                • Mã thuế doanh nghiệp: 0401928374-001
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 rounded-xl bg-[#f1f3f9] p-3 text-center text-xs">
            <span>
              Hồ sơ pháp lý{' '}
              <strong className="mt-1 block text-[#0b3c27]">Đầy đủ 100%</strong>
            </span>
            <span>
              Mức bảo chứng{' '}
              <strong className="mt-1 block text-[#013758]">
                50.000.000 ₫
              </strong>
            </span>
            <span>
              Tình trạng ví{' '}
              <strong className="mt-1 block text-[#013758]">Sẵn sàng</strong>
            </span>
          </div>
        </div>
        <div className="mt-6 grid gap-6 rounded-xl bg-[#f1f3f9]/70 p-5 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-xs font-semibold uppercase text-[#013758]">
              Cơ sở lưu trú liên kết
            </p>
            <h3 className="mt-1 font-bold">An Nhiên Riverside Hotel</h3>
            <p className="text-xs text-[#42474e]">
              142 Bạch Đằng, Hải Châu, Đà Nẵng
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:col-span-8 sm:grid-cols-4">
            {[
              ['Quy mô phòng', '36 phòng nghỉ', '4 sao Boutique'],
              ['Trạng thái bán', 'Đang mở bán', 'Kênh trực tuyến'],
              ['Điểm hài lòng', '4.82 / 5.0', '520 đánh giá thực'],
              ['Hợp đồng đối tác', 'HD-2024-VN089', 'Hiệu lực đến 2027'],
            ].map(([a, b, c]) => (
              <div key={a} className="rounded-lg bg-white p-3 text-xs">
                <p className="text-[#42474e]">{a}</p>
                <strong className="mt-1 block">{b}</strong>
                <p className="mt-1 text-[10px] text-[#72777e]">{c}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold uppercase tracking-wider">
              Phân quyền hệ thống & Quyền tác vụ tài khoản
            </h3>
            <span className="text-xs text-[#42474e]">
              Thay đổi sẽ áp dụng ngay sau khi lưu
            </span>
          </div>
          <div className="mt-4 grid gap-6 md:grid-cols-3">
            <div>
              <p className="mb-2 text-xs font-semibold">
                Vai trò chính của tài khoản (Role)
              </p>
              <NativeSelect className="w-full">
                <option>Đối tác Khách sạn (Partner - Quyền đầy đủ)</option>
                <option>Đối tác Khách sạn (Hạn chế tài chính)</option>
                <option>Chỉ xem dữ liệu (Read-only)</option>
              </NativeSelect>
            </div>
            <div className="grid gap-3 md:col-span-2 sm:grid-cols-2">
              {permissions.map(([name, detail], i) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-xl bg-[#f1f3f9] p-3.5"
                >
                  <div>
                    <strong className="text-xs">{name}</strong>
                    <p className="mt-1 text-[11px] text-[#42474e]">{detail}</p>
                  </div>
                  <Switch
                    checked={access[i]}
                    onCheckedChange={(value) =>
                      setAccess(
                        access.map((item, index) =>
                          index === i ? value : item,
                        ),
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
      <section className="grid gap-6 md:grid-cols-3">
        {[
          ['Lượt booking thành công', '1.420', 'Trung bình: 118 lượt/tháng'],
          ['Tỷ lệ hủy phòng chủ động', '1.8%', 'Ngưỡng chuẩn hệ thống: < 1.2%'],
          [
            'Tổng doanh thu qua StayReco',
            '3.85 tỷ ₫',
            'Hoa hồng nền tảng: 385.000.000 ₫',
          ],
        ].map(([label, value, note]) => (
          <Card
            key={label}
            className="rounded-2xl border-0 bg-white p-6 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-[#42474e]">
              {label}
            </p>
            <strong className="mt-2 block text-3xl">{value}</strong>
            <p className="mt-5 text-xs text-[#42474e]">{note}</p>
          </Card>
        ))}
      </section>
      <section className="grid gap-6 lg:grid-cols-12">
        <Card className="rounded-2xl border-0 bg-white p-6 shadow-sm lg:col-span-8">
          <div className="flex justify-between">
            <h3 className="font-bold uppercase tracking-wider">
              Nhật ký tác vụ & Bảo mật gần nhất (Audit Trail)
            </h3>
            <Button
              variant="ghost"
              onClick={() => notify('Đã chuẩn bị dữ liệu log mock.')}
            >
              <Download size={16} />
              Xuất dữ liệu log
            </Button>
          </div>
          <div className="mt-5 space-y-4">
            {audits.map(([title, time, detail], i) => (
              <article key={title} className="border-l-2 border-[#eceef4] pl-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <strong
                    className={`text-xs ${i === 0 ? 'text-[#934a33]' : ''}`}
                  >
                    {title}
                  </strong>
                  <span className="font-mono text-[11px] text-[#42474e]">
                    {time}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#42474e]">{detail}</p>
                <p className="mt-2 font-mono text-[11px] text-[#72777e]">
                  IP: 118.69.192.83 (Đà Nẵng) • Phiên hợp lệ
                </p>
              </article>
            ))}
          </div>
        </Card>
        <div className="space-y-6 lg:col-span-4">
          <Card className="rounded-2xl border-0 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 font-bold uppercase tracking-wider">
              <ShieldCheck size={18} className="text-[#013758]" />
              Hồ sơ pháp lý đã duyệt
            </h3>
            {[
              'Giấy phép ĐKKD khách sạn',
              'CCCD gắn chip (2 mặt)',
              'Biên bản thẩm duyệt PCCC',
            ].map((item) => (
              <div
                key={item}
                className="mt-3 rounded-xl bg-[#f1f3f9] p-3 text-xs"
              >
                <strong>{item}</strong>
                <p className="mt-1 text-[#42474e]">
                  PDF • Đã đối chiếu và xác minh
                </p>
              </div>
            ))}
          </Card>
          <Card className="rounded-2xl border-0 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 font-bold uppercase tracking-wider">
              <Building2 size={18} className="text-[#013758]" />
              Tài khoản thụ hưởng doanh thu
            </h3>
            <div className="mt-4 rounded-xl bg-[#f1f3f9] p-4">
              <strong className="text-xs text-[#013758]">
                VIETCOMBANK (VCB)
              </strong>
              <p className="mt-3 font-mono text-base font-bold">
                0041 0002 9381 2
              </p>
              <p className="text-xs">VO HOANG LONG</p>
              <p className="mt-3 border-t pt-2 text-[11px] text-[#42474e]">
                Chi nhánh: Hải Châu - Đà Nẵng • Đã liên kết
              </p>
            </div>
          </Card>
        </div>
      </section>
      <Dialog open={Boolean(confirm)} onOpenChange={() => setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận {confirm}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#42474e]">
            Quyết định sẽ được ghi vào Audit Log mock cùng phần giải trình của
            Quản trị viên.
          </p>
          <Button
            className="bg-[#013758] text-white"
            onClick={() => {
              notify(`Đã ${confirm} tài khoản trong dữ liệu mock.`);
              setConfirm(null);
            }}
          >
            Xác nhận quyết định
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
