import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors, radius } from '@/constants/theme';
import { checkInDeposit, checkInRooms } from '@/features/staff/data';
import { Avatar, Banner, Card, CardHead, KV, StaffScreen, SuccessSheet, accent, s, success } from '@/features/staff/ui';
import { formatVnd } from '@/lib/stay';

function Stepper({ value, onChange, min = 1 }: { value: number; onChange: (n: number) => void; min?: number }) {
  return (
    <View style={s.row}>
      <Pressable accessibilityLabel="Giảm số thẻ từ" onPress={() => onChange(Math.max(min, value - 1))} style={styles.step}>
        <Icon name="remove" size={18} color={colors.onSurface} />
      </Pressable>
      <Text variant="label" weight="bold" style={styles.stepValue} accessibilityLabel={`${value} thẻ từ`}>
        {value}
      </Text>
      <Pressable accessibilityLabel="Tăng số thẻ từ" onPress={() => onChange(value + 1)} style={styles.step}>
        <Icon name="add" size={18} color={colors.onSurface} />
      </Pressable>
    </View>
  );
}

const checklist = (room: string, cards: number) => [
  'Xác minh chính chủ qua CCCD/Passport',
  `Thu tiền thế chân deposit ${formatVnd(checkInDeposit)}`,
  `Ghi đĩa/mã hóa ${cards} thẻ từ phòng ${room}`,
  'In & hướng dẫn phiếu nhận phòng',
];

