const vietnamDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function todayInVietnam() {
  return vietnamDate.format(new Date());
}

export function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function formatShortDate(date: string) {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`;
}

export type PeriodPreset = "7d" | "30d" | "90d" | "month";

export const periodPresetLabels: Record<PeriodPreset, string> = {
  "7d": "7 ngày",
  "30d": "30 ngày",
  "90d": "90 ngày",
  month: "Tháng này",
};

export function presetRange(preset: PeriodPreset, today = todayInVietnam()) {
  switch (preset) {
    case "7d":
      return { from: addDays(today, -6), to: today };
    case "30d":
      return { from: addDays(today, -29), to: today };
    case "90d":
      return { from: addDays(today, -89), to: today };
    case "month":
      return { from: `${today.slice(0, 7)}-01`, to: today };
  }
}
