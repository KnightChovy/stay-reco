"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BedDouble, Building2, CalendarDays, ChevronDown, Clock, ConciergeBell, Loader2, Minus, Plus, Search, Sparkles, Users } from "lucide-react";
import { BOOKING_LIMITS, type StayQuery } from "@stayreco/shared";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AppBreadcrumb from "@/components/common/breadcrumb/AppBreadcrumb";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateViews";
import { Button, buttonVariants } from "@/components/ui/button";
import { getApiErrorCode } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { useHotelListing, useRoomTypeListing } from "../api/stays-queries";
import { formatDate, formatMoney } from "../lib/format";
import { StaySearchBar } from "./StaySearchBar";
import { StayGallery } from "./StayGallery";
import {
  AddOnsPreview,
  AmenityGroups,
  AvailabilityPill,
  CancellationLine,
  OfferPrice,
  Section,
  StickyBookingBar,
  offerBlocker,
  staySearch,
  staySummary,
  stayNights,
} from "./StayParts";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80";

export function RoomTypeDetail({
  hotelId,
  roomTypeId,
  query,
}: {
  hotelId: string;
  roomTypeId: string;
  query: StayQuery;
}) {
  const router = useRouter();
  const roomQuery = useRoomTypeListing(roomTypeId, query);
  const hotelQuery = useHotelListing(hotelId, query);
  const roomHref = (next: StayQuery) => `/hotels/${hotelId}/rooms/${roomTypeId}?${staySearch(next)}`;
  const hotelHref = `/hotels/${hotelId}?${staySearch(query)}`;

  if (roomQuery.isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <LoadingState rows={3} label="Đang tải hạng phòng…" className="[&>*:first-of-type]:h-80" />
        </main>
      </div>
    );
  }

  if (roomQuery.error || !roomQuery.data) {
    const notFound = ["ROOM_TYPE_NOT_FOUND", "NOT_FOUND"].includes(getApiErrorCode(roomQuery.error) ?? "");
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="mx-auto w-full max-w-lg flex-1 px-4 py-16">
          {notFound || !roomQuery.error ? (
            <EmptyState
              icon={Search}
              title="Không tìm thấy hạng phòng"
              description="Hạng phòng này không còn mở bán. Xem các hạng phòng khác của chỗ nghỉ."
              action={
                <Link href={hotelHref} className={cn(buttonVariants(), "h-10")}>
                  Xem các hạng phòng khác
                </Link>
              }
            />
          ) : (
            <ErrorState
              title="Không tải được hạng phòng"
              error={roomQuery.error}
              onRetry={() => void roomQuery.refetch()}
              action={
                <Link href={hotelHref} className={cn(buttonVariants({ variant: "ghost" }), "h-10")}>
                  Về chỗ nghỉ
                </Link>
              }
            />
          )}
        </main>
        <Footer />
      </div>
    );
  }

  const { roomType, offer } = roomQuery.data;
  const hotel = hotelQuery.data?.hotel;
  const images = roomType.images.length > 0 ? roomType.images : [{ id: "fallback", url: FALLBACK_IMAGE, caption: null }];
  const nights = stayNights(query);
  const updating = roomQuery.isPlaceholderData || roomQuery.isFetching;
  const blocker = offerBlocker(offer, query);
  const maxRooms = Math.max(1, Math.min(BOOKING_LIMITS.maxRooms, offer?.available ?? BOOKING_LIMITS.maxRooms));
  const canBook = !!offer && !blocker && !updating;
  const bookingHref = `/booking?roomTypeId=${roomType.id}&hotelId=${hotelId}&${staySearch(query)}`;
  const prebookable = hotel?.addOns.filter((addOn) => addOn.prebookable) ?? [];

  // The room count lives in the URL: the listing then prices that many rooms, so the total is the backend's.
  const setRooms = (rooms: number) => router.replace(roomHref({ ...query, rooms }), { scroll: false });

  const bookButton = (
    <Link
      href={canBook ? bookingHref : "#stay"}
      aria-disabled={!canBook}
      className={cn(
        buttonVariants({ variant: canBook ? "default" : "outline" }),
        "h-11 px-5 whitespace-nowrap",
        updating && "pointer-events-none opacity-60",
      )}
    >
      {updating ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden /> Đang tính giá…
        </>
      ) : canBook ? (
        `Đặt ${query.rooms} phòng`
      ) : (
        "Đổi ngày hoặc số khách"
      )}
    </Link>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-grow px-4 pt-5 pb-28 sm:px-6 lg:px-8 lg:pb-10">
        <AppBreadcrumb
          items={[
            { label: "Trang chủ", href: "/" },
            ...(hotel ? [{ label: `Khách sạn tại ${hotel.city}`, href: `/search?destination=${encodeURIComponent(hotel.city)}&${staySearch(query)}` }] : []),
            { label: hotel?.name ?? "Chỗ nghỉ", href: hotelHref },
            { label: roomType.name },
          ]}
          className="mb-4"
        />

        <header className="mb-4">
          {hotel && (
            <Link href={hotelHref} className="text-sm font-semibold text-primary hover:underline">
              {hotel.name}
            </Link>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{roomType.name}</h1>
            <AvailabilityPill offer={offer} query={query} />
          </div>
          <ul className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <li className="inline-flex items-center gap-1.5"><Users className="size-4" aria-hidden /> Tối đa {roomType.maxOccupancy} khách/phòng</li>
            <li className="inline-flex items-center gap-1.5"><BedDouble className="size-4" aria-hidden /> {roomType.beds.map((bed) => `${bed.quantity} ${bed.name}`).join(", ") || "Chưa cập nhật giường"}</li>
            <li className="inline-flex items-center gap-1.5"><Building2 className="size-4" aria-hidden /> {roomType.areaSqm} m²</li>
          </ul>
        </header>

        <StayGallery images={images} alt={roomType.name} />

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            {roomType.description && (
              <Section title="Về hạng phòng này">
                <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{roomType.description}</p>
              </Section>
            )}

            <section id="stay" aria-label="Kỳ nghỉ của bạn" className="scroll-mt-28">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-bold">
                <CalendarDays className="size-4 text-primary" aria-hidden /> Đổi ngày hoặc số khách
                {updating && <Loader2 className="size-3.5 animate-spin text-muted-foreground" aria-label="Đang cập nhật giá" />}
              </h2>
              <StaySearchBar
                key={staySearch(query)}
                showDestination={false}
                submitLabel="Cập nhật giá"
                initialCheckIn={query.checkIn}
                initialCheckOut={query.checkOut}
                initialGuests={query.guests}
                initialRooms={query.rooms}
                onSearch={(params) => router.replace(roomHref(params), { scroll: false })}
              />
            </section>

            <Section title="Tiện nghi trong phòng" icon={Sparkles}>
              <AmenityGroups amenities={roomType.amenities} initial={9} />
            </Section>

            {hotel && hotel.addOns.length > 0 && (
              <Section title="Dịch vụ thêm của khách sạn" icon={ConciergeBell}>
                <p className="mb-3 text-sm text-muted-foreground">
                  {prebookable.length > 0
                    ? "Chọn ở bước đặt phòng để trả cùng tiền phòng, hoặc gọi tại khách sạn."
                    : "Gọi tại khách sạn và thanh toán khi trả phòng."}
                </p>
                <AddOnsPreview addOns={hotel.addOns} />
              </Section>
            )}

            {hotel && (
              <Section title="Nhận & trả phòng" icon={Clock}>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-xl bg-muted p-3">
                    <dt className="text-xs font-semibold text-muted-foreground">Nhận phòng</dt>
                    <dd className="mt-1 text-base font-bold">
                      {formatDate(query.checkIn)} · từ {hotel.checkInTime ?? "14:00"}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-muted p-3">
                    <dt className="text-xs font-semibold text-muted-foreground">Trả phòng</dt>
                    <dd className="mt-1 text-base font-bold">
                      {formatDate(query.checkOut)} · trước {hotel.checkOutTime ?? "12:00"}
                    </dd>
                  </div>
                </dl>
                <Link href={`${hotelHref}#policies`} className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline">
                  Xem toàn bộ chính sách của khách sạn
                </Link>
              </Section>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:col-span-4">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-base font-bold">Kỳ nghỉ của bạn</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {formatDate(query.checkIn)} – {formatDate(query.checkOut)} · {nights} đêm · {query.guests} khách
              </p>

              {offer ? (
                <>
                  <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                    <div>
                      <span className="text-sm font-semibold">Số phòng</span>
                      <p className="text-xs text-muted-foreground">
                        Còn {offer.available} phòng · tối đa {maxRooms}/đơn
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-10"
                        onClick={() => setRooms(query.rooms - 1)}
                        disabled={query.rooms <= 1 || updating}
                        aria-label="Giảm số phòng"
                      >
                        <Minus className="size-4" />
                      </Button>
                      <span className="w-6 text-center text-base font-bold" aria-live="polite">
                        {query.rooms}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-10"
                        onClick={() => setRooms(query.rooms + 1)}
                        disabled={query.rooms >= maxRooms || updating}
                        aria-label="Tăng số phòng"
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  </div>

                  <div className={cn("mt-4 transition-opacity", updating && "opacity-60")}>
                    <OfferPrice offer={offer} query={query} align="left" />
                    {offer.nightlyPrices.length > 0 && (
                      <details className="group mt-2 text-sm">
                        <summary className="inline-flex min-h-10 cursor-pointer list-none items-center gap-1 font-semibold text-primary">
                          Giá từng đêm (1 phòng)
                          <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
                        </summary>
                        <ul className="space-y-1 rounded-lg bg-muted p-3">
                          {offer.nightlyPrices.map((night) => (
                            <li key={night.date} className="flex justify-between">
                              <span className="text-muted-foreground">{formatDate(night.date)}</span>
                              <span className="font-semibold">{formatMoney(night.price)}</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>

                  <CancellationLine offer={offer} className="mt-3" />
                  {blocker && (
                    <p role="status" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                      {blocker}
                    </p>
                  )}
                  {blocker && !offer.fitsGuests && offer.available > query.rooms && (
                    <Button type="button" variant="outline" className="mt-2 h-10 w-full" onClick={() => setRooms(query.rooms + 1)}>
                      Thêm 1 phòng
                    </Button>
                  )}
                  <div className="mt-4 hidden lg:block [&>a]:w-full">{bookButton}</div>
                  {blocker && (
                    <Link href={`${hotelHref}#rooms`} className="mt-2 hidden min-h-10 items-center justify-center text-sm font-semibold text-primary hover:underline lg:flex">
                      Xem hạng phòng khác
                    </Link>
                  )}
                </>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">Chọn ngày nhận và trả phòng để xem giá.</p>
              )}
            </section>
          </aside>
        </div>
      </main>

      <StickyBookingBar
        price={
          offer && !blocker ? (
            <>
              <span className="block text-xs text-muted-foreground">
                Tổng {nights} đêm · {query.rooms} phòng
              </span>
              <span className="text-lg font-bold text-primary">{formatMoney(offer.total)}</span>
            </>
          ) : (
            <span className="text-sm font-semibold">{offer ? "Chưa đặt được" : "Chưa chọn ngày"}</span>
          )
        }
        note={staySummary(query)}
        action={bookButton}
      />
      <Footer />
    </div>
  );
}
