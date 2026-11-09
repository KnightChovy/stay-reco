import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import type { ActionItem } from '@stayreco/shared';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors, radius } from '@/constants/theme';
import type { Tone } from '@/features/staff/data';
import { Avatar, Card, Grid, KV, Section, Stat, StaffTabScreen, accent, s, useStaffHotel } from '@/features/staff/ui';
import { bookingStatusLabel, formatDate } from '@/lib/stay';
import { getActionItems, getTodayStats } from '@/services/staff.service';

const quick: { icon: IconName; label: string; href: Href }[] = [
  { icon: 'key', label: 'Check-in', href: '/staff/check-in' },
  { icon: 'logout', label: 'Check-out', href: '/staff/check-out' },
  { icon: 'search', label: 'Tìm đặt phòng', href: '/staff/bookings' },
];

// Chỉ các mục staff xử lý được trên mobile; mục khác (thiết lập, xác minh…) là việc của chủ khách sạn.
const actionLabels: Partial<Record<ActionItem['type'], { icon: IconName; label: string; href: Href }>> = {
  OVERDUE_CHECKOUTS: { icon: 'schedule', label: 'Khách quá giờ trả phòng', href: '/staff/check-out' },
  REFUND_REQUESTS_PENDING: { icon: 'currency_exchange', label: 'Yêu cầu hoàn tiền đang chờ', href: '/staff/refunds' },
  CHANGE_REQUESTS_PENDING: { icon: 'edit_note', label: 'Yêu cầu đổi thông tin đang chờ', href: '/staff/bookings' },
};
const severityTone: Record<ActionItem['severity'], Tone> = { CRITICAL: 'danger', WARNING: 'warning', INFO: 'neutral' };

const roomLegend = [
  { key: 'AVAILABLE', label: 'Sẵn sàng', color: '#2e7d55' },
  { key: 'OCCUPIED', label: 'Có khách', color: colors.primary },
  { key: 'CLEANING', label: 'Đang dọn', color: '#d97706' },
  { key: 'MAINTENANCE', label: 'Bảo trì', color: colors.outline },
] as const;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

