"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  BedDouble,
  Building2,
  CalendarDays,
  Clock,
  ConciergeBell,
  Globe,
  Images,
  Loader2,
  MapPin,
  Phone,
  ScrollText,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import type { RoomTypeListing, StayQuery } from "@stayreco/shared";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AppBreadcrumb from "@/components/common/breadcrumb/AppBreadcrumb";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateViews";
import { buttonVariants } from "@/components/ui/button";
import { getApiErrorCode } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { useHotelRatingSummary } from "@/features/account/api/rewards-queries";
import { HotelReviews, ratingWord } from "@/features/reviews/components/HotelReviews";
import { StarDisplay } from "@/features/reviews/components/StarRating";
import { useHotelListing } from "../api/stays-queries";
import { formatMoney } from "../lib/format";
import { StaySearchBar } from "./StaySearchBar";
import { StayGallery } from "./StayGallery";
import {
  AddOnsPreview,
  AmenityGroups,
  AvailabilityPill,
  CancellationLine,
  OfferPrice,
  Section,
  SectionNav,
  StickyBookingBar,
  offerBlocker,
  staySearch,
  staySummary,
} from "./StayParts";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80";

const POLICY_LABELS: Record<string, string> = {
  cancellation: "Huỷ phòng",
  children: "Trẻ em",
  pets: "Thú cưng",
  smoking: "Hút thuốc",
};

/** Bookable rooms first, then by price for the stay; the API order otherwise. */
function sortRooms(rooms: RoomTypeListing[], query: StayQuery) {
  return [...rooms].sort((a, b) => {
    const blockedA = offerBlocker(a.offer, query) ? 1 : 0;
    const blockedB = offerBlocker(b.offer, query) ? 1 : 0;
    if (blockedA !== blockedB) return blockedA - blockedB;
    return (a.offer?.total ?? Infinity) - (b.offer?.total ?? Infinity);
  });
}

