import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors, radius } from '@/constants/theme';
import { bookings, checkInGuests, dashboardStats as st, departments, roomStatus, shift, urgentTasks } from '@/features/staff/data';
import { Avatar, Card, Grid, KV, Section, Segmented, Stat, StaffTabScreen, accent, s } from '@/features/staff/ui';

const quick: { icon: IconName; label: string; go: () => void }[] = [
  { icon: 'qr_code_scanner', label: 'Quét QR Voucher', go: () => router.push('/staff/check-in') },
  { icon: 'search', label: 'Tìm nhanh đặt phòng', go: () => router.navigate('/staff/bookings') },
  { icon: 'person_add', label: 'Tạo đặt phòng tại quầy', go: () => router.push('/staff/check-in') },
];

const totalRooms = roomStatus.reduce((sum, r) => sum + r.count, 0);
const departures = bookings.filter((b) => b.action === 'checkout' || b.action === 'service');

export default function StaffDashboardScreen() {
  const [tab, setTab] = useState<'checkin' | 'checkout'>('checkin');

  return (
    <StaffTabScreen>
      <View style={s.between}>
        <View style={s.flex}>
          <Text variant="caption" weight="semibold" color={colors.tertiaryContainer}>
            {shift.label}
          </Text>
          <Text variant="h1">Tổng quan ca làm</Text>
        </View>
        <Chip label={shift.handover} tone="secondary" />
      </View>

      <View style={styles.quickRow}>
        {quick.map((q) => (
          <Pressable key={q.label} accessibilityRole="button" onPress={q.go} style={styles.quick}>
            <View style={styles.quickIcon}>
              <Icon name={q.icon} color={colors.primary} />
            </View>
            <Text variant="caption" weight="semibold" center>
              {q.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Grid>
        <Stat icon="key" label="Khách nhận phòng" value={`${st.checkIn.total}`} unit="lượt dự kiến" foot={`Đã nhận: ${st.checkIn.done} · Chờ nhận: ${st.checkIn.waiting}`} />
        <Stat icon="logout" label="Khách trả phòng" value={`${st.checkOut.total}`} unit="lượt trong ngày" foot={`Đã xong: ${st.checkOut.done} · Đang đợi: ${st.checkOut.waiting}`} tint={accent} />
        <Stat icon="bed" label="Công suất phòng" value={`${st.occupancy.percent}%`} unit={`${st.occupancy.used}/${st.occupancy.total} phòng`} foot={`Còn trống: ${st.occupancy.cleanFree} phòng sạch`} tint="#2e7d55" />
        <Stat icon="auto_awesome" label="Tin nhắn & AI duyệt" value={`${st.messages.total}`} unit="mục cần phản hồi" foot={st.messages.note} tint={colors.primaryContainer} />
      </Grid>

      <Section title="Cần xử lý ngay" />
      <Card style={styles.list}>
        {urgentTasks.map((t, i) => (
          <Pressable
            key={t.title}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/staff/bookings/[id]', params: { id: t.id } })}
            style={[styles.task, i > 0 && styles.topLine]}
          >
            <View style={styles.taskIcon}>
              <Icon name={t.icon} size={18} color={colors.primary} />
            </View>
            <View style={s.flex}>
              <Text variant="small" weight="semibold">
                {t.title}
              </Text>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                {t.sub}
              </Text>
              <Chip label={t.tag} tone={t.tone} style={styles.tag} />
            </View>
          </Pressable>
        ))}
      </Card>

      <View style={s.row}>
        <Icon name="refresh" size={14} color={colors.onSurfaceVariant} />
        <Text variant="caption" color={colors.onSurfaceVariant}>
          Tự động cập nhật thời gian thực từ PMS
        </Text>
      </View>
      <Segmented
        items={[
          { key: 'checkin', label: `Nhận phòng (${st.checkIn.total})` },
          { key: 'checkout', label: `Trả phòng (${st.checkOut.total})` },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'checkin'
        ? checkInGuests.map((g) => (
            <Card key={g.id}>
              <View style={s.row}>
                <Avatar text={g.initials} />
                <View style={s.flex}>
                  <Text variant="label" weight="bold">
                    {g.name}
                  </Text>
                  <Text variant="caption" color={colors.onSurfaceVariant}>
                    {g.id} · {g.tier}
                  </Text>
                </View>
                <View>
                  <Text variant="label" weight="bold">
                    {g.arrivalTime}
                  </Text>
                  <Text variant="caption" color={colors.onSurfaceVariant}>
                    Giờ đến
                  </Text>
                </View>
              </View>
              <KV label="Hạng phòng & Gói" value={`${g.roomType} · ${g.pkg}`} />
              <KV label="Phòng vật lý" value={`${g.roomNum} · ${g.roomStatus}`} strong />
              <KV label="Thanh toán" value={`${g.paymentStatus} · ${g.amount}`} />
              <View style={s.row}>
                <Button label="Chi tiết" variant="secondary" style={s.flex} onPress={() => router.push({ pathname: '/staff/bookings/[id]', params: { id: g.id } })} />
                <Button label="Check-in" leadingIcon="key" style={[s.flex, { backgroundColor: accent }]} onPress={() => router.push('/staff/check-in')} />
              </View>
            </Card>
          ))
        : departures.map((b) => (
            <Card key={b.id}>
              <View style={s.row}>
                <Avatar text={b.initials} />
                <View style={s.flex}>
                  <Text variant="label" weight="bold">
                    {b.guestName}
                  </Text>
                  <Text variant="caption" color={colors.onSurfaceVariant}>
                    {b.id} · {b.roomNum}
                  </Text>
                </View>
                <Chip label={b.status} tone={b.tone} />
              </View>
              <KV label="Lịch lưu trú" value={b.stayDates} />
              <Button label="Check-out" leadingIcon="logout" style={{ backgroundColor: accent }} onPress={() => router.push('/staff/check-out')} />
            </Card>
          ))}

      <Section title="Tình trạng phòng vật lý" />
      <Card>
        <View style={s.between}>
          <Text variant="label" weight="bold">
            Tổng {totalRooms} phòng
          </Text>
          <Text variant="caption" color={colors.onSurfaceVariant}>
            {Math.round((roomStatus[0].count / totalRooms) * 100)}% Sẵn sàng
          </Text>
        </View>
        <View style={styles.bar}>
          {roomStatus.map((r) => (
            <View key={r.label} style={{ flex: r.count, backgroundColor: r.color }} />
          ))}
        </View>
        {roomStatus.map((r) => (
          <View key={r.label} style={s.row}>
            <View style={[styles.legend, { backgroundColor: r.color }]} />
            <Text variant="small" color={colors.onSurfaceVariant} style={s.flex}>
              {r.label}
            </Text>
            <Text variant="small" weight="bold">
              {r.count} phòng
            </Text>
          </View>
        ))}
      </Card>

      <Section title="Liên hệ bộ phận nội bộ" />
      <Card style={styles.list}>
        {departments.map((d, i) => (
          <View key={d.name} style={[styles.task, i > 0 && styles.topLine]}>
            <View style={styles.taskIcon}>
              <Icon name="contact_phone" size={18} color={colors.primary} />
            </View>
            <View style={s.flex}>
              <Text variant="small" weight="semibold">
                {d.name}
              </Text>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                {d.sub}
              </Text>
            </View>
            <Text variant="small" weight="bold" color={colors.primary}>
              {d.ext}
            </Text>
          </View>
        ))}
      </Card>
    </StaffTabScreen>
  );
}

const styles = StyleSheet.create({
  quickRow: { flexDirection: 'row', gap: 10 },
  quick: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
  },
  quickIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceContainerLow },
  list: { gap: 0, paddingVertical: 4 },
  task: { flexDirection: 'row', gap: 12, paddingVertical: 12, alignItems: 'flex-start' },
  topLine: { borderTopWidth: 1, borderTopColor: colors.surfaceContainerHigh },
  taskIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceContainerLow },
  tag: { marginTop: 4 },
  bar: { flexDirection: 'row', height: 10, borderRadius: radius.full, overflow: 'hidden', gap: 2 },
  legend: { width: 10, height: 10, borderRadius: 3 },
});
