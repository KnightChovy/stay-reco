'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppBreadcrumb from '@/components/common/breadcrumb/AppBreadcrumb';
import HotelCard, { type HotelCardProps } from '@/components/common/card/HotelCard';
import Pagination from '@/components/common/pagination/Pagination';

export default function SearchPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState('relevant');

  const searchResults: HotelCardProps[] = [
    {
      id: 'son-tra-retreat',
      name: 'Son Tra Retreat & Ocean Boutique',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOxAhEl1N7IRCwNjZBHReL4ifAqDln8kKqKSQRmGuyBwWRhkMIE7GzcpsmZ3riFYZ8XuXwnuEt9yd_eDpWkmkmDXoUAKi59rzvNc07UNAQtksQDnWwZKtaF_sTYyUK_C51VKaz6BLR_v969_9nv3X8hIsurc_l-PlgdeBq2PwtJb7lW3yPmD_cceZnZq1LvaQK558LGSBh-cXWNeAljXBKZfJ1cBexil40kU6hVHgMXqrjG8gJWJgR',
      starBadge: 'Boutique 4 sao',
      verified: true,
      location: 'Bãi biển Mỹ Khê, Đà Nẵng',
      distanceInfo: 'Cách biển 80m',
      rating: 4.9,
      reviewCount: 184,
      vibeTag: 'Đúng gu: Không gian biển yên tĩnh',
      specialOfferTag: 'Bữa sáng đặc sản Quảng Nam',
      roomTypeName: 'Phòng Deluxe Hướng Biển (King bed, ban công riêng)',
      cancellationPolicy: 'Miễn phí hủy trước 18/10',
      originalPrice: '1.450.000 ₫ / đêm',
      price: '1.450.000 ₫',
      totalPrice: '2.900.000 ₫',
      priceNote: 'Đã gồm toàn bộ thuế & phí VAT',
      detailsHref: '/hotels/an-nhien-riverside',
      layout: 'horizontal',
    },
    {
      id: 'riverside-han-heritage',
      name: 'Riverside Han Heritage Hotel & Suites',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAcemNhDpfdDg56P-LQAbCv7XiIMdq0Fko0-ADCh1akmwhZVOUpHFIs2NjmkBX1VCe3w5K5ew9creKalcIXiT7f597mnHvIsfXJ3SIpu2sup3Pfp6pZDl0hWqRdeMpy33vDEYkVcPvUTJ-kXl4UMFVJppN061siBaQVaFaP4zEx7mYC-2Y2PJtgq8uVlyEZteoILkNe4NYAdOn6iiS23w8MRzSMowid0nlunu9h4bATXZSrrAJF-PcM',
      starBadge: 'Khách sạn 4 sao',
      serviceBadge: 'Phục vụ tận tâm',
      location: 'Đường Bạch Đằng, Hải Châu, Đà Nẵng',
      distanceInfo: 'Ngay trung tâm thành phố',
      rating: 4.8,
      reviewCount: 230,
      vibeTag: 'Gần khu phố ẩm thực đêm',
      specialOfferTag: 'Nội thất gỗ trầm ấm',
      roomTypeName: 'Phòng Suite Heritage Ban Công Sông Hàn',
      cancellationPolicy: 'Miễn phí hủy trong 24h',
      originalPrice: '1.250.000 ₫ / đêm',
      price: '1.250.000 ₫',
      totalPrice: '2.500.000 ₫',
      priceNote: 'Đã gồm thuế & phí (không phụ phí ẩn)',
      detailsHref: '/hotels/an-nhien-riverside',
      layout: 'horizontal',
    },
    {
      id: 'an-bang-non-nuoc',
      name: 'An Bang & Non Nuoc Sanctuary Haven',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2rPePlMjqNBfIzz_NLUPo-bJGD8aHA9o6FXdMzu_BR_Y2ukQz-A-i8wB7fbFhS8MRZ98KchDSp9L6H4nzc9xLwzdcBGOZ1oe6SpkF67MtmV8Tx5cze9Q9il3z7mUlwQ777UFmdpED3tfcvET-D26gFmc2yfupQZkEh14YlttQJ_bcB4x5oH4kR2JW9TaE9Ao4nn08DD_p25pxX4ZJFOQSMTUiUijPjv3Gp8O3yjA3JPgCkYngZDS6',
      starBadge: 'Resort 5 sao boutique',
      location: 'Đường Trường Sa, Ngũ Hành Sơn, Đà Nẵng',
      distanceInfo: 'Giáp biển Non Nước',
      rating: 4.95,
      reviewCount: 96,
      vibeTag: 'Hồ bơi riêng & Vườn nhiệt đới',
      specialOfferTag: 'Dịch vụ trà chiều tặng kèm',
      roomTypeName: 'Garden Villa 1 Phòng Ngủ',
      cancellationPolicy: 'Ưu đãi đặc quyền StayReco: Tặng voucher spa 250k',
      originalPrice: '2.150.000 ₫ / đêm',
      price: '2.150.000 ₫',
      totalPrice: '4.300.000 ₫',
      priceNote: 'Đã gồm thuế VAT & phí dịch vụ',
      detailsHref: '/hotels/an-nhien-riverside',
      layout: 'horizontal',
    },
    {
      id: 'craftsman-house',
      name: 'The Craftsman House Da Nang',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCH-BI4yFkhCyO8lkaISJEzNcWHSi1PIJqqiaMNoeLvGUXTEoqEwrvyilA-HWPKbNlexBuZ9IRssFcAVpVLn2E8UK99g6IwACqhu69hytkuH7a1J2xhowfqFm46rt5OVYBoXF7Z2Ou2Law3_-Hixv0XEOh9ViY14ImvNMBRX9wqyRuA2Lv6uM-CPUQ1EWAZuDkuswHh0SBLnc4gyHUSW48jITfFpT38uqoYLFezb3J5BWVSGkQNgPmf',
      starBadge: 'Chỗ nghỉ 3 sao ấm cúng',
      location: 'An Hải Bắc, Sơn Trà, Đà Nẵng',
      distanceInfo: 'Cách Cầu Rồng 600m',
      rating: 4.7,
      reviewCount: 142,
      vibeTag: 'Chủ nhà am hiểu văn hóa bản địa',
      specialOfferTag: 'Cà phê rang mộc thủ công miễn phí',
      roomTypeName: 'Phòng Studio Gác Lửng Tối Giản',
      cancellationPolicy: 'Miễn phí hủy trước 48 giờ',
      originalPrice: '780.000 ₫ / đêm',
      price: '780.000 ₫',
      totalPrice: '1.560.000 ₫',
      priceNote: 'Đã gồm thuế VAT & phí dịch vụ',
      detailsHref: '/hotels/an-nhien-riverside',
      layout: 'horizontal',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbfc] text-[#2D3748]">
      {/* Header */}
      <Header />

      {/* SEARCH BAR SECTION */}
      <section className="bg-white border-b border-gray-200 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-2.5">
            {/* Destination */}
            <div className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3.5 py-1.5 flex items-center gap-3 bg-white hover:border-gray-300 transition-colors">
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
              </svg>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wide text-gray-400">ĐIỂM ĐẾN</div>
                <div className="text-[13px] font-semibold text-gray-800">Đà Nẵng</div>
              </div>
            </div>

            {/* Dates */}
            <div className="flex-1 min-w-[220px] border border-gray-200 rounded-lg px-3.5 py-1.5 flex items-center gap-3 bg-white hover:border-gray-300 transition-colors">
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
              </svg>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wide text-gray-400">NGÀY LƯU TRÚ</div>
                <div className="text-[13px] font-semibold text-gray-800">20/10/2026 – 22/10/2026</div>
              </div>
            </div>

            {/* Guests & Rooms */}
            <div className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3.5 py-1.5 flex items-center gap-3 bg-white hover:border-gray-300 transition-colors">
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
              </svg>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wide text-gray-400">SỐ LƯỢNG KHÁCH</div>
                <div className="text-[13px] font-semibold text-gray-800">2 người lớn, 1 phòng</div>
              </div>
            </div>

            {/* Search Button */}
            <button className="bg-[#1b4360] hover:bg-[#163852] text-white px-6 py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors shrink-0 shadow-xs cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              <span>Tìm kiếm</span>
            </button>

            {/* AI Assistance Button */}
            <button className="bg-[#EBF2F7] hover:bg-[#dce7f0] text-[#1b4360] px-4 py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors shrink-0 cursor-pointer">
              <svg className="w-4 h-4 text-[#1b4360]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
              </svg>
              <span>Nhờ AI tinh chỉnh bộ lọc</span>
            </button>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs */}
        <AppBreadcrumb
          items={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Đà Nẵng', href: '/search?destination=DaNang' },
            { label: '48 chỗ nghỉ phù hợp' },
          ]}
          className="mb-2"
        />

        {/* Page Heading & Sort Control */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Chỗ nghỉ tại Đà Nẵng</h1>
            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Hiển thị <strong className="font-bold text-gray-700">48</strong> chỗ nghỉ được xác minh thực địa</span>
              <span>•</span>
              <span>20/10 - 22/10/2026 (2 đêm, 2 khách)</span>
            </div>
          </div>

          {/* Sort Selection */}
          <div className="flex items-center space-x-2.5">
            <label htmlFor="sort" className="text-xs text-gray-500 whitespace-nowrap">Sắp xếp theo:</label>
            <div className="relative">
              <select
                id="sort"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-800 py-2 pl-3 pr-9 focus:outline-hidden focus:ring-1 focus:ring-[#1b4360] focus:border-[#1b4360] shadow-xs cursor-pointer"
              >
                <option value="relevant">Phù hợp nhất cho bạn (Đề xuất)</option>
                <option value="price-asc">Giá: Thấp đến Cao</option>
                <option value="price-desc">Giá: Cao đến Thấp</option>
                <option value="rating">Đánh giá cao nhất</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Active Filter Tags */}
        <div className="flex flex-wrap items-center gap-2 py-2 mb-6">
          <span className="text-xs text-gray-500 font-normal mr-1">Bộ lọc đang chọn:</span>
          <button className="inline-flex items-center text-xs bg-[#EAF2F7] text-[#1b4360] font-medium px-2.5 py-1 rounded hover:bg-opacity-80 transition-colors">
            Đà Nẵng
            <span className="ml-1.5 font-bold text-xs">×</span>
          </button>
          <button className="inline-flex items-center text-xs bg-[#EAF2F7] text-[#1b4360] font-medium px-2.5 py-1 rounded hover:bg-opacity-80 transition-colors">
            Gần biển Mỹ Khê
            <span className="ml-1.5 font-bold text-xs">×</span>
          </button>
          <button className="inline-flex items-center text-xs bg-[#EAF2F7] text-[#1b4360] font-medium px-2.5 py-1 rounded hover:bg-opacity-80 transition-colors">
            Miễn phí hủy
            <span className="ml-1.5 font-bold text-xs">×</span>
          </button>
          <button className="inline-flex items-center text-xs bg-[#EAF2F7] text-[#1b4360] font-medium px-2.5 py-1 rounded hover:bg-opacity-80 transition-colors">
            Có bữa sáng
            <span className="ml-1.5 font-bold text-xs">×</span>
          </button>
          <button className="text-xs text-[#df7a42] hover:underline font-semibold ml-2">
            Xóa tất cả bộ lọc
          </button>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* FILTER SIDEBAR */}
          <aside className="lg:col-span-3 bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2 font-bold text-base text-gray-900">
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
                </svg>
                <span>Bộ lọc tìm kiếm</span>
              </div>
              <button className="text-xs font-semibold text-[#df7a42] hover:underline">Đặt lại</button>
            </div>

            {/* Filter 1: Price Range */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Khoảng giá (mỗi đêm)</h3>
                <span className="text-[11px] text-gray-400 font-semibold">VND</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="border border-gray-200 rounded p-2 bg-gray-50">
                  <span className="text-[10px] text-gray-400 uppercase font-medium block">Từ</span>
                  <span className="text-xs font-bold text-gray-800">500.000 ₫</span>
                </div>
                <div className="border border-gray-200 rounded p-2 bg-gray-50">
                  <span className="text-[10px] text-gray-400 uppercase font-medium block">Đến</span>
                  <span className="text-xs font-bold text-gray-800">3.500.000 ₫</span>
                </div>
              </div>
              <div className="relative pt-2 pb-2">
                <div className="h-1 bg-gray-200 rounded-full">
                  <div className="h-1 bg-[#1b4360] rounded-full w-2/3 ml-3" />
                </div>
                <div className="absolute left-1/2 top-1.5 -translate-x-1/2 w-4 h-4 bg-[#1b4360] border-2 border-white rounded-full shadow-xs cursor-pointer" />
              </div>
              <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer mt-2">
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-[#1b4360] focus:ring-[#1b4360] h-3.5 w-3.5" />
                <span className="text-gray-600">Giá đã bao gồm thuế &amp; phí</span>
              </label>
            </div>

            {/* Filter 2: Stars */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3">Hạng lưu trú &amp; sao</h3>
              <div className="space-y-2.5">
                {[
                  { label: '5 sao cao cấp', count: 12, checked: true },
                  { label: '4 sao tiêu chuẩn', count: 24, checked: true },
                  { label: '3 sao ấm cúng', count: 9, checked: false },
                  { label: 'Boutique độc lập', count: 18, checked: true },
                ].map((item, idx) => (
                  <label key={idx} className="flex items-center justify-between text-xs cursor-pointer group">
                    <span className="flex items-center space-x-2 text-gray-700 group-hover:text-[#1b4360]">
                      <input type="checkbox" defaultChecked={item.checked} className="rounded border-gray-300 text-[#1b4360] focus:ring-[#1b4360] h-3.5 w-3.5" />
                      <span>{item.label}</span>
                    </span>
                    <span className="text-gray-400 text-[11px]">({item.count})</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter 3: Review Ratings */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3">Điểm đánh giá thực</h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Xuất sắc 4.8+', count: 19, checked: true },
                  { label: 'Rất tốt 4.5+', count: 38, checked: false },
                  { label: 'Tốt 4.0+', count: 48, checked: false },
                ].map((item, idx) => (
                  <label key={idx} className="flex items-center justify-between text-xs cursor-pointer group">
                    <span className="flex items-center space-x-2 text-gray-700 group-hover:text-[#1b4360]">
                      <input type="checkbox" defaultChecked={item.checked} className="rounded border-gray-300 text-[#1b4360] focus:ring-[#1b4360] h-3.5 w-3.5" />
                      <span>{item.label}</span>
                    </span>
                    <span className="text-gray-400 text-[11px]">({item.count})</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter 4: Amenities */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3">Tiện nghi ưa chuộng</h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Hồ bơi vô cực', count: 21, checked: true },
                  { label: 'Giáp biển / View biển', count: 16, checked: true },
                  { label: 'Spa & Chăm sóc trị liệu', count: 14, checked: false },
                  { label: 'Bữa sáng miễn phí', count: 32, checked: true },
                  { label: 'Xe đưa đón sân bay', count: 27, checked: false },
                ].map((item, idx) => (
                  <label key={idx} className="flex items-center justify-between text-xs cursor-pointer group">
                    <span className="flex items-center space-x-2 text-gray-700 group-hover:text-[#1b4360]">
                      <input type="checkbox" defaultChecked={item.checked} className="rounded border-gray-300 text-[#1b4360] focus:ring-[#1b4360] h-3.5 w-3.5" />
                      <span>{item.label}</span>
                    </span>
                    <span className="text-gray-400 text-[11px]">({item.count})</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter 5: Flexible Policies */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3">Chính sách linh hoạt</h3>
              <div className="space-y-2.5">
                {['Miễn phí hủy phòng', 'Giữ phòng không cần cọc', 'Hoàn tiền linh hoạt'].map((policy, idx) => (
                  <label key={idx} className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer">
                    <input type="checkbox" defaultChecked={idx === 0} className="rounded border-gray-300 text-[#1b4360] focus:ring-[#1b4360] h-3.5 w-3.5" />
                    <span>{policy}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter 6: StayReco Vibe */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-1.5 mb-3">
                <svg className="w-3.5 h-3.5 text-[#df7a42]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Gu nghỉ dưỡng StayReco</h3>
              </div>
              <div className="space-y-2.5">
                {['Yên tĩnh, thư giãn', 'Phong cách Indochine', 'Gần ẩm thực bản địa'].map((vibe, idx) => (
                  <label key={idx} className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer">
                    <input type="checkbox" defaultChecked={idx === 0} className="rounded border-gray-300 text-[#1b4360] focus:ring-[#1b4360] h-3.5 w-3.5" />
                    <span>{vibe}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* HOTEL LISTING SECTION */}
          <section className="lg:col-span-9 space-y-4">
            {searchResults.map((hotel) => (
              <HotelCard key={hotel.id} {...hotel} />
            ))}

            {/* Pagination Controls */}
            <div className="pt-6 pb-2">
              <Pagination
                currentPage={currentPage}
                totalPages={4}
                onPageChange={setCurrentPage}
              />
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
