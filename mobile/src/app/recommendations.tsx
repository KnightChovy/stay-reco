import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { RecommendedHotelCard } from '@/features/recommendations/RecommendedHotelCard';
import { recommendationsQuery } from '@/services/recommendations.service';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Gợi ý khách sạn: khách hàng nhận danh sách riêng, người khác nhận danh sách chung. Lọc thành phố từ chính danh
 * sách (tối đa 20) nên không cần gọi lại API.
 */
export default function RecommendationsScreen() {
  const account = useAuthStore((s) => s.account);
  const personal = account?.role === 'CUSTOMER';
  const query = useQuery(recommendationsQuery({ limit: 20 }, personal));
  const [city, setCity] = useState<string | null>(null);
  const items = useMemo(() => query.data?.items ?? [], [query.data]);
  const cities = useMemo(() => [...new Set(items.map((h) => h.city))], [items]);
  const shown = city ? items.filter((h) => h.city === city) : items;

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader title="Gợi ý cho bạn" />
      <ScrollView contentContainerClassName="gap-4 p-4 pb-10" showsVerticalScrollIndicator={false}>
        {query.isError ? (
          <View className="items-center gap-3 py-6">
            <Text variant="small" color={colors.onSurfaceVariant} center>
              Không tải được gợi ý. Vui lòng kiểm tra kết nối.
            </Text>
            <Button label="Thử lại" leadingIcon="refresh" variant="secondary" size="sm" onPress={() => void query.refetch()} />
          </View>
        ) : query.isPending ? (
          <Text variant="small" color={colors.onSurfaceVariant} center>
            Đang tải gợi ý...
          </Text>
        ) : items.length === 0 ? (
          <View className="items-center gap-3 py-6">
            <Text variant="h3" center>
              Chưa có gợi ý
            </Text>
            <Text variant="small" color={colors.onSurfaceVariant} center>
              Hệ thống gợi ý đang được huấn luyện. Bạn tìm chỗ nghỉ theo điểm đến trong lúc chờ nhé.
            </Text>
            <Button label="Tìm chỗ nghỉ" leadingIcon="search" onPress={() => router.push('/search')} />
          </View>
        ) : (
          <>
            {personal && !query.data.personalized && (
              <View className="gap-2 rounded-lg bg-surface-container-low p-3.5">
                <Text variant="small" color={colors.onSurfaceVariant}>
                  Đây là các khách sạn được yêu thích nhất. Đặt phòng, đánh giá hoặc cập nhật sở thích để có gợi ý riêng cho bạn.
                </Text>
                <Button label="Cập nhật sở thích" variant="secondary" size="sm" className="self-start" onPress={() => router.push('/account/preferences')} />
              </View>
            )}
            {cities.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
                <Chip label="Tất cả" tone={city === null ? 'selected' : 'outline'} onPress={() => setCity(null)} />
                {cities.map((c) => (
                  <Chip key={c} label={c} tone={city === c ? 'selected' : 'outline'} onPress={() => setCity(c)} />
                ))}
              </ScrollView>
            )}
            {shown.map((h) => (
              <RecommendedHotelCard key={h.id} hotel={h} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
