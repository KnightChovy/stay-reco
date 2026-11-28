import { useState } from 'react';
import { Pressable, View } from 'react-native';
import type { AddOnTiming, Booking, BookingAddOn, PaymentMethod } from '@stayreco/shared';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { formatDate, formatVnd } from '@/lib/stay';

// Cùng nhãn với frontend/src/features/booking/lib/booking-labels.ts.
const paymentMethodLabel: Record<PaymentMethod, string> = {
  SEPAY: 'Chuyển khoản SePay · VietQR',
  WALLET: 'Ví StayReco',
  VNPAY: 'VNPay',
  CASH: 'Tiền mặt',
  MIXED: 'Kết hợp',
};
export const addOnTimingLabel: Record<AddOnTiming, string> = { BEFORE_STAY: 'Trước khi đến', DURING_STAY: 'Trong kỳ lưu trú', AFTER_STAY: 'Khi trả phòng' };
const eventLabel: Record<string, string> = {
  CREATED: 'Tạo booking',
  PAID: 'Thanh toán thành công',
  EXPIRED: 'Hết hạn giữ chỗ',
  CANCEL_REQUESTED: 'Khách yêu cầu huỷ',
  REFUND_FORWARDED: 'Nhân viên chuyển yêu cầu hoàn tiền',
  REFUND_APPROVED: 'Duyệt hoàn tiền',
  REFUND_REJECTED: 'Từ chối hoàn tiền',
  CANCELLED: 'Đã huỷ',
  CHECKED_IN: 'Nhận phòng',
  COMPLETED: 'Trả phòng',
  NO_SHOW: 'Khách không đến',
  CHANGE_REQUESTED: 'Khách yêu cầu đổi thông tin',
  CHANGE_ACCEPTED: 'Chấp nhận đổi thông tin',
  CHANGE_REJECTED: 'Từ chối đổi thông tin',
  ADD_ON_ADDED: 'Thêm dịch vụ',
  ADD_ON_REMOVED: 'Bỏ dịch vụ',
};
export const bookingEventLabel = (event: string) => eventLabel[event] ?? event;

const dateTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString('vi-VN') : '—');

function Row({ label, value, hint, minus, muted, strong }: { label: string; value: string; hint?: string; minus?: boolean; muted?: boolean; strong?: boolean }) {
  return (
    <View className="flex-row items-start justify-between gap-3">
      <View className="flex-1">
        <Text variant="small" weight={strong ? 'bold' : 'regular'} color={strong ? colors.onSurface : colors.onSurfaceVariant}>
          {label}
        </Text>
        {!!hint && (
          <Text variant="caption" color={colors.onSurfaceVariant}>
            {hint}
          </Text>
        )}
      </View>
      <Text variant="small" weight={strong ? 'bold' : 'semibold'} color={minus ? '#0b5a36' : muted ? colors.onSurfaceVariant : colors.onSurface}>
        {value}
      </Text>
    </View>
  );
}

const AddOnLines = ({ lines }: { lines: BookingAddOn[] }) =>
  lines.map((l) => <Row key={l.id} label={`${l.name} × ${l.quantity}`} hint={`${addOnTimingLabel[l.timing]} · ${formatVnd(l.unitPrice)}/lần`} value={formatVnd(l.amount)} />);

