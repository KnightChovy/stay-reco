import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { BOOKING_LIMITS } from '@stayreco/shared';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { DestinationCard } from '@/components/common/card/DestinationCard';
import { HotelCard } from '@/components/common/card/HotelCard';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors, fonts, radius, shadow } from '@/constants/theme';
import { destinations, images } from '@/lib/mock-data';
import { addDays, dateInput, defaultStay, formatDate, nightsBetween, type Stay } from '@/lib/stay';
import { searchHotels } from '@/services/stays.service';

const quickFilters: { label: string; icon: IconName }[] = [
  { label: 'Gần biển', icon: 'waves' },
  { label: 'Có hồ bơi', icon: 'pool' },
  { label: 'Yên tĩnh', icon: 'nature_people' },
  { label: 'Bữa sáng miễn phí', icon: 'bakery_dining' },
  { label: 'View đồi núi', icon: 'landscape' },
];

const commitments: { title: string; desc: string; icon: IconName }[] = [
  { title: '100% Khảo sát thực địa', desc: 'Đội ngũ chuyên môn trải nghiệm và đánh giá từng phòng', icon: 'verified_user' },
  { title: 'Minh bạch giá trọn gói', desc: 'Giá hiển thị đã gồm thuế & phí, tuyệt đối không phụ thu ẩn', icon: 'receipt_long' },
  { title: 'Hỗ trợ 24/7 đồng hành', desc: 'Người bản địa hỗ trợ check-in và giải quyết thắc mắc tức thì', icon: 'support_agent' },
];

function Stepper({ icon, label, value, onMinus, onPlus }: { icon: IconName; label: string; value: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={[styles.field, styles.flex, styles.stepper]}>
      <Icon name={icon} size={20} color={colors.primaryContainer} />
      <View style={styles.flex}>
        <Text variant="caption" weight="semibold" color={colors.outline}>
          {label.toUpperCase()}
        </Text>
        <Text variant="label" weight="semibold" numberOfLines={1}>
          {value}
        </Text>
      </View>
      <Pressable accessibilityLabel={`Giảm ${label}`} hitSlop={6} onPress={onMinus}>
        <Icon name="remove" size={20} color={colors.primary} />
      </Pressable>
      <Pressable accessibilityLabel={`Tăng ${label}`} hitSlop={6} onPress={onPlus}>
        <Icon name="add" size={20} color={colors.primary} />
      </Pressable>
    </View>
  );
}

function SectionTitle({ title, subtitle, action }: { title: string; subtitle: string; action?: string }) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.flex}>
        <Text variant="h2">{title}</Text>
        <Text variant="small" color={colors.onSurfaceVariant}>
          {subtitle}
        </Text>
      </View>
      {action && (
        <Pressable onPress={() => router.push({ pathname: '/search', params: featuredStay })} style={styles.row}>
          <Text variant="label" weight="semibold" color={colors.primaryContainer}>
            {action}
          </Text>
          <Icon name="chevron_right" size={18} color={colors.primaryContainer} />
        </Pressable>
      )}
    </View>
  );
}

// Khách sạn nổi bật: tìm theo điểm đến mặc định cho 2 đêm tới, như trang chủ web.
const featuredStay = defaultStay();

