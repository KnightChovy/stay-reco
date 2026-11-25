import type { Booking } from "@stayreco/shared";

/** Today as `YYYY-MM-DD` in Vietnam, the time zone every stay date is in. */
export function todayInVietnam() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

/** Whole days from `from` to `to`, both `YYYY-MM-DD`; negative when `to` is earlier. */
export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** "Còn 5 ngày", "Ngày mai", "Hôm nay" or null once the stay has started. */
export function checkInCountdown(checkIn: string, today = todayInVietnam()) {
  const days = daysBetween(today, checkIn);
  if (days < 0) return null;
  if (days === 0) return "Nhận phòng hôm nay";
  if (days === 1) return "Nhận phòng ngày mai";
  return `Còn ${days} ngày nữa là đến ngày nhận phòng`;
}

const icsText = (value: string) => value.replace(/[\\;,]/g, (match) => `\\${match}`).replace(/\n/g, "\\n");

/** An all-day calendar event from check-in to check-out, built in the browser and downloaded as a .ics file. */
export function downloadStayCalendar(booking: Booking) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//StayReco//Booking//VI",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${booking.id}@stayreco`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${booking.checkIn.replaceAll("-", "")}`,
    `DTEND;VALUE=DATE:${booking.checkOut.replaceAll("-", "")}`,
    `SUMMARY:${icsText(`Lưu trú tại ${booking.hotel.name}`)}`,
    `LOCATION:${icsText(`${booking.hotel.name}, ${booking.hotel.city}`)}`,
    `DESCRIPTION:${icsText(`Mã đặt phòng ${booking.code}. Mang theo mã QR check-in trong ứng dụng StayReco.`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `stayreco-${booking.code}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Google Maps search for the hotel; the booking carries its name and city, not coordinates. */
export function mapsSearchUrl(booking: Booking) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${booking.hotel.name}, ${booking.hotel.city}`)}`;
}
