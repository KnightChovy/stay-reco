import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ContentStatus, ContentType, ContentVariant, SocialPlatform } from '@stayreco/shared';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import {
  ErrorCard,
  contentStatusLabels,
  contentTypeLabels,
  dateTime,
  formatUsd,
  ideaKindLabels,
  marketingError,
  platformLabels,
  useMarketingChanged,
} from '@/features/staff/marketing';
import { Card, FilterChips, Section, Sheet, StaffScreen, accent, s, useStaffHotel } from '@/features/staff/ui';
import { usePagedList } from '@/lib/paged';
import { createContent, generateContentVariants, getAiBudget, getBrandVoice, getContentIdeas, getContents } from '@/services/marketing.service';

type Tab = 'all' | 'draft' | 'pending' | 'approved' | 'published' | 'rejected';
const tabs: { key: Tab; label: string; status?: ContentStatus[] }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'draft', label: 'Bản nháp', status: ['DRAFT'] },
  { key: 'pending', label: 'Chờ duyệt', status: ['PENDING_APPROVAL'] },
  { key: 'approved', label: 'Đã duyệt', status: ['APPROVED', 'SCHEDULED'] },
  { key: 'published', label: 'Đã đăng', status: ['PUBLISHED'] },
  { key: 'rejected', label: 'Bị từ chối', status: ['REJECTED'] },
];

const types: ContentType[] = ['POST', 'PROMOTION', 'CAPTION', 'BLOG'];
// TikTok chỉ nhận video nên không mời viết cho nó (M12); undefined là "Chung".
// Không mời viết cho Instagram trên màn hình (2026-11-28).
const platforms: (SocialPlatform | undefined)[] = ['FACEBOOK', undefined];

/**
 * Nhờ AI viết: backend tự thêm giọng thương hiệu và số liệu khách sạn, nên một câu mô tả là đủ. AI viết 3 phiên bản
 * chưa lưu (một lần gọi model); nhân viên chọn một và chỉ bản đó được lưu thành DRAFT, rồi sửa tiếp ở màn soạn.
 */
function GenerateSheet({ hotelId, brief, setBrief, onClose }: { hotelId: string; brief: string | null; setBrief: (b: string) => void; onClose: () => void }) {
  const changed = useMarketingChanged();
  const [contentType, setContentType] = useState<ContentType>('POST');
  const [platform, setPlatform] = useState<SocialPlatform | undefined>('FACEBOOK');
  const generate = useMutation({ mutationFn: () => generateContentVariants(hotelId, { contentType, brief: brief!.trim(), platform }) });
  const save = useMutation({
    mutationFn: (variant: ContentVariant) => createContent(hotelId, { contentType, title: variant.title, body: variant.body }),
    onSuccess: (content) => {
      changed();
      // Không gọi close(): lúc này save vẫn đang pending nên close() bỏ qua và sheet đè lên màn soạn.
      generate.reset();
      onClose();
      router.push({ pathname: '/staff/marketing/editor', params: { id: content.id, generated: '1' } });
    },
  });
  const busy = generate.isPending || save.isPending;
  const length = brief?.trim().length ?? 0;
  const close = () => {
    if (busy) return;
    generate.reset();
    save.reset();
    onClose();
  };
  const error = save.error ?? generate.error;

  return (
    <Sheet visible={brief !== null} onClose={close} title="Viết nội dung bằng AI">
      {generate.data ? (
        <>
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Chọn một phiên bản để lưu thành bản nháp; các bản còn lại không được lưu. Bạn sửa tiếp được ở màn soạn.
          </Text>
          {generate.data.map((v, i) => (
            <Card key={i}>
              <Text variant="caption" weight="bold" color={colors.primary}>
                PHIÊN BẢN {i + 1}
              </Text>
              {!!v.title && (
                <Text variant="label" weight="bold">
                  {v.title}
                </Text>
              )}
              <Text variant="small">{v.body}</Text>
              <Button
                label={save.isPending && save.variables === v ? 'Đang lưu…' : 'Chọn bản này'}
                leadingIcon="check"
                size="sm"
                disabled={busy}
                onPress={() => save.mutate(v)}
              />
            </Card>
          ))}
          <Button label="Viết lại đề bài" leadingIcon="edit" variant="secondary" disabled={busy} onPress={() => generate.reset()} />
        </>
      ) : (
        <>
          <Text variant="caption" color={colors.onSurfaceVariant}>
            AI viết 3 phiên bản theo giọng thương hiệu của khách sạn và không tự bịa giá, ngày hay ưu đãi. Bản nháp cần chủ khách sạn duyệt trước khi đăng.
          </Text>
          <TextInput
            value={brief ?? ''}
            onChangeText={setBrief}
            editable={!busy}
            multiline
            maxLength={500}
            placeholder="Ví dụ: Cuối tuần này còn phòng hướng biển, mời khách gia đình"
            placeholderTextColor={colors.outline}
            accessibilityLabel="Bài viết nói về điều gì?"
            className="min-h-24 rounded-md border border-surface-container-high bg-surface-container-lowest p-3.5 font-be-regular text-sm text-on-surface"
            style={{ textAlignVertical: 'top' }}
          />
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Một câu là đủ; tối thiểu 5 ký tự · {length}/500
          </Text>
          <Text variant="label" weight="semibold">
            Loại nội dung
          </Text>
          <View className={s.wrap}>
            {types.map((t) => (
              <Chip key={t} label={contentTypeLabels[t]} tone={t === contentType ? 'selected' : 'outline'} onPress={() => setContentType(t)} />
            ))}
          </View>
          <Text variant="label" weight="semibold">
            Viết cho nền tảng
          </Text>
          <View className={s.wrap}>
            {platforms.map((p) => (
              <Chip key={p ?? 'any'} label={p ? platformLabels[p] : 'Chung'} tone={p === platform ? 'selected' : 'outline'} onPress={() => setPlatform(p)} />
            ))}
          </View>
          <Button
            label={generate.isPending ? 'AI đang viết 3 phiên bản…' : 'Viết 3 phiên bản'}
            leadingIcon="auto_awesome"
            size="lg"
            style={{ backgroundColor: accent }}
            disabled={busy || length < 5}
            onPress={() => generate.mutate()}
          />
        </>
      )}
      {!!error && (
        <Text variant="small" color={colors.error}>
          {marketingError(error, 'Không tạo được nội dung. Vui lòng thử lại.')}
        </Text>
      )}
    </Sheet>
  );
}

