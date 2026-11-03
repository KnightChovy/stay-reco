import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { colors, fonts, radius } from '@/constants/theme';
import { aiPolish, draftBody, draftTitle, promoOffers, tones } from '@/features/staff/data';
import { Avatar, Card, StaffScreen, accent, s, success } from '@/features/staff/ui';

function Choice({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.choice}>
      <Text variant="label" weight="semibold">
        {label}
      </Text>
      <View style={s.wrap}>
        {options.map((o) => (
          <Chip key={o} label={o} tone={o === value ? 'selected' : 'outline'} onPress={() => onChange(o)} />
        ))}
      </View>
    </View>
  );
}

export default function StaffMarketingEditorScreen() {
  const [tone, setTone] = useState(tones[0]);
  const [promo, setPromo] = useState(promoOffers[0]);
  const [title, setTitle] = useState(draftTitle);
  const [body, setBody] = useState(draftBody);
  const [generating, setGenerating] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  // Giống web: mô phỏng AI viết lại sau 600ms, chưa gọi API AI thật.
  const polish = (type: keyof typeof aiPolish) => {
    setGenerating(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setBody(aiPolish[type]);
      setGenerating(false);
    }, 600);
  };

  const length = body.length;
  const ideal = length >= 120 && length <= 400;

  return (
    <StaffScreen
      title="Soạn & duyệt nội dung AI"
      footer={
        <>
          <Button label="Thư viện" variant="secondary" style={s.flex} onPress={() => router.back()} />
          <Button label="Duyệt & lên lịch" leadingIcon="check_circle" style={[s.flex, { backgroundColor: accent }]} onPress={() => router.push('/staff/marketing/calendar')} />
        </>
      }
    >
      <Card>
        <View style={s.row}>
          <Icon name="smart_toy" size={18} color={accent} />
          <Text variant="h3">Cấu hình gợi ý AI</Text>
        </View>
        <Choice label="Phong cách giọng văn (Tone)" options={tones} value={tone} onChange={setTone} />
        <Choice label="Gói ưu đãi đính kèm" options={promoOffers} value={promo} onChange={setPromo} />
      </Card>

      <Card>
        <View style={s.between}>
          <Text variant="h3">Nội dung</Text>
          <Chip label="Đã lưu tự động" icon="cloud_done" tone="tertiary" />
        </View>
        <Input label="Tiêu đề bài viết (Headline)" value={title} onChangeText={setTitle} />
        <View style={styles.choice}>
          <Text variant="label" weight="semibold">
            Nội dung chi tiết (Caption)
          </Text>
          <TextInput value={body} onChangeText={setBody} multiline accessibilityLabel="Nội dung chi tiết" style={styles.area} />
          <View style={s.between}>
            <Text variant="caption" color={colors.onSurfaceVariant}>
              {length} ký tự
            </Text>
            <Text variant="caption" weight="semibold" color={ideal ? success : '#7a4600'}>
              {ideal ? 'Độ dài lý tưởng' : length < 120 ? 'Hơi ngắn' : 'Hơi dài'}
            </Text>
          </View>
        </View>
        <View style={s.wrap}>
          <Button label="Rút ngắn" leadingIcon="auto_awesome" variant="muted" size="sm" disabled={generating} onPress={() => polish('short')} />
          <Button label="Hấp dẫn hơn" leadingIcon="auto_awesome" variant="muted" size="sm" disabled={generating} onPress={() => polish('engaging')} />
          <Button label="Thêm Emoji & Hashtag" leadingIcon="auto_awesome" variant="muted" size="sm" disabled={generating} onPress={() => polish('emoji')} />
        </View>
        {generating && <ActivityIndicator color={accent} />}
      </Card>

      <Text variant="h3">Xem trước bài đăng</Text>
      <Card>
        <View style={s.row}>
          <Avatar text="A" size={36} bg={colors.primary} fg={colors.onPrimary} />
          <View>
            <Text variant="small" weight="bold">
              An Nhiên Riverside Hotel
            </Text>
            <Text variant="caption" color={colors.onSurfaceVariant}>
              Được tài trợ · {tone}
            </Text>
          </View>
        </View>
        <Text variant="small" weight="bold">
          {title}
        </Text>
        <Text variant="small">{body}</Text>
        <Chip label={promo} icon="card_giftcard" tone="secondary" />
        <View style={s.between}>
          <Text variant="caption" color={colors.onSurfaceVariant}>
            142 Thích
          </Text>
          <Text variant="caption" color={colors.onSurfaceVariant}>
            28 Bình luận
          </Text>
          <Text variant="caption" color={colors.onSurfaceVariant}>
            12 Chia sẻ
          </Text>
        </View>
      </Card>
    </StaffScreen>
  );
}

const styles = StyleSheet.create({
  choice: { gap: 8 },
  area: {
    minHeight: 160,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
    backgroundColor: colors.surfaceContainerLowest,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.onSurface,
    textAlignVertical: 'top',
  },
});
