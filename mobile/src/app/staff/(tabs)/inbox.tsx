import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { conversations, inboxMatches, type Conversation, type InboxFilter } from '@/features/staff/data';
import { Avatar, FilterChips, StaffTabScreen, accent, s } from '@/features/staff/ui';

const filters: { key: InboxFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'complaint', label: 'Khiếu nại' },
  { key: 'direct', label: 'Trực tiếp / Zalo' },
  { key: 'ota', label: 'OTA' },
];

const statusTone: Record<Conversation['status'], 'warning' | 'primary' | 'tertiary'> = {
  'Chờ phản hồi': 'warning',
  'Đang xử lý': 'primary',
  'Đã giải quyết': 'tertiary',
};

export default function StaffInboxScreen() {
  const [filter, setFilter] = useState<InboxFilter>('all');
  const list = conversations.filter(inboxMatches[filter]);

  return (
    <StaffTabScreen>
      <Text variant="h1">Hộp thư & Khiếu nại</Text>
      <FilterChips
        items={filters.map((f) => ({ ...f, label: `${f.label} (${conversations.filter(inboxMatches[f.key]).length})` }))}
        value={filter}
        onChange={setFilter}
      />
      <View>
        {list.map((c) => (
          <Pressable
            key={c.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/staff/chat', params: { id: c.id } })}
            style={styles.item}
          >
            <View>
              <Avatar text={c.avatar} size={46} />
              <View style={styles.channel}>
                <Text variant="caption" weight="bold" color={colors.onPrimary} style={styles.channelText}>
                  {c.channel}
                </Text>
              </View>
            </View>
            <View style={[s.flex, styles.body]}>
              <View style={s.between}>
                <Text variant="label" weight="bold" style={s.flex} numberOfLines={1}>
                  {c.guestName}
                </Text>
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  {c.time}
                </Text>
              </View>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                {c.roomNum}
              </Text>
              <View style={s.row}>
                <Text variant="small" numberOfLines={1} style={s.flex}>
                  {c.lastMessage}
                </Text>
                {c.unreadCount > 0 && (
                  <View style={styles.unread}>
                    <Text variant="caption" weight="bold" color={colors.onPrimary} style={styles.channelText}>
                      {c.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
              <View style={s.wrap}>
                <Chip label={c.status} tone={statusTone[c.status]} />
                {c.sentiment === 'bức xúc' && <Chip label="AI: Thái độ bức xúc" icon="warning" tone="danger" />}
              </View>
            </View>
            <Icon name="chevron_right" size={18} color={colors.outline} />
          </Pressable>
        ))}
      </View>
    </StaffTabScreen>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: 12, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerHigh },
  body: { gap: 3 },
  channel: { position: 'absolute', bottom: -6, left: -4, right: -4, alignItems: 'center', borderRadius: 999, backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.surface },
  channelText: { fontSize: 9, lineHeight: 12 },
  unread: { minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: accent },
});
