import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { emailSchema } from '@stayreco/shared';
import { ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { colors, radius, shadow } from '@/constants/theme';

const standards = ['Tối thiểu 8 ký tự', 'Bao gồm chữ hoa', 'Có ít nhất 1 số', 'Ký tự đặc biệt'];

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = () => {
    if (!emailSchema.safeParse(email).success) {
      setError('Email chưa đúng định dạng.');
      return;
    }
    // shortcut: chưa gọi API quên mật khẩu, chỉ hiện trạng thái đã gửi.
    setError('');
    setSent(true);
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Quên mật khẩu" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.between}>
          <Pressable onPress={() => router.replace('/login')} style={styles.row}>
            <Icon name="arrow_back" size={18} color={colors.primary} />
            <Text variant="label" weight="semibold" color={colors.primary}>
              Quay lại Đăng nhập
            </Text>
          </Pressable>
          <Chip label="SSL 256-bit" icon="lock" tone="neutral" />
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
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

        <View style={styles.card}>
          {sent ? (
            <View style={styles.success}>
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
              <View style={styles.rowTop}>
                <Icon name="info" size={14} color={colors.onSurfaceVariant} />
                <Text variant="caption" color={colors.onSurfaceVariant} style={styles.flex}>
                  Chúng tôi sẽ gửi mã kiểm tra tính hợp lệ đến email này.
                </Text>
              </View>
              {!!error && (
                <Text variant="small" color={colors.error} accessibilityLiveRegion="polite">
                  {error}
                </Text>
              )}
              <Button label="Gửi liên kết khôi phục" icon="arrow_forward" size="lg" onPress={submit} />
            </>
          )}
        </View>

        <View style={styles.warning}>
          <View style={styles.warningIcon}>
            <Icon name="verified_user" size={20} color={colors.secondary} />
          </View>
          <View style={styles.flex}>
            <Text variant="small" weight="bold" style={styles.tracking}>
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

        <View style={styles.card}>
          <View style={styles.row}>
            <Icon name="password" size={20} color={colors.primary} />
            <Text variant="label" weight="bold">
              Chuẩn an ninh mật khẩu mới
            </Text>
          </View>
          <Text variant="small" color={colors.onSurfaceVariant}>
            Khi truy cập liên kết gửi về email, bạn sẽ hoàn tất thiết lập mật khẩu với chuẩn an ninh:
          </Text>
          <View style={styles.grid}>
            {standards.map((s) => (
              <View key={s} style={styles.standard}>
                <Icon name="check" size={16} color={colors.primary} />
                <Text variant="caption">{s}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.support}>
          <Icon name="support_agent" size={24} color={colors.primary} />
          <View style={[styles.flex, styles.gap6]}>
            <Text variant="small" weight="bold">
              Không còn truy cập được email này?
            </Text>
            <Text variant="small" color={colors.onSurfaceVariant}>
              Liên hệ Trung tâm hỗ trợ StayReco Care để được chuyên viên xác minh thủ công danh tính chủ sở hữu tài khoản.
            </Text>
            <View style={styles.row}>
              <Icon name="call" size={16} color={colors.secondary} />
              <Text variant="small" weight="semibold" color={colors.secondary}>
                1900 6868 (24/7)
              </Text>
            </View>
            <View style={styles.row}>
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 16, gap: 18, paddingBottom: 40 },
  flex: { flex: 1 },
  gap6: { gap: 6 },
  tracking: { letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  hero: { alignItems: 'center', gap: 10 },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerHigh,
  },
  card: { padding: 18, gap: 12, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerLowest, ...shadow.card },
  success: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  warning: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: '#fbefec' },
  warningIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondaryFixed,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  standard: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLow,
  },
  support: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerLow },
});
