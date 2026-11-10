import { ActivityIndicator, Pressable, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import type { ActionItem } from '@stayreco/shared';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
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
  OVERDUE_CHECKOUTS: { icon: 'schedule', label: 'Khách quá giờ trả phòng', href: '/staff/bookings?filter=CHECKED_IN' },
  REFUND_REQUESTS_PENDING: { icon: 'currency_exchange', label: 'Yêu cầu hoàn tiền đang chờ', href: '/staff/refunds' },
  CHANGE_REQUESTS_PENDING: { icon: 'edit_note', label: 'Yêu cầu đổi thông tin đang chờ', href: '/staff/bookings?filter=CHANGES' },
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

      <View className="flex-row gap-2.5">
        {quick.map((q) => (
          <Pressable key={q.label} accessibilityRole="button" onPress={() => router.push(q.href)} className="flex-1 items-center gap-2 rounded-lg border border-surface-container bg-surface-container-lowest px-1.5 py-3.5">
            <View className="h-11 w-11 items-center justify-center rounded-[14px] bg-surface-container-low">
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
              unit={`${t!.tonight.roomsSold}/${t!.tonight.roomsAvailable} phòng đã bán`}
              foot={`Còn trống: ${t!.tonight.roomsAvailable - t!.tonight.roomsSold} phòng`}
              tint="#2e7d55"
            />
            <Stat icon="groups" label="Đang lưu trú" value={`${t!.inHouse.guests}`} unit="khách" foot={`${t!.inHouse.bookings} đơn`} tint={colors.primaryContainer} />
          </Grid>

          {tasks.length > 0 && (
            <>
              <Section title="Cần xử lý ngay" />
              <Card style={{ gap: 0, paddingVertical: 4 }}>
                {tasks.map((item, i) => {
                  const a = actionLabels[item.type]!;
                  return (
                    <Pressable key={item.type} accessibilityRole="button" onPress={() => router.push(a.href)} className={`flex-row items-center gap-3 py-3 ${i > 0 ? 'border-t border-surface-container-high' : ''}`}>
                      <View className="h-9 w-9 items-center justify-center rounded-[10px] bg-surface-container-low">
                        <Icon name={a.icon} size={18} color={colors.primary} />
                      </View>
                      <Text variant="small" weight="semibold" className={s.flex}>
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
                <View className={s.row}>
                  <Avatar text={initials(g.guestName)} />
                  <View className={s.flex}>
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
                <View className={s.row}>
                  <Button label="Chi tiết" variant="secondary" className={s.flex} onPress={() => router.push({ pathname: '/staff/bookings/[id]', params: { id: g.bookingId } })} />
                  <Button
                    label="Check-in"
                    leadingIcon="key"
                    className={s.flex} style={{ backgroundColor: accent }}
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
              <View className="h-2.5 flex-row gap-0.5 overflow-hidden rounded-full">
                {roomLegend.map((r) => (
                  <View key={r.key} style={{ flex: t!.rooms[r.key], backgroundColor: r.color }} />
                ))}
              </View>
            )}
            {roomLegend.map((r) => (
              <View key={r.key} className={s.row}>
                <View className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: r.color }} />
                <Text variant="small" color={colors.onSurfaceVariant} className={s.flex}>
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
