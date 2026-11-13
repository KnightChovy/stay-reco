import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { WalletTxnType } from '@stayreco/shared';
import { ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { usePagedList } from '@/lib/paged';
import { formatVnd } from '@/lib/stay';
import { getMyWallet, getWalletTransactions } from '@/services/rewards.service';

const txnLabel: Record<WalletTxnType, string> = {
  BOOKING_PAYMENT: 'Thanh toán đặt phòng',
  COMMISSION: 'Hoa hồng',
  PAYOUT: 'Rút tiền',
  REFUND: 'Hoàn tiền hủy phòng',
  TOPUP: 'Nạp tiền',
  ADJUSTMENT: 'Điều chỉnh',
  SETTLEMENT: 'Đối soát',
};

// Ví khách chỉ có tiền hoàn vào và tiền trả đơn ra; các loại khác thuộc ví khách sạn.
const filters: { label: string; type?: WalletTxnType }[] = [
  { label: 'Tất cả' },
  { label: 'Tiền hoàn', type: 'REFUND' },
  { label: 'Trả đặt phòng', type: 'BOOKING_PAYMENT' },
];

export default function WalletScreen() {
  const wallet = useQuery({ queryKey: ['wallet'], queryFn: getMyWallet });
  const [type, setType] = useState<WalletTxnType>();
  const txns = usePagedList(['wallet', 'transactions', type ?? 'all'], (page) =>
    getWalletTransactions({ page, pageSize: 20, ...(type ? { type: [type] } : {}) }).then((r) => ({
      items: r.transactions,
      meta: r.meta,
    })),
  );

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader title="Ví StayReco" />
      <ScrollView contentContainerClassName="gap-4 p-4 pb-8" showsVerticalScrollIndicator={false}>
        {wallet.isError ? (
          <View className="items-center gap-3 py-6">
            <Text variant="small" color={colors.onSurfaceVariant} center>
              Không tải được ví. Vui lòng kiểm tra kết nối.
            </Text>
            <Button label="Thử lại" leadingIcon="refresh" variant="secondary" size="sm" onPress={() => wallet.refetch()} />
          </View>
        ) : (
          <View className="gap-2 rounded-lg bg-primary-container p-4">
            <Text variant="caption" weight="semibold" color={colors.onPrimaryContainer}>
              SỐ DƯ KHẢ DỤNG
            </Text>
            <Text variant="h2" color={colors.white}>
              {wallet.data ? formatVnd(wallet.data.balanceAvailable) : '...'}
            </Text>
          </View>
        )}

        <View className="flex-row gap-2.5 rounded-md bg-surface-container p-3.5">
          <Icon name="info" size={18} color={colors.primaryContainer} />
          <Text variant="caption" color={colors.onSurfaceVariant} className="flex-1">
            Tiền hoàn từ các đơn đã hủy được cộng vào ví. Số dư dùng để trả cả một đơn đặt phòng ở bước thanh toán; chưa rút về
            tài khoản ngân hàng được.
          </Text>
        </View>

        <View className="gap-3 rounded-lg bg-surface-container-lowest p-4 shadow-card">
          <Text variant="h3">Giao dịch</Text>
          <View className="flex-row flex-wrap gap-2">
            {filters.map((f) => (
              <Chip
                key={f.label}
                label={f.label}
                tone={f.type === type ? 'selected' : 'outline'}
                onPress={() => setType(f.type)}
              />
            ))}
          </View>
          {txns.isError ? (
            <Text variant="small" color={colors.onSurfaceVariant}>
              Không tải được giao dịch.
            </Text>
          ) : txns.items?.length === 0 ? (
            <Text variant="small" color={colors.onSurfaceVariant}>
              Chưa có giao dịch nào.
            </Text>
          ) : (
            txns.items?.map((t) => (
              <View key={t.id} className="flex-row items-center justify-between gap-2">
                <View className="flex-1">
                  <Text variant="small" weight="semibold">
                    {txnLabel[t.type]}
                    {t.booking ? ` • ${t.booking.code}` : ''}
                  </Text>
                  <Text variant="caption" color={colors.onSurfaceVariant}>
                    {new Date(t.createdAt).toLocaleString('vi-VN')}
                  </Text>
                </View>
                <Text variant="small" weight="bold" color={t.amount < 0 ? colors.error : colors.tertiary}>
                  {t.amount > 0 ? '+' : '-'}
                  {formatVnd(Math.abs(t.amount))}
                </Text>
              </View>
            ))
          )}
          {txns.hasMore && (
            <Button
              label={txns.loadingMore ? 'Đang tải...' : 'Xem thêm'}
              variant="ghost"
              size="sm"
              disabled={txns.loadingMore}
              onPress={txns.loadMore}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
