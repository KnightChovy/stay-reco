"use client";

import Link from "next/link";
import {
  BedDouble,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Users,
  Wifi,
} from "lucide-react";
import type { RoomTypeListing, StayQuery } from "@stayreco/shared";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AppBreadcrumb from "@/components/common/breadcrumb/AppBreadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getApiErrorMessage } from "@/lib/api-error";
import { useHotelListing } from "../api/stays-queries";
import { formatDate, formatDateTime, formatMoney } from "../lib/format";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80";

const POLICY_LABELS: Record<string, string> = {
  cancellation: "Chính sách huỷ phòng",
  children: "Trẻ em",
  pets: "Thú cưng",
  smoking: "Hút thuốc",
};

function staySearch(query: StayQuery) {
  return `checkIn=${query.checkIn ?? ""}&checkOut=${query.checkOut ?? ""}&guests=${query.guests}&rooms=${query.rooms}`;
}

function RoomOffer({ room, query, hotelId }: { room: RoomTypeListing; query: StayQuery; hotelId: string }) {
  const { roomType, offer } = room;
  const image = roomType.images[0]?.url ?? FALLBACK_IMAGE;
  const href = `/hotels/${hotelId}/rooms/${roomType.id}?${staySearch(query)}`;

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-white shadow-2xs md:flex">
      <Link href={href} className="relative block h-48 shrink-0 bg-slate-100 md:h-auto md:w-72">
        <img src={image} alt={roomType.name} className="h-full w-full object-cover" />
        <span className="absolute left-3 top-3 rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
          {offer ? `Còn ${offer.available} phòng` : "Liên hệ"}
        </span>
      </Link>

      <div className="flex flex-1 flex-col justify-between gap-4 p-5">
        <div className="space-y-2">
          <Link href={href} className="inline-block">
            <h3 className="text-lg font-bold text-foreground transition-colors hover:text-primary">
              {roomType.name}
            </h3>
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> Tối đa {roomType.maxOccupancy} khách</span>
            <span className="inline-flex items-center gap-1"><BedDouble className="size-3.5" /> {roomType.beds.map((bed) => `${bed.quantity} ${bed.name}`).join(", ") || "—"}</span>
            <span className="inline-flex items-center gap-1"><Building2 className="size-3.5" /> {roomType.areaSqm} m²</span>
          </div>
          {roomType.description && <p className="text-xs leading-relaxed text-muted-foreground">{roomType.description}</p>}
          <div className="flex flex-wrap gap-1.5">
            {roomType.amenities.slice(0, 6).map((amenity) => (
              <span key={amenity.id} className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                {amenity.name}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border pt-3">
          <div className="space-y-1 text-xs">
            {offer?.freeCancellationUntil ? (
              <span className="flex items-center gap-1 font-medium text-emerald-700">
                <CheckCircle2 className="size-3.5" /> Miễn phí huỷ đến {formatDateTime(offer.freeCancellationUntil)}
              </span>
            ) : (
              <span className="text-muted-foreground">Không hoàn huỷ · phí {offer?.cancellationFeePercent ?? 0}%</span>
            )}
            {offer && !offer.fitsGuests && <span className="block font-medium text-amber-700">Không đủ chỗ cho {query.guests} khách</span>}
          </div>

          <div className="text-right">
            <span className="block text-[11px] text-muted-foreground">
              {formatMoney(offer?.perRoomTotal)} / phòng · {query.checkIn && query.checkOut ? `${formatDate(query.checkIn)} – ${formatDate(query.checkOut)}` : "chưa chọn ngày"}
            </span>
            <span className="block text-xl font-bold text-primary">{formatMoney(offer?.total)}</span>
            <Link href={href}>
              <Button size="sm" className="mt-1 gap-1.5">Xem chi tiết</Button>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export function HotelDetail({
  hotelId,
  query,
}: {
  hotelId: string;
  query: StayQuery;
}) {
  const { data, isLoading, error, refetch } = useHotelListing(hotelId, query);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#fbfaf8]">
        <Header />
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" /> Đang tải chỗ nghỉ…
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col bg-[#fbfaf8]">
        <Header />
        <div className="mx-auto mt-16 max-w-lg space-y-4 px-4 text-center">
          <ShieldCheck className="mx-auto size-10 text-muted-foreground" />
          <h1 className="text-xl font-bold text-foreground">Không tìm thấy chỗ nghỉ</h1>
          <p className="text-sm text-muted-foreground">{error ? getApiErrorMessage(error) : "Chỗ nghỉ không tồn tại."}</p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => void refetch()}>Thử lại</Button>
            <Link href="/search"><Button>Tìm chỗ nghỉ khác</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const { hotel, roomTypes } = data;
  const hero = hotel.images[0]?.url ?? FALLBACK_IMAGE;
  const policies = Object.entries(hotel.policies);

  return (
    <div className="flex min-h-screen flex-col bg-[#fbfaf8] text-slate-800 antialiased">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-5 sm:px-6 lg:px-8">
        <AppBreadcrumb
          items={[
            { label: "Trang chủ", href: "/" },
            { label: hotel.city, href: `/search?destination=${encodeURIComponent(hotel.city)}` },
            { label: hotel.name },
          ]}
          className="mb-4"
        />

        <section className="overflow-hidden rounded-3xl border border-border bg-white shadow-2xs">
          <div className="relative h-64 bg-slate-100 sm:h-80">
            <img src={hero} alt={hotel.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 text-white">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge className="border-0 bg-white/90 text-slate-900">{hotel.starRating ? `${hotel.starRating} sao` : "Chỗ nghỉ"}</Badge>
                <Badge className="border-0 bg-emerald-500/90 text-white">Đã xác minh</Badge>
              </div>
              <h1 className="text-2xl font-bold sm:text-3xl">{hotel.name}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-white/90">
                <MapPin className="size-4" /> {hotel.address}, {hotel.city}, {hotel.country}
              </p>
            </div>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-3 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-muted-foreground"><Clock className="size-3.5" /> Nhận phòng</span>
              <span className="mt-1 block text-base font-bold text-foreground">{hotel.checkInTime ?? "14:00"}</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-muted-foreground"><Clock className="size-3.5" /> Trả phòng</span>
              <span className="mt-1 block text-base font-bold text-foreground">{hotel.checkOutTime ?? "12:00"}</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-muted-foreground"><CalendarDays className="size-3.5" /> Kỳ nghỉ</span>
              <span className="mt-1 block text-sm font-bold text-foreground">
                {formatDate(query.checkIn)} – {formatDate(query.checkOut)}
              </span>
              <span className="text-[11px] text-muted-foreground">{query.guests} khách · {query.rooms} phòng</span>
            </div>
          </div>
        </section>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <section id="overview" className="rounded-2xl border border-border bg-white p-6 shadow-2xs">
              <h2 className="mb-3 text-lg font-bold text-foreground">Tổng quan chỗ nghỉ</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{hotel.description || "Chỗ nghỉ chưa cập nhật mô tả."}</p>
              {(hotel.phone || hotel.website) && (
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {hotel.phone && <span className="inline-flex items-center gap-1"><Phone className="size-3.5" /> {hotel.phone}</span>}
                  {hotel.website && <a href={hotel.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline"><Mail className="size-3.5" /> Website</a>}
                </div>
              )}
            </section>

            <section id="rooms" className="space-y-4">
              <div className="flex items-end justify-between">
                <h2 className="text-lg font-bold text-foreground">Các hạng phòng trống</h2>
                <span className="text-xs text-muted-foreground">{roomTypes.length} hạng phòng</span>
              </div>
              {roomTypes.map((room) => (
                <RoomOffer key={room.roomType.id} room={room} query={query} hotelId={hotelId} />
              ))}
              {roomTypes.length === 0 && (
                <div className="rounded-2xl border border-border bg-white p-8 text-center text-sm text-muted-foreground">
                  Chỗ nghỉ chưa có hạng phòng nào.
                </div>
              )}
            </section>

            <section id="amenities" className="rounded-2xl border border-border bg-white p-6 shadow-2xs">
              <h2 className="mb-4 text-lg font-bold text-foreground">Tiện ích nổi bật</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {hotel.amenities.map((amenity) => (
                  <span key={amenity.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
                    <Wifi className="size-3.5 text-primary" /> {amenity.name}
                  </span>
                ))}
                {hotel.amenities.length === 0 && <p className="text-xs text-muted-foreground">Chưa cập nhật tiện ích.</p>}
              </div>
            </section>
          </div>

          <aside className="space-y-4 lg:col-span-4">
            <section className="rounded-2xl border border-border bg-white p-5 shadow-2xs">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                <ShieldCheck className="size-4 text-primary" /> Chính sách lưu trú
              </h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Huỷ miễn phí</span>
                  <span className="text-right font-semibold text-foreground">
                    {hotel.cancellationPolicy.freeCancellationDays == null
                      ? "Không có"
                      : `${hotel.cancellationPolicy.freeCancellationDays} ngày trước check-in`}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Phí huỷ sau hạn</span>
                  <span className="font-semibold text-foreground">{hotel.cancellationPolicy.feePercent}%</span>
                </div>
                {policies.map(([key, value]) => (
                  <div key={key} className="border-t border-border pt-2">
                    <span className="block text-[11px] font-semibold uppercase text-muted-foreground">{POLICY_LABELS[key] ?? key}</span>
                    <p className="text-xs text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-white p-5 shadow-2xs">
              <h2 className="mb-1 text-sm font-bold text-foreground">Vị trí</h2>
              <p className="text-xs text-muted-foreground">{hotel.address}, {hotel.city}</p>
              {hotel.latitude != null && hotel.longitude != null && (
                <a
                  href={`https://www.google.com/maps?q=${hotel.latitude},${hotel.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs font-semibold text-primary underline"
                >
                  Mở trên Google Maps
                </a>
              )}
            </section>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
