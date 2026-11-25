import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { alerts as initialAlerts, type IncidentAlert, type Priority, type Tone } from '@/features/staff/data';
import { Card, FilterChips, Sheet, StaffScreen, accent, s } from '@/features/staff/ui';

type Filter = 'all' | 'khẩn cấp' | 'cao';
const priorityTone: Record<Priority, Tone> = { 'khẩn cấp': 'danger', cao: 'warning', 'bình thường': 'neutral' };
const statusTone: Record<IncidentAlert['status'], Tone> = { Mới: 'secondary', 'Đang xử lý': 'primary', 'Đã giải quyết': 'tertiary' };
const priorities: Priority[] = ['bình thường', 'cao', 'khẩn cấp'];

export default function StaffAlertsScreen() {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [filter, setFilter] = useState<Filter>('all');
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [room, setRoom] = useState('');
  const [priority, setPriority] = useState<Priority>('khẩn cấp');
  const [error, setError] = useState('');

  const list = filter === 'all' ? alerts : alerts.filter((a) => a.priority === filter);
  const resolve = (id: string) => setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'Đã giải quyết' } : a)));

  const create = () => {
    if (!title.trim() || !room.trim()) {
      setError('Nhập tiêu đề sự cố và số phòng ảnh hưởng.');
      return;
    }
    // Cùng bản ghi mặc định như form tạo cảnh báo bên web.
    setAlerts((prev) => [
      {
        id: `ALT-${Date.now()}`,
        roomNum: room.trim(),
        guestName: 'Khách tại quầy',
        title: title.trim(),
        category: 'Kỹ thuật',
        priority,
        description: 'Ghi nhận sự cố khẩn cấp từ nhân viên ca trực.',
        aiSuggestedFix: 'Thông báo trưởng ca Lễ tân và cử kỹ thuật xử lý ngay.',
        assignedDept: 'Bộ phận Kỹ thuật',
        status: 'Mới',
        timeAgo: 'Vừa xong',
      },
      ...prev,
    ]);
    setCreating(false);
    setTitle('');
    setRoom('');
    setError('');
  };

  return (
    <StaffScreen title="Cảnh báo & sự cố" right={<Button label="Báo sự cố" leadingIcon="add" variant="ghost" size="sm" onPress={() => setCreating(true)} />}>
      <FilterChips
        items={[
          { key: 'all', label: `Tất cả (${alerts.length})` },
          { key: 'khẩn cấp', label: `Khẩn cấp (${alerts.filter((a) => a.priority === 'khẩn cấp').length})` },
          { key: 'cao', label: `Cao (${alerts.filter((a) => a.priority === 'cao').length})` },
        ]}
        value={filter}
        onChange={setFilter}
      />
      {list.map((a) => (
        <Card key={a.id}>
          <View className={s.between}>
            <View className={s.wrap}>
              <Chip label={`Ưu tiên ${a.priority}`} tone={priorityTone[a.priority]} />
              <Chip label={a.status} tone={statusTone[a.status]} />
            </View>
            <Text variant="caption" color={colors.onSurfaceVariant}>
              {a.timeAgo}
            </Text>
          </View>
          <Text variant="label" weight="bold">
            {a.title}
          </Text>
          <Text variant="small" color={colors.onSurfaceVariant}>
            Chi tiết sự cố: {a.description}
          </Text>
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Phòng: {a.roomNum} · Khách: {a.guestName} · {a.category}
          </Text>
          <View className="flex-row gap-2 rounded-md bg-[#fff6ee] p-2.5">
            <Icon name="auto_awesome" size={16} color={accent} />
            <Text variant="caption" color="#3a2118" className={s.flex}>
              {a.aiSuggestedFix}
            </Text>
          </View>
          <View className={s.between}>
            <Text variant="caption" color={colors.onSurfaceVariant} className={s.flex}>
              Phân công: {a.assignedDept}
            </Text>
            {a.status !== 'Đã giải quyết' && <Button label="Đã giải quyết" leadingIcon="check" variant="muted" size="sm" onPress={() => resolve(a.id)} />}
          </View>
        </Card>
      ))}

      <Sheet visible={creating} onClose={() => setCreating(false)} title="Báo sự cố mới">
        <Input label="Tiêu đề sự cố" value={title} onChangeText={setTitle} placeholder="Ví dụ: Rò nước bồn rửa phòng tắm" />
        <Input label="Số phòng ảnh hưởng" value={room} onChangeText={setRoom} placeholder="Ví dụ: P.402" />
        <View className="gap-2">
          <Text variant="label" weight="semibold">
            Mức độ ưu tiên
          </Text>
          <View className={s.row}>
            {priorities.map((p) => {
              const on = p === priority;
              return (
                <Pressable
                  key={p}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  onPress={() => setPriority(p)}
                  className={`min-h-11 flex-1 items-center justify-center rounded-md ${on ? 'border-2 border-[#8c0009] bg-error-container' : 'border border-outline-variant'}`}
                >
                  <Text variant="small" weight="semibold" color={on ? '#8c0009' : colors.onSurface}>
                    {p[0].toUpperCase() + p.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        {!!error && (
          <Text variant="small" color={colors.error}>
            {error}
          </Text>
        )}
        <View className={s.row}>
          <Button label="Hủy" variant="secondary" className={s.flex} onPress={() => setCreating(false)} />
          <Button label="Phát cảnh báo" leadingIcon="send" className={s.flex} style={{ backgroundColor: colors.error }} onPress={create} />
        </View>
      </Sheet>
    </StaffScreen>
  );
}
