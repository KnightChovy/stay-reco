'use client';

import { Suspense, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  BedDouble,
  CheckCircle2,
  Coins,
  ConciergeBell,
  Info,
  Loader2,
  Lock,
  ShieldCheck,
  Ticket,
  Timer,
  User,
  X,
} from 'lucide-react';
import { createBookingSchema } from '@stayreco/shared';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { getApiErrorCode, getApiErrorMessage, getApiFieldErrors, validateWith, type FieldErrors } from '@/lib/api-error';
import { useAuthStore } from '@/lib/auth-store';
import { cn } from '@/lib/utils';
import { useCreateBooking } from '@/features/booking/api/booking-queries';
import { useDiscountQuote, useVoucherOptions, voucherSaving } from '@/features/account/api/rewards-queries';
import { VoucherPicker } from '@/features/booking/components/VoucherPicker';
import { AddOnPicker, toAddOnLines, type AddOnQuantities } from '@/features/booking/components/AddOnPicker';
import { BookingSummary } from '@/features/booking/form/BookingSummary';
import { getDiscountQuote } from '@/services/rewards.service';
import { formatPoints } from '@/features/account/lib/rewards-labels';
import { useHotelListing, useRoomTypeListing } from '@/features/stays/api/stays-queries';
import { formatDateTime, formatMoney } from '@/features/stays/lib/format';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

/** Why a discount code was refused (docs/api/promotions.md). Not `VOUCHER_INVALID`, which is about the check-in QR. */
const VOUCHER_REFUSALS = new Set([
  'VOUCHER_NOT_FOUND',
  'VOUCHER_ALREADY_USED',
  'VOUCHER_EXPIRED',
  'VOUCHER_NOT_APPLICABLE',
]);

/** Fields in the order they appear, so the first error is the one focused. */
const FIELD_ORDER = ['contactPhone', 'guestName', 'arrivalTime', 'specialRequests', 'agreed'] as const;

const fieldClass = 'h-11 text-base sm:text-sm';
const cardClass = 'rounded-xl border border-border bg-card p-5 shadow-xs sm:p-7';

function nightsBetween(checkIn: string, checkOut: string) {
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86_400_000));
}

/** One-hour arrival windows from the hotel's check-in time to 23:00 ("14:00" → 14:00–15:00 … 23:00–24:00). */
function arrivalWindows(checkInTime: string | null | undefined) {
  const start = Number((checkInTime ?? '14:00').slice(0, 2)) || 14;
  return Array.from({ length: Math.max(1, 24 - start) }, (_, index) => {
    const hour = String(start + index).padStart(2, '0');
    const next = String(start + index + 1).padStart(2, '0');
    return { value: `${hour}:00`, label: `${hour}:00 – ${next}:00` };
  });
}

function SectionHeader({ icon: Icon, title, hint }: { icon: typeof User; title: string; hint?: string }) {
  return (
    <div className="mb-5 flex items-center gap-2.5 border-b border-border pb-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs font-medium text-destructive">
      {message}
    </p>
  );
}

