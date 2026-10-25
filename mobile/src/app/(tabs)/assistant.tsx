import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors, fonts, radius, shadow } from '@/constants/theme';
import { images } from '@/lib/mock-data';

const context: { label: string; icon: IconName }[] = [
  { label: 'Đà Nẵng', icon: 'location_on' },
  { label: '20/10 - 22/10 (2 đêm)', icon: 'calendar_today' },
  { label: '2 người lớn', icon: 'group' },
  { label: '~2.5 triệu', icon: 'payments' },
  { label: 'Gần sông / Yên tĩnh', icon: 'water' },
];

const suggestions = ['Có buffet chay không?', 'Khách sạn có xe đưa đón sân bay?', 'Cách Cầu Rồng bao xa?'];

const firstQuestion =
  'Mình muốn ở Đà Nẵng 2 đêm từ 20/10 đến 22/10, đi 2 người, thích không gian yên tĩnh ven sông Hàn, ngân sách khoảng 2,5 triệu tổng cộng. Có chỗ nào hợp gu không?';

function UserBubble({ text }: { text: string }) {
  return (
    <View style={styles.userWrap}>
      <View style={styles.userBubble}>
        <Text variant="body" weight="medium" color={colors.white}>
          {text}
        </Text>
      </View>
    </View>
  );
}

