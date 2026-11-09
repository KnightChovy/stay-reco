import { useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RoomTypeListing } from '@stayreco/shared';
import { ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon, type IconName } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { colors, radius } from '@/constants/theme';
import { images } from '@/lib/mock-data';
import { formatDate, formatVnd, nightsBetween, stayFromParams } from '@/lib/stay';
import { hotelListingQuery } from '@/services/stays.service';

function Meta({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View className="flex-row items-center gap-1">
      <Icon name={icon} size={16} color={colors.onSurfaceVariant} />
      <Text variant="small" color={colors.onSurfaceVariant}>
        {label}
      </Text>
    </View>
  );
}

/** Giữ đúng bố cục trang (ảnh, tên, địa chỉ, ngày, tiện ích, hạng phòng, thanh đặt) trong lúc chờ API. */
function HotelDetailSkeleton({ bottomInset }: { bottomInset: number }) {
  return (
    <>
      <ScrollView contentContainerClassName="pb-8" scrollEnabled={false}>
        <Skeleton height={280} radius={0} />
        <View className="mx-4 mt-5 gap-2.5">
          <Skeleton width={130} height={28} radius={radius.full} />
          <Skeleton width="80%" height={30} />
          <Skeleton width="60%" />
          <Skeleton />
          <Skeleton width="90%" />
        </View>
        <View className="mx-4 mt-5 flex-row items-center gap-3 rounded-lg bg-surface-container-low p-4">
          <Skeleton width={22} height={22} />
          <View className="flex-1 gap-1.5">
            <Skeleton width="65%" height={16} />
            <Skeleton width="85%" height={12} />
          </View>
        </View>
        <View className="mx-4 mt-5 gap-2.5">
          <Skeleton width={90} height={20} />
          <View className="flex-row flex-wrap gap-2">
            {[96, 110, 84, 120, 100].map((w, i) => (
              <Skeleton key={i} width={w} height={30} radius={radius.full} />
            ))}
          </View>
        </View>
        <View className="mx-4 mt-5 gap-2.5">
          <Skeleton width={110} height={20} />
          <View className="overflow-hidden rounded-lg bg-surface-container-lowest shadow-card">
            <Skeleton height={180} radius={0} />
            <View className="gap-3 p-4">
              <Skeleton width="55%" height={20} />
              <Skeleton width="75%" />
              <Skeleton height={44} radius={radius.md} />
            </View>
          </View>
        </View>
      </ScrollView>
      <View className="flex-row items-center gap-3 border-t border-surface-container-high bg-surface-container-lowest px-4 pt-3 shadow-floating" style={{ paddingBottom: bottomInset + 12 }}>
        <View className="flex-1 gap-1.5">
          <Skeleton width="60%" height={20} />
          <Skeleton width="75%" height={12} />
        </View>
        <Skeleton width={130} height={48} radius={radius.md} />
      </View>
    </>
  );
}

const bookable = ({ offer }: RoomTypeListing) => !!offer && offer.available > 0 && offer.fitsGuests;

function RoomCard({ room, nights, onBook }: { room: RoomTypeListing; nights: number; onBook: () => void }) {
  const { roomType, offer } = room;
  const beds = roomType.beds.map((b) => `${b.quantity} ${b.name}`).join(', ');
  return (
    <View className="overflow-hidden rounded-lg bg-surface-container-lowest shadow-card">
      <Image source={roomType.images[0]?.url ?? images.roomDeluxe} className="h-[180px] w-full" contentFit="cover" />
      {offer && offer.available > 0 && offer.available <= 3 && (
        <View className="absolute left-3 top-3 rounded-sm bg-primary-container px-2.5 py-1">
          <Text variant="caption" weight="semibold" color={colors.white}>
            Chỉ còn {offer.available} phòng
          </Text>
        </View>
      )}
      <View className="gap-3 p-4">
        <Text variant="h3">{roomType.name}</Text>
        <View className="flex-row flex-wrap gap-x-4 gap-y-1.5">
          <Meta icon="square_foot" label={`${roomType.areaSqm} m²`} />
          {!!beds && <Meta icon="king_bed" label={beds} />}
          <Meta icon="group" label={`Tối đa ${roomType.maxOccupancy} khách`} />
        </View>
        {!!roomType.description && (
          <Text variant="caption" color={colors.onSurfaceVariant}>
            {roomType.description}
          </Text>
        )}
        {offer && (
          <View className={`gap-2.5 rounded-md bg-surface-container-low p-3 ${bookable(room) ? 'border border-primary-fixed' : ''}`}>
            <View className="flex-row items-center justify-between gap-2">
              <View className="flex-1">
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  {offer.freeCancellationUntil
                    ? `Miễn phí hủy trước ${new Date(offer.freeCancellationUntil).toLocaleDateString('vi-VN')}`
                    : `Phí hủy ${offer.cancellationFeePercent}%`}
                </Text>
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  Tổng {nights} đêm: {formatVnd(offer.total)}
                </Text>
              </View>
              <View className="items-end">
                <Text variant="label" weight="bold">
                  {formatVnd(offer.perRoomTotal / nights)}
                </Text>
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  / đêm
                </Text>
              </View>
            </View>
            {bookable(room) ? (
              <Button label="Chọn phòng này" icon="chevron_right" onPress={onBook} />
            ) : (
              <Button label={offer.fitsGuests ? 'Hết phòng' : 'Không đủ chỗ cho số khách'} variant="muted" disabled />
            )}
          </View>
        )}
      </View>
    </View>
  );
}

