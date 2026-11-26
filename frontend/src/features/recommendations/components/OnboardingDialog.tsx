"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Copy, Gift, Loader2, MapPin, Star } from "lucide-react";
import {
  ONBOARDING_LIMITS,
  type CompleteOnboardingInput,
  type Onboarding,
  type OnboardingHotelsQuery,
  type Voucher,
} from "@stayreco/shared";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatMoney } from "@/features/stays/lib/format";
import { AMENITIES, BUDGETS, STYLES } from "@/features/account/lib/preference-options";
import { describeVoucherDiscount } from "@/features/account/lib/rewards-labels";
import { useCompleteOnboarding, useOnboardingHotels, useSkipOnboarding } from "../api/recommendation-queries";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80";

type Picks = {
  cities: string[];
  hotelIds: string[];
  viewIds: string[];
  travelStyles: string[];
  roomAmenities: string[];
  budget: string;
};

const EMPTY: Picks = { cities: [], hotelIds: [], viewIds: [], travelStyles: [], roomAmenities: [], budget: "" };

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);

function countPicks(picks: Picks) {
  return (
    picks.cities.length +
    picks.hotelIds.length +
    picks.viewIds.length +
    picks.travelStyles.length +
    picks.roomAmenities.length +
    (picks.budget ? 1 : 0)
  );
}

/** The answers the hotel step is chosen from: everything but the hotels themselves. */
function toHotelsQuery(picks: Picks): OnboardingHotelsQuery {
  const list = (items: string[]) => (items.length ? items : undefined);
  return {
    cities: list(picks.cities),
    travelStyles: list(picks.travelStyles),
    roomAmenities: list(picks.roomAmenities),
    viewIds: list(picks.viewIds),
    budgetPerNight: picks.budget ? Number(picks.budget) : undefined,
  };
}

/** Lists left empty are left out, so the backend keeps whatever the customer had saved before. */
function toInput(picks: Picks): CompleteOnboardingInput {
  const list = (items: string[]) => (items.length ? items : undefined);
  return {
    cities: list(picks.cities),
    hotelIds: list(picks.hotelIds),
    viewIds: list(picks.viewIds),
    travelStyles: list(picks.travelStyles),
    roomAmenities: list(picks.roomAmenities),
    budgetPerNight: picks.budget ? Number(picks.budget) : undefined,
  };
}

/**
 * First-login preferences (docs/api/onboarding.md): destinations, then style, amenities, views and budget, then the
 * hotels that fit those answers (`GET /me/onboarding/hotels`). Hotels come last so a customer cannot pick one that
 * contradicts what they just said: changing an earlier answer clears the hotels picked, since they were offered for
 * the old answers. At least `ONBOARDING_LIMITS.minPicks` picks finish it and earn the platform's welcome voucher,
 * shown at once. A new customer must finish it (`required`, decided 2026-11-26: the recommendations start from these
 * answers); opened again from /account/preferences it can be closed with "Để sau".
 */