export default function AssistantScreen() {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  // shortcut: chỉ lưu tin nhắn người dùng cục bộ, chưa gọi API trợ lý AI.
  const [sent, setSent] = useState<string[]>([]);
  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setSent((prev) => [...prev, t]);
    setDraft('');
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppHeader subtitle="Trợ Lý AI" />
      <View style={styles.botBar}>
        <View style={styles.row}>
          <View style={styles.botAvatar}>
            <Icon name="auto_awesome" size={20} color={colors.white} />
          </View>
          <View>
            <Text variant="label" weight="bold" color={colors.primary}>
              StayReco Intelligence
            </Text>
            <View style={styles.row}>
              <View style={styles.online} />
              <Text variant="caption" color={colors.onSurfaceVariant}>
                Sẵn sàng 24/7
              </Text>
            </View>
          </View>
        </View>
        <Button label="Gặp lễ tân" leadingIcon="support_agent" variant="muted" size="sm" />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ctxWrap} contentContainerStyle={styles.ctx}>
        {context.map((c, i) => (
          <Chip key={c.label} label={c.label} icon={c.icon} tone={i === 0 ? 'selected' : 'neutral'} />
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Chip label="Hôm nay, 14:32" tone="neutral" style={styles.selfCenter} />
        <UserBubble text={firstQuestion} />
        <Text variant="caption" color={colors.onSurfaceVariant} style={styles.alignRight}>
          14:32 · Đã xem
        </Text>

        <View style={styles.botRow}>
          <View style={styles.botAvatarSm}>
            <Icon name="auto_awesome" size={16} color={colors.white} />
          </View>
          <View style={[styles.flex, styles.gap12]}>
            <View style={styles.botBubble}>
              <Text variant="body">
                Chào bạn{' '}
                <Text variant="body" weight="bold" color={colors.primary}>
                  Minh Anh
                </Text>
                ! Dựa trên ngân sách 2,5 triệu và gu yên tĩnh ven sông Hàn, mình gợi ý 2 nơi nghỉ dưỡng được thẩm định chất
                lượng chuẩn nhất:
              </Text>
            </View>

            <View style={styles.hotelCard}>
              <View style={styles.cover}>
                <Image source={images.aiCard} style={StyleSheet.absoluteFill} contentFit="cover" />
                <View style={styles.coverOverlay} />
                <View style={[styles.pill, styles.topLeft]}>
                  <Icon name="verified" size={14} color={colors.secondary} />
                  <Text variant="caption" weight="bold">
                    Phù hợp 98%
                  </Text>
                </View>
                <View style={[styles.pill, styles.topRight, styles.darkPill]}>
                  <Icon name="star" size={14} color="#f5c04a" />
                  <Text variant="caption" weight="bold" color={colors.white}>
                    4.8 (340)
                  </Text>
                </View>
                <View style={styles.coverText}>
                  <Text variant="caption" weight="semibold" color={colors.white}>
                    BOUTIQUE HOTEL · HẢI CHÂU
                  </Text>
                  <Text variant="h3" weight="bold" color={colors.white}>
                    An Nhiên Riverside Hotel
                  </Text>
                </View>
              </View>
              <View style={styles.hotelBody}>
                <View style={styles.between}>
                  <View style={styles.row}>
                    <Icon name="king_bed" size={16} color={colors.primaryContainer} />
                    <Text variant="small" weight="semibold">
                      Phòng Deluxe River View
                    </Text>
                  </View>
                  <Chip label="32m² · Tầng cao" tone="neutral" />
                </View>
                <View style={styles.row}>
                  <View style={styles.feature}>
                    <Icon name="balcony" size={16} color={colors.onSurfaceVariant} />
                    <Text variant="caption" numberOfLines={1} style={styles.shrink}>
                      Ban công sông Hàn
                    </Text>
                  </View>
                  <View style={styles.feature}>
                    <Icon name="volume_off" size={16} color={colors.onSurfaceVariant} />
                    <Text variant="caption" numberOfLines={1} style={styles.shrink}>
                      Cách âm 2 lớp chống ồn
                    </Text>
                  </View>
                </View>
                <View style={[styles.between, styles.priceBox]}>
                  <View style={styles.flex}>
                    <Text variant="h3" weight="bold" color={colors.primary}>
                      1.125.000 ₫{' '}
                      <Text variant="caption" color={colors.onSurfaceVariant}>
                        / đêm
                      </Text>
                    </Text>
                    <Text variant="caption" color={colors.secondary}>
                      Tổng 2 đêm: 2.250.000 ₫ (Đã áp mã ANHNIEN250)
                    </Text>
                  </View>
                  <Chip label="Tiết kiệm 250k" tone="tertiary" />
                </View>
                <Button
                  label="Xem phòng & Đặt ngay"
                  icon="arrow_forward"
                  // shortcut: trợ lý AI chưa có API (phase 4), gợi ý mẫu mở tìm kiếm thay vì một khách sạn cụ thể.
                  onPress={() => router.push({ pathname: '/search', params: { destination: 'Hội An' } })}
                />
                <Button
                  label="Hỏi thêm về khách sạn này"
                  leadingIcon="chat_bubble_outline"
                  variant="muted"
                  onPress={() => send('Cho mình hỏi thêm về An Nhiên Riverside Hotel')}
                />
              </View>
            </View>

            <View style={styles.tip}>
              <Icon name="tips_and_updates" size={18} color={colors.onSurfaceVariant} />
              <Text variant="small" color={colors.onSurfaceVariant} style={styles.flex}>
                Khách sạn cách cầu Rồng 700m nhưng nằm trong hẻm phong cách resort, đảm bảo yên tĩnh tuyệt đối về đêm cho 2
                bạn.
              </Text>
            </View>
            <Text variant="caption" color={colors.onSurfaceVariant}>
              StayReco Bot · 14:33
            </Text>
          </View>
        </View>

        {sent.map((t, i) => (
          <UserBubble key={`${i}-${t}`} text={t} />
        ))}

        <View style={styles.gap8}>
          <View style={styles.row}>
            <Icon name="psychology_alt" size={16} color={colors.onSurfaceVariant} />
            <Text variant="small" color={colors.onSurfaceVariant}>
              Gợi ý câu hỏi nhanh:
            </Text>
          </View>
          {suggestions.map((s) => (
            <Pressable key={s} onPress={() => send(s)} style={styles.suggestion}>
              <Text variant="small" weight="medium" color={colors.primary}>
                {s}
              </Text>
              <Icon name="north_east" size={14} color={colors.onSurfaceVariant} />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.composer, { marginBottom: Math.max(insets.bottom, 12) + 84 }]}>
        <Pressable accessibilityLabel="Ghi âm" style={styles.iconBtn}>
          <Icon name="mic" size={22} color={colors.onSurfaceVariant} />
        </Pressable>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={() => send(draft)}
          placeholder="Nhập câu hỏi về chỗ nghỉ, dịch vụ..."
          placeholderTextColor={colors.outline}
          accessibilityLabel="Nhập câu hỏi"
          style={styles.composerInput}
        />
        <Pressable accessibilityLabel="Gửi" onPress={() => send(draft)} style={styles.sendBtn}>
          <Icon name="send" size={20} color={colors.white} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 16, gap: 12, paddingBottom: 24 },
  flex: { flex: 1 },
  shrink: { flexShrink: 1 },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  selfCenter: { alignSelf: 'center' },
  alignRight: { textAlign: 'right' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  botBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  botAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryContainer,
  },
  online: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#35a35a' },
  ctxWrap: { flexGrow: 0, flexShrink: 0 },
  ctx: { gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  userWrap: { alignItems: 'flex-end' },
  userBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: radius.xl,
    borderBottomRightRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  botRow: { flexDirection: 'row', gap: 10 },
  botAvatarSm: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryContainer,
  },
  botBubble: {
    padding: 14,
    borderRadius: radius.xl,
    borderTopLeftRadius: radius.sm,
    backgroundColor: colors.surfaceContainerLowest,
    ...shadow.card,
  },
  hotelCard: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surfaceContainerLowest, ...shadow.card },
  cover: { height: 170, justifyContent: 'flex-end' },
  coverOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.3)' },
  coverText: { padding: 12 },
  pill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  darkPill: { backgroundColor: 'rgba(0,0,0,0.55)' },
  topLeft: { top: 10, left: 10 },
  topRight: { top: 10, right: 10 },
  hotelBody: { padding: 14, gap: 10 },
  feature: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLow,
  },
  priceBox: { padding: 12, borderRadius: radius.md, backgroundColor: colors.surfaceContainerLow },
  tip: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLow,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerLowest,
    ...shadow.card,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    padding: 6,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceContainerLowest,
    ...shadow.floating,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  composerInput: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.onSurface, paddingVertical: 10 },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
});
