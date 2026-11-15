import { useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { alert } from '@/lib/alert';
import { Image } from 'expo-image';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { MarketingContent, SocialAccount } from '@stayreco/shared';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import {
  EDITABLE_STATUSES,
  ErrorCard,
  SCHEDULABLE_STATUSES,
  ScheduleCard,
  contentStatusLabels,
  contentTypeLabels,
  dateTime,
  marketingError,
  platformLabels,
  useMarketingChanged,
} from '@/features/staff/marketing';
import { Banner, Card, CardHead, Segmented, StaffScreen, accent, s, useStaffHotel } from '@/features/staff/ui';
import { pickImageForm } from '@/lib/pick-image';
import {
  deleteContent,
  getContent,
  getSchedules,
  getSocialAccounts,
  removeContentImage,
  scheduleContent,
  submitContent,
  updateContent,
  uploadContentImage,
} from '@/services/marketing.service';

const statusHint: Record<MarketingContent['status'], string> = {
  DRAFT: 'Bản nháp: chỉnh sửa thoải mái, xong thì gửi chủ khách sạn duyệt.',
  PENDING_APPROVAL: 'Đang chờ chủ khách sạn duyệt. Nội dung tạm khoá chỉnh sửa.',
  APPROVED: 'Chủ khách sạn đã duyệt. Nội dung được giữ nguyên như lúc duyệt; hãy lên lịch đăng.',
  SCHEDULED: 'Đã lên lịch đăng. Khi chưa có lịch nào đăng xong, bạn có thể đăng thêm lên trang khác.',
  PUBLISHED: 'Bài đã được đăng.',
  REJECTED: 'Chủ khách sạn đã từ chối. Sửa theo góp ý rồi gửi duyệt lại.',
};

const DAY = 24 * 60 * 60 * 1000;
const HALF_HOUR = 30 * 60 * 1000;

function tomorrowAt9() {
  const d = new Date(Date.now() + DAY);
  d.setHours(9, 0, 0, 0);
  return d;
}

function Stepper({ label, onMinus, onPlus }: { label: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <View className={s.between}>
      <Button label="−" variant="muted" size="sm" onPress={onMinus} />
      <Text variant="small" weight="semibold" center className={s.flex}>
        {label}
      </Text>
      <Button label="+" variant="muted" size="sm" onPress={onPlus} />
    </View>
  );
}

/**
 * Đưa bài đã duyệt lên lịch và liệt kê các lịch của bài. Trang do chủ khách sạn kết nối, nhân viên chỉ chọn.
 * Không có endpoint "đăng ngay": đăng ngay là lên lịch không kèm giờ, job chạy mỗi phút sẽ đăng (M14).
 */
function SchedulePanel({ hotelId, content }: { hotelId: string; content: MarketingContent }) {
  const changed = useMarketingChanged();
  const canSchedule = SCHEDULABLE_STATUSES.includes(content.status);
  const accounts = useQuery({ queryKey: ['marketing', 'accounts', hotelId], queryFn: () => getSocialAccounts(hotelId), enabled: canSchedule });
  const schedules = useQuery({
    queryKey: ['marketing', 'schedules', hotelId, { contentId: content.id }],
    queryFn: () => getSchedules(hotelId, { contentId: content.id, pageSize: 100 }),
    refetchInterval: content.status === 'SCHEDULED' ? 20000 : false,
  }).data?.schedules;
  const [accountId, setAccountId] = useState<string | null>(null);
  const [mode, setMode] = useState<'later' | 'now'>('later');
  // shortcut: chỉnh ngày/giờ bằng nút ± (bước 30 phút) để khỏi thêm thư viện date picker; thêm picker native nếu cần phút lẻ.
  const [at, setAt] = useState(tomorrowAt9);
  const [done, setDone] = useState(false);
  const schedule = useMutation({
    mutationFn: () => scheduleContent(content.id, { socialAccountId: accountId!, scheduledAt: mode === 'later' ? at.toISOString() : null }),
    onSuccess: () => {
      setDone(true);
      setAccountId(null);
      changed();
    },
  });
  // Không cho lùi về quá khứ; nếu để màn hình tới lúc giờ hẹn trôi qua thì backend coi như "đăng ngay".
  const step = (ms: number) => setAt((prev) => new Date(Math.max(prev.getTime() + ms, Date.now() + HALF_HOUR)));

  const reasonFor = (a: SocialAccount) =>
    !a.usable ? 'Token đã hết hạn, nhờ chủ khách sạn kết nối lại' : a.platform === 'TIKTOK' ? 'TikTok chỉ nhận video, chưa hỗ trợ đăng' : a.platform === 'INSTAGRAM' && !content.mediaUrl ? 'Instagram cần bài có ảnh' : null;

  return (
    <>
      <Card>
        <CardHead icon="edit_calendar" title="Lên lịch đăng" />
        {!canSchedule ? (
          <Text variant="small" color={colors.onSurfaceVariant}>
            {content.status === 'PUBLISHED' ? 'Bài đã được đăng.' : 'Chỉ bài đã được chủ khách sạn duyệt mới lên lịch được. Gửi duyệt sau khi chỉnh sửa xong.'}
          </Text>
        ) : accounts.isPending ? (
          <ActivityIndicator color={colors.primary} />
        ) : accounts.isError ? (
          <Text variant="small" color={colors.error}>
            {marketingError(accounts.error, 'Không tải được các trang đã kết nối.')}
          </Text>
        ) : accounts.data.length === 0 ? (
          <Text variant="small" color="#7a4600">
            Khách sạn chưa kết nối trang Facebook / Instagram nào. Chủ khách sạn cần kết nối trang trước khi lên lịch.
          </Text>
        ) : (
          <>
            {accounts.data.map((a) => {
              const reason = reasonFor(a);
              const on = a.id === accountId;
              return (
                <Pressable
                  key={a.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on, disabled: !!reason }}
                  disabled={!!reason}
                  onPress={() => setAccountId(a.id)}
                  className={`${s.between} rounded-md border p-3 ${on ? 'border-primary bg-surface-container-low' : 'border-surface-container-high'} ${reason ? 'opacity-50' : ''}`}
                >
                  <View className={`${s.flex} gap-1`}>
                    <Text variant="small" weight="bold">
                      {platformLabels[a.platform]} · {a.accountName}
                    </Text>
                    <Text variant="caption" color={colors.onSurfaceVariant}>
                      {reason ?? (a.expiresAt ? `Token hết hạn ${dateTime(a.expiresAt)}` : 'Đang kết nối')}
                    </Text>
                  </View>
                  <Icon name={on ? 'radio_button_checked' : 'radio_button_unchecked'} size={20} color={on ? colors.primary : colors.outline} />
                </Pressable>
              );
            })}
            <Segmented
              items={[
                { key: 'later', label: 'Hẹn giờ' },
                { key: 'now', label: 'Đăng ngay' },
              ]}
              value={mode}
              onChange={setMode}
            />
            {mode === 'later' ? (
              <>
                <Stepper label={at.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })} onMinus={() => step(-DAY)} onPlus={() => step(DAY)} />
                <Stepper label={at.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} onMinus={() => step(-HALF_HOUR)} onPlus={() => step(HALF_HOUR)} />
              </>
            ) : (
              <Text variant="caption" color={colors.onSurfaceVariant}>
                Bài sẽ được đăng ở lượt chạy kế tiếp, trong vòng khoảng 1 phút.
              </Text>
            )}
            {schedule.isError && (
              <Text variant="small" color={colors.error}>
                {marketingError(schedule.error, 'Không lên lịch được. Vui lòng thử lại.')}
              </Text>
            )}
            {done && !schedule.isPending && (
              <Text variant="small" weight="semibold" color="#0b5a36">
                Đã lên lịch. Có thể đăng thêm lên trang khác.
              </Text>
            )}
            <Button
              label={schedule.isPending ? 'Đang lên lịch…' : mode === 'now' ? 'Đăng ngay' : 'Lên lịch đăng'}
              leadingIcon="send"
              style={{ backgroundColor: accent }}
              disabled={!accountId || schedule.isPending}
              onPress={() => schedule.mutate()}
            />
          </>
        )}
      </Card>
      {schedules?.map((item) => (
        <ScheduleCard key={item.id} schedule={item} />
      ))}
    </>
  );
}

