import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
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
    <KeyboardAvoidingView className={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StaffScreen title={conv.guestName}>
        <Text variant="caption" color={colors.onSurfaceVariant}>
          {conv.channel} · {conv.roomNum}
        </Text>
        {conv.isEscalated && (
          <Banner icon="warning" tone="danger" title="AI Cảnh báo: Thái độ bức xúc" text="Khách đang phàn nàn gay gắt. Ưu tiên phản hồi và điều phối bộ phận liên quan ngay." />
        )}
        <Card style={{ gap: 8, padding: 12 }}>
          <KV label="Họ và tên" value={conv.guestName} strong />
          <KV label="Hạng khách" value={<Chip label="VIP Gold Member" tone="secondary" />} />
          <KV label="Số phòng hiện tại" value={conv.roomNum} />
        </Card>
        <Text variant="caption" color={colors.onSurfaceVariant} center>
          -- Bắt đầu hội thoại hôm nay 10:15 AM --
        </Text>
        {messages.map((m, i) => (
          <View key={i} className={`gap-1 ${m.mine ? 'items-end' : 'items-start'}`}>
            <View className={`max-w-[82%] rounded-[18px] px-3.5 py-2.5 ${m.mine ? 'rounded-br bg-primary' : 'rounded-bl border border-surface-container bg-surface-container-lowest'}`}>
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
          <View className="gap-2 rounded-lg border border-secondary-fixed bg-[#fff6ee] p-3">
            <View className={s.row}>
              <Icon name="auto_awesome" size={16} color={accent} />
              <Text variant="caption" weight="bold" color={accent}>
                AI gợi ý phản hồi
              </Text>
            </View>
            <Text variant="small" color="#3a2118">
              “{aiSuggestedResponse}”
            </Text>
            <View className={s.row}>
              <Button label="Bỏ qua" variant="secondary" size="sm" className={s.flex} onPress={() => setAiDraft(false)} />
              <Button label="Dùng gợi ý" size="sm" className={s.flex} style={{ backgroundColor: accent }} onPress={() => setInput(aiSuggestedResponse)} />
            </View>
          </View>
        )}
      </StaffScreen>
      <View className="flex-row items-end gap-2 border-t border-surface-container-high bg-surface-container-lowest px-3 pt-2.5" style={{ paddingBottom: insets.bottom + 10 }}>
        <Pressable accessibilityLabel="Tạo cảnh báo sự cố" onPress={() => router.push('/staff/alerts')} className="h-11 w-11 items-center justify-center rounded-full bg-surface-container-low">
          <Icon name="build" color={colors.primary} />
        </Pressable>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Nhập tin nhắn…"
          placeholderTextColor={colors.outline}
          accessibilityLabel="Tin nhắn"
          multiline
          className="max-h-[120px] min-h-11 flex-1 rounded-[22px] border border-outline-variant px-4 py-[11px] font-be-regular text-sm text-on-surface"
        />
        <Pressable accessibilityLabel="Gửi" onPress={send} disabled={!input.trim()} className="h-11 w-11 items-center justify-center rounded-full bg-primary" style={!input.trim() && { opacity: 0.5 }}>
          <Icon name="send" size={18} color={colors.onPrimary} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