function RoomOffer({ room, query, hotelId }: { room: RoomTypeListing; query: StayQuery; hotelId: string }) {
  const { roomType, offer } = room;
  const image = roomType.images[0]?.url ?? FALLBACK_IMAGE;
  const href = `/hotels/${hotelId}/rooms/${roomType.id}?${staySearch(query)}`;
  const blocker = offerBlocker(offer, query);
  const shownAmenities = roomType.amenities.slice(0, 5);
  const moreAmenities = roomType.amenities.length - shownAmenities.length;

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xs md:flex">
      <Link href={href} className="relative block aspect-[4/3] shrink-0 bg-muted md:aspect-auto md:w-72" aria-label={`Xem chi tiết ${roomType.name}`}>
        <Image src={image} alt={roomType.name} fill sizes="(min-width: 768px) 288px, 100vw" className="object-cover" />
        {roomType.images.length > 1 && (
          <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs font-semibold text-white">
            <Images className="size-3.5" aria-hidden /> {roomType.images.length}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-between gap-4 p-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-lg font-bold text-foreground">
              <Link href={href} className="hover:text-primary hover:underline">
                {roomType.name}
              </Link>
            </h3>
            <AvailabilityPill offer={offer} query={query} />
          </div>
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <li className="inline-flex items-center gap-1.5"><Users className="size-4" aria-hidden /> Tối đa {roomType.maxOccupancy} khách</li>
            <li className="inline-flex items-center gap-1.5"><BedDouble className="size-4" aria-hidden /> {roomType.beds.map((bed) => `${bed.quantity} ${bed.name}`).join(", ") || "Chưa cập nhật giường"}</li>
            <li className="inline-flex items-center gap-1.5"><Building2 className="size-4" aria-hidden /> {roomType.areaSqm} m²</li>
          </ul>
          {shownAmenities.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {shownAmenities.map((amenity) => amenity.name).join(" · ")}
              {moreAmenities > 0 && ` · +${moreAmenities} tiện nghi`}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <CancellationLine offer={offer} />
            {blocker && offer && <p className="text-xs font-medium text-amber-800">{blocker}</p>}
          </div>
          <div className="flex items-end justify-between gap-4 sm:flex-col sm:items-end sm:gap-2">
            {offer ? <OfferPrice offer={offer} query={query} size="md" /> : <p className="text-sm text-muted-foreground">Chọn ngày để xem giá</p>}
            <Link
              href={href}
              className={cn(
                buttonVariants({ variant: blocker ? "outline" : "default" }),
                "h-10 shrink-0 px-5 whitespace-nowrap",
              )}
            >
              {blocker ? "Xem chi tiết" : "Chọn phòng"}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export function HotelDetail({ hotelId, query }: { hotelId: string; query: StayQuery }) {
  const router = useRouter();
  const { data, isLoading, isFetching, isPlaceholderData, error, refetch } = useHotelListing(hotelId, query);
  const rating = useHotelRatingSummary(hotelId).data;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <LoadingState rows={4} label="Đang tải chỗ nghỉ…" className="[&>*:first-of-type]:h-80" />
        </main>
      </div>
    );
  }

  if (error || !data) {
    const notFound = ["HOTEL_NOT_FOUND", "NOT_FOUND"].includes(getApiErrorCode(error) ?? "");
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="mx-auto w-full max-w-lg flex-1 px-4 py-16">
          {notFound || !error ? (
            <EmptyState
              icon={Search}
              title="Không tìm thấy chỗ nghỉ"
              description="Chỗ nghỉ này không còn mở bán hoặc đường dẫn không đúng."
              action={
                <Link href="/search" className={cn(buttonVariants(), "h-10")}>
                  Tìm chỗ nghỉ khác
                </Link>
              }
            />
          ) : (
            <ErrorState
              title="Không tải được chỗ nghỉ"
              error={error}
              onRetry={() => void refetch()}
              action={
                <Link href="/search" className={cn(buttonVariants({ variant: "ghost" }), "h-10")}>
                  Về trang tìm kiếm
                </Link>
              }
            />
          )}
        </main>
        <Footer />
      </div>
    );
  }

  const { hotel } = data;
  const roomTypes = sortRooms(data.roomTypes, query);
  const bookable = roomTypes.filter((room) => !offerBlocker(room.offer, query));
  const cheapest = bookable[0];
  const images = hotel.images.length > 0 ? hotel.images : [{ id: "fallback", url: FALLBACK_IMAGE, caption: null }];
  const policies = Object.entries(hotel.policies);
  const mapsHref =
    hotel.latitude != null && hotel.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${hotel.latitude},${hotel.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hotel.name}, ${hotel.address}, ${hotel.city}`)}`;
  const searchHref = `/search?destination=${encodeURIComponent(hotel.city)}&${staySearch(query)}`;
  const updating = isPlaceholderData || isFetching;

  const sectionLinks = [
    { href: "#rooms", label: "Phòng & giá" },
    { href: "#amenities", label: "Tiện ích" },
    ...(hotel.addOns.length > 0 ? [{ href: "#add-ons", label: "Dịch vụ thêm" }] : []),
    { href: "#policies", label: "Chính sách" },
    { href: "#reviews", label: rating && rating.count > 0 ? `Đánh giá (${rating.count})` : "Đánh giá" },
  ];

  const primaryAction = (
    <Link
      href={cheapest ? `/hotels/${hotelId}/rooms/${cheapest.roomType.id}?${staySearch(query)}` : "#rooms"}
      className={cn(buttonVariants(), "h-11 px-5 whitespace-nowrap")}
    >
      {cheapest ? "Chọn phòng" : "Xem phòng"}
    </Link>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-grow px-4 pt-5 pb-28 sm:px-6 lg:px-8 lg:pb-10">
        <AppBreadcrumb
          items={[
            { label: "Trang chủ", href: "/" },
            { label: `Khách sạn tại ${hotel.city}`, href: searchHref },
            { label: hotel.name },
          ]}
          className="mb-4"
        />

        <header className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {hotel.starRating ? (
                <span className="inline-flex items-center gap-1" aria-label={`${hotel.starRating} sao`}>
                  <StarDisplay value={hotel.starRating} size="size-4" />
                </span>
              ) : null}
              {rating && rating.count > 0 && (
                <a
                  href="#reviews"
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-primary px-2 py-1 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  <Star className="size-3.5 fill-current" aria-hidden /> {rating.average.toFixed(1)} {ratingWord(rating.average)}
                  <span className="font-normal opacity-80">· {rating.count} đánh giá</span>
                </a>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{hotel.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 shrink-0" aria-hidden /> {hotel.address}, {hotel.city}
              </span>
              <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
                Xem bản đồ
              </a>
            </p>
          </div>
        </header>

        <StayGallery images={images} alt={hotel.name} />

        <SectionNav links={sectionLinks} />

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <section id="stay" aria-label="Kỳ nghỉ của bạn" className="scroll-mt-36">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-bold">
                <CalendarDays className="size-4 text-primary" aria-hidden /> Kỳ nghỉ của bạn
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
                onSearch={(params) => router.replace(`/hotels/${hotelId}?${staySearch(params)}`, { scroll: false })}
              />
            </section>

            <section id="rooms" className="scroll-mt-36 space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-lg font-bold">Phòng & giá</h2>
                <span className="text-sm text-muted-foreground">
                  {staySummary(query)} · {bookable.length}/{roomTypes.length} hạng phòng còn đặt được
                </span>
              </div>
              <div className={cn("space-y-4 transition-opacity", updating && "opacity-60")}>
                {roomTypes.map((room) => (
                  <RoomOffer key={room.roomType.id} room={room} query={query} hotelId={hotelId} />
                ))}
              </div>
              {roomTypes.length === 0 && (
                <EmptyState icon={BedDouble} title="Chỗ nghỉ chưa mở bán hạng phòng nào" description="Quay lại sau hoặc xem chỗ nghỉ khác gần đây." />
              )}
              {roomTypes.length > 0 && bookable.length === 0 && (
                <EmptyState
                  icon={CalendarDays}
                  title="Không còn phòng phù hợp cho kỳ nghỉ này"
                  description="Thử đổi ngày, giảm số khách hoặc tăng số phòng ở ô “Kỳ nghỉ của bạn”."
                  action={
                    <a href="#stay" className={cn(buttonVariants({ variant: "outline" }), "h-10")}>
                      Đổi ngày hoặc số khách
                    </a>
                  }
                />
              )}
            </section>

            <Section id="overview" title="Giới thiệu" icon={Building2}>
              <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                {hotel.description || "Chỗ nghỉ chưa cập nhật mô tả."}
              </p>
              {(hotel.phone || hotel.website) && (
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                  {hotel.phone && (
                    <a href={`tel:${hotel.phone}`} className="inline-flex min-h-10 items-center gap-1.5 font-semibold text-primary hover:underline">
                      <Phone className="size-4" aria-hidden /> {hotel.phone}
                    </a>
                  )}
                  {hotel.website && (
                    <a href={hotel.website} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 font-semibold text-primary hover:underline">
                      <Globe className="size-4" aria-hidden /> Website khách sạn
                    </a>
                  )}
                </div>
              )}
            </Section>

            <Section id="amenities" title="Tiện ích" icon={Sparkles}>
              <AmenityGroups amenities={hotel.amenities} />
            </Section>

            {hotel.addOns.length > 0 && (
              <Section id="add-ons" title="Dịch vụ thêm" icon={ConciergeBell}>
                <p className="mb-3 text-sm text-muted-foreground">
                  Đặt trước khi đặt phòng (trả cùng tiền phòng, hoàn đủ nếu huỷ), hoặc gọi tại khách sạn và trả khi trả phòng.
                </p>
                <AddOnsPreview addOns={hotel.addOns} />
              </Section>
            )}

            <Section id="policies" title="Chính sách lưu trú" icon={ScrollText}>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div className="rounded-xl bg-muted p-3">
                  <dt className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Clock className="size-3.5" aria-hidden /> Nhận phòng</dt>
                  <dd className="mt-1 text-base font-bold">Từ {hotel.checkInTime ?? "14:00"}</dd>
                </div>
                <div className="rounded-xl bg-muted p-3">
                  <dt className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Clock className="size-3.5" aria-hidden /> Trả phòng</dt>
                  <dd className="mt-1 text-base font-bold">Trước {hotel.checkOutTime ?? "12:00"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-semibold">Huỷ phòng</dt>
                  <dd className="text-muted-foreground">
                    {hotel.cancellationPolicy.freeCancellationDays == null
                      ? `Không huỷ miễn phí. Phí huỷ ${hotel.cancellationPolicy.feePercent}% tiền phòng.`
                      : `Miễn phí huỷ đến ${hotel.checkInTime ?? "14:00"}, ${hotel.cancellationPolicy.freeCancellationDays} ngày trước ngày nhận phòng; sau đó phí ${hotel.cancellationPolicy.feePercent}% tiền phòng. Dịch vụ đặt kèm luôn được hoàn đủ.`}
                  </dd>
                </div>
                {hotel.lateCheckoutPolicy && (
                  <div className="sm:col-span-2">
                    <dt className="font-semibold">Trả phòng muộn</dt>
                    <dd className="text-muted-foreground">
                      Miễn phí {hotel.lateCheckoutPolicy.graceMinutes} phút sau giờ trả phòng. Sau đó đến{" "}
                      {hotel.lateCheckoutPolicy.cutoffTime} tính {hotel.lateCheckoutPolicy.beforeCutoffPercent}% giá đêm cuối,
                      từ {hotel.lateCheckoutPolicy.cutoffTime} tính {hotel.lateCheckoutPolicy.afterCutoffPercent}%. Thu tại quầy lễ tân.
                    </dd>
                  </div>
                )}
                {policies
                  .filter(([key]) => key !== "cancellation")
                  .map(([key, value]) => (
                    <div key={key} className="sm:col-span-2">
                      <dt className="font-semibold">{POLICY_LABELS[key] ?? key}</dt>
                      <dd className="text-muted-foreground">{value}</dd>
                    </div>
                  ))}
              </dl>
            </Section>

            <HotelReviews hotelId={hotelId} />
          </div>

          <aside className="hidden space-y-4 lg:sticky lg:top-36 lg:col-span-4 lg:block">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">{staySummary(query)}</p>
              {cheapest?.offer ? (
                <>
                  <p className="mt-2 text-xs text-muted-foreground">Giá thấp nhất cho kỳ nghỉ</p>
                  <p className="text-2xl font-bold text-primary">{formatMoney(cheapest.offer.total)}</p>
                  <p className="text-xs text-muted-foreground">{cheapest.roomType.name} · đã gồm thuế và phí</p>
                  <CancellationLine offer={cheapest.offer} className="mt-3" />
                  <div className="mt-4 [&>a]:w-full">{primaryAction}</div>
                </>
              ) : (
                <>
                  <p className="mt-2 text-sm font-semibold">Chưa có phòng phù hợp</p>
                  <p className="text-sm text-muted-foreground">Đổi ngày hoặc số khách để xem phòng trống.</p>
                  <a href="#stay" className={cn(buttonVariants({ variant: "outline" }), "mt-4 h-11 w-full")}>
                    Đổi ngày hoặc số khách
                  </a>
                </>
              )}
            </section>
            <section className="rounded-2xl border border-border bg-card p-5 text-sm shadow-2xs">
              <h2 className="mb-1 flex items-center gap-2 font-bold">
                <ShieldCheck className="size-4 text-primary" aria-hidden /> Đặt phòng với StayReco
              </h2>
              <p className="text-muted-foreground">Giá xác nhận ngay khi đặt, thanh toán chuyển khoản hoặc bằng ví StayReco.</p>
            </section>
          </aside>
        </div>
      </main>

      <StickyBookingBar
        price={
          cheapest?.offer ? (
            <>
              <span className="block text-xs text-muted-foreground">Từ</span>
              <span className="text-lg font-bold text-primary">{formatMoney(cheapest.offer.total)}</span>
            </>
          ) : (
            <span className="text-sm font-semibold">Chưa có phòng phù hợp</span>
          )
        }
        note={staySummary(query)}
        action={
          cheapest ? (
            primaryAction
          ) : (
            <a href="#stay" className={cn(buttonVariants({ variant: "outline" }), "h-11 px-4")}>
              Đổi ngày
            </a>
          )
        }
      />
      <Footer />
    </div>
  );
}
