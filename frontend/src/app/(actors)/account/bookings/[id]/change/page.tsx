'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  BedDouble,
  Calendar,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  UserCog,
} from 'lucide-react';
import type { Booking, ChangeRequestInput } from '@stayreco/shared';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppBreadcrumb from '@/components/common/breadcrumb/AppBreadcrumb';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { useBooking, useRequestBookingChange } from '@/features/booking/api/booking-queries';
import { formatDate, formatDateTime, formatMoney } from '@/features/stays/lib/format';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

export default function ChangeBookingPage() {
  const params = useParams<{ id: string }>();
  const bookingQuery = useBooking(params.id);
  const booking = bookingQuery.data;

  if (bookingQuery.isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f7f9ff]">
        <Header />
        <div className="flex flex-1 items-center justify-center gap-2 py-24 text-sm text-slate-500">
          <Loader2 className="size-5 animate-spin" /> Đang tải đơn đặt phòng…
        </div>
        <Footer />
      </div>
    );
  }

  if (bookingQuery.error || !booking) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f7f9ff]">
        <Header />
        <div className="mx-auto max-w-lg flex-1 px-4 py-20 text-center">
          <AlertTriangle className="mx-auto size-10 text-amber-500" />
          <h1 className="mt-3 text-xl font-bold text-[#202B36]">Không tìm thấy đặt phòng</h1>
          <p className="mt-1 text-sm text-slate-500">
            {bookingQuery.error ? getApiErrorMessage(bookingQuery.error) : 'Đơn đặt phòng không tồn tại.'}
          </p>
          <Link href="/account/bookings">
            <Button className="mt-5 bg-[#013758] text-white">Chuyến đi của tôi</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const pendingRequest = booking.changeRequest?.status === 'PENDING';
  const canChange =
    booking.status === 'CONFIRMED' &&
    booking.paymentStatus !== 'REFUND_PENDING' &&
    !pendingRequest;

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f9ff] font-sans text-[#202B36] antialiased">
      <Header />

      <main className="w-full flex-1 bg-[#f7f9ff] py-6 sm:py-10">
        <div className="mx-auto max-w-marketplace px-4 sm:px-6">
          <AppBreadcrumb
            items={[
              { label: 'Tài khoản', href: '/account/profile' },
              { label: 'Chuyến đi của tôi', href: '/account/bookings' },
              { label: `Chi tiết #${booking.code}`, href: `/account/bookings/${booking.id}` },
              { label: 'Đổi thông tin khách', active: true },
            ]}
          />

          <div className="mt-6 mb-8">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#EAF0F5] px-3 py-1 text-xs font-semibold text-[#013758]">
              <UserCog className="size-3.5" /> Cập nhật thông tin khách lưu trú
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#202B36] sm:text-3xl">
              Đổi thông tin khách
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Chỉ đổi được họ tên, số điện thoại, giờ đến và yêu cầu đặc biệt. Ngày lưu trú, hạng phòng và số khách
              không thay đổi.
            </p>
          </div>

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
              {pendingRequest ? (
                <Card className="rounded-xl border border-amber-200 bg-amber-50/70 p-5 shadow-none">
                  <h2 className="flex items-center gap-2 text-base font-bold text-amber-900">
                    <Clock className="size-4" /> Đang chờ khách sạn duyệt
                  </h2>
                  <p className="mt-1 text-xs text-amber-800">
                    Yêu cầu gửi lúc {formatDateTime(booking.changeRequest?.requestedAt)}. Bạn không thể gửi thêm
                    yêu cầu mới cho đến khi khách sạn phản hồi.
                  </p>
                  <div className="mt-4 space-y-1 rounded-lg bg-white p-3 text-xs">
                    {booking.changeRequest?.changes.guestName && (
                      <p><span className="text-slate-500">Họ tên:</span> <strong>{booking.changeRequest.changes.guestName}</strong></p>
                    )}
                    {booking.changeRequest?.changes.contactPhone && (
                      <p><span className="text-slate-500">SĐT:</span> <strong>{booking.changeRequest.changes.contactPhone}</strong></p>
                    )}
                    {booking.changeRequest?.changes.arrivalTime !== undefined && (
                      <p><span className="text-slate-500">Giờ đến:</span> <strong>{booking.changeRequest.changes.arrivalTime ?? 'Xoá'}</strong></p>
                    )}
                    {booking.changeRequest?.changes.specialRequests !== undefined && (
                      <p><span className="text-slate-500">Yêu cầu:</span> <strong>{booking.changeRequest.changes.specialRequests ?? 'Xoá'}</strong></p>
                    )}
                  </div>
                  <Link href={`/account/bookings/${booking.id}`}>
                    <Button variant="outline" className="mt-4 h-9 border-amber-300 text-xs font-semibold text-amber-900">
                      Về chi tiết đơn
                    </Button>
                  </Link>
                </Card>
              ) : canChange ? (
                <ChangeForm key={booking.id} booking={booking} />
              ) : (
                <Card className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
                  <h2 className="flex items-center gap-2 text-base font-bold text-[#202B36]">
                    <Info className="size-4 text-[#934a33]" /> Không thể đổi thông tin
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {booking.status !== 'CONFIRMED'
                      ? 'Chỉ đơn đã xác nhận mới đổi được thông tin khách.'
                      : booking.paymentStatus === 'REFUND_PENDING'
                        ? 'Đơn đang chờ xử lý hoàn tiền, hãy hoàn tất hoàn tiền trước.'
                        : 'Đơn không ở trạng thái cho phép đổi thông tin.'}
                  </p>
                  <Link href={`/account/bookings/${booking.id}`}>
                    <Button variant="outline" className="mt-4 h-9 text-xs font-semibold">
                      <ArrowLeft className="size-3.5" /> Về chi tiết đơn
                    </Button>
                  </Link>
                </Card>
              )}

              {booking.changeRequest && booking.changeRequest.status !== 'PENDING' && (
                <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-[#202B36]">
                    {booking.changeRequest.status === 'ACCEPTED' ? (
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="size-4 text-[#934a33]" />
                    )}
                    Yêu cầu gần nhất: {booking.changeRequest.status === 'ACCEPTED' ? 'Đã được duyệt' : 'Bị từ chối'}
                  </h2>
                  {booking.changeRequest.reason && (
                    <p className="mt-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                      Lý do: {booking.changeRequest.reason}
                    </p>
                  )}
                </Card>
              )}
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24 lg:col-span-4">
              <Card className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-md">
                <div className="border-b border-slate-200/60 bg-[#f1f3f9] p-5">
                  <h3 className="text-base font-bold tracking-tight text-[#202B36]">Đơn đặt phòng</h3>
                  <p className="font-mono text-sm font-bold text-[#013758]">{booking.code}</p>
                </div>
                <div className="space-y-3 p-5">
                  <div className="flex items-start gap-3">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      <Image
                        src={booking.hotel.coverImageUrl ?? FALLBACK_IMAGE}
                        alt={booking.hotel.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-bold text-[#202B36]">{booking.hotel.name}</h4>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                        <MapPin className="size-3" /> {booking.hotel.city}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-[#013758]">
                        <BedDouble className="size-3" /> {booking.roomType.name}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1 rounded-lg bg-[#f1f3f9] p-3 text-xs">
                    <p className="flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-[#013758]" /> {formatDate(booking.checkIn)} →{' '}
                      {formatDate(booking.checkOut)}
                    </p>
                    <p className="text-slate-500">
                      {booking.nights} đêm · {booking.rooms} phòng · {booking.guests} khách
                    </p>
                    <p className="font-semibold text-[#013758]">{formatMoney(booking.totalAmount)}</p>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600">
                    <p className="flex items-center gap-1.5">
                      <User className="size-3.5" /> {booking.guestName}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="size-3.5" /> {booking.contactPhone}
                    </p>
                  </div>
                  <p className="flex items-start gap-1.5 rounded-lg bg-[#EDF4EE] p-2.5 text-[11px] text-[#35624A]">
                    <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
                    Khách sạn sẽ nhận email và duyệt yêu cầu. Thông tin chỉ đổi sau khi được duyệt.
                  </p>
                </div>
              </Card>

              <div className="rounded-xl border border-slate-200/80 bg-white p-4 text-xs text-slate-500">
                <p className="flex items-center gap-1.5 font-semibold text-[#202B36]">
                  <Mail className="size-3.5 text-[#013758]" /> Cần hỗ trợ?
                </p>
                <p className="mt-1">Liên hệ khách sạn hoặc StayReco nếu cần hỗ trợ thêm.</p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function ChangeForm({ booking }: { booking: Booking }) {
  const [guestName, setGuestName] = useState(booking.guestName);
  const [contactPhone, setContactPhone] = useState(booking.contactPhone);
  const [arrivalTime, setArrivalTime] = useState(booking.arrivalTime ?? '');
  const [specialRequests, setSpecialRequests] = useState(booking.specialRequests ?? '');
  const [error, setError] = useState<string | null>(null);
  const request = useRequestBookingChange();

  const submit = () => {
    setError(null);

    if (!guestName.trim()) {
      setError('Vui lòng nhập họ tên khách.');
      return;
    }
    if (!/^\+?[\d\s-]{8,20}$/.test(contactPhone.trim())) {
      setError('Số điện thoại không hợp lệ (8–20 chữ số).');
      return;
    }

    const input: ChangeRequestInput = {};
    if (guestName.trim() !== booking.guestName) input.guestName = guestName.trim();
    if (contactPhone.trim() !== booking.contactPhone) input.contactPhone = contactPhone.trim();
    const arrival = arrivalTime.trim() || null;
    if (arrival !== booking.arrivalTime) input.arrivalTime = arrival;
    const requests = specialRequests.trim() || null;
    if (requests !== booking.specialRequests) input.specialRequests = requests;

    if (Object.keys(input).length === 0) {
      setError('Bạn chưa thay đổi thông tin nào.');
      return;
    }

    request.mutate(
      { bookingId: booking.id, input },
      {
        onError: (err) => {
          const code = getApiErrorCode(err);
          if (code === 'CHANGE_REQUEST_PENDING') {
            setError('Đơn đã có một yêu cầu đang chờ khách sạn duyệt.');
            return;
          }
          if (code === 'REFUND_DECISION_PENDING') {
            setError('Đơn đang chờ xử lý hoàn tiền, chưa thể đổi thông tin.');
            return;
          }
          if (code === 'BOOKING_STATUS_CONFLICT') {
            setError('Trạng thái đơn đã thay đổi. Vui lòng tải lại trang.');
            return;
          }
          setError(getApiErrorMessage(err, 'Không gửi được yêu cầu. Vui lòng thử lại.'));
        },
      },
    );
  };

  if (request.isSuccess && request.data) {
    return (
      <Card className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-6 shadow-none">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-7 shrink-0 text-emerald-600" />
          <div>
            <h2 className="text-lg font-bold text-emerald-900">Đã gửi yêu cầu đổi thông tin</h2>
            <p className="mt-1 text-sm text-emerald-800">
              Khách sạn sẽ xem và phản hồi. Bạn sẽ nhận email khi yêu cầu được duyệt hoặc bị từ chối.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/account/bookings/${booking.id}`}>
                <Button className="h-9 bg-[#013758] text-xs font-semibold text-white">Về chi tiết đơn</Button>
              </Link>
              <Link href={`/account/bookings/${booking.id}/change`}>
                <Button variant="outline" className="h-9 text-xs font-semibold">
                  Xem yêu cầu đang chờ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-5 rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-[#EAF0F5] text-[#013758]">
          <UserCog className="size-4" />
        </span>
        <div>
          <h2 className="text-base font-bold text-[#202B36]">Thông tin mới</h2>
          <p className="text-xs text-slate-500">Chỉ các trường bên dưới được thay đổi.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="guestName" className="text-xs font-semibold">
            Họ và tên khách nhận phòng
          </Label>
          <Input
            id="guestName"
            value={guestName}
            onChange={(event) => setGuestName(event.target.value)}
            className="h-11 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="contactPhone" className="text-xs font-semibold">
            Số điện thoại
          </Label>
          <Input
            id="contactPhone"
            value={contactPhone}
            onChange={(event) => setContactPhone(event.target.value)}
            className="h-11 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="arrivalTime" className="text-xs font-semibold">
            Giờ đến dự kiến
          </Label>
          <Input
            id="arrivalTime"
            type="time"
            value={arrivalTime}
            onChange={(event) => setArrivalTime(event.target.value)}
            className="h-11 text-sm"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="specialRequests" className="text-xs font-semibold">
            Yêu cầu đặc biệt
          </Label>
          <textarea
            id="specialRequests"
            rows={3}
            value={specialRequests}
            maxLength={500}
            onChange={(event) => setSpecialRequests(event.target.value)}
            className="w-full resize-none rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#013758]"
            placeholder="Để trống nếu muốn xoá yêu cầu cũ…"
          />
          <span className="block text-right text-[11px] text-slate-400">{specialRequests.length}/500</span>
        </div>
      </div>

      <div className="rounded-lg bg-[#f1f3f9] p-3 text-xs text-slate-600">
        <p className="flex items-start gap-1.5">
          <Info className="mt-0.5 size-3.5 shrink-0 text-[#013758]" />
          Ngày nhận/trả phòng, hạng phòng và số khách không thay đổi. Nếu cần đổi, hãy hủy và đặt lại.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-50 p-3">
          <AlertTitle className="text-xs">Không gửi được yêu cầu</AlertTitle>
          <AlertDescription className="mt-1 text-xs">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <Button
          onClick={submit}
          disabled={request.isPending}
          className="h-10 gap-2 bg-[#934a33] text-sm font-bold text-white hover:bg-[#7b3e2b]"
        >
          {request.isPending ? <Loader2 className="size-4 animate-spin" /> : <UserCog className="size-4" />}
          Gửi yêu cầu
        </Button>
        <Link href={`/account/bookings/${booking.id}`}>
          <Button variant="outline" className="h-10 border-slate-300 text-sm font-semibold">
            Hủy
          </Button>
        </Link>
      </div>
    </Card>
  );
}
