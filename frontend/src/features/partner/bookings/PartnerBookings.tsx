"use client";

import { useState } from "react";
import { Eye, Search } from "lucide-react";
import {
  BookingStatus,
  HOTEL_BOOKING_SORTS,
  PaymentStatus,
  type BookingSummary,
} from "@stayreco/shared";
import { TableCommon, TablePagination, type CommonTableColumn } from "@/components/common/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebounce } from "@/hooks/use-debounce";
import type { HotelBookingsParams } from "@/services/partner.service";
import { useHotelBookings, useRefundQueueCount } from "../api/partner-queries";
import {
  ErrorPanel,
  FormField,
  LoadingPanel,
  NoHotelPanel,
  PartnerPanel,
  PartnerTitle,
  StatusBadge,
  SuspendedBanner,
  usePartnerHotel,
} from "../components";
import {
  bookingStatusLabels,
  formatDate,
  formatDateTime,
  formatMoney,
  paymentStatusLabels,
} from "../lib/labels";
import { BookingDetailDialog } from "./BookingDetailDialog";

const PAGE_SIZE = 10;

const sortLabels: Record<(typeof HOTEL_BOOKING_SORTS)[number], string> = {
  "check-in-asc": "Ngày nhận phòng gần nhất",
  "check-in-desc": "Ngày nhận phòng xa nhất",
  "created-desc": "Mới đặt nhất",
};

type BookingTab = "all" | "refunds";

export default function PartnerBookings() {
  const { hotel, hotels, isLoading, error, refetch, isSuspended } = usePartnerHotel();

  return (
    <div className="space-y-6">
      <PartnerTitle
        title="Đặt phòng"
        description="Theo dõi booking của khách sạn và xử lý yêu cầu hoàn tiền khi khách huỷ phòng đã thanh toán."
      />
      {isSuspended && <SuspendedBanner />}
      {isLoading ? (
        <LoadingPanel />
      ) : error ? (
        <ErrorPanel error={error} onRetry={refetch} />
      ) : !hotel || hotels.length === 0 ? (
        <NoHotelPanel />
      ) : (
        <BookingsWorkspace key={hotel.id} hotelId={hotel.id} />
      )}
    </div>
  );
}

