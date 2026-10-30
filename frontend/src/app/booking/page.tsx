'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  Bed,
  Calendar,
  CheckCircle2,
  Info,
  Loader2,
  Lock,
  MapPin,
  ShieldCheck,
  Timer,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { useAuthStore } from '@/lib/auth-store';
import { useCreateBooking } from '@/features/booking/api/booking-queries';
import { useHotelListing, useRoomTypeListing } from '@/features/stays/api/stays-queries';
import { formatDate, formatMoney } from '@/features/stays/lib/format';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

function nightsBetween(checkIn: string, checkOut: string) {
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86_400_000));
}

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);

  const roomTypeId = searchParams.get('roomTypeId') ?? '';
  const hotelId = searchParams.get('hotelId') ?? '';
  const checkIn = searchParams.get('checkIn') ?? '';
  const checkOut = searchParams.get('checkOut') ?? '';
  const guests = Number(searchParams.get('guests') ?? 1) || 1;
  const rooms = Number(searchParams.get('rooms') ?? 1) || 1;

  const stayQuery = useMemo(
    () => ({ checkIn: checkIn || undefined, checkOut: checkOut || undefined, guests, rooms }),
    [checkIn, checkOut, guests, rooms],
  );

  const roomQuery = useRoomTypeListing(roomTypeId, stayQuery);
  const hotelQuery = useHotelListing(hotelId, stayQuery);
  const createBooking = useCreateBooking();

  const [guestName, setGuestName] = useState(user?.name ?? '');
  const [contactPhone, setContactPhone] = useState(user?.phone ?? '');
  const [arrivalTime, setArrivalTime] = useState('14:00');
  const [specialRequests, setSpecialRequests] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const roomType = roomQuery.data?.roomType;
  const offer = roomQuery.data?.offer;
  const hotel = hotelQuery.data?.hotel;
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const image = roomType?.images[0]?.url ?? hotel?.images[0]?.url ?? FALLBACK_IMAGE;

  const submit = () => {
    setFormError(null);
    if (!guestName.trim()) {
      setFormError('Vui lòng nhập tên khách nhận phòng.');
      return;
    }
    if (!/^\+?[\d\s-]{8,20}$/.test(contactPhone.trim())) {
      setFormError('Số điện thoại không hợp lệ (8–20 chữ số).');
      return;
    }
    if (!agreed) {
      setFormError('Vui lòng đồng ý chính sách hủy phòng và điều khoản dịch vụ.');
      return;
    }
    if (!offer || !roomTypeId || !checkIn || !checkOut) {
      setFormError('Thiếu thông tin hạng phòng hoặc ngày lưu trú.');
      return;
    }

    createBooking.mutate(
      {
        roomTypeId,
        checkIn,
        checkOut,
        guests,
        rooms,
        guestName: guestName.trim(),
        contactPhone: contactPhone.trim(),
        arrivalTime: /^([01]\d|2[0-3]):[0-5]\d$/.test(arrivalTime) ? arrivalTime : undefined,
        specialRequests: specialRequests.trim() || undefined,
        expectedTotal: offer.total,
      },
      {
        onSuccess: (booking) => {
          router.push(`/booking/payment?id=${booking.id}`);
        },
        onError: (error) => {
          const code = getApiErrorCode(error);
          if (code === 'BOOKING_PRICE_CHANGED') {
            setFormError('Giá phòng vừa thay đổi. Danh sách đã được cập nhật, vui lòng kiểm tra lại tổng tiền.');
            void roomQuery.refetch();
            return;
          }
          if (code === 'ROOM_SOLD_OUT') {
            setFormError('Hạng phòng đã hết trong những ngày này. Vui lòng chọn hạng phòng khác.');
            return;
          }
          setFormError(getApiErrorMessage(error, 'Không thể tạo đặt phòng. Vui lòng thử lại.'));
        },
      },
    );
  };

  if (!roomTypeId || !hotelId || !checkIn || !checkOut) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <AlertTriangle className="mx-auto size-10 text-amber-500" />
        <h1 className="mt-3 text-xl font-bold text-[#202B36]">Thiếu thông tin đặt phòng</h1>
        <p className="mt-1 text-sm text-slate-500">
          Hãy chọn khách sạn, hạng phòng và ngày lưu trú trước khi đặt.
        </p>
        <Link href="/search" className="mt-5 inline-block">
          <Button className="bg-[#013758] text-white">Tìm chỗ nghỉ</Button>
        </Link>
      </div>
    );
  }

  if (roomQuery.isLoading || hotelQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
        <Loader2 className="size-5 animate-spin" /> Đang tải thông tin đặt phòng…
      </div>
    );
  }

  if (roomQuery.error || !roomType || !offer) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <AlertTriangle className="mx-auto size-10 text-amber-500" />
        <h1 className="mt-3 text-xl font-bold text-[#202B36]">Không tải được hạng phòng</h1>
        <p className="mt-1 text-sm text-slate-500">
          {roomQuery.error
            ? getApiErrorMessage(roomQuery.error)
            : 'Hạng phòng không còn khả dụng cho khoảng ngày đã chọn.'}
        </p>
        <Link href={`/hotels/${hotelId}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&rooms=${rooms}`}>
          <Button className="mt-5 bg-[#013758] text-white">Về chỗ nghỉ</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-marketplace px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-[#ebd8cc] bg-[#F5EBE5] p-4 text-[#783520]">
        <Timer className="size-5 shrink-0 animate-pulse text-[#934a33]" />
        <span className="text-xs sm:text-sm">
          Phòng được giữ trong <strong className="font-bold">15 phút</strong> sau khi bạn xác nhận. Hoàn tất thanh
          toán trước khi hết hạn để giữ chỗ.
        </span>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-7">
            <div className="mb-6 flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <span className="flex size-8 items-center justify-center rounded-lg bg-[#EAF0F5] text-[#013758]">
                <User className="size-4" />
              </span>
              <h2 className="text-lg font-bold text-[#202B36]">Thông tin người liên hệ / đặt phòng</h2>
              <Badge className="ml-auto border-none bg-[#EDF4EE] text-xs font-medium text-[#35624A]">
                Tài khoản đã xác thực
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-semibold text-[#202B36] sm:text-sm">Họ và tên</Label>
                <Input
                  readOnly
                  value={user?.name ?? guestName}
                  className="h-11 cursor-not-allowed border-none bg-[#f1f3f9] text-sm font-medium text-[#202B36]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#202B36] sm:text-sm">Địa chỉ Email</Label>
                <Input
                  readOnly
                  value={user?.email ?? ''}
                  className="h-11 cursor-not-allowed border-none bg-[#f1f3f9] text-sm font-medium text-[#202B36]"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contactPhone" className="text-xs font-semibold text-[#202B36] sm:text-sm">
                  Số điện thoại liên lạc <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contactPhone"
                  value={contactPhone}
                  onChange={(event) => setContactPhone(event.target.value)}
                  placeholder="0912 345 678"
                  className="h-11 border-slate-300 text-sm"
                />
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-[#f1f3f9] p-3 text-xs text-slate-600">
              <Info className="mt-0.5 size-4 shrink-0 text-[#013758]" />
              <p className="leading-relaxed">
                Thông tin xác nhận, hóa đơn điện tử và mã QR voucher sẽ được gửi về email và số điện thoại này sau
                khi thanh toán thành công.
              </p>
            </div>
          </Card>

          <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-7">
            <div className="mb-6 flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <span className="flex size-8 items-center justify-center rounded-lg bg-[#EAF0F5] text-[#013758]">
                <Bed className="size-4" />
              </span>
              <h2 className="text-lg font-bold text-[#202B36]">Khách lưu trú & Yêu cầu đặc biệt</h2>
            </div>

            <div className="mb-5 space-y-1.5">
              <Label htmlFor="guestName" className="text-xs font-semibold text-[#202B36] sm:text-sm">
                Tên khách nhận phòng chính <span className="text-red-500">*</span>
              </Label>
              <Input
                id="guestName"
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                placeholder="Tên trên CMND/CCCD hoặc hộ chiếu"
                className="h-11 border-slate-300 bg-white text-sm"
              />
              <span className="block text-[11px] text-slate-500">
                Vui lòng cung cấp đúng tên trên giấy tờ tùy thân khi check-in.
              </span>
            </div>

            <div className="mb-5 max-w-xs space-y-1.5">
              <Label htmlFor="arrivalTime" className="text-xs font-semibold text-[#202B36] sm:text-sm">
                Giờ dự kiến nhận phòng
              </Label>
              <Input
                id="arrivalTime"
                type="time"
                value={arrivalTime}
                onChange={(event) => setArrivalTime(event.target.value)}
                className="h-11 border-slate-300 bg-white text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="specialRequests" className="text-xs font-semibold text-[#202B36] sm:text-sm">
                Ghi chú cho khách sạn
              </Label>
              <textarea
                id="specialRequests"
                rows={3}
                value={specialRequests}
                onChange={(event) => setSpecialRequests(event.target.value)}
                placeholder="Ví dụ: phòng tầng cao, yên tĩnh, chuẩn bị nôi em bé…"
                maxLength={500}
                className="w-full resize-none rounded-lg border border-slate-300 bg-white p-3 text-sm text-[#202B36] focus:outline-none focus:ring-2 focus:ring-[#013758]"
              />
              <span className="block text-right text-[11px] text-slate-400">{specialRequests.length}/500</span>
            </div>
          </Card>

          <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-7">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-[#EDF4EE] text-[#35624A]">
                <ShieldCheck className="size-4" />
              </span>
              <h2 className="text-lg font-bold text-[#202B36]">Chính sách hủy phòng</h2>
            </div>

            <div className="rounded-xl bg-[#EDF4EE]/70 p-4">
              {offer.freeCancellationUntil ? (
                <p className="flex items-start gap-2 text-xs font-semibold text-[#202B36] sm:text-sm">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#35624A]" />
                  Miễn phí hủy trước {new Date(offer.freeCancellationUntil).toLocaleString('vi-VN')}. Sau thời điểm
                  này, phí hủy là {offer.cancellationFeePercent}% giá trị đặt phòng.
                </p>
              ) : (
                <p className="flex items-start gap-2 text-xs font-semibold text-[#202B36] sm:text-sm">
                  <Info className="mt-0.5 size-5 shrink-0 text-[#934a33]" />
                  Hạng phòng này không hoàn hủy. Phí hủy là {offer.cancellationFeePercent}% giá trị đặt phòng.
                </p>
              )}
            </div>

            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors hover:bg-[#f1f3f9]">
              <Checkbox
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(!!checked)}
                className="mt-0.5 border-slate-400 data-[state=checked]:bg-[#013758]"
              />
              <span className="text-xs leading-relaxed text-[#202B36] sm:text-sm">
                Tôi đã đọc và đồng ý với quy định lưu trú của <strong>{hotel?.name ?? 'khách sạn'}</strong> và điều
                khoản dịch vụ của StayReco.
              </span>
            </label>
          </Card>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:col-span-4">
          <Card className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-md">
            <div className="border-b border-slate-200/60 bg-[#f1f3f9] p-5">
              <h3 className="text-base font-bold tracking-tight text-[#202B36]">Tóm tắt chuyến đi</h3>
              <span className="text-xs text-slate-500">Giá đã bao gồm thuế và phí dịch vụ</span>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  <Image src={image} alt={hotel?.name ?? roomType.name} fill className="object-cover" />
                </div>
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-bold text-[#202B36]">{hotel?.name ?? 'Chỗ nghỉ'}</h4>
                  <p className="mt-0.5 flex items-start gap-1 text-xs text-slate-500">
                    <MapPin className="mt-0.5 size-3 shrink-0" />
                    <span className="line-clamp-2">{hotel ? `${hotel.address}, ${hotel.city}` : '—'}</span>
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#013758]">{roomType.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#f1f3f9] p-3 text-xs">
                <div>
                  <span className="block text-[10px] font-semibold uppercase text-slate-400">Nhận phòng</span>
                  <span className="font-bold text-[#202B36]">{formatDate(checkIn)}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold uppercase text-slate-400">Trả phòng</span>
                  <span className="font-bold text-[#202B36]">{formatDate(checkOut)}</span>
                </div>
                <div className="col-span-2 flex items-center gap-1.5 border-t border-slate-200/60 pt-2 text-slate-600">
                  <Calendar className="size-3.5 text-[#013758]" />
                  <span>
                    {nights} đêm · {guests} khách · {rooms} phòng
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 border-t border-slate-200 pt-3 text-xs">
                {offer.nightlyPrices.map((night) => (
                  <div key={night.date} className="flex justify-between text-slate-600">
                    <span>Đêm {formatDate(night.date)}</span>
                    <span>{formatMoney(night.price)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-slate-600">
                  <span>
                    {rooms} phòng × {nights} đêm
                  </span>
                  <span>{formatMoney(offer.total)}</span>
                </div>
                <div className="my-2 h-px w-full bg-slate-200" />
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-[#202B36]">TỔNG THANH TOÁN</span>
                  <span className="text-2xl font-bold text-[#013758]">{formatMoney(offer.total)}</span>
                </div>
              </div>

              {formError && (
                <Alert variant="destructive" className="bg-red-50 p-3">
                  <AlertTitle className="text-xs">Không thể đặt phòng</AlertTitle>
                  <AlertDescription className="mt-1 text-xs">{formError}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={submit}
                disabled={!agreed || createBooking.isPending || offer.available < rooms}
                className="h-12 w-full gap-2 rounded-lg bg-[#234e70] text-sm font-bold text-white hover:bg-[#193B56]"
              >
                {createBooking.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Đang giữ phòng…
                  </>
                ) : (
                  <>
                    Tiếp tục thanh toán <ArrowRight className="size-4" />
                  </>
                )}
              </Button>

              {offer.available < rooms && (
                <p className="text-center text-xs font-semibold text-red-600">
                  Chỉ còn {offer.available} phòng cho khoảng ngày này.
                </p>
              )}

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Lock className="size-3.5 shrink-0 text-[#35624A]" />
                <span>Thanh toán an toàn; hệ thống tự xác nhận khi nhận được chuyển khoản.</span>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
          <Loader2 className="size-5 animate-spin" /> Đang tải…
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
