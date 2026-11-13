import { ScrollView, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { LoyaltyEntry, Voucher } from '@stayreco/shared';
import { ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { formatVnd } from '@/lib/stay';
import { tierLabel } from '@/features/rewards/tier';
import { usePagedList } from '@/lib/paged';
import { getLoyaltyEntries, getMyLoyalty, getMyVouchers } from '@/services/rewards.service';

const entryLabel: Record<LoyaltyEntry['kind'], string> = {
  EARNED: 'Tích điểm',
  SPENT: 'Dùng điểm',
  REFUNDED: 'Hoàn điểm',
};

const voucherValue = (v: Voucher) =>
  v.discountType === 'PERCENTAGE'
    ? `Giảm ${v.discountValue}%${v.maxDiscount ? `, tối đa ${formatVnd(v.maxDiscount)}` : ''}`
    : `Giảm ${formatVnd(v.discountValue)}`;

export default function RewardsScreen() {
  const loyalty = useQuery({ queryKey: ['loyalty'], queryFn: getMyLoyalty });
  const entries = usePagedList(['loyalty', 'entries'], (page) =>
    getLoyaltyEntries({ page, pageSize: 20 }).then((r) => ({ items: r.entries, meta: r.meta })),
  );
  const vouchers = usePagedList(['vouchers', 'active'], (page) =>
    getMyVouchers({ active: true, page, pageSize: 10 }).then((r) => ({ items: r.vouchers, meta: r.meta })),
  );
  const l = loyalty.data;

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader title="Voucher & Điểm Thưởng" />
      <ScrollView contentContainerClassName="gap-4 p-4 pb-8" showsVerticalScrollIndicator={false}>
        {loyalty.isError ? (
          <View className="items-center gap-3 py-6">
            <Text variant="small" color={colors.onSurfaceVariant} center>
              Không tải được điểm thưởng. Vui lòng kiểm tra kết nối.
            </Text>
            <Button label="Thử lại" leadingIcon="refresh" variant="secondary" size="sm" onPress={() => loyalty.refetch()} />
          </View>
        ) : !l ? (
          <Text variant="small" color={colors.onSurfaceVariant} center>
            Đang tải...
          </Text>
        ) : (
          <View className="gap-2 rounded-lg bg-primary-container p-4">
            <Text variant="caption" weight="semibold" color={colors.onPrimaryContainer}>
              {l.programName.toUpperCase()} • HẠNG {tierLabel[l.tier].toUpperCase()}
            </Text>
            <Text variant="h2" color={colors.white}>
              {l.pointsBalance.toLocaleString('vi-VN')}{' '}
              <Text variant="small" color={colors.primaryFixed}>
                điểm ≈ {formatVnd(l.balanceValue)}
              </Text>
            </Text>
            <Text variant="caption" color={colors.primaryFixed}>
              {l.nextTier
                ? `Còn ${l.nextTier.pointsNeeded.toLocaleString('vi-VN')} điểm để lên hạng ${tierLabel[l.nextTier.tier]}`
                : 'Bạn đang ở hạng cao nhất.'}
            </Text>
            <Text variant="caption" color={colors.primaryFixed}>
              Tích 1 điểm cho mỗi 1.000 ₫ khi trả phòng. Dùng điểm ở bước đặt phòng, 1 điểm = {formatVnd(l.pointValue)}.
            </Text>
          </View>
        )}

        <View className="gap-3 rounded-lg bg-surface-container-lowest p-4 shadow-card">
          <Text variant="h3">Voucher của bạn</Text>
          {vouchers.isError ? (
            <Text variant="small" color={colors.onSurfaceVariant}>
              Không tải được voucher.
            </Text>
          ) : vouchers.items?.length === 0 ? (
            <Text variant="small" color={colors.onSurfaceVariant}>
              Chưa có voucher nào còn dùng được.
            </Text>
          ) : (
            vouchers.items?.map((v) => (
              <View key={v.id} className="gap-1 rounded-md bg-surface-container-low p-3">
                <View className="flex-row items-center justify-between gap-2">
                  <Text variant="label" weight="bold" selectable>
                    {v.code}
                  </Text>
                  <Chip label={voucherValue(v)} tone="tertiary" className="shrink" />
                </View>
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  {v.promotionName}
                  {v.minBookingAmount ? ` • Đơn từ ${formatVnd(v.minBookingAmount)}` : ''}
                  {v.expiresAt ? ` • HSD ${new Date(v.expiresAt).toLocaleDateString('vi-VN')}` : ''}
                </Text>
              </View>
            ))
          )}
          {vouchers.hasMore && (
            <Button
              label={vouchers.loadingMore ? 'Đang tải...' : 'Xem thêm voucher'}
              variant="ghost"
              size="sm"
              disabled={vouchers.loadingMore}
              onPress={vouchers.loadMore}
            />
          )}
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Nhập mã ở bước đặt phòng để được giảm giá.
          </Text>
        </View>

        <View className="gap-3 rounded-lg bg-surface-container-lowest p-4 shadow-card">
          <Text variant="h3">Lịch sử điểm</Text>
          {entries.isError ? (
            <Text variant="small" color={colors.onSurfaceVariant}>
              Không tải được lịch sử điểm.
            </Text>
          ) : entries.items?.length === 0 ? (
            <Text variant="small" color={colors.onSurfaceVariant}>
              Chưa có giao dịch điểm nào.
            </Text>
          ) : (
            entries.items?.map((e, i) => (
              <View key={`${e.at}-${i}`} className="flex-row items-center justify-between gap-2">
                <View className="flex-1">
                  <Text variant="small" weight="semibold">
                    {entryLabel[e.kind]}
                    {e.hotelName ? ` • ${e.hotelName}` : ''}
                  </Text>
                  <Text variant="caption" color={colors.onSurfaceVariant}>
                    {new Date(e.at).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
                <Text variant="small" weight="bold" color={e.points < 0 ? colors.error : colors.tertiary}>
                  {e.points > 0 ? '+' : ''}
                  {e.points.toLocaleString('vi-VN')}
                </Text>
              </View>
            ))
          )}
          {entries.hasMore && (
            <Button
              label={entries.loadingMore ? 'Đang tải...' : 'Xem thêm'}
              variant="ghost"
              size="sm"
              disabled={entries.loadingMore}
              onPress={entries.loadMore}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
