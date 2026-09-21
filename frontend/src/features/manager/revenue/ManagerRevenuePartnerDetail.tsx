/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Legacy JSX screen pending React state migration.
import React from 'react';

export default function ManagerRevenuePartnerDetail() {
  React.useEffect(() => {
    try {
      (function () {
      const revenueLink = document.querySelector('nav [data-path="doanh-thu-&-hoa-hong"]');
      if (revenueLink) {
        revenueLink.classList.remove('text-on-surface-variant', 'hover:bg-surface-container-low', 'hover:text-on-surface');
        revenueLink.classList.add('bg-primary-container', 'text-on-primary', 'font-semibold', 'shadow-[0_2px_8px_rgba(35,78,112,0.12)]');
      }
    })();
    } catch (err) {
      console.error('Error executing interaction script:', err);
    }
  }, []);

  return (
    <div className="bg-surface font-body text-on-surface antialiased">
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-lowest z-50 flex flex-col shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-6 flex items-center gap-3 bg-surface-container-lowest">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">holiday_village</span>
            <span className="font-headline font-bold text-lg tracking-tight text-primary">StayReco</span>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded bg-primary-fixed text-on-primary-fixed leading-tight">Manager</span>
        </div>
        <div className="px-4 py-3">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/80">Quản trị nền tảng</div>
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto" data-active-classes="bg-primary-container text-on-primary font-semibold shadow-[0_2px_8px_rgba(35,78,112,0.12)]">
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" data-path="tong-quan-&-tang-truong" href="#">
            <span className="material-symbols-outlined text-xl">analytics</span>
            <span>Tổng quan & Tăng trưởng</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" data-path="duyet-ho-so-doi-tac" href="#">
            <span className="material-symbols-outlined text-xl">verified_user</span>
            <span>Duyệt hồ sơ đối tác</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" data-path="giam-sat-doi-tac" href="#">
            <span className="material-symbols-outlined text-xl">storefront</span>
            <span>Giám sát đối tác</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" data-path="tuan-thu-&-vi-pham" href="#">
            <span className="material-symbols-outlined text-xl">gavel</span>
            <span>Tuân thủ & Vi phạm</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" data-path="doanh-thu-&-hoa-hong" href="#">
            <span className="material-symbols-outlined text-xl">payments</span>
            <span>Doanh thu & Hoa hồng</span>
          </a>
        </nav>
        <div className="p-4 mt-auto bg-surface-container-lowest">
          <div className="p-3 rounded-xl bg-surface-container-low flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></div>
            <div className="text-xs">
              <div className="font-medium text-on-surface">Hệ thống bình thường</div>
              <div className="text-[11px] text-on-surface-variant">SLA hạ tầng: 99.98%</div>
            </div>
          </div>
        </div>
      </aside>
      <div className="pl-64">
        <header className="fixed top-0 left-64 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 px-6 flex items-center justify-between gap-6">
          <div className="flex-1 max-w-xl">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-xl pointer-events-none">search</span>
              <input className="w-full h-10 pl-10 pr-4 rounded-lg bg-surface-container-low border-0 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary-container transition-all" placeholder="Tìm kiếm đối tác, khách sạn, hồ sơ thẩm định... (Ctrl+K)" type="text" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-low">
              <span className="w-2 h-2 rounded-full bg-tertiary"></span>
              <span className="text-xs font-medium text-on-surface-variant">Hệ thống vận hành bình thường</span>
            </div>
            <button aria-label="Notifications" className="relative w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" type="button">
              <span className="material-symbols-outlined text-22">notifications</span>
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-secondary text-on-secondary text-[10px] font-bold rounded-full flex items-center justify-center">3</span>
            </button>
            <div className="h-8 w-px bg-surface-container-high"></div>
            <div className="flex items-center gap-3 pl-1">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-on-surface leading-snug">Lê Hoàng Quân</div>
                <div className="text-[11px] text-on-surface-variant leading-none">Chuyên viên Quản lý Nền tảng (Miền Trung)</div>
              </div>
              <img alt="Profile" className="w-8 h-8 rounded-full object-cover ring-2 ring-surface-container-high" src="https://lh3.googleusercontent.com/aida/AEtjO1V-SCfN5vRag32eaaMCe725o3qjMzRhq78BRcuhKmOXxEDu4G8qm577peTkqU28fF62pdny08VmbaOwjGzlFo32VJpAA8SPA924onlWgQ2t92x5iGKeuhw1fCMiUdigsg6mge97P7ahRot5alw95ynt0-n2m7IucAr968MgN5mTjYAV6AnplZ0Xx-7f4H3KdFhb1vm9RS4hCaI81jJK3nFDIJCSwTS5926q0xHmfGl3sY60Y-Y_wuhSWwMDAhg2Nz8K1d9sN9cn" />
            </div>
          </div>
        </header>
        <main className="relative pt-16 bg-surface min-h-screen">
          <div className="flex flex-col w-full">
            {/* Active Tab Context Indicator Script for Sidebar Continuity */}
            <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
              {/* Top Breadcrumb & Executive Actions */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <nav className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
                    <span className="hover:text-primary transition-colors cursor-pointer">Quản trị nền tảng</span>
                    <span className="material-symbols-outlined text-[14px] text-outline-variant">chevron_right</span>
                    <a className="hover:text-primary transition-colors" href="#">Báo cáo Doanh thu & Đối soát</a>
                    <span className="material-symbols-outlined text-[14px] text-outline-variant">chevron_right</span>
                    <span className="text-on-surface font-semibold">Doanh số đối tác: An Nhiên Riverside Hotel (#ANR-DN-01)</span>
                  </nav>
                  <div className="flex items-center gap-3 mt-1.5">
                    <h1 className="font-headline font-bold text-2xl tracking-tight text-primary">Chi tiết Doanh số & Đặt phòng Đối tác</h1>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-tertiary-fixed text-on-tertiary-fixed flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                      Kỳ đối soát: Tháng 10/2026
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <a className="h-11 px-4 rounded-xl bg-surface-container-lowest text-on-surface text-sm font-semibold shadow-sm hover:bg-surface-container-low transition-all flex items-center gap-2" href="#">
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    <span>Quay lại Báo cáo chung (M06)</span>
                  </a>
                  <button className="h-11 px-5 rounded-xl bg-primary-container text-on-primary text-sm font-semibold shadow-[0_4px_16px_rgba(35,78,112,0.18)] hover:bg-primary transition-all flex items-center gap-2" type="button">
                    <span className="material-symbols-outlined text-lg">file_download</span>
                    <span>Xuất file sao kê đối soát (Excel/CSV)</span>
                  </button>
                </div>
              </div>
              {/* Hotel Identity Banner & Payout Profile */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(32,43,54,0.06)] overflow-hidden">
                <div className="p-6 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
                  {/* Identity Summary */}
                  <div className="flex items-start sm:items-center gap-5">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 shadow-md">
                      <img className="w-full h-full object-cover" data-alt="An Nhiên Riverside Hotel facade at dusk situated gracefully beside Da Nang Han River with warm boutique interior lighting, calm water reflections, and natural terracotta architectural tones" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2RI2SZWrYbZ4uoHPf1bZ_JqSCpG-agPm8t-ooF-wl00Dxca5wNKb81EGsZbbztKbVo1KTjVxh47FNNRJkhMC8azFZyXL6K4qwfyt-HnP3qgkqL_BBOLZIAYVXxw4tlL0J9CxP9erCSDU7A9WRQZ6pTk3A8jm4-wMZHkDSeBJgyqh-CYIBvh_KjM9xt16JlUS-Eong5OObbFxnlPQO4o1XW1UslKbZx0gBlA0j3pycVcUgoKdSwFd6" />
                      <div className="absolute bottom-1 right-1 bg-surface-container-lowest/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-bold text-primary flex items-center gap-0.5 shadow-sm">
                        <span className="material-symbols-outlined text-[12px] text-secondary">star</span>
                        4.0
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="font-headline font-bold text-xl text-on-surface">An Nhiên Riverside Hotel</h2>
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-surface-container-high text-primary tracking-wide">#ANR-DN-01</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-fixed text-on-primary-fixed flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">verified</span>
                          Hợp tác chính thức - StayReco Shield
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-secondary">location_on</span>
                          128 Đường Bạch Đằng, P. Hải Châu 1, Q. Hải Châu, TP. Đà Nẵng
                        </span>
                        <span className="hidden sm:inline text-outline-variant">•</span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-primary">percent</span>
                          Take-rate cố định:
                          <strong className="text-on-surface">6.0%</strong>
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-low text-on-surface">
                          <span className="material-symbols-outlined text-sm text-primary">event_repeat</span>
                          <span>
                            Chu kỳ thanh toán:
                            <strong>Thứ Hai hàng tuần (Weekly Cycle)</strong>
                          </span>
                        </div>
                        <span className="text-xs text-secondary font-medium">
                          Đợt quyết toán kế tiếp:
                          <strong>25/10/2026</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Designated Escrow / VCB Bank Channel */}
                  <div className="w-full xl:w-auto xl:min-w-[420px] bg-surface-container-low rounded-xl p-4 flex flex-col justify-between gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base text-primary">account_balance</span>
                        Tài khoản thụ hưởng Escrow đã xác minh
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-tertiary bg-tertiary-fixed/60 px-2 py-0.5 rounded">
                        <span className="material-symbols-outlined text-[13px]">lock</span>
                        Chuyển khoản bảo mật
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                      <div>
                        <div className="text-[11px] text-on-surface-variant">Ngân hàng & Chi nhánh</div>
                        <div className="font-semibold text-on-surface mt-0.5">Vietcombank - CN Đà Nẵng</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-on-surface-variant">Số tài khoản (IBAN/STK)</div>
                        <div className="font-mono font-bold text-primary tracking-wide mt-0.5">0401988234</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-[11px] text-on-surface-variant">Tên pháp nhân thụ hưởng</div>
                        <div className="font-bold text-on-surface tracking-tight uppercase mt-0.5">CÔNG TY TNHH AN NHIEN RS</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* 4 Financial Metric Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {/* Metric 1: Total GMV */}
                <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_4px_16px_rgba(32,43,54,0.04)] relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Tổng doanh số đặt phòng (GMV)</span>
                      <div className="text-2xl font-bold font-headline text-on-surface mt-2 tracking-tight tabular-nums">
                        285.000.000
                        <span className="text-base font-normal text-on-surface-variant">₫</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-2xl">trending_up</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 flex items-center justify-between text-xs bg-surface-container-low/60 -mx-5 -mb-5 px-5 py-3">
                    <span className="text-on-surface-variant">
                      <strong>228</strong>
                      đơn hoàn tất
                    </span>
                    <span className="inline-flex items-center gap-0.5 font-bold text-tertiary bg-tertiary-fixed/60 px-2 py-0.5 rounded-full">
                      <span className="material-symbols-outlined text-[13px]">arrow_upward</span>
                      +14.2% MoM
                    </span>
                  </div>
                </div>
                {/* Metric 2: Platform Commission */}
                <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_4px_16px_rgba(32,43,54,0.04)] relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Hoa hồng sàn StayReco (6%)</span>
                      <div className="text-2xl font-bold font-headline text-primary mt-2 tracking-tight tabular-nums">
                        17.100.000
                        <span className="text-base font-normal text-on-surface-variant">₫</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shrink-0 shadow-sm">
                      <span className="material-symbols-outlined text-22">account_balance_wallet</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 flex items-center justify-between text-xs bg-surface-container-low/60 -mx-5 -mb-5 px-5 py-3">
                    <span className="text-on-surface-variant">Doanh thu thuần nền tảng</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-primary">
                      <span className="material-symbols-outlined text-xs">receipt_long</span>
                      Xuất HĐĐT GTGT
                    </span>
                  </div>
                </div>
                {/* Metric 3: Paid Out */}
                <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_4px_16px_rgba(32,43,54,0.04)] relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Đã thanh toán cho khách sạn</span>
                      <div className="text-2xl font-bold font-headline text-tertiary mt-2 tracking-tight tabular-nums">
                        245.000.000
                        <span className="text-base font-normal text-on-surface-variant">₫</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-22">check_circle</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 flex items-center justify-between text-xs bg-surface-container-low/60 -mx-5 -mb-5 px-5 py-3">
                    <span className="text-on-surface-variant">
                      <strong>201 đơn</strong>
                      đã hoàn tất check-out
                    </span>
                    <span className="font-medium text-tertiary flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                      Giải ngân Escrow
                    </span>
                  </div>
                </div>
                {/* Metric 4: Escrow Holding */}
                <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_4px_16px_rgba(32,43,54,0.04)] relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Đang ký quỹ Escrow / Chờ giải ngân</span>
                      <div className="text-2xl font-bold font-headline text-secondary mt-2 tracking-tight tabular-nums">
                        22.900.000
                        <span className="text-base font-normal text-on-surface-variant">₫</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-22">lock_clock</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 flex items-center justify-between text-xs bg-surface-container-low/60 -mx-5 -mb-5 px-5 py-3">
                    <span className="text-on-surface-variant">
                      <strong>27 đơn</strong>
                      đang/sắp lưu trú
                    </span>
                    <span className="font-semibold text-secondary">Chi đợt 25/10</span>
                  </div>
                </div>
              </div>
              {/* Filter & Search Toolbar */}
              <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_16px_rgba(32,43,54,0.04)] flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-3">
                  {/* Search Input (4 cols) */}
                  <div className="xl:col-span-4 relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-xl pointer-events-none">search</span>
                    <input className="w-full h-11 pl-11 pr-4 rounded-xl bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary-container transition-all" placeholder="Tìm theo mã đặt phòng (#SR-...), tên khách, SĐT..." type="text" />
                  </div>
                  {/* Date Range Filter (2 cols) */}
                  <div className="xl:col-span-2 relative">
                    <div className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low flex items-center justify-between text-xs font-semibold text-on-surface cursor-pointer hover:bg-surface-container transition-colors">
                      <div className="flex items-center gap-2 truncate">
                        <span className="material-symbols-outlined text-sm text-primary shrink-0">calendar_month</span>
                        <span className="truncate">Tháng 10/2026 (01 - 31)</span>
                      </div>
                      <span className="material-symbols-outlined text-sm text-on-surface-variant shrink-0">expand_more</span>
                    </div>
                  </div>
                  {/* Room Category Filter (2 cols) */}
                  <div className="xl:col-span-2 relative">
                    <div className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low flex items-center justify-between text-xs font-semibold text-on-surface cursor-pointer hover:bg-surface-container transition-colors">
                      <div className="flex items-center gap-2 truncate">
                        <span className="material-symbols-outlined text-sm text-primary shrink-0">hotel</span>
                        <span className="truncate">Tất cả hạng phòng</span>
                      </div>
                      <span className="material-symbols-outlined text-sm text-on-surface-variant shrink-0">expand_more</span>
                    </div>
                  </div>
                  {/* Cashflow Status Filter (2 cols) */}
                  <div className="xl:col-span-2 relative">
                    <div className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low flex items-center justify-between text-xs font-semibold text-on-surface cursor-pointer hover:bg-surface-container transition-colors">
                      <div className="flex items-center gap-2 truncate">
                        <span className="material-symbols-outlined text-sm text-primary shrink-0">payments</span>
                        <span className="truncate">Tất cả trạng thái tiền</span>
                      </div>
                      <span className="material-symbols-outlined text-sm text-on-surface-variant shrink-0">expand_more</span>
                    </div>
                  </div>
                  {/* Stay Status Filter & Reset (2 cols) */}
                  <div className="xl:col-span-2 flex items-center gap-2">
                    <div className="flex-1 h-11 px-3 rounded-xl bg-surface-container-low flex items-center justify-between text-xs font-semibold text-on-surface cursor-pointer hover:bg-surface-container transition-colors">
                      <span className="truncate">Lưu trú</span>
                      <span className="material-symbols-outlined text-sm text-on-surface-variant">expand_more</span>
                    </div>
                    <button className="w-11 h-11 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center justify-center shrink-0 transition-colors" title="Đặt lại bộ lọc" type="button">
                      <span className="material-symbols-outlined text-lg">restart_alt</span>
                    </button>
                  </div>
                </div>
                {/* Filter chips summary */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="text-on-surface-variant font-medium">Bộ lọc đang áp dụng:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-surface-container font-medium text-primary flex items-center gap-1.5">
                    Thời gian: 01/10/2026 - 31/10/2026
                    <span className="material-symbols-outlined text-[14px] cursor-pointer hover:text-secondary">close</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-surface-container font-medium text-primary flex items-center gap-1.5">
                    Kênh: Tất cả nguồn (Trực tiếp & OTA)
                    <span className="material-symbols-outlined text-[14px] cursor-pointer hover:text-secondary">close</span>
                  </span>
                  <button className="text-xs text-secondary font-semibold hover:underline ml-1">Xóa tất cả (2)</button>
                </div>
              </div>
              {/* Main Data Table: Bookings & Revenue Decomposition */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(32,43,54,0.06)] overflow-hidden">
                <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low/40">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <h3 className="font-headline font-bold text-base text-on-surface">Phân rã Doanh thu & Nghĩa vụ Escrow theo Đơn đặt phòng</h3>
                  </div>
                  <div className="text-xs text-on-surface-variant flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-tertiary"></span>
                      Đã quyết toán xong
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
                      Ký quỹ an toàn Escrow
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                      Chờ check-in
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-on-surface min-w-[1240px]">
                    <thead className="bg-surface-container text-on-surface-variant font-semibold tracking-wider uppercase text-[11px]">
                      <tr>
                        <th className="py-3.5 px-4 font-semibold" scope="col">Mã Đơn & Ngày Đặt</th>
                        <th className="py-3.5 px-4 font-semibold" scope="col">Khách Hàng & Phòng</th>
                        <th className="py-3.5 px-4 font-semibold" scope="col">Thời Gian Lưu Trú</th>
                        <th className="py-3.5 px-4 font-semibold text-right" scope="col">Giá Gốc Niêm Yết</th>
                        <th className="py-3.5 px-4 font-semibold text-right" scope="col">Voucher / Giảm trừ</th>
                        <th className="py-3.5 px-4 font-semibold text-right" scope="col">Khách Thực Trả</th>
                        <th className="py-3.5 px-4 font-semibold text-right" scope="col">Hoa Hồng (6%)</th>
                        <th className="py-3.5 px-4 font-semibold text-right" scope="col">Quyết Toán Khách Sạn</th>
                        <th className="py-3.5 px-4 font-semibold text-center" scope="col">Trạng Thái Dòng Tiền</th>
                        <th className="py-3.5 px-4 font-semibold text-center" scope="col">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-high/40">
                      {/* ROW 1 */}
                      <tr className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-4 px-4 align-top">
                          <a className="font-mono font-bold text-primary hover:underline text-xs block" href="#">#SR-261020-0842</a>
                          <div className="text-[11px] text-on-surface-variant mt-0.5">12/10/2026 09:18</div>
                          <span className="inline-flex items-center gap-1 text-[10px] text-tertiary bg-tertiary-fixed/60 px-1.5 py-0.2 rounded font-semibold mt-1">VNPAY QR</span>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="font-bold text-on-surface">Nguyễn Minh Anh</div>
                          <div className="text-[11px] text-on-surface-variant">0918 ••• 882 • Hạng Bạc</div>
                          <div className="font-medium text-primary mt-1">
                            Deluxe River View
                            <span className="text-on-surface-variant font-normal">(P.608, 2 đêm)</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="font-semibold text-on-surface">20/10 - 22/10/2026</div>
                          <div className="text-[11px] text-on-surface-variant">2 đêm lưu trú</div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-fixed text-on-primary-fixed mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                            Đang lưu trú
                          </span>
                        </td>
                        <td className="py-4 px-4 align-top text-right font-mono text-xs tabular-nums">
                          <div className="font-semibold text-on-surface">2.500.000 ₫</div>
                          <div className="text-[10px] text-on-surface-variant">1.250.000 ₫/đêm</div>
                        </td>
                        <td className="py-4 px-4 align-top text-right font-mono text-xs tabular-nums text-secondary">
                          <div className="font-semibold">-250.000 ₫</div>
                          <div className="text-[10px] text-secondary/80">ANHNIEN250 (100% KS)</div>
                        </td>
                        <td className="py-4 px-4 align-top text-right font-mono text-xs tabular-nums">
                          <div className="font-bold text-on-surface">2.250.000 ₫</div>
                          <div className="text-[10px] text-tertiary font-semibold">Đã về Escrow VCB</div>
                        </td>
                        <td className="py-4 px-4 align-top text-right font-mono text-xs tabular-nums text-primary">
                          <div className="font-bold">+135.000 ₫</div>
                          <div className="text-[10px] text-on-surface-variant">6% trên 2.25M</div>
                        </td>
                        <td className="py-4 px-4 align-top text-right font-mono text-xs tabular-nums">
                          <div className="font-bold text-tertiary text-sm">2.115.000 ₫</div>
                          <div className="text-[10px] text-on-surface-variant">Net Payout</div>
                        </td>
                        <td className="py-4 px-4 align-top text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-tertiary-fixed text-on-tertiary-fixed">
                            <span className="material-symbols-outlined text-[13px]">verified_user</span>
                            Ký quỹ Escrow (Sắp giải ngân)
                          </span>
                          <div className="text-[10px] text-on-surface-variant mt-1">Dự kiến chi: 25/10</div>
                        </td>
                        <td className="py-4 px-4 align-top text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <a className="h-8 px-2.5 rounded-lg bg-surface-container-high hover:bg-primary-container hover:text-on-primary text-primary font-semibold text-xs transition-colors flex items-center gap-1" href="#" title="Xem dòng tiền chi tiết (M06b)">
                              <span className="material-symbols-outlined text-sm">payments</span>
                              <span>M06b</span>
                            </a>
                            <button className="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors" title="Xem Hóa đơn GTGT" type="button">
                              <span className="material-symbols-outlined text-base">receipt</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* ROW 2 */}
                      <tr className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-4 px-4 align-top">
                          <a className="font-mono font-bold text-primary hover:underline text-xs block" href="#">#SR-261018-7712</a>
                          <div className="text-[11px] text-on-surface-variant mt-0.5">08/10/2026 14:22</div>
                          <span className="inline-flex items-center gap-1 text-[10px] text-primary bg-primary-fixed text-on-primary-fixed px-1.5 py-0.2 rounded font-semibold mt-1">Thẻ Quốc Tế</span>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="font-bold text-on-surface">Đặng Thu Hà</div>
                          <div className="text-[11px] text-on-surface-variant">0903 ••• 119 • Hạng Vàng</div>
                          <div className="font-medium text-primary mt-1">
                            Riverside Suite
                            <span className="text-on-surface-variant font-normal">(P.502, 2 đêm)</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="font-semibold text-on-surface">16/10 - 18/10/2026</div>
                          <div className="text-[11px] text-on-surface-variant">2 đêm lưu trú</div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-container-high text-on-surface-variant mt-1">
                            <span className="material-symbols-outlined text-[12px]">done_all</span>
                            Check-out hoàn tất
                          </span>
                        </td>
                        <td className="py-4 px-4 align-top text-right font-mono text-xs tabular-nums">
                          <div className="font-semibold text-on-surface">3.700.000 ₫</div>
                          <div className="text-[10px] text-on-surface-variant">1.850.000 ₫/đêm</div>
                        </td>
                        <td className="py-4 px-4 align-top text-right font-mono text-xs tabular-nums text-secondary">
                          <div className="font-semibold">-400.000 ₫</div>
                          <div className="text-[10px] text-secondary/80">EARLYBIRD (100% KS)</div>
                        </td>
                        <td className="py-4 px-4 align-top text-right font-mono text-xs tabular-nums">
                          <div className="font-bold text-on-surface">3.300.000 ₫</div>
                          <div className="text-[10px] text-tertiary font-semibold">Đã hoàn tất thanh toán</div>
                        </td>
                        <td className="py-4 px-4 align-top text-right font-mono text-xs tabular-nums text-primary">
                          <div className="font-bold">+198.000 ₫</div>
                          <div className="text-[10px] text-on-surface-variant">6% trên 3.30M</div>
                        </td>
                        <td className="py-4 px-4 align-top text-right font-mono text-xs tabular-nums">
                          <div className="font-bold text-tertiary text-sm">3.102.000 ₫</div>
                          <div className="text-[10px] text-tertiary font-semibold">Đã chuyển VCB</div>
                        </td>
                        <td className="py-4 px-4 align-top text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary-container text-on-primary">
                            <span className="material-symbols-outlined text-[13px]">paid</span>
                            Đã quyết toán (VCB)
                          </span>
                          <div className="text-[10px] text-on-surface-variant mt-1">Lệnh chi: #DIS-1810-09</div>
                        </td>
                        <td className="py-4 px-4 align-top text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <a className="h-8 px-2.5 rounded-lg bg-surface-container-high hover:bg-primary-container hover:text-on-primary text-primary font-semibold text-xs transition-colors flex items-center gap-1" href="#" title="Xem dòng tiền chi tiết">
                              <span className="material-symbols-outlined text-sm">payments</span>
                              <span>M06b</span>
                            </a>
                            <button className="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors" title="Xem Hóa đơn GTGT" type="button">
                              <span className="material-symbols-outlined text-base">receipt</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* ROW 3 */}
                      <tr className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-4 px-4 align-top">
                          <a className="font-mono font-bold text-primary hover:underline text-xs block" href="#">#SR-261015-5521</a>
                          <div className="text-[11px] text-on-surface-variant mt-0.5">04/10/2026 18:40</div>
                          <span className="inline-flex items-center gap-1 text-[10px] text-on-secondary-container bg-secondary-container px-1.5 py-0.2 rounded font-semibold mt-1">Agoda OTA Channel</span>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="font-bold text-on-surface">David Miller</div>
                          <div className="text-[11px] text-on-surface-variant">+1 (415) ••• 9912 • Guest</div>
                          <div className="font-medium text-primary mt-1">
                            Deluxe River View
                            <span className="text-on-surface-variant font-normal">(P.304, 3 đêm)</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="font-semibold text-on-surface">12/10 - 15/10/2026</div>
                          <div className="text-[11px] text-on-surface-variant">3 đêm lưu trú</div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-container-high text-on-surface-variant mt-1">
                            <span className="material-symbols-outlined text-[12px]">done_all</span>
                            Check-out hoàn tất
                          </span>
                        </td>
                        <td className="py-4 px-4 align-top text-right font-mono text-xs tabular-nums">
                          <div className="font-semibold text-on-surface">3.750.000 ₫</div>
                          <div className="text-[10px] text-on-surface-variant">1.250.000 ₫/đêm</div>
                        </td>
                        <td className="py-4 px-4 align-top text-right font-mono text-xs tabular-nums text-on-surface-variant">
                          <div className="font-semibold">0 ₫</div>
                          <div className="text-[10px]">Không áp dụng</div>
                        </td>
                        <td className="py-4 px-4 align-top text-right font-mono text-xs tabular-nums">
                          <div className="font-bold text-on-surface">3.750.000 ₫</div>
                          <div className="text-[10px] text-tertiary font-semibold">Đã đối soát OTA</div>
                        </td>
                        <td className="py-4 px-4 align-top text-right font-mono text-xs tabular-nums text-primary">
                          <div className="font-bold">+225.000 ₫</div>
                          <div className="text-[10px] text-on-surface-variant">6% trên 3.75M</div>
                        </td>
                        <td className="py-4 px-4 align-top text-right font-mono text-xs tabular-nums">
                          <div className="font-bold text-tertiary text-sm">3.525.000 ₫</div>
                          <div className="text-[10px] text-tertiary font-semibold">Đã chuyển VCB</div>
                        </td>
                        <td className="py-4 px-4 align-top text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary-container text-on-primary">
                            <span className="material-symbols-outlined text-[13px]">paid</span>
                            Đã quyết toán (VCB)
                          </span>
                          <div className="text-[10px] text-on-surface-variant mt-1">Lệnh chi: #DIS-1510-02</div>
                        </td>
                        <td className="py-4 px-4 align-top text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <a className="h-8 px-2.5 rounded-lg bg-surface-container-high hover:bg-primary-container hover:text-on-primary text-primary font-semibold text-xs transition-colors flex items-center gap-1" href="#" title="Xem dòng tiền chi tiết">
                              <span className="material-symbols-outlined text-sm">payments</span>
                              <span>M06b</span>
                            </a>
                            <button className="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors" title="Xem Hóa đơn GTGT" type="button">
                              <span className="material-symbols-outlined text-base">receipt</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* ROW 4 */}
                      <tr className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-4 px-4 align-top">
                          <a className="font-mono font-bold text-primary hover:underline text-xs block" href="#">#SR-261014-4109</a>
                          <div className="text-[11px] text-on-surface-variant mt-0.5">02/10/2026 11:05</div>
                          <span className="inline-flex items-center gap-1 text-[10px] text-tertiary bg-tertiary-fixed/60 px-1.5 py-0.2 rounded font-semibold mt-1">MoMo Ví Điện Tử</span>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="font-bold text-on-surface">Trần Đình Trọng</div>
                          <div className="text-[11px] text-on-surface-variant">0977 ••• 342 • Hạng Bạc</div>
                          <div className="font-medium text-primary mt-1">
                            Superior Garden View
                            <span className="text-on-surface-variant font-normal">(P.201, 1 đêm)</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="font-semibold text-on-surface">10/10 - 11/10/2026</div>
                          <div className="text-[11px] text-on-surface-variant">1 đêm lưu trú</div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-container-high text-on-surface-variant mt-1">
                            <span className="material-symbols-outlined text-[12px]">done_all</span>
                            Check-out hoàn tất
                          </span>
                        </td>
                        <td className="py-4 px-4 align-top text-right font-mono text-xs tabular-nums">
                          <div className="font-semibold text-on-surface">980.000 ₫</div>
                          <div className="text-[10px] text-on-surface-variant">980.000 ₫/đêm</div>
                        </td>
                        <td className="py-4 px-4 align-top text-right font-mono text-xs tabular-nums text-secondary">
                          <div className="font-semibold">-100.000 ₫</div>
                          <div className="text-[10px] text-primary font-semibold">STAYRECO50 (Sàn bù 50k)</div>
                        </td>
                        <td className="py-4 px-4 align-top text-right font-mono text-xs tabular-nums">
                          <div className="font-bold text-on-surface">880.000 ₫</div>
                          <div className="text-[10px] text-tertiary font-semibold">+ 50k bù từ Sàn</div>
                        </td>
                        <td className="py-4 px-4 align-top text-right font-mono text-xs tabular-nums text-primary">
                          <div className="font-bold">+52.800 ₫</div>
                          <div className="text-[10px] text-on-surface-variant">6% trên 880k</div>
                        </td>
                        <td className="py-4 px-4 align-top text-right font-mono text-xs tabular-nums">
                          <div className="font-bold text-tertiary text-sm">877.200 ₫</div>
                          <div className="text-[10px] text-tertiary font-semibold">Đã chuyển VCB</div>
                        </td>
                        <td className="py-4 px-4 align-top text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary-container text-on-primary">
                            <span className="material-symbols-outlined text-[13px]">paid</span>
                            Đã quyết toán (VCB)
                          </span>
                          <div className="text-[10px] text-on-surface-variant mt-1">Lệnh chi: #DIS-1110-04</div>
                        </td>
                        <td className="py-4 px-4 align-top text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <a className="h-8 px-2.5 rounded-lg bg-surface-container-high hover:bg-primary-container hover:text-on-primary text-primary font-semibold text-xs transition-colors flex items-center gap-1" href="#" title="Xem dòng tiền chi tiết">
                              <span className="material-symbols-outlined text-sm">payments</span>
                              <span>M06b</span>
                            </a>
                            <button className="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors" title="Xem Hóa đơn GTGT" type="button">
                              <span className="material-symbols-outlined text-base">receipt</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* ROW 5 */}
                      <tr className="hover:bg-surface-container-low/50 transition-colors bg-secondary-container/10">
                        <td className="py-4 px-4 align-top">
                          <a className="font-mono font-bold text-primary hover:underline text-xs block" href="#">#SR-261022-9903</a>
                          <div className="text-[11px] text-on-surface-variant mt-0.5">14/10/2026 21:10</div>
                          <span className="inline-flex items-center gap-1 text-[10px] text-tertiary bg-tertiary-fixed/60 px-1.5 py-0.2 rounded font-semibold mt-1">Chuyển Khoản 247</span>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="font-bold text-on-surface">Lê Mai Phương</div>
                          <div className="text-[11px] text-on-surface-variant">0935 ••• 668 • Hạng Kim Cương</div>
                          <div className="font-medium text-primary mt-1">
                            Riverside Suite
                            <span className="text-on-surface-variant font-normal">(P.601, 2 đêm)</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="font-semibold text-on-surface">24/10 - 26/10/2026</div>
                          <div className="text-[11px] text-on-surface-variant">2 đêm lưu trú</div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary-fixed text-on-secondary-fixed mt-1">
                            <span className="material-symbols-outlined text-[12px]">schedule</span>
                            Sắp nhận phòng
                          </span>
                        </td>
                        <td className="py-4 px-4 align-top text-right font-mono text-xs tabular-nums">
                          <div className="font-semibold text-on-surface">4.625.000 ₫</div>
                          <div className="text-[10px] text-secondary font-medium">Lễ DIFF 2026 (+25%)</div>
                        </td>
                        <td className="py-4 px-4 align-top text-right font-mono text-xs tabular-nums text-on-surface-variant">
                          <div className="font-semibold">0 ₫</div>
                          <div className="text-[10px]">Không áp dụng</div>
                        </td>
                        <td className="py-4 px-4 align-top text-right font-mono text-xs tabular-nums">
                          <div className="font-bold text-on-surface">4.625.000 ₫</div>
                          <div className="text-[10px] text-tertiary font-semibold">Đã khóa Escrow an toàn</div>
                        </td>
                        <td className="py-4 px-4 align-top text-right font-mono text-xs tabular-nums text-primary">
                          <div className="font-bold">+277.500 ₫</div>
                          <div className="text-[10px] text-on-surface-variant">6% trên 4.625M</div>
                        </td>
                        <td className="py-4 px-4 align-top text-right font-mono text-xs tabular-nums">
                          <div className="font-bold text-secondary text-sm">4.347.500 ₫</div>
                          <div className="text-[10px] text-secondary font-medium">Treo ký quỹ chờ check-in</div>
                        </td>
                        <td className="py-4 px-4 align-top text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-secondary-fixed text-on-secondary-fixed">
                            <span className="material-symbols-outlined text-[13px]">lock</span>
                            Chờ nhận phòng (Escrow)
                          </span>
                          <div className="text-[10px] text-on-surface-variant mt-1">Đợt quyết toán: 27/10</div>
                        </td>
                        <td className="py-4 px-4 align-top text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <a className="h-8 px-2.5 rounded-lg bg-surface-container-high hover:bg-primary-container hover:text-on-primary text-primary font-semibold text-xs transition-colors flex items-center gap-1" href="#" title="Xem dòng tiền chi tiết">
                              <span className="material-symbols-outlined text-sm">payments</span>
                              <span>M06b</span>
                            </a>
                            <button className="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors" title="Xem Hóa đơn GTGT" type="button">
                              <span className="material-symbols-outlined text-base">receipt</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {/* Table Footer & Pagination Controls */}
                <div className="p-4 bg-surface-container-low/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                  <div className="text-on-surface-variant flex items-center gap-2">
                    <span>
                      Hiển thị
                      <strong className="text-on-surface">1 - 5</strong>
                      trên tổng số
                      <strong className="text-on-surface">228</strong>
                      đơn đặt phòng
                    </span>
                    <span>•</span>
                    <span>
                      Trang
                      <strong>1 / 46</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button className="w-9 h-9 rounded-lg bg-surface-container text-outline-variant flex items-center justify-center cursor-not-allowed" disabled type="button">
                      <span className="material-symbols-outlined text-base">first_page</span>
                    </button>
                    <button className="w-9 h-9 rounded-lg bg-surface-container text-outline-variant flex items-center justify-center cursor-not-allowed" disabled type="button">
                      <span className="material-symbols-outlined text-base">chevron_left</span>
                    </button>
                    <button className="w-9 h-9 rounded-lg bg-primary-container text-on-primary font-bold flex items-center justify-center shadow-sm" type="button">1</button>
                    <button className="w-9 h-9 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-semibold flex items-center justify-center transition-colors" type="button">2</button>
                    <button className="w-9 h-9 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-semibold flex items-center justify-center transition-colors" type="button">3</button>
                    <span className="px-1 text-on-surface-variant">...</span>
                    <button className="w-9 h-9 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-semibold flex items-center justify-center transition-colors" type="button">46</button>
                    <button className="w-9 h-9 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface flex items-center justify-center transition-colors" type="button">
                      <span className="material-symbols-outlined text-base">chevron_right</span>
                    </button>
                    <button className="w-9 h-9 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface flex items-center justify-center transition-colors" type="button">
                      <span className="material-symbols-outlined text-base">last_page</span>
                    </button>
                  </div>
                </div>
              </div>
              {/* Escrow Legal & Regulatory Compliance Shield Box */}
              <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_4px_16px_rgba(32,43,54,0.04)] flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-2xl">shield_locked</span>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-tertiary flex items-center gap-2">
                    Cơ chế bảo vệ dòng tiền StayReco Escrow Trust
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-tertiary-container text-on-tertiary-container">SLA Tuân thủ 100%</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    100% tiền phòng của đối tác
                    <strong>An Nhiên Riverside Hotel (#ANR-DN-01)</strong>
                    được cách ly an toàn trong tài khoản ủy thác độc lập tại Vietcombank Đà Nẵng. Hệ thống tự động giải ngân sau khi bộ phận lễ tân xác nhận khách hàng check-out thành công hoặc khi đối soát hoàn tất vào
                    <strong>thứ Hai hàng tuần</strong>
                    theo đúng Quy chế hoạt động nền tảng StayReco và Nghị định 52/2013/NĐ-CP về TMĐT.
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <button className="h-9 px-3.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors" type="button">
                    <span className="material-symbols-outlined text-sm">history_edu</span>
                    <span>Nhật ký giao dịch Escrow</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
