import type { HotelSearchQuery, StayQuery } from "@stayreco/shared";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const DEFAULT_DESTINATION = "Đà Nẵng";

/** `YYYY-MM-DD` in the browser's time zone (not `toISOString`, which can shift the day). */
export function dateInput(daysFromToday = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Add days to a `YYYY-MM-DD` value without going through UTC. */
export function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  const month = `${next.getMonth() + 1}`.padStart(2, "0");
  const day = `${next.getDate()}`.padStart(2, "0");
  return `${next.getFullYear()}-${month}-${day}`;
}

export function defaultStay(daysAhead = 1, nights = 2) {
  return {
    checkIn: dateInput(daysAhead),
    checkOut: dateInput(daysAhead + nights),
    guests: 2,
    rooms: 1,
  };
}

export function nightsBetween(checkIn: string, checkOut: string) {
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  const nights = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return Number.isFinite(nights) && nights > 0 ? nights : 0;
}

function validStay(checkIn: string | null, checkOut: string | null) {
  if (!checkIn || !checkOut || !DATE_PATTERN.test(checkIn) || !DATE_PATTERN.test(checkOut)) return null;
  return nightsBetween(checkIn, checkOut) > 0 ? { checkIn, checkOut } : null;
}

function numberParam(params: URLSearchParams, key: string, fallback: number, min = 1) {
  const value = Number(params.get(key));
  return Number.isInteger(value) && value >= min ? value : fallback;
}

function listParam(params: URLSearchParams, key: string) {
  return params
    .getAll(key)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

export function parseStayQuery(params: URLSearchParams): StayQuery {
  const stay = validStay(params.get("checkIn"), params.get("checkOut"));
  return {
    ...(stay ?? defaultStay()),
    guests: numberParam(params, "guests", 2),
    rooms: numberParam(params, "rooms", 1),
  };
}

export function parseHotelSearchParams(params: URLSearchParams): HotelSearchQuery {
  const stay = validStay(params.get("checkIn"), params.get("checkOut")) ?? defaultStay();
  const destination = params.get("destination")?.trim() || DEFAULT_DESTINATION;
  const sort = params.get("sort");
  const starRatings = listParam(params, "starRating")
    .map(Number)
    .filter((value) => Number.isInteger(value) && value >= 1 && value <= 5);
  const priceMin = Number(params.get("priceMin"));
  const priceMax = Number(params.get("priceMax"));
  const amenityIds = listParam(params, "amenityIds");

  return {
    destination,
    ...stay,
    guests: numberParam(params, "guests", 2),
    rooms: numberParam(params, "rooms", 1),
    page: numberParam(params, "page", 1),
    pageSize: numberParam(params, "pageSize", 10),
    sort:
      sort === "price-asc" || sort === "price-desc" || sort === "star-desc" || sort === "recommended"
        ? sort
        : "recommended",
    ...(Number.isFinite(priceMin) && priceMin > 0 ? { priceMin } : {}),
    ...(Number.isFinite(priceMax) && priceMax > 0 ? { priceMax } : {}),
    ...(starRatings.length > 0 ? { starRating: starRatings } : {}),
    ...(amenityIds.length > 0 ? { amenityIds } : {}),
    ...(params.get("freeCancellation") === "true" ? { freeCancellation: true } : {}),
  };
}

export function buildSearchHref(query: Partial<HotelSearchQuery> & { destination?: string }) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length > 0) params.set(key, value.join(","));
    } else {
      params.set(key, String(value));
    }
  }
  return `/search?${params.toString()}`;
}
