import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { emailSchema } from '@stayreco/shared';
import { ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth.store';

const standards = ['Tối thiểu 8 ký tự', 'Bao gồm chữ hoa', 'Có ít nhất 1 số', 'Ký tự đặc biệt'];

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const forgotPassword = useAuthStore((s) => s.forgotPassword);

  const submit = async () => {
    if (loading) return;
    if (!emailSchema.safeParse(email).success) {
      setError('Email chưa đúng định dạng.');
      return;
    }
    setError('');
    setLoading(true);
    const result = await forgotPassword(email.trim());
    setLoading(false);
    if (result.success) setSent(true);
    else setError(result.message);
  };

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader title="Quên mật khẩu" />
      <ScrollView contentContainerClassName="gap-[18px] p-4 pb-10" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between gap-2">
          <Pressable onPress={() => router.replace('/login')} className="flex-row items-center gap-1.5">
            <Icon name="arrow_back" size={18} color={colors.primary} />
            <Text variant="label" weight="semibold" color={colors.primary}>
              Quay lại Đăng nhập
            </Text>
          </Pressable>
          <Chip label="SSL 256-bit" icon="lock" tone="neutral" />
        </View>

        <View className="items-center gap-2.5">
          <View className="h-16 w-16 items-center justify-center rounded-lg bg-surface-container-high">
            <Icon name="lock_reset" size={30} color={colors.primary} />
          </View>
          <Text variant="hero" center>
            Khôi phục mật khẩu
          </Text>
          <Text variant="body" color={colors.onSurfaceVariant} center>
            Nhập địa chỉ email liên kết với tài khoản StayReco của bạn. Chúng tôi sẽ gửi hướng dẫn khôi phục bảo mật trong
            tích tắc.
          </Text>
        </View>

        <View className="gap-3 rounded-lg bg-surface-container-lowest p-[18px] shadow-card">
          {sent ? (
            <View className="items-center gap-2 py-2">
              <Icon name="check_circle" size={40} color={colors.tertiaryContainer} />
              <Text variant="h3" center>
                Yêu cầu đã được ghi nhận!
              </Text>
              <Text variant="small" color={colors.onSurfaceVariant} center>
                Vui lòng kiểm tra hộp thư đến (và mục Thư rác) của bạn trong vài phút tới.
              </Text>
            </View>
          ) : (
            <>
              <Input
                label="EMAIL ĐÃ ĐĂNG KÝ TÀI KHOẢN"
                icon="mail"
                placeholder="vidu@domain.vn"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                onSubmitEditing={submit}
              />
              <View className="flex-row items-start gap-1.5">
                <Icon name="info" size={14} color={colors.onSurfaceVariant} />
                <Text variant="caption" color={colors.onSurfaceVariant} className="flex-1">
                  Chúng tôi sẽ gửi mã kiểm tra tính hợp lệ đến email này.
                </Text>
              </View>
              {!!error && (
                <Text variant="small" color={colors.error} accessibilityLiveRegion="polite">
                  {error}
                </Text>
              )}
              <Button
                label={loading ? 'Đang gửi...' : 'Gửi liên kết khôi phục'}
                icon="arrow_forward"
                size="lg"
                onPress={submit}
                disabled={loading}
              />
            </>
          )}
        </View>

        <View className="flex-row gap-3 rounded-lg bg-[#fbefec] p-4">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-secondary-fixed">
            <Icon name="verified_user" size={20} color={colors.secondary} />
          </View>
          <View className="flex-1">
            <Text variant="small" weight="bold" className="tracking-[1px]">
              LƯU Ý QUAN TRỌNG
            </Text>
            <Text variant="small" color={colors.error}>
              Vì lý do bảo mật, nếu email tồn tại trong hệ thống, bạn sẽ nhận được đường dẫn đặt lại mật khẩu có hiệu lực
              trong{' '}
              <Text variant="small" weight="bold" color={colors.error}>
                15 phút
              </Text>
              . Vui lòng kiểm tra cả hộp thư Spam/Quảng cáo.
            </Text>
          </View>
        </View>

        <View className="gap-3 rounded-lg bg-surface-container-lowest p-[18px] shadow-card">
          <View className="flex-row items-center gap-1.5">
            <Icon name="password" size={20} color={colors.primary} />
            <Text variant="label" weight="bold">
              Chuẩn an ninh mật khẩu mới
            </Text>
          </View>
          <Text variant="small" color={colors.onSurfaceVariant}>
            Khi truy cập liên kết gửi về email, bạn sẽ hoàn tất thiết lập mật khẩu với chuẩn an ninh:
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {standards.map((s) => (
              <View key={s} className="grow basis-[47%] flex-row items-center gap-2 rounded-md bg-surface-container-low p-2.5">
                <Icon name="check" size={16} color={colors.primary} />
                <Text variant="caption">{s}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="flex-row gap-3 rounded-lg bg-surface-container-low p-4">
          <Icon name="support_agent" size={24} color={colors.primary} />
          <View className="flex-1 gap-1.5">
            <Text variant="small" weight="bold">
              Không còn truy cập được email này?
            </Text>
            <Text variant="small" color={colors.onSurfaceVariant}>
              Liên hệ Trung tâm hỗ trợ StayReco Care để được chuyên viên xác minh thủ công danh tính chủ sở hữu tài khoản.
            </Text>
            <View className="flex-row items-center gap-1.5">
              <Icon name="call" size={16} color={colors.secondary} />
              <Text variant="small" weight="semibold" color={colors.secondary}>
                1900 6868 (24/7)
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Icon name="mail" size={16} color={colors.primary} />
              <Text variant="small" weight="semibold" color={colors.primary}>
                support@stayreco.vn
              </Text>
            </View>
          </View>
        </View>

        <Text variant="caption" color={colors.onSurfaceVariant} center>
          Chính sách bảo mật • Trợ giúp & FAQ • Tiêu chuẩn an ninh
        </Text>
      </ScrollView>
    </View>
  );
}
