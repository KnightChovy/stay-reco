import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { RoomStatus } from '@stayreco/shared';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import type { Tone } from '@/features/staff/data';
import { Card, CleanRoomButton, FilterChips, StaffScreen, s, useStaffHotel } from '@/features/staff/ui';
import { apiErrorMessage } from '@/services/ApiService';
import { getRoomTypes, getRooms } from '@/services/staff.service';

const statusLabel: Record<RoomStatus, { label: string; tone: Tone }> = {
  CLEANING: { label: 'Đang dọn', tone: 'warning' },
  AVAILABLE: { label: 'Sẵn sàng', tone: 'tertiary' },
  OCCUPIED: { label: 'Có khách', tone: 'primary' },
  MAINTENANCE: { label: 'Đang khoá', tone: 'danger' },
};
const ORDER: RoomStatus[] = ['CLEANING', 'AVAILABLE', 'OCCUPIED', 'MAINTENANCE'];

/** Bảng buồng phòng như trang /staff/rooms bên web: khoá bảo trì vẫn là việc của chủ khách sạn. */
export default function StaffRoomsScreen() {
  const { hotelId } = useStaffHotel();
  const [status, setStatus] = useState<RoomStatus | 'all'>('all');
  const [roomTypeId, setRoomTypeId] = useState('all');

  // Tối đa 100 phòng/trang; một trang đủ cho các khách sạn hiện tại (giống bên web).
  const rooms = useQuery({ queryKey: ['staff', 'rooms', hotelId, 'all'], queryFn: () => getRooms(hotelId!, { pageSize: 100, sort: 'room-number-asc' }), enabled: !!hotelId });
  const types = useQuery({ queryKey: ['staff', 'room-types', hotelId], queryFn: () => getRoomTypes(hotelId!), enabled: !!hotelId });

  const all = rooms.data ?? [];
  const typeName = (id: string) => types.data?.find((t) => t.id === id)?.name ?? '—';
  const visible = all.filter((r) => (status === 'all' || r.status === status) && (roomTypeId === 'all' || r.roomTypeId === roomTypeId));
  const floors = Array.from(new Set(visible.map((r) => r.floor))).sort((a, b) => (a ?? -1) - (b ?? -1));

  return (
    <StaffScreen title="Tình trạng phòng" right={<Button label="Làm mới" variant="ghost" size="sm" disabled={rooms.isFetching} onPress={() => void rooms.refetch()} />}>
      <Text variant="small" color={colors.onSurfaceVariant}>
        Phòng khách vừa trả chuyển sang “Đang dọn”; bấm “Đã dọn xong” khi phòng sẵn sàng đón khách mới.
      </Text>

      <View className="flex-row flex-wrap gap-2.5">
        {ORDER.map((key) => {
          const on = status === key;
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => setStatus(on ? 'all' : key)}
              className={`min-w-[47%] flex-1 flex-row items-center justify-between rounded-lg border bg-surface-container-lowest p-3 ${on ? 'border-primary' : 'border-surface-container'}`}
            >
              <Chip label={statusLabel[key].label} tone={statusLabel[key].tone} />
              <Text variant="h3" weight="bold">
                {rooms.isPending ? '…' : all.filter((r) => r.status === key).length}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FilterChips items={[{ key: 'all', label: 'Tất cả hạng' }, ...(types.data ?? []).map((t) => ({ key: t.id, label: t.name }))]} value={roomTypeId} onChange={setRoomTypeId} />

      {rooms.isPending ? (
        <ActivityIndicator color={colors.primary} />
      ) : rooms.isError ? (
        <Card>
          <Text variant="small" color={colors.error}>
            {apiErrorMessage(rooms.error, 'Không tải được danh sách phòng.')}
          </Text>
          <Button label="Thử lại" leadingIcon="refresh" variant="secondary" onPress={() => void rooms.refetch()} />
        </Card>
      ) : visible.length === 0 ? (
        <Text variant="small" color={colors.onSurfaceVariant} center>
          Không có phòng nào khớp bộ lọc.
        </Text>
      ) : (
        floors.map((floor) => (
          <View key={floor ?? 'none'} className="gap-2">
            <Text variant="caption" weight="bold" color={colors.onSurfaceVariant} className={s.upper}>
              {floor == null ? 'Chưa ghi tầng' : `Tầng ${floor}`}
            </Text>
            {visible
              .filter((r) => r.floor === floor)
              .map((r) => (
                <Card key={r.id}>
                  <View className={s.between}>
                    <View className={s.flex}>
                      <Text variant="label" weight="bold">
                        Phòng {r.roomNumber}
                      </Text>
                      <Text variant="caption" color={colors.onSurfaceVariant} numberOfLines={1}>
                        {typeName(r.roomTypeId)}
                      </Text>
                    </View>
                    {r.status === 'CLEANING' ? <CleanRoomButton roomId={r.id} roomNumber={r.roomNumber} /> : <Chip label={statusLabel[r.status].label} tone={statusLabel[r.status].tone} />}
                  </View>
                  {!!r.notes && (
                    <Text variant="caption" color={colors.onSurfaceVariant} numberOfLines={2}>
                      {r.notes}
                    </Text>
                  )}
                </Card>
              ))}
          </View>
        ))
      )}
    </StaffScreen>
  );
}
