import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors, radius, shadow } from '@/constants/theme';
import { images } from '@/lib/mock-data';

const filters = ['Sắp tới (1)', 'Chờ thanh toán (1)', 'Đã hoàn tất (3)', 'Đã hủy (1)'];

export default function TripsScreen() {
  const [filter, setFilter] = useState(filters[0]);

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Chuyến đi của tôi" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsWrap} contentContainerStyle={styles.tabs}>
        {filters.map((f) => (
          <Pressable
            key={f}
            accessibilityRole="tab"
            accessibilityState={{ selected: f === filter }}
            onPress={() => setFilter(f)}
            style={[styles.tab, f === filter && styles.tabActive]}
          >
            <Text variant="label" weight={f === filter ? 'bold' : 'medium'} color={f === filter ? colors.primary : colors.onSurfaceVariant}>
              {f}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={[styles.between, styles.pad]}>
            <View style={styles.row}>
              <View style={styles.hotelIcon}>
                <Icon name="hotel" size={22} color={colors.primaryContainer} />
              </View>
              <View>
                <Text variant="caption" weight="semibold" color={colors.onSurfaceVariant}>
                  MÃ ĐƠN ĐẶT PHÒNG
                </Text>
                <Text variant="label" weight="bold">
                  SR-261020-0842
                </Text>
              </View>
            </View>
            <Chip label="Đã xác nhận & thanh toán" tone="tertiary" style={styles.shrink} />
          </View>

          <View>
            <Image source={images.tripThumb} style={styles.cover} contentFit="cover" />
            <View style={styles.dateTag}>
              <Icon name="calendar_today" size={14} color={colors.white} />
              <Text variant="caption" weight="semibold" color={colors.white}>
                20/10/2026 - 22/10/2026 (2 đêm)
              </Text>
            </View>
          </View>

          <View style={[styles.pad, styles.body]}>
            <View style={styles.between}>
              <Text variant="h3" style={styles.shrink}>
                An Nhiên Riverside Hotel
              </Text>
              <View style={styles.rating}>
                <Icon name="star" size={12} color={colors.secondary} />
                <Text variant="caption" weight="bold" color={colors.secondary}>
                  4.9
                </Text>
              </View>
            </View>
            <View style={styles.row}>
              <Icon name="location_on" size={14} color={colors.onSurfaceVariant} />
              <Text variant="small" color={colors.onSurfaceVariant}>
                128 Bạch Đằng, Hải Châu, Đà Nẵng
              </Text>
            </View>

            <View style={styles.stay}>
              <View style={styles.row}>
                <Icon name="bed" size={16} color={colors.primaryContainer} />
                <Text variant="small" style={styles.shrink}>
                  Phòng Deluxe River View • 1 Giường King • 2 người lớn
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.between}>
                <View>
                  <Text variant="caption" color={colors.onSurfaceVariant}>
                    Nhận phòng
                  </Text>
                  <Text variant="small" weight="bold">
                    20/10/2026 (14:00)
                  </Text>
                </View>
                <Icon name="arrow_forward" size={18} color={colors.outline} />
                <View style={styles.alignEnd}>
                  <Text variant="caption" color={colors.onSurfaceVariant}>
                    Trả phòng
                  </Text>
                  <Text variant="small" weight="bold">
                    22/10/2026 (12:00)
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.between}>
              <View>
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  Tổng thanh toán đã duyệt:
                </Text>
                <View style={styles.row}>
                  <Text variant="h3" weight="bold" color={colors.primary}>
                    2.250.000 ₫
                  </Text>
                  <Chip label="ANHNIEN250" tone="secondary" />
                </View>
              </View>
              <View style={styles.row}>
                <Icon name="check_circle" size={16} color={colors.tertiaryContainer} />
                <Text variant="small" weight="semibold" color={colors.tertiary}>
                  Thành công
                </Text>
              </View>
            </View>

            <Button label="Check-in" leadingIcon="qr_code_2" size="lg" onPress={() => router.push('/confirmation')} />
            <View style={styles.row}>
              <Button
                label="Chi tiết đơn"
                leadingIcon="description"
                variant="secondary"
                style={styles.flex}
                onPress={() => router.push('/confirmation')}
              />
              <Button label="Yêu cầu thay đổi / Hủy" leadingIcon="edit_calendar" variant="secondary" style={styles.flex} />
            </View>
          </View>
        </View>

        <View style={styles.protect}>
          <View style={styles.rowTop}>
            <View style={styles.shield}>
              <Icon name="verified_user" size={22} color={colors.white} />
            </View>
            <View style={[styles.flex, styles.gap4]}>
              <View style={styles.row}>
                <Text variant="label" weight="bold" color={colors.tertiary}>
                  StayReco Protect
                </Text>
                <Chip label="Cam kết 100%" tone="tertiary" />
              </View>
              <Text variant="small" color={colors.tertiary}>
                Bảo vệ quyền lợi đặt phòng 100%. Được hỗ trợ nhận phòng ngay lập tức hoặc đền bù phòng tương đương nếu có
                bất kỳ sự cố phát sinh.
              </Text>
            </View>
          </View>
          <View style={styles.dividerGreen} />
          <View style={styles.between}>
            <Text variant="small" color={colors.tertiary} style={styles.flex}>
              Cần trợ giúp khẩn cấp?
            </Text>
            <Pressable style={styles.call}>
              <Icon name="call" size={16} color={colors.white} />
              <Text variant="small" weight="bold" color={colors.white}>
                Gọi tổng đài: 1900 8899
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.vat}>
          <Text variant="small" color={colors.onSurfaceVariant} center>
            Bạn muốn xem thêm thông tin hóa đơn điện tử?
          </Text>
          <Text variant="small" weight="bold" color={colors.primary} center>
            Tải về hóa đơn VAT cho kỳ nghỉ
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 16, gap: 16, paddingBottom: 120 },
  flex: { flex: 1 },
  shrink: { flexShrink: 1 },
  gap4: { gap: 4 },
  alignEnd: { alignItems: 'flex-end' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  tabsWrap: { flexGrow: 0, flexShrink: 0, borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerHigh },
  tabs: { paddingHorizontal: 8 },
  tab: { paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.primary },
  card: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surfaceContainerLowest, ...shadow.card },
  pad: { padding: 16 },
  hotelIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryFixed,
  },
  cover: { width: '100%', height: 200 },
  dateTag: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  body: { gap: 12 },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: colors.secondaryFixed,
  },
  stay: { padding: 12, gap: 10, borderRadius: radius.md, backgroundColor: colors.surfaceContainerLow },
  divider: { height: 1, backgroundColor: colors.surfaceContainerHigh },
  protect: {
    padding: 16,
    gap: 12,
    borderRadius: radius.lg,
    backgroundColor: '#eaf5ee',
    borderWidth: 1,
    borderColor: colors.tertiaryFixed,
  },
  shield: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tertiary,
  },
  dividerGreen: { height: 1, backgroundColor: colors.tertiaryFixed },
  call: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.tertiary,
  },
  vat: { gap: 4, paddingVertical: 8 },
});