export default function StaffCheckInScreen() {
  const [selectedRoom, setSelectedRoom] = useState('P.608');
  const [scanned, setScanned] = useState(true);
  const [cards, setCards] = useState(2);
  const [done, setDone] = useState<Record<number, boolean>>({ 0: true, 1: true, 2: true, 3: true });
  const [finished, setFinished] = useState(false);

  return (
    <StaffScreen
      title="Check-in & gán phòng"
      right={<Button label="Chi tiết đơn" variant="ghost" size="sm" onPress={() => router.push({ pathname: '/staff/bookings/[id]', params: { id: 'BK-8842' } })} />}
      footer={<Button label="Hoàn tất & in thẻ phòng" leadingIcon="check_circle" size="lg" style={[s.flex, { backgroundColor: accent }]} onPress={() => setFinished(true)} />}
    >
      <Text variant="caption" color={colors.onSurfaceVariant}>
        Quy trình Check-in #BK-8842
      </Text>
      <Banner
        icon="auto_awesome"
        tone="amber"
        title="Gợi ý AI gán phòng tối ưu"
        text="Khách hàng Nguyễn Văn An yêu cầu tầng cao, hướng biển quiet zone. AI đề xuất phòng P.608 (đã dọn dẹp sạch 100%, cách ly tiếng ồn tốt nhất phân khu tầng 6)."
      />

      <Card>
        <CardHead icon="person" title="Thông tin khách hàng" right={<Chip label="Đã thanh toán 100%" tone="tertiary" />} />
        <View style={s.row}>
          <Avatar text="NV" size={48} bg={colors.secondaryFixed} fg={accent} />
          <View style={s.flex}>
            <Text variant="label" weight="bold">
              Nguyễn Văn An
            </Text>
            <Text variant="caption" color={colors.onSurfaceVariant}>
              SĐT: 0912 *** 890 • VIP Silver
            </Text>
            <Text variant="caption" weight="semibold" color={accent}>
              Mã đơn: #BK-8842
            </Text>
          </View>
        </View>
        <View style={s.box}>
          <KV label="Loại phòng mua" value="Deluxe Ocean King" strong />
          <KV label="Thời gian lưu trú" value="2 đêm (14/10 - 16/10)" />
          <KV label="Số lượng khách" value="2 Người lớn, 1 Trẻ em" />
          <KV label="Gói ăn sáng" value="Đã bao gồm" color={success} strong />
        </View>
      </Card>

      <Card>
        <CardHead icon="badge" title="Quét & xác thực định danh (eKYC)" right={scanned ? <Chip label="CCCD chip hợp lệ" tone="primary" /> : undefined} />
        {scanned ? (
          <>
            <View style={[s.box, styles.idBox]}>
              <KV label="Số CCCD" value="001092008891" strong />
              <KV label="Họ và tên" value="NGUYỄN VĂN AN" strong />
              <KV label="Ngày sinh" value="15/08/1988" />
              <KV label="Thường trú" value="Q. Cầu Giấy, Hà Nội" />
            </View>
            <Button label="Quét lại giấy tờ khác" leadingIcon="qr_code_scanner" variant="secondary" onPress={() => setScanned(false)} />
          </>
        ) : (
          // shortcut: giống web, chạm là coi như đã đọc xong giấy tờ; cần SDK eKYC/NFC để đọc thật.
          <Pressable accessibilityRole="button" onPress={() => setScanned(true)} style={styles.scanBox}>
            <Icon name="badge" size={30} color={accent} />
            <Text variant="small" weight="semibold" center>
              Đặt CCCD/Passport lên đầu đọc NFC / Đặt máy quét
            </Text>
            <Text variant="caption" color={colors.onSurfaceVariant} center>
              Hoặc chạm vào đây để tải ảnh chụp 2 mặt CCCD
            </Text>
          </Pressable>
        )}
      </Card>

      <Card>
        <CardHead icon="credit_card" title="Đặt cọc & phát hành thẻ từ" />
        <View style={[s.box, s.between]}>
          <View style={s.flex}>
            <Text variant="small" weight="semibold">
              Tiền thế chân (Deposit)
            </Text>
            <Text variant="caption" color={colors.onSurfaceVariant}>
              Hoàn lại 100% khi check-out
            </Text>
          </View>
          <Text variant="label" weight="bold">
            {formatVnd(checkInDeposit)}
          </Text>
        </View>
        <KV label="Trạng thái đặt cọc" value={<Chip label="Đã thu tiền mặt / Thẻ" tone="tertiary" />} />
        <View style={s.divider} />
        <View style={s.between}>
          <View style={s.row}>
            <Icon name="key" size={16} color="#b45309" />
            <Text variant="small" weight="medium">
              Số lượng thẻ từ
            </Text>
          </View>
          <Stepper value={cards} onChange={setCards} />
        </View>
      </Card>

      <Card>
        <View>
          <View style={s.row}>
            <Icon name="apartment" size={18} color={accent} />
            <Text variant="h3">Sơ đồ gán phòng khả dụng</Text>
          </View>
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Chọn phòng trống thuộc hạng Deluxe Ocean King
          </Text>
        </View>
        <View style={s.wrap}>
          <Chip label={`${checkInRooms.filter((r) => r.ready).length} phòng trống đã dọn`} tone="tertiary" />
          <Chip label={`${checkInRooms.filter((r) => !r.ready).length} phòng đang nghiệm thu`} tone="primary" />
        </View>
        {checkInRooms.map((r) => {
          const on = r.id === selectedRoom;
          return (
            <Pressable
              key={r.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`Phòng ${r.id}, ${r.floor}, ${r.status}`}
              onPress={() => setSelectedRoom(r.id)}
              style={[styles.room, on && styles.roomOn]}
            >
              <View style={s.between}>
                <View style={[s.row, s.baseline]}>
                  <Text variant="h3" weight="bold">
                    {r.id}
                  </Text>
                  <Text variant="caption" weight="semibold" color={colors.onSurfaceVariant}>
                    ({r.floor})
                  </Text>
                </View>
                {r.score && <Chip label={`AI đề xuất (${r.score})`} icon="auto_awesome" tone="warning" />}
              </View>
              <Text variant="caption" weight="medium" color={colors.onSurfaceVariant}>
                {r.type}
              </Text>
              <View style={s.row}>
                <View style={[styles.dot, { backgroundColor: r.ready ? '#2e7d55' : colors.primaryContainer }]} />
                <Text variant="caption">{r.status}</Text>
              </View>
              <View style={[s.between, styles.roomFoot]}>
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  Giường King • Hướng biển
                </Text>
                <Text variant="caption" weight="bold" color={on ? accent : colors.outline}>
                  {on ? '✓ Đang chọn' : 'Bấm để chọn'}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </Card>

      <Card>
        <CardHead icon="checklist" title="Quy trình kiểm tra check-in chuẩn" />
        {checklist(selectedRoom, cards).map((label, i) => (
          <Pressable
            key={i}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: !!done[i] }}
            onPress={() => setDone((d) => ({ ...d, [i]: !d[i] }))}
            style={styles.check}
          >
            <Icon name={done[i] ? 'check_box' : 'check_box_outline_blank'} color={done[i] ? accent : colors.outline} />
            <Text variant="small" style={s.flex}>
              {label}
            </Text>
          </Pressable>
        ))}
      </Card>

      <View style={styles.confirm}>
        <Text variant="label" weight="bold" color={accent}>
          Xác nhận hoàn tất Check-in
        </Text>
        <Text variant="caption" color="#3a2118" style={s.lh}>
          Gán thành công phòng {selectedRoom} cho khách Nguyễn Văn An. Mã thẻ từ: CARD-{selectedRoom}-01/{String(cards).padStart(2, '0')}.
        </Text>
      </View>

      <SuccessSheet
        visible={finished}
        onClose={() => setFinished(false)}
        title="Check-in thành công!"
        text={`Phòng ${selectedRoom} đã chính thức kích hoạt cho khách Nguyễn Văn An.`}
        printLabel="In Welcome Voucher"
        rows={
          <>
            <KV label="Mã đặt phòng" value="#BK-8842" strong />
            <KV label="Số phòng gán" value={selectedRoom} strong color={accent} />
            <KV label="Thẻ từ đã ghi" value={`${cards} thẻ từ`} />
            <KV label="Tiền cọc nhận" value={formatVnd(checkInDeposit)} strong color={success} />
          </>
        }
      />
    </StaffScreen>
  );
}

const styles = StyleSheet.create({
  step: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  stepValue: { minWidth: 20, textAlign: 'center' },
  idBox: { backgroundColor: '#eef5fc' },
  scanBox: {
    alignItems: 'center',
    gap: 6,
    padding: 20,
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLow,
  },
  room: { gap: 6, padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.surfaceContainerHigh },
  roomOn: { borderWidth: 2, borderColor: accent, backgroundColor: '#fbf3f0' },
  roomFoot: { paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.surfaceContainerHigh },
  dot: { width: 8, height: 8, borderRadius: 4 },
  check: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40 },
  confirm: { gap: 4, padding: 14, borderRadius: radius.lg, backgroundColor: '#fbf3f0', borderWidth: 1, borderColor: '#f1d5cb' },
});
