'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppBreadcrumb from '@/components/common/breadcrumb/AppBreadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function RoomDetailPage() {
  const [selectedRatePlan, setSelectedRatePlan] = useState('rate-1');
  const [aiQuestion, setAiQuestion] = useState('');

  return (
    <div className="min-h-screen text-slate-800 antialiased flex flex-col justify-between bg-[#fcfbfa]">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grow w-full">
        {/* Breadcrumb & Back button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs sm:text-sm text-slate-500 gap-2 mb-4">
          <AppBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Đà Nẵng', href: '/search?destination=DaNang' },
              { label: 'An Nhiên Riverside Hotel', href: '/hotels/an-nhien-riverside' },
              { label: 'Phòng Deluxe Hướng Sông Hàn' },
            ]}
          />
          <Link
            href="/hotels/an-nhien-riverside"
            className="inline-flex items-center text-[#1b3c57] font-medium hover:underline whitespace-nowrap"
          >
            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            Quay lại thông tin khách sạn
          </Link>
        </div>

        {/* Room Header Title */}
        <section className="mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Phòng Deluxe Hướng Sông Hàn</h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-3 py-1 font-medium rounded-full">
              <svg className="w-3.5 h-3.5 mr-1.5 text-emerald-600 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              Bao gồm tầm nhìn trực diện Cầu Rồng
            </Badge>
          </div>

          {/* Quick Feature Chips */}
          <div className="flex flex-wrap gap-2.5 mt-3 text-xs sm:text-sm text-slate-600">
            <span className="inline-flex items-center bg-white border border-slate-200 rounded-md px-3 py-1.5 shadow-2xs">
              📐 28 m²
            </span>
            <span className="inline-flex items-center bg-white border border-slate-200 rounded-md px-3 py-1.5 shadow-2xs">
              🛏️ 1 Giường đôi King size (1m8 x 2m)
            </span>
            <span className="inline-flex items-center bg-white border border-slate-200 rounded-md px-3 py-1.5 shadow-2xs">
              👥 Tối đa 2 người lớn
            </span>
            <span className="inline-flex items-center bg-white border border-slate-200 rounded-md px-3 py-1.5 shadow-2xs">
              🏛️ Ban công riêng hướng Sông Hàn
            </span>
            <span className="inline-flex items-center bg-white border border-slate-200 rounded-md px-3 py-1.5 shadow-2xs">
              🏢 Tầng 3–5
            </span>
          </div>
        </section>

        {/* Notification Banner */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-3.5 mb-6 flex items-start gap-3 text-xs sm:text-sm text-amber-900">
          <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          <p>
            <strong className="font-semibold text-amber-950">Lưu ý phân bổ phòng:</strong> Hạng phòng đặt theo tiêu chuẩn dịch vụ. Số phòng thực tế sẽ được nhân viên lễ tân sắp xếp linh hoạt và thuận tiện nhất khi quý khách làm thủ tục nhận phòng (Check-in).
          </p>
        </div>

        {/* Photo Gallery */}
        <section className="mb-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 h-auto md:h-110 rounded-2xl overflow-hidden">
            {/* Main Bedroom Photo */}
            <div className="md:col-span-6 relative h-64 md:h-full group overflow-hidden bg-slate-100">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1e7mWRp5GQPEqZOK2sMWDoPwETBXDg-bAkW7Sh81Q-w1fVpX_VBxqcpBtpTQYdBT4Y3fYEQBIJaCoZOzSRxCdRyIqzl8PBoMb8ihAa6-Bfzt29baT3-Wr35xBmeYE3b_Ch9pezknOd3HxlRxzIljdSXozO3nXP7ajScODcSCWrmILde5fnpmVm9DHehXyqgfTH6cacaugTioLmZ3fgJTApFvtK6LAgc-zKw58F1QddUjYUY15jmwl"
                alt="Không gian phòng ngủ chính & cửa mở ra ban công"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white text-xs px-3 py-1.5 rounded-md font-medium">
                Không gian phòng ngủ chính &amp; cửa mở ra ban công
              </div>
            </div>

            {/* Right Side Photos Grid (2x2) */}
            <div className="md:col-span-6 grid grid-cols-2 gap-3 h-64 md:h-full">
              <div className="relative overflow-hidden group bg-slate-100">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAOaXkta84MJ6cOcMNeARFcoeBNiQOocvSWe1FPW0guYg5GTs5YbGJzKxi_2saA0GZlkAq9MK20NgjX-RUUjzmlj23xO7XQm0X3NFCmZGAQxMhWysZEPIFcmT7NvUWAi2O5eOjZT_25SHEqNCrD5ybakHRJYjeKc2TozVuq2EaED2_2TZy15vfrxifNHLBoHsgcisLyEDUzal9MKcj1wwgN8gi1Np60fhOcf5Qu7UhPTEJsXi3LjNc4"
                  alt="Góc ngắm Cầu Rồng từ ban công"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-2.5 left-2.5 right-2 bg-black/60 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded line-clamp-1 font-medium">
                  Góc ngắm Cầu Rồng &amp; sông Hàn từ ban công riêng
                </div>
              </div>

              <div className="relative overflow-hidden group bg-slate-100">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGMtOViFnDvNLgGCLDb8crzl2g-UbXaeF5bgp5R6IOW7HnPxBOogDSfxBHlu3em3Mt1s0WhkaKJnZEXFJJQht0tlst7QCrAotAdLyl8Kp0mtd2m2eUO3MS8hjZ9beC4dqr9Tl2KtCjAFzRNzokcNp6e2hD_CTwP23AwWKSJltLAlRD-tpQjv_TINx2BhM-UNJ1J7U1M82Ppg6PVTsaVPj_aB7wq476OcbdOrZVLAuT-W4jlu0x1kKu"
                  alt="Khu vực thư giãn ban công"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="relative overflow-hidden group bg-slate-100">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZGdmaJMFqjlbOkOel-hV4BTy0zMmC0nOjIzdKpmNKTJwplCyLOrYz-nNPBiOtukdaMLVHdE0h-D-24Fa2eLhnqRPLazXqJZqCSy6BV5YWHSVQQ7x-KtLX04zmG0-NWhH9XZxiUG4mzcV7M9dWVKdRTSW91s7itR2jugTXwRhcAcdTAijNRdhXyBxTMHS8uPpDS-pDeama0na_0KMIGkSSOYmff9g9lPBeHqThwMubn3KoX2g-_Clf"
                  alt="Bồn tắm ngâm thảo mộc"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded font-medium">
                  Bồn tắm ngâm thảo mộc
                </div>
              </div>

              <div className="relative overflow-hidden group bg-slate-100">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWIZIvAOeBhoBUbowZjdmi1qgPDnoSqJtO1O-zMrUb83oW9APbS345S0O8Wmw3v6eQPY8HrRj5FLhIj_q-6fF4rd3dTwQW6cm2-qtqh2jSrZnUG7HjzgyYJuWdBF1QrS_0gyCBIhAgmHLbKiKHM1CwM1bWwm4QxCRkxPUy2IzneMRUkzquPouFX7gwc3RUy6eAxf_jgQGrduYQUEvxLsBrCUMSEKAa7yPyuVcMqFRvQpRgcNdZSPqr"
                  alt="Góc bàn trang điểm & làm việc"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded font-medium">
                  Góc bàn trang điểm &amp; làm việc
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-3 right-3 bg-white/95 hover:bg-white text-slate-800 text-xs font-semibold px-3 py-2 rounded-lg shadow-md flex items-center gap-1.5"
                >
                  🖼️ Xem toàn bộ 16 ảnh phòng
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-10">
            {/* SPECIFICATIONS */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-2">
                🏛️ Thông số &amp; Không gian phòng
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-md bg-sky-100 text-[#1b3c57] text-lg">📏</div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Diện tích 28 m²</p>
                    <p className="text-xs text-slate-500 mt-0.5">Thiết kế mở thoáng đãng, sàn gỗ tự nhiên</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-md bg-sky-100 text-[#1b3c57] text-lg">🛏️</div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">1 Giường King đôi cực êm</p>
                    <p className="text-xs text-slate-500 mt-0.5">Nệm lò xo túi &amp; gối lông vũ thiên nhiên</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-md bg-sky-100 text-[#1b3c57] text-lg">🛁</div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Bồn tắm ngâm thảo mộc</p>
                    <p className="text-xs text-slate-500 mt-0.5">Kèm sen tắm đứng áp lực cao &amp; thảo mộc tắm</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-md bg-sky-100 text-[#1b3c57] text-lg">🚪</div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Cửa chạm trần &amp; Ban công</p>
                    <p className="text-xs text-slate-500 mt-0.5">Tầm nhìn ngắm sông Hàn và gió mát tự nhiên</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* AMENITIES */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Chi tiết danh mục tiện nghi</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-3.5 flex items-center text-[#1b3c57]">
                    🛋️ Giấc ngủ &amp; Thư giãn
                  </h3>
                  <ul className="space-y-2.5 text-xs text-slate-600">
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">✓</span> Nệm lò xo túi độc lập êm ái chống rung chuyển
                    </li>
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">✓</span> Bộ gối lông vũ tự nhiên nâng đỡ đốt sống cổ
                    </li>
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">✓</span> Rèm 2 lớp cản sáng tuyệt đối 100%
                    </li>
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">✓</span> Điều hòa 2 chiều Inverter êm ái lọc không khí
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-3.5 flex items-center text-[#1b3c57]">
                    🚿 Phòng tắm &amp; Chăm sóc
                  </h3>
                  <ul className="space-y-2.5 text-xs text-slate-600">
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">✓</span> Bồn tắm nằm view kính thoáng ngắm hoàng hôn
                    </li>
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">✓</span> Máy sấy tóc ion âm công suất lớn 1800W
                    </li>
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">✓</span> Áo choàng tắm dệt bông waffle 100% organic cotton
                    </li>
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">✓</span> Bộ xà bông &amp; dầu gội thảo mộc thiên nhiên Hội An
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-3.5 flex items-center text-[#1b3c57]">
                    📺 Công nghệ &amp; Giải trí
                  </h3>
                  <ul className="space-y-2.5 text-xs text-slate-600">
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">✓</span> Smart TV 55 inch 4K (Netflix, YouTube tích hợp)
                    </li>
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">✓</span> Bộ phát Wi-Fi 6 tốc độ cao độc lập cho từng phòng
                    </li>
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">✓</span> Cổng sạc Type-C &amp; USB đa năng bố trí ngay đầu giường
                    </li>
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">✓</span> Loa bluetooth để bàn phong cách retro mộc
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-3.5 flex items-center text-[#1b3c57]">
                    ☕ Đồ uống &amp; Tiện ích
                  </h3>
                  <ul className="space-y-2.5 text-xs text-slate-600">
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">✓</span> Máy pha cà phê capsule &amp; cà phê mộc rang xay
                    </li>
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">✓</span> Ấm siêu tốc giữ nhiệt &amp; bộ ấm tách gốm nung
                    </li>
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">✓</span> Trà ô long tuyển chọn &amp; nước tinh khiết miễn phí
                    </li>
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">✓</span> Két sắt an toàn kích thước để vừa laptop 15.6 inch
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* RATE PLANS */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                🏷️ Lựa chọn gói giá cho kỳ nghỉ của bạn
              </h2>

              <div className="bg-blue-50/70 border border-blue-100 text-[#152e43] rounded-lg px-4 py-2.5 text-xs font-medium mb-6 flex items-center">
                📅 Lịch trình đã chọn: 20/10/2026 – 22/10/2026 (2 đêm, 1 phòng, 2 người lớn)
              </div>

              <div className="space-y-4">
                {/* Rate Plan 1 */}
                <div
                  onClick={() => setSelectedRatePlan('rate-1')}
                  className={`border-2 rounded-xl p-5 relative transition-all cursor-pointer ${
                    selectedRatePlan === 'rate-1'
                      ? 'border-[#1b3c57] bg-blue-50/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="absolute -top-3 left-6 bg-[#1b3c57] text-white text-[11px] font-semibold px-3 py-0.5 rounded-full flex items-center shadow-xs">
                    👍 Khuyên dùng nhiều nhất
                  </span>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-1">
                    <div className="flex items-start space-x-3.5">
                      <input
                        type="radio"
                        id="rate-1"
                        name="rate_plan"
                        checked={selectedRatePlan === 'rate-1'}
                        onChange={() => setSelectedRatePlan('rate-1')}
                        className="mt-1 w-4 h-4 text-[#1b3c57] focus:ring-[#1b3c57] border-slate-300"
                      />
                      <div>
                        <label htmlFor="rate-1" className="font-bold text-base text-slate-900 cursor-pointer block">
                          Tiêu chuẩn – Linh hoạt nhất (Bao gồm bữa sáng)
                        </label>
                        <ul className="mt-2.5 space-y-1.5 text-xs text-slate-600">
                          <li className="flex items-start text-amber-800 font-medium">
                            <span className="text-amber-600 mr-2">🍽️</span> Bữa sáng tự chọn đặc sản Đà Nẵng - Quảng Nam tại nhà hàng ven sông mỗi ngày cho 2 khách.
                          </li>
                          <li className="flex items-center text-emerald-700 font-medium">
                            <span className="text-emerald-600 mr-2">✓</span> Miễn phí hủy phòng trước 14:00 ngày 18/10/2026 (48 giờ trước nhận phòng).
                          </li>
                          <li className="flex items-center text-slate-600">
                            <span className="text-slate-400 mr-2">💳</span> Không cần cọc trước, thanh toán trực tiếp khi nhận phòng tại khách sạn.
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end shrink-0 pl-7 md:pl-0">
                      <div className="flex items-baseline space-x-1">
                        <span className="text-2xl font-bold text-[#1b3c57]">1.250.000 ₫</span>
                        <span className="text-xs text-slate-500">/ đêm</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Tổng 2 đêm: <strong>2.500.000 ₫</strong> (Đã gồm thuế &amp; phí)</p>
                      <Button
                        size="sm"
                        variant={selectedRatePlan === 'rate-1' ? 'default' : 'outline'}
                        className="mt-3 text-xs"
                      >
                        {selectedRatePlan === 'rate-1' ? '✓ Đang chọn gói này' : 'Chọn gói này'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Rate Plan 2 */}
                <div
                  onClick={() => setSelectedRatePlan('rate-2')}
                  className={`border rounded-xl p-5 relative transition-all cursor-pointer ${
                    selectedRatePlan === 'rate-2'
                      ? 'border-[#1b3c57] bg-blue-50/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start space-x-3.5">
                      <input
                        type="radio"
                        id="rate-2"
                        name="rate_plan"
                        checked={selectedRatePlan === 'rate-2'}
                        onChange={() => setSelectedRatePlan('rate-2')}
                        className="mt-1 w-4 h-4 text-[#1b3c57] focus:ring-[#1b3c57] border-slate-300"
                      />
                      <div>
                        <label htmlFor="rate-2" className="font-bold text-base text-slate-900 cursor-pointer block">
                          Tiết kiệm thông minh (Không gồm bữa sáng)
                        </label>
                        <ul className="mt-2.5 space-y-1.5 text-xs text-slate-600">
                          <li className="flex items-center text-slate-600">
                            <span className="text-slate-400 mr-2">✓</span> Phù hợp khách muốn tự do khám phá các quán bún chả cá, mì Quảng bản địa trên phố Bạch Đằng.
                          </li>
                          <li className="flex items-center text-emerald-700 font-medium">
                            <span className="text-emerald-600 mr-2">✓</span> Miễn phí hủy phòng trước 14:00 ngày 18/10/2026.
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end shrink-0 pl-7 md:pl-0">
                      <div className="flex items-baseline space-x-1">
                        <span className="text-xl font-bold text-slate-900">1.100.000 ₫</span>
                        <span className="text-xs text-slate-500">/ đêm</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Tổng 2 đêm: <strong>2.200.000 ₫</strong> (Đã gồm thuế &amp; phí)</p>
                      <Button
                        size="sm"
                        variant={selectedRatePlan === 'rate-2' ? 'default' : 'outline'}
                        className="mt-3 text-xs"
                      >
                        {selectedRatePlan === 'rate-2' ? '✓ Đang chọn gói này' : 'Chọn gói này'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Rate Plan 3 */}
                <div
                  onClick={() => setSelectedRatePlan('rate-3')}
                  className={`border rounded-xl p-5 relative transition-all cursor-pointer ${
                    selectedRatePlan === 'rate-3'
                      ? 'border-[#1b3c57] bg-blue-50/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start space-x-3.5">
                      <input
                        type="radio"
                        id="rate-3"
                        name="rate_plan"
                        checked={selectedRatePlan === 'rate-3'}
                        onChange={() => setSelectedRatePlan('rate-3')}
                        className="mt-1 w-4 h-4 text-[#1b3c57] focus:ring-[#1b3c57] border-slate-300"
                      />
                      <div>
                        <label htmlFor="rate-3" className="font-bold text-base text-slate-900 cursor-pointer block">
                          Gói Trải Nghiệm Thư Giãn (Kèm liệu trình ngâm chân thảo mộc)
                        </label>
                        <ul className="mt-2.5 space-y-1.5 text-xs text-slate-600">
                          <li className="flex items-start text-amber-800 font-medium">
                            <span className="text-amber-600 mr-2">🌿</span> Bao gồm bữa sáng ven sông + 01 liệu trình ngâm chân thảo dược Cù Lao Chàm thư giãn cho 2 khách.
                          </li>
                          <li className="flex items-center text-emerald-700 font-medium">
                            <span className="text-emerald-600 mr-2">✓</span> Hủy phòng linh hoạt miễn phí trước 24 giờ.
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end shrink-0 pl-7 md:pl-0">
                      <div className="flex items-baseline space-x-1">
                        <span className="text-xl font-bold text-slate-900">1.450.000 ₫</span>
                        <span className="text-xs text-slate-500">/ đêm</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Tổng 2 đêm: <strong>2.900.000 ₫</strong> (Đã gồm thuế &amp; phí)</p>
                      <Button
                        size="sm"
                        variant={selectedRatePlan === 'rate-3' ? 'default' : 'outline'}
                        className="mt-3 text-xs"
                      >
                        {selectedRatePlan === 'rate-3' ? '✓ Đang chọn gói này' : 'Chọn gói này'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* POLICIES */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-2">
                🛡️ Quy định &amp; Chính sách phòng
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50/80 p-4 rounded-lg border border-slate-100 flex flex-col">
                  <span className="text-xs font-bold text-slate-900 flex items-center mb-2">
                    ⏰ Thời gian nhận/trả
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Nhận phòng từ <strong>14:00</strong><br />
                    Trả phòng trước <strong>12:00 trưa</strong>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-2">Hỗ trợ gửi hành lý miễn phí tại sảnh.</p>
                </div>

                <div className="bg-slate-50/80 p-4 rounded-lg border border-slate-100 flex flex-col">
                  <span className="text-xs font-bold text-slate-900 flex items-center mb-2">
                    👥 Sức chứa &amp; Trẻ em
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Tối đa <strong>2 người lớn + 1 trẻ em dưới 6 tuổi</strong> (miễn phí ngủ chung giường có sẵn).
                  </p>
                  <p className="text-[11px] text-slate-500 mt-2">Nôi cũi em bé sẵn sàng khi có yêu cầu.</p>
                </div>

                <div className="bg-slate-50/80 p-4 rounded-lg border border-slate-100 flex flex-col">
                  <span className="text-xs font-bold text-slate-900 flex items-center mb-2">
                    🚭 Quy định hút thuốc
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Nghiêm cấm hút thuốc bên trong phòng kín nhằm giữ không khí tự nhiên và trong lành.
                  </p>
                  <p className="text-[11px] text-emerald-700 font-medium mt-2">Được hút thuốc ngoài ban công thoáng khí.</p>
                </div>
              </div>
            </Card>

            {/* AI ASSISTANT WIDGET */}
            <section className="bg-linear-to-br from-[#f0f6fa] to-[#e1ecf4] rounded-2xl p-6 border border-[#e1ecf4]">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#1b3c57] flex items-center justify-center text-white text-sm shadow-xs">
                  🤖
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Hỏi trợ lý về phòng Deluxe Hướng Sông Hàn</h3>
                  <p className="text-xs text-slate-500">Giải đáp tức thì về góc nhìn ban công, tiện nghi bồn tắm hoặc yêu cầu nệm êm cho giấc ngủ của bạn dựa trên dữ liệu thực tế từ khách sạn.</p>
                </div>
              </div>

              {/* Quick Prompts */}
              <div className="flex flex-wrap gap-2 my-4">
                {[
                  'Ban công phòng này có nhìn rõ Cầu Rồng phun lửa không?',
                  'Bồn tắm nằm có vách kính ngăn riêng biệt không?',
                  'Phòng có yên tĩnh vào ban đêm không?',
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setAiQuestion(prompt)}
                    className="bg-white hover:bg-slate-50 text-slate-700 text-xs px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>❓</span> {prompt}
                  </button>
                ))}
              </div>

              {/* Question Input */}
              <div className="relative flex items-center">
                <Input
                  type="text"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  placeholder="Nhập câu hỏi của bạn về phòng này (ví dụ: tầng mấy ngắm sông đẹp nhất?)"
                  className="w-full h-11 sm:h-12 pl-4 pr-28 sm:pr-32 text-xs sm:text-sm bg-white border-slate-300 rounded-xl shadow-xs focus-visible:ring-primary"
                />
                <Button
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 sm:h-9 px-3.5 sm:px-4 bg-[#1b3c57] hover:bg-[#152e43] text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Gửi câu hỏi ✈️
                </Button>
              </div>
            </section>
          </div>

          {/* Right Column: Booking Summary Sidebar */}
          <aside className="lg:col-span-4">
            <Card className="sticky top-24 shadow-md p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900">Tóm tắt đặt phòng</h3>
                <span className="text-xs text-[#1b3c57] font-medium flex items-center">
                  🏨 Hotel Booking
                </span>
              </div>

              {/* Room Mini Preview */}
              <div className="flex items-center space-x-3.5">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEvbibPfJh0mvZ5ENkA4aCsgOGDILHEcRfi_zs8PXc78P0wGutbuqs_5dvTme2APBCRg2ESkiZFTQXpmvPYIpgbIpJSsGCdH-hCF6EBVg4tHy2FqJgaEnXb6Az3RVZmupCAXl2fcEL8Qu782sHNkNxO3CZ9aq9uYLhiZHQ-3WqLSbF70Y2H8_HDyClr7eG19HnbiRvB36NmrLp1OHAAInsl7pYW3WUltDx51ca_fVP_ayJeJf0PzD3"
                  alt="Thumbnail phòng"
                  className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-100"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm leading-snug">Phòng Deluxe Hướng Sông Hàn</h4>
                  <p className="text-xs text-slate-500 mt-1">28 m² • Ban công hướng sông • Tầng 3–5</p>
                </div>
              </div>

              {/* Selected Dates */}
              <div className="bg-slate-50 rounded-xl p-4 text-xs space-y-2.5 border border-slate-100">
                <div className="flex justify-between items-center text-slate-600">
                  <span>📅 Ngày lưu trú:</span>
                  <span className="font-bold text-slate-900">20/10/2026 – 22/10/2026 <span className="font-normal text-slate-500">(2 đêm)</span></span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>👥 Khách &amp; phòng:</span>
                  <span className="font-semibold text-slate-900">2 người lớn • 1 phòng</span>
                </div>
                <div className="flex justify-between items-start text-slate-600 pt-1 border-t border-slate-200/60">
                  <span>🏷️ Gói đã chọn:</span>
                  <span className="font-semibold text-slate-900 text-right">
                    Gói Tiêu chuẩn linh hoạt<br />
                    <span className="text-[11px] font-normal text-slate-500">(Kèm bữa sáng đặc sản)</span>
                  </span>
                </div>
              </div>

              {/* Price Calculation */}
              <div className="space-y-2 text-xs border-b border-slate-100 pb-4">
                <div className="flex justify-between text-slate-600">
                  <span>1.250.000 ₫ × 2 đêm</span>
                  <span className="font-medium text-slate-900">2.500.000 ₫</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Thuế VAT (8%) &amp; Phí phục vụ</span>
                  <span className="text-emerald-700 font-medium">Đã bao gồm</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Phí dịch vụ StayReco</span>
                  <span className="text-emerald-700 font-medium">0 ₫ (Miễn phí)</span>
                </div>
              </div>

              {/* Total Payable */}
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 block">Tổng thanh toán:</span>
                    <span className="text-[11px] text-slate-400">Cho cả 2 đêm nghỉ</span>
                  </div>
                  <span className="text-2xl font-bold text-[#1b3c57]">2.500.000 ₫</span>
                </div>
                <div className="bg-emerald-50 rounded-lg p-2.5 text-center text-emerald-800 text-xs font-medium mt-2">
                  ✓ Đã bao gồm toàn bộ thuế, phí &amp; bữa sáng cho 2 khách
                </div>
              </div>

              {/* Primary Action */}
              <div>
                <Link href="/booking" className="block">
                  <Button
                    className="w-full bg-[#1b3c57] hover:bg-[#152e43] text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-200 text-sm shadow-md h-auto cursor-pointer"
                  >
                    <span>Chọn phòng này</span> ➔
                  </Button>
                </Link>
                <p className="text-[11px] text-center text-slate-400 mt-2 leading-tight">
                  Dành cho khách chưa đăng nhập: chuyển tiếp đến đăng nhập nhanh, hoặc COD nếu đã có tài khoản. Giữ nguyên toàn bộ lựa chọn của bạn.
                </p>
              </div>

              {/* Guarantees */}
              <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center space-x-2.5">
                  <span className="text-[#1b3c57]">🛡️</span>
                  <span>Cam kết giá minh bạch, tuyệt đối không phí ẩn tại quầy</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <span className="text-emerald-600">📅</span>
                  <span>Miễn phí hủy phòng trước ngày 18/10/2026</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <span className="text-[#1b3c57]">✓</span>
                  <span>Giữ phòng ngay hôm nay – Không cần trả trước</span>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
