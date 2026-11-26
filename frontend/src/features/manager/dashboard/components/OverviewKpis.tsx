import type { Metric, PlatformOverview } from "@stayreco/shared";
import { ManagerPanel, MetricDelta } from "../../components";
import { formatMoney } from "../../lib/labels";

const countFormat = new Intl.NumberFormat("vi-VN");

function formatCount(value: number | null) {
  return value == null ? "—" : countFormat.format(value);
}

function money(value: number | null) {
  return formatMoney(value);
}

export function OverviewKpis({ overview }: { overview: PlatformOverview }) {
  const cards: { label: string; metric: Metric; format: (value: number | null) => string; hint: string }[] = [
    { label: "GMV", metric: overview.gmv, format: money, hint: "Tổng tiền booking đã thanh toán trong kỳ" },
    { label: "Hoa hồng", metric: overview.commission, format: money, hint: "Thu khi khách trả phòng hoặc không đến" },
    { label: "Booking đã thanh toán", metric: overview.bookings, format: formatCount, hint: "Gồm cả booking huỷ sau đó" },
    {
      label: "Khách hàng mới",
      metric: overview.customers.new,
      format: formatCount,
      hint: `${formatCount(overview.customers.total)} khách hàng`,
    },
    {
      label: "Đối tác mới",
      metric: overview.partners.new,
      format: formatCount,
      hint: `${formatCount(overview.partners.active)} đối tác đang hoạt động`,
    },
    {
      label: "Khách sạn mới",
      metric: overview.hotels.new,
      format: formatCount,
      hint: `${formatCount(overview.hotels.active)} khách sạn đang bán`,
    },
  ];

  return (
    <section aria-labelledby="kpi-heading" className="space-y-3">
      <h2 id="kpi-heading" className="font-bold text-primary">
        Hiệu quả nền tảng
      </h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
        {cards.map((card) => (
          <ManagerPanel key={card.label} className="p-4">
            <p className="text-xs font-semibold text-muted-foreground">{card.label}</p>
            <strong
              title={card.format(card.metric.value)}
              className="mt-1 block truncate text-xl font-bold tabular-nums text-primary"
            >
              {card.format(card.metric.value)}
            </strong>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
              <MetricDelta value={card.metric.deltaPercent} />
              {card.metric.previous != null && <span>Kỳ trước {card.format(card.metric.previous)}</span>}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
          </ManagerPanel>
        ))}
      </div>
    </section>
  );
}