export default function StaffDashboardScreen() {
  const { hotelId } = useStaffHotel();
  const today = useQuery({ queryKey: ['staff', 'today', hotelId], queryFn: () => getTodayStats(hotelId!), enabled: !!hotelId });
  const items = useQuery({ queryKey: ['staff', 'action-items', hotelId], queryFn: () => getActionItems(hotelId!), enabled: !!hotelId });
  const t = today.data;
  const tasks = items.data?.items.filter((i) => actionLabels[i.type]) ?? [];

  return (
    <StaffTabScreen>
      <View>
        <Text variant="caption" weight="semibold" color={colors.tertiaryContainer}>
          {t ? `Hôm nay ${formatDate(t.date)}` : 'Hôm nay'}
        </Text>
        <Text variant="h1">Tổng quan ca làm</Text>
      </View>

      <View style={styles.quickRow}>
        {quick.map((q) => (
          <Pressable key={q.label} accessibilityRole="button" onPress={() => router.push(q.href)} style={styles.quick}>
            <View style={styles.quickIcon}>
              <Icon name={q.icon} color={colors.primary} />
            </View>
            <Text variant="caption" weight="semibold" center>
              {q.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {today.isPending ? (
        <ActivityIndicator color={colors.primary} />
      ) : today.isError ? (
        <Card>
          <Text variant="small" color={colors.error}>
            Không tải được số liệu hôm nay.
          </Text>
          <Button label="Thử lại" leadingIcon="refresh" variant="secondary" onPress={() => void today.refetch()} />
        </Card>
      ) : (
        <>
          <Grid>
            <Stat icon="key" label="Khách nhận phòng" value={`${t!.arrivals.expected}`} unit="lượt dự kiến" foot={`Đã nhận: ${t!.arrivals.checkedIn}`} />
            <Stat icon="logout" label="Khách trả phòng" value={`${t!.departures.expected}`} unit="lượt trong ngày" foot={`Đã xong: ${t!.departures.checkedOut}`} tint={accent} />
            <Stat
              icon="bed"
              label="Công suất đêm nay"
              value={t!.tonight.occupancyRate === null ? '—' : `${Math.round(t!.tonight.occupancyRate)}%`}
              unit={`${t!.tonight.roomsSold} phòng đã bán`}
              foot={`Còn trống: ${t!.tonight.roomsAvailable} phòng`}
              tint="#2e7d55"
            />
            <Stat icon="groups" label="Đang lưu trú" value={`${t!.inHouse.guests}`} unit="khách" foot={`${t!.inHouse.bookings} đơn`} tint={colors.primaryContainer} />
          </Grid>

          {tasks.length > 0 && (
            <>
              <Section title="Cần xử lý ngay" />
              <Card style={styles.list}>
                {tasks.map((item, i) => {
                  const a = actionLabels[item.type]!;
                  return (
                    <Pressable key={item.type} accessibilityRole="button" onPress={() => router.push(a.href)} style={[styles.task, i > 0 && styles.topLine]}>
                      <View style={styles.taskIcon}>
                        <Icon name={a.icon} size={18} color={colors.primary} />
                      </View>
                      <Text variant="small" weight="semibold" style={s.flex}>
                        {a.label}
                      </Text>
                      <Chip label={`${item.count}`} tone={severityTone[item.severity]} />
                    </Pressable>
                  );
                })}
              </Card>
            </>
          )}

          <Section title={`Khách sắp đến (${t!.upcomingArrivals.length})`} />
          {t!.upcomingArrivals.length === 0 ? (
            <Text variant="small" color={colors.onSurfaceVariant}>
              Không còn khách nào chờ nhận phòng hôm nay.
            </Text>
          ) : (
            t!.upcomingArrivals.map((g) => (
              <Card key={g.bookingId}>
                <View style={s.row}>
                  <Avatar text={initials(g.guestName)} />
                  <View style={s.flex}>
                    <Text variant="label" weight="bold">
                      {g.guestName}
                    </Text>
                    <Text variant="caption" color={colors.onSurfaceVariant}>
                      #{g.code} · {bookingStatusLabel[g.status]}
                    </Text>
                  </View>
                  <View>
                    <Text variant="label" weight="bold">
                      {g.arrivalTime ?? '—'}
                    </Text>
                    <Text variant="caption" color={colors.onSurfaceVariant}>
                      Giờ đến
                    </Text>
                  </View>
                </View>
                <KV label="Hạng phòng" value={`${g.roomTypeName} · ${g.rooms} phòng · ${g.nights} đêm`} />
                <KV label="Phòng đang giữ" value={g.roomNumbers.join(', ') || 'Chưa gán'} strong />
                {!!g.specialRequests && <Text variant="caption">Yêu cầu: {g.specialRequests}</Text>}
                <View style={s.row}>
                  <Button label="Chi tiết" variant="secondary" style={s.flex} onPress={() => router.push({ pathname: '/staff/bookings/[id]', params: { id: g.bookingId } })} />
                  <Button
                    label="Check-in"
                    leadingIcon="key"
                    style={[s.flex, { backgroundColor: accent }]}
                    onPress={() => router.push({ pathname: '/staff/check-in', params: { code: g.code } })}
                  />
                </View>
              </Card>
            ))
          )}

          <Section title="Tình trạng phòng" />
          <Card>
            <Text variant="label" weight="bold">
              Tổng {t!.rooms.total} phòng
            </Text>
            {t!.rooms.total > 0 && (
              <View style={styles.bar}>
                {roomLegend.map((r) => (
                  <View key={r.key} style={{ flex: t!.rooms[r.key], backgroundColor: r.color }} />
                ))}
              </View>
            )}
            {roomLegend.map((r) => (
              <View key={r.key} style={s.row}>
                <View style={[styles.legend, { backgroundColor: r.color }]} />
                <Text variant="small" color={colors.onSurfaceVariant} style={s.flex}>
                  {r.label}
                </Text>
                <Text variant="small" weight="bold">
                  {t!.rooms[r.key]} phòng
                </Text>
              </View>
            ))}
          </Card>
        </>
      )}
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
  task: { flexDirection: 'row', gap: 12, paddingVertical: 12, alignItems: 'center' },
  topLine: { borderTopWidth: 1, borderTopColor: colors.surfaceContainerHigh },
  taskIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceContainerLow },
  bar: { flexDirection: 'row', height: 10, borderRadius: radius.full, overflow: 'hidden', gap: 2 },
  legend: { width: 10, height: 10, borderRadius: 3 },
});
