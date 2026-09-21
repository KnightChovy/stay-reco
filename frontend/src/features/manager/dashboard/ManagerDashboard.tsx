/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Legacy JSX screen pending React state migration.
import React from "react";

export default function ManagerDashboard() {
  return (
    <div className="bg-surface font-body text-on-surface antialiased">
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-lowest z-50 flex flex-col shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-6 flex items-center gap-3 bg-surface-container-lowest">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">
              holiday_village
            </span>
            <span className="font-headline font-bold text-lg tracking-tight text-primary">
              StayReco
            </span>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded bg-primary-fixed text-on-primary-fixed leading-tight">
            Manager
          </span>
        </div>
        <div className="px-4 py-3">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/80">
            Quản trị nền tảng
          </div>
        </div>
        <nav
          className="flex-1 px-3 space-y-1 overflow-y-auto"
          data-active-classes="bg-primary-container text-on-primary font-semibold shadow-[0_2px_8px_rgba(35,78,112,0.12)]"
        >
          <a
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
            data-path="tong-quan-&-tang-truong"
            href="#"
          >
            <span className="material-symbols-outlined text-xl">analytics</span>
            <span>Tổng quan & Tăng trưởng</span>
          </a>
          <a
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
            data-path="duyet-ho-so-doi-tac"
            href="#"
          >
            <span className="material-symbols-outlined text-xl">
              verified_user
            </span>
            <span>Duyệt hồ sơ đối tác</span>
          </a>
          <a
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
            data-path="giam-sat-doi-tac"
            href="#"
          >
            <span className="material-symbols-outlined text-xl">
              storefront
            </span>
            <span>Giám sát đối tác</span>
          </a>
          <a
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
            data-path="tuan-thu-&-vi-pham"
            href="#"
          >
            <span className="material-symbols-outlined text-xl">gavel</span>
            <span>Tuân thủ & Vi phạm</span>
          </a>
          <a
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
            data-path="doanh-thu-&-hoa-hong"
            href="#"
          >
            <span className="material-symbols-outlined text-xl">payments</span>
            <span>Doanh thu & Hoa hồng</span>
          </a>
        </nav>
        <div className="p-4 mt-auto bg-surface-container-lowest">
          <div className="p-3 rounded-xl bg-surface-container-low flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></div>
            <div className="text-xs">
              <div className="font-medium text-on-surface">
                Hệ thống bình thường
              </div>
              <div className="text-[11px] text-on-surface-variant">
                SLA hạ tầng: 99.98%
              </div>
            </div>
          </div>
        </div>
      </aside>
      <div className="pl-64">
        <header className="fixed top-0 left-64 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 px-6 flex items-center justify-between gap-6">
          <div className="flex-1 max-w-xl">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-xl pointer-events-none">
                search
              </span>
              <input
                className="w-full h-10 pl-10 pr-4 rounded-lg bg-surface-container-low border-0 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary-container transition-all"
                placeholder="Tìm kiếm đối tác, khách sạn, hồ sơ thẩm định... (Ctrl+K)"
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-low">
              <span className="w-2 h-2 rounded-full bg-tertiary"></span>
              <span className="text-xs font-medium text-on-surface-variant">
                Hệ thống vận hành bình thường
              </span>
            </div>
            <button
              aria-label="Notifications"
              className="relative w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-22">
                notifications
              </span>
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-secondary text-on-secondary text-[10px] font-bold rounded-full flex items-center justify-center">
                3
              </span>
            </button>
            <div className="h-8 w-px bg-surface-container-high"></div>
            <div className="flex items-center gap-3 pl-1">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-on-surface leading-snug">
                  Lê Hoàng Quân
                </div>
                <div className="text-[11px] text-on-surface-variant leading-none">
                  Chuyên viên Quản lý Nền tảng (Miền Trung)
                </div>
              </div>
              <img
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-surface-container-high"
                src="https://lh3.googleusercontent.com/aida/AEtjO1V-SCfN5vRag32eaaMCe725o3qjMzRhq78BRcuhKmOXxEDu4G8qm577peTkqU28fF62pdny08VmbaOwjGzlFo32VJpAA8SPA924onlWgQ2t92x5iGKeuhw1fCMiUdigsg6mge97P7ahRot5alw95ynt0-n2m7IucAr968MgN5mTjYAV6AnplZ0Xx-7f4H3KdFhb1vm9RS4hCaI81jJK3nFDIJCSwTS5926q0xHmfGl3sY60Y-Y_wuhSWwMDAhg2Nz8K1d9sN9cn"
              />
            </div>
          </div>
        </header>
        <main className="relative pt-16 bg-surface min-h-screen">
          <div className="flex flex-col w-full px-8 py-8 space-y-8 max-w-[1600px] mx-auto">
            {/* Top Command & Breadcrumbs Area */}
            <div className="flex flex-col gap-4">
              {/* Breadcrumb Hierarchy */}
              <nav className="flex items-center gap-2 text-xs text-on-surface-variant font-medium tracking-wide">
                <span className="hover:text-primary transition-colors cursor-pointer">
                  Quản trị nền tảng
                </span>
                <span className="material-symbols-outlined text-sm text-outline">
                  chevron_right
                </span>
                <span className="text-primary font-semibold">
                  Tổng quan & Tăng trưởng
                </span>
                <span className="mx-2 text-outline-variant">•</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-[11px] font-mono text-on-surface-variant">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                  LIVE_FEED: ACTIVE
                </span>
              </nav>
              {/* Page Title & Operational Filter Bar */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                  <h1 className="font-headline text-2xl lg:text-3xl font-bold tracking-tight text-primary">
                    Báo cáo Tổng quan & Chỉ số Tăng trưởng Nền tảng StayReco
                  </h1>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Hệ thống giám sát hiệu suất đối tác, điều phối thẩm định
                    thực địa và dòng tiền hoa hồng khu vực Miền Trung & Toàn
                    quốc.
                  </p>
                </div>
                {/* Filters Ribbon */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Date Filter Pill */}
                  <div className="flex items-center bg-surface-container-lowest shadow-sm rounded-xl px-3.5 py-2 text-xs font-medium text-on-surface">
                    <span className="material-symbols-outlined text-primary-container text-lg mr-2">
                      calendar_today
                    </span>
                    <span>Tháng 10/2026 (01/10/2026 - 31/10/2026)</span>
                    <span className="mx-2 text-surface-container-highest">
                      |
                    </span>
                    <span className="inline-flex items-center text-tertiary font-semibold bg-tertiary-fixed/40 px-2 py-0.5 rounded">
                      <span className="material-symbols-outlined text-xs mr-0.5">
                        trending_up
                      </span>
                      +16.4%
                    </span>
                    <button
                      className="ml-2 text-on-surface-variant hover:text-primary"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">
                        expand_more
                      </span>
                    </button>
                  </div>
                  {/* Region Selector */}
                  <div className="relative inline-flex items-center bg-surface-container-lowest shadow-sm rounded-xl p-1">
                    <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-container text-on-primary shadow-sm transition-all">
                      Toàn quốc
                    </button>
                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:text-on-surface transition-colors">
                      Miền Trung
                      <span className="text-[10px] text-outline font-normal">
                        (ĐN, HA, Huế)
                      </span>
                    </button>
                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:text-on-surface transition-colors">
                      Tây Nguyên
                      <span className="text-[10px] text-outline font-normal">
                        (Đà Lạt)
                      </span>
                    </button>
                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:text-on-surface transition-colors">
                      Miền Nam
                      <span className="text-[10px] text-outline font-normal">
                        (Phú Quốc)
                      </span>
                    </button>
                  </div>
                  {/* Refresh Action */}
                  <button
                    className="w-10 h-10 rounded-xl bg-surface-container-lowest shadow-sm flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-all"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-lg">
                      sync
                    </span>
                  </button>
                </div>
              </div>
            </div>
            {/* KPI Pulse Overview Cards (4 Metric Bento) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {/* Card 1: Review Queue Urgent */}
              <div className="relative overflow-hidden bg-surface-container-lowest rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
                      Cần xử lý ngay
                    </span>
                    <h3 className="text-sm font-semibold text-on-surface-variant mt-1.5">
                      Hồ sơ đối tác chờ duyệt
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-secondary-fixed/50 text-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">
                      pending_actions
                    </span>
                  </div>
                </div>
                <div className="my-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline text-3xl font-bold tracking-tight text-on-surface">
                      14
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">
                      hồ sơ tồn đọng
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-error font-medium">
                    <span className="material-symbols-outlined text-sm">
                      warning
                    </span>
                    <span>
                      Đang quá hạn 24h:
                      <strong>3 hồ sơ</strong>
                    </span>
                  </div>
                </div>
                <div className="pt-3 bg-surface-container-lowest flex items-center justify-between">
                  <a
                    className="inline-flex items-center text-xs font-semibold text-secondary hover:text-on-secondary-container transition-colors gap-1 group"
                    href="#"
                  >
                    <span>Xem hàng đợi duyệt</span>
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">
                      arrow_forward
                    </span>
                  </a>
                  <span className="text-[10px] font-mono text-outline">
                    SLA Thẩm định: 94.2%
                  </span>
                </div>
              </div>
              {/* Card 2: Active Hospitality Partners */}
              <div className="relative overflow-hidden bg-surface-container-lowest rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Mạng lưới vận hành
                    </span>
                    <h3 className="text-sm font-semibold text-on-surface-variant mt-1.5">
                      Đối tác lưu trú đang hoạt động
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">
                      hotel_class
                    </span>
                  </div>
                </div>
                <div className="my-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline text-3xl font-bold tracking-tight text-on-surface">
                      186
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">
                      cơ sở đạt chuẩn
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center text-tertiary font-semibold">
                      <span className="material-symbols-outlined text-xs mr-0.5">
                        add_circle
                      </span>
                      +12 mới
                    </span>
                    <span className="text-outline-variant">•</span>
                    <span className="text-on-surface-variant">
                      Tỷ lệ duy trì
                      <strong className="text-on-surface">98.2%</strong>
                    </span>
                  </div>
                </div>
                <div className="pt-3 bg-surface-container-lowest flex items-center justify-between text-xs text-on-surface-variant">
                  <span>
                    Công suất phòng TB:
                    <strong>72.4%</strong>
                  </span>
                  <span className="text-[10px] font-mono text-tertiary">
                    Chất lượng cao
                  </span>
                </div>
              </div>
              {/* Card 3: Platform GMV */}
              <div className="relative overflow-hidden bg-surface-container-lowest rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Quy mô giao dịch
                    </span>
                    <h3 className="text-sm font-semibold text-on-surface-variant mt-1.5">
                      Tổng lượng đặt phòng toàn sàn (GMV)
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">
                      query_stats
                    </span>
                  </div>
                </div>
                <div className="my-3">
                  <div className="flex items-baseline gap-1">
                    <span className="font-headline text-2xl lg:text-[26px] font-bold tracking-tight text-on-surface">
                      4.850.000.000
                    </span>
                    <span className="text-sm font-bold text-on-surface-variant">
                      ₫
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-on-surface-variant">
                    <span>
                      Booking:
                      <strong className="text-on-surface">3.820 lượt</strong>
                    </span>
                    <span className="text-outline-variant">•</span>
                    <span>
                      RevPAR TB:
                      <strong className="text-on-surface">1.15M ₫</strong>
                    </span>
                  </div>
                </div>
                <div className="pt-3 bg-surface-container-lowest flex items-center justify-between text-xs">
                  <span className="text-tertiary font-semibold flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-xs">
                      arrow_upward
                    </span>
                    +18.2% MoM
                  </span>
                  <span className="text-[11px] text-outline">
                    Chu kỳ: T10/2026
                  </span>
                </div>
              </div>
              {/* Card 4: Platform Net Revenue / Commission */}
              <div className="relative overflow-hidden bg-primary-container text-on-primary rounded-2xl p-5 shadow-md flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-primary-container bg-surface-container-lowest/10 px-2 py-0.5 rounded-full inline-block">
                      Take-rate 6% Cố định
                    </span>
                    <h3 className="text-sm font-semibold text-surface-variant mt-1.5">
                      Doanh thu hoa hồng StayReco
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-surface-container-lowest/10 text-on-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">
                      account_balance_wallet
                    </span>
                  </div>
                </div>
                <div className="my-3">
                  <div className="flex items-baseline gap-1">
                    <span className="font-headline text-2xl lg:text-[26px] font-bold tracking-tight text-on-primary">
                      291.000.000
                    </span>
                    <span className="text-sm font-bold text-on-primary-container">
                      ₫
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-surface-container-high/90 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Đã đối soát thu hồi:</span>
                      <span className="font-semibold text-on-primary">
                        245.000.000 ₫
                      </span>
                    </div>
                    <div className="flex justify-between text-secondary-fixed">
                      <span>Công nợ chu kỳ:</span>
                      <span className="font-bold">46.000.000 ₫</span>
                    </div>
                  </div>
                </div>
                <div className="pt-3 bg-surface-container-lowest/10 -mx-5 -mb-5 px-5 py-2.5 flex items-center justify-between text-xs text-on-primary-container">
                  <span>
                    Tỷ lệ hoàn tất đối soát:
                    <strong>84.2%</strong>
                  </span>
                  <span className="material-symbols-outlined text-sm">
                    shield_with_heart
                  </span>
                </div>
              </div>
            </div>
            {/* Primary Workspace Split: Left (2/3) + Right (1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column (8 cols): Trend Analytics & Top Partner Ledger */}
              <div className="lg:col-span-8 space-y-8 min-w-0">
                {/* Chart Module: 6-Month Trajectory */}
                <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
                        <h2 className="font-headline text-lg font-bold text-on-surface">
                          Xu hướng Tăng trưởng Booking & Doanh thu Hoa hồng
                        </h2>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Chu kỳ 6 tháng gần nhất (Tháng 5/2026 - Tháng 10/2026)
                        trên toàn bộ danh mục lưu trú boutique
                      </p>
                    </div>
                    {/* Legend indicators */}
                    <div className="flex items-center gap-4 text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-primary-container"></span>
                        <span className="text-on-surface-variant">
                          Hoa hồng sàn (Triệu VNĐ)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-1.5 rounded-full bg-secondary"></span>
                        <span className="text-on-surface-variant">
                          Lượt booking hoàn tất
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Inline SVG Visualization Chart */}
                  <div className="relative w-full h-72 pt-4">
                    <svg
                      className="w-full h-full overflow-visible"
                      preserveAspectRatio="none"
                      viewBox="0 0 760 220"
                    >
                      {/* Grid Guidelines */}
                      <line
                        className="text-surface-container-high"
                        stroke="currentColor"
                        strokeDasharray="3 3"
                        x1="40"
                        x2="740"
                        y1="20"
                        y2="20"
                      ></line>
                      <line
                        className="text-surface-container-high"
                        stroke="currentColor"
                        strokeDasharray="3 3"
                        x1="40"
                        x2="740"
                        y1="70"
                        y2="70"
                      ></line>
                      <line
                        className="text-surface-container-high"
                        stroke="currentColor"
                        strokeDasharray="3 3"
                        x1="40"
                        x2="740"
                        y1="120"
                        y2="120"
                      ></line>
                      <line
                        className="text-surface-container-high"
                        stroke="currentColor"
                        strokeDasharray="3 3"
                        x1="40"
                        x2="740"
                        y1="170"
                        y2="170"
                      ></line>
                      <line
                        className="text-surface-variant"
                        stroke="currentColor"
                        x1="40"
                        x2="740"
                        y1="200"
                        y2="200"
                      ></line>
                      {/* Y-Axis labels (Revenue in Millions) */}
                      <text
                        className="text-[10px] fill-on-surface-variant font-mono"
                        text-anchor="end"
                        x="32"
                        y="24"
                      >
                        300M
                      </text>
                      <text
                        className="text-[10px] fill-on-surface-variant font-mono"
                        text-anchor="end"
                        x="32"
                        y="74"
                      >
                        225M
                      </text>
                      <text
                        className="text-[10px] fill-on-surface-variant font-mono"
                        text-anchor="end"
                        x="32"
                        y="124"
                      >
                        150M
                      </text>
                      <text
                        className="text-[10px] fill-on-surface-variant font-mono"
                        text-anchor="end"
                        x="32"
                        y="174"
                      >
                        75M
                      </text>
                      {/* Bars (Coastal Blue #234e70 -> primary-container) */}
                      {/* Month 5: 182M (y = 200 - 182*0.6 = 90.8) */}
                      <rect
                        className="fill-primary-container opacity-85 hover:opacity-100 transition-opacity"
                        height="109"
                        rx="4"
                        width="36"
                        x="75"
                        y="91"
                      ></rect>
                      {/* Month 6: 198M (y = 200 - 198*0.6 = 81.2) */}
                      <rect
                        className="fill-primary-container opacity-85 hover:opacity-100 transition-opacity"
                        height="119"
                        rx="4"
                        width="36"
                        x="195"
                        y="81"
                      ></rect>
                      {/* Month 7: 230M (y = 200 - 230*0.6 = 62) */}
                      <rect
                        className="fill-primary-container opacity-85 hover:opacity-100 transition-opacity"
                        height="138"
                        rx="4"
                        width="36"
                        x="315"
                        y="62"
                      ></rect>
                      {/* Month 8: 242M (y = 200 - 242*0.6 = 54.8) */}
                      <rect
                        className="fill-primary-container opacity-85 hover:opacity-100 transition-opacity"
                        height="145"
                        rx="4"
                        width="36"
                        x="435"
                        y="55"
                      ></rect>
                      {/* Month 9: 250M (y = 200 - 250*0.6 = 50) */}
                      <rect
                        className="fill-primary-container opacity-85 hover:opacity-100 transition-opacity"
                        height="150"
                        rx="4"
                        width="36"
                        x="555"
                        y="50"
                      ></rect>
                      {/* Month 10: 291M (y = 200 - 291*0.6 = 25.4) */}
                      <rect
                        className="fill-primary shadow-lg"
                        height="175"
                        rx="4"
                        width="36"
                        x="675"
                        y="25"
                      ></rect>
                      {/* Line: Booking volume trend (Terracotta #934a33 / secondary) */}
                      <polyline
                        className="text-secondary"
                        fill="none"
                        points="93,125 213,115 333,80 453,72 573,65 693,32"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3.5"
                      ></polyline>
                      {/* Marker points on Trendline */}
                      <circle
                        className="fill-surface-container-lowest stroke-secondary"
                        cx="93"
                        cy="125"
                        r="4.5"
                        strokeWidth="2.5"
                      ></circle>
                      <circle
                        className="fill-surface-container-lowest stroke-secondary"
                        cx="213"
                        cy="115"
                        r="4.5"
                        strokeWidth="2.5"
                      ></circle>
                      <circle
                        className="fill-surface-container-lowest stroke-secondary"
                        cx="333"
                        cy="80"
                        r="4.5"
                        strokeWidth="2.5"
                      ></circle>
                      <circle
                        className="fill-surface-container-lowest stroke-secondary"
                        cx="453"
                        cy="72"
                        r="4.5"
                        strokeWidth="2.5"
                      ></circle>
                      <circle
                        className="fill-surface-container-lowest stroke-secondary"
                        cx="573"
                        cy="65"
                        r="4.5"
                        strokeWidth="2.5"
                      ></circle>
                      <circle
                        className="fill-secondary stroke-surface-container-lowest"
                        cx="693"
                        cy="32"
                        r="5.5"
                        strokeWidth="2.5"
                      ></circle>
                      {/* Month Labels on X Axis */}
                      <text
                        className="text-[11px] fill-on-surface-variant font-medium"
                        text-anchor="middle"
                        x="93"
                        y="216"
                      >
                        T5/26
                      </text>
                      <text
                        className="text-[11px] fill-on-surface-variant font-medium"
                        text-anchor="middle"
                        x="213"
                        y="216"
                      >
                        T6/26
                      </text>
                      <text
                        className="text-[11px] fill-on-surface-variant font-medium"
                        text-anchor="middle"
                        x="333"
                        y="216"
                      >
                        T7/26
                      </text>
                      <text
                        className="text-[11px] fill-on-surface-variant font-medium"
                        text-anchor="middle"
                        x="453"
                        y="216"
                      >
                        T8/26
                      </text>
                      <text
                        className="text-[11px] fill-on-surface-variant font-medium"
                        text-anchor="middle"
                        x="573"
                        y="216"
                      >
                        T9/26
                      </text>
                      <text
                        className="text-[11px] fill-primary font-bold"
                        text-anchor="middle"
                        x="693"
                        y="216"
                      >
                        T10/26
                      </text>
                    </svg>
                  </div>
                  {/* Secondary metric ribbon beneath chart */}
                  <div className="mt-6 pt-4 bg-surface-container-low/50 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">
                        verified
                      </span>
                      <span className="text-on-surface-variant">
                        Tỷ lệ chuyển đổi đặt phòng trung bình sàn:
                        <strong className="text-on-surface">3.42%</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-on-surface-variant">
                        Mùa cao điểm du lịch Thu - Đông
                      </span>
                      <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-semibold text-[10px]">
                        Tăng trưởng vượt chỉ tiêu 12%
                      </span>
                    </div>
                  </div>
                </div>
                {/* High Performing Partners Ledger */}
                <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="font-headline text-lg font-bold text-on-surface">
                        Top 5 Đối tác khách sạn hiệu quả cao nhất tháng 10
                      </h2>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Xếp hạng theo tổng doanh thu phòng thực tế và tỷ lệ CSAT
                        từ khách lưu trú
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-container-low text-primary hover:bg-surface-container transition-colors flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">
                          download
                        </span>
                        <span>Xuất báo cáo Excel</span>
                      </button>
                      <a
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-surface-container-low transition-colors"
                        href="#"
                      >
                        Xem tất cả (186)
                      </a>
                    </div>
                  </div>
                  {/* Table Container */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-surface-container-low text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                        <tr>
                          <th className="py-3 px-5">Tên cơ sở lưu trú</th>
                          <th className="py-3 px-4">Khu vực</th>
                          <th className="py-3 px-3 text-center">Quy mô</th>
                          <th className="py-3 px-3 text-center">Booking</th>
                          <th className="py-3 px-4 text-right">
                            Doanh thu phòng
                          </th>
                          <th className="py-3 px-4 text-right">
                            Hoa hồng (6%)
                          </th>
                          <th className="py-3 px-4 text-center">
                            Đánh giá (CSAT)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-none text-xs font-medium text-on-surface">
                        {/* Row 1 */}
                        <tr className="hover:bg-surface-container-low transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center font-bold text-primary text-xs">
                                01
                              </div>
                              <div>
                                <div className="font-semibold text-primary text-sm">
                                  An Nhiên Riverside Hotel
                                </div>
                                <div className="text-[11px] text-on-surface-variant">
                                  Boutique Riverfront • Mã: #DN-8821
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-on-surface-variant">
                            Hải Châu, Đà Nẵng
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono">
                            36 phòng
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold text-primary">
                            228 đơn
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold">
                            285.000.000 ₫
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-secondary">
                            17.100.000 ₫
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold text-[11px]">
                              <span
                                className="material-symbols-outlined text-xs"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                star
                              </span>
                              4.8
                            </span>
                          </td>
                        </tr>
                        {/* Row 2 */}
                        <tr className="hover:bg-surface-container-low transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center font-bold text-primary text-xs">
                                02
                              </div>
                              <div>
                                <div className="font-semibold text-primary text-sm">
                                  Phố Hoài Heritage Villa
                                </div>
                                <div className="text-[11px] text-on-surface-variant">
                                  Di sản & Trải nghiệm • Mã: #HA-1049
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-on-surface-variant">
                            Phố cổ Hội An
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono">
                            24 phòng
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold text-primary">
                            196 đơn
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold">
                            215.600.000 ₫
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-secondary">
                            12.936.000 ₫
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold text-[11px]">
                              <span
                                className="material-symbols-outlined text-xs"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                star
                              </span>
                              4.7
                            </span>
                          </td>
                        </tr>
                        {/* Row 3 */}
                        <tr className="hover:bg-surface-container-low transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center font-bold text-primary text-xs">
                                03
                              </div>
                              <div>
                                <div className="font-semibold text-primary text-sm">
                                  Mộc Nhiên Eco-Lodge
                                </div>
                                <div className="text-[11px] text-on-surface-variant">
                                  Thiên nhiên & Chữa lành • Mã: #DL-3392
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-on-surface-variant">
                            Đồi thông Đà Lạt
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono">
                            18 phòng
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold text-primary">
                            172 đơn
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold">
                            249.400.000 ₫
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-secondary">
                            14.964.000 ₫
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold text-[11px]">
                              <span
                                className="material-symbols-outlined text-xs"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                star
                              </span>
                              4.8
                            </span>
                          </td>
                        </tr>
                        {/* Row 4 */}
                        <tr className="hover:bg-surface-container-low transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center font-bold text-primary text-xs">
                                04
                              </div>
                              <div>
                                <div className="font-semibold text-primary text-sm">
                                  Sunset Bay Boutique Retreat
                                </div>
                                <div className="text-[11px] text-on-surface-variant">
                                  Resort Biển Riêng biệt • Mã: #PQ-9912
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-on-surface-variant">
                            Bãi Khem, Phú Quốc
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono">
                            30 phòng
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold text-primary">
                            165 đơn
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold">
                            354.750.000 ₫
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-secondary">
                            21.285.000 ₫
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold text-[11px]">
                              <span
                                className="material-symbols-outlined text-xs"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                star
                              </span>
                              4.9
                            </span>
                          </td>
                        </tr>
                        {/* Row 5 */}
                        <tr className="hover:bg-surface-container-low transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center font-bold text-primary text-xs">
                                05
                              </div>
                              <div>
                                <div className="font-semibold text-primary text-sm">
                                  Sen Boutique Heritage
                                </div>
                                <div className="text-[11px] text-on-surface-variant">
                                  Nghệ thuật & Trà đạo • Mã: #DN-5510
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-on-surface-variant">
                            Hải Châu, Đà Nẵng
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono">
                            20 phòng
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold text-primary">
                            142 đơn
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold">
                            170.400.000 ₫
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-secondary">
                            10.224.000 ₫
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-bold text-[11px]">
                              <span
                                className="material-symbols-outlined text-xs text-secondary"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                star
                              </span>
                              4.6
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 bg-surface-container-low/40 flex items-center justify-between text-xs text-on-surface-variant">
                    <span>
                      Hiển thị 5 trong tổng số 186 cơ sở lưu trú tháng 10/2026
                    </span>
                    <div className="flex items-center gap-1 font-medium">
                      <span className="px-2 py-1 rounded bg-surface-container-lowest shadow-xs text-primary font-bold">
                        1
                      </span>
                      <span className="px-2 py-1 cursor-pointer hover:text-on-surface">
                        2
                      </span>
                      <span className="px-2 py-1 cursor-pointer hover:text-on-surface">
                        3
                      </span>
                      <span className="px-1 text-outline">...</span>
                      <span className="px-2 py-1 cursor-pointer hover:text-on-surface">
                        38
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Right Column (4 cols): Overdue SLA Review Queue & Compliance Radar */}
              <div className="lg:col-span-4 space-y-6">
                {/* Card: Urgent Partner Verification Queue (Overdue SLA) */}
                <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex flex-col space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-xl">
                          priority_high
                        </span>
                        <h2 className="font-headline text-base font-bold text-on-surface">
                          Hàng đợi tác vụ cần thẩm định khẩn cấp
                        </h2>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Hồ sơ đối tác vượt ngưỡng SLA cảnh báo hoặc cần đối soát
                        thực địa
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold text-xs">
                      3 hồ sơ
                    </span>
                  </div>
                  {/* Task List Items */}
                  <div className="space-y-3">
                    {/* Item 1 */}
                    <div className="p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-primary">
                          An Nhiên Riverside Hotel
                        </h4>
                        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-secondary-fixed-dim text-on-secondary-fixed">
                          Hôm nay 17:00
                        </span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                        Thẩm định thực địa đợt 2 - Xác thực số lượng phòng Suite
                        & tiêu chuẩn an toàn hồ bơi tại Hải Châu, Đà Nẵng.
                      </p>
                      <div className="mt-2.5 flex items-center justify-between text-[11px]">
                        <span className="text-secondary font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">
                            schedule
                          </span>
                          Chuyên viên: Hoàng Quân
                        </span>
                        <button className="text-primary font-bold hover:underline">
                          Chi tiết
                        </button>
                      </div>
                    </div>
                    {/* Item 2 */}
                    <div className="p-3.5 rounded-xl bg-error-container/20 border-l-4 border-error hover:bg-error-container/30 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-on-surface">
                          The Craftsman House Hội An
                        </h4>
                        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-error text-on-error">
                          Quá hạn 4h
                        </span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                        Hồ sơ giấy phép PCCC cần bổ sung văn bản xác nhận quy
                        hoạch phố cổ Hội An trước khi kích hoạt thanh toán trực
                        tuyến.
                      </p>
                      <div className="mt-2.5 flex items-center justify-between text-[11px]">
                        <span className="text-error font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">
                            error
                          </span>
                          Đã gửi nhắc nhở lần 2
                        </span>
                        <button className="text-primary font-bold hover:underline">
                          Liên hệ đối tác
                        </button>
                      </div>
                    </div>
                    {/* Item 3 */}
                    <div className="p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-primary">
                          Làng Mây Retreat Sapa
                        </h4>
                        <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed">
                          Còn 18h SLA
                        </span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                        Hồ sơ mới gửi - Kiểm tra pháp lý quyền sử dụng đất du
                        lịch sinh thái và giấy chứng nhận vệ sinh an toàn thực
                        phẩm.
                      </p>
                      <div className="mt-2.5 flex items-center justify-between text-[11px]">
                        <span className="text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">
                            history_edu
                          </span>
                          Đang phân bổ thẩm định viên
                        </span>
                        <button className="text-primary font-bold hover:underline">
                          Nhận duyệt
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Primary CTA to M02 Queue */}
                  <a
                    className="w-full h-11 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
                    href="#"
                  >
                    <span>Chuyển đến Hàng đợi duyệt đối tác (M02)</span>
                    <span className="material-symbols-outlined text-sm">
                      arrow_forward
                    </span>
                  </a>
                </div>
                {/* Card: Compliance Alerts & Active Complaints */}
                <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-on-surface-variant text-xl">
                        gavel
                      </span>
                      <h2 className="font-headline text-base font-bold text-on-surface">
                        Cảnh báo tuân thủ & Khiếu nại mở
                      </h2>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    Giám sát các trường hợp vi phạm chính sách cam kết chất
                    lượng của sàn
                  </p>
                  <div className="space-y-3 pt-1">
                    {/* Alert 1: Refund Dispute */}
                    <div className="p-3 rounded-xl bg-surface-container-low flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary-fixed/50 text-secondary flex items-center justify-center shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-base">
                          receipt_long
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-on-surface truncate">
                            Villa Sông Hàn
                          </h5>
                          <span className="text-[10px] font-semibold text-secondary">
                            Mức độ: Trung bình
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">
                          Tranh chấp hoàn tiền khách hàng chưa thỏa đáng (Khách
                          phản ánh hệ thống máy lạnh phòng Deluxe không đạt
                          chuẩn 4 sao).
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-[10px]">
                          <button className="px-2 py-1 rounded bg-surface-container-lowest font-medium text-primary shadow-xs hover:bg-surface-container">
                            Xem biên bản CSKH
                          </button>
                          <span className="text-outline">Mở 3h trước</span>
                        </div>
                      </div>
                    </div>
                    {/* Alert 2: High Cancellation Spike */}
                    <div className="p-3 rounded-xl bg-surface-container-low flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-base">
                          event_busy
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-on-surface truncate">
                            Boutique Villa Hội An #08
                          </h5>
                          <span className="text-[10px] font-semibold text-error">
                            Đột biến Allotment
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">
                          Tỷ lệ hủy phòng tăng vọt 28% trong 48h tại 1 đối tác
                          mới khu vực Hội An. Cần kiểm tra khóa phòng bán ngoài
                          sàn.
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-[10px]">
                          <button className="px-2 py-1 rounded bg-surface-container-lowest font-medium text-primary shadow-xs hover:bg-surface-container">
                            Kiểm tra Allotment
                          </button>
                          <span className="text-outline">Tự động gắn cờ</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2">
                    <a
                      className="inline-flex items-center text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors gap-1"
                      href="#"
                    >
                      <span>Mở bảng Quản trị Tuân thủ & Vi phạm (M04)</span>
                      <span className="material-symbols-outlined text-xs">
                        open_in_new
                      </span>
                    </a>
                  </div>
                </div>
                {/* Regional Operational Notice Widget */}
                <div className="p-5 rounded-2xl bg-surface-container-low flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-lowest text-primary flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-xl">
                      hub
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-on-surface">
                      Quy chuẩn thẩm định thực địa V2.4
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      Áp dụng từ 15/10/2026: Yêu cầu thẩm định viên quét mã kiểm
                      định hệ thống PCCC qua ứng dụng StayReco Inspector.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* Bottom Regulatory Ledger & Accounting Traceability Footer */}
            <div className="pt-4 pb-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant bg-surface-container-lowest/60 rounded-xl px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-tertiary">
                  lock
                </span>
                <span>
                  Báo cáo số liệu theo thời gian thực được tổng hợp tự động theo
                  chuẩn kế toán quản trị StayReco.
                </span>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-mono">
                <span>SERVER_HASH: #SR-FIN-202610-VN</span>
                <span className="text-outline-variant">|</span>
                <span>Lần cập nhật cuối: Hôm nay 14:32:05 (GMT+7)</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
