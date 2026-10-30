/** Calendar dates ("YYYY-MM-DD") as the API uses them, with "today" taken in Asia/Ho_Chi_Minh (api-guide §3). */

const vietnamDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function todayInVietnam() {
  return vietnamDate.format(new Date());
}

/** Works on the date itself (UTC arithmetic), so daylight saving or the viewer's time zone cannot shift it. */
export function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

/** Every date from `from` to `to`, both inclusive. */
export function dateRange(from: string, to: string) {
  const dates: string[] = [];
  for (let date = from; date <= to; date = addDays(date, 1)) dates.push(date);
  return dates;
}

/** 0 = Sunday … 6 = Saturday, for a calendar date. */
export function weekdayOf(date: string) {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}
