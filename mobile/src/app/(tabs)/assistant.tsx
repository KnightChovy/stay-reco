import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ASSISTANT_MESSAGE_MAX, type AssistantReply, type Conversation } from '@stayreco/shared';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { AssistantAvatar, MessageRow, STARTERS, TypingBubble, UserBubble, type StayDates } from '@/features/assistant/chat-parts';
import { useVoiceInput } from '@/features/assistant/use-voice-input';
import { Sheet } from '@/features/staff/ui';
import {
  chatErrorMessage,
  confirmProposal,
  getConversation,
  getConversations,
  isConversationNotFound,
  sendMessage,
  startConversation,
} from '@/services/assistant.service';
import { useAuthStore } from '@/stores/auth.store';

const keys = {
  list: ['assistant', 'conversations'] as const,
  one: (id: string) => ['assistant', 'conversation', id] as const,
};

function CenteredNotice({ title, text, action }: { title: string; text: string; action?: { label: string; onPress: () => void } }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8">
      <AssistantAvatar size={56} />
      <Text variant="h3" weight="bold" center>
        {title}
      </Text>
      <Text variant="small" color={colors.onSurfaceVariant} center>
        {text}
      </Text>
      {action && <Button label={action.label} leadingIcon="login" onPress={action.onPress} />}
    </View>
  );
}

