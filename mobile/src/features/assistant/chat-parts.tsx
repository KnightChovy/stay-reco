import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { AssistantHotel, AssistantMessage, BookingProposal } from '@stayreco/shared';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { images } from '@/lib/mock-data';
import { formatDate, formatVnd } from '@/lib/stay';

/** Ngày lưu trú cuộc trò chuyện đã chốt (từ đề xuất gần nhất), để mở khách sạn đúng ngày. */
export type StayDates = { checkIn: string; checkOut: string; guests: number; rooms: number } | null;

const time = (iso: string) => new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

/** `**đậm**` trong một dòng. */
function Inline({ text, color }: { text: string; color?: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <Text variant="body" color={color}>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? (
          <Text key={i} variant="body" weight="bold" color={color}>
            {p.slice(2, -2)}
          </Text>
        ) : (
          p
        ),
      )}
    </Text>
  );
}

/** Markdown nhẹ của trợ lý: đoạn văn, gạch đầu dòng (`-`, `*`, `•`, `1.`) và chữ đậm; không HTML. */
export function ChatMarkdown({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <View className="gap-1.5">
      {lines.map((raw, i) => {
        const line = raw.trim();
        if (!line) return null;
        const bullet = /^([-*•]|\d+\.)\s+(.*)$/.exec(line);
        if (bullet) {
          return (
            <View key={i} className="flex-row gap-2 pl-1">
              <Text variant="body">{/^\d/.test(bullet[1]) ? bullet[1] : '•'}</Text>
              <View className="flex-1">
                <Inline text={bullet[2]} />
              </View>
            </View>
          );
        }
        return <Inline key={i} text={line.replace(/^#+\s*/, '')} />;
      })}
    </View>
  );
}

function HotelCards({ hotels, dates }: { hotels: AssistantHotel[]; dates: StayDates }) {
  if (hotels.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2.5 pr-4">
      {hotels.map((hotel) => (
        <Pressable
          key={hotel.id}
          accessibilityRole="link"
          accessibilityLabel={`Xem ${hotel.name}`}
          onPress={() =>
            router.push({ pathname: '/hotels/[id]', params: { id: hotel.id, destination: hotel.city, ...(dates ?? {}) } })
          }
          className="w-56 overflow-hidden rounded-lg bg-surface-container-lowest shadow-card"
        >
          <View className="h-28 bg-surface-container">
            <Image source={hotel.coverImageUrl ?? images.anNhien} className="absolute inset-0" contentFit="cover" />
            {hotel.rating !== null && (
              <View className="absolute left-2 top-2 flex-row items-center gap-1 rounded-full bg-white/[0.92] px-2 py-0.5">
                <Icon name="star" size={12} color="#f5c04a" />
                <Text variant="caption" weight="bold">
                  {hotel.rating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
          <View className="gap-1 p-3">
            <Text variant="label" weight="semibold" numberOfLines={2}>
              {hotel.name}
            </Text>
            <Text variant="caption" color={colors.onSurfaceVariant}>
              {hotel.city}
              {hotel.starRating ? ` · ${hotel.starRating} sao` : ''}
            </Text>
            {!!hotel.reason && (
              <Text variant="caption" color={colors.secondary} numberOfLines={2}>
                {hotel.reason}
              </Text>
            )}
            <Text variant="label" weight="bold" color={colors.primary}>
              {hotel.fromTotal !== null
                ? `${formatVnd(hotel.fromTotal)} · ${hotel.nights} đêm`
                : hotel.pricePerNightFrom !== null
                  ? `Từ ${formatVnd(hotel.pricePerNightFrom)} / đêm`
                  : 'Xem giá theo ngày'}
            </Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

/** Đơn trợ lý đã tính giá. Trợ lý không tự đặt: khách bấm "Xác nhận đặt phòng" một lần, trong 30 phút. */
function ProposalCard({ proposal, now, pending, onConfirm }: { proposal: BookingProposal; now: number; pending: boolean; onConfirm: () => void }) {
  const booked = proposal.bookingId !== null;
  const expired = !booked && Date.parse(proposal.expiresAt) <= now;
  return (
    <View className="overflow-hidden rounded-lg border border-primary-fixed bg-surface-container-lowest">
      <View className="flex-row items-center justify-between gap-2 bg-surface-container-low px-3.5 py-2.5">
        <Text variant="caption" weight="bold" color={colors.primary}>
          ĐỀ XUẤT ĐẶT PHÒNG
        </Text>
        <Text variant="caption" weight="semibold" color={booked ? colors.secondary : colors.onSurfaceVariant}>
          {booked ? 'Đã đặt' : expired ? 'Đã hết hạn' : `Giữ giá đến ${time(proposal.expiresAt)}`}
        </Text>
      </View>
      <View className="gap-2 p-3.5">
        <View>
          <Text variant="label" weight="semibold">
            {proposal.hotelName}
          </Text>
          <Text variant="caption" color={colors.onSurfaceVariant}>
            {proposal.roomTypeName} × {proposal.rooms}
          </Text>
        </View>
        <Text variant="caption" color={colors.onSurfaceVariant}>
          {formatDate(proposal.checkIn)} → {formatDate(proposal.checkOut)} · {proposal.guests} khách · {proposal.guestName}
        </Text>
        <Text variant="caption" color={colors.secondary}>
          {proposal.freeCancellationUntil
            ? `Huỷ miễn phí đến ${new Date(proposal.freeCancellationUntil).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}`
            : 'Không huỷ miễn phí'}
        </Text>
        <View className="flex-row items-baseline justify-between border-t border-surface-container-high pt-2">
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Tổng tiền
          </Text>
          <Text variant="h3" weight="bold" color={colors.primary}>
            {formatVnd(proposal.total)}
          </Text>
        </View>
        {booked ? (
          <Button label="Xem chuyến đi" variant="secondary" onPress={() => router.push('/trips')} />
        ) : expired ? (
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Đề xuất chỉ giữ giá 30 phút. Nhắn trợ lý “báo giá lại” để có đề xuất mới.
          </Text>
        ) : (
          <>
            <Button label={pending ? 'Đang đặt…' : 'Xác nhận đặt phòng'} disabled={pending} onPress={onConfirm} />
            <Text variant="caption" color={colors.onSurfaceVariant} center>
              Bạn sẽ chuyển sang bước thanh toán, phòng được giữ 15 phút.
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

export function AssistantAvatar({ size = 32 }: { size?: number }) {
  return (
    <View className="items-center justify-center rounded-full bg-primary-container" style={{ width: size, height: size }}>
      <Icon name="auto_awesome" size={size / 2} color={colors.white} />
    </View>
  );
}

export function UserBubble({ text, note }: { text: string; note?: string }) {
  return (
    <View className="items-end gap-1">
      <View className="max-w-[85%] rounded-xl rounded-br-sm bg-primary p-3.5">
        <Text variant="body" color={colors.white}>
          {text}
        </Text>
      </View>
      {!!note && (
        <Text variant="caption" color={colors.onSurfaceVariant}>
          {note}
        </Text>
      )}
    </View>
  );
}

export function MessageRow({
  message,
  dates,
  now,
  confirmingId,
  onConfirm,
}: {
  message: AssistantMessage;
  dates: StayDates;
  now: number;
  confirmingId: string | null;
  onConfirm: (proposalId: string) => void;
}) {
  if (message.role === 'SYSTEM') {
    return (
      <Text variant="caption" color={colors.onSurfaceVariant} center className="mx-6 rounded-full bg-surface-container-low px-3 py-1.5">
        {message.content}
      </Text>
    );
  }
  if (message.role === 'USER') return <UserBubble text={message.content} note={time(message.createdAt)} />;
  return (
    <View className="flex-row gap-2.5">
      <AssistantAvatar />
      <View className="flex-1 gap-2.5">
        {!!message.content && (
          <View className="self-start rounded-xl rounded-tl-sm bg-surface-container-lowest p-3.5 shadow-card">
            <ChatMarkdown content={message.content} />
          </View>
        )}
        <HotelCards hotels={message.hotels} dates={dates} />
        {message.proposal && (
          <ProposalCard
            proposal={message.proposal}
            now={now}
            pending={confirmingId === message.proposal.id}
            onConfirm={() => onConfirm(message.proposal!.id)}
          />
        )}
        <Text variant="caption" color={colors.onSurfaceVariant}>
          Trợ lý StayReco · {time(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

export function TypingBubble() {
  return (
    <View className="flex-row items-center gap-2.5" accessibilityLiveRegion="polite">
      <AssistantAvatar />
      <View className="flex-row items-center gap-2 rounded-xl rounded-tl-sm bg-surface-container-lowest px-3.5 py-3 shadow-card">
        <ActivityIndicator size="small" color={colors.primary} />
        <Text variant="caption" color={colors.onSurfaceVariant}>
          Trợ lý đang tìm phòng và tính giá…
        </Text>
      </View>
    </View>
  );
}

export const STARTERS = [
  'Tìm khách sạn ở Đà Nẵng cho 2 người cuối tuần này',
  'Gợi ý chỗ nghỉ hợp với sở thích của tôi',
  'Khách sạn gần biển, có hồ bơi, dưới 2 triệu/đêm',
  'Đặt giúp tôi 1 phòng ở Hà Nội từ thứ Sáu đến Chủ nhật',
];
