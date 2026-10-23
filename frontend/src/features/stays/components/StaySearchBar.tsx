'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addDays, format, isSameDay, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { CalendarDays, MapPin, Search, Users } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  buildSearchHref,
  dateInput,
  defaultStay,
  nightsBetween,
} from '../lib/params';

type StaySearchParams = {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
};

type StaySearchBarProps = {
  initialDestination?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
  initialRooms?: number;
  onSearch?: (params: StaySearchParams) => void;
};

const inputClass =
  'w-full min-w-0 border-0 bg-transparent p-0 text-[13px] font-semibold text-gray-900 focus:outline-hidden focus:ring-0';

/** Compact stay search used on the landing page and the search results page (public customer area). */
export function StaySearchBar({
  initialDestination = 'Đà Nẵng',
  initialCheckIn,
  initialCheckOut,
  initialGuests,
  initialRooms,
  onSearch,
}: StaySearchBarProps) {
  const router = useRouter();
  const fallback = defaultStay(1, 2);
  const checkInStart = initialCheckIn ?? fallback.checkIn;
  const checkOutStart = initialCheckOut ?? fallback.checkOut;
  const [destination, setDestination] = useState(initialDestination);
  const [checkIn, setCheckIn] = useState(checkInStart);
  const [checkOut, setCheckOut] = useState(checkOutStart);
  const [guests, setGuests] = useState(initialGuests ?? fallback.guests);
  const [rooms, setRooms] = useState(initialRooms ?? fallback.rooms);
  const [range, setRange] = useState<DateRange | undefined>({
    from: parseISO(checkInStart),
    to: parseISO(checkOutStart),
  });

  const nights = nightsBetween(checkIn, checkOut);
  const disabled = nights <= 0 || !destination.trim();

  const handleRangeSelect = (next: DateRange | undefined) => {
    // A click after a complete range normally extends it; treat it as a new check-in instead.
    if (
      range?.from &&
      range.to &&
      next?.from &&
      next.to &&
      isSameDay(next.from, range.from) &&
      !isSameDay(next.to, range.to)
    ) {
      const start = next.to;
      setRange({ from: start });
      setCheckIn(format(start, 'yyyy-MM-dd'));
      setCheckOut(format(addDays(start, 1), 'yyyy-MM-dd'));
      return;
    }
    setRange(next);
    if (!next?.from) return;
    setCheckIn(format(next.from, 'yyyy-MM-dd'));
    setCheckOut(format(next.to ?? addDays(next.from, 1), 'yyyy-MM-dd'));
  };

  const dateLabel = range?.from
    ? range.to
      ? `${format(range.from, 'dd/MM')} – ${format(range.to, 'dd/MM/yyyy')}`
      : `${format(range.from, 'dd/MM/yyyy')} – chọn ngày trả`
    : 'Chọn ngày nhận – trả phòng';

  const handleSearch = () => {
    if (disabled) return;
    const params: StaySearchParams = {
      destination: destination.trim(),
      checkIn,
      checkOut,
      guests,
      rooms,
    };
    if (onSearch) {
      onSearch(params);
      return;
    }
    router.push(buildSearchHref(params));
  };

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-1.5 shadow-[0_8px_30px_rgba(20,45,66,0.08)]">
      <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.55fr)_minmax(0,0.95fr)_auto] lg:divide-x">
        <label className="group flex min-w-0 flex-col gap-1 rounded-xl px-3 py-2 transition-colors hover:bg-gray-50">
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            <MapPin className="size-3" /> Điểm đến
          </span>
          <input
            type="text"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            className={inputClass}
            placeholder="Thành phố, khách sạn…"
          />
        </label>

        <Popover>
          <PopoverTrigger className="group flex min-w-0 flex-col gap-1 rounded-xl px-3 py-2 text-left transition-colors hover:bg-gray-50 focus-visible:outline-hidden">
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              <CalendarDays className="size-3" /> Ngày nhận – trả phòng
            </span>
            <span className="flex min-w-0 items-center gap-1.5 text-[13px] font-semibold text-gray-900">
              <span className="truncate">{dateLabel}</span>
              {nights > 0 && (
                <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {nights} đêm
                </span>
              )}
            </span>
          </PopoverTrigger>
          <PopoverContent align="start" sideOffset={8} className="w-auto rounded-xl p-2">
            <Calendar
              mode="range"
              selected={range}
              onSelect={handleRangeSelect}
              locale={vi}
              numberOfMonths={1}
              disabled={{ before: parseISO(dateInput(0)) }}
              className="[--cell-size:--spacing(8)]"
            />
          </PopoverContent>
        </Popover>

        <div className="group flex min-w-0 flex-col gap-1 rounded-xl px-3 py-2 transition-colors hover:bg-gray-50">
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            <Users className="size-3" /> Khách &amp; phòng
          </span>
          <div className="flex min-w-0 items-center gap-1 text-[13px] font-semibold text-gray-900">
            <input
              type="number"
              min={1}
              max={20}
              value={guests}
              onChange={(event) => setGuests(Math.max(1, Number(event.target.value) || 1))}
              className="w-8 min-w-0 appearance-none border-0 bg-transparent p-0 text-center text-[13px] font-semibold focus:outline-hidden focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="Số khách"
            />
            <span className="whitespace-nowrap text-xs font-medium text-gray-500">khách</span>
            <span className="text-gray-300">·</span>
            <input
              type="number"
              min={1}
              max={10}
              value={rooms}
              onChange={(event) => setRooms(Math.max(1, Number(event.target.value) || 1))}
              className="w-7 min-w-0 appearance-none border-0 bg-transparent p-0 text-center text-[13px] font-semibold focus:outline-hidden focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="Số phòng"
            />
            <span className="whitespace-nowrap text-xs font-medium text-gray-500">phòng</span>
          </div>
        </div>

        <div className="flex min-w-0 items-center p-1 sm:col-span-2 lg:col-span-1">
          <Button
            type="button"
            onClick={handleSearch}
            disabled={disabled}
            className="h-full min-h-11 w-full gap-2 whitespace-nowrap rounded-xl bg-[#14344d] px-5 text-[13px] font-semibold text-white shadow-xs hover:bg-[#0f283b]"
          >
            <Search className="size-4 shrink-0" />
            <span>Tìm khách sạn</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
