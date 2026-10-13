'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppBreadcrumb from '@/components/common/breadcrumb/AppBreadcrumb';

export default function HotelDetailPage() {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfaf8] text-slate-800 antialiased">
      {/* Common Header */}
      <Header />

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 grow w-full">
        {/* BREADCRUMB AND ACTIONS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 mb-4">
          <AppBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Đà Nẵng', href: '/search?destination=DaNang' },
              { label: 'Khách sạn ven sông Hàn', href: '/search' },
              { label: 'An Nhiên Riverside Hotel' },
            ]}
          />
          <div className="flex items-center space-x-3 shrink-0">
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              Chia sẻ
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer">
              <svg className="w-3.5 h-3.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              Lưu yêu thích
            </button>
          </div>
        </div>

        {/* HOTEL TITLE HEADER */}
        <div className="mb-5">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">An Nhiên Riverside Hotel</h1>
            <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
              <span>★★★★</span>
              <span className="text-slate-500 text-[11px] font-normal">4 sao boutique</span>
            </div>
            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-medium">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Đã xác minh thực địa bởi StayReco
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 text-xs sm:text-sm text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="bg-[#10395c] text-white px-1.5 py-0.5 rounded font-bold text-xs">4.6 / 5</span>
              <span className="font-semibold text-slate-800">Xuất sắc</span>
              <span className="text-slate-400">(128 đánh giá thực từ du khách đã lưu trú)</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1 text-slate-600">
              <svg className="w-3.5 h-3.5 text-rose-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span>158 Bạch Đằng, Quận Hải Châu, Đà Nẵng (Cách Cầu Rồng 350m, Tầm nhìn trực diện Sông Hàn)</span>
              <a href="#location" className="text-[#10395c] font-semibold underline ml-1 hover:text-[#0c2a45]">Xem trên bản đồ</a>
            </div>
          </div>
        </div>

        {/* PHOTO GALLERY GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-2xl overflow-hidden mb-6 h-95 md:h-105">
          {/* Big featured photo */}
          <div className="relative md:col-span-2 h-full group cursor-pointer overflow-hidden">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAA2nmhkyYRt95oJqiIhWxRNys37HVJaFQ9os4CoJuKMPwKrTtxQNx6c24RfNy6SkvLu0FEInftwfDcUYRAtVw9VRz_rfU9lc2exkLmrDg2ksL7n4GAoZ7mWFj6cVXyN17N_NelpuVWmoTCSRfrtjJopqD8zWV_jnezbjHoA9BL9_9El9m0QDo51ljCmd3QugXjwT9LySbr0cLMc5M0Dwwt95EuVItHSa5-yBdtv0iCxgWkVcAfzUR"
              alt="Phòng Suite Ngắm Sông Hàn"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <span className="absolute bottom-3 left-3 text-white text-xs font-medium bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded">
              Phòng Suite Ngắm Sông Hàn
            </span>
          </div>

          {/* Column 2 */}
          <div className="grid grid-rows-2 gap-2 h-full">
            <div className="relative group cursor-pointer overflow-hidden">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUp57AXk0xu0mLpk7YoQik--fTsNm1CQp0CCI-WCLzvuW62xkboMNQWkWpgDNFqooapYpvNHsOSO6lq8ePU11QO8T_2xxrQ1g5StRLdSiS2z6DyCDKso4XVj59--7fzxLNKN9_XpEYoH50v3ieb-jgBWJ3zCAU7RcSMomqk-ypjnJ0Sg1Pj2Pwj99jV8MFwO3Orhbxdf-kS1yYhlqnuH6Id6maMd_v3IdckZe5OP-OR93R7icAkRLQ"
                alt="Hồ bơi vô cực ngắm sông"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <span className="absolute bottom-2 left-2 text-white text-[11px] font-medium">Hồ bơi vô cực ngắm sông</span>
            </div>
            <div className="relative group cursor-pointer overflow-hidden">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_s6t93z26e4U1wDGsJZ1UfVOkojNCM18xksuvSKGgyEz-lP8j1l0fabjGmZAt62PKD9Wn_kDBRONuZ5MiiBa8_obzu-bFoTWppjRy5y1nU_hLr8NhRrhZM00Zwo5zpbUxl97zYKe1p6q8v6iEDmHaVIjiWT-M12uOp3-HkfgxZiYwbNiN9zpWpwGUCAr3J1n8G3jXuxUHkYq9sYJeQf_wlpkz95hCl0ggpuJhK0TotnWgE_x6ynfI"
                alt="Ban công lộng gió"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <span className="absolute bottom-2 left-2 text-white text-[11px] font-medium">Ban công lộng gió</span>
            </div>
          </div>

          {/* Column 3 */}
          <div className="grid grid-rows-2 gap-2 h-full">
            <div className="relative group cursor-pointer overflow-hidden">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBbZOxVALXWwEIHMkKzsHAN-Ik7BrlfoPEy7lSKzN6_M6MygR3OA9UjlPAAxzAuUI5llwOB8wUZn_R2VOH_kcGRPa-ZaWsXlNpV-fKopjCidP4sZZ9pWOjCkfZWm30SK76yhfpJxc0BGAHKC03h9rACaru3Tc_vQDUPS6_BkFJF7s8NuxcSmPhho41wl-H9DtALkHrQ40LEX9AQHcGa4xmS8dOg2yEQdKN2VL47ZJEjCzBOwGXytdX8"
                alt="Bữa sáng đặc sản Quảng Nam"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <span className="absolute bottom-2 left-2 text-white text-[11px] font-medium">Bữa sáng đặc sản Quảng Nam</span>
            </div>
            <div className="relative group cursor-pointer overflow-hidden">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxK6tpBTov_4zaeLaLhmBM-BsIU62cQmVu8Ls9VYt8HogD7AdtY_pN3NEG9duk7FE1KkYHTFFhHqsn_lULGCRSC8n-rHaaiUaGHUqcFw5zWis7tu-DE_ROOOsxVV6FIfmgaP8utlSaP1f2ia6-x5sBYvJD5RvxdeX7164uRACk3CmrB0mcBQccH8WKPSPwiF6vmtVmlo6VAOH9xHE1mElzJuhiOlvKCsg9PrrVxl4XvTcNaV78bbHo"
                alt="Xem toàn bộ ảnh"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center hover:bg-black/50 transition-colors">
                <button className="bg-white/95 text-slate-800 text-xs font-semibold px-3 py-2 rounded-lg shadow-xs flex items-center gap-1.5 hover:bg-white transition-colors cursor-pointer">
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                  Xem toàn bộ 32 ảnh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* STICKY IN-PAGE NAV */}
        <div className="sticky top-16 z-30 mb-8 flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-2.5 shadow-xs lg:top-20">
          <div className="flex items-center space-x-6 text-xs sm:text-sm font-medium overflow-x-auto whitespace-nowrap text-slate-600 py-1">
            <a href="#overview" className="text-[#10395c] font-bold border-b-2 border-[#10395c] pb-1">Tổng quan</a>
            <a href="#rooms" className="hover:text-[#10395c] pb-1">Các hạng phòng trống</a>
            <a href="#gu-match" className="hover:text-[#10395c] pb-1">Vì sao hợp gu bạn</a>
            <a href="#amenities" className="hover:text-[#10395c] pb-1">Tiện ích nổi bật</a>
            <a href="#reviews" className="hover:text-[#10395c] pb-1">Đánh giá thực tế (128)</a>
            <a href="#policies" className="hover:text-[#10395c] pb-1">Chính sách</a>
          </div>

          <div className="hidden lg:flex items-center space-x-3 shrink-0 pl-4 border-l border-slate-200">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Chỉ từ</div>
              <div className="text-base font-bold text-[#10395c] leading-none">1.250.000 đ <span className="text-xs font-normal text-slate-500">/ đêm</span></div>
            </div>
            <a href="#rooms" className="bg-[#10395c] hover:bg-[#0c2a45] text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors">
              Chọn phòng trống
            </a>
          </div>
        </div>

        {/* TWO COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT CONTENT COLUMN (8 COLS) */}
          <div className="lg:col-span-8 space-y-10">
            {/* PERSONALIZED MATCH SECTION */}
            <section id="gu-match" className="bg-sky-50/60 border border-sky-100 rounded-2xl p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[#10395c] font-bold text-lg">💡RK</span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Vì sao khách sạn này phù hợp với chuyến đi của bạn</h2>
              </div>
              <p className="text-xs text-slate-500 mb-4">Gợi ý tự động dựa trên tìm kiếm của bạn cho lịch trình <strong className="text-slate-700">20/10 – 22/10/2026 (2 khách)</strong>, tôn trọng tối đa quyền riêng tư.</p>

              <div className="space-y-3">
                <div className="bg-white border border-sky-100 rounded-xl p-3.5 flex items-start gap-3 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 text-[#10395c] flex items-center justify-center font-bold text-xs shrink-0">
                    A
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-slate-800">Đúng phong cách bạn thích</div>
                    <div className="text-slate-600 mt-0.5 leading-relaxed">Kiến trúc giao thoa đương đại &amp; Indochine mộc mạc, không gian tĩnh lặng ven sông giúp bạn thư thái sau ngày dài di chuyển.</div>
                  </div>
                </div>

                <div className="bg-white border border-sky-100 rounded-xl p-3.5 flex items-start gap-3 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-slate-800">Tiện lợi di chuyển</div>
                    <div className="text-slate-600 mt-0.5 leading-relaxed">Đi bộ chỉ 5 phút đến Cầu Rồng và phố ẩm thực đêm Bạch Đằng nhộn nhịp, thuận tiện đón hoàng hôn và dạo phố mát ven sông Hàn.</div>
                  </div>
                </div>

                <div className="bg-white border border-sky-100 rounded-xl p-3.5 flex items-start gap-3 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center text-xs shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-slate-800">Đánh giá cao từ các cặp đôi</div>
                    <div className="text-slate-600 mt-0.5 leading-relaxed">94% khách đi đôi đánh giá phòng Deluxe Ban công sông Hàn &quot;rất lãng mạn, sạch sẽ và tầm nhìn đêm lung linh&quot;.</div>
                  </div>
                </div>
              </div>
            </section>

            {/* OVERVIEW SECTION */}
            <section id="overview" className="border-b border-stone-200 pb-8">
              <h2 className="text-lg font-bold text-slate-900 mb-3">Tổng quan chỗ nghỉ</h2>
              <div className="text-xs sm:text-sm text-slate-600 space-y-3 leading-relaxed">
                <p>
                  Tọa lạc tại vị trí thanh bình trên cung đường Bạch Đằng huyền thoại, <strong className="text-slate-800 font-semibold">An Nhiên Riverside Hotel</strong> mang đến trải nghiệm nghỉ dưỡng boutique đậm chất bản địa Đà Thành. Từng góc nhỏ trong khách sạn được thổi hồn bởi nét mộc mạc của gạch gốm nung, gỗ sồi tự nhiên và nhịp chảy hiền hòa của sông Hàn.
                </p>
                <p>
                  Tại đây, du khách bắt đầu ngày mới bằng ly cà phê thủ công ngát hương bên hiên ngắm dòng nước lặng lờ trôi, thưởng thức tô mì Quảng nóng hổi chuẩn vị gia truyền, và khép lại ngày dài trong không gian phòng êm ái, cách âm hoàn hảo cùng giường đệm cao cấp. Đội ngũ nhân sự người Đà Nẵng thân thiện luôn sẵn lòng hỗ trợ chỉ dẫn những quán ăn ngon chuẩn gu địa phương mà ít nơi nào chia sẻ.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-4">
                {[
                  'Wi-Fi tốc độ cao',
                  'Hồ bơi vô cực ngắm sông',
                  'Bữa sáng đặc sản Đà Nẵng – Quảng Nam',
                  'Lễ tân 24/7',
                  'Đưa đón sân bay',
                ].map((item, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                    {item}
                  </span>
                ))}
              </div>
            </section>

            {/* ROOM LIST SECTION */}
            <section id="rooms" className="border-b border-stone-200 pb-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Các hạng phòng trống</h2>
                  <p className="text-xs text-slate-500">Lịch trình: 20/10/2026 – 22/10/2026 (2 đêm, 2 khách)</p>
                </div>
                <span className="text-xs font-medium text-emerald-700 self-start sm:self-auto">Cam kết giá minh bạch - Không phí ẩn</span>
              </div>

              <div className="space-y-4">
                {/* Room 1: Deluxe River View */}
                <div className="border-2 border-sky-200 bg-white rounded-2xl p-4 shadow-xs relative">
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="inline-flex items-center gap-1 text-[#10395c] font-semibold bg-sky-50 px-2.5 py-1 rounded">
                      👍 Lựa chọn được yêu thích nhất bởi cặp đôi
                    </span>
                    <span className="text-amber-600 font-medium">Còn lại 3 phòng</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-4 relative rounded-xl overflow-hidden h-44 bg-slate-100">
                      <img
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBY4VMdg8CDJKQJPgTAB-5x_lIHsC6AXfQNNybIpnw97w4BsRA-4LKPVwGWzFhmCLhfWt1ZPNNhF5DAZykiSFxClg4C9zxXuS1lgjoVeA0aEDhl1zL5-AhkhGQPr9saqQTUj4FE0rdGh_IPRFY9Rm66H4MMwXMPpA-v69FR8weSUpC-_-9mtxHIWLG-AHuwN7sMJcqny4OaCFKY0yO6cZ82wp-kME1IOyekXSxPiYBYO1TuxCLoLkCa"
                        alt="Phòng Deluxe Hướng Sông Hàn"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-xs">36 m²</span>
                      <div className="absolute bottom-2 inset-x-2 flex items-center justify-between bg-black/40 backdrop-blur-xs text-white text-[10px] px-2 py-1 rounded">
                        <span>1 Giường King</span>
                        <span>2 Người lớn</span>
                        <span>Ban công riêng</span>
                      </div>
                    </div>

                    <div className="md:col-span-5 text-xs space-y-2">
                      <Link href="/hotels/an-nhien-riverside/rooms/deluxe-river-view">
                        <h3 className="text-base font-bold text-slate-900 hover:text-[#10395c] transition-colors cursor-pointer">
                          Phòng Deluxe Hướng Sông Hàn (Ban công riêng)
                        </h3>
                      </Link>
                      <ul className="space-y-1 text-slate-600">
                        <li className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>Ban công ngắm trọn vẹn nhịp sống sông Hàn</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>Bồn tắm nằm cao cấp &amp; vòi sen trần</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>Máy pha cà phê espresso tại phòng</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>Smart TV 55&quot; tích hợp Netflix</span>
                        </li>
                      </ul>
                      <div className="pt-2 text-[11px] text-slate-500 space-y-0.5 border-t border-slate-100">
                        <div className="flex items-center gap-1 text-slate-700 font-medium">
                          <span>🍴</span> Bao gồm bữa sáng tự chọn đặc sản
                        </div>
                        <div className="text-emerald-700">✓ Miễn phí hủy phòng trước 18/10/2026</div>
                        <div className="text-slate-500">💳 Không cần thanh toán trước - Trả tại khách sạn</div>
                      </div>
                    </div>

                    <div className="md:col-span-3 flex flex-col justify-between items-end border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400">Giá cho 1 đêm:</span>
                        <div className="text-lg font-bold text-[#10395c]">1.250.000 đ</div>
                        <div className="text-xs font-semibold text-slate-700 mt-1">Tổng 2 đêm:</div>
                        <div className="text-sm font-bold text-slate-900">2.500.000 đ</div>
                        <span className="text-[10px] text-slate-400 block">Đã bao gồm toàn bộ thuế &amp; phí VAT</span>
                      </div>
                      <Link
                        href="/hotels/an-nhien-riverside/rooms/deluxe-river-view"
                        className="w-full mt-3 bg-[#10395c] hover:bg-[#0c2a45] text-white font-semibold text-xs py-2 rounded-lg transition-colors text-center shadow-xs block"
                      >
                        Đặt phòng này
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Room 2: Family Suite */}
                <div className="border border-stone-200 bg-white rounded-2xl p-4 shadow-xs relative">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-4 relative rounded-xl overflow-hidden h-44 bg-slate-100">
                      <img
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCh0fLJEx4kQz6R9PiIBQVkJ7AAPVzCIVoZ4jNAM0-9Gxwc2o-VXalwG2RoGV9UyGGJpJ8wKLH6fJl4ZH5Yc5ozqyA4_ZX4QgYbHbeotb8GfFKhr-1AZ9ggTksEhEm0_nnECKTG0KhhZ56PEvph62tGuqmivrERYr86tb4d8uqtKOclgX5lD5JLUPGi_DlgiVxvm-9G3nLK6rlh5Ky8K7NUILj3FqRmPGl63A3IMLRVD_3GVFxigKaz"
                        alt="Phòng Suite Gia đình Panorama"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">48 m²</span>
                      <div className="absolute bottom-2 inset-x-2 flex items-center justify-between bg-black/40 backdrop-blur-xs text-white text-[10px] px-2 py-1 rounded">
                        <span>1 King + 1 Đơn</span>
                        <span>3 Người lớn</span>
                        <span>View toàn cảnh</span>
                      </div>
                    </div>

                    <div className="md:col-span-5 text-xs space-y-2">
                      <h3 className="text-base font-bold text-slate-900">Phòng Suite Gia đình Panorama</h3>
                      <ul className="space-y-1 text-slate-600">
                        <li className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>Phòng khách riêng biệt &amp; sofa thư giãn</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>Bếp mini trang bị lò vi sóng &amp; tủ lạnh lớn</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>Tầm nhìn góc rộng ngắm trọn pháo hoa sông Hàn</span>
                        </li>
                      </ul>
                      <div className="pt-2 text-[11px] text-slate-500 space-y-0.5 border-t border-slate-100">
                        <div className="flex items-center gap-1 text-slate-700 font-medium">
                          <span>🍴</span> Bao gồm bữa sáng gia đình
                        </div>
                        <div className="text-slate-500">Hủy linh hoạt trong vòng 24h</div>
                      </div>
                    </div>

                    <div className="md:col-span-3 flex flex-col justify-between items-end border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400">Giá cho 1 đêm:</span>
                        <div className="text-lg font-bold text-[#10395c]">1.850.000 đ</div>
                        <div className="text-xs font-semibold text-slate-700 mt-1">Tổng 2 đêm:</div>
                        <div className="text-sm font-bold text-slate-900">3.700.000 đ</div>
                        <span className="text-[10px] text-slate-400 block">Đã gồm thuế phí</span>
                      </div>
                      <Link
                        href="/checkout"
                        className="w-full mt-3 bg-[#10395c] hover:bg-[#0c2a45] text-white font-semibold text-xs py-2 rounded-lg transition-colors text-center shadow-xs block"
                      >
                        Đặt phòng này
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Room 3: Standard Studio Loft */}
                <div className="border border-stone-200 bg-white rounded-2xl p-4 shadow-xs relative">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-4 relative rounded-xl overflow-hidden h-44 bg-slate-100">
                      <img
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAsZrD-nCeWA8jY7j42IDT4FfSycrzOHl_AUJzok7U0XvubWwg9QGt8lEJH9tKi_8DkTJe7LPSBY5OZEsbmJmgAPDlFh0I9Ekqf5NS_1MKa7jUIM4K095jSyE6WB0RLJMFDIvfWNDhSX5zMaFMJanNMlXT8RReUfb-INc-KKh14CpCv0B_wDkfCmDPYeLrtCmSHbnpHmkK0nkGYjsf--H7kiqEcUKfwnwwrGJc02vE6ke3-iQTICFLW"
                        alt="Phòng Studio Tiêu Chuẩn Gác Lửng"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">28 m²</span>
                      <div className="absolute bottom-2 inset-x-2 flex items-center justify-between bg-black/40 backdrop-blur-xs text-white text-[10px] px-2 py-1 rounded">
                        <span>1 Giường Queen</span>
                        <span>2 Người lớn</span>
                        <span>Gác lửng</span>
                      </div>
                    </div>

                    <div className="md:col-span-5 text-xs space-y-2">
                      <h3 className="text-base font-bold text-slate-900">Phòng Studio Tiêu Chuẩn Gác Lửng</h3>
                      <ul className="space-y-1 text-slate-600">
                        <li className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>Thiết kế tối giản bằng gỗ sồi tự nhiên</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>Không gian yên tĩnh tuyệt đối, cách âm kép</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>Bàn làm việc tiện nghi &amp; cổng sạc Type-C tốc độ cao</span>
                        </li>
                      </ul>
                      <div className="pt-2 text-[11px] text-slate-500 space-y-0.5 border-t border-slate-100">
                        <div className="flex items-center gap-1 text-slate-700 font-medium">
                          <span>🍴</span> Bao gồm bữa sáng món nóng Đà Nẵng
                        </div>
                        <div className="text-emerald-700">✓ Hủy miễn phí trước 24 giờ</div>
                      </div>
                    </div>

                    <div className="md:col-span-3 flex flex-col justify-between items-end border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400">Giá cho 1 đêm:</span>
                        <div className="text-lg font-bold text-[#10395c]">950.000 đ</div>
                        <div className="text-xs font-semibold text-slate-700 mt-1">Tổng 2 đêm:</div>
                        <div className="text-sm font-bold text-slate-900">1.900.000 đ</div>
                        <span className="text-[10px] text-slate-400 block">Đã gồm thuế phí</span>
                      </div>
                      <Link
                        href="/checkout"
                        className="w-full mt-3 bg-[#10395c] hover:bg-[#0c2a45] text-white font-semibold text-xs py-2 rounded-lg transition-colors text-center shadow-xs block"
                      >
                        Đặt phòng này
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* AMENITIES DETAIL SECTION */}
            <section id="amenities" className="border-b border-stone-200 pb-10">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Tiện ích &amp; Dịch vụ nổi bật</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <span className="text-base">🍴</span>
                    <h3>Ẩm thực &amp; Đồ uống</h3>
                  </div>
                  <ul className="space-y-1.5 text-slate-600 leading-relaxed pl-6">
                    <li><strong className="text-slate-800 font-medium">Nhà hàng Riverside Terrace:</strong> Phục vụ đặc sản Quảng Nam &amp; hải sản tươi trong ngày.</li>
                    <li><strong className="text-slate-800 font-medium">Quán Cà Phê Mộc:</strong> Không gian tầng trệt với cà phê hạt Arabica Khe Sanh rang mộc.</li>
                    <li>Phục vụ bữa sáng tận phòng theo yêu cầu (không phụ thu).</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <span className="text-base">🌿</span>
                    <h3>Thư giãn &amp; Sức khỏe</h3>
                  </div>
                  <ul className="space-y-1.5 text-slate-600 leading-relaxed pl-6">
                    <li><strong className="text-slate-800 font-medium">Hồ bơi tầng thượng:</strong> Nước khoáng mặn ngắm trực diện Cầu Rồng và Cầu Sông Hàn.</li>
                    <li><strong className="text-slate-800 font-medium">Dịch vụ ngâm chân thảo mộc:</strong> Thảo dược Cù Lao Chàm giúp thư giãn gân cốt.</li>
                    <li>Khu vực yoga &amp; thiền đón bình minh trên mái.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <span className="text-base">🛡️</span>
                    <h3>Dịch vụ phòng &amp; An ninh</h3>
                  </div>
                  <ul className="space-y-1.5 text-slate-600 leading-relaxed pl-6">
                    <li>Dọn phòng hàng ngày chu đáo với xông tinh dầu sả chanh tự nhiên.</li>
                    <li>Khóa từ thông minh &amp; camera an ninh khu vực chung 24/7.</li>
                    <li>Két sắt an toàn kích thước lớn (đựng vừa laptop 16 inch).</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <span className="text-base">🧭</span>
                    <h3>Trợ giúp du khách</h3>
                  </div>
                  <ul className="space-y-1.5 text-slate-600 leading-relaxed pl-6">
                    <li>Cho thuê xe tay ga đời mới giao nhận trực tiếp tại khách sạn.</li>
                    <li>Hỗ trợ đặt tour trải nghiệm Bán đảo Sơn Trà &amp; Phố cổ Hội An.</li>
                    <li>Gửi hành lý miễn phí trước giờ nhận phòng và sau khi trả phòng.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* REAL GUEST REVIEWS SECTION */}
            <section id="reviews" className="border-b border-stone-200 pb-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Đánh giá từ khách đã lưu trú</h2>
                  <p className="text-xs text-slate-500">Tất cả nhận xét đều từ khách đặt phòng và hoàn thành kỳ nghỉ thực tế</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-extrabold text-[#10395c]">4.6</div>
                  <div>
                    <div className="flex text-amber-500 text-xs">★★★★★</div>
                    <div className="text-[11px] text-slate-500">128 đánh giá</div>
                  </div>
                </div>
              </div>

              {/* Breakdown scores */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs mb-6">
                {[
                  { label: 'Vị trí', score: '4.9', width: '98%' },
                  { label: 'Sạch sẽ', score: '4.8', width: '96%' },
                  { label: 'Phục vụ', score: '4.7', width: '94%' },
                  { label: 'Đáng giá tiền', score: '4.6', width: '92%' },
                  { label: 'Tiện nghi', score: '4.5', width: '90%' },
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between font-medium text-slate-700 mb-1">
                      <span>{item.label}</span>
                      <span className="font-bold text-[#10395c]">{item.score}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#10395c] h-full rounded-full" style={{ width: item.width }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Review Cards */}
              <div className="space-y-4 text-xs">
                <div className="border border-stone-200 rounded-xl p-4 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                        TM
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">Trần Minh Quân &amp; Bạn đời</div>
                        <div className="text-[10px] text-slate-400">Đã lưu trú: Tháng 9/2026 • <span className="text-emerald-700">✓ Đã xác thực kỳ nghỉ</span></div>
                      </div>
                    </div>
                    <span className="font-bold text-[#10395c] bg-sky-50 px-2 py-0.5 rounded text-[11px]">5.0 ★</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed italic">
                    &quot;Khách sạn nằm ngay đường Bạch Đằng nhưng cách âm rất tốt, tối ngủ êm ru không nghe tiếng còi xe. Thích nhất là ban công ngắm trọn sông Hàn lúc lên đèn, hai vợ chồng nhâm nhi tách trà rất dễ chịu. Bữa sáng tô mì Quảng gà ta nêm nếm rất chuẩn vị địa phương chứ không bị công nghiệp hóa.&quot;
                  </p>
                </div>

                <div className="border border-stone-200 rounded-xl p-4 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-xs">
                        LH
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">Lê Hoàng Yến</div>
                        <div className="text-[10px] text-slate-400">Đã lưu trú: Tháng 8/2026 • <span className="text-emerald-700">✓ Đã xác thực kỳ nghỉ</span></div>
                      </div>
                    </div>
                    <span className="font-bold text-[#10395c] bg-sky-50 px-2 py-0.5 rounded text-[11px]">4.5 ★</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed italic">
                    &quot;Nhân viên lễ tân cực kỳ dễ mến và nhiệt tình, chỉ mình quán bánh xèo bà Dưỡng và quán ốc hút gần đó siêu ngon. Phòng tắm sạch bóng, nệm êm ái. Điểm cộng lớn là khách sạn có hồ bơi tầng thượng thoáng mát nhìn thẳng ra Cầu Rồng phun lửa cuối tuần.&quot;
                  </p>
                </div>
              </div>
            </section>

            {/* POLICY SECTION */}
            <section id="policies" className="border-b border-stone-200 pb-10">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Chính sách &amp; Quy định lưu trú</h2>
              <div className="bg-white border border-stone-200 rounded-2xl p-5 text-xs space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 border-b border-stone-100 pb-3">
                  <div className="sm:col-span-4 font-bold text-slate-800">Giờ nhận / trả phòng:</div>
                  <div className="sm:col-span-8 text-slate-600 space-y-0.5">
                    <div>Nhận phòng: <strong className="text-slate-800">Từ 14:00</strong></div>
                    <div>Trả phòng: <strong className="text-slate-800">Trước 12:00 trưa</strong></div>
                    <span className="text-[11px] text-slate-400">Nhận phòng sớm hoặc trả phòng trễ tùy thuộc vào tình trạng phòng sẵn có.</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 border-b border-stone-100 pb-3">
                  <div className="sm:col-span-4 font-bold text-slate-800">Chính sách trẻ em &amp; Giường phụ:</div>
                  <div className="sm:col-span-8 text-slate-600 space-y-1 leading-relaxed">
                    <p>Trẻ em dưới 6 tuổi: <strong className="text-slate-800">Miễn phí</strong> khi dùng chung giường sẵn có với bố mẹ (bao gồm bữa sáng).</p>
                    <p>Trẻ từ 6 – 11 tuổi: Phụ thu ăn sáng 120.000 đ / bé / ngày.</p>
                    <p>Giường phụ (Extra Bed): 350.000 đ / đêm (đã bao gồm bữa sáng).</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 border-b border-stone-100 pb-3">
                  <div className="sm:col-span-4 font-bold text-slate-800">Hủy phòng &amp; Thanh toán:</div>
                  <div className="sm:col-span-8 text-slate-600 space-y-1 leading-relaxed">
                    <p>Miễn phí hủy phòng trước 48 giờ tính từ ngày nhận phòng.</p>
                    <p>Không cần thanh toán trước cho hầu hết các hạng phòng tiêu chuẩn.</p>
                    <p>Chấp nhận chuyển khoản ngân hàng nội địa (VietQR), thẻ tín dụng quốc tế (Visa/Mastercard) và tiền mặt VND.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-4 font-bold text-slate-800">Vật nuôi &amp; Hút thuốc:</div>
                  <div className="sm:col-span-8 text-slate-600 leading-relaxed">
                    Toàn bộ phòng nghỉ là không gian không hút thuốc (khách có thể hút thuốc tại ban công hoặc sân vườn ngoài trời). Không cho phép mang theo thú cưng.
                  </div>
                </div>
              </div>
            </section>

            {/* LOCATION MAP SECTION */}
            <section id="location">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Vị trí &amp; Khu vực lân cận</h2>
                  <p className="text-xs text-slate-500">158 Bạch Đằng, Phường Hải Châu 1, Quận Hải Châu, Đà Nẵng</p>
                </div>
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-[#10395c] hover:underline inline-flex items-center gap-1"
                >
                  Mở trong Google Maps
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </a>
              </div>

              <div className="relative w-full h-72 rounded-2xl overflow-hidden border border-stone-200 bg-slate-100 mb-4">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0QYEFp2Az3_cdbp4XiJ-UnjjoHl-tWbtb8TYsYS98ZgTicsy6RAxlUuhb_sqLlKGElE3ClHl01h_XFIxiCRvasf_zjhpFXVWlKDNMZI5u1vy5hKkQNiTYhTLbTjt16KOMguh31HfRc3QwbM26hq8wlpKvkVA02nc76RniJHlGy3RDv9MUBcgPG58k8x7aurnhjpgCAHzFOaqE-gF5HND7lEPcD1n5Cllk48-p4GYL57t6EZSRPoVf"
                  alt="Bản đồ khu vực sông Hàn"
                  className="w-full h-full object-cover filter saturate-50 opacity-80"
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="bg-[#10395c] text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 animate-bounce">
                    <span>🏨</span> An Nhiên Riverside Hotel
                  </div>
                  <div className="w-3 h-3 bg-[#10395c] rotate-45 -mt-1.5 shadow-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white border border-stone-200 p-2.5 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-medium">Điểm tham quan</span>
                  <div className="font-bold text-slate-800 mt-0.5">Cầu Rồng Đà Nẵng</div>
                  <span className="text-slate-500 text-[11px]">350 m (4 phút đi bộ)</span>
                </div>
                <div className="bg-white border border-stone-200 p-2.5 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-medium">Văn hóa &amp; Chợ</span>
                  <div className="font-bold text-slate-800 mt-0.5">Chợ Hàn truyền thống</div>
                  <span className="text-slate-500 text-[11px]">600 m (7 phút đi bộ)</span>
                </div>
                <div className="bg-white border border-stone-200 p-2.5 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-medium">Ẩm thực &amp; Đêm</span>
                  <div className="font-bold text-slate-800 mt-0.5">Phố đi bộ Bạch Đằng</div>
                  <span className="text-slate-500 text-[11px]">Bước chân ra ngõ</span>
                </div>
                <div className="bg-white border border-stone-200 p-2.5 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-medium">Giao thông</span>
                  <div className="font-bold text-slate-800 mt-0.5">Sân bay Quốc tế Đà Nẵng</div>
                  <span className="text-slate-500 text-[11px]">3.8 km (10 phút taxi)</span>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT STICKY SIDEBAR (4 COLS) */}
          <div className="space-y-4 lg:sticky lg:top-36 lg:col-span-4">
            <div className="bg-white border-2 border-sky-100 rounded-2xl p-5 shadow-lg relative">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <span className="text-xs text-slate-400 block">Giá ưu đãi từ</span>
                  <div className="text-2xl font-black text-[#10395c]">
                    1.250.000 đ <span className="text-xs font-normal text-slate-500">/ đêm</span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  Đã gồm thuế phí
                </span>
              </div>

              {/* Date and Guest selector form */}
              <div className="border border-stone-200 rounded-xl overflow-hidden mb-4 divide-y divide-stone-200 text-xs">
                <div className="p-3 bg-stone-50/50 hover:bg-stone-50 cursor-pointer transition-colors">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NGÀY LƯU TRÚ</span>
                  <div className="flex items-center justify-between mt-1 font-semibold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                      20/10/2026 – 22/10/2026
                    </span>
                    <span className="text-slate-500 text-[11px] font-normal">(2 đêm)</span>
                  </div>
                </div>

                <div className="p-3 bg-stone-50/50 hover:bg-stone-50 cursor-pointer transition-colors">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SỐ LƯỢNG KHÁCH &amp; PHÒNG</span>
                  <div className="flex items-center justify-between mt-1 font-semibold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                      2 người lớn • 1 phòng
                    </span>
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Price summary calculation */}
              <div className="space-y-2 text-xs text-slate-600 pb-4 border-b border-stone-200">
                <div className="flex justify-between">
                  <span>1.250.000 đ × 2 đêm</span>
                  <span className="font-medium text-slate-800">2.500.000 đ</span>
                </div>
                <div className="flex justify-between">
                  <span>Thuế VAT (8%) &amp; phí dịch vụ</span>
                  <span className="text-emerald-700 font-medium">Đã bao gồm</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí dịch vụ StayReco</span>
                  <span className="text-emerald-700 font-medium">0 đ (Miễn phí)</span>
                </div>
              </div>

              {/* Total price */}
              <div className="flex items-baseline justify-between pt-4 mb-5">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Tổng thanh toán tạm tính:</span>
                  <span className="text-[10px] text-slate-400">Thanh toán an toàn khi nhận phòng</span>
                </div>
                <div className="text-xl font-black text-[#10395c] text-right">
                  2.500.000 đ
                </div>
              </div>

              {/* Main CTA */}
              <a
                href="#rooms"
                className="w-full block text-center bg-[#10395c] hover:bg-[#0c2a45] text-white font-bold text-sm py-3.5 rounded-xl shadow-md transition-colors mb-4"
              >
                Xem phòng &amp; Đặt ngay
              </a>

              {/* Value guarantees */}
              <div className="space-y-2 text-[11px] text-slate-500 pt-1">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                  <span>Cam kết giá minh bạch, không phí ẩn</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                  <span>Xác nhận đặt phòng tức thì qua email và SMS</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                  <span>Hỗ trợ khách hàng 24/7 từ chuyên viên StayReco</span>
                </div>
              </div>
            </div>

            {/* Host summary card */}
            <div className="bg-white border border-stone-200 rounded-2xl p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm">
                  🏨
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Chủ cơ sở lưu trú</span>
                  <span className="font-bold text-slate-800">An Nhiên Hospitality</span>
                </div>
              </div>
              <button className="text-[#10395c] font-semibold hover:underline text-xs cursor-pointer">Hỏi chủ nhà</button>
            </div>
          </div>
        </div>
      </main>

      {/* Common Footer */}
      <Footer />
    </div>
  );
}
