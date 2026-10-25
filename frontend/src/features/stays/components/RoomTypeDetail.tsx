"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BedDouble,
  Building2,
  CalendarDays,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { StayQuery } from "@stayreco/shared";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AppBreadcrumb from "@/components/common/breadcrumb/AppBreadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getApiErrorMessage } from "@/lib/api-error";
import { useHotelListing, useRoomTypeListing } from "../api/stays-queries";
import { formatDate, formatDateTime, formatMoney } from "../lib/format";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80";

function staySearch(query: StayQuery) {
  return `checkIn=${query.checkIn ?? ""}&checkOut=${query.checkOut ?? ""}&guests=${query.guests}&rooms=${query.rooms}`;
}

export function RoomTypeDetail({
  hotelId,
  roomTypeId,
  query,
}: {
  hotelId: string;
  roomTypeId: string;
  query: StayQuery;
}) {
  const roomQuery = useRoomTypeListing(roomTypeId, query);
  const hotelQuery = useHotelListing(hotelId, query);

  if (roomQuery.isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#fbfaf8]">
        <Header />
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" /> Đang tải hạng phòng…
        </div>
      </div>
    );
  }

  if (roomQuery.error || !roomQuery.data) {
    return (
      <div className="flex min-h-screen flex-col bg-[#fbfaf8]">
        <Header />
        <div className="mx-auto mt-16 max-w-lg space-y-4 px-4 text-center">
          <ShieldCheck className="mx-auto size-10 text-muted-foreground" />
          <h1 className="text-xl font-bold text-foreground">Không tìm thấy hạng phòng</h1>
          <p className="text-sm text-muted-foreground">
            {roomQuery.error ? getApiErrorMessage(roomQuery.error) : "Hạng phòng không tồn tại."}
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => void roomQuery.refetch()}>Thử lại</Button>
            <Link href={`/hotels/${hotelId}?${staySearch(query)}`}>
              <Button>Về chỗ nghỉ</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const { roomType, offer } = roomQuery.data;
  const hotel = hotelQuery.data?.hotel;
  const images = roomType.images.length > 0 ? roomType.images : [{ id: "fallback", url: FALLBACK_IMAGE, caption: null, sortOrder: 0 }];
  const nights = query.checkIn && query.checkOut
    ? Math.max(1, Math.round((new Date(`${query.checkOut}T00:00:00`).getTime() - new Date(`${query.checkIn}T00:00:00`).getTime()) / 86_400_000))
    : 0;
  const bookingHref = `/booking?roomTypeId=${roomType.id}&hotelId=${hotelId}&checkIn=${query.checkIn ?? ""}&checkOut=${query.checkOut ?? ""}&guests=${query.guests}&rooms=${query.rooms}`;

  return (
    <div className="flex min-h-screen flex-col bg-[#fbfaf8] text-slate-800 antialiased">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-5 sm:px-6 lg:px-8">
        <AppBreadcrumb
          items={[
            { label: "Trang chủ", href: "/" },
            { label: hotel?.name ?? "Chỗ nghỉ", href: `/hotels/${hotelId}?${staySearch(query)}` },
            { label: roomType.name },
          ]}
          className="mb-4"
        />

        <div className="grid items-start gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-2xs">
              <div className="relative h-64 bg-slate-100 sm:h-80">
                <img src={images[0].url} alt={roomType.name} className="h-full w-full object-cover" />
                <Link
                  href={`/hotels/${hotelId}?${staySearch(query)}`}
                  className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-xs"
                >
                  <ArrowLeft className="size-3.5" /> Về chỗ nghỉ
                </Link>
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto p-2">
                  {images.slice(0, 5).map((image) => (
                    <img
                      key={image.id}
                      src={image.url}
                      alt={image.caption ?? roomType.name}
                      className="h-20 w-28 shrink-0 rounded-lg object-cover"
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-white p-6 shadow-2xs">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">{roomType.name}</h1>
                {offer && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Còn {offer.available} phòng</Badge>}
                {offer && !offer.fitsGuests && <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Không đủ chỗ cho {query.guests} khách</Badge>}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> Tối đa {roomType.maxOccupancy} khách</span>
                <span className="inline-flex items-center gap-1"><BedDouble className="size-3.5" /> {roomType.beds.map((bed) => `${bed.quantity} ${bed.name}`).join(", ") || "—"}</span>
                <span className="inline-flex items-center gap-1"><Building2 className="size-3.5" /> {roomType.areaSqm} m²</span>
              </div>
              {roomType.description && (
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{roomType.description}</p>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-white p-6 shadow-2xs">
              <h2 className="mb-4 text-lg font-bold text-foreground">Tiện nghi hạng phòng</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {roomType.amenities.map((amenity) => (
                  <span key={amenity.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
                    <CheckCircle2 className="size-3.5 text-emerald-600" /> {amenity.name}
                  </span>
                ))}
                {roomType.amenities.length === 0 && <p className="text-xs text-muted-foreground">Chưa cập nhật tiện nghi.</p>}
              </div>
            </section>
          </div>

          <aside className="space-y-4 lg:col-span-4 lg:sticky lg:top-5">
            <section className="rounded-2xl border border-border bg-white p-5 shadow-2xs">
              <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-foreground">
                <CalendarDays className="size-4 text-primary" /> Kỳ nghỉ của bạn
              </h2>
              <p className="mb-4 text-xs text-muted-foreground">
                {formatDate(query.checkIn)} – {formatDate(query.checkOut)} · {nights} đêm · {query.guests} khách · {query.rooms} phòng
              </p>

              {offer ? (
                <>
                  <div className="mb-3 space-y-1.5 rounded-lg bg-slate-50 p-3 text-xs">
                    {offer.nightlyPrices.map((night) => (
                      <div key={night.date} className="flex justify-between">
                        <span className="text-muted-foreground">{formatDate(night.date)}</span>
                        <span className="font-semibold text-foreground">{formatMoney(night.price)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 border-t border-border pt-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mỗi phòng</span>
                      <span className="font-semibold text-foreground">{formatMoney(offer.perRoomTotal)}</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="font-semibold text-foreground">Tổng cộng</span>
                      <span className="font-bold text-primary">{formatMoney(offer.total)}</span>
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">
                    {offer.freeCancellationUntil
                      ? `Miễn phí huỷ đến ${formatDateTime(offer.freeCancellationUntil)}`
                      : `Không hoàn huỷ · phí huỷ ${offer.cancellationFeePercent}%`}
                  </div>
                  <Link href={bookingHref} className="mt-4 block">
                    <Button className="w-full" disabled={!offer.fitsGuests || offer.available < query.rooms}>
                      {offer.fitsGuests && offer.available >= query.rooms ? "Đặt phòng" : "Không đủ phòng"}
                    </Button>
                  </Link>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Chọn ngày nhận/trả phòng để xem giá.</p>
              )}
            </section>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