function Workspace({ content, hotelId, generated }: { content: MarketingContent; hotelId?: string; generated: boolean }) {
  const changed = useMarketingChanged();
  const [title, setTitle] = useState(content.title ?? '');
  const [body, setBody] = useState(content.body);
  const editable = EDITABLE_STATUSES.includes(content.status);

  const titleChanged = title.trim() !== (content.title ?? '');
  const bodyChanged = body.trim() !== content.body;
  const dirty = titleChanged || bodyChanged;
  const patch = () => updateContent(content.id, { ...(titleChanged ? { title: title.trim() || null } : {}), ...(bodyChanged ? { body: body.trim() } : {}) });

  const save = useMutation({ mutationFn: patch, onSuccess: changed });
  // Chữ chưa lưu được lưu trước: thứ gửi đi là thứ chủ khách sạn đọc.
  const submit = useMutation({
    mutationFn: async () => {
      if (dirty) await patch();
      return submitContent(content.id);
    },
    onSuccess: changed,
  });
  const upload = useMutation({ mutationFn: (form: FormData) => uploadContentImage(content.id, form), onSuccess: changed });
  const removeImage = useMutation({ mutationFn: () => removeContentImage(content.id), onSuccess: changed });
  const remove = useMutation({
    mutationFn: () => deleteContent(content.id),
    onSuccess: () => {
      router.back();
      changed();
    },
  });
  const busy = save.isPending || submit.isPending || upload.isPending || removeImage.isPending || remove.isPending;
  const error = submit.error ?? save.error ?? upload.error ?? removeImage.error ?? remove.error;

  const pickImage = async () => {
    const form = await pickImageForm();
    if (form) upload.mutate(form);
  };
  const confirmDelete = () =>
    alert('Xoá nội dung này?', 'Ảnh đã tải lên cũng sẽ bị xoá.', [
      { text: 'Không', style: 'cancel' },
      { text: 'Xoá', style: 'destructive', onPress: () => remove.mutate() },
    ]);

  return (
    <StaffScreen
      title="Soạn & gửi duyệt"
      footer={
        editable ? (
          <>
            <Button label={save.isPending ? 'Đang lưu…' : 'Lưu nháp'} variant="secondary" className={s.flex} disabled={!dirty || busy || !body.trim()} onPress={() => save.mutate()} />
            <Button label={submit.isPending ? 'Đang gửi…' : 'Gửi duyệt'} leadingIcon="send" className={s.flex} style={{ backgroundColor: accent }} disabled={busy || !body.trim()} onPress={() => submit.mutate()} />
          </>
        ) : undefined
      }
    >
      {generated && content.status === 'DRAFT' && <Banner icon="check_circle" tone="blue" title="AI đã viết xong bản nháp" text="Đọc lại, chỉnh sửa và thêm ảnh trước khi gửi duyệt." />}
      {content.status === 'REJECTED' && !!content.rejectedReason && <Banner icon="cancel" tone="danger" title="Chủ khách sạn góp ý" text={content.rejectedReason} />}

      <Card>
        <View className={s.wrap}>
          <Chip label={contentStatusLabels[content.status].label} tone={contentStatusLabels[content.status].tone} />
          <Chip label={contentTypeLabels[content.contentType]} tone="secondary" />
        </View>
        <Text variant="caption" color={colors.onSurfaceVariant}>
          {statusHint[content.status]}
        </Text>
        <Text variant="caption" color={colors.outline}>
          {content.authorName ?? 'Chủ khách sạn'} · {dateTime(content.createdAt)}
        </Text>

        {editable ? (
          <>
            <Input label="Tiêu đề" value={title} onChangeText={setTitle} maxLength={255} editable={!busy} />
            <View className="gap-2">
              <Text variant="label" weight="semibold">
                Nội dung bài đăng
              </Text>
              <TextInput
                value={body}
                onChangeText={setBody}
                editable={!busy}
                multiline
                maxLength={10000}
                accessibilityLabel="Nội dung bài đăng"
                className="min-h-40 rounded-md border border-surface-container-high bg-surface-container-lowest p-3.5 font-be-regular text-sm leading-[21px] text-on-surface"
                style={{ textAlignVertical: 'top' }}
              />
              <Text variant="caption" color={colors.onSurfaceVariant}>
                AI không tự thêm giá, ngày hay ưu đãi. Kiểm tra lại mọi con số trước khi gửi. · {body.trim().length}/10.000
              </Text>
            </View>
          </>
        ) : (
          <>
            {!!content.title && (
              <Text variant="h3" weight="bold">
                {content.title}
              </Text>
            )}
            <Text variant="small">{content.body}</Text>
          </>
        )}

        <View className={s.divider} />
        <Text variant="label" weight="semibold">
          Ảnh minh hoạ
        </Text>
        {content.mediaUrl ? (
          <Image source={content.mediaUrl} className="h-[200px] rounded-md bg-surface-container" contentFit="cover" accessibilityLabel="Ảnh minh hoạ bài đăng" />
        ) : (
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Chưa có ảnh. Instagram bắt buộc phải có ảnh.
          </Text>
        )}
        {editable && (
          <>
            <View className={s.wrap}>
              <Button label={upload.isPending ? 'Đang tải lên…' : content.mediaUrl ? 'Đổi ảnh' : 'Tải ảnh lên'} leadingIcon="photo_library" variant="secondary" size="sm" disabled={busy} onPress={() => void pickImage()} />
              {!!content.mediaUrl && <Button label="Gỡ ảnh" leadingIcon="delete" variant="muted" size="sm" disabled={busy} onPress={() => removeImage.mutate()} />}
            </View>
            <Text variant="caption" color={colors.onSurfaceVariant}>
              JPG, PNG, WebP · tối đa 10 MB
            </Text>
          </>
        )}

        {!!error && (
          <Text variant="small" color={colors.error}>
            {marketingError(error)}
          </Text>
        )}
        {/* Backend chỉ cho xoá bài còn sửa được (DRAFT, REJECTED). */}
        {editable && <Button label={remove.isPending ? 'Đang xoá…' : 'Xoá nội dung'} leadingIcon="delete" variant="ghost" size="sm" disabled={busy} onPress={confirmDelete} />}
      </Card>

      {hotelId && <SchedulePanel hotelId={hotelId} content={content} />}
    </StaffScreen>
  );
}

