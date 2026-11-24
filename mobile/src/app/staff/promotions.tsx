import { useState } from 'react';
import { View } from 'react-native';
import type { Promotion } from '@stayreco/shared';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import type { Tone } from '@/features/staff/data';
import { Card, KV, Segmented, StaffScreen, s, useStaffHotel } from '@/features/staff/ui';
import { usePagedList } from '@/lib/paged';
import { formatDate, formatVnd } from '@/lib/stay';
import { getHotelPromotions } from '@/services/staff.service';

type Tab = 'active' | 'all';

const discountLabel = (p: Promotion) => (p.discountType === 'PERCENTAGE' ? `Giảm ${p.discountValue}%` : `Giảm ${formatVnd(p.discountValue)}`);

function periodLabel({ validFrom, validTo }: Promotion) {
  if (validFrom && validTo) return `${formatDate(validFrom)} – ${formatDate(validTo)}`;
  if (validFrom) return `Từ ${formatDate(validFrom)}`;
  if (validTo) return `Đến hết ${formatDate(validTo)}`;
  return 'Không giới hạn ngày';
}

/** Vì sao ưu đãi chưa dùng được hôm nay: điều lễ tân nói với khách hỏi về nó. */
function statusOf(p: Promotion): { label: string; tone: Tone } {
  if (p.usable) return { label: 'Đang áp dụng', tone: 'tertiary' };
  if (!p.isActive) return { label: 'Đã tắt', tone: 'neutral' };
  if (p.maxUses !== null && p.currentUses >= p.maxUses) return { label: 'Hết lượt', tone: 'warning' };
  return { label: 'Ngoài thời gian', tone: 'neutral' };
}

/**
 * Ưu đãi của khách sạn, chỉ đọc (`GET /hotels/:id/promotions`), để lễ tân trả lời "có giảm giá không?".
 * Chủ khách sạn tạo ưu đãi; đơn đặt tự áp dụng giảm giá, nhân viên không áp tay.
 */
export default function StaffPromotionsScreen() {
  const { hotelId, isPending } = useStaffHotel();
  const [tab, setTab] = useState<Tab>('active');
  const list = usePagedList(
    ['staff', 'promotions', hotelId, tab],
    (page) => getHotelPromotions(hotelId!, { active: tab === 'active' ? true : undefined, page, pageSize: 20 }).then((r) => ({ items: r.promotions, meta: r.meta })),
    !!hotelId,
  );

  return (
    <StaffScreen title="Ưu đãi của khách sạn">
      <Text variant="small" color={colors.onSurfaceVariant}>
        Các chương trình giảm giá khách dùng được khi đặt phòng. Chỉ xem; ưu đãi do chủ khách sạn tạo và giảm giá được tính tự động lúc khách đặt.
      </Text>
      <Segmented
        items={[
          { key: 'active', label: 'Đang áp dụng' },
          { key: 'all', label: 'Tất cả' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {list.isError ? (
        <Card>
          <Text variant="small" color={colors.error}>
            Không tải được ưu đãi.
          </Text>
          <Button label="Thử lại" leadingIcon="refresh" variant="secondary" size="sm" onPress={list.refetch} />
        </Card>
      ) : isPending || !list.items ? (
        <Text variant="small" color={colors.onSurfaceVariant}>
          Đang tải ưu đãi…
        </Text>
      ) : list.items.length === 0 ? (
        <Card>
          <Text variant="label" weight="semibold">
            {tab === 'active' ? 'Không có ưu đãi nào đang áp dụng' : 'Khách sạn chưa có ưu đãi nào'}
          </Text>
          <Text variant="small" color={colors.onSurfaceVariant}>
            Khách đặt phòng với giá thường. Chủ khách sạn tạo ưu đãi trong cổng đối tác.
          </Text>
        </Card>
      ) : (
        <>
          {list.items.map((p) => {
            const status = statusOf(p);
            return (
              <Card key={p.id}>
                <View className={s.between}>
                  <View className={s.flex}>
                    <Text variant="h3" weight="bold" color={colors.primary}>
                      {discountLabel(p)}
                    </Text>
                    <Text variant="label" weight="semibold">
                      {p.name}
                    </Text>
                  </View>
                  <Chip label={status.label} tone={status.tone} />
                </View>
                {!!p.description && (
                  <Text variant="small" color={colors.onSurfaceVariant}>
                    {p.description}
                  </Text>
                )}
                <KV label="Thời gian" value={periodLabel(p)} />
                <KV label="Đơn tối thiểu" value={p.minBookingAmount ? formatVnd(p.minBookingAmount) : 'Không yêu cầu'} />
                <KV label="Đã dùng" value={`${p.currentUses}${p.maxUses !== null ? ` / ${p.maxUses} lượt` : ' lượt'}`} />
                <KV label="Cách dùng" value={p.requiresCode ? 'Khách nhập mã riêng' : 'Tự động khi đặt'} />
                {p.hotelId === null && (
                  <Text variant="caption" color={colors.onSurfaceVariant}>
                    Chương trình của StayReco cho mọi khách sạn
                  </Text>
                )}
              </Card>
            );
          })}
          {list.hasMore && <Button label={list.loadingMore ? 'Đang tải…' : 'Xem thêm'} variant="secondary" disabled={list.loadingMore} onPress={list.loadMore} />}
        </>
      )}
    </StaffScreen>
  );
}