export default function HotelDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const stay = stayFromParams(params);
  const nights = nightsBetween(stay.checkIn, stay.checkOut);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const { data, isPending, isError, refetch } = useQuery(hotelListingQuery(params.id, stay));

  const book = (roomTypeId: string) =>
    router.push({ pathname: '/booking', params: { ...stay, hotelId: params.id, roomTypeId } });

  if (!data) {
    return (
      <View className="flex-1 bg-surface">
        <ScreenHeader title="Chi Tiết Nơi Lưu Trú" />
        {isPending ? (
          <HotelDetailSkeleton bottomInset={insets.bottom} />
        ) : (
          <View className="flex-1 items-center justify-center gap-2.5 p-6">
            {isError && (
              <>
                <Text variant="small" color={colors.onSurfaceVariant} center>
                  Không tải được khách sạn này. Có thể khách sạn đã ngừng nhận khách.
                </Text>
                <Button label="Thử lại" leadingIcon="refresh" variant="secondary" size="sm" onPress={() => refetch()} />
              </>
            )}
          </View>
        )}
      </View>
    );
  }

  const { hotel, roomTypes } = data;
  const gallery = hotel.images.length ? hotel.images.map((i) => i.url) : [images.detail1];
  const cheapest = roomTypes.filter(bookable).sort((a, b) => a.offer!.total - b.offer!.total)[0];

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader title="Chi Tiết Nơi Lưu Trú" />
      <ScrollView contentContainerClassName="pb-8" showsVerticalScrollIndicator={false}>
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
          >
            {gallery.map((uri) => (
              <Image key={uri} source={uri} style={{ width, height: 280 }} contentFit="cover" />
            ))}
          </ScrollView>
          <View className="absolute bottom-3.5 left-4 flex-row gap-1.5">
            {gallery.map((uri, i) => (
              <View key={uri} className={`rounded-full ${i === page ? '-mt-px h-2 w-2 bg-white' : 'h-1.5 w-1.5 bg-white/60'}`} />
            ))}
          </View>
          <View className="absolute bottom-3 right-4 flex-row items-center gap-1 rounded-full bg-black/[0.55] px-2.5 py-1">
            <Icon name="photo_library" size={14} color={colors.white} />
            <Text variant="caption" weight="medium" color={colors.white}>
              {page + 1}/{gallery.length} ảnh
            </Text>
          </View>
        </View>

        <View className="mx-4 mt-5 gap-2.5">
          {hotel.starRating != null && (
            <Chip label={`Khách sạn ${hotel.starRating} sao`} icon="hotel_class" tone="secondary" className="self-start" />
          )}
          <Text variant="h1">{hotel.name}</Text>
          <View className="flex-row flex-wrap items-center gap-1.5">
            <Icon name="location_on" size={16} color={colors.secondary} />
            <Text variant="small" color={colors.onSurfaceVariant} className="flex-1">
              {hotel.address}, {hotel.city}
            </Text>
          </View>
          {!!hotel.description && (
            <Text variant="small" color={colors.onSurfaceVariant}>
              {hotel.description}
            </Text>
          )}
        </View>

        <View className="mx-4 mt-5 flex-row items-center gap-3 rounded-lg bg-surface-container-low p-4">
          <Icon name="calendar_month" size={22} color={colors.primaryContainer} />
          <View className="flex-1">
            <Text variant="label" weight="bold">
              {formatDate(stay.checkIn)} – {formatDate(stay.checkOut)}
            </Text>
            <Text variant="caption" color={colors.onSurfaceVariant}>
              {nights} đêm • {stay.guests} khách • {stay.rooms} phòng
              {hotel.checkInTime ? ` • Nhận phòng từ ${hotel.checkInTime}` : ''}
            </Text>
          </View>
        </View>

        {hotel.amenities.length > 0 && (
          <View className="mx-4 mt-5 gap-2.5">
            <Text variant="h3">Tiện ích</Text>
            <View className="flex-row flex-wrap gap-2">
              {hotel.amenities.map((a) => (
                <Chip key={a.id} label={a.name} icon="check_circle" tone="neutral" />
              ))}
            </View>
          </View>
        )}

        <View className="mx-4 mt-5 gap-2.5">
          <View className="flex-row items-center justify-between gap-2">
            <Text variant="h3">Hạng phòng</Text>
            <Text variant="small" color={colors.onSurfaceVariant}>
              {roomTypes.length} lựa chọn
            </Text>
          </View>
          {roomTypes.map((room) => (
            <RoomCard key={room.roomType.id} room={room} nights={nights} onBook={() => book(room.roomType.id)} />
          ))}
        </View>

        {Object.keys(hotel.policies).length > 0 && (
          <View className="mx-4 mt-5 gap-2.5 rounded-lg bg-surface-container-low p-4">
            <Text variant="h3">Chính sách</Text>
            {Object.entries(hotel.policies).map(([key, text]) => (
              <Text key={key} variant="small" color={colors.onSurfaceVariant}>
                • {text}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>

      {cheapest && (
        <View className="flex-row items-center gap-3 border-t border-surface-container-high bg-surface-container-lowest px-4 pt-3 shadow-floating" style={{ paddingBottom: insets.bottom + 12 }}>
          <View className="flex-1">
            <Text variant="h3" weight="bold" color={colors.primary}>
              Từ {formatVnd(cheapest.offer!.total)}
            </Text>
            <Text variant="caption" color={colors.onSurfaceVariant} numberOfLines={1}>
              Tổng {nights} đêm · đã gồm thuế & phí
            </Text>
          </View>
          <Button label="Đặt ngay" icon="arrow_forward" size="sm" style={{ minHeight: 48 }} onPress={() => book(cheapest.roomType.id)} />
        </View>
      )}
    </View>
  );
}
