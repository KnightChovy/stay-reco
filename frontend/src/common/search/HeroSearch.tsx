'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type HeroSearchProps = {
  initialDestination?: string;
  initialDates?: string;
  initialGuests?: string;
  onSearch?: (params: { destination: string; dates: string; guests: string }) => void;
};

export default function HeroSearch({
  initialDestination = 'Hội An, Quảng Nam',
  initialDates = '20/10 - 22/10 (2 đêm)',
  initialGuests = '2 người lớn, 1 phòng',
  onSearch,
}: HeroSearchProps) {
  const router = useRouter();
  const [destination, setDestination] = useState(initialDestination);
  const [dates, setDates] = useState(initialDates);
  const [guests, setGuests] = useState(initialGuests);

  const handleSearch = () => {
    if (onSearch) {
      onSearch({ destination, dates, guests });
    } else {
      router.push(`/search?destination=${encodeURIComponent(destination)}`);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-md p-3 sm:p-4 mb-3">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Destination */}
        <div className="sm:col-span-4 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition border sm:border-0 border-gray-100">
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Điểm đến / Khách sạn
          </div>
          <div className="flex items-center text-sm font-bold text-gray-800 truncate">
            <svg className="w-4 h-4 text-gray-400 mr-1.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-gray-800 w-full truncate"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="sm:col-span-4 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition border sm:border-0 border-gray-100">
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Ngày nhận - Ngày trả phòng
          </div>
          <div className="flex items-center text-sm font-bold text-gray-800 truncate">
            <svg className="w-4 h-4 text-gray-400 mr-1.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <input
              type="text"
              value={dates}
              onChange={(e) => setDates(e.target.value)}
              className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-gray-800 w-full truncate"
            />
          </div>
        </div>

        {/* Guests */}
        <div className="sm:col-span-4 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition border sm:border-0 border-gray-100">
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Khách &amp; Phòng
          </div>
          <div className="flex items-center text-sm font-bold text-gray-800 truncate">
            <svg className="w-4 h-4 text-gray-400 mr-1.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <input
              type="text"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-gray-800 w-full truncate"
            />
          </div>
        </div>
      </div>

      {/* Search Bottom Row */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          <span>Không tính phí đặt phòng ẩn • Hỗ trợ 24/7</span>
        </div>
        <button
          type="button"
          onClick={handleSearch}
          className="w-full sm:w-auto px-6 py-2.5 bg-[#1b4360] hover:bg-[#133249] text-white font-medium text-sm rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
          </svg>
          <span>Tìm khách sạn</span>
        </button>
      </div>
    </div>
  );
}
