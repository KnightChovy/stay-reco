import { ActivityIndicator, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { Banner, Card, KV, StaffScreen, accent, s, useStaffHotel } from '@/features/staff/ui';
import { formatDate, formatVnd } from '@/lib/stay';
import { getHotelBookings } from '@/services/staff.service';

const params = { paymentStatus: ['REFUND_PENDING' as const], sort: 'created-desc' as const, pageSize: 50 };

export default function StaffRefundsScreen() {
  const { hotelId } = useStaffHotel();
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['staff', 'bookings', hotelId, params],
    queryFn: () => getHotelBookings(hotelId!, params),
    enabled: !!hotelId,
  });

  return (
    <StaffScreen title="Yêu cầu hoàn tiền">
      <Banner
        icon="currency_exchange"
        tone="clay"
        title="Quy trình hoàn tiền"
        text="Khách hủy đơn có tiền hoàn → bạn kiểm tra và chuyển lên chủ khách sạn kèm ghi chú → chủ khách sạn duyệt hoặc từ chối. Chạm vào một đơn để xử lý."
      />
      {isPending ? (
        <ActivityIndicator color={colors.primary} />
      ) : isError ? (
        <Card>
          <Text variant="small" color={colors.error}>
            Không tải được yêu cầu hoàn tiền (cần quyền REFUND).
          </Text>
          <Button label="Thử lại" leadingIcon="refresh" variant="secondary" onPress={() => void refetch()} />
        </Card>
      ) : data.bookings.length === 0 ? (
        <Text variant="small" color={colors.onSurfaceVariant} center>
          Không có yêu cầu hoàn tiền nào đang chờ.
        </Text>
      ) : (
        data.bookings.map((b) => (
          <Card key={b.id}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Đơn ${b.code}`} onPress={() => router.push({ pathname: '/staff/bookings/[id]', params: { id: b.id } })} style={{ gap: 8 }}>
              <View className={s.between}>
                <Text variant="label" weight="bold" color={accent}>
                  #{b.code}
                </Text>
                <Icon name="chevron_right" size={18} color={colors.outline} />
              </View>
              <KV label="Hạng phòng" value={b.roomType.name} />
              <KV label="Lưu trú" value={`${formatDate(b.checkIn)} - ${formatDate(b.checkOut)}`} />
              <KV label="Đã thanh toán" value={formatVnd(b.totalAmount)} strong />
            </Pressable>
          </Card>
        ))
      )}
    </StaffScreen>
  );
}
