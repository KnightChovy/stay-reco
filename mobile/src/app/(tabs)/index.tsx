import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { DestinationCard } from '@/components/common/card/DestinationCard';
import { HotelCard } from '@/components/common/card/HotelCard';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors, radius, shadow } from '@/constants/theme';
import { destinations, hotels, images } from '@/lib/mock-data';

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

function SearchField({ icon, label, value, style }: { icon: IconName; label: string; value: string; style?: object }) {
  return (
    <Pressable onPress={() => router.push('/search')} style={[styles.field, style]}>
      <Icon name={icon} size={20} color={colors.primaryContainer} />
      <View style={styles.flex}>
        <Text variant="caption" weight="semibold" color={colors.outline}>
          {label.toUpperCase()}
        </Text>
        <Text variant="label" weight="semibold" numberOfLines={1}>
          {value}
        </Text>
      </View>
    </Pressable>
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
        <Pressable onPress={() => router.push('/search')} style={styles.row}>
          <Text variant="label" weight="semibold" color={colors.primaryContainer}>
            {action}
          </Text>
          <Icon name="chevron_right" size={18} color={colors.primaryContainer} />
        </Pressable>
      )}
    </View>
  );
}

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={images.homeHero} style={StyleSheet.absoluteFill} contentFit="cover" />
          <View style={styles.heroOverlay} />
          <View style={styles.heroText}>
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
          </View>
        </View>

        <View style={styles.searchCard}>
          <SearchField icon="near_me" label="Điểm đến" value="Đà Nẵng, Hội An, Phú Quốc..." />
          <View style={styles.row}>
            <SearchField icon="calendar_month" label="Ngày lưu trú" value="18 Th04 - 20 Th04" style={styles.flex} />
            <SearchField icon="group" label="Số khách" value="2 khách, 1 phòng" style={styles.flex} />
          </View>
          <Button label="Tìm kiếm chỗ nghỉ" leadingIcon="search" size="lg" onPress={() => router.push('/search')} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {quickFilters.map((f, i) => (
            <Chip key={f.label} label={f.label} icon={f.icon} tone={i === 0 ? 'selected' : 'outline'} onPress={() => router.push('/search')} />
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
            {hotels.map((h) => (
              <HotelCard key={h.id} hotel={h} />
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