export default function AssistantScreen() {
  const insets = useSafeAreaInsets();
  const account = useAuthStore((s) => s.account);
  const hydrating = useAuthStore((s) => s.hydrating);
  const isCustomer = account?.role === 'CUSTOMER';
  const queryClient = useQueryClient();

  // undefined: chưa chọn → mở cuộc gần nhất; null: cuộc mới.
  const [chosenId, setChosenId] = useState<string | null | undefined>(undefined);
  const [draft, setDraft] = useState('');
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const scroll = useRef<ScrollView>(null);
  const voice = useVoiceInput(draft, setDraft);

  // Đề xuất hết hạn sau 30 phút: đọc lại đồng hồ thỉnh thoảng thay vì mỗi lần render.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const conversations = useQuery({ queryKey: keys.list, queryFn: getConversations, enabled: isCustomer, staleTime: 30_000 });
  const candidateId = chosenId !== undefined ? chosenId : (conversations.data?.[0]?.id ?? null);
  const conversation = useQuery({
    queryKey: keys.one(candidateId ?? ''),
    queryFn: () => getConversation(candidateId!),
    enabled: isCustomer && !!candidateId,
    retry: false,
  });
  // Cuộc trò chuyện không còn (hoặc của tài khoản khác) thì coi như chưa mở cuộc nào.
  const activeId = conversation.error && isConversationNotFound(conversation.error) ? null : candidateId;
  const messages = useMemo(() => (activeId ? (conversation.data?.messages ?? []) : []), [activeId, conversation.data]);

  const dates: StayDates = useMemo(() => {
    const p = [...messages].reverse().find((m) => m.proposal)?.proposal;
    return p ? { checkIn: p.checkIn, checkOut: p.checkOut, guests: p.guests, rooms: p.rooms } : null;
  }, [messages]);

  const send = useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string | null; content: string }) =>
      conversationId ? sendMessage(conversationId, content) : startConversation(content),
    onSuccess: (reply: AssistantReply) => {
      // Ghi thẳng câu trả lời vào cache, không đọc lại.
      queryClient.setQueryData<Conversation>(keys.one(reply.conversationId), (current) =>
        current
          ? { ...current, messages: [...current.messages, reply.message, reply.reply], updatedAt: reply.reply.createdAt }
          : {
              id: reply.conversationId,
              status: 'OPEN',
              preview: reply.message.content.slice(0, 120),
              createdAt: reply.message.createdAt,
              updatedAt: reply.reply.createdAt,
              messages: [reply.message, reply.reply],
            },
      );
      void queryClient.invalidateQueries({ queryKey: keys.list });
    },
  });

  const confirm = useMutation({
    mutationFn: ({ conversationId, proposalId }: { conversationId: string; proposalId: string }) => confirmProposal(conversationId, proposalId),
    onSuccess: (booking, { conversationId }) => {
      void queryClient.invalidateQueries({ queryKey: keys.one(conversationId) });
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      router.push({ pathname: '/booking/payment', params: { id: booking.id } });
    },
    onError: (e) => setError(chatErrorMessage(e)),
  });

  const sendText = (raw: string) => {
    const content = raw.trim();
    if (!content || send.isPending) return;
    voice.cancel();
    setError(null);
    setPendingText(content);
    setDraft('');
    send.mutate(
      { conversationId: activeId, content },
      {
        onSuccess: (reply) => {
          setPendingText(null);
          setChosenId(reply.conversationId);
        },
        onError: (e) => {
          // Chưa có gì được lưu: trả lại chữ để khách gửi lại.
          setPendingText(null);
          setDraft(content);
          setError(chatErrorMessage(e));
        },
      },
    );
  };

  const openConversation = (id: string | null) => {
    setChosenId(id);
    setError(null);
    setHistoryOpen(false);
  };

  if (!isCustomer) {
    return (
      <View className="flex-1 bg-surface">
        <AppHeader subtitle="Trợ Lý AI" />
        {hydrating ? (
          <CenteredNotice title="Đang tải…" text="Đang khôi phục phiên đăng nhập." />
        ) : account ? (
          <CenteredNotice title="Chỉ dành cho khách hàng" text="Trợ lý đặt phòng chỉ dùng được với tài khoản khách hàng." />
        ) : (
          <CenteredNotice
            title="Đăng nhập để trò chuyện"
            text="Trợ lý tìm phòng còn trống, so sánh giá và chuẩn bị đơn đặt cho bạn."
            action={{ label: 'Đăng nhập', onPress: () => router.push('/login') }}
          />
        )}
      </View>
    );
  }

  const loadingThread = !!activeId && conversation.isPending;
  const empty = !loadingThread && messages.length === 0 && !pendingText;

  return (
    <KeyboardAvoidingView className="flex-1 bg-surface" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppHeader subtitle="Trợ Lý AI" />
      <View className="flex-row items-center justify-between px-4 py-1.5">
        <View className="flex-1 flex-row items-center gap-1.5">
          <AssistantAvatar size={40} />
          <View className="flex-1">
            <Text variant="label" weight="bold" color={colors.primary}>
              Trợ lý AI StayReco
            </Text>
            <Text variant="caption" color={colors.onSurfaceVariant} numberOfLines={1}>
              Bạn luôn là người xác nhận đặt phòng
            </Text>
          </View>
        </View>
        <View className="flex-row gap-1">
          <Pressable accessibilityRole="button" accessibilityLabel="Lịch sử trò chuyện" onPress={() => setHistoryOpen(true)} className="h-10 w-10 items-center justify-center rounded-md">
            <Icon name="history" size={22} color={colors.primary} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Cuộc trò chuyện mới" onPress={() => openConversation(null)} className="h-10 w-10 items-center justify-center rounded-md">
            <Icon name="add_comment" size={22} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scroll}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
        contentContainerClassName="gap-3 p-4 pb-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {loadingThread && (
          <Text variant="small" color={colors.onSurfaceVariant} center>
            Đang tải cuộc trò chuyện…
          </Text>
        )}
        {conversation.isError && !isConversationNotFound(conversation.error) && (
          <View className="items-center gap-2">
            <Text variant="small" color={colors.error} center>
              Không tải được cuộc trò chuyện.
            </Text>
            <Button label="Thử lại" variant="secondary" size="sm" onPress={() => void conversation.refetch()} />
          </View>
        )}
        {empty && (
          <View className="items-center gap-4 py-4">
            <AssistantAvatar size={56} />
            <View className="gap-1">
              <Text variant="h3" weight="bold" center>
                Xin chào {account?.fullName ?? ''}!
              </Text>
              <Text variant="small" color={colors.onSurfaceVariant} center>
                Mình là trợ lý đặt phòng của StayReco: tìm phòng còn trống, so sánh giá và chuẩn bị đơn đặt cho bạn.
              </Text>
            </View>
            <View className="w-full gap-2">
              {STARTERS.map((text) => (
                <Pressable
                  key={text}
                  accessibilityRole="button"
                  onPress={() => sendText(text)}
                  className="min-h-11 flex-row items-center justify-between gap-2 rounded-lg bg-surface-container-lowest px-3.5 py-2.5 shadow-card"
                >
                  <Text variant="small" weight="medium" color={colors.primary} className="flex-1">
                    {text}
                  </Text>
                  <Icon name="north_east" size={14} color={colors.onSurfaceVariant} />
                </Pressable>
              ))}
            </View>
          </View>
        )}
        {messages.map((m) => (
          <MessageRow
            key={m.id}
            message={m}
            dates={dates}
            now={now}
            confirmingId={confirm.isPending ? (confirm.variables?.proposalId ?? null) : null}
            onConfirm={(proposalId) => activeId && !confirm.isPending && confirm.mutate({ conversationId: activeId, proposalId })}
          />
        ))}
        {pendingText && (
          <>
            <UserBubble text={pendingText} note="Đang gửi…" />
            <TypingBubble />
          </>
        )}
      </ScrollView>

      {!!error && (
        <Pressable accessibilityRole="alert" onPress={() => setError(null)} className="mx-4 mb-2 rounded-md bg-error-container p-3">
          <Text variant="small" color={colors.error}>
            {error}
          </Text>
        </Pressable>
      )}
      <View className="mx-4 flex-row items-end gap-1.5 rounded-xl bg-surface-container-lowest p-1.5 shadow-floating" style={{ marginBottom: Math.max(insets.bottom, 12) + 84 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={voice.listening ? 'Dừng nghe' : 'Nói câu hỏi'}
          accessibilityState={{ selected: voice.listening }}
          onPress={voice.toggle}
          className={`h-10 w-10 items-center justify-center rounded-md ${voice.listening ? 'bg-error-container' : ''}`}
        >
          <Icon name="mic" size={22} color={voice.listening ? colors.error : colors.onSurfaceVariant} />
        </Pressable>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          multiline
          maxLength={ASSISTANT_MESSAGE_MAX}
          placeholder={voice.listening ? 'Đang nghe, bạn nói đi...' : 'Nhắn cho trợ lý...'}
          placeholderTextColor={colors.outline}
          accessibilityLabel="Tin nhắn cho trợ lý"
          className="max-h-28 flex-1 py-2.5 font-be-regular text-[15px] text-on-surface"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Gửi"
          accessibilityState={{ disabled: send.isPending || !draft.trim() }}
          disabled={send.isPending || !draft.trim()}
          onPress={() => sendText(draft)}
          className={`h-11 w-11 items-center justify-center rounded-md bg-primary ${send.isPending || !draft.trim() ? 'opacity-50' : ''}`}
        >
          <Icon name="send" size={20} color={colors.white} />
        </Pressable>
      </View>

      <Sheet visible={historyOpen} onClose={() => setHistoryOpen(false)} title="Các cuộc trò chuyện">
        <Button label="Cuộc trò chuyện mới" leadingIcon="add_comment" variant="secondary" onPress={() => openConversation(null)} />
        {conversations.isPending ? (
          <Text variant="small" color={colors.onSurfaceVariant}>
            Đang tải lịch sử…
          </Text>
        ) : conversations.isError ? (
          <Text variant="small" color={colors.error}>
            Không tải được lịch sử trò chuyện.
          </Text>
        ) : conversations.data.length === 0 ? (
          <Text variant="small" color={colors.onSurfaceVariant}>
            Chưa có cuộc trò chuyện nào.
          </Text>
        ) : (
          conversations.data.map((c) => (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityState={{ selected: c.id === activeId }}
              onPress={() => openConversation(c.id)}
              className={`gap-0.5 rounded-md p-3 ${c.id === activeId ? 'bg-primary-fixed' : 'bg-surface-container-low'}`}
            >
              <Text variant="caption" color={colors.onSurfaceVariant}>
                {new Date(c.updatedAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
              </Text>
              <Text variant="small" numberOfLines={2}>
                {c.preview}
              </Text>
            </Pressable>
          ))
        )}
      </Sheet>
    </KeyboardAvoidingView>
  );
}
