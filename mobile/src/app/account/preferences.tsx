import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { AMENITIES, BUDGETS, PREF_KEYS, STYLES, splitList, toggle } from '@/features/recommendations/preference-options';
import { apiErrorMessage } from '@/services/ApiService';
import { getMyPreferences, getOnboarding, updateMyPreferences, type PreferenceMap } from '@/services/recommendations.service';

type Form = { styles: string[]; amenities: string[]; city: string; budget: string };

const toForm = (p: PreferenceMap): Form => ({
  styles: splitList(p[PREF_KEYS.styles]),
  amenities: splitList(p[PREF_KEYS.amenities]),
  city: p[PREF_KEYS.city] ?? '',
  budget: p[PREF_KEYS.budget] ?? '',
});

/** Giá trị rỗng gửi `null` để xoá key thay vì lưu chuỗi rỗng. */
const toPayload = (f: Form): Record<string, string | null> => ({
  [PREF_KEYS.styles]: f.styles.length ? f.styles.join(',') : null,
  [PREF_KEYS.amenities]: f.amenities.length ? f.amenities.join(',') : null,
  [PREF_KEYS.city]: f.city.trim() || null,
  [PREF_KEYS.budget]: f.budget || null,
});

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

function PreferencesForm({ initial }: { initial: Form }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initial);
  const save = useMutation({
    mutationFn: () => updateMyPreferences(toPayload(form)),
    onSuccess: (prefs) => {
      queryClient.setQueryData(['preferences'], prefs);
      void queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });
  const dirty =
    !sameList(form.styles, initial.styles) || !sameList(form.amenities, initial.amenities) || form.city.trim() !== initial.city || form.budget !== initial.budget;
  const edit = (next: Form) => {
    save.reset();
    setForm(next);
  };

  return (
    <>
      <View className="gap-3 rounded-lg bg-surface-container-lowest p-4 shadow-card">
        <Text variant="h3">Phong cách du lịch</Text>
        {STYLES.map((st) => {
          const on = form.styles.includes(st.id);
          return (
            <Chip
              key={st.id}
              label={`${st.title} · ${st.desc}`}
              icon={st.icon}
              tone={on ? 'selected' : 'outline'}
              onPress={() => edit({ ...form, styles: toggle(form.styles, st.id) })}
            />
          );
        })}
      </View>
      <View className="gap-3 rounded-lg bg-surface-container-lowest p-4 shadow-card">
        <Text variant="h3">Tiện nghi mong muốn</Text>
        <View className="flex-row flex-wrap gap-2">
          {AMENITIES.map((a) => (
            <Chip key={a.id} label={a.label} tone={form.amenities.includes(a.id) ? 'selected' : 'outline'} onPress={() => edit({ ...form, amenities: toggle(form.amenities, a.id) })} />
          ))}
        </View>
      </View>
      <View className="gap-3 rounded-lg bg-surface-container-lowest p-4 shadow-card">
        <Input label="Thành phố yêu thích" value={form.city} onChangeText={(city) => edit({ ...form, city })} maxLength={100} placeholder="Ví dụ: Đà Nẵng" />
        <Text variant="label" weight="semibold">
          Ngân sách mỗi đêm
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {BUDGETS.map((b) => (
            <Chip key={b.id || 'none'} label={b.label} tone={form.budget === b.id ? 'selected' : 'outline'} onPress={() => edit({ ...form, budget: b.id })} />
          ))}
        </View>
      </View>
      {save.isError && (
        <Text variant="small" color={colors.error}>
          {apiErrorMessage(save.error, 'Không lưu được sở thích. Vui lòng thử lại.')}
        </Text>
      )}
      {save.isSuccess && !dirty && (
        <View className="gap-2 rounded-lg bg-secondary-fixed p-3.5">
          <Text variant="small" weight="semibold" color={colors.secondary}>
            Đã lưu. Gợi ý cho bạn sẽ theo sở thích mới.
          </Text>
          <Button label="Xem gợi ý cho bạn" leadingIcon="auto_awesome" variant="secondary" size="sm" onPress={() => router.push('/recommendations')} />
        </View>
      )}
      <Button label={save.isPending ? 'Đang lưu…' : 'Lưu sở thích'} leadingIcon="save" size="lg" disabled={!dirty || save.isPending} onPress={() => save.mutate()} />
    </>
  );
}

/** Sở thích du lịch (`GET`/`PUT /me/preferences`), recommender phase 5 đọc các key này. */
export default function PreferencesScreen() {
  const prefs = useQuery({ queryKey: ['preferences'], queryFn: getMyPreferences });
  const onboarding = useQuery({ queryKey: ['onboarding'], queryFn: getOnboarding });

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader title="Sở thích du lịch" />
      <ScrollView contentContainerClassName="gap-4 p-4 pb-10" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {onboarding.data && onboarding.data.status !== 'COMPLETED' && (
          <View className="gap-2 rounded-lg border border-primary-fixed bg-surface-container-low p-4">
            <View className="flex-row items-center gap-2">
              <Icon name="featured_seasonal_and_gifts" size={22} color={colors.primary} />
              <Text variant="label" weight="bold">
                Nhận voucher chào mừng
              </Text>
            </View>
            <Text variant="small" color={colors.onSurfaceVariant}>
              Trả lời vài câu về chuyến đi bạn thích (khoảng 1 phút) để nhận mã giảm giá cho lần đặt phòng tới.
            </Text>
            <Button label="Bắt đầu" size="sm" className="self-start" onPress={() => router.push('/onboarding')} />
          </View>
        )}
        {prefs.isError ? (
          <View className="items-center gap-3 py-6">
            <Text variant="small" color={colors.onSurfaceVariant} center>
              Không tải được sở thích. Vui lòng kiểm tra kết nối.
            </Text>
            <Button label="Thử lại" leadingIcon="refresh" variant="secondary" size="sm" onPress={() => void prefs.refetch()} />
          </View>
        ) : !prefs.data ? (
          <Text variant="small" color={colors.onSurfaceVariant} center>
            Đang tải...
          </Text>
        ) : (
          // Không đặt key theo dữ liệu: lưu xong form remount thì mất thông báo "Đã lưu".
          <PreferencesForm initial={toForm(prefs.data)} />
        )}
      </ScrollView>
    </View>
  );
}
