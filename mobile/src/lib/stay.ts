import type { BookingStatus } from '@stayreco/shared';

/** Điểm đến, ngày và số khách đi kèm qua các màn tìm kiếm → khách sạn → đặt phòng (route params). */
export type Stay = { destination: string; checkIn: string; checkOut: string; guests: number; rooms: number };

export const DEFAULT_DESTINATION = 'Đà Nẵng';

export const formatVnd = (value: number) => `${Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ₫`;

/** `YYYY-MM-DD` theo giờ máy (không dùng toISOString vì có thể lệch ngày). */
export function dateInput(daysFromToday = 0) {
  return addDays(toDate(new Date()), daysFromToday);
}

function toDate(date: Date) {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;
}

export function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  return toDate(next);
}

export function nightsBetween(checkIn: string, checkOut: string) {
  return Math.round((new Date(`${checkOut}T00:00:00`).getTime() - new Date(`${checkIn}T00:00:00`).getTime()) / 86_400_000);
}

/** `YYYY-MM-DD` → "dd/MM/yyyy". */
export function formatDate(date: string) {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

export function defaultStay(): Stay {
  return { destination: DEFAULT_DESTINATION, checkIn: dateInput(1), checkOut: dateInput(3), guests: 2, rooms: 1 };
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Route params là chuỗi; giá trị thiếu hoặc sai thì lấy theo lưu trú mặc định. */
export function stayFromParams(params: Record<string, string | string[] | undefined>): Stay {
  const one = (key: string) => (Array.isArray(params[key]) ? params[key][0] : params[key]) as string | undefined;
  const fallback = defaultStay();
  const checkIn = one('checkIn');
  const checkOut = one('checkOut');
  const validDates = !!checkIn && !!checkOut && DATE.test(checkIn) && DATE.test(checkOut) && nightsBetween(checkIn, checkOut) > 0;
  const count = (key: string, def: number) => {
    const n = Number(one(key));
    return Number.isInteger(n) && n >= 1 ? n : def;
  };
  return {
    destination: one('destination')?.trim() || fallback.destination,
    checkIn: validDates ? checkIn : fallback.checkIn,
    checkOut: validDates ? checkOut : fallback.checkOut,
    guests: count('guests', fallback.guests),
    rooms: count('rooms', fallback.rooms),
  };
}

export const bookingStatusLabel: Record<BookingStatus, string> = {
  PENDING: 'Chờ thanh toán',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đang lưu trú',
  COMPLETED: 'Đã hoàn tất',
  CANCELLED: 'Đã hủy',
  NO_SHOW: 'Không đến',
  EXPIRED: 'Hết hạn giữ chỗ',
};
