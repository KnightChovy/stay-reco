'use client';

import { BadgeCheck, Building2, CalendarDays, CircleDollarSign, ClipboardCheck, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type OperationKind = 'booking' | 'finance' | 'verification' | 'operation';

function getKind(action: string): OperationKind {
  const query = action.toLocaleLowerCase();
  if (query.includes('booking') || query.includes('check-in') || query.includes('đặt phòng')) return 'booking';
  if (query.includes('rút') || query.includes('đối soát') || query.includes('doanh thu') || query.includes('giao dịch')) return 'finance';
  if (query.includes('xác minh') || query.includes('hồ sơ') || query.includes('thẩm định')) return 'verification';
  return 'operation';
}

const operationCopy = {
  booking: {
    icon: CalendarDays,
    label: 'Điều phối lưu trú',
    reference: 'BOOKING-DIRECT',
    description: 'Kiểm tra khả dụng, thông tin khách và điều kiện giữ phòng trước khi xác nhận.',
    confirm: 'Tạo booking và giữ phòng',
  },
  finance: {
    icon: CircleDollarSign,
    label: 'Kiểm soát dòng tiền',
    reference: 'FINANCE-CONTROL',
    description: 'Yêu cầu sẽ được đối chiếu với dữ liệu booking, phí nền tảng và tài khoản thụ hưởng.',
    confirm: 'Gửi yêu cầu xử lý',
  },
  verification: {
    icon: ShieldCheck,
    label: 'Tuân thủ & xác minh',
    reference: 'COMPLIANCE-REVIEW',
    description: 'Hồ sơ chỉ được chuyển bước khi dữ liệu, tài liệu và người chịu trách nhiệm đã được kiểm tra.',
    confirm: 'Xác nhận và ghi nhật ký',
  },
  operation: {
    icon: ClipboardCheck,
    label: 'Tác vụ vận hành',
    reference: 'OPS-AUDIT',
    description: 'Quyết định được lưu cùng người thực hiện, thời gian và ghi chú để phục vụ truy vết.',
    confirm: 'Xác nhận thao tác',
  },
} as const;

export function OperationDialog({
  action,
  scope = 'An Nhiên Riverside Hotel',
  onClose,
  onComplete,
}: {
  action: string;
  scope?: string;
  onClose: () => void;
  onComplete: () => void;
}) {
  const kind = getKind(action);
  const content = operationCopy[kind];
  const Icon = content.icon;

  return (
    <Dialog open={Boolean(action)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl" showCloseButton={false}>
        <DialogHeader className="border-b bg-muted/45 px-6 py-5">
          <div className="flex items-start gap-3 pr-8">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Icon size={19} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-primary">{content.label}</span>
                <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-border">{content.reference}</span>
              </div>
              <DialogTitle className="mt-1 text-lg font-bold text-primary">{action}</DialogTitle>
              <DialogDescription className="mt-1.5 max-w-xl text-xs leading-5">{content.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-5 px-6 py-5">
          <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Building2 size={16} className="text-primary" />
              <span className="text-muted-foreground">Phạm vi áp dụng</span>
              <strong className="text-primary">{scope}</strong>
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-success"><BadgeCheck size={14} />Đủ quyền thao tác</span>
          </div>

          {kind === 'booking' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Khách lưu trú" placeholder="Họ tên theo giấy tờ" />
              <Field label="Số điện thoại" placeholder="Ví dụ: 0905 888 999" />
              <Field label="Ngày nhận phòng" type="date" />
              <Field label="Ngày trả phòng" type="date" />
              <Field label="Hạng phòng" placeholder="Deluxe River View" />
              <Field label="Số khách" placeholder="02 người lớn · 01 trẻ em" />
            </div>
          )}

          {kind === 'finance' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Số tiền đề nghị" placeholder="0 ₫" />
              <Field label="Kỳ đối soát / mã giao dịch" placeholder="Ví dụ: SET-2026-10-03" />
              <Field label="Tài khoản thụ hưởng" placeholder="Ngân hàng · số tài khoản" />
              <Field label="Người thụ hưởng" placeholder="Theo hồ sơ đã xác minh" />
            </div>
          )}

          {kind === 'verification' && (
            <div className="space-y-2 rounded-xl bg-muted/70 p-4 text-sm">
              {['Đã đối chiếu thông tin pháp nhân với hồ sơ đăng ký.', 'Đã kiểm tra hiệu lực tài liệu và người chịu trách nhiệm.', 'Tôi hiểu yêu cầu có thể được kiểm tra lại sau khi gửi.'].map((item) => (
                <label key={item} className="flex cursor-pointer items-start gap-3 py-1.5">
                  <input type="checkbox" className="mt-0.5 size-4 accent-primary" />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          )}

          {kind === 'operation' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Đối tượng xử lý" placeholder="Đối tác, hồ sơ hoặc mã giao dịch" />
              <Field label="Người phụ trách" placeholder="Tự động ghi nhận tài khoản hiện tại" />
            </div>
          )}

          <label className="grid gap-1.5 text-xs font-semibold text-foreground">
            Ghi chú vận hành
            <Textarea className="min-h-20 bg-background text-sm shadow-none" placeholder="Nêu căn cứ, yêu cầu đặc biệt hoặc thông tin cần bàn giao..." />
          </label>
        </div>

        <DialogFooter className="mx-0 mb-0 rounded-none px-6 py-4">
          <DialogClose render={<Button variant="outline" />}>Hủy</DialogClose>
          <Button onClick={onComplete}>{content.confirm}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, type = 'text', placeholder }: { label: string; type?: string; placeholder?: string }) {
  return <label className="grid gap-1.5 text-xs font-semibold text-foreground">{label}<Input type={type} placeholder={placeholder} className="h-9 bg-background text-sm shadow-none" /></label>;
}
