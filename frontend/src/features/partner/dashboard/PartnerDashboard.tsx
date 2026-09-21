/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Legacy JSX display screen pending component-level migration.
import React from 'react';

export default function PartnerDashboard() {
  return (
    <div className="bg-surface font-body text-on-surface antialiased">
      <aside className="fixed left-0 top-0 h-full w-[248px] bg-surface-container-lowest border-r border-outline-variant/40 z-50 flex flex-col justify-between pt-5 pb-4 px-4 overflow-y-auto">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 px-1">
            <img alt="StayReco Logo" className="w-8 h-8 rounded-lg object-cover" src="https://lh3.googleusercontent.com/aida/AEtjO1V-SCfN5vRag32eaaMCe725o3qjMzRhq78BRcuhKmOXxEDu4G8qm577peTkqU28fF62pdny08VmbaOwjGzlFo32VJpAA8SPA924onlWgQ2t92x5iGKeuhw1fCMiUdigsg6mge97P7ahRot5alw95ynt0-n2m7IucAr968MgN5mTjYAV6AnplZ0Xx-7f4H3KdFhb1vm9RS4hCaI81jJK3nFDIJCSwTS5926q0xHmfGl3sY60Y-Y_wuhSWwMDAhg2Nz8K1d9sN9cn" />
            <div className="flex flex-col">
              <span className="font-headline font-bold text-base text-primary tracking-tight leading-none">StayReco</span>
              <span className="text-[11px] font-medium text-on-surface-variant uppercase tracking-wider mt-1">Partner Portal</span>
            </div>
          </div>
          <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary text-[18px]">apartment</span>
              <span className="font-semibold text-xs text-on-surface truncate">An Nhiên Riverside</span>
            </div>
            <p className="text-[11px] text-on-surface-variant pl-6">Quy mô: 36 phòng tiêu chuẩn</p>
          </div>
          <nav className="flex flex-col gap-5" data-active-classes="bg-primary-container text-on-primary font-semibold rounded-lg shadow-sm">
            <div className="flex flex-col gap-1">
              <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-outline">Quản lý kinh doanh</span>
              <a aria-current="page" className="flex items-center gap-3 px-3 py-2.5 transition-all bg-primary-container text-on-primary font-semibold rounded-lg shadow-sm" data-path="tong-quan" href="#">
                <span className="material-symbols-outlined text-[20px]">dashboard</span>
                Tổng quan
              </a>
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all" data-path="khach-san-co-so" href="#">
                <span className="material-symbols-outlined text-[20px]">domain</span>
                Khách sạn & Cơ sở
              </a>
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all" data-path="kho-phong" href="#">
                <span className="material-symbols-outlined text-[20px]">bed</span>
                Kho phòng
              </a>
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all" data-path="lich-ton-kha-dung" href="#">
                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                Lịch tồn & Khả dụng
              </a>
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all" data-path="luat-gia-mua-vu" href="#">
                <span className="material-symbols-outlined text-[20px]">sell</span>
                Luật giá & Mùa vụ
              </a>
            </div>
            <div className="flex flex-col gap-1">
              <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-outline">Tiếp thị & Khách hàng</span>
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all" data-path="chien-dich-giam-gia" href="#">
                <span className="material-symbols-outlined text-[20px]">confirmation_number</span>
                Chiến dịch & Giảm giá
              </a>
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all" data-path="khach-hang-than-thiet" href="#">
                <span className="material-symbols-outlined text-[20px]">card_membership</span>
                Khách hàng thân thiết
              </a>
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all" data-path="giong-thuong-hieu-ai" href="#">
                <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                Giọng thương hiệu AI
              </a>
            </div>
            <div className="flex flex-col gap-1">
              <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-outline">Tổ chức & Hồ sơ</span>
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all" data-path="nhan-vien-phan-quyen" href="#">
                <span className="material-symbols-outlined text-[20px]">group</span>
                Nhân viên & Phân quyền
              </a>
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all" data-path="ho-so-xac-minh" href="#">
                <span className="material-symbols-outlined text-[20px]">verified_user</span>
                Hồ sơ & Xác minh
              </a>
            </div>
          </nav>
        </div>
        <div className="pt-4 mt-4 border-t border-outline-variant/40 flex flex-col gap-3">
          <a className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-medium text-xs border border-outline-variant/30 transition-colors" href="#">
            <span>Xem trang khách sạn</span>
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </a>
          <div className="flex items-center gap-2 px-1 text-[11px] text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-tertiary-container animate-pulse"></span>
            <span className="truncate">CM: Đang đồng bộ</span>
          </div>
        </div>
      </aside>
      <div className="pl-[248px]">
        <header className="fixed top-0 left-[248px] right-0 h-16 bg-surface-container-lowest border-b border-outline-variant/40 z-40 px-8 flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/30">
              <span className="font-headline font-semibold text-xs text-on-surface">An Nhiên Riverside Hotel</span>
              <span className="text-[11px] text-on-surface-variant">(4-Star, Đà Nẵng)</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-tertiary-fixed text-on-tertiary-fixed">Đã xác minh</span>
              <span className="material-symbols-outlined text-outline text-[16px] cursor-pointer hover:text-on-surface">expand_more</span>
            </div>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">search</span>
              <input className="pl-9 pr-3 py-1.5 w-64 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Tìm đặt phòng, tên khách... (Ctrl+K)" type="text" />
            </div>
          </div>
          <div className="flex items-center gap-5">
            <button className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-secondary text-on-secondary text-[10px] font-bold rounded-full flex items-center justify-center">2</span>
            </button>
            <button className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-[22px]">help</span>
            </button>
            <div className="h-6 w-px bg-outline-variant/40"></div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col text-right">
                <span className="text-xs font-semibold text-on-surface leading-snug">Trần Nam</span>
                <span className="text-[10px] text-on-surface-variant">Chủ khách sạn (Partner)</span>
              </div>
              <img alt="Profile" className="w-8 h-8 rounded-full object-cover ring-1 ring-outline-variant/40" src="https://lh3.googleusercontent.com/aida/AEtjO1V-SCfN5vRag32eaaMCe725o3qjMzRhq78BRcuhKmOXxEDu4G8qm577peTkqU28fF62pdny08VmbaOwjGzlFo32VJpAA8SPA924onlWgQ2t92x5iGKeuhw1fCMiUdigsg6mge97P7ahRot5alw95ynt0-n2m7IucAr968MgN5mTjYAV6AnplZ0Xx-7f4H3KdFhb1vm9RS4hCaI81jJK3nFDIJCSwTS5926q0xHmfGl3sY60Y-Y_wuhSWwMDAhg2Nz8K1d9sN9cn" />
            </div>
          </div>
        </header>
        <main className="relative pt-16 min-h-screen bg-surface p-8">
          <div className="flex flex-col w-full gap-8">
            {/* Page Header & Operational Filter Toolbar */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-2">
              <div className="flex flex-col gap-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-secondary-fixed text-on-secondary-fixed">Báo cáo hiệu suất</span>
                  <span className="text-xs text-outline">•</span>
                  <span className="text-xs text-on-surface-variant font-medium">Cập nhật lúc 08:30 hôm nay</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold font-headline text-on-surface tracking-tight">Tổng quan kinh doanh & Hiệu quả khách sạn</h1>
                <p className="text-sm text-on-surface-variant leading-relaxed">Báo cáo doanh thu thực nhận, công suất phòng và chỉ số hài lòng khách lưu trú tại An Nhiên Riverside.</p>
              </div>
              {/* Filter & Action Controls */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Date Range Selector */}
                <div className="flex items-center bg-surface-container-lowest px-3.5 py-2.5 rounded-xl shadow-sm text-xs font-medium text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[18px] text-primary mr-2.5">calendar_today</span>
                  <span>01/10/2026 - 31/10/2026</span>
                  <span className="ml-2 text-[10px] text-on-surface-variant px-1.5 py-0.5 rounded bg-surface-container font-semibold">Tháng này</span>
                  <span className="material-symbols-outlined text-[18px] text-outline ml-2">arrow_drop_down</span>
                </div>
                {/* Comparison Pill */}
                <div className="hidden sm:flex items-center bg-tertiary-fixed/60 text-on-tertiary-fixed px-3 py-2 rounded-xl text-xs font-medium">
                  <span className="material-symbols-outlined text-[16px] mr-1">trending_up</span>
                  <span>So với tháng trước (+14.2%)</span>
                </div>
                {/* Channel Filter */}
                <div className="relative">
                  <button className="flex items-center bg-surface-container-lowest px-3.5 py-2.5 rounded-xl shadow-sm text-xs font-medium text-on-surface hover:bg-surface-container-low transition-colors">
                    <span className="material-symbols-outlined text-[18px] text-outline mr-2">hub</span>
                    <span>Tất cả kênh đặt phòng</span>
                    <span className="material-symbols-outlined text-[18px] text-outline ml-2">expand_more</span>
                  </button>
                </div>
                {/* Export Financial Statement Button */}
                <button className="flex items-center gap-2 bg-primary text-on-primary hover:bg-primary-container px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all">
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  <span>Xuất báo cáo tài chính</span>
                </button>
              </div>
            </div>
            {/* Top KPI Metric Grid (4 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* KPI 1: Doanh thu thuần */}
              <div className="flex flex-col justify-between bg-surface-container-lowest p-5 rounded-2xl shadow-sm relative overflow-hidden group">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-outline uppercase tracking-wider">Doanh thu thuần (Net Proceeds)</span>
                    <div className="mt-2 text-2xl font-bold font-headline text-on-surface tracking-tight">248.500.000 ₫</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[22px]">payments</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 flex flex-col gap-1.5 text-xs text-on-surface-variant bg-surface-container-low/50 p-2.5 rounded-xl">
                  <div className="flex justify-between items-center text-[11px]">
                    <span>Tổng booking gộp:</span>
                    <span className="font-semibold text-on-surface">285.000.000 ₫</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-secondary">
                    <span>Chiết khấu / Voucher:</span>
                    <span className="font-medium">-18.500.000 ₫</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-outline">
                    <span>Hoa hồng StayReco (6%):</span>
                    <span className="font-medium">-17.100.000 ₫</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs pt-1">
                  <span className="inline-flex items-center gap-1 font-semibold text-tertiary">
                    <span className="material-symbols-outlined text-[16px]">trending_up</span>
                    +18.4%
                  </span>
                  <span className="text-outline text-[11px]">so với tháng trước</span>
                </div>
              </div>
              {/* KPI 2: Công suất phòng */}
              <div className="flex flex-col justify-between bg-surface-container-lowest p-5 rounded-2xl shadow-sm relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-outline uppercase tracking-wider">Công suất phòng (Occupancy)</span>
                    <div className="mt-2 text-2xl font-bold font-headline text-on-surface tracking-tight">84.6%</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined text-[22px]">meeting_room</span>
                  </div>
                </div>
                {/* Inline Capacity Visual */}
                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex justify-between text-xs text-on-surface-variant font-medium">
                    <span>
                      Đã bán:
                      <b className="text-on-surface">914</b>
                      / 1.080 đêm
                    </span>
                    <span>Mục tiêu: 80%</span>
                  </div>
                  <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden flex">
                    <div className="bg-primary h-full rounded-full transition-all duration-700" style={{"width":"84.6%"}}></div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs pt-1">
                  <span className="inline-flex items-center gap-1 font-semibold text-tertiary">
                    <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                    +6.2%
                  </span>
                  <span className="text-outline text-[11px]">so với cùng kỳ năm ngoái</span>
                </div>
              </div>
              {/* KPI 3: Giá bán bình quân (ADR) */}
              <div className="flex flex-col justify-between bg-surface-container-lowest p-5 rounded-2xl shadow-sm relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-outline uppercase tracking-wider">Giá bán bình quân (ADR)</span>
                    <div className="mt-2 text-2xl font-bold font-headline text-on-surface tracking-tight">1.280.000 ₫</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-[22px]">price_change</span>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-xl bg-surface-container-low/50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-outline">RevPAR tính trên kho phòng</span>
                    <span className="text-sm font-bold text-on-surface">1.082.880 ₫</span>
                  </div>
                  <div className="text-[11px] font-semibold text-primary px-2 py-1 rounded bg-surface-container-lowest">36 phòng</div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs pt-1">
                  <span className="inline-flex items-center gap-1 font-semibold text-tertiary">
                    <span className="material-symbols-outlined text-[16px]">trending_up</span>
                    +3.5%
                  </span>
                  <span className="text-outline text-[11px]">tăng trưởng ổn định</span>
                </div>
              </div>
              {/* KPI 4: CSAT & Khách đánh giá */}
              <div className="flex flex-col justify-between bg-surface-container-lowest p-5 rounded-2xl shadow-sm relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-outline uppercase tracking-wider">Điểm hài lòng khách (CSAT)</span>
                    <div className="mt-2 text-2xl font-bold font-headline text-on-surface flex items-baseline gap-1.5">
                      4.8
                      <span className="text-xs text-outline font-normal">/ 5.0</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined text-[22px]" style={{"fontVariationSettings":"'FILL' 1"}}>star</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex -space-x-1 overflow-hidden">
                    <div className="inline-block h-6 w-6 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center">96%</div>
                  </div>
                  <span className="text-xs text-on-surface font-medium">96% đánh giá tích cực</span>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs pt-1">
                  <span className="text-on-surface-variant font-medium">48 đánh giá mới</span>
                  <a className="text-primary hover:underline text-[11px] font-semibold flex items-center gap-0.5" href="#">
                    Xem nhận xét
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  </a>
                </div>
              </div>
            </div>
            {/* Main Content Grid (8 Cols Left / 4 Cols Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN (8 COLS) */}
              <div className="lg:col-span-8 flex flex-col gap-8">
                {/* Card 1: Chart Section: Doanh thu & Công suất theo tuần trong tháng */}
                <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-bold font-headline text-on-surface">Xu hướng doanh thu & Công suất theo ngày</h2>
                      <p className="text-xs text-on-surface-variant mt-0.5">Thống kê phân bổ 4 tuần trong tháng 10/2026</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-primary"></span>
                        <span className="text-on-surface-variant">Doanh thu gộp (Triệu ₫)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                        <span className="text-on-surface-variant">Công suất (%)</span>
                      </div>
                    </div>
                  </div>
                  {/* Custom Crisp Inline SVG Bar/Line Chart Visualization */}
                  <div className="relative w-full bg-surface-container-low/40 rounded-xl p-4 overflow-x-auto">
                    <div className="min-w-[540px]">
                      {/* Tooltip Highlight Tag */}
                      <div className="flex justify-end mb-2">
                        <div className="inline-flex items-center gap-1.5 bg-primary text-on-primary text-[11px] px-3 py-1 rounded-lg shadow-sm">
                          <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                          <span>
                            Tuần 3 & Cuối tuần: Đỉnh cao điểm đạt
                            <b>96%</b>
                            công suất
                          </span>
                        </div>
                      </div>
                      {/* SVG Data Chart */}
                      <svg className="w-full h-56" fill="none" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
                        {/* Horizontal Grid Lines */}
                        <line className="text-outline-variant/30" stroke="currentColor" strokeDasharray="3 3" x1="40" x2="580" y1="20" y2="20"></line>
                        <line className="text-outline-variant/30" stroke="currentColor" strokeDasharray="3 3" x1="40" x2="580" y1="65" y2="65"></line>
                        <line className="text-outline-variant/30" stroke="currentColor" strokeDasharray="3 3" x1="40" x2="580" y1="110" y2="110"></line>
                        <line className="text-outline-variant/40" stroke="currentColor" x1="40" x2="580" y1="155" y2="155"></line>
                        {/* Y Axis Labels */}
                        <text className="text-[10px] fill-outline font-medium" text-anchor="end" x="32" y="24">80M</text>
                        <text className="text-[10px] fill-outline font-medium" text-anchor="end" x="32" y="69">60M</text>
                        <text className="text-[10px] fill-outline font-medium" text-anchor="end" x="32" y="114">30M</text>
                        <text className="text-[10px] fill-outline font-medium" text-anchor="end" x="32" y="159">0</text>
                        {/* Week 1 (Oct 01 - 07) */}
                        {/* Bar */}
                        <rect className="fill-primary/85 hover:fill-primary transition-colors cursor-pointer" height="95" rx="4" width="34" x="85" y="60"></rect>
                        {/* Occupancy Line Point 1: 76% */}
                        {/* Week 2 (Oct 08 - 14) */}
                        <rect className="fill-primary/85 hover:fill-primary transition-colors cursor-pointer" height="107" rx="4" width="34" x="215" y="48"></rect>
                        {/* Week 3 (Oct 15 - 21 - Peak) */}
                        <rect className="fill-primary hover:fill-primary-container transition-colors cursor-pointer" height="129" rx="4" width="34" x="345" y="26"></rect>
                        {/* Week 4 (Oct 22 - 31) */}
                        <rect className="fill-primary/85 hover:fill-primary transition-colors cursor-pointer" height="113" rx="4" width="34" x="475" y="42"></rect>
                        {/* Line Chart Overlay: Occupancy Path */}
                        <path className="text-secondary" d="M 102 75 L 232 58 L 362 30 L 492 48" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></path>
                        {/* Points on line */}
                        <circle className="fill-surface-container-lowest stroke-secondary" cx="102" cy="75" r="5" strokeWidth="2.5"></circle>
                        <circle className="fill-surface-container-lowest stroke-secondary" cx="232" cy="58" r="5" strokeWidth="2.5"></circle>
                        <circle className="fill-secondary stroke-surface-container-lowest" cx="362" cy="30" r="6" strokeWidth="2.5"></circle>
                        <circle className="fill-surface-container-lowest stroke-secondary" cx="492" cy="48" r="5" strokeWidth="2.5"></circle>
                        {/* Data labels above points */}
                        <text className="text-[10px] fill-on-surface font-semibold" text-anchor="middle" x="102" y="94">78%</text>
                        <text className="text-[10px] fill-on-surface font-semibold" text-anchor="middle" x="232" y="78">84%</text>
                        <text className="text-[11px] fill-secondary font-bold" text-anchor="middle" x="362" y="20">96% (Đỉnh)</text>
                        <text className="text-[10px] fill-on-surface font-semibold" text-anchor="middle" x="492" y="68">86%</text>
                        {/* X Axis Labels */}
                        <text className="text-[11px] fill-on-surface-variant font-medium" text-anchor="middle" x="102" y="178">Tuần 1 (01-07)</text>
                        <text className="text-[11px] fill-on-surface-variant font-medium" text-anchor="middle" x="232" y="178">Tuần 2 (08-14)</text>
                        <text className="text-[11px] fill-on-surface-variant font-semibold" text-anchor="middle" x="362" y="178">Tuần 3 (15-21)</text>
                        <text className="text-[11px] fill-on-surface-variant font-medium" text-anchor="middle" x="492" y="178">Tuần 4 (22-31)</text>
                      </svg>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="bg-surface-container-low p-3 rounded-xl">
                      <span className="text-[11px] text-outline block">Doanh thu T3 (Cao nhất)</span>
                      <span className="text-sm font-bold text-on-surface">86.200.000 ₫</span>
                    </div>
                    <div className="bg-surface-container-low p-3 rounded-xl">
                      <span className="text-[11px] text-outline block">Đêm phòng bán T3</span>
                      <span className="text-sm font-bold text-on-surface">242 đêm</span>
                    </div>
                    <div className="bg-surface-container-low p-3 rounded-xl">
                      <span className="text-[11px] text-outline block">Lưu trú trung bình (LoS)</span>
                      <span className="text-sm font-bold text-on-surface">2.3 đêm/khách</span>
                    </div>
                    <div className="bg-surface-container-low p-3 rounded-xl">
                      <span className="text-[11px] text-outline block">Tỷ lệ hủy phòng</span>
                      <span className="text-sm font-bold text-tertiary">3.1% (Rất thấp)</span>
                    </div>
                  </div>
                </div>
                {/* Card 2: Bảng đối soát doanh thu chi tiết theo nguồn đặt phòng */}
                <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden flex flex-col">
                  <div className="p-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-base font-bold font-headline text-on-surface">Bảng đối soát doanh thu chi tiết theo nguồn đặt phòng</h2>
                      <p className="text-xs text-on-surface-variant mt-0.5">Minh bạch hoa hồng, trợ giá khuyến mãi và số tiền thực nhận</p>
                    </div>
                    <span className="text-xs text-outline">Kỳ tháng 10/2026</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container-low text-[11px] font-semibold uppercase tracking-wider text-outline">
                          <th className="py-3.5 px-6">Nguồn kênh</th>
                          <th className="py-3.5 px-4 text-center">Số lượt đặt</th>
                          <th className="py-3.5 px-4 text-right">Tổng tiền phòng</th>
                          <th className="py-3.5 px-4 text-right">Voucher tài trợ</th>
                          <th className="py-3.5 px-4 text-right">Phí StayReco (6%)</th>
                          <th className="py-3.5 px-4 text-right">Doanh thu thực nhận</th>
                          <th className="py-3.5 px-6 text-center">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20 text-xs">
                        {/* Row 1: StayReco Trực tiếp */}
                        <tr className="hover:bg-surface-container-low/60 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2.5">
                              <span className="w-7 h-7 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-[16px]">web</span>
                              </span>
                              <div className="flex flex-col">
                                <span className="font-bold text-on-surface">StayReco Trực tiếp</span>
                                <span className="text-[10px] text-outline">Website & Ứng dụng khách</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center font-medium text-on-surface">142 đơn</td>
                          <td className="py-4 px-4 text-right font-medium text-on-surface">177.500.000 ₫</td>
                          <td className="py-4 px-4 text-right font-medium text-secondary">-12.000.000 ₫</td>
                          <td className="py-4 px-4 text-right font-medium text-outline">-9.900.000 ₫</td>
                          <td className="py-4 px-4 text-right font-bold text-primary text-sm">155.600.000 ₫</td>
                          <td className="py-4 px-6 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-tertiary-fixed text-on-tertiary-fixed">
                              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                              Đã quyết toán
                            </span>
                          </td>
                        </tr>
                        {/* Row 2: StayReco AI Assistant */}
                        <tr className="hover:bg-surface-container-low/60 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2.5">
                              <span className="w-7 h-7 rounded-lg bg-secondary-fixed flex items-center justify-center text-secondary">
                                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                              </span>
                              <div className="flex flex-col">
                                <span className="font-bold text-on-surface">StayReco AI Assistant</span>
                                <span className="text-[10px] text-outline">Gợi ý lộ trình cá nhân hoá</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center font-medium text-on-surface">68 đơn</td>
                          <td className="py-4 px-4 text-right font-medium text-on-surface">85.000.000 ₫</td>
                          <td className="py-4 px-4 text-right font-medium text-secondary">-6.500.000 ₫</td>
                          <td className="py-4 px-4 text-right font-medium text-outline">-4.700.000 ₫</td>
                          <td className="py-4 px-4 text-right font-bold text-primary text-sm">73.800.000 ₫</td>
                          <td className="py-4 px-6 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-tertiary-fixed text-on-tertiary-fixed">
                              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                              Đã quyết toán
                            </span>
                          </td>
                        </tr>
                        {/* Row 3: Khách thân thiết QR */}
                        <tr className="hover:bg-surface-container-low/60 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2.5">
                              <span className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                                <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                              </span>
                              <div className="flex flex-col">
                                <span className="font-bold text-on-surface">Khách thân thiết QR</span>
                                <span className="text-[10px] text-outline">Đặt trực tiếp tại quầy / Loyalty</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center font-medium text-on-surface">18 đơn</td>
                          <td className="py-4 px-4 text-right font-medium text-on-surface">22.500.000 ₫</td>
                          <td className="py-4 px-4 text-right font-medium text-outline">0 ₫</td>
                          <td className="py-4 px-4 text-right font-medium text-outline">-1.350.000 ₫</td>
                          <td className="py-4 px-4 text-right font-bold text-primary text-sm">21.150.000 ₫</td>
                          <td className="py-4 px-6 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-secondary-fixed text-on-secondary-fixed">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                              Chờ đối soát
                            </span>
                          </td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr className="bg-surface-container font-semibold text-xs text-on-surface">
                          <td className="py-3 px-6">Tổng cộng tháng 10</td>
                          <td className="py-3 px-4 text-center">228 đơn</td>
                          <td className="py-3 px-4 text-right">285.000.000 ₫</td>
                          <td className="py-3 px-4 text-right text-secondary">-18.500.000 ₫</td>
                          <td className="py-3 px-4 text-right text-outline">-15.950.000 ₫</td>
                          <td className="py-3 px-4 text-right text-base font-bold text-primary">250.550.000 ₫</td>
                          <td className="py-3 px-6 text-center text-[11px] text-on-surface-variant">Kỳ thanh toán ngày 05/11</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
              {/* RIGHT COLUMN (4 COLS) */}
              <div className="lg:col-span-4 flex flex-col gap-8">
                {/* Card 1: Cơ cấu phòng bán chạy nhất */}
                <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <h2 className="text-base font-bold font-headline text-on-surface">Cơ cấu phòng bán chạy</h2>
                      <span className="text-xs text-on-surface-variant">Tỷ trọng doanh thu & công suất</span>
                    </div>
                    <span className="material-symbols-outlined text-outline text-[20px]">pie_chart</span>
                  </div>
                  {/* Room items list */}
                  <div className="flex flex-col gap-4">
                    {/* Room 1 */}
                    <div className="flex flex-col gap-2 p-3 rounded-xl bg-surface-container-low/40 hover:bg-surface-container-low transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-on-surface">1. Deluxe River View</span>
                          <span className="text-[11px] text-outline">14 phòng • Hướng sông Hàn</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-primary">36%</span>
                          <span className="text-[10px] text-outline block">doanh thu</span>
                        </div>
                      </div>
                      {/* Progress Bar Occupancy */}
                      <div className="flex items-center gap-2">
                        <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{"width":"92%"}}></div>
                        </div>
                        <span className="text-[10px] font-semibold text-on-surface whitespace-nowrap">92% lấp đầy</span>
                      </div>
                    </div>
                    {/* Room 2 */}
                    <div className="flex flex-col gap-2 p-3 rounded-xl bg-surface-container-low/40 hover:bg-surface-container-low transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-on-surface">2. Riverside Suite ban công lớn</span>
                          <span className="text-[11px] text-outline">6 phòng • Bồn tắm đá ngoài trời</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-primary">28%</span>
                          <span className="text-[10px] text-outline block">doanh thu</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{"width":"88%"}}></div>
                        </div>
                        <span className="text-[10px] font-semibold text-on-surface whitespace-nowrap">88% lấp đầy</span>
                      </div>
                    </div>
                    {/* Room 3 */}
                    <div className="flex flex-col gap-2 p-3 rounded-xl bg-surface-container-low/40 hover:bg-surface-container-low transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-on-surface">3. Superior Garden View</span>
                          <span className="text-[11px] text-outline">10 phòng • Khu vườn tĩnh lặng</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-primary">24%</span>
                          <span className="text-[10px] text-outline block">doanh thu</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{"width":"78%"}}></div>
                        </div>
                        <span className="text-[10px] font-semibold text-on-surface whitespace-nowrap">78% lấp đầy</span>
                      </div>
                    </div>
                    {/* Room 4 */}
                    <div className="flex flex-col gap-2 p-3 rounded-xl bg-surface-container-low/40 hover:bg-surface-container-low transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-on-surface">4. Studio Tiêu chuẩn</span>
                          <span className="text-[11px] text-outline">6 phòng • Tiện nghi tối giản</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-primary">12%</span>
                          <span className="text-[10px] text-outline block">doanh thu</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{"width":"74%"}}></div>
                        </div>
                        <span className="text-[10px] font-semibold text-on-surface whitespace-nowrap">74% lấp đầy</span>
                      </div>
                    </div>
                  </div>
                  <a className="w-full py-2.5 text-center rounded-xl bg-surface-container text-xs font-semibold text-primary hover:bg-surface-container-high transition-colors" href="#">Quản lý biểu giá từng hạng phòng</a>
                </div>
                {/* Card 2: Tác vụ cần chủ khách sạn xử lý (Pending Actions) */}
                <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span>
                      <h2 className="text-base font-bold font-headline text-on-surface">Tác vụ cần xử lý</h2>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-secondary-fixed text-on-secondary-fixed">3 cần làm</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {/* Action 1: Cập nhật giá pháo hoa */}
                    <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col gap-2">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">notification_important</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-on-surface">Cập nhật giá mùa cao điểm</span>
                          <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">Lễ hội Pháo hoa quốc tế (DIFF): Chưa thiết lập luật giá điều chỉnh +25% cho các phòng view sông.</p>
                        </div>
                      </div>
                      <div className="flex justify-end pt-1">
                        <a className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-[11px] font-semibold hover:bg-primary-container transition-colors" href="#">Thiết lập giá ngay</a>
                      </div>
                    </div>
                    {/* Action 2: Duyệt chiến dịch khuyến mãi */}
                    <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col gap-2">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">local_offer</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-on-surface">Duyệt chiến dịch khuyến mãi</span>
                          <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">Chiến dịch 'Mùa Vàng Ven Sông' do Quản lý Lễ tân đề xuất giảm 10% cho lưu trú &gt; 3 đêm.</p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button className="px-2.5 py-1.5 rounded-lg bg-surface-container-highest text-on-surface-variant text-[11px] font-medium hover:bg-surface-dim transition-colors">Xem chi tiết</button>
                        <button className="px-3 py-1.5 rounded-lg bg-tertiary text-on-tertiary text-[11px] font-semibold hover:bg-tertiary-container transition-colors">Phê duyệt</button>
                      </div>
                    </div>
                    {/* Action 3: Bổ sung ảnh thực tế bồn tắm đá */}
                    <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col gap-2">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-outline text-[20px] mt-0.5">add_a_photo</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-on-surface">Bổ sung ảnh chụp thực tế</span>
                          <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">Hạng Riverside Suite vừa hoàn tất nâng cấp bồn tắm đá tự nhiên ngoài trời. Cần ảnh chuẩn để tăng 15% booking.</p>
                        </div>
                      </div>
                      <div className="flex justify-end pt-1">
                        <button className="px-3 py-1.5 rounded-lg bg-surface-container-highest text-on-surface text-[11px] font-semibold hover:bg-surface-dim transition-colors">Tải ảnh lên</button>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Hotel Direct Link / Support Assist Widget */}
                <div className="p-5 rounded-2xl bg-surface-container-low flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm">
                      <span className="material-symbols-outlined text-[20px]">support_agent</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-on-surface">Hỗ trợ đối tác StayReco</span>
                      <span className="text-[11px] text-on-surface-variant">Hotline ưu tiên: 1900 6822</span>
                    </div>
                  </div>
                  <button className="text-xs font-semibold text-primary hover:underline">Liên hệ</button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
