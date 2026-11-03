import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors, radius } from '@/constants/theme';
import { checkInDeposit, extraCharges } from '@/features/staff/data';
import { Banner, Card, CardHead, KV, StaffScreen, SuccessSheet, accent, s, success } from '@/features/staff/ui';
import { formatVnd } from '@/lib/stay';

const subtotalExtra = extraCharges.reduce((sum, c) => sum + c.price * c.qty, 0);
const netRefund = checkInDeposit - subtotalExtra;

export default function StaffCheckOutScreen() {
  const [finished, setFinished] = useState(false);

  return (
    <StaffScreen
      title="Check-out & quyết toán"
      right={<Button label="Hồ sơ BK-8839" variant="ghost" size="sm" onPress={() => router.push({ pathname: '/staff/bookings/[id]', params: { id: 'BK-8839' } })} />}
      footer={<Button label="Xử lý check-out & giải phóng phòng" leadingIcon="check_circle" size="lg" style={[s.flex, { backgroundColor: accent }]} onPress={() => setFinished(true)} />}
    >
      <Text variant="caption" color={colors.onSurfaceVariant}>
        Quyết toán Check-out P.602
      </Text>
      <Banner
        icon="schedule"
        tone="blue"
        title="Yêu cầu Check-out Phòng P.602"
        text="Khách Trần Thị B trả phòng lúc 14:00 (Check-out muộn 2 giờ có tính phí). Buồng phòng đã kiểm tra Minibar & tài sản phòng lúc 13:45 — Không có hư hại."
      />

      <Card>
        <CardHead icon="bed" title="Thông tin phòng" right={<Chip label="Đang Check-out" tone="secondary" />} />
        <View style={s.between}>
          <View style={s.flex}>
            <Text variant="h2" color={accent}>
              Phòng P.602
            </Text>
            <Text variant="caption" color={colors.onSurfaceVariant}>
              Executive Suite Ocean View • Tầng 6
            </Text>
          </View>
          <View>
            <Text variant="caption" color={colors.onSurfaceVariant}>
              Khách hàng
            </Text>
            <Text variant="label" weight="bold">
              Trần Thị B
            </Text>
          </View>
        </View>
        <View style={s.box}>
          <KV label="Ngày Check-in" value="12/10/2026 14:00" />
          <KV label="Ngày Check-out" value="14/10/2026 14:00" />
          <KV label="Số lượng thẻ đã thu" value="2 / 2 Thẻ từ" strong color={success} />
        </View>
      </Card>

      <Card>
        <CardHead icon="verified_user" title="Báo cáo nghiệm thu phòng" right={<Chip label="Đã duyệt" tone="tertiary" />} />
        <View style={[s.box, styles.green]}>
          <KV label="Nhân viên kiểm tra" value="Lê Thị Mai (Housekeeping)" />
          <KV label="Tình trạng nội thất" value="Hoàn hảo (Không hư hại)" strong color={success} />
          <KV label="Minibar sử dụng" value="1 Chai Evian 500ml" />
        </View>
        <Text variant="caption" color={colors.onSurfaceVariant} style={styles.italic}>
          * Đã ghi nhận các khoản sử dụng phát sinh vào hóa đơn thanh toán bên dưới.
        </Text>
      </Card>

      <Card>
        <View style={s.between}>
          <View style={[s.row, s.flex]}>
            <Icon name="receipt_long" size={18} color={accent} />
            <Text variant="h3">Bảng quyết toán (Folio)</Text>
          </View>
          <Chip label="#INV-P602-8839" />
        </View>
        <Text variant="caption" color={colors.onSurfaceVariant}>
          Chi tiết các khoản phòng, phát sinh và hoàn cọc tiền thế chân
        </Text>

        <Text variant="caption" weight="bold" color={colors.onSurfaceVariant} style={s.upper}>
          1. Tiền phòng cơ bản (Đã thanh toán trước)
        </Text>
        <View style={[s.box, s.between]}>
          <View style={s.flex}>
            <Text variant="small" weight="bold">
              Executive Suite Ocean View (2 đêm)
            </Text>
            <Text variant="caption" color={colors.onSurfaceVariant}>
              12/10/2026 - 14/10/2026 • {formatVnd(2500000)} / đêm
            </Text>
          </View>
          <Text variant="small" weight="bold" color={success}>
            {formatVnd(5000000)} (Đã thu)
          </Text>
        </View>

        <Text variant="caption" weight="bold" color={colors.onSurfaceVariant} style={s.upper}>
          2. Phát sinh trong quá trình lưu trú
        </Text>
        <View style={styles.table}>
          {extraCharges.map((c) => (
            <View key={c.id} style={[s.between, styles.tr]}>
              <View style={s.flex}>
                <Text variant="small" weight="medium">
                  {c.name}
                </Text>
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  SL {c.qty} × {formatVnd(c.price)}
                </Text>
              </View>
              <Text variant="small" weight="semibold">
                {formatVnd(c.price * c.qty)}
              </Text>
            </View>
          ))}
          <View style={[s.between, styles.tr, styles.tfoot]}>
            <Text variant="small" weight="bold">
              Tổng cộng dịch vụ phát sinh
            </Text>
            <Text variant="small" weight="bold" color={accent}>
              {formatVnd(subtotalExtra)}
            </Text>
          </View>
        </View>
      </Card>

      <View style={styles.dark}>
        <View style={s.row}>
          <Icon name="credit_card" size={16} color="#fbbf24" />
          <Text variant="caption" weight="bold" color="#fbbf24" style={s.upper}>
            3. Quyết toán tiền cọc (Deposit Settlement)
          </Text>
        </View>
        <KV label="Tiền cọc tạm thu lúc check-in" value={formatVnd(checkInDeposit)} color="#ffffff" labelColor="#a9b4c2" />
        <KV label="Trừ chi phí phát sinh" value={`- ${formatVnd(subtotalExtra)}`} color="#fbbf24" labelColor="#a9b4c2" />
        <View style={styles.darkLine} />
        <Text variant="caption" color="#cbd5e1">
          Số tiền HOÀN LẠI CHO KHÁCH
        </Text>
        <Text variant="h1" color="#34d399">
          {formatVnd(netRefund)}
        </Text>
        <Button label="Hoàn tiền mặt / VNPay" leadingIcon="refresh" style={{ backgroundColor: '#047857' }} />
      </View>

      <View style={styles.notice}>
        <Text variant="label" weight="bold" color="#6b3d00">
          Chuyển trạng thái phòng P.602
        </Text>
        <Text variant="caption" color="#6b3d00" style={s.lh}>
          Sau khi hoàn tất check-out, phòng P.602 sẽ tự động chuyển sang trạng thái “Cần dọn dẹp (Dirty)” cho bộ phận buồng phòng.
        </Text>
      </View>

      <SuccessSheet
        visible={finished}
        onClose={() => setFinished(false)}
        title="Check-out hoàn tất!"
        text={`Phòng P.602 đã hoàn tất quyết toán. Khách Trần Thị B đã nhận lại ${formatVnd(netRefund)}.`}
        printLabel="In hóa đơn quyết toán"
        rows={
          <>
            <KV label="Mã hóa đơn" value="#INV-P602-8839" strong />
            <KV label="Số phòng trả" value="P.602" strong color={accent} />
            <KV label="Thẻ từ nhận lại" value="2 / 2 Thẻ (Đủ)" strong color={success} />
            <KV label="Trạng thái phòng mới" value="Cần dọn dẹp (Dirty)" strong color="#7a4600" />
          </>
        }
      />
    </StaffScreen>
  );
}

const styles = StyleSheet.create({
  green: { backgroundColor: '#eef8f1' },
  italic: { fontStyle: 'italic' },
  table: { borderWidth: 1, borderColor: colors.surfaceContainerHigh, borderRadius: radius.md, overflow: 'hidden' },
  tr: { paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.surfaceContainerHigh, alignItems: 'flex-start' },
  tfoot: { backgroundColor: colors.surfaceContainerLow },
  dark: { gap: 10, padding: 16, borderRadius: radius.lg, backgroundColor: '#0f172a' },
  darkLine: { height: 1, backgroundColor: '#1e293b' },
  notice: { gap: 4, padding: 14, borderRadius: radius.lg, backgroundColor: '#fff4e0', borderWidth: 1, borderColor: '#f5d9a8' },
});
