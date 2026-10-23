"use client";

import type { ReactNode } from "react";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { usePartnerHotel } from "./PartnerHotelProvider";

export function PartnerTitle({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 border-b border-border/70 pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
          <PartnerHotelSwitcher />
          <span aria-hidden="true">/</span>
          <span className="text-primary">Partner Workspace</span>
        </div>
        <h1 className="max-w-4xl text-[clamp(1.6rem,2.3vw,2.15rem)] font-bold leading-[1.18] tracking-[-0.025em] text-primary">
          {title}
        </h1>
        <p className="mt-2.5 max-w-3xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </section>
  );
}

/** The hotel name, or a picker when the partner owns several hotels. */
function PartnerHotelSwitcher() {
  const { hotels, hotel, selectHotel } = usePartnerHotel();

  if (hotels.length < 2) {
    return <span>{hotel?.name ?? "StayReco"}</span>;
  }

  return (
    <NativeSelect
      size="sm"
      aria-label="Chọn khách sạn đang quản lý"
      value={hotel?.id}
      onChange={(event) => selectHotel(event.target.value)}
      className="max-w-56 text-xs"
    >
      {hotels.map((item) => (
        <NativeSelectOption key={item.id} value={item.id}>
          {item.name}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
