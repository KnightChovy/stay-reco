import { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useQueries, useQuery } from '@tanstack/react-query';
import type { DayOfWeek, PriceRuleType, PricingRule } from '@stayreco/shared';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { Card, CardHead, KV, StaffScreen, s, useStaffHotel } from '@/features/staff/ui';
import { addDays, dateInput, formatDate, formatVnd } from '@/lib/stay';
import { apiErrorMessage } from '@/services/ApiService';
import { getAvailability, getNightlyPrices, getPricingRules, getRoomTypes } from '@/services/staff.service';

const DAYS = 14;
const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const ruleType: Record<PriceRuleType, string> = { BASE: 'Giá gốc', SEASON: 'Theo mùa / ngày', EARLY_BIRD: 'Đặt sớm', LAST_MINUTE: 'Phút chót' };
const dayOfWeek: Record<DayOfWeek, string> = { MON: 'Thứ 2', TUE: 'Thứ 3', WED: 'Thứ 4', THU: 'Thứ 5', FRI: 'Thứ 6', SAT: 'Thứ 7', SUN: 'Chủ nhật' };
const compact = new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 });

/** "-15%", "+200.000 ₫" hoặc "= 5.500.000 ₫": quy tắc đổi giá gốc thế nào (giống adjustmentLabel bên web). */
function adjustment(rule: PricingRule) {
  const v = rule.adjustmentValue;
  if (rule.adjustmentType === 'SET_PRICE') return `= ${formatVnd(v)}`;
  const sign = v > 0 ? '+' : '−';
  return rule.adjustmentType === 'PERCENT' ? `${sign}${Math.abs(v)}%` : `${sign}${formatVnd(Math.abs(v))}`;
}

const cellTone = (onSale: number) => (onSale === 0 ? ['bg-error-container', '#8c0009'] : onSale <= 2 ? ['bg-[#fff0d9]', '#7a4600'] : ['bg-[#e3f4ea]', '#0b5a36']);

