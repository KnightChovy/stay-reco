import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { conversations, inboxMatches, type Conversation, type InboxFilter } from '@/features/staff/data';
import { Avatar, FilterChips, StaffTabScreen, s } from '@/features/staff/ui';

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
            className="flex-row items-center gap-3 border-b border-surface-container-high py-3.5"
          >
            <View>
              <Avatar text={c.avatar} size={46} />
              <View className="absolute -bottom-1.5 -left-1 -right-1 items-center rounded-full border-2 border-surface bg-primary">
                <Text variant="caption" weight="bold" color={colors.onPrimary} style={{ fontSize: 9, lineHeight: 12 }}>
                  {c.channel}
                </Text>
              </View>
            </View>
            <View className={`gap-[3px] ${s.flex}`}>
              <View className={s.between}>
                <Text variant="label" weight="bold" className={s.flex} numberOfLines={1}>
                  {c.guestName}
                </Text>
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  {c.time}
                </Text>
              </View>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                {c.roomNum}
              </Text>
              <View className={s.row}>
                <Text variant="small" numberOfLines={1} className={s.flex}>
                  {c.lastMessage}
                </Text>
                {c.unreadCount > 0 && (
                  <View className="h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1.5">
                    <Text variant="caption" weight="bold" color={colors.onPrimary} style={{ fontSize: 9, lineHeight: 12 }}>
                      {c.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
              <View className={s.wrap}>
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
