import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
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
    <View className="items-end">
      <View className="max-w-[85%] rounded-xl rounded-br-sm bg-primary p-3.5">
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
    <KeyboardAvoidingView className="flex-1 bg-surface" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppHeader subtitle="Trợ Lý AI" />
      <View className="flex-row items-center justify-between px-4 py-1.5">
        <View className="flex-row items-center gap-1.5">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-container">
            <Icon name="auto_awesome" size={20} color={colors.white} />
          </View>
          <View>
            <Text variant="label" weight="bold" color={colors.primary}>
              StayReco Intelligence
            </Text>
            <View className="flex-row items-center gap-1.5">
              <View className="h-2 w-2 rounded-full bg-[#35a35a]" />
              <Text variant="caption" color={colors.onSurfaceVariant}>
                Sẵn sàng 24/7
              </Text>
            </View>
          </View>
        </View>
        <Button label="Gặp lễ tân" leadingIcon="support_agent" variant="muted" size="sm" />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="shrink-0 grow-0" contentContainerClassName="gap-2 px-4 py-2">
        {context.map((c, i) => (
          <Chip key={c.label} label={c.label} icon={c.icon} tone={i === 0 ? 'selected' : 'neutral'} />
        ))}
      </ScrollView>

      <ScrollView contentContainerClassName="gap-3 p-4 pb-6" showsVerticalScrollIndicator={false}>
        <Chip label="Hôm nay, 14:32" tone="neutral" style={{ alignSelf: 'center' }} />
        <UserBubble text={firstQuestion} />
        <Text variant="caption" color={colors.onSurfaceVariant} className="text-right">
          14:32 · Đã xem
        </Text>

        <View className="flex-row gap-2.5">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-primary-container">
            <Icon name="auto_awesome" size={16} color={colors.white} />
          </View>
          <View className="flex-1 gap-3">
            <View className="rounded-xl rounded-tl-sm bg-surface-container-lowest p-3.5 shadow-card">
              <Text variant="body">
                Chào bạn{' '}
                <Text variant="body" weight="bold" color={colors.primary}>
                  Minh Anh
                </Text>
                ! Dựa trên ngân sách 2,5 triệu và gu yên tĩnh ven sông Hàn, mình gợi ý 2 nơi nghỉ dưỡng được thẩm định chất
                lượng chuẩn nhất:
              </Text>
            </View>

            <View className="overflow-hidden rounded-lg bg-surface-container-lowest shadow-card">
              <View className="h-[170px] justify-end">
                <Image source={images.aiCard} className="absolute inset-0" contentFit="cover" />
                <View className="absolute inset-0 bg-black/30" />
                <View className="absolute flex-row items-center gap-1 rounded-full px-2.5 py-1 left-2.5 top-2.5 bg-white/[0.92]">
                  <Icon name="verified" size={14} color={colors.secondary} />
                  <Text variant="caption" weight="bold">
                    Phù hợp 98%
                  </Text>
                </View>
                <View className="absolute flex-row items-center gap-1 rounded-full px-2.5 py-1 right-2.5 top-2.5 bg-black/[0.55]">
                  <Icon name="star" size={14} color="#f5c04a" />
                  <Text variant="caption" weight="bold" color={colors.white}>
                    4.8 (340)
                  </Text>
                </View>
                <View className="p-3">
                  <Text variant="caption" weight="semibold" color={colors.white}>
                    BOUTIQUE HOTEL · HẢI CHÂU
                  </Text>
                  <Text variant="h3" weight="bold" color={colors.white}>
                    An Nhiên Riverside Hotel
                  </Text>
                </View>
              </View>
              <View className="gap-2.5 p-3.5">
                <View className="flex-row items-center justify-between gap-2">
                  <View className="flex-row items-center gap-1.5">
                    <Icon name="king_bed" size={16} color={colors.primaryContainer} />
                    <Text variant="small" weight="semibold">
                      Phòng Deluxe River View
                    </Text>
                  </View>
                  <Chip label="32m² · Tầng cao" tone="neutral" />
                </View>
                <View className="flex-row items-center gap-1.5">
                  <View className="flex-1 flex-row items-center gap-1.5 rounded-md bg-surface-container-low p-2">
                    <Icon name="balcony" size={16} color={colors.onSurfaceVariant} />
                    <Text variant="caption" numberOfLines={1} className="shrink">
                      Ban công sông Hàn
                    </Text>
                  </View>
                  <View className="flex-1 flex-row items-center gap-1.5 rounded-md bg-surface-container-low p-2">
                    <Icon name="volume_off" size={16} color={colors.onSurfaceVariant} />
                    <Text variant="caption" numberOfLines={1} className="shrink">
                      Cách âm 2 lớp chống ồn
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center justify-between gap-2 rounded-md bg-surface-container-low p-3">
                  <View className="flex-1">
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

            <View className="flex-row gap-2 rounded-md bg-surface-container-low p-3">
              <Icon name="tips_and_updates" size={18} color={colors.onSurfaceVariant} />
              <Text variant="small" color={colors.onSurfaceVariant} className="flex-1">
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

        <View className="gap-2">
          <View className="flex-row items-center gap-1.5">
            <Icon name="psychology_alt" size={16} color={colors.onSurfaceVariant} />
            <Text variant="small" color={colors.onSurfaceVariant}>
              Gợi ý câu hỏi nhanh:
            </Text>
          </View>
          {suggestions.map((s) => (
            <Pressable key={s} onPress={() => send(s)} className="flex-row items-center self-start gap-2 rounded-full bg-surface-container-lowest px-3.5 py-2 shadow-card">
              <Text variant="small" weight="medium" color={colors.primary}>
                {s}
              </Text>
              <Icon name="north_east" size={14} color={colors.onSurfaceVariant} />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View className="mx-4 flex-row items-center gap-1.5 rounded-xl bg-surface-container-lowest p-1.5 shadow-floating" style={{ marginBottom: Math.max(insets.bottom, 12) + 84 }}>
        <Pressable accessibilityLabel="Ghi âm" className="h-10 w-10 items-center justify-center">
          <Icon name="mic" size={22} color={colors.onSurfaceVariant} />
        </Pressable>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={() => send(draft)}
          placeholder="Nhập câu hỏi về chỗ nghỉ, dịch vụ..."
          placeholderTextColor={colors.outline}
          accessibilityLabel="Nhập câu hỏi"
          className="flex-1 py-2.5 font-be-regular text-[15px] text-on-surface"
        />
        <Pressable accessibilityLabel="Gửi" onPress={() => send(draft)} className="h-11 w-11 items-center justify-center rounded-md bg-primary">
          <Icon name="send" size={20} color={colors.white} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