/** Hoá đơn của đơn (`Booking.invoice`), giống BookingInvoice bên web: mọi con số lấy từ backend. */
export function BookingInvoice({ booking }: { booking: Booking }) {
  const [showNights, setShowNights] = useState(false);
  const { invoice } = booking;
  const prepaid = booking.addOns.filter((l) => l.payment === 'PREPAID');
  const atDesk = booking.addOns.filter((l) => l.payment === 'FRONT_DESK');
  const lateFee = booking.lateCheckout?.fee ?? 0;
  const paid = booking.paidAt !== null;
  const divider = <View className="h-px bg-surface-container-high" />;

  return (
    <View className="gap-2.5">
      <View className="gap-2 rounded-md bg-surface-container-low p-3">
        <Row label="Số hoá đơn" value={invoice.number} strong />
        <Row label="Phương thức" value={paymentMethodLabel[invoice.paymentMethod]} />
        <Row label="Thanh toán lúc" value={paid ? dateTime(booking.paidAt) : 'Chưa thanh toán'} />
        <Row label="Đặt lúc" value={dateTime(booking.createdAt)} />
      </View>

      <Row label={`Tiền phòng (${booking.rooms} phòng × ${booking.nights} đêm)`} value={formatVnd(invoice.subtotal - invoice.addOnsTotal)} />
      {booking.nightlyPrices.length > 0 && (
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: showNights }} onPress={() => setShowNights((v) => !v)}>
          <Text variant="caption" weight="semibold" color={colors.primary}>
            {showNights ? 'Ẩn giá từng đêm' : 'Xem giá từng đêm'}
          </Text>
        </Pressable>
      )}
      {showNights && (
        <View className="gap-1 border-l-2 border-surface-container-high pl-3">
          {booking.nightlyPrices.map((n) => (
            <Row key={n.date} label={`Đêm ${formatDate(n.date)} (1 phòng)`} value={formatVnd(n.price)} muted />
          ))}
        </View>
      )}

      {prepaid.length > 0 && (
        <>
          {divider}
          <Text variant="caption" weight="bold" color={colors.onSurfaceVariant}>
            DỊCH VỤ ĐẶT KÈM
          </Text>
          <AddOnLines lines={prepaid} />
        </>
      )}

      {divider}
      <Row label="Tạm tính" value={formatVnd(invoice.subtotal)} />
      {invoice.discount && (
        <Row
          label={invoice.discount.kind === 'VOUCHER' ? 'Voucher' : 'Khuyến mãi'}
          hint={invoice.discount.code ? `${invoice.discount.name} · mã ${invoice.discount.code}` : invoice.discount.name}
          value={`−${formatVnd(invoice.discount.amount)}`}
          minus
        />
      )}
      {invoice.points && <Row label="Điểm StayMiles" hint={`${invoice.points.used.toLocaleString('vi-VN')} điểm`} value={`−${formatVnd(invoice.points.amount)}`} minus />}
      <Row label="Thuế" hint={invoice.tax === 0 ? 'Giá đã bao gồm thuế' : undefined} value={formatVnd(invoice.tax)} muted />

      <View className="flex-row items-center justify-between rounded-md bg-primary-fixed px-3 py-2.5">
        <Text variant="label" weight="bold">
          {paid ? 'Đã thanh toán' : 'Tổng cần thanh toán'}
        </Text>
        <Text variant="label" weight="bold" color={colors.primary}>
          {formatVnd(invoice.total)}
        </Text>
      </View>
      {(invoice.discount || invoice.points) && invoice.addOnsTotal > 0 && (
        <Text variant="caption" color={colors.onSurfaceVariant}>
          Giảm giá và điểm chỉ trừ vào tiền phòng, không trừ vào dịch vụ.
        </Text>
      )}

      {(atDesk.length > 0 || lateFee > 0) && (
        <View className="gap-2 rounded-md bg-[#fff0d9] p-3">
          <Text variant="caption" weight="bold" color="#7a4600">
            THU TẠI QUẦY KHI TRẢ PHÒNG
          </Text>
          <AddOnLines lines={atDesk} />
          {lateFee > 0 && <Row label="Phí trả phòng muộn" hint={booking.lateCheckout ? `Trễ ${booking.lateCheckout.minutesLate} phút` : undefined} value={formatVnd(lateFee)} />}
          <Row label="Tổng thu tại quầy" value={formatVnd(invoice.frontDeskDue + lateFee)} strong />
        </View>
      )}

      {booking.refund && (
        <Row label="Hoàn tiền về ví StayReco" hint={booking.refund.status === 'REFUND_PENDING' ? 'Đang chờ khách sạn duyệt' : undefined} value={formatVnd(booking.refund.amount)} strong />
      )}
    </View>
  );
}
