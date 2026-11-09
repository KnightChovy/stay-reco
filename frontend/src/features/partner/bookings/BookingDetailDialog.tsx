"use client";

import { useState, type ReactNode } from "react";
import { Check, LogOut, X } from "lucide-react";
import { BOOKING_LIMITS, rejectChangeSchema, rejectRefundSchema, type Booking } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { validateWith } from "@/lib/api-error";
import * as partnerService from "@/services/partner.service";
import { partnerKeys, useBooking, useCheckOutQuote, usePartnerMutation } from "../api/partner-queries";
import { ConfirmDialog, ErrorPanel, FormField, StatusBadge, usePartnerHotel } from "../components";
import {
  bookingEventLabels,
  bookingStatusLabels,
  formatDate,
  formatDateTime,
  formatMoney,
  paymentStatusLabels,
} from "../lib/labels";

/** Rejecting is only allowed for the BR-20 reasons; these fill the text box, which the partner can still edit. */
const rejectReasons = [
  "Booking đã được hoàn tiền hoặc yêu cầu bị trùng.",
  "Trạng thái booking không còn cho phép hoàn tiền.",
  "Nghi ngờ gian lận (đã có bằng chứng).",
];

export function BookingDetailDialog({
  bookingId,
  hotelId,
  onOpenChange,
}: {
  bookingId: string | undefined;
  hotelId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const bookingQuery = useBooking(bookingId);
  const booking = bookingQuery.data;

  return (
    <Dialog open={!!bookingId} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Booking {booking?.code ?? ""}</DialogTitle>
          <DialogDescription>
            {booking ? `${booking.roomType.name} · ${booking.rooms} phòng · ${booking.guests} khách` : "Đang tải..."}
          </DialogDescription>
        </DialogHeader>
        {bookingQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : bookingQuery.error || !booking ? (
          <ErrorPanel error={bookingQuery.error} onRetry={() => void bookingQuery.refetch()} />
        ) : (
          <BookingDetail booking={booking} hotelId={hotelId} onDecided={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

function BookingDetail({ booking, hotelId, onDecided }: { booking: Booking; hotelId: string; onDecided: () => void }) {
  const { canEdit, isSuspended, hotel } = usePartnerHotel();
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string>();
  const status = bookingStatusLabels[booking.status];
  const payment = paymentStatusLabels[booking.paymentStatus];
  const isOwner = hotel?.myRole === "OWNER";
  const refundPending = booking.paymentStatus === "REFUND_PENDING";

  // Approving releases the nights, so the calendar changes too.
  const invalidate = () => [
    partnerKeys.bookingsOf(hotelId),
    partnerKeys.booking(booking.id),
    partnerKeys.availabilityOf(hotelId),
  ];
  const approve = usePartnerMutation(() => partnerService.approveRefund(booking.id), {
    invalidate,
    successMessage: (result) => `Đã duyệt hoàn ${formatMoney(result.refund?.amount)} cho booking ${result.code}.`,
    onSuccess: onDecided,
  });
  const reject = usePartnerMutation((text: string) => partnerService.rejectRefund(booking.id, text), {
    invalidate,
    successMessage: (result) => `Đã từ chối hoàn tiền booking ${result.code}. Khách nhận được lý do qua email.`,
    onSuccess: onDecided,
  });

  function submitReject() {
    const result = validateWith(rejectRefundSchema, { reason });
    if (result.errors) {
      setReasonError(result.errors.reason);
      return;
    }
    setReasonError(undefined);
    reject.mutate(result.data.reason);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
        <StatusBadge tone={payment.tone}>{payment.label}</StatusBadge>
      </div>

      {refundPending && booking.refund && (
        <div className="space-y-3 rounded-xl bg-warning-soft p-4 text-sm">
          <p className="font-semibold text-warning">
            Khách yêu cầu huỷ và hoàn {formatMoney(booking.refund.amount)}
          </p>
          {booking.cancelReason && <p className="text-foreground">Lý do của khách: {booking.cancelReason}</p>}
          <p className="text-xs text-muted-foreground">
            Số tiền hoàn đã được chốt theo chính sách huỷ lúc khách huỷ. Nếu yêu cầu gửi trước giờ nhận phòng mà chưa xử
            lý, hệ thống sẽ tự duyệt đúng giờ nhận phòng.
          </p>
          {isOwner && (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setConfirmApprove(true)} disabled={approve.isPending || reject.isPending}>
                <Check />
                Duyệt hoàn tiền
              </Button>
              {canEdit && !rejecting && (
                <Button variant="outline" onClick={() => setRejecting(true)} disabled={approve.isPending}>
                  <X />
                  Từ chối
                </Button>
              )}
            </div>
          )}
          {isSuspended && (
            <p className="text-xs text-danger">Tài khoản đang tạm ngưng: bạn chỉ có thể duyệt, không thể từ chối hoàn tiền.</p>
          )}
          {rejecting && (
            <div className="space-y-2 rounded-lg bg-card p-3">
              <div className="flex flex-wrap gap-1.5">
                {rejectReasons.map((text) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() => setReason(text)}
                    className="rounded-full border px-2.5 py-1 text-xs hover:bg-muted"
                  >
                    {text}
                  </button>
                ))}
              </div>
              <FormField label="Lý do từ chối (gửi cho khách)" required error={reasonError}>
                <Textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  maxLength={BOOKING_LIMITS.refundNoteMax}
                  rows={3}
                />
              </FormField>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setRejecting(false)} disabled={reject.isPending}>
                  Huỷ
                </Button>
                <Button variant="destructive" onClick={submitReject} disabled={reject.isPending}>
                  Xác nhận từ chối
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {booking.status === "CHECKED_IN" && isOwner && (
        <CheckOutPanel booking={booking} hotelId={hotelId} canEdit={canEdit} onDone={onDecided} />
      )}

      {booking.changeRequest?.status === "PENDING" && (
        <ChangeRequestPanel
          booking={booking}
          hotelId={hotelId}
          canDecide={isOwner && canEdit}
          onDone={onDecided}
        />
      )}

      {booking.refundRejection && !refundPending && (
        <p className="rounded-xl bg-muted p-3 text-sm">
          Đã từ chối hoàn tiền lúc {formatDateTime(booking.refundRejection.at)}: {booking.refundRejection.reason}
        </p>
      )}

      <section className="grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="mb-1 text-sm font-bold text-primary">Khách</h3>
          <Row label="Tên khách">{booking.guestName}</Row>
          <Row label="Điện thoại">
            <a href={`tel:${booking.contactPhone}`} className="text-primary hover:underline">
              {booking.contactPhone}
            </a>
          </Row>
          <Row label="Giờ đến dự kiến">{booking.arrivalTime ?? "—"}</Row>
          {booking.specialRequests && <Row label="Yêu cầu đặc biệt">{booking.specialRequests}</Row>}
        </div>
        <div>
          <h3 className="mb-1 text-sm font-bold text-primary">Lưu trú</h3>
          <Row label="Nhận phòng">{formatDate(booking.checkIn)}</Row>
          <Row label="Trả phòng">{formatDate(booking.checkOut)}</Row>
          <Row label="Số đêm">{booking.nights}</Row>
          <Row label="Đặt lúc">{formatDateTime(booking.createdAt)}</Row>
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-sm font-bold text-primary">Giá & thanh toán</h3>
        <div className="divide-y rounded-xl border px-3">
          {booking.nightlyPrices.map((night) => (
            <Row key={night.date} label={`Đêm ${formatDate(night.date)}`}>
              {formatMoney(night.price)}
              {booking.rooms > 1 ? ` × ${booking.rooms}` : ""}
            </Row>
          ))}
          <Row label="Tổng tiền">
            <strong className="text-primary">{formatMoney(booking.totalAmount)}</strong>
          </Row>
          <Row label="Thanh toán lúc">{formatDateTime(booking.paidAt)}</Row>
          <Row label="Huỷ miễn phí đến">
            {booking.cancellation.freeUntil ? formatDateTime(booking.cancellation.freeUntil) : "Không có"}
          </Row>
          <Row label="Phí huỷ sau hạn">{booking.cancellation.feePercent}%</Row>
          {booking.refund && (
            <Row label="Hoàn tiền">
              {formatMoney(booking.refund.amount)} · {paymentStatusLabels[booking.refund.status].label}
            </Row>
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-bold text-primary">Lịch sử</h3>
        <ol className="space-y-2 border-l-2 pl-4">
          {booking.timeline.map((entry) => (
            <li key={`${entry.event}-${entry.at}`} className="text-sm">
              <strong>{bookingEventLabels[entry.event] ?? entry.event}</strong>
              <span className="ml-2 text-xs text-muted-foreground">{formatDateTime(entry.at)}</span>
            </li>
          ))}
        </ol>
      </section>

      <ConfirmDialog
        open={confirmApprove}
        onOpenChange={setConfirmApprove}
        title={`Duyệt hoàn ${formatMoney(booking.refund?.amount)}?`}
        description="Booking chuyển sang Đã huỷ, các đêm được trả lại lịch bán và tiền chuyển từ ví khách sạn sang ví của khách. Không thể hoàn tác."
        confirmLabel="Duyệt hoàn tiền"
        pending={approve.isPending}
        onConfirm={() => approve.mutate()}
      />
    </div>
  );
}

/** 135 → "2 giờ 15 phút". */
function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} phút`;
  return rest === 0 ? `${hours} giờ` : `${hours} giờ ${rest} phút`;
}

/** Bookings, rooms, calendar and the dashboard figures (action items, today) all move with a check-out or a change. */
function frontDeskQueries(hotelId: string, bookingId: string) {
  return [
    partnerKeys.bookingsOf(hotelId),
    partnerKeys.booking(bookingId),
    partnerKeys.availabilityOf(hotelId),
    partnerKeys.roomsOf(hotelId),
    partnerKeys.statsOf(hotelId),
  ];
}

/**
 * UC39 for the owner: what checking out now means (from `check-out-quote`, the FE computes nothing), then the check-out.
 * The late fee of the hotel policy is recorded as computed; it is paid at the front desk, not through StayReco.
 */
function CheckOutPanel({
  booking,
  hotelId,
  canEdit,
  onDone,
}: {
  booking: Booking;
  hotelId: string;
  canEdit: boolean;
  onDone: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const quote = useCheckOutQuote(booking.id, canEdit);
  const checkOut = usePartnerMutation(() => partnerService.checkOutBooking(booking.id), {
    invalidate: () => frontDeskQueries(hotelId, booking.id),
    successMessage: (result) =>
      result.lateCheckout && result.lateCheckout.fee > 0
        ? `Đã check-out booking ${result.code}. Thu phí trả muộn ${formatMoney(result.lateCheckout.fee)} tại quầy.`
        : `Đã check-out booking ${result.code}.`,
    onSuccess: onDone,
  });

  if (!canEdit) {
    return (
      <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
        Tài khoản đang tạm ngưng: không thể check-out. Nhân viên lễ tân vẫn có thể check-out cho khách.
      </p>
    );
  }

  const data = quote.data;
  const late = !!data && data.minutesLate > 0;

  return (
    <div className={`space-y-3 rounded-xl p-4 text-sm ${late ? "bg-danger-soft" : "bg-info-soft"}`}>
      <p className={`font-semibold ${late ? "text-danger" : "text-info"}`}>
        {late ? `Khách đã quá giờ trả phòng ${formatMinutes(data.minutesLate)}` : "Khách đang lưu trú"}
      </p>
      {quote.isLoading ? (
        <Skeleton className="h-12 w-full" />
      ) : quote.error || !data ? (
        <ErrorPanel error={quote.error} onRetry={() => void quote.refetch()} />
      ) : (
        <div className="space-y-1 text-foreground">
          <p>Giờ trả phòng: {formatDateTime(data.scheduledAt)}</p>
          {data.lateFee && (
            <p>
              Phí trả muộn: <strong>{formatMoney(data.lateFee.amount)}</strong> ({data.lateFee.percent}% giá đêm cuối{" "}
              {formatMoney(data.lateFee.nightPrice)}), thu tại quầy, không qua StayReco.
            </p>
          )}
          {late && !data.lateFee && (
            <p className="text-xs text-muted-foreground">Không tính phí trả muộn (trong thời gian ân hạn hoặc khách sạn chưa có chính sách).</p>
          )}
          {data.early && (
            <p>
              Trả phòng sớm: {data.releasedNights.length} đêm còn lại được mở bán lại, khách không được hoàn tiền.
            </p>
          )}
        </div>
      )}
      <Button onClick={() => setConfirming(true)} disabled={!data || checkOut.isPending}>
        <LogOut />
        Check-out
      </Button>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Check-out booking ${booking.code}?`}
        description={
          data?.lateFee
            ? `Booking chuyển sang Hoàn tất, phòng chuyển sang Đang dọn. Phí trả muộn ${formatMoney(data.lateFee.amount)} được ghi nhận, nhớ thu tại quầy.`
            : "Booking chuyển sang Hoàn tất, phòng chuyển sang Đang dọn. Không thể hoàn tác."
        }
        confirmLabel="Check-out"
        pending={checkOut.isPending}
        onConfirm={() => checkOut.mutate()}
      />
    </div>
  );
}

const changeFieldLabels = {
  guestName: "Tên khách",
  contactPhone: "Điện thoại",
  arrivalTime: "Giờ đến dự kiến",
  specialRequests: "Yêu cầu đặc biệt",
} as const;

/** UC43: the guest details the customer asked to change, current → requested, with accept / reject. */
function ChangeRequestPanel({
  booking,
  hotelId,
  canDecide,
  onDone,
}: {
  booking: Booking;
  hotelId: string;
  canDecide: boolean;
  onDone: () => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string>();
  const invalidate = () => frontDeskQueries(hotelId, booking.id);
  const accept = usePartnerMutation(() => partnerService.acceptBookingChange(booking.id), {
    invalidate,
    successMessage: (result) => `Đã cập nhật thông tin booking ${result.code}. Khách nhận được email xác nhận.`,
    onSuccess: onDone,
  });
  const reject = usePartnerMutation((text: string) => partnerService.rejectBookingChange(booking.id, { reason: text }), {
    invalidate,
    successMessage: (result) => `Đã từ chối yêu cầu đổi thông tin booking ${result.code}. Khách nhận được lý do qua email.`,
    onSuccess: onDone,
  });
  const request = booking.changeRequest;
  if (!request) return null;

  const changes = (Object.keys(changeFieldLabels) as (keyof typeof changeFieldLabels)[]).filter(
    (field) => request.changes[field] !== undefined,
  );
  const pending = accept.isPending || reject.isPending;

  function submitReject() {
    const result = validateWith(rejectChangeSchema, { reason });
    if (result.errors) {
      setReasonError(result.errors.reason);
      return;
    }
    setReasonError(undefined);
    reject.mutate(result.data.reason);
  }

  return (
    <div className="space-y-3 rounded-xl bg-warning-soft p-4 text-sm">
      <p className="font-semibold text-warning">
        Khách yêu cầu đổi thông tin lúc {formatDateTime(request.requestedAt)}
      </p>
      <dl className="divide-y rounded-lg bg-card px-3">
        {changes.map((field) => (
          <div key={field} className="grid gap-1 py-2 sm:grid-cols-[140px_1fr]">
            <dt className="text-muted-foreground">{changeFieldLabels[field]}</dt>
            <dd>
              <span className="text-muted-foreground line-through">{booking[field] || "—"}</span>
              <span aria-hidden> → </span>
              <span className="sr-only"> đổi thành </span>
              <strong>{request.changes[field] ?? "(xoá)"}</strong>
            </dd>
          </div>
        ))}
      </dl>
      {canDecide ? (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => accept.mutate()} disabled={pending}>
            <Check />
            Chấp nhận
          </Button>
          {!rejecting && (
            <Button variant="outline" onClick={() => setRejecting(true)} disabled={pending}>
              <X />
              Từ chối
            </Button>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Tài khoản đang tạm ngưng: không thể xử lý yêu cầu đổi thông tin.</p>
      )}
      {rejecting && (
        <div className="space-y-2 rounded-lg bg-card p-3">
          <FormField label="Lý do từ chối (gửi cho khách)" required error={reasonError}>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={BOOKING_LIMITS.refundNoteMax}
              rows={3}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRejecting(false)} disabled={reject.isPending}>
              Huỷ
            </Button>
            <Button variant="destructive" onClick={submitReject} disabled={reject.isPending}>
              Xác nhận từ chối
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