/** Giọng thương hiệu chủ khách sạn đã thiết lập, chỉ đọc: AI viết theo nó. */
function BrandVoiceCard({ hotelId }: { hotelId: string }) {
  const voice = useQuery({ queryKey: ['marketing', 'brand-voice', hotelId], queryFn: () => getBrandVoice(hotelId) });
  if (voice.isError || !voice.data) return null;
  const v = voice.data;
  return (
    <Card>
      <Text variant="label" weight="semibold">
        Giọng thương hiệu
      </Text>
      {v.summary ? (
        <>
          <Text variant="small">{v.summary}</Text>
          {!!v.audience && (
            <Text variant="caption" color={colors.onSurfaceVariant}>
              Khách hướng tới: {v.audience}
            </Text>
          )}
          {!!v.highlights && (
            <Text variant="caption" color={colors.onSurfaceVariant}>
              Điểm nổi bật: {v.highlights}
            </Text>
          )}
          {!!v.forbiddenWords && (
            <Text variant="caption" color={colors.error}>
              Tránh dùng: {v.forbiddenWords}
            </Text>
          )}
        </>
      ) : (
        <Text variant="caption" color={colors.onSurfaceVariant}>
          Chủ khách sạn chưa thiết lập giọng thương hiệu; AI viết theo giọng chung.
        </Text>
      )}
    </Card>
  );
}

