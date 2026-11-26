import { ActivityIndicator, ScrollView, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { PriceLine } from '@/features/booking/PriceLine';
import { images } from '@/lib/mock-data';
import { formatDate, formatVnd, nightsBetween, stayFromParams } from '@/lib/stay';
import { hotelListingQuery } from '@/services/stays.service';

/** Chi tiết một hạng phòng (như /hotels/[id]/rooms/[roomId] bên web); dùng lại listing của khách sạn trong cache. */
export default function RoomTypeScreen() {
  const params = useLocalSearchParams<{ hotelId: string; roomTypeId: string }>();
  const stay = stayFromParams(params);
  const nights = nightsBetween(stay.checkIn, stay.checkOut);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { data, isError, refetch } = useQuery({ ...hotelListingQuery(params.hotelId, stay), enabled: !!params.hotelId });
  const room = data?.roomTypes.find((r) => r.roomType.id === params.roomTypeId);

  if (!room)
    return (
      <View className="flex-1 bg-surface">
        <ScreenHeader title="Hạng phòng" />
        <View className="flex-1 items-center justify-center gap-3 p-6">
          {!data && !isError ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Text variant="small" color={colors.onSurfaceVariant} center>
                {isError ? 'Không tải được hạng phòng.' : 'Hạng phòng này không còn mở bán.'}
              </Text>
              {isError && <Button label="Thử lại" leadingIcon="refresh" variant="secondary" size="sm" onPress={() => void refetch()} />}
            </>
          )}
        </View>
      </View>
    );

  const { roomType, offer } = room;
  const gallery = roomType.images.length ? roomType.images.map((i) => i.url) : [images.roomDeluxe];
  const canBook = !!offer && offer.available > 0 && offer.fitsGuests;

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader title={roomType.name} />
      <ScrollView contentContainerClassName="gap-4 pb-8" showsVerticalScrollIndicator={false}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {gallery.map((uri) => (
            <Image key={uri} source={uri} style={{ width, height: 240 }} contentFit="cover" />
          ))}
        </ScrollView>

        <View className="mx-4 gap-2">
          <Text variant="h1">{roomType.name}</Text>
          <Text variant="small" color={colors.onSurfaceVariant}>
            {data!.hotel.name} · Tối đa {roomType.maxOccupancy} khách/phòng · {roomType.areaSqm} m²
          </Text>
          <Text variant="small" color={colors.onSurfaceVariant}>
            {roomType.beds.map((b) => `${b.quantity} ${b.name}`).join(', ') || 'Chưa cập nhật giường'}
          </Text>
          {!!roomType.description && <Text variant="small">{roomType.description}</Text>}
        </View>

        {roomType.amenities.length > 0 && (
          <View className="mx-4 gap-2.5">
            <Text variant="h3">Tiện nghi phòng</Text>
            <View className="flex-row flex-wrap gap-2">
              {roomType.amenities.map((a) => (
                <Chip key={a.id} label={a.name} icon="check_circle" tone="neutral" />
              ))}
            </View>
          </View>
        )}

        <View className="mx-4 gap-2.5 rounded-lg bg-surface-container-lowest p-4 shadow-card">
          <Text variant="h3">Kỳ nghỉ của bạn</Text>
          <Text variant="small" color={colors.onSurfaceVariant}>
            {formatDate(stay.checkIn)} – {formatDate(stay.checkOut)} · {nights} đêm · {stay.guests} khách · {stay.rooms} phòng
          </Text>
          {!offer ? (
            <Text variant="small" color={colors.onSurfaceVariant}>
              Chưa có giá cho ngày này.
            </Text>
          ) : (
            <>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                Còn {offer.available} phòng
              </Text>
              {offer.nightlyPrices.map((n) => (
                <PriceLine key={n.date} label={`Đêm ${formatDate(n.date)} (1 phòng)`} value={formatVnd(n.price)} />
              ))}
              <Text variant="caption" color={colors.onSurfaceVariant}>
                {offer.freeCancellationUntil
                  ? `Miễn phí hủy trước ${new Date(offer.freeCancellationUntil).toLocaleString('vi-VN')}. Sau đó phí hủy ${offer.cancellationFeePercent}%.`
                  : `Phí hủy ${offer.cancellationFeePercent}% tổng tiền.`}
              </Text>
            </>
          )}
        </View>
      </ScrollView>

      <View className="flex-row items-center gap-3 border-t border-surface-container-high bg-surface-container-lowest px-4 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
        <View className="flex-1">
          <Text variant="h3" weight="bold" color={colors.primary}>
            {offer ? formatVnd(offer.total) : '—'}
          </Text>
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Tổng {nights} đêm · đã gồm thuế & phí
          </Text>
        </View>
        <Button
          label={canBook ? 'Đặt phòng' : offer && !offer.fitsGuests ? 'Không đủ chỗ' : 'Hết phòng'}
          size="sm"
          style={{ minHeight: 48 }}
          disabled={!canBook}
          onPress={() => router.push({ pathname: '/booking', params: { ...stay, hotelId: params.hotelId, roomTypeId: roomType.id } })}
        />
      </View>
    </View>
  );
}
