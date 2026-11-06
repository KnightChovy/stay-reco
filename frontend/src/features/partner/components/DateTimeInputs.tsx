"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { vi } from "react-day-picker/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { todayInVietnam } from "../lib/dates";

/** "YYYY-MM-DD" → a local Date at midnight, so the calendar shows the same day whatever the viewer's time zone. */
function toDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toValue(date: Date) {
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Calendar date field shown as dd/mm/yyyy whatever the browser locale (a native date input follows the OS and may
 * show mm/dd/yyyy, where 04/11 and 11/04 are both valid). The value stays "YYYY-MM-DD" like the API.
 */
export function DateInput({
  value,
  onChange,
  min,
  max,
  clearable = false,
  placeholder = "dd/mm/yyyy",
  disabled,
  invalid,
  className,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  /** Adds a "Xoá ngày" action, for optional filters. */
  clearable?: boolean;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? toDate(value) : undefined;
  const bounds = [min && { before: toDate(min) }, max && { after: toDate(max) }].filter(
    (bound): bound is { before: Date } | { after: Date } => !!bound,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        className={cn(
          "flex h-8 w-full min-w-0 items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-left text-sm transition-colors outline-none hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive",
          className,
        )}
      >
        <span className={cn("flex-1 truncate tabular-nums", !value && "text-muted-foreground")}>
          {value ? `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}` : placeholder}
        </span>
        <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          locale={vi}
          selected={selected}
          defaultMonth={selected ?? (min ? toDate(min) : undefined)}
          disabled={bounds}
          onSelect={(date) => {
            if (!date) return;
            onChange(toValue(date));
            setOpen(false);
          }}
        />
        <div className="flex justify-between gap-2 border-t p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange(todayInVietnam());
              setOpen(false);
            }}
          >
            Hôm nay
          </Button>
          {clearable && value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Xoá ngày
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Every half hour of the day, 24-hour clock: "00:00", "00:30" … "23:30". */
const halfHours = Array.from({ length: 48 }, (_, index) => {
  const hour = String(Math.floor(index / 2)).padStart(2, "0");
  return `${hour}:${index % 2 ? "30" : "00"}`;
});

/**
 * Time of day as a 24-hour "HH:mm" picker (a native time input may show 02:00 PM, and "12:00 PM" is often read as
 * midnight). A stored value off the half-hour grid stays selectable.
 */
export function TimeSelect({
  value,
  onChange,
  disabled,
  emptyLabel,
  className,
  ...props
}: Omit<React.ComponentProps<typeof NativeSelect>, "value" | "onChange"> & {
  value: string;
  onChange: (event: { target: { value: string } }) => void;
  /** Label of the empty option; without it a time must be picked. */
  emptyLabel?: string;
}) {
  const options = value && !halfHours.includes(value) ? [...halfHours, value].sort() : halfHours;
  return (
    <NativeSelect value={value} onChange={onChange} disabled={disabled} className={cn("w-full", className)} {...props}>
      {(emptyLabel || !value) && <NativeSelectOption value="">{emptyLabel ?? "Chọn giờ"}</NativeSelectOption>}
      {options.map((time) => (
        <NativeSelectOption key={time} value={time}>
          {time}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
