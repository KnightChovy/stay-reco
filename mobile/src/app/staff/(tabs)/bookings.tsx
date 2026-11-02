import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { colors, radius } from '@/constants/theme';
import { bookingFilters, bookingMatches, bookings, type BookingAction, type BookingFilter } from '@/features/staff/data';
import { Avatar, Card, FilterChips, StaffTabScreen, accent, s } from '@/features/staff/ui';

// Cùng nút hành động theo từng đơn như bảng bên web.
const actions: Record<BookingAction, { label: string; go: (id: string) => void }> = {
  checkin: { label: 'Check-in', go: () => router.push('/staff/check-in') },
  assign: { label: 'Gán phòng', go: () => router.push('/staff/check-in') },
  checkout: { label: 'Check-out', go: () => router.push('/staff/check-out') },
  welcome: { label: 'Đón khách', go: (id) => router.push({ pathname: '/staff/bookings/[id]', params: { id } }) },
  service: { label: 'Dịch vụ', go: (id) => router.push({ pathname: '/staff/bookings/[id]', params: { id } }) },
};

export default function StaffBookingsScreen() {
  const [filter, setFilter] = useState<BookingFilter>('all');
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const list = bookings.filter(
    (b) => bookingMatches[filter](b.action) && (!q || `${b.id} ${b.guestName} ${b.phone} ${b.roomNum}`.toLowerCase().includes(q)),
  );

  return (
    <StaffTabScreen>
      <View>
        <Text variant="caption" weight="semibold" color={colors.tertiaryContainer}>
          Cập nhật theo thời gian thực
        </Text>
        <Text variant="h1">Đặt phòng</Text>
      </View>
      <Input icon="search" placeholder="Tìm mã đơn, tên khách, SĐT, số phòng…" value={query} onChangeText={setQuery} accessibilityLabel="Tìm đặt phòng" />
      <FilterChips items={bookingFilters.map((f) => ({ key: f.key, label: `${f.label} (${f.count})` }))} value={filter} onChange={setFilter} />
      <View style={s.row}>
        <Card style={styles.mini}>
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Hôm nay đến
          </Text>
          <Text variant="h3" weight="bold">
            14 lượt
          </Text>
        </Card>
        <Card style={styles.mini}>
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Chưa gán phòng
          </Text>
          <Text variant="h3" weight="bold" color={accent}>
            2 phòng
          </Text>
        </Card>
      </View>

      {list.length === 0 ? (
        <Text variant="small" color={colors.onSurfaceVariant} center>
          Không có đơn nào khớp bộ lọc.
        </Text>
      ) : (
        list.map((b) => {
          const act = actions[b.action];
          const unassigned = b.roomNum === 'Chưa gán phòng';
          return (
            <Card key={b.id}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Đơn ${b.id}, ${b.guestName}`}
                onPress={() => router.push({ pathname: '/staff/bookings/[id]', params: { id: b.id } })}
                style={styles.press}
              >
                <View style={s.between}>
                  <Text variant="caption" weight="semibold" color={colors.onSurfaceVariant}>
                    {b.id} · {b.channel}
                  </Text>
                  <Chip label={b.status} tone={b.tone} />
                </View>
                <View style={s.row}>
                  <Avatar text={b.initials} size={36} />
                  <View style={s.flex}>
                    <Text variant="label" weight="bold">
                      {b.guestName}
                    </Text>
                    <Text variant="caption" color={colors.onSurfaceVariant}>
                      {b.tier} · {b.phone}
                    </Text>
                  </View>
                  <Icon name="chevron_right" size={18} color={colors.outline} />
                </View>
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  {b.roomType} · {b.pkg}
                </Text>
                <View style={styles.box}>
                  <View style={s.flex}>
                    <Text variant="caption" color={colors.onSurfaceVariant}>
                      Lịch lưu trú
                    </Text>
                    <Text variant="caption" weight="semibold">
                      {b.stayDates}
                    </Text>
                  </View>
                  <View style={s.flex}>
                    <Text variant="caption" color={colors.onSurfaceVariant}>
                      Phòng vật lý
                    </Text>
                    <Text variant="caption" weight="semibold" color={unassigned ? '#7a4600' : colors.onSurface}>
                      {b.roomNum}
                    </Text>
                  </View>
                </View>
                <View style={s.between}>
                  <Text variant="label" weight="bold">
                    {b.amount}
                  </Text>
                  <Text variant="caption" color={colors.onSurfaceVariant}>
                    {b.paymentStatus}
                  </Text>
                </View>
              </Pressable>
              <Button label={act.label} size="sm" style={{ backgroundColor: accent }} onPress={() => act.go(b.id)} />
            </Card>
          );
        })
      )}

      <Card>
        <View style={s.row}>
          <View style={s.flex}>
            <Text variant="caption" color={colors.onSurfaceVariant}>
              Thời gian check-in TB
            </Text>
            <Text variant="label" weight="bold">
              1 phút 42 giây
            </Text>
          </View>
          <View style={s.flex}>
            <Text variant="caption" color={colors.onSurfaceVariant}>
              Khách StayReco Elite
            </Text>
            <Text variant="label" weight="bold">
              6/14 khách hôm nay
            </Text>
          </View>
        </View>
      </Card>
    </StaffTabScreen>
  );
}

const styles = StyleSheet.create({
  mini: { flex: 1, gap: 2, padding: 12 },
  press: { gap: 10 },
  box: { flexDirection: 'row', gap: 8, padding: 10, borderRadius: radius.md, backgroundColor: colors.surfaceContainerLow },
});