export default function HomeScreen() {
  const [stay, setStay] = useState<Stay>(defaultStay);
  const nights = nightsBetween(stay.checkIn, stay.checkOut);
  const featured = useQuery({
    queryKey: ['stays', 'search', 'featured', featuredStay],
    queryFn: () => searchHotels({ ...featuredStay, sort: 'recommended', page: 1, pageSize: 3 }),
  });

  // Nhận phòng từ hôm nay (backend kiểm tra giới hạn 365 ngày); đổi ngày nhận giữ nguyên số đêm.
  const shiftCheckIn = (days: number) => {
    const checkIn = addDays(stay.checkIn, days);
    if (checkIn < dateInput(0)) return;
    setStay({ ...stay, checkIn, checkOut: addDays(checkIn, nights) });
  };
  const setNights = (n: number) =>
    n >= 1 && n <= BOOKING_LIMITS.maxNights && setStay({ ...stay, checkOut: addDays(stay.checkIn, n) });
  const setGuests = (n: number) => n >= 1 && n <= BOOKING_LIMITS.maxGuests && setStay({ ...stay, guests: n });
  const search = () => router.push({ pathname: '/search', params: stay });

  return (
    <View style={styles.screen}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={images.homeHero} style={StyleSheet.absoluteFill} contentFit="cover" />
          <View style={styles.heroOverlay} />
          <Animated.View entering={FadeInUp.duration(600).springify()} style={styles.heroText}>
            <View style={styles.heroBadge}>
              <Icon name="spa" size={14} color={colors.onPrimary} />
              <Text variant="caption" weight="semibold" color={colors.onPrimary}>
                Boutique & Heritage Stays
              </Text>
            </View>
            <Text variant="hero" color={colors.white}>
              Tìm chốn nghỉ hợp gu,{'\n'}cho chuyến đi của bạn
            </Text>
            <Text variant="small" color={colors.white}>
              Trải nghiệm không gian nghỉ dưỡng tuyển chọn, đậm dấu ấn bản địa
            </Text>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(150).springify().damping(18)} style={styles.searchCard}>
          <View style={styles.field}>
            <Icon name="near_me" size={20} color={colors.primaryContainer} />
            <TextInput
              accessibilityLabel="Điểm đến"
              placeholder="Đà Nẵng, Hội An, Phú Quốc..."
              placeholderTextColor={colors.outline}
              value={stay.destination}
              onChangeText={(destination) => setStay({ ...stay, destination })}
              returnKeyType="search"
              onSubmitEditing={search}
              style={styles.input}
            />
          </View>
          <Stepper
            icon="calendar_month"
            label="Nhận phòng"
            value={formatDate(stay.checkIn)}
            onMinus={() => shiftCheckIn(-1)}
            onPlus={() => shiftCheckIn(1)}
          />
          <View style={styles.row}>
            <Stepper icon="dark_mode" label="Số đêm" value={`${nights} đêm`} onMinus={() => setNights(nights - 1)} onPlus={() => setNights(nights + 1)} />
            <Stepper icon="group" label="Số khách" value={`${stay.guests} khách`} onMinus={() => setGuests(stay.guests - 1)} onPlus={() => setGuests(stay.guests + 1)} />
          </View>
          <Button label="Tìm kiếm chỗ nghỉ" leadingIcon="search" size="lg" disabled={!stay.destination.trim()} onPress={search} />
        </Animated.View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {quickFilters.map((f, i) => (
            <Chip key={f.label} label={f.label} icon={f.icon} tone={i === 0 ? 'selected' : 'outline'} onPress={search} />
          ))}
        </ScrollView>

        <View style={[styles.section, styles.aiCard]}>
          <View style={styles.aiBadge}>
            <Icon name="auto_awesome" size={14} color={colors.primary} />
            <Text variant="caption" weight="bold" color={colors.primary}>
              ĐẶC QUYỀN AI
            </Text>
          </View>
          <Text variant="h3" color={colors.white}>
            Chưa biết chọn chỗ nghỉ nào?
          </Text>
          <Text variant="small" color={colors.primaryFixed}>
            Nhờ Trợ lý AI StayReco gợi ý theo sở thích, gu cá nhân & lịch trình riêng của bạn.
          </Text>
          <Button
            label="Trò chuyện ngay"
            icon="arrow_forward"
            variant="secondary"
            size="sm"
            style={styles.selfStart}
            onPress={() => router.push('/assistant')}
          />
        </View>

        <View style={styles.section}>
          <SectionTitle title="Điểm đến yêu thích" subtitle="Khám phá các miền di sản boutique trứ danh" action="Tất cả" />
          <View style={styles.grid}>
            <View style={styles.row}>
              <DestinationCard {...destinations[0]} />
              <DestinationCard {...destinations[1]} />
            </View>
            <View style={styles.row}>
              <DestinationCard {...destinations[2]} />
              <DestinationCard {...destinations[3]} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle title="Khám phá cho chuyến đi của bạn" subtitle="Bộ sưu tập nơi lưu trú có thẩm mỹ & dịch vụ tận tâm" />
          <View style={styles.list}>
            {featured.isPending && <Text variant="small" color={colors.onSurfaceVariant}>Đang tải chỗ nghỉ...</Text>}
            {featured.isError && <Text variant="small" color={colors.onSurfaceVariant}>Không tải được chỗ nghỉ. Kéo lại sau nhé.</Text>}
            {featured.data?.hotels.map((h, i) => (
              <HotelCard key={h.id} hotel={h} stay={featuredStay} index={i} />
            ))}
          </View>
        </View>

        <View style={[styles.section, styles.commit]}>
          <View style={styles.row}>
            <Icon name="shield" size={20} color={colors.primaryContainer} />
            <Text variant="h3">Cam kết chất lượng StayReco</Text>
          </View>
          {commitments.map((c) => (
            <View key={c.title} style={styles.commitItem}>
              <View style={styles.commitIcon}>
                <Icon name={c.icon} size={20} color={colors.primaryContainer} />
              </View>
              <View style={styles.flex}>
                <Text variant="label" weight="semibold">
                  {c.title}
                </Text>
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  {c.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Text variant="caption" color={colors.onSurfaceVariant} center style={styles.section}>
          StayReco tuyển chọn các cơ sở lưu trú bản địa bền vững khắp Việt Nam.{'\n'}Chăm chút từng khoảnh khắc bình yên cho bạn.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { paddingBottom: 120 },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selfStart: { alignSelf: 'flex-start' },
  hero: { height: 300, justifyContent: 'flex-end' },
  heroOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(1,30,50,0.45)' },
  heroText: { padding: 16, paddingBottom: 56, gap: 8 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  searchCard: {
    marginHorizontal: 16,
    marginTop: -40,
    padding: 12,
    gap: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerLowest,
    ...shadow.floating,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLow,
  },
  // Hai ô Số đêm / Số khách chung một hàng: thu gọn khoảng cách để "2 khách" không bị cắt ở màn 390px.
  stepper: { gap: 6, paddingHorizontal: 10 },
  input: { flex: 1, padding: 0, fontFamily: fonts.medium, fontSize: 14, color: colors.onSurface },
  filters: { gap: 8, paddingHorizontal: 16, paddingTop: 20 },
  section: { marginHorizontal: 16, marginTop: 28 },
  sectionHead: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 14, gap: 8 },
  aiCard: { padding: 18, gap: 10, borderRadius: radius.lg, backgroundColor: colors.primaryContainer },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.primaryFixed,
  },
  grid: { gap: 12 },
  list: { gap: 20 },
  commit: { padding: 16, gap: 12, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerLow },
  commitItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLowest,
  },
  commitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryFixed,
  },
});
