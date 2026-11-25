import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
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
import { colors } from '@/constants/theme';
import { images } from '@/lib/mock-data';
import { formatDate } from '@/lib/stay';
import { apiErrorMessage } from '@/services/ApiService';
import { deleteAvatar, updateProfile, uploadAvatar } from '@/services/auth.service';
import { pickImageForm } from '@/lib/pick-image';
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
    <View className="mt-1 flex-row items-center gap-2">
      <Icon name={icon} size={20} color={colors.secondary} />
      <Text variant="label" weight="bold" className="flex-1 tracking-[0.8px]">
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

  // Ảnh đại diện lưu ngay, không chờ nút "Lưu thay đổi"; `remove` là xóa ảnh hiện tại.
  const avatar = useMutation({
    mutationFn: async (remove: boolean) => {
      if (remove) {
        await deleteAvatar();
        return { avatarUrl: null };
      }
      const form = await pickImageForm();
      return form && { avatarUrl: (await uploadAvatar(form)).avatarUrl };
    },
    onSuccess: (patch) => {
      // Chỉ vá avatarUrl để không ghi đè các ô đang sửa dở trong store.
      const current = useAuthStore.getState().account;
      if (patch && current) useAuthStore.setState({ account: { ...current, ...patch } });
    },
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
      <View className="flex-1 bg-surface">
        <ScreenHeader title="Chỉnh sửa hồ sơ cá nhân" />
        <View className="gap-4 p-4 pb-8">
          <Text variant="body" center>
            Vui lòng đăng nhập để chỉnh sửa hồ sơ.
          </Text>
          <Button label="Đăng nhập" onPress={() => router.replace('/login')} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader title="Chỉnh sửa hồ sơ cá nhân" />
      <ScrollView contentContainerClassName="gap-4 p-4 pb-8" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="gap-4 rounded-lg bg-surface-container-lowest p-4 shadow-card items-center">
          <Image source={account.avatarUrl ?? images.avatar} className="h-24 w-24 rounded-full" contentFit="cover" />
          <View className="flex-row gap-2">
            <Button
              label={avatar.isPending ? 'Đang xử lý…' : 'Đổi ảnh'}
              leadingIcon="photo_library"
              variant="secondary"
              size="sm"
              disabled={avatar.isPending}
              onPress={() => avatar.mutate(false)}
            />
            {!!account.avatarUrl && (
              <Button label="Xóa ảnh" leadingIcon="delete" variant="muted" size="sm" disabled={avatar.isPending} onPress={() => avatar.mutate(true)} />
            )}
          </View>
          {avatar.isError && (
            <Text variant="small" color={colors.error} center>
              {apiErrorMessage(avatar.error, 'Không cập nhật được ảnh đại diện. Vui lòng thử lại.')}
            </Text>
          )}
          <Text variant="h2">{fullName || account.fullName}</Text>
          <Text variant="small" color={colors.onSurfaceVariant}>
            Thành viên từ {new Date(account.createdAt).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}
          </Text>
        </View>

        <SectionTitle icon="badge" title="THÔNG TIN CÁ NHÂN" />
        <View className="gap-4 rounded-lg bg-surface-container-lowest p-4 shadow-card">
          <Input label="Họ và tên đầy đủ *" icon="person" placeholder="Nhập họ và tên" autoComplete="name" value={fullName} onChangeText={setFullName} />
          <Input label="Số điện thoại" icon="call" placeholder="0912345678" keyboardType="phone-pad" autoComplete="tel" value={phone} onChangeText={setPhone} />
          <View className="gap-1.5">
            <Text variant="label" weight="semibold">
              Email
            </Text>
            <View className="min-h-[52px] flex-row items-center gap-2.5 rounded-md bg-surface-container-low px-3.5">
              <Icon name="mail" size={18} color={colors.outline} />
              <Text variant="body" numberOfLines={1} className="flex-1">
                {account.email}
              </Text>
              <Icon name="lock" size={18} color={colors.outline} />
            </View>
          </View>
        </View>

        {isCustomer && (
          <>
            <SectionTitle icon="hotel" title="THÔNG TIN BỔ SUNG" />
            <View className="gap-4 rounded-lg bg-surface-container-lowest p-4 shadow-card">
              <Input
                label="Ngày sinh"
                icon="cake"
                placeholder="DD/MM/YYYY"
                keyboardType="numbers-and-punctuation"
                value={birthday}
                onChangeText={setBirthday}
              />
              <View className="gap-1.5">
                <Text variant="label" weight="semibold">
                  Giới tính
                </Text>
                <View className="flex-row items-center gap-2">
                  {genders.map((g) => {
                    const selected = g.key === gender;
                    return (
                      <Pressable
                        key={g.key}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        onPress={() => setGender(selected ? null : g.key)}
                        className={`min-h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-md ${selected ? 'bg-primary-fixed' : ''}`}
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

      </ScrollView>

      <View className="gap-2.5 border-t border-surface-container-high bg-surface-container-lowest px-4 pt-2.5" style={{ paddingBottom: insets.bottom + 12 }}>
        {/* Lỗi đặt cạnh nút Lưu: trong vùng cuộn thì bị khuất dưới thanh này. */}
        {!!error && (
          <Text variant="small" color={colors.error}>
            {error}
          </Text>
        )}
        <View className="flex-row items-center gap-2">
          <Button label="Hủy bỏ" variant="muted" onPress={() => router.back()} />
          <Button label={save.isPending ? 'Đang lưu…' : 'Lưu thay đổi'} leadingIcon="check" size="lg" className="flex-1" disabled={save.isPending} onPress={submit} />
        </View>
      </View>
    </View>
  );
}
