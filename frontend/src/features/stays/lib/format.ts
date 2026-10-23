const moneyFormat = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export function formatMoney(amount: number | null | undefined) {
  return amount == null ? "—" : moneyFormat.format(amount);
}

/** `YYYY-MM-DD` → "dd/MM/yyyy" without a time-zone shift. */
export function formatDate(date: string | null | undefined) {
  if (!date) return "—";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

/** ISO instant → "dd/MM/yyyy HH:mm". */
export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const weekdayFormat = new Intl.DateTimeFormat("vi-VN", { weekday: "long" });

export function formatWeekday(date: string) {
  return weekdayFormat.format(new Date(`${date}T00:00:00`));
}