export default function StaffMarketingContentScreen() {
  const { hotelId } = useStaffHotel();
  const changed = useMarketingChanged();
  // Chủ khách sạn duyệt/từ chối ở nơi khác: quay lại màn này thì đọc lại để thấy trạng thái mới.
  const queryClient = useQueryClient();
  useFocusEffect(useCallback(() => void queryClient.invalidateQueries({ queryKey: ['marketing'] }), [queryClient]));
  const [tab, setTab] = useState<Tab>('all');
  // null: sheet đóng; chuỗi: đề bài đang soạn (điền sẵn khi mở từ một gợi ý).
  const [brief, setBrief] = useState<string | null>(null);

  const budget = useQuery({ queryKey: ['marketing', 'budget', hotelId], queryFn: () => getAiBudget(hotelId!), enabled: !!hotelId }).data;
  const ideas = useQuery({ queryKey: ['marketing', 'ideas', hotelId], queryFn: () => getContentIdeas(hotelId!), enabled: !!hotelId });
  const status = tabs.find((t) => t.key === tab)?.status;
  const list = usePagedList(['marketing', 'contents', hotelId, tab], (page) => getContents(hotelId!, { page, pageSize: 20, status }), !!hotelId);

  return (
    <StaffScreen
      title="Thư viện nội dung AI"
      footer={<Button label="Viết bài bằng AI" leadingIcon="auto_awesome" size="lg" className={s.flex} style={{ backgroundColor: accent }} disabled={!hotelId} onPress={() => setBrief('')} />}
    >
      {budget && (
        <Card style={{ gap: 4 }}>
          <Text variant="caption" weight="bold" color={colors.onSurfaceVariant} className={s.upper}>
            Ngân sách AI tháng này
          </Text>
          <Text variant="h3" weight="bold">
            {formatUsd(budget.remainingUsd)} còn lại
          </Text>
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Đã dùng {formatUsd(budget.spentUsd)} / {formatUsd(budget.limitUsd)} · mỗi bài nháp khoảng $0.0005
            {budget.remainingUsd <= 0 ? ' · Hết ngân sách, AI viết lại được từ đầu tháng sau.' : ''}
          </Text>
        </Card>
      )}
      {hotelId && <BrandVoiceCard hotelId={hotelId} />}

      <Section title="Gợi ý chủ đề" action="Làm mới" onAction={changed} />
      {ideas.isPending ? (
        <ActivityIndicator color={colors.primary} />
      ) : ideas.isError ? (
        <Text variant="small" color={colors.onSurfaceVariant}>
          {marketingError(ideas.error, 'Không tải được gợi ý.')}
        </Text>
      ) : ideas.data.length === 0 ? (
        <Text variant="small" color={colors.onSurfaceVariant}>
          Hiện chưa có gợi ý: khách sạn không có phòng trống đáng kể, khuyến mãi đang chạy hay đánh giá 4.5★ mới.
        </Text>
      ) : (
        ideas.data.map((idea, i) => (
          <Card key={`${idea.kind}-${i}`}>
            <Chip label={ideaKindLabels[idea.kind].label} tone={ideaKindLabels[idea.kind].tone} />
            <Text variant="small" weight="bold">
              {idea.brief}
            </Text>
            <Text variant="caption" color={colors.onSurfaceVariant}>
              {idea.detail}
            </Text>
            <Button label="Viết từ gợi ý này" leadingIcon="auto_awesome" variant="secondary" size="sm" onPress={() => setBrief(idea.brief)} />
          </Card>
        ))
      )}

      <Section title={list.total === undefined ? 'Nội dung' : `Nội dung (${list.total})`} />
      <FilterChips items={tabs} value={tab} onChange={setTab} />
      {list.isError ? (
        <ErrorCard error={ideas.error} onRetry={list.refetch} />
      ) : !list.items ? (
        <ActivityIndicator color={colors.primary} />
      ) : list.items.length === 0 ? (
        <Text variant="small" color={colors.onSurfaceVariant} center>
          Chưa có nội dung nào ở mục này. Chọn một gợi ý phía trên hoặc tự nhập chủ đề, AI sẽ viết bản nháp trong vài giây.
        </Text>
      ) : (
        list.items.map((c) => (
          <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={c.title ?? 'Nội dung chưa có tiêu đề'} onPress={() => router.push({ pathname: '/staff/marketing/editor', params: { id: c.id } })}>
            <Card>
              {!!c.mediaUrl && <Image source={c.mediaUrl} className="h-[150px] rounded-md bg-surface-container" contentFit="cover" accessibilityLabel="Ảnh minh hoạ" />}
              <View className={s.wrap}>
                <Chip label={contentTypeLabels[c.contentType]} tone="secondary" />
                <Chip label={contentStatusLabels[c.status].label} tone={contentStatusLabels[c.status].tone} />
              </View>
              <Text variant="label" weight="bold">
                {c.title || '(Chưa có tiêu đề)'}
              </Text>
              <Text variant="small" color={colors.onSurfaceVariant} numberOfLines={3}>
                {c.body}
              </Text>
              <Text variant="caption" color={colors.outline}>
                {c.authorName ?? 'Chủ khách sạn'} · {dateTime(c.createdAt)}
              </Text>
            </Card>
          </Pressable>
        ))
      )}
      {list.hasMore && <Button label={list.loadingMore ? 'Đang tải…' : 'Tải thêm'} variant="secondary" disabled={list.loadingMore} onPress={list.loadMore} />}

      {hotelId && <GenerateSheet hotelId={hotelId} brief={brief} setBrief={setBrief} onClose={() => setBrief(null)} />}
    </StaffScreen>
  );
}
