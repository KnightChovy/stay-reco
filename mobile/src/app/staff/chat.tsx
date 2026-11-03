import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors, fonts, radius } from '@/constants/theme';
import { aiSuggestedResponse, conversations, staffReply } from '@/features/staff/data';
import { Banner, Card, KV, StaffScreen, accent, s } from '@/features/staff/ui';

type Message = { text: string; mine: boolean; meta: string };

export default function StaffChatScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const conv = conversations.find((c) => c.id === id) ?? conversations[0];
  // shortcut: hội thoại mẫu giống web (cùng một luồng cho mọi khách); tin gửi chỉ lưu trong màn, chưa có API hộp thư.
  const [messages, setMessages] = useState<Message[]>([
    { text: conv.lastMessage, mine: false, meta: conv.time },
    { text: staffReply, mine: true, meta: '10:16 · Đã gửi' },
  ]);
  const [input, setInput] = useState('');
  const [aiDraft, setAiDraft] = useState(conv.sentiment === 'bức xúc');

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { text, mine: true, meta: 'Vừa xong · Đã gửi' }]);
    setInput('');
  };

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StaffScreen title={conv.guestName}>
        <Text variant="caption" color={colors.onSurfaceVariant}>
          {conv.channel} · {conv.roomNum}
        </Text>
        {conv.isEscalated && (
          <Banner icon="warning" tone="danger" title="AI Cảnh báo: Thái độ bức xúc" text="Khách đang phàn nàn gay gắt. Ưu tiên phản hồi và điều phối bộ phận liên quan ngay." />
        )}
        <Card style={styles.info}>
          <KV label="Họ và tên" value={conv.guestName} strong />
          <KV label="Hạng khách" value={<Chip label="VIP Gold Member" tone="secondary" />} />
          <KV label="Số phòng hiện tại" value={conv.roomNum} />
        </Card>
        <Text variant="caption" color={colors.onSurfaceVariant} center>
          -- Bắt đầu hội thoại hôm nay 10:15 AM --
        </Text>
        {messages.map((m, i) => (
          <View key={i} style={[styles.msgWrap, m.mine && styles.mineWrap]}>
            <View style={[styles.bubble, m.mine ? styles.mine : styles.theirs]}>
              <Text variant="small" color={m.mine ? colors.onPrimary : colors.onSurface}>
                {m.text}
              </Text>
            </View>
            <Text variant="caption" color={colors.onSurfaceVariant}>
              {m.meta}
            </Text>
          </View>
        ))}
        {aiDraft && (
          <View style={styles.ai}>
            <View style={s.row}>
              <Icon name="auto_awesome" size={16} color={accent} />
              <Text variant="caption" weight="bold" color={accent}>
                AI gợi ý phản hồi
              </Text>
            </View>
            <Text variant="small" color="#3a2118">
              “{aiSuggestedResponse}”
            </Text>
            <View style={s.row}>
              <Button label="Bỏ qua" variant="secondary" size="sm" style={s.flex} onPress={() => setAiDraft(false)} />
              <Button label="Dùng gợi ý" size="sm" style={[s.flex, { backgroundColor: accent }]} onPress={() => setInput(aiSuggestedResponse)} />
            </View>
          </View>
        )}
      </StaffScreen>
      <View style={[styles.composer, { paddingBottom: insets.bottom + 10 }]}>
        <Pressable accessibilityLabel="Tạo cảnh báo sự cố" onPress={() => router.push('/staff/alerts')} style={styles.tool}>
          <Icon name="build" color={colors.primary} />
        </Pressable>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Nhập tin nhắn…"
          placeholderTextColor={colors.outline}
          accessibilityLabel="Tin nhắn"
          multiline
          style={styles.input}
        />
        <Pressable accessibilityLabel="Gửi" onPress={send} disabled={!input.trim()} style={[styles.send, !input.trim() && { opacity: 0.5 }]}>
          <Icon name="send" size={18} color={colors.onPrimary} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  info: { gap: 8, padding: 12 },
  msgWrap: { alignItems: 'flex-start', gap: 4 },
  mineWrap: { alignItems: 'flex-end' },
  bubble: { maxWidth: '82%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  mine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  theirs: { backgroundColor: colors.surfaceContainerLowest, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.surfaceContainer },
  ai: { gap: 8, padding: 12, borderRadius: radius.lg, backgroundColor: '#fff6ee', borderWidth: 1, borderColor: colors.secondaryFixed },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingTop: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
  },
  tool: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceContainerLow },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.onSurface,
  },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
});
