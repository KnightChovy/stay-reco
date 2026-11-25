import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ONBOARDING_LIMITS, type CompleteOnboardingInput, type OnboardingHotelsQuery, type Voucher } from '@stayreco/shared';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { AMENITIES, BUDGETS, STYLES, toggle } from '@/features/recommendations/preference-options';
import { images } from '@/lib/mock-data';
import { formatVnd } from '@/lib/stay';
import { apiErrorMessage } from '@/services/ApiService';
import { completeOnboarding, getOnboarding, getOnboardingHotels, skipOnboarding } from '@/services/recommendations.service';

type Picks = { cities: string[]; hotelIds: string[]; viewIds: string[]; travelStyles: string[]; roomAmenities: string[]; budget: string };
const EMPTY: Picks = { cities: [], hotelIds: [], viewIds: [], travelStyles: [], roomAmenities: [], budget: '' };

const countPicks = (p: Picks) =>
  p.cities.length + p.hotelIds.length + p.viewIds.length + p.travelStyles.length + p.roomAmenities.length + (p.budget ? 1 : 0);

/** Các câu trả lời dùng để chọn khách sạn cho bước cuối: mọi thứ trừ chính các khách sạn. */
function toHotelsQuery(p: Picks): OnboardingHotelsQuery {
  const list = (items: string[]) => (items.length ? items : undefined);
  return {
    cities: list(p.cities),
    travelStyles: list(p.travelStyles),
    roomAmenities: list(p.roomAmenities),
    viewIds: list(p.viewIds),
    budgetPerNight: p.budget ? Number(p.budget) : undefined,
  };
}

/** Danh sách để trống thì bỏ đi, backend giữ nguyên sở thích đã lưu trước đó. */
function toInput(p: Picks): CompleteOnboardingInput {
  const list = (items: string[]) => (items.length ? items : undefined);
  return {
    cities: list(p.cities),
    hotelIds: list(p.hotelIds),
    viewIds: list(p.viewIds),
    travelStyles: list(p.travelStyles),
    roomAmenities: list(p.roomAmenities),
    budgetPerNight: p.budget ? Number(p.budget) : undefined,
  };
}