function CenteredState({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <AlertTriangle className="mx-auto size-10 text-amber-500" aria-hidden />
      <h1 className="mt-3 text-xl font-bold text-foreground">{title}</h1>
      {children && <p className="mt-1 text-sm text-muted-foreground">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
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
  const stayHref = `/hotels/${hotelId}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&rooms=${rooms}`;

  const stayQuery = useMemo(
    () => ({ checkIn: checkIn || undefined, checkOut: checkOut || undefined, guests, rooms }),
    [checkIn, checkOut, guests, rooms],
  );

  const roomQuery = useRoomTypeListing(roomTypeId, stayQuery);
  const hotelQuery = useHotelListing(hotelId, stayQuery);
  const createBooking = useCreateBooking();

  // The account holder is the guest unless they say otherwise; the guest's name is then theirs.
  const [selfGuest, setSelfGuest] = useState(true);
  const [otherGuestName, setOtherGuestName] = useState('');
  const guestName = selfGuest ? (user?.name ?? '') : otherGuestName;
  const [contactPhone, setContactPhone] = useState(user?.phone ?? '');
  const [arrivalTime, setArrivalTime] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  /** The total the customer saw before the backend repriced the stay; shown next to the new one. */
  const [repricedFrom, setRepricedFrom] = useState<number | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Discount code and points: applied only once the backend accepted them (docs/api/promotions.md, loyalty.md).
  const [codeInput, setCodeInput] = useState('');
  // "auto" uses the voucher that saves the most, as soon as the codes are priced; any choice of the customer
  // (another code, a typed one, or none) switches to "manual" and is kept.
  const [selection, setSelection] = useState<{ mode: 'auto' } | { mode: 'manual'; code: string | undefined }>({
    mode: 'auto',
  });
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [checkingCode, setCheckingCode] = useState(false);
  const [pointsInput, setPointsInput] = useState('');
  const [pointsToUse, setPointsToUse] = useState<number | undefined>(undefined);
  const [pointsError, setPointsError] = useState<string | null>(null);
  const [addOnQuantities, setAddOnQuantities] = useState<AddOnQuantities>({});

  const stayInput = useMemo(
    () => (roomTypeId && checkIn && checkOut ? { roomTypeId, checkIn, checkOut, rooms } : null),
    [roomTypeId, checkIn, checkOut, rooms],
  );
  // Codes are only offered when the hotel listing confirms the room type belongs to `?hotelId=`: a wrong id shows no
  // code rather than another hotel's. (`GET /room-types/:id/listing` carries no hotel id to read it from directly.)
  const pricedHotelId = hotelQuery.data?.roomTypes.some((item) => item.roomType.id === roomTypeId)
    ? hotelQuery.data.hotel.id
    : '';
  const voucherOptions = useVoucherOptions(stayInput, pricedHotelId);
  // Until the hotel listing is in, the codes cannot even be asked for: that is still loading, not "no code".
  const vouchersLoading = hotelQuery.isLoading || voucherOptions.isLoading;
  const bestCode = voucherOptions.options.reduce<{ code: string; saving: number } | undefined>((best, option) => {
    const saving = voucherSaving(option);
    return saving > 0 && (!best || saving > best.saving) ? { code: option.voucher.code, saving } : best;
  }, undefined)?.code;
  const autoPending = selection.mode === 'auto' && vouchersLoading;
  const appliedCode = selection.mode === 'auto' ? (autoPending ? undefined : bestCode) : selection.code;
  const listedCodes = new Set(voucherOptions.options.map((option) => option.voucher.code.toUpperCase()));

  // Only active, prebookable add-ons of this hotel can go on the booking (docs/api/add-ons.md).
  const bookableAddOns = useMemo(
    () => (pricedHotelId ? (hotelQuery.data?.hotel.addOns ?? []).filter((addOn) => addOn.prebookable) : []),
    [pricedHotelId, hotelQuery.data],
  );
  const addOnLines = useMemo(() => toAddOnLines(bookableAddOns, addOnQuantities), [bookableAddOns, addOnQuantities]);

  const quoteInput = useMemo(
    () =>
      roomTypeId && checkIn && checkOut
        ? {
            roomTypeId,
            checkIn,
            checkOut,
            rooms,
            code: appliedCode,
            pointsToUse,
            addOns: addOnLines.length > 0 ? addOnLines : undefined,
          }
        : null,
    [roomTypeId, checkIn, checkOut, rooms, appliedCode, pointsToUse, addOnLines],
  );
  const quoteQuery = useDiscountQuote(quoteInput);
  const quote = quoteQuery.data;
  // A placeholder is the previous quote shown while the new one loads: its total belongs to other inputs.
  const requoting = quoteQuery.isFetching || quoteQuery.isPlaceholderData || autoPending;

  const roomType = roomQuery.data?.roomType;
  const offer = roomQuery.data?.offer;
  const hotel = hotelQuery.data?.hotel;
  const windows = useMemo(() => arrivalWindows(hotel?.checkInTime), [hotel?.checkInTime]);

  /** A typed code is checked with a quote first, so a refused code never replaces the working total. */
  const applyCode = async () => {
    const code = codeInput.trim().toUpperCase();
    setCodeError(null);
    if (!code || !quoteInput) return;
    setCheckingCode(true);
    try {
      await getDiscountQuote({ ...quoteInput, code });
      setSelection({ mode: 'manual', code });
      setCodeInput('');
      setShowCodeInput(false);
    } catch (error) {
      setCodeError(getApiErrorMessage(error, 'Không áp dụng được mã này.'));
    } finally {
      setCheckingCode(false);
    }
  };

  const selectCode = (code: string | undefined) => {
    setSelection({ mode: 'manual', code });
    setCodeError(null);
  };

  const removeCode = () => selectCode(undefined);

  const applyPoints = (value: number) => {
    setPointsError(null);
    const balance = quote?.points?.pointsBalance ?? 0;
    if (!Number.isInteger(value) || value < 0) {
      setPointsError('Số điểm phải là số nguyên không âm.');
      return;
    }
    if (value > balance) {
      setPointsError(`Bạn chỉ có ${formatPoints(balance)}.`);
      return;
    }
    setPointsToUse(value || undefined);
    setPointsInput(value ? String(value) : '');
  };

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const image = roomType?.images[0]?.url ?? hotel?.images[0]?.url ?? FALLBACK_IMAGE;
  const soldOut = !!offer && offer.available < rooms;

  const clearError = (field: string) =>
    setFieldErrors((current) => {
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });

  /** Shows every field error at once and focuses the first, top to bottom. */
  const showErrors = (errors: FieldErrors) => {
    setFieldErrors(errors);
    const first = FIELD_ORDER.find((field) => errors[field]);
    if (first) {
      const target = formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target?.focus({ preventScroll: true });
    }
  };

  const submit = () => {
    setFormError(null);
    if (!offer || !roomTypeId || !checkIn || !checkOut) {
      setFormError('Thiếu thông tin hạng phòng hoặc ngày lưu trú.');
      return;
    }

    const payload = {
      items: [{ roomTypeId, rooms }],
      checkIn,
      checkOut,
      guests,
      guestName: guestName.trim(),
      contactPhone: contactPhone.trim(),
      arrivalTime: arrivalTime || undefined,
      specialRequests: specialRequests.trim() || undefined,
      code: appliedCode,
      pointsToUse,
      addOns: addOnLines.length > 0 ? addOnLines : undefined,
      expectedTotal: quote?.expectedTotal ?? 0,
    };
    const checked = validateWith(createBookingSchema, payload);
    const errors: FieldErrors = { ...(checked.errors ?? {}) };
    if (!payload.guestName) errors.guestName = 'Vui lòng nhập tên khách nhận phòng.';
    if (!payload.contactPhone) errors.contactPhone = 'Vui lòng nhập số điện thoại liên lạc.';
    if (!agreed) errors.agreed = 'Vui lòng đồng ý chính sách huỷ phòng và điều khoản dịch vụ.';
    const visible = Object.fromEntries(FIELD_ORDER.filter((field) => errors[field]).map((field) => [field, errors[field]]));
    if (Object.keys(visible).length > 0) {
      showErrors(visible);
      return;
    }
    setFieldErrors({});

    if (!quote || requoting) {
      setFormError('Tổng tiền đang được tính lại. Vui lòng đợi giây lát rồi bấm lại.');
      return;
    }

    createBooking.mutate(
      {
        roomTypeId,
        checkIn,
        checkOut,
        guests,
        rooms,
        guestName: payload.guestName,
        contactPhone: payload.contactPhone,
        arrivalTime: payload.arrivalTime,
        specialRequests: payload.specialRequests,
        code: appliedCode,
        pointsToUse,
        addOns: payload.addOns,
        // The discounted total the customer saw; the backend prices the stay again and refuses a mismatch.
        expectedTotal: quote.expectedTotal,
      },
      {
        onSuccess: (booking) => {
          // Replace, not push: browser Back from the payment page must not return to a form that can book again.
          router.replace(`/booking/payment?id=${booking.id}`);
        },
        onError: (error) => {
          const code = getApiErrorCode(error);
          if (code === 'BOOKING_PRICE_CHANGED') {
            setRepricedFrom(quote.expectedTotal);
            void roomQuery.refetch();
            void quoteQuery.refetch();
            return;
          }
          if (code && VOUCHER_REFUSALS.has(code)) {
            // The code stopped working between the quote and the booking: drop it, keep the reason on screen.
            removeCode();
            setCodeError(getApiErrorMessage(error));
            return;
          }
          if (code === 'LOYALTY_POINTS_INSUFFICIENT') {
            setPointsToUse(undefined);
            setPointsError(getApiErrorMessage(error));
            void quoteQuery.refetch();
            return;
          }
          if (code === 'ROOM_SOLD_OUT') {
            setFormError('Hạng phòng đã hết trong những ngày này. Vui lòng chọn hạng phòng khác.');
            void roomQuery.refetch();
            return;
          }
          // Field errors the backend found (VALIDATION_ERROR details) go back next to their fields.
          const serverFields = getApiFieldErrors(error);
          if (FIELD_ORDER.some((field) => serverFields[field])) {
            showErrors(serverFields);
            return;
          }
          setFormError(getApiErrorMessage(error, 'Không thể tạo đặt phòng. Vui lòng thử lại.'));
        },
      },
    );
  };

  if (!roomTypeId || !hotelId || !checkIn || !checkOut) {
    return (
      <CenteredState
        title="Thiếu thông tin đặt phòng"
        action={
          <Link href="/search" className={buttonVariants({ className: 'h-11 px-5' })}>
            Tìm chỗ nghỉ
          </Link>
        }
      >
        Hãy chọn khách sạn, hạng phòng và ngày lưu trú trước khi đặt.
      </CenteredState>
    );
  }

  if (roomQuery.isLoading || hotelQuery.isLoading) {
    return (
      <div className="mx-auto grid w-full max-w-marketplace gap-6 px-4 py-8 sm:px-6 lg:grid-cols-12" aria-busy="true">
        <span className="sr-only">Đang tải thông tin đặt phòng…</span>
        <div className="space-y-6 lg:col-span-8">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-48 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-xl bg-muted lg:col-span-4" />
      </div>
    );
  }

  if (roomQuery.error || !roomType || !offer) {
    return (
      <CenteredState
        title="Không tải được hạng phòng"
        action={
          <div className="flex justify-center gap-2">
            <Link href={stayHref} className={buttonVariants({ className: 'h-11 px-5' })}>
              Chọn phòng khác
            </Link>
            {roomQuery.error && (
              <Button variant="outline" className="h-11" onClick={() => void roomQuery.refetch()}>
                Thử lại
              </Button>
            )}
          </div>
        }
      >
        {roomQuery.error
          ? getApiErrorMessage(roomQuery.error)
          : 'Hạng phòng không còn khả dụng cho khoảng ngày đã chọn.'}
      </CenteredState>
    );
  }

  const freeUntil = offer.freeCancellationUntil;
  const submitDisabled = createBooking.isPending || soldOut || !quote;
  const submitLabel = createBooking.isPending ? (
    <>
      <Loader2 className="size-4 animate-spin" /> Đang giữ phòng…
    </>
  ) : (
    <>
      Tiếp tục thanh toán <ArrowRight className="size-4" />
    </>
  );

  return (
    <div className="mx-auto w-full max-w-marketplace px-4 pt-6 pb-32 sm:px-6 sm:pt-8 lg:pb-8">
      <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
        <Timer className="size-5 shrink-0" aria-hidden />
        <p className="text-sm">
          Sau khi bấm <strong>Tiếp tục thanh toán</strong>, phòng được giữ cho bạn trong{' '}
          <strong className="font-bold">15 phút</strong> để hoàn tất thanh toán.
        </p>
      </div>

      {repricedFrom !== null && quote && (
        <div role="alert" className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Giá vừa được cập nhật</p>
          <p className="mt-0.5">
            Tổng trước đó {formatMoney(repricedFrom)}, nay là{' '}
            <strong>{requoting ? 'đang tính…' : formatMoney(quote.expectedTotal)}</strong>. Thông tin bạn đã nhập vẫn
            giữ nguyên; kiểm tra lại rồi bấm Tiếp tục thanh toán.
          </p>
          <button
            type="button"
            onClick={() => setRepricedFrom(null)}
            className="mt-2 inline-flex min-h-10 items-center font-semibold underline"
          >
            Đã hiểu
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
        <div ref={formRef} className="space-y-6 lg:col-span-8">
          <section className={cardClass}>
            <SectionHeader icon={User} title="Người liên hệ" hint="Nhận xác nhận, hoá đơn và mã QR check-in" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Họ và tên</Label>
                <p className="flex min-h-11 items-center rounded-lg bg-muted px-3 text-sm font-medium text-foreground">
                  {user?.name ?? '—'}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Email</Label>
                <p className="flex min-h-11 items-center truncate rounded-lg bg-muted px-3 text-sm font-medium text-foreground">
                  {user?.email ?? '—'}
                </p>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="contactPhone" className="text-sm font-semibold">
                  Số điện thoại liên lạc <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contactPhone"
                  data-field="contactPhone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={contactPhone}
                  onChange={(event) => {
                    setContactPhone(event.target.value);
                    clearError('contactPhone');
                  }}
                  placeholder="0912 345 678"
                  aria-invalid={!!fieldErrors.contactPhone}
                  aria-describedby={fieldErrors.contactPhone ? 'contactPhone-error' : 'contactPhone-hint'}
                  className={cn(fieldClass, 'sm:max-w-sm')}
                />
                <FieldError id="contactPhone-error" message={fieldErrors.contactPhone} />
                {!fieldErrors.contactPhone && (
                  <p id="contactPhone-hint" className="text-xs text-muted-foreground">
                    Khách sạn gọi số này khi cần hỗ trợ nhận phòng.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className={cardClass}>
            <SectionHeader icon={BedDouble} title="Khách lưu trú" hint="Người xuất trình giấy tờ khi nhận phòng" />

            <label className="mb-4 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-3">
              <Checkbox
                checked={selfGuest}
                onCheckedChange={(checked) => {
                  setSelfGuest(!!checked);
                  clearError('guestName');
                }}
              />
              <span className="text-sm text-foreground">
                Tôi là khách nhận phòng{user?.name ? ` (${user.name})` : ''}
              </span>
            </label>

            {!selfGuest && (
              <div className="mb-5 space-y-1.5">
                <Label htmlFor="guestName" className="text-sm font-semibold">
                  Tên khách nhận phòng <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="guestName"
                  data-field="guestName"
                  value={otherGuestName}
                  onChange={(event) => {
                    setOtherGuestName(event.target.value);
                    clearError('guestName');
                  }}
                  placeholder="Tên trên CCCD hoặc hộ chiếu"
                  autoComplete="off"
                  aria-invalid={!!fieldErrors.guestName}
                  aria-describedby={fieldErrors.guestName ? 'guestName-error' : 'guestName-hint'}
                  className={fieldClass}
                />
                <FieldError id="guestName-error" message={fieldErrors.guestName} />
                {!fieldErrors.guestName && (
                  <p id="guestName-hint" className="text-xs text-muted-foreground">
                    Đúng tên trên giấy tờ tuỳ thân; khách sạn đối chiếu khi check-in.
                  </p>
                )}
              </div>
            )}
            {selfGuest && fieldErrors.guestName && (
              <div className="mb-4" data-field="guestName" tabIndex={-1}>
                <FieldError id="guestName-error" message="Tài khoản chưa có họ tên. Bỏ chọn ô trên để nhập tên khách." />
              </div>
            )}

            <div className="mb-5 space-y-1.5">
              <Label htmlFor="arrivalTime" className="text-sm font-semibold">
                Giờ đến dự kiến
              </Label>
              <NativeSelect
                id="arrivalTime"
                data-field="arrivalTime"
                value={arrivalTime}
                onChange={(event) => setArrivalTime(event.target.value)}
                aria-invalid={!!fieldErrors.arrivalTime}
                className="sm:max-w-xs"
              >
                <NativeSelectOption value="">Chưa rõ</NativeSelectOption>
                {windows.map((window) => (
                  <NativeSelectOption key={window.value} value={window.value}>
                    {window.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError id="arrivalTime-error" message={fieldErrors.arrivalTime} />
              <p className="text-xs text-muted-foreground">
                Nhận phòng từ {hotel?.checkInTime ?? '14:00'}. Giúp khách sạn chuẩn bị phòng đúng giờ.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="specialRequests" className="text-sm font-semibold">
                Ghi chú cho khách sạn <span className="font-normal text-muted-foreground">(không bắt buộc)</span>
              </Label>
              <textarea
                id="specialRequests"
                data-field="specialRequests"
                rows={3}
                value={specialRequests}
                onChange={(event) => setSpecialRequests(event.target.value)}
                placeholder="Ví dụ: phòng tầng cao, yên tĩnh, chuẩn bị nôi em bé…"
                maxLength={500}
                aria-invalid={!!fieldErrors.specialRequests}
                className="w-full resize-none rounded-lg border border-input bg-background p-3 text-base text-foreground focus:ring-2 focus:ring-ring focus:outline-none sm:text-sm"
              />
              <div className="flex items-center justify-between gap-2">
                <FieldError id="specialRequests-error" message={fieldErrors.specialRequests} />
                <span className="ml-auto text-xs text-muted-foreground">{specialRequests.length}/500</span>
              </div>
            </div>
          </section>

          {bookableAddOns.length > 0 && (
            <section className={cardClass}>
              <SectionHeader icon={ConciergeBell} title="Dịch vụ thêm" hint="Đặt trước cùng phòng, không bắt buộc" />
              <AddOnPicker
                addOns={bookableAddOns}
                quantities={addOnQuantities}
                onChange={setAddOnQuantities}
                disabled={createBooking.isPending}
              />
            </section>
          )}

          <section className={cardClass}>
            <SectionHeader icon={Ticket} title="Ưu đãi & điểm thưởng" hint="Mỗi đơn dùng một ưu đãi, cộng thêm điểm" />

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Voucher của bạn</h3>
                  {selection.mode === 'auto' && appliedCode && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="size-3.5" aria-hidden /> Đã tự chọn voucher có lợi nhất
                    </span>
                  )}
                </div>

                <VoucherPicker
                  options={voucherOptions.options}
                  isLoading={vouchersLoading}
                  selectedCode={appliedCode}
                  bestCode={bestCode}
                  onSelect={selectCode}
                  disabled={createBooking.isPending}
                />
                {voucherOptions.hiddenCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Bạn còn {voucherOptions.hiddenCount} voucher khác dùng được tại đây; dùng “Nhập mã khác” để áp dụng.
                  </p>
                )}

                {appliedCode && !listedCodes.has(appliedCode.toUpperCase()) && (
                  <div className="flex min-h-11 items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm">
                    <span className="flex items-center gap-1.5 font-semibold text-emerald-800">
                      <CheckCircle2 className="size-4" aria-hidden /> Đã áp dụng mã{' '}
                      <span className="font-mono">{appliedCode}</span>
                    </span>
                    <button
                      type="button"
                      onClick={removeCode}
                      className="inline-flex min-h-10 items-center gap-1 px-1 font-semibold text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-4" aria-hidden /> Bỏ mã
                    </button>
                  </div>
                )}

                {showCodeInput ? (
                  <form
                    className="flex gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void applyCode();
                    }}
                  >
                    <Input
                      id="discountCode"
                      aria-label="Nhập mã voucher khác"
                      value={codeInput}
                      onChange={(event) => setCodeInput(event.target.value.toUpperCase())}
                      placeholder="Nhập mã voucher"
                      maxLength={50}
                      autoFocus
                      aria-invalid={!!codeError}
                      aria-describedby={codeError ? 'discountCode-error' : undefined}
                      className={cn(fieldClass, 'min-w-0 flex-1 font-mono uppercase')}
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={!codeInput.trim() || checkingCode}
                      className="h-11 shrink-0 px-5 font-semibold whitespace-nowrap"
                    >
                      {checkingCode ? <Loader2 className="size-4 animate-spin" /> : 'Áp dụng'}
                    </Button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCodeInput(true)}
                    className="inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline"
                  >
                    + Nhập mã khác
                  </button>
                )}
                {codeError && (
                  <p id="discountCode-error" role="alert" className="text-xs font-medium text-destructive">
                    {codeError}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Nếu khuyến mãi chung của khách sạn có lợi hơn, hệ thống dùng khuyến mãi đó và giữ lại voucher của bạn.
                  Xem tất cả ở{' '}
                  <Link href="/account/rewards" className="font-semibold text-primary underline" target="_blank">
                    Voucher & Điểm thưởng
                  </Link>
                  .
                </p>
              </div>

              {quote?.points && (
                <div className="space-y-2 border-t border-border pt-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label htmlFor="pointsToUse" className="flex items-center gap-1.5 text-sm font-semibold">
                      <Coins className="size-4 text-amber-600" aria-hidden /> Dùng điểm StayMiles
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      Bạn có <strong className="text-foreground">{formatPoints(quote.points.pointsBalance)}</strong> · 1
                      điểm = 100 ₫
                    </span>
                  </div>
                  {quote.points.pointsBalance === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Bạn chưa có điểm. Sau kỳ nghỉ này bạn được cộng điểm theo số tiền thực trả.
                    </p>
                  ) : pointsToUse !== undefined && quote.points.pointsUsed > 0 ? (
                    <div className="flex min-h-11 items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm">
                      <span className="flex items-center gap-1.5 font-semibold text-emerald-800">
                        <CheckCircle2 className="size-4" aria-hidden />
                        Dùng {formatPoints(quote.points.pointsUsed)} · −{formatMoney(quote.points.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => applyPoints(0)}
                        className="inline-flex min-h-10 items-center gap-1 px-1 font-semibold text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-4" aria-hidden /> Bỏ
                      </button>
                    </div>
                  ) : (
                    <form
                      className="flex gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        applyPoints(Number(pointsInput || 0));
                      }}
                    >
                      <Input
                        id="pointsToUse"
                        inputMode="numeric"
                        value={pointsInput}
                        onChange={(event) => setPointsInput(event.target.value.replace(/\D/g, ''))}
                        placeholder={`Tối đa ${new Intl.NumberFormat('vi-VN').format(quote.points.maxPointsUsable)}`}
                        aria-invalid={!!pointsError}
                        aria-describedby={pointsError ? 'points-error' : undefined}
                        className={cn(fieldClass, 'min-w-0 flex-1')}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => applyPoints(quote.points!.maxPointsUsable)}
                        disabled={quote.points.maxPointsUsable === 0}
                        className="h-11 shrink-0 px-3 font-semibold whitespace-nowrap"
                      >
                        Tối đa
                      </Button>
                      <Button type="submit" variant="outline" className="h-11 shrink-0 px-4 font-semibold whitespace-nowrap">
                        Áp dụng
                      </Button>
                    </form>
                  )}
                  {pointsToUse !== undefined && quote.points.pointsUsed > 0 && quote.points.pointsUsed < pointsToUse && (
                    <p className="text-xs text-muted-foreground">
                      Chỉ trừ đủ số tiền phòng còn lại; phần điểm dư vẫn giữ trong ví điểm.
                    </p>
                  )}
                  {pointsError && (
                    <p id="points-error" role="alert" className="text-xs font-medium text-destructive">
                      {pointsError}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          <section className={cardClass}>
            <SectionHeader icon={ShieldCheck} title="Chính sách huỷ phòng" />
            <ul className="space-y-2 rounded-xl bg-muted/60 p-4 text-sm text-foreground">
              {freeUntil ? (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                  <span>
                    <strong>Miễn phí huỷ</strong> trước {formatDateTime(freeUntil)}.
                  </span>
                </li>
              ) : (
                <li className="flex items-start gap-2">
                  <Info className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
                  <span>Hạng phòng này không có thời gian huỷ miễn phí.</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span>
                  {freeUntil ? 'Sau thời điểm đó, ' : 'Khi huỷ, '}phí huỷ là{' '}
                  <strong>{offer.cancellationFeePercent}% tiền phòng</strong>; phần còn lại hoàn về Ví StayReco sau khi
                  khách sạn duyệt.
                </span>
              </li>
              {addOnLines.length > 0 && (
                <li className="flex items-start gap-2">
                  <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span>Dịch vụ đặt kèm luôn được hoàn đủ khi huỷ.</span>
                </li>
              )}
            </ul>

            <label
              className={cn(
                'mt-4 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/60',
                fieldErrors.agreed ? 'border-destructive' : 'border-transparent',
              )}
            >
              <Checkbox
                data-field="agreed"
                checked={agreed}
                onCheckedChange={(checked) => {
                  setAgreed(!!checked);
                  if (checked) clearError('agreed');
                }}
                aria-invalid={!!fieldErrors.agreed}
                aria-describedby={fieldErrors.agreed ? 'agreed-error' : undefined}
                className="mt-0.5"
              />
              <span className="text-sm leading-relaxed text-foreground">
                Tôi đã đọc và đồng ý với chính sách huỷ, quy định lưu trú của <strong>{hotel?.name ?? 'khách sạn'}</strong>{' '}
                và điều khoản dịch vụ của StayReco.
              </span>
            </label>
            <FieldError id="agreed-error" message={fieldErrors.agreed} />
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:col-span-4">
          <BookingSummary
            image={image}
            hotelName={hotel?.name ?? 'Chỗ nghỉ'}
            hotelAddress={hotel ? `${hotel.address}, ${hotel.city}` : '—'}
            roomTypeName={roomType.name}
            checkIn={checkIn}
            checkOut={checkOut}
            nights={nights}
            guests={guests}
            rooms={rooms}
            available={offer.available}
            nightlyPrices={offer.nightlyPrices}
            quote={quote}
            requoting={requoting}
            quoteError={quoteQuery.error}
            onRetryQuote={() => void quoteQuery.refetch()}
            addOnLines={addOnLines}
            addOns={bookableAddOns}
          />

          {formError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-semibold">Chưa đặt được phòng</p>
              <p className="mt-0.5">{formError}</p>
            </div>
          )}
          {soldOut && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              Chỉ còn {offer.available} phòng cho khoảng ngày này.{' '}
              <Link href={stayHref} className="font-semibold underline">
                Chọn phòng khác
              </Link>
            </div>
          )}

          <div className="hidden lg:block">
            <Button onClick={submit} disabled={submitDisabled} className="h-12 w-full gap-2 text-sm font-bold">
              {submitLabel}
            </Button>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3.5 shrink-0 text-emerald-600" aria-hidden />
              Thanh toán an toàn; hệ thống tự xác nhận khi nhận được tiền.
            </p>
          </div>
        </aside>
      </div>

      {/* Mobile: the total and the one action stay in reach; room is left on the right for the AI button. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 py-3 pr-24 pl-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <span className="block text-xs text-muted-foreground">Tổng thanh toán</span>
            <span className={cn('block text-lg font-bold text-primary', requoting && 'opacity-60')}>
              {quote ? formatMoney(quote.expectedTotal) : '—'}
            </span>
          </div>
          <Button onClick={submit} disabled={submitDisabled} className="h-11 flex-1 gap-1.5 font-bold whitespace-nowrap">
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" /> Đang tải…
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