export function OnboardingDialog({
  onboarding,
  open,
  onClose,
  required = false,
}: {
  onboarding: Onboarding;
  open: boolean;
  onClose: () => void;
  /** No "Để sau", and Escape does not close it: only finishing does. */
  required?: boolean;
}) {
  const options = onboarding.options;
  const steps = [
    { key: "destinations", show: !!options?.destinations.length },
    { key: "taste", show: true },
    { key: "hotels", show: true },
  ].filter((step) => step.show);

  const [stepIndex, setStepIndex] = useState(0);
  const [picks, setPicks] = useState<Picks>(EMPTY);
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [done, setDone] = useState(false);
  const complete = useCompleteOnboarding();
  const skip = useSkipOnboarding();

  const step = steps[Math.min(stepIndex, steps.length - 1)].key;
  const isLast = stepIndex >= steps.length - 1;
  const picked = countPicks(picks);
  const enough = picked >= ONBOARDING_LIMITS.minPicks;
  const busy = complete.isPending || skip.isPending;
  const suggestions = useOnboardingHotels(toHotelsQuery(picks), open && step === "hotels");

  const later = () => {
    if (busy) return;
    // Skipping again after a skip changes nothing; only a NEW customer records it.
    if (onboarding.status === "NEW") skip.mutate(undefined, { onSettled: onClose });
    else onClose();
  };

  const finish = () => {
    complete.mutate(toInput(picks), {
      onSuccess: (result) => {
        setVoucher(result.voucher);
        setDone(true);
      },
    });
  };

  const edit = (next: (prev: Picks) => Picks) => {
    complete.reset();
    setPicks(next);
  };
  /** An earlier answer changed: the hotels picked were offered for the old answers, so they go. */
  const answer = (next: (prev: Picks) => Picks) => edit((prev) => ({ ...next(prev), hotelIds: [] }));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) return;
        if (done) onClose();
        else if (!required) later();
      }}
      disablePointerDismissal
    >
      <DialogContent
        showCloseButton={false}
        // On a very short window the whole dialog scrolls rather than squeezing the choices to nothing.
        className="flex max-h-[min(44rem,calc(100dvh-2rem))] flex-col gap-0 overflow-y-auto p-0 sm:max-w-2xl"
      >
        {done ? (
          <WelcomeDone voucher={voucher} onClose={onClose} />
        ) : (
          <>
            <DialogHeader className="gap-1 border-b border-border px-5 pt-5 pb-4">
              <p className="text-xs font-semibold text-primary">
                Bước {stepIndex + 1}/{steps.length}
              </p>
              <DialogTitle className="text-lg font-bold">
                {step === "destinations"
                  ? "Bạn muốn đi đâu?"
                  : step === "hotels"
                    ? "Khách sạn hợp gu của bạn"
                    : "Gu nghỉ dưỡng của bạn"}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {step === "hotels" && "Dựa trên điểm đến và gu bạn vừa chọn. Tick những nơi bạn thấy thích. "}
                Chọn ít nhất {ONBOARDING_LIMITS.minPicks} mục để StayReco gợi ý hợp gu hơn, kèm{" "}
                <strong className="font-semibold text-foreground">voucher chào mừng</strong>.
              </DialogDescription>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
                />
              </div>
            </DialogHeader>

            <div className="min-h-48 flex-1 overflow-y-auto px-5 py-4">
              {step === "destinations" && options && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="group" aria-label="Điểm đến">
                  {options.destinations.map((destination) => {
                    const active = picks.cities.includes(destination.city);
                    return (
                      <PickTile
                        key={destination.city}
                        active={active}
                        onClick={() => answer((prev) => ({ ...prev, cities: toggle(prev.cities, destination.city) }))}
                        image={destination.imageUrl}
                        title={destination.city}
                        subtitle={`${destination.hotels} khách sạn`}
                      />
                    );
                  })}
                </div>
              )}

              {step === "hotels" &&
                (suggestions.isPending ? (
                  <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground" role="status">
                    <Loader2 className="size-4 animate-spin" aria-hidden /> Đang tìm khách sạn hợp gu…
                  </div>
                ) : suggestions.isError ? (
                  <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
                    <p role="alert">{getApiErrorMessage(suggestions.error)}</p>
                    <Button type="button" variant="outline" className="h-10 px-4" onClick={() => void suggestions.refetch()}>
                      Thử lại
                    </Button>
                  </div>
                ) : !suggestions.data.length ? (
                  <p className="flex min-h-40 items-center justify-center px-4 text-center text-sm text-muted-foreground">
                    Chưa có khách sạn nào ở điểm đến bạn chọn hợp với gu này. Bạn có thể hoàn tất luôn, hoặc quay lại đổi
                    điểm đến hay phong cách.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="group" aria-label="Khách sạn hợp gu">
                    {suggestions.data.map((hotel) => {
                      const active = picks.hotelIds.includes(hotel.id);
                      return (
                        <PickTile
                          key={hotel.id}
                          active={active}
                          onClick={() => edit((prev) => ({ ...prev, hotelIds: toggle(prev.hotelIds, hotel.id) }))}
                          image={hotel.imageUrl}
                          title={hotel.name}
                          subtitle={
                            <span className="flex flex-col gap-1">
                              <span className="flex items-center gap-1">
                                <MapPin className="size-3" aria-hidden /> {hotel.city}
                                {hotel.rating !== null && (
                                  <>
                                    <Star className="ml-1 size-3 fill-amber-400 text-amber-400" aria-hidden />
                                    {hotel.rating.toFixed(1)}
                                  </>
                                )}
                              </span>
                              {hotel.pricePerNightFrom !== null && (
                                <span className={cn(hotel.overBudget && "font-semibold text-amber-700")}>
                                  Từ {formatMoney(hotel.pricePerNightFrom)}/đêm{hotel.overBudget && " · trên ngân sách"}
                                </span>
                              )}
                              {hotel.matches.length > 0 && (
                                <span className="line-clamp-2 text-primary">Hợp: {hotel.matches.join(" · ")}</span>
                              )}
                            </span>
                          }
                        />
                      );
                    })}
                  </div>
                ))}

              {step === "taste" && (
                <div className="space-y-5">
                  <ChipGroup
                    label="Phong cách du lịch"
                    items={STYLES.map((style) => ({ id: style.id, label: style.title }))}
                    selected={picks.travelStyles}
                    onToggle={(id) => answer((prev) => ({ ...prev, travelStyles: toggle(prev.travelStyles, id) }))}
                  />
                  <ChipGroup
                    label="Tiện nghi ưu tiên"
                    items={AMENITIES}
                    selected={picks.roomAmenities}
                    onToggle={(id) => answer((prev) => ({ ...prev, roomAmenities: toggle(prev.roomAmenities, id) }))}
                  />
                  {!!options?.views.length && (
                    <ChipGroup
                      label="Tầm nhìn yêu thích"
                      items={options.views.map((view) => ({ id: view.id, label: view.name }))}
                      selected={picks.viewIds}
                      onToggle={(id) => answer((prev) => ({ ...prev, viewIds: toggle(prev.viewIds, id) }))}
                    />
                  )}
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-bold text-foreground">Ngân sách mỗi đêm</legend>
                    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Ngân sách mỗi đêm">
                      {BUDGETS.map((budget) => (
                        <button
                          key={budget.id || "none"}
                          type="button"
                          role="radio"
                          aria-checked={picks.budget === budget.id}
                          onClick={() => answer((prev) => ({ ...prev, budget: budget.id }))}
                          className={cn(
                            "min-h-10 rounded-full border px-3.5 text-sm font-semibold transition-colors",
                            picks.budget === budget.id
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-muted/40 text-muted-foreground hover:bg-muted",
                          )}
                        >
                          {budget.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </div>
              )}
            </div>

            <div className="border-t border-border px-5 py-3">
              {complete.error && (
                <p role="alert" className="mb-2 text-sm text-destructive">
                  {getApiErrorMessage(complete.error)}
                </p>
              )}
              <div className="flex items-center gap-2">
                {!required && (
                  <Button type="button" variant="ghost" className="h-10 px-3" onClick={later} disabled={busy}>
                    {skip.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null} Để sau
                  </Button>
                )}
                <span className="ml-auto hidden text-xs text-muted-foreground sm:inline" aria-live="polite">
                  Đã chọn {picked}
                  {!enough && ` · cần thêm ${ONBOARDING_LIMITS.minPicks - picked}`}
                </span>
                {stepIndex > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="ml-auto h-10 px-4 sm:ml-0"
                    onClick={() => setStepIndex((index) => index - 1)}
                    disabled={busy}
                  >
                    Quay lại
                  </Button>
                )}
                {isLast ? (
                  <Button
                    type="button"
                    className={cn("h-10 gap-1.5 px-4", stepIndex === 0 && "ml-auto sm:ml-0")}
                    onClick={finish}
                    disabled={!enough || busy}
                  >
                    {complete.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Gift className="size-4" aria-hidden />}
                    {enough ? "Hoàn tất & nhận voucher" : `Chọn thêm ${ONBOARDING_LIMITS.minPicks - picked}`}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className={cn("h-10 px-5", stepIndex === 0 && "ml-auto sm:ml-0")}
                    onClick={() => setStepIndex((index) => index + 1)}
                    disabled={busy}
                  >
                    Tiếp tục
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PickTile({
  active,
  onClick,
  image,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  image: string | null;
  title: string;
  subtitle: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={title}
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-xl border-2 text-left transition-all focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        active ? "border-primary shadow-sm" : "border-transparent ring-1 ring-border hover:ring-primary/40",
      )}
    >
      <div className="relative aspect-[4/3] bg-muted">
        <Image src={image ?? FALLBACK_IMAGE} alt="" fill sizes="(min-width: 640px) 200px, 45vw" className="object-cover" />
        {active && (
          <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
            <Check className="size-3.5" aria-hidden />
          </span>
        )}
      </div>
      <div className={cn("p-2.5", active && "bg-primary/5")}>
        <p className="line-clamp-1 text-sm font-bold text-foreground">{title}</p>
        <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </button>
  );
}

function ChipGroup({
  label,
  items,
  selected,
  onToggle,
}: {
  label: string;
  items: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-bold text-foreground">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const active = selected.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(item.id)}
              className={cn(
                "flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-muted/40 text-muted-foreground hover:bg-muted",
              )}
            >
              {active && <Check className="size-3.5" aria-hidden />} {item.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function WelcomeDone({ voucher, onClose }: { voucher: Voucher | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!voucher) return;
    try {
      await navigator.clipboard.writeText(voucher.code);
      setCopied(true);
    } catch {
      // Clipboard blocked: the code is on screen and in /account/rewards.
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <Gift className="size-7" aria-hidden />
      </span>
      <DialogHeader className="items-center gap-1">
        <DialogTitle className="text-xl font-bold">Cảm ơn bạn!</DialogTitle>
        <DialogDescription className="text-sm">
          Đã lưu sở thích của bạn. Gợi ý sẽ hợp gu hơn từ lần cập nhật tới.
        </DialogDescription>
      </DialogHeader>

      {voucher && (
        <div className="w-full rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Voucher chào mừng</p>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="font-mono text-2xl font-bold tracking-wider text-primary">{voucher.code}</span>
            <Button type="button" variant="ghost" size="icon" className="size-10" onClick={copy} aria-label="Sao chép mã">
              {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
            </Button>
          </div>
          <p className="mt-1 text-sm font-semibold text-foreground">{describeVoucherDiscount(voucher)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {voucher.minBookingAmount ? `Đơn từ ${formatMoney(voucher.minBookingAmount)} · ` : ""}
            Mọi khách sạn
            {voucher.expiresAt ? ` · Hết hạn ${new Date(voucher.expiresAt).toLocaleDateString("vi-VN")}` : ""}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Nhập mã ở bước đặt phòng. Mã cũng có trong mục Ưu đãi của bạn.</p>
        </div>
      )}

      <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" className="h-10 px-4" onClick={onClose}>
          Xong
        </Button>
        <Link href="/recommendations" onClick={onClose} className={cn(buttonVariants(), "h-10 px-5")}>
          Xem gợi ý cho bạn
        </Link>
      </div>
    </div>
  );
}