/** Chỉ xem, để lễ tân trả lời khách: phòng còn bán và giá mỗi đêm; chủ khách sạn mới đổi được. */
export default function StaffAvailabilityScreen() {
  const { hotelId } = useStaffHotel();
  const today = dateInput(0);
  const [from, setFrom] = useState(today);
  const to = addDays(from, DAYS - 1);
  const dates = Array.from({ length: DAYS }, (_, i) => addDays(from, i));

  const types = useQuery({ queryKey: ['staff', 'room-types', hotelId], queryFn: () => getRoomTypes(hotelId!), enabled: !!hotelId });
  const availability = useQuery({ queryKey: ['staff', 'availability', hotelId, from, to], queryFn: () => getAvailability(hotelId!, { from, to }), enabled: !!hotelId });
  // Listing nhận ngày trả phòng: đêm `to` kết thúc sáng hôm sau.
  const prices = useQueries({
    queries: (types.data ?? []).map((t) => ({ queryKey: ['staff', 'nightly-prices', t.id, from], queryFn: () => getNightlyPrices(t.id, from, addDays(to, 1)) })),
  });
  const rules = useQuery({ queryKey: ['staff', 'pricing-rules', hotelId], queryFn: () => getPricingRules(hotelId!), enabled: !!hotelId });

  const error = types.error ?? availability.error;
  const activeRules = (rules.data ?? []).filter((r) => r.isActive && r.ruleType !== 'BASE');
  const typeName = (id: string) => types.data?.find((t) => t.id === id)?.name ?? '—';

  return (
    <StaffScreen title="Phòng trống & giá">
      <View className={s.between}>
        <Button label="Tuần trước" leadingIcon="chevron_left" variant="secondary" size="sm" disabled={from <= today} onPress={() => setFrom((v) => (addDays(v, -7) < today ? today : addDays(v, -7)))} />
        <Text variant="small" weight="semibold">
          {formatDate(from).slice(0, 5)} – {formatDate(to).slice(0, 5)}
        </Text>
        <Button label="Tuần sau" variant="secondary" size="sm" onPress={() => setFrom((v) => addDays(v, 7))} />
      </View>
      <Text variant="caption" color={colors.onSurfaceVariant}>
        Xanh: còn từ 3 phòng · Vàng: sắp hết (1–2) · Đỏ: hết phòng. Dưới số phòng là giá một đêm. Kéo ngang để xem thêm ngày.
      </Text>

      {error ? (
        <Card>
          <Text variant="small" color={colors.error}>
            {apiErrorMessage(error, 'Không tải được lịch phòng.')}
          </Text>
          <Button label="Thử lại" leadingIcon="refresh" variant="secondary" onPress={() => { void types.refetch(); void availability.refetch(); }} />
        </Card>
      ) : !types.data || !availability.data ? (
        <ActivityIndicator color={colors.primary} />
      ) : types.data.length === 0 ? (
        <Text variant="small" color={colors.onSurfaceVariant} center>
          Khách sạn chưa có hạng phòng nào.
        </Text>
      ) : (
        types.data.map((type, index) => {
          const nightly = prices[index]?.data ?? [];
          return (
            <Card key={type.id}>
              <View>
                <Text variant="label" weight="bold">
                  {type.name}
                </Text>
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  Giá gốc {type.basePrice == null ? '—' : formatVnd(type.basePrice)}
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-1.5">
                {dates.map((date) => {
                  const day = availability.data?.find((d) => d.roomTypeId === type.id && d.date === date);
                  const price = nightly.find((n) => n.date === date)?.price;
                  const change = price != null && type.basePrice ? Math.round(((price - type.basePrice) / type.basePrice) * 100) : 0;
                  const onSale = day?.onSale ?? 0;
                  const [bg, fg] = cellTone(onSale);
                  return (
                    <View
                      key={date}
                      accessible
                      accessibilityLabel={day ? `${formatDate(date)}: còn ${onSale} phòng${price != null ? `, ${formatVnd(price)}` : ''}` : undefined}
                      className="w-[58px] items-center gap-0.5"
                    >
                      <Text variant="caption" color={colors.onSurfaceVariant}>
                        {WEEKDAY[new Date(`${date}T00:00:00`).getDay()]} {formatDate(date).slice(0, 5)}
                      </Text>
                      <View className={`w-full items-center rounded-lg py-1.5 ${bg}`}>
                        <Text variant="label" weight="bold" color={fg}>
                          {day ? onSale : '—'}
                        </Text>
                      </View>
                      <Text variant="caption" weight="semibold">
                        {price != null ? compact.format(price) : prices[index]?.isPending ? '…' : '—'}
                      </Text>
                      {change !== 0 && (
                        <Text variant="caption" weight="semibold" color={change < 0 ? '#0b5a36' : '#7a4600'}>
                          {change > 0 ? '+' : ''}
                          {change}%
                        </Text>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </Card>
          );
        })
      )}

      <Card>
        <CardHead icon="sell" title="Quy tắc giá đang áp dụng" />
        {rules.isPending ? (
          <ActivityIndicator color={colors.primary} />
        ) : rules.isError ? (
          <Text variant="small" color={colors.error}>
            {apiErrorMessage(rules.error, 'Không tải được quy tắc giá.')}
          </Text>
        ) : activeRules.length === 0 ? (
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Không có quy tắc nào; mọi đêm tính theo giá gốc.
          </Text>
        ) : (
          activeRules.map((r, i) => (
            <View key={r.id} className={`gap-1 ${i > 0 ? 'border-t border-surface-container-high pt-2.5' : ''}`}>
              <KV label={r.name} value={adjustment(r)} strong color={r.adjustmentValue < 0 && r.adjustmentType !== 'SET_PRICE' ? '#0b5a36' : undefined} labelColor={colors.onSurface} />
              <Text variant="caption" color={colors.onSurfaceVariant}>
                {[
                  typeName(r.roomTypeId),
                  ruleType[r.ruleType],
                  r.validFrom || r.validTo ? `${r.validFrom ? formatDate(r.validFrom.slice(0, 10)) : '…'} – ${r.validTo ? formatDate(r.validTo.slice(0, 10)) : '…'}` : null,
                  r.dayOfWeek ? dayOfWeek[r.dayOfWeek] : null,
                  r.minDaysBefore != null ? `đặt trước ≥ ${r.minDaysBefore} ngày` : null,
                  r.maxDaysBefore != null ? `đặt trước ≤ ${r.maxDaysBefore} ngày` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
          ))
        )}
      </Card>
    </StaffScreen>
  );
}
