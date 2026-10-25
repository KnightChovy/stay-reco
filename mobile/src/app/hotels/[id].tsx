import { useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
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
import { colors, radius, shadow } from '@/constants/theme';
import { images } from '@/lib/mock-data';
import { formatDate, formatVnd, nightsBetween, stayFromParams } from '@/lib/stay';
import { hotelListingQuery } from '@/services/stays.service';

function Meta({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View style={styles.metaItem}>
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
      <ScrollView contentContainerStyle={styles.content} scrollEnabled={false}>
        <Skeleton height={280} radius={0} />
        <View style={styles.section}>
          <Skeleton width={130} height={28} radius={radius.full} />
          <Skeleton width="80%" height={30} />
          <Skeleton width="60%" />
          <Skeleton />
          <Skeleton width="90%" />
        </View>
        <View style={[styles.section, styles.panel, styles.dateRow]}>
          <Skeleton width={22} height={22} />
          <View style={[styles.flex, styles.gap6]}>
            <Skeleton width="65%" height={16} />
            <Skeleton width="85%" height={12} />
          </View>
        </View>
        <View style={styles.section}>
          <Skeleton width={90} height={20} />
          <View style={styles.amenities}>
            {[96, 110, 84, 120, 100].map((w, i) => (
              <Skeleton key={i} width={w} height={30} radius={radius.full} />
            ))}
          </View>
        </View>
        <View style={styles.section}>
          <Skeleton width={110} height={20} />
          <View style={styles.room}>
            <Skeleton height={180} radius={0} />
            <View style={styles.roomBody}>
              <Skeleton width="55%" height={20} />
              <Skeleton width="75%" />
              <Skeleton height={44} radius={radius.md} />
            </View>
          </View>
        </View>
      </ScrollView>
      <View style={[styles.bottomBar, { paddingBottom: bottomInset + 12 }]}>
        <View style={[styles.flex, styles.gap6]}>
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
    <View style={styles.room}>
      <Image source={roomType.images[0]?.url ?? images.roomDeluxe} style={styles.roomImage} contentFit="cover" />
      {offer && offer.available > 0 && offer.available <= 3 && (
        <View style={styles.roomBadge}>
          <Text variant="caption" weight="semibold" color={colors.white}>
            Chỉ còn {offer.available} phòng
          </Text>
        </View>
      )}
      <View style={styles.roomBody}>
        <Text variant="h3">{roomType.name}</Text>
        <View style={styles.metaWrap}>
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
          <View style={[styles.plan, bookable(room) && styles.planActive]}>
            <View style={styles.between}>
              <View style={styles.flex}>
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  {offer.freeCancellationUntil
                    ? `Miễn phí hủy trước ${new Date(offer.freeCancellationUntil).toLocaleDateString('vi-VN')}`
                    : `Phí hủy ${offer.cancellationFeePercent}%`}
                </Text>
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  Tổng {nights} đêm: {formatVnd(offer.total)}
                </Text>
              </View>
              <View style={styles.alignEnd}>
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
      <View style={styles.screen}>
        <ScreenHeader title="Chi Tiết Nơi Lưu Trú" />
        {isPending ? (
          <HotelDetailSkeleton bottomInset={insets.bottom} />
        ) : (
          <View style={styles.state}>
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
    <View style={styles.screen}>
      <ScreenHeader title="Chi Tiết Nơi Lưu Trú" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
          <View style={styles.dots}>
            {gallery.map((uri, i) => (
              <View key={uri} style={[styles.dot, i === page && styles.dotActive]} />
            ))}
          </View>
          <View style={styles.photoCount}>
            <Icon name="photo_library" size={14} color={colors.white} />
            <Text variant="caption" weight="medium" color={colors.white}>
              {page + 1}/{gallery.length} ảnh
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          {hotel.starRating != null && (
            <Chip label={`Khách sạn ${hotel.starRating} sao`} icon="hotel_class" tone="secondary" style={styles.selfStart} />
          )}
          <Text variant="h1">{hotel.name}</Text>
          <View style={styles.row}>
            <Icon name="location_on" size={16} color={colors.secondary} />
            <Text variant="small" color={colors.onSurfaceVariant} style={styles.flex}>
              {hotel.address}, {hotel.city}
            </Text>
          </View>
          {!!hotel.description && (
            <Text variant="small" color={colors.onSurfaceVariant}>
              {hotel.description}
            </Text>
          )}
        </View>

        <View style={[styles.section, styles.panel, styles.dateRow]}>
          <Icon name="calendar_month" size={22} color={colors.primaryContainer} />
          <View style={styles.flex}>
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
          <View style={styles.section}>
            <Text variant="h3">Tiện ích</Text>
            <View style={styles.amenities}>
              {hotel.amenities.map((a) => (
                <Chip key={a.id} label={a.name} icon="check_circle" tone="neutral" />
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.between}>
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
          <View style={[styles.section, styles.panel]}>
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
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.flex}>
            <Text variant="h3" weight="bold" color={colors.primary}>
              Từ {formatVnd(cheapest.offer!.total)}
            </Text>
            <Text variant="caption" color={colors.onSurfaceVariant} numberOfLines={1}>
              Tổng {nights} đêm · đã gồm thuế & phí
            </Text>
          </View>
          <Button label="Đặt ngay" icon="arrow_forward" size="sm" style={styles.cta} onPress={() => book(cheapest.roomType.id)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  selfStart: { alignSelf: 'flex-start' },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { paddingBottom: 32 },
  flex: { flex: 1 },
  gap6: { gap: 6 },
  alignEnd: { alignItems: 'flex-end' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  dots: { position: 'absolute', bottom: 14, left: 16, flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.6)' },
  dotActive: { backgroundColor: colors.white, width: 8, height: 8, borderRadius: 4, marginTop: -1 },
  photoCount: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  section: { marginHorizontal: 16, marginTop: 20, gap: 10 },
  panel: { padding: 16, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerLow },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  room: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surfaceContainerLowest, ...shadow.card },
  roomImage: { width: '100%', height: 180 },
  roomBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryContainer,
  },
  roomBody: { padding: 16, gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaWrap: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 6 },
  plan: { padding: 12, gap: 10, borderRadius: radius.md, backgroundColor: colors.surfaceContainerLow },
  planActive: { borderWidth: 1, borderColor: colors.primaryFixed },
  cta: { minHeight: 48 },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
    ...shadow.floating,
  },
});
