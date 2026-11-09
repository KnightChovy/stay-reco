import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import type { CustomerProfile, Gender, UpdateProfileInput } from '@stayreco/shared';
import { ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { colors, radius, shadow } from '@/constants/theme';
import { images } from '@/lib/mock-data';
import { formatDate } from '@/lib/stay';
import { apiErrorMessage } from '@/services/ApiService';
import { updateProfile } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';

const genders: { key: Gender; label: string }[] = [
  { key: 'MALE', label: 'Nam' },
  { key: 'FEMALE', label: 'Nữ' },
  { key: 'OTHER', label: 'Khác' },
];

/** "dd/MM/yyyy" → "YYYY-MM-DD"; chuỗi rỗng → null (xóa); sai định dạng → undefined. */
function parseDate(input: string): string | null | undefined {
  if (!input.trim()) return null;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(input.trim());
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : undefined;
}

function SectionTitle({ icon, title }: { icon: IconName; title: string }) {
  return (
    <View style={styles.sectionTitle}>
      <Icon name={icon} size={20} color={colors.secondary} />
      <Text variant="label" weight="bold" style={[styles.flex, styles.tracking]}>
        {title}
      </Text>
    </View>
  );
}

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const account = useAuthStore((st) => st.account);
  // Chỉ customer mới có dateOfBirth/gender/nationality; role khác gửi các field này sẽ bị VALIDATION_ERROR.
  const isCustomer = account?.role === 'CUSTOMER';
  const profile = isCustomer ? (account.profile as CustomerProfile | null) : null;

  const [fullName, setFullName] = useState(account?.fullName ?? '');
  const [phone, setPhone] = useState(account?.phone ?? '');
  const [birthday, setBirthday] = useState(profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : '');
  const [gender, setGender] = useState<Gender | null>(profile?.gender ?? null);
  const [nationality, setNationality] = useState(profile?.nationality ?? '');
  const [error, setError] = useState('');

  const save = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      useAuthStore.setState({ account: updated });
      router.back();
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không lưu được hồ sơ. Vui lòng thử lại.')),
  });

  const submit = () => {
    if (!fullName.trim()) return setError('Vui lòng nhập họ và tên.');
    const payload: UpdateProfileInput = { fullName: fullName.trim(), phone: phone.trim() || null };
    if (isCustomer) {
      const dateOfBirth = parseDate(birthday);
      if (dateOfBirth === undefined) return setError('Ngày sinh cần theo dạng DD/MM/YYYY.');
      Object.assign(payload, { dateOfBirth, gender, nationality: nationality.trim() || null });
    }
    setError('');
    save.mutate(payload);
  };

  if (!account) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Chỉnh sửa hồ sơ cá nhân" />
        <View style={styles.content}>
          <Text variant="body" center>
            Vui lòng đăng nhập để chỉnh sửa hồ sơ.
          </Text>
          <Button label="Đăng nhập" onPress={() => router.replace('/login')} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Chỉnh sửa hồ sơ cá nhân" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, styles.center]}>
          <Image source={account.avatarUrl ?? images.avatar} style={styles.avatar} contentFit="cover" />
          <Text variant="h2">{fullName || account.fullName}</Text>
          <Text variant="small" color={colors.onSurfaceVariant}>
            Thành viên từ {new Date(account.createdAt).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}
          </Text>
        </View>

        <SectionTitle icon="badge" title="THÔNG TIN CÁ NHÂN" />
        <View style={styles.card}>
          <Input label="Họ và tên đầy đủ *" icon="person" placeholder="Nhập họ và tên" autoComplete="name" value={fullName} onChangeText={setFullName} />
          <Input label="Số điện thoại" icon="call" placeholder="0912345678" keyboardType="phone-pad" autoComplete="tel" value={phone} onChangeText={setPhone} />
          <View style={styles.gap6}>
            <Text variant="label" weight="semibold">
              Email
            </Text>
            <View style={styles.readonly}>
              <Icon name="mail" size={18} color={colors.outline} />
              <Text variant="body" numberOfLines={1} style={styles.flex}>
                {account.email}
              </Text>
              <Icon name="lock" size={18} color={colors.outline} />
            </View>
          </View>
        </View>

        {isCustomer && (
          <>
            <SectionTitle icon="hotel" title="THÔNG TIN BỔ SUNG" />
            <View style={styles.card}>
              <Input
                label="Ngày sinh"
                icon="cake"
                placeholder="DD/MM/YYYY"
                keyboardType="numbers-and-punctuation"
                value={birthday}
                onChangeText={setBirthday}
              />
              <View style={styles.gap6}>
                <Text variant="label" weight="semibold">
                  Giới tính
                </Text>
                <View style={styles.row}>
                  {genders.map((g) => {
                    const selected = g.key === gender;
                    return (
                      <Pressable
                        key={g.key}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        onPress={() => setGender(selected ? null : g.key)}
                        style={[styles.radio, selected && styles.radioSelected]}
                      >
                        <Icon name={selected ? 'radio_button_checked' : 'radio_button_unchecked'} size={18} color={selected ? colors.primary : colors.outline} />
                        <Text variant="small" weight={selected ? 'semibold' : 'regular'}>
                          {g.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <Input label="Quốc tịch" icon="public" placeholder="Việt Nam" value={nationality} onChangeText={setNationality} />
            </View>
          </>
        )}

        {!!error && (
          <Text variant="small" color={colors.error}>
            {error}
          </Text>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.row}>
          <Button label="Hủy bỏ" variant="muted" onPress={() => router.back()} />
          <Button label={save.isPending ? 'Đang lưu…' : 'Lưu thay đổi'} leadingIcon="check" size="lg" style={styles.flex} disabled={save.isPending} onPress={submit} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  flex: { flex: 1 },
  gap6: { gap: 6 },
  center: { alignItems: 'center' },
  tracking: { letterSpacing: 0.8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  card: { padding: 16, gap: 16, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerLowest, ...shadow.card },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  readonly: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLow,
  },
  radio: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLow,
  },
  radioSelected: { backgroundColor: colors.primaryFixed },
  bottomBar: {
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
  },
});