export default function StaffMarketingEditorScreen() {
  const { id, generated } = useLocalSearchParams<{ id?: string; generated?: string }>();
  const { hotelId } = useStaffHotel();
  const content = useQuery({
    queryKey: ['marketing', 'content', id],
    queryFn: () => getContent(id!),
    enabled: !!id,
    // Bài đang chờ chủ duyệt hoặc chờ job đăng (chạy mỗi phút) thì đọc lại để thấy nó chuyển trạng thái.
    refetchInterval: (query) => (['PENDING_APPROVAL', 'SCHEDULED'].includes(query.state.data?.status ?? '') ? 20000 : false),
  });

  // Bài mới được tạo từ sheet "Viết bài bằng AI" ở thư viện, màn này luôn cần id.
  if (!id) return <Redirect href="/staff/marketing/content" />;
  if (!content.data)
    return <StaffScreen title="Soạn & gửi duyệt">{content.isError ? <ErrorCard error={content.error} onRetry={() => void content.refetch()} /> : <ActivityIndicator color={colors.primary} />}</StaffScreen>;
  // Đổi trạng thái thì dựng lại form từ dữ liệu server.
  return <Workspace key={`${content.data.id}-${content.data.status}`} content={content.data} hotelId={hotelId} generated={generated === '1'} />;
}