function BookingsWorkspace({ hotelId }: { hotelId: string }) {
  const [tab, setTab] = useState<BookingTab>("all");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [checkInFrom, setCheckInFrom] = useState("");
  const [checkInTo, setCheckInTo] = useState("");
  const [sort, setSort] = useState<(typeof HOTEL_BOOKING_SORTS)[number]>("check-in-asc");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string>();
  const debouncedSearch = useDebounce(search.trim());
  const refundQueue = useRefundQueueCount(hotelId);
  const rangeInvalid = !!checkInFrom && !!checkInTo && checkInTo < checkInFrom;

  const params: HotelBookingsParams = {
    page,
    pageSize: PAGE_SIZE,
    sort,
    search: debouncedSearch || undefined,
    status: status ? [status as BookingStatus] : undefined,
    // The refund queue is the bookings whose invoice is waiting for the partner's decision.
    paymentStatus:
      tab === "refunds" ? ["REFUND_PENDING"] : paymentStatus ? [paymentStatus as PaymentStatus] : undefined,
    checkInFrom: checkInFrom || undefined,
    // An inverted range is shown as a field error instead of being sent (the API would answer VALIDATION_ERROR).
    checkInTo: checkInTo && !rangeInvalid ? checkInTo : undefined,
  };
  const bookingsQuery = useHotelBookings(hotelId, params);
  const meta = bookingsQuery.data?.meta;

  // Every filter change starts again from the first page.
  const update = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const columns: CommonTableColumn<BookingSummary>[] = [
    {
      id: "code",
      header: "Booking",
      cell: (booking) => (
        <div>
          <strong className="block text-primary">{booking.code}</strong>
          <span className="text-xs text-muted-foreground">Đặt {formatDateTime(booking.createdAt)}</span>
        </div>
      ),
    },
    { id: "roomType", header: "Loại phòng", cell: (booking) => booking.roomType.name },
    {
      id: "stay",
      header: "Lưu trú",
      cell: (booking) => (
        <div>
          <span className="block">
            {formatDate(booking.checkIn)} – {formatDate(booking.checkOut)}
          </span>
          <span className="text-xs text-muted-foreground">
            {booking.nights} đêm · {booking.rooms} phòng · {booking.guests} khách
          </span>
        </div>
      ),
    },
    {
      id: "total",
      header: "Tổng tiền",
      align: "right",
      cell: (booking) => <strong className="text-primary">{formatMoney(booking.totalAmount)}</strong>,
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: (booking) => (
        <div className="flex flex-col gap-1">
          <StatusBadge tone={bookingStatusLabels[booking.status].tone}>
            {bookingStatusLabels[booking.status].label}
          </StatusBadge>
          <StatusBadge tone={paymentStatusLabels[booking.paymentStatus].tone}>
            {paymentStatusLabels[booking.paymentStatus].label}
          </StatusBadge>
        </div>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Thao tác</span>,
      align: "right",
      cell: (booking) => (
        <Button variant={booking.paymentStatus === "REFUND_PENDING" ? "default" : "outline"} size="sm" onClick={() => setOpenId(booking.id)}>
          <Eye />
          {booking.paymentStatus === "REFUND_PENDING" ? "Xử lý" : "Xem"}
        </Button>
      ),
    },
  ];

  const filtered = !!(debouncedSearch || status || paymentStatus || checkInFrom || checkInTo);

  return (
    <PartnerPanel className="overflow-hidden p-0">
      <div className="border-b px-5 pt-4">
        <Tabs value={tab} onValueChange={(value) => update(setTab)(value as BookingTab)}>
          <TabsList variant="line">
            <TabsTrigger value="all">Tất cả booking</TabsTrigger>
            <TabsTrigger value="refunds">
              Chờ hoàn tiền
              {refundQueue.count > 0 && (
                <span className="ml-1 rounded-full bg-warning-soft px-1.5 text-[11px] font-bold text-warning">
                  {refundQueue.count}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-3 border-b px-5 py-4 sm:grid-cols-2 lg:grid-cols-6">
        <FormField label="Tìm kiếm" className="lg:col-span-2">
          <span className="relative">
            <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => update(setSearch)(event.target.value)}
              placeholder="Mã booking hoặc tên khách"
              className="pl-8"
              maxLength={100}
            />
          </span>
        </FormField>
        <FormField label="Trạng thái">
          <NativeSelect value={status} onChange={(event) => update(setStatus)(event.target.value)} className="w-full">
            <NativeSelectOption value="">Tất cả</NativeSelectOption>
            {Object.values(BookingStatus).map((value) => (
              <NativeSelectOption key={value} value={value}>
                {bookingStatusLabels[value].label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
        {tab === "all" ? (
          <FormField label="Thanh toán">
            <NativeSelect
              value={paymentStatus}
              onChange={(event) => update(setPaymentStatus)(event.target.value)}
              className="w-full"
            >
              <NativeSelectOption value="">Tất cả</NativeSelectOption>
              {Object.values(PaymentStatus).map((value) => (
                <NativeSelectOption key={value} value={value}>
                  {paymentStatusLabels[value].label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </FormField>
        ) : (
          <div className="hidden lg:block" />
        )}
        <FormField label="Nhận phòng từ">
          <Input type="date" value={checkInFrom} onChange={(event) => update(setCheckInFrom)(event.target.value)} />
        </FormField>
        <FormField label="Đến" error={rangeInvalid ? "Ngày kết thúc không được trước ngày bắt đầu." : undefined}>
          <Input
            type="date"
            value={checkInTo}
            min={checkInFrom || undefined}
            onChange={(event) => update(setCheckInTo)(event.target.value)}
          />
        </FormField>
        <FormField label="Sắp xếp" className="lg:col-start-6">
          <NativeSelect
            value={sort}
            onChange={(event) => setSort(event.target.value as (typeof HOTEL_BOOKING_SORTS)[number])}
            className="w-full"
          >
            {HOTEL_BOOKING_SORTS.map((value) => (
              <NativeSelectOption key={value} value={value}>
                {sortLabels[value]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
      </div>

      {bookingsQuery.error ? (
        <div className="p-5">
          <ErrorPanel error={bookingsQuery.error} onRetry={() => void bookingsQuery.refetch()} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <TableCommon
            data={bookingsQuery.data?.bookings ?? []}
            columns={columns}
            getRowId={(booking) => booking.id}
            isLoading={bookingsQuery.isLoading}
            emptyMessage={
              tab === "refunds"
                ? "Không có yêu cầu hoàn tiền nào đang chờ."
                : filtered
                  ? "Không có booking nào khớp bộ lọc."
                  : "Khách sạn chưa có booking nào."
            }
            className="rounded-none border-0"
            tableClassName="min-w-[860px]"
          />
        </div>
      )}
      {meta && meta.total > 0 && (
        <TablePagination page={meta.page} pageSize={meta.pageSize} total={meta.total} onPageChange={setPage} />
      )}

      <BookingDetailDialog bookingId={openId} hotelId={hotelId} onOpenChange={(open) => !open && setOpenId(undefined)} />
    </PartnerPanel>
  );
}