function PickCard({ title, subtitle, image, selected, onPress }: { title: string; subtitle: string; image: string | null; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={title}
      onPress={onPress}
      className={`w-[48%] overflow-hidden rounded-lg bg-surface-container-lowest shadow-card ${selected ? 'border-2 border-primary' : 'border-2 border-transparent'}`}
    >
      <Image source={image ?? images.anNhien} className="h-24 w-full" contentFit="cover" />
      {selected && (
        <View className="absolute right-2 top-2 h-6 w-6 items-center justify-center rounded-full bg-primary">
          <Icon name="check" size={16} color={colors.white} />
        </View>
      )}
      <View className="gap-0.5 p-2.5">
        <Text variant="small" weight="semibold" numberOfLines={2}>
          {title}
        </Text>
        <Text variant="caption" color={colors.onSurfaceVariant} numberOfLines={4}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

function WelcomeDone({ voucher }: { voucher: Voucher | null }) {
  return (
    <View className="flex-1 items-center justify-center gap-4 p-6">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-secondary-fixed">
        <Icon name="featured_seasonal_and_gifts" size={32} color={colors.secondary} />
      </View>
      <Text variant="h2" center>
        Cảm ơn bạn!
      </Text>
      <Text variant="small" color={colors.onSurfaceVariant} center>
        StayReco đã lưu sở thích của bạn. Gợi ý khách sạn sẽ hợp gu hơn từ lần sau.
      </Text>
      {voucher ? (
        <View className="w-full items-center gap-1.5 rounded-lg border border-dashed border-primary bg-surface-container-lowest p-4">
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Voucher chào mừng của bạn
          </Text>
          <Text variant="h2" color={colors.primary} selectable>
            {voucher.code}
          </Text>
          <Text variant="caption" color={colors.onSurfaceVariant} center>
            {voucher.discountType === 'PERCENTAGE'
              ? `Giảm ${voucher.discountValue}%${voucher.maxDiscount ? `, tối đa ${formatVnd(voucher.maxDiscount)}` : ''}`
              : `Giảm ${formatVnd(voucher.discountValue)}`}
            {voucher.minBookingAmount ? ` · Đơn từ ${formatVnd(voucher.minBookingAmount)}` : ''}
            {voucher.expiresAt ? ` · Hết hạn ${new Date(voucher.expiresAt).toLocaleDateString('vi-VN')}` : ''}
          </Text>
        </View>
      ) : (
        <Text variant="small" color={colors.onSurfaceVariant} center>
          Voucher chào mừng hiện chưa phát được. Bạn xem lại trong mục Voucher sau nhé.
        </Text>
      )}
      <View className="w-full gap-2">
        <Button label="Xem gợi ý cho bạn" leadingIcon="auto_awesome" onPress={() => router.replace('/recommendations')} />
        <Button label="Về trang chủ" variant="secondary" onPress={() => router.replace('/')} />
      </View>
    </View>
  );
}

/**
 * Sở thích lần đầu đăng nhập (docs/api/onboarding.md): điểm đến, rồi gu, tiện nghi, tầm nhìn và ngân sách, cuối cùng là
 * khách sạn hợp với các câu trả lời đó (`GET /me/onboarding/hotels`), để khách không chọn khách sạn trái với gu vừa chọn.
 * Đổi một câu trả lời ở bước trước thì xoá các khách sạn đã chọn, vì chúng được gợi ý cho câu trả lời cũ.
 * Chọn ít nhất `ONBOARDING_LIMITS.minPicks` mục để hoàn tất và nhận voucher chào mừng. "Để sau" ghi nhận bỏ qua;
 * có thể làm lại từ /account/preferences và vẫn nhận mã.
 */
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['onboarding'], queryFn: getOnboarding });
  const [stepIndex, setStepIndex] = useState(0);
  const [picks, setPicks] = useState<Picks>(EMPTY);
  const [voucher, setVoucher] = useState<Voucher | null | undefined>(undefined);
  const [onHotelStep, setOnHotelStep] = useState(false);
  const hotelsQuery = toHotelsQuery(picks);
  const suggestions = useQuery({
    queryKey: ['onboarding-hotels', hotelsQuery],
    queryFn: () => getOnboardingHotels(hotelsQuery),
    enabled: onHotelStep,
    staleTime: 5 * 60_000,
  });

  const done = (onboarding: unknown) => {
    queryClient.setQueryData(['onboarding'], onboarding);
    void queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    void queryClient.invalidateQueries({ queryKey: ['preferences'] });
    void queryClient.invalidateQueries({ queryKey: ['vouchers'] });
  };
  const complete = useMutation({
    mutationFn: () => completeOnboarding(toInput(picks)),
    onSuccess: (result) => {
      done(result);
      setVoucher(result.voucher);
    },
  });
  const skip = useMutation({
    mutationFn: skipOnboarding,
    onSuccess: done,
    onSettled: () => (router.canGoBack() ? router.back() : router.replace('/')),
  });

  const onboarding = query.data;
  if (voucher !== undefined) return <WelcomeDone voucher={voucher} />;
  if (query.isError) {
    return (
      <View className="flex-1 items-center justify-center gap-3 p-6" style={{ paddingTop: insets.top }}>
        <Text variant="small" color={colors.onSurfaceVariant} center>
          Không tải được câu hỏi. Vui lòng kiểm tra kết nối.
        </Text>
        <Button label="Thử lại" variant="secondary" size="sm" onPress={() => void query.refetch()} />
        <Button label="Để sau" variant="ghost" size="sm" onPress={() => router.back()} />
      </View>
    );
  }
  if (!onboarding) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text variant="small" color={colors.onSurfaceVariant}>
          Đang tải…
        </Text>
      </View>
    );
  }
  if (onboarding.status === 'COMPLETED') return <WelcomeDone voucher={onboarding.voucher} />;

  const options = onboarding.options;
  const steps = [
    { key: 'destinations' as const, show: !!options?.destinations.length },
    { key: 'taste' as const, show: true },
    { key: 'hotels' as const, show: true },
  ].filter((step) => step.show);
  const step = steps[Math.min(stepIndex, steps.length - 1)].key;
  const isLast = stepIndex >= steps.length - 1;
  const picked = countPicks(picks);
  const enough = picked >= ONBOARDING_LIMITS.minPicks;
  const busy = complete.isPending || skip.isPending;
  const edit = (next: (prev: Picks) => Picks) => {
    complete.reset();
    setPicks(next);
  };
  /** Đổi câu trả lời ở bước trước: các khách sạn đã chọn được gợi ý cho câu trả lời cũ, nên bỏ đi. */
  const answer = (next: (prev: Picks) => Picks) => edit((p) => ({ ...next(p), hotelIds: [] }));
  const goTo = (index: number) => {
    setStepIndex(index);
    setOnHotelStep(steps[Math.min(index, steps.length - 1)].key === 'hotels');
  };
  // Bỏ qua lần nữa sau khi đã bỏ qua không đổi gì: chỉ khách NEW mới ghi nhận.
  const later = () => {
    if (busy) return;
    if (onboarding.status === 'NEW') skip.mutate();
    else router.back();
  };

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <View className="gap-1 border-b border-surface-container-high px-4 pb-3 pt-3">
        <View className="flex-row items-center justify-between">
          <Text variant="caption" weight="semibold" color={colors.primary}>
            Bước {stepIndex + 1}/{steps.length}
          </Text>
          <Pressable accessibilityRole="button" onPress={later} disabled={busy} hitSlop={8}>
            <Text variant="small" weight="semibold" color={colors.onSurfaceVariant}>
              {skip.isPending ? 'Đang lưu…' : 'Để sau'}
            </Text>
          </Pressable>
        </View>
        <Text variant="h2">
          {step === 'destinations' ? 'Bạn muốn đi đâu?' : step === 'hotels' ? 'Khách sạn hợp gu của bạn' : 'Gu nghỉ dưỡng của bạn'}
        </Text>
        <Text variant="small" color={colors.onSurfaceVariant}>
          {step === 'hotels' ? 'Dựa trên điểm đến và gu bạn vừa chọn. ' : ''}Chọn ít nhất {ONBOARDING_LIMITS.minPicks} mục để StayReco gợi ý hợp gu hơn, kèm voucher chào mừng.
        </Text>
      </View>

      <ScrollView contentContainerClassName="gap-4 p-4 pb-8" showsVerticalScrollIndicator={false}>
        {step === 'destinations' && options && (
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {options.destinations.map((d) => (
              <PickCard
                key={d.city}
                title={d.city}
                subtitle={`${d.hotels} khách sạn`}
                image={d.imageUrl}
                selected={picks.cities.includes(d.city)}
                onPress={() => answer((p) => ({ ...p, cities: toggle(p.cities, d.city) }))}
              />
            ))}
          </View>
        )}
        {step === 'hotels' &&
          (suggestions.isPending ? (
            <Text variant="small" color={colors.onSurfaceVariant} center>
              Đang tìm khách sạn hợp gu…
            </Text>
          ) : suggestions.isError ? (
            <View className="items-center gap-2">
              <Text variant="small" color={colors.onSurfaceVariant} center>
                {apiErrorMessage(suggestions.error, 'Không tải được khách sạn. Vui lòng thử lại.')}
              </Text>
              <Button label="Thử lại" variant="secondary" size="sm" onPress={() => void suggestions.refetch()} />
            </View>
          ) : !suggestions.data.length ? (
            <Text variant="small" color={colors.onSurfaceVariant} center>
              Chưa có khách sạn nào ở điểm đến bạn chọn hợp với gu này. Bạn có thể hoàn tất luôn, hoặc quay lại đổi điểm đến hay
              phong cách.
            </Text>
          ) : (
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {suggestions.data.map((h) => (
                <PickCard
                  key={h.id}
                  title={h.name}
                  subtitle={[
                    `${h.city}${h.rating != null ? ` · ★ ${h.rating.toFixed(1)}` : ''}`,
                    h.pricePerNightFrom != null ? `Từ ${formatVnd(h.pricePerNightFrom)}/đêm${h.overBudget ? ' · trên ngân sách' : ''}` : null,
                    h.matches.length ? `Hợp: ${h.matches.join(' · ')}` : null,
                  ]
                    .filter(Boolean)
                    .join('\n')}
                  image={h.imageUrl}
                  selected={picks.hotelIds.includes(h.id)}
                  onPress={() => edit((p) => ({ ...p, hotelIds: toggle(p.hotelIds, h.id) }))}
                />
              ))}
            </View>
          ))}
        {step === 'taste' && (
          <>
            <Text variant="label" weight="semibold">
              Phong cách du lịch
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {STYLES.map((st) => (
                <Chip
                  key={st.id}
                  label={st.title}
                  icon={st.icon}
                  tone={picks.travelStyles.includes(st.id) ? 'selected' : 'outline'}
                  onPress={() => answer((p) => ({ ...p, travelStyles: toggle(p.travelStyles, st.id) }))}
                />
              ))}
            </View>
            <Text variant="label" weight="semibold">
              Tiện nghi mong muốn
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {AMENITIES.map((a) => (
                <Chip
                  key={a.id}
                  label={a.label}
                  tone={picks.roomAmenities.includes(a.id) ? 'selected' : 'outline'}
                  onPress={() => answer((p) => ({ ...p, roomAmenities: toggle(p.roomAmenities, a.id) }))}
                />
              ))}
            </View>
            {!!options?.views.length && (
              <>
                <Text variant="label" weight="semibold">
                  Tầm nhìn
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {options.views.map((v) => (
                    <Chip
                      key={v.id}
                      label={v.name}
                      tone={picks.viewIds.includes(v.id) ? 'selected' : 'outline'}
                      onPress={() => answer((p) => ({ ...p, viewIds: toggle(p.viewIds, v.id) }))}
                    />
                  ))}
                </View>
              </>
            )}
            <Text variant="label" weight="semibold">
              Ngân sách mỗi đêm
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {BUDGETS.map((b) => (
                <Chip key={b.id || 'none'} label={b.label} tone={picks.budget === b.id ? 'selected' : 'outline'} onPress={() => answer((p) => ({ ...p, budget: b.id }))} />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <View className="gap-2 border-t border-surface-container-high bg-surface-container-lowest p-4" style={{ paddingBottom: Math.max(insets.bottom, 12) + 4 }}>
        {complete.isError && (
          <Text variant="small" color={colors.error}>
            {apiErrorMessage(complete.error, 'Không lưu được lựa chọn. Vui lòng thử lại.')}
          </Text>
        )}
        <Text variant="caption" color={enough ? colors.secondary : colors.onSurfaceVariant} center>
          Đã chọn {picked}/{ONBOARDING_LIMITS.minPicks} mục{enough ? ' · đủ để nhận voucher' : ''}
        </Text>
        <View className="flex-row gap-2">
          {stepIndex > 0 && <Button label="Quay lại" variant="secondary" className="flex-1" disabled={busy} onPress={() => goTo(stepIndex - 1)} />}
          {isLast ? (
            <Button
              label={complete.isPending ? 'Đang lưu…' : 'Hoàn tất & nhận voucher'}
              className="flex-1"
              disabled={!enough || busy}
              onPress={() => complete.mutate()}
            />
          ) : (
            <Button label="Tiếp tục" icon="arrow_forward" className="flex-1" disabled={busy} onPress={() => goTo(stepIndex + 1)} />
          )}
        </View>
      </View>
    </View>
  );
}
