/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Legacy JSX screen pending React state migration.
import React from 'react';

export default function ManagerRevenueCashflow() {
  React.useEffect(() => {
    try {
      (function() {
      const activePath = 'doanh-thu-&-hoa-hong';
      const navLinks = document.querySelectorAll('nav a[data-path]');
      navLinks.forEach(link => {
        if (link.getAttribute('data-path') === activePath) {
          link.className = 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold bg-[#EAF0F5] text-[#234E70] shadow-[0_2px_8px_rgba(35,78,112,0.08)]';
        }
      });
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
            <span className="">Tổng quan & Tăng trưởng</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" data-path="duyet-ho-so-doi-tac" href="#">
            <span className="material-symbols-outlined text-xl">verified_user</span>
            <span className="">Duyệt hồ sơ đối tác</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" data-path="giam-sat-doi-tac" href="#">
            <span className="material-symbols-outlined text-xl">storefront</span>
            <span className="">Giám sát đối tác</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" data-path="tuan-thu-&-vi-pham" href="#">
            <span className="material-symbols-outlined text-xl">gavel</span>
            <span className="">Tuân thủ & Vi phạm</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold bg-[#EAF0F5] text-[#234E70] shadow-[0_2px_8px_rgba(35,78,112,0.08)]" data-path="doanh-thu-&-hoa-hong" href="#">
            <span className="material-symbols-outlined text-xl">payments</span>
            <span className="">Doanh thu & Hoa hồng</span>
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
            {/* Active Sidebar Nav Sync (Ensures 'Doanh thu & Hoa hồng' matches shell requirements) */}
            <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
              {/* Breadcrumb & Top Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-medium text-on-surface-variant mb-1.5">
                    <span className="">Quản trị nền tảng</span>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    <a className="hover:text-primary transition-colors" href="#">Báo cáo Doanh thu & Đối soát (M06)</a>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    <span className="text-primary font-semibold">Bóc tách Dòng tiền Cộng & Trừ (M07)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl lg:text-2xl font-bold font-headline text-on-surface tracking-tight">Bóc tách Dòng tiền & Sổ cái Đối soát Hệ thống</h1>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary-fixed text-on-primary-fixed flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      Real-time Escrow Ledger
                    </span>
                  </div>
                  <p className="text-xs lg:text-sm text-on-surface-variant mt-1 max-w-4xl">Theo dõi minh bạch toàn bộ các luồng hạch toán phát sinh nợ/có (+ / -), phân loại dòng tiền vào tài khoản phong toả Escrow, khấu trừ hoa hồng 6%, trợ giá voucher và giải ngân đối tác theo thời gian thực.</p>
                </div>
                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
                  <button className="h-10 px-3.5 rounded-lg bg-surface-container-lowest text-on-surface text-xs font-medium hover:bg-surface-container-low transition-colors shadow-sm flex items-center gap-2" type="button">
                    <span className="material-symbols-outlined text-base text-on-surface-variant">arrow_back</span>
                    <span className="">Quay lại M06</span>
                  </button>
                  <button className="h-10 px-3.5 rounded-lg bg-surface-container-lowest text-on-surface text-xs font-medium hover:bg-surface-container-low transition-colors shadow-sm flex items-center gap-2" type="button">
                    <span className="material-symbols-outlined text-base text-primary">calendar_month</span>
                    <span className="">Kỳ: 01/10 - 31/10/2026</span>
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">keyboard_arrow_down</span>
                  </button>
                  <button className="h-10 px-4 rounded-lg bg-primary-container text-on-primary text-xs font-semibold hover:bg-primary transition-all shadow-sm flex items-center gap-2" type="button">
                    <span className="material-symbols-outlined text-base">file_download</span>
                    <span className="">Xuất Lưu chuyển Tiền tệ</span>
                  </button>
                </div>
              </div>
              {/* 4 KPI Summary Cards (Inflow, Outflow, Net Payout, Net Platform) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* Card 1: INFLOW (+) */}
                <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">1. Tổng dòng tiền vào (Inflow)</span>
                      <div className="mt-2 text-2xl font-bold font-headline text-tertiary tracking-tight">+ 4.965.800.000 ₫</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-tertiary-fixed/40 flex items-center justify-center text-tertiary">
                      <span className="material-symbols-outlined text-2xl">arrow_downward_alt</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 bg-surface-container-low/60 -mx-5 -mb-5 px-5 py-3 text-xs space-y-1">
                    <div className="flex items-center justify-between text-on-surface">
                      <span className="">Hiển thị 5 trên tổng số 648 giao dịch đơn đặt phòng tháng 10/2026</span>
                      <span className="inline-block w-1 h-1 rounded-full bg-outline-variant"></span>
                      <span className="text-primary font-medium">Toàn bộ giao dịch đều được đồng bộ thời gian thực qua VNPay Gateway</span>
                    </div>
                    <div className="flex items-center justify-between text-on-surface-variant">
                      <span className="">Phụ thu & phí trễ hạn:</span>
                      <span className="">+115.800.000 ₫</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-tertiary font-semibold pt-1">
                      <span className="material-symbols-outlined text-sm">trending_up</span>
                      <span className="">+18.2% so với kỳ trước</span>
                    </div>
                  </div>
                </div>
                {/* Card 2: OUTFLOW (-) */}
                <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">2. Dòng tiền ra & Khấu trừ (Outflow)</span>
                      <div className="mt-2 text-2xl font-bold font-headline text-secondary tracking-tight">- 278.400.000 ₫</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-secondary-fixed/50 flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-2xl">remove_circle_outline</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 bg-surface-container-low/60 -mx-5 -mb-5 px-5 py-3 text-xs space-y-1">
                    <div className="flex items-center justify-between text-on-surface">
                      <span className="">Hiển thị 5 trên tổng số 648 giao dịch đơn đặt phòng tháng 10/2026</span>
                      <span className="inline-block w-1 h-1 rounded-full bg-outline-variant"></span>
                      <span className="text-primary font-medium">Toàn bộ giao dịch đều được đồng bộ thời gian thực qua VNPay Gateway</span>
                    </div>
                    <div className="flex items-center justify-between text-on-surface-variant">
                      <span className="">Phí cổng thanh toán (1.1%):</span>
                      <span className="">-54.200.000 ₫</span>
                    </div>
                    <div className="flex items-center justify-between text-on-surface-variant">
                      <span className="">Trợ giá voucher nền tảng:</span>
                      <span className="">-30.000.000 ₫</span>
                    </div>
                  </div>
                </div>
                {/* Card 3: NET PAYOUT (-) */}
                <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">3. Đã quyết toán cho Đối tác</span>
                      <div className="mt-2 text-2xl font-bold font-headline text-on-surface tracking-tight">- 4.396.400.000 ₫</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary-container">
                      <span className="material-symbols-outlined text-2xl">account_balance</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 bg-surface-container-low/60 -mx-5 -mb-5 px-5 py-3 text-xs space-y-1">
                    <div className="flex items-center justify-between text-on-surface">
                      <span className="">Hiển thị 5 trên tổng số 648 giao dịch đơn đặt phòng tháng 10/2026</span>
                      <span className="inline-block w-1 h-1 rounded-full bg-outline-variant"></span>
                      <span className="text-primary font-medium">Toàn bộ giao dịch đều được đồng bộ thời gian thực qua VNPay Gateway</span>
                    </div>
                    <div className="flex items-center justify-between text-on-surface-variant">
                      <span className="">Chu kỳ chuyển khoản:</span>
                      <span className="">Thứ 4 & Thứ 6 hàng tuần</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-on-surface-variant pt-1">
                      <span className="material-symbols-outlined text-sm text-tertiary">check_circle</span>
                      <span className="">100% lệnh qua Vietcombank Host-to-Host</span>
                    </div>
                  </div>
                </div>
                {/* Card 4: NET PLATFORM BALANCE (+) */}
                <div className="p-5 rounded-2xl bg-primary-container text-on-primary shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-on-primary-container">4. Thuần Hoa hồng & Quỹ Giữ Lại</span>
                      <div className="mt-2 text-2xl font-bold font-headline text-on-primary tracking-tight">+ 291.000.000 ₫</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-surface-container-lowest/15 flex items-center justify-center text-on-primary">
                      <span className="material-symbols-outlined text-2xl">savings</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 bg-black/10 -mx-5 -mb-5 px-5 py-3 text-xs space-y-1">
                    <div className="flex items-center justify-between text-on-primary">
                      <span className="">Hoa hồng StayReco (6.0%):</span>
                      <span className="font-semibold text-primary-fixed">+276.096.000 ₫</span>
                    </div>
                    <div className="flex items-center justify-between text-on-primary-container">
                      <span className="">Ký quỹ Escrow phong toả an toàn:</span>
                      <span className="">+46.000.000 ₫</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-tertiary-fixed text-[11px] pt-1">
                      <span className="material-symbols-outlined text-xs">shield</span>
                      <span className="">Trích lập quỹ StayReco Shield: 1.5%</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Interactive Waterfall Flowchart: 6-Step Breakdown */}
              {/* Real-time Ledger Section */}
              <div className="rounded-2xl bg-surface-container-lowest shadow-sm overflow-hidden flex flex-col">
                {/* Table Header & Controls */}
                <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold font-headline text-on-surface">Nhật ký Dòng tiền Đơn đặt phòng (Booking Cashflow Log)</h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">Theo dõi biến động dòng tiền nạp và hoàn trả phát sinh trực tiếp theo từng giao dịch đặt phòng</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Search Box */}
                    <div className="relative min-w-[240px]">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-lg">search</span>
                      <input className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-container-low text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary-container transition-all" placeholder="Tìm mã đơn #SR-..., khách sạn, tên khách..." type="text" />
                    </div>
                    {/* Type Filter Tabs */}
                    <div className="flex items-center rounded-lg bg-surface-container-low p-1 text-xs font-medium">
                      <button className="px-3 py-1 rounded-md bg-surface-container-lowest text-primary font-semibold shadow-sm">Tất cả</button>
                      <button className="px-3 py-1 rounded-md text-on-surface-variant hover:text-on-surface flex items-center gap-1">
                        <span className="text-tertiary font-bold">(+)</span>
                        Thu tiền đơn đặt
                      </button>
                      <button className="px-3 py-1 rounded-md text-on-surface-variant hover:text-on-surface flex items-center gap-1">
                        <span className="text-secondary font-bold">(-)</span>
                        Hoàn tiền hủy phòng
                      </button>
                    </div>
                    <button className="h-9 px-3 rounded-lg bg-surface-container-low text-on-surface text-xs font-medium hover:bg-surface-container transition-colors flex items-center gap-1.5" type="button">
                      <span className="material-symbols-outlined text-base">filter_list</span>
                      <span className="">Lọc nâng cao</span>
                    </button>
                  </div>
                </div>
                {/* Ledger Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant font-semibold tracking-wider uppercase text-[11px]">
                        <th className="py-3 px-4">Thời gian</th>
                        <th className="py-3 px-4">Mã Đơn Hàng</th>
                        <th className="py-3 px-4">Khách Sạn & Khách Hàng</th>
                        <th className="py-3 px-4">Loại Giao Dịch</th>
                        <th className="py-3 px-4 text-right">Số Tiền Biến Động</th>
                        <th className="py-3 px-4 text-center">Trạng Thái</th>
                        <th className="py-3 px-4 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-0 text-on-surface">
                      {/* Booking Row 1: Thu tiền (+) */}
                      <tr className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-on-surface">20/10/2026 09:22:15</div>
                          <div className="text-[11px] text-on-surface-variant">Cổng VNPay QR</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-primary text-sm">#SR-261020-0842</span>
                          <div className="text-[10px] text-on-surface-variant font-mono">Tx: VNP-9812248</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-on-surface">An Nhiên Riverside Hotel</div>
                          <div className="text-[11px] text-on-surface-variant">Khách: Trần Minh Quân • Phòng Deluxe River View</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-tertiary-fixed/50 text-tertiary">
                            <span className="material-symbols-outlined text-sm">add_circle</span>
                            (+) Thu tiền đơn đặt
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="text-base font-bold text-tertiary font-mono tracking-tight">+ 2.250.000 ₫</div>
                          <div className="text-[10px] text-on-surface-variant">Đã thanh toán 100%</div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-tertiary-fixed/40 text-tertiary">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                            Thành công
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button className="h-8 px-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary hover:text-primary-container text-xs font-semibold transition-colors inline-flex items-center gap-1 ml-auto" type="button">
                            <span className="material-symbols-outlined text-base">visibility</span>
                            <span className="">Chi tiết</span>
                          </button>
                        </td>
                      </tr>
                      {/* Booking Row 2: Hoàn tiền (-) */}
                      <tr className="hover:bg-surface-container-low/50 transition-colors bg-surface-container-low/20">
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-on-surface">19/10/2026 16:40:11</div>
                          <div className="text-[11px] text-on-surface-variant">Hoàn qua Thẻ Visa</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-error text-sm">#SR-261019-4109</span>
                          <div className="text-[10px] text-on-surface-variant font-mono">Tx: RF-9794011</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-on-surface">Hội An Chic Retreat</div>
                          <div className="text-[11px] text-on-surface-variant">Khách: Nguyễn Phương Linh • Lý do: Bão lũ StayShield</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-error-container text-error">
                            <span className="material-symbols-outlined text-sm">remove_circle</span>
                            (-) Hoàn tiền hủy phòng
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="text-base font-bold text-error font-mono tracking-tight">- 1.100.000 ₫</div>
                          <div className="text-[10px] text-on-surface-variant">Miễn phí hủy 100%</div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-tertiary-fixed/40 text-tertiary">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                            Đã hoàn tiền
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button className="h-8 px-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary hover:text-primary-container text-xs font-semibold transition-colors inline-flex items-center gap-1 ml-auto" type="button">
                            <span className="material-symbols-outlined text-base">visibility</span>
                            <span className="">Chi tiết</span>
                          </button>
                        </td>
                      </tr>
                      {/* Booking Row 3: Thu tiền (+) */}
                      <tr className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-on-surface">19/10/2026 14:15:30</div>
                          <div className="text-[11px] text-on-surface-variant">Cổng VNPay (Thẻ ATM)</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-primary text-sm">#SR-261019-3982</span>
                          <div className="text-[10px] text-on-surface-variant font-mono">Tx: VNP-9801123</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-on-surface">Boutique Hoi An Resort</div>
                          <div className="text-[11px] text-on-surface-variant">Khách: Đặng Hoàng Nam • Phòng Suite Hướng Biển (2 đêm)</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-tertiary-fixed/50 text-tertiary">
                            <span className="material-symbols-outlined text-sm">add_circle</span>
                            (+) Thu tiền đơn đặt
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="text-base font-bold text-tertiary font-mono tracking-tight">+ 3.840.000 ₫</div>
                          <div className="text-[10px] text-on-surface-variant">Đã thanh toán 100%</div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-tertiary-fixed/40 text-tertiary">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                            Thành công
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button className="h-8 px-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary hover:text-primary-container text-xs font-semibold transition-colors inline-flex items-center gap-1 ml-auto" type="button">
                            <span className="material-symbols-outlined text-base">visibility</span>
                            <span className="">Chi tiết</span>
                          </button>
                        </td>
                      </tr>
                      {/* Booking Row 4: Thu tiền (+) */}
                      <tr className="hover:bg-surface-container-low/50 transition-colors bg-surface-container-low/20">
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-on-surface">19/10/2026 11:05:42</div>
                          <div className="text-[11px] text-on-surface-variant">Cổng VNPay (Thẻ Quốc tế)</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-primary text-sm">#SR-261019-3890</span>
                          <div className="text-[10px] text-on-surface-variant font-mono">Tx: VNP-9799201</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-on-surface">Silk Sense Hoi An River Resort</div>
                          <div className="text-[11px] text-on-surface-variant">Khách: Sarah Jenkins • Phòng Superior Garden View</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-tertiary-fixed/50 text-tertiary">
                            <span className="material-symbols-outlined text-sm">add_circle</span>
                            (+) Thu tiền đơn đặt
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="text-base font-bold text-tertiary font-mono tracking-tight">+ 1.850.000 ₫</div>
                          <div className="text-[10px] text-on-surface-variant">Đã thanh toán 100%</div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-tertiary-fixed/40 text-tertiary">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                            Thành công
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button className="h-8 px-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary hover:text-primary-container text-xs font-semibold transition-colors inline-flex items-center gap-1 ml-auto" type="button">
                            <span className="material-symbols-outlined text-base">visibility</span>
                            <span className="">Chi tiết</span>
                          </button>
                        </td>
                      </tr>
                      {/* Booking Row 5: Hoàn tiền (-) */}
                      <tr className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-on-surface">18/10/2026 21:10:04</div>
                          <div className="text-[11px] text-on-surface-variant">Hoàn qua VNPay QR</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-error text-sm">#SR-261018-3612</span>
                          <div className="text-[10px] text-on-surface-variant font-mono">Tx: RF-9781420</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-on-surface">Four Seasons Resort The Nam Hai</div>
                          <div className="text-[11px] text-on-surface-variant">Khách: Phạm Quốc Tuấn • Lý do: Hủy trước 48h miễn phí</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-error-container text-error">
                            <span className="material-symbols-outlined text-sm">remove_circle</span>
                            (-) Hoàn tiền hủy phòng
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="text-base font-bold text-error font-mono tracking-tight">- 5.400.000 ₫</div>
                          <div className="text-[10px] text-on-surface-variant">Miễn phí hủy 100%</div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-tertiary-fixed/40 text-tertiary">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                            Đã hoàn tiền
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button className="h-8 px-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary hover:text-primary-container text-xs font-semibold transition-colors inline-flex items-center gap-1 ml-auto" type="button">
                            <span className="material-symbols-outlined text-base">visibility</span>
                            <span className="">Chi tiết</span>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {/* Pagination & Ledger Summary Footer */}
                <div className="p-4 bg-surface-container-low/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <span className="">Hiển thị 5 trên tổng số 648 giao dịch đơn đặt phòng tháng 10/2026</span>
                    <span className="inline-block w-1 h-1 rounded-full bg-outline-variant"></span>
                    <span className="text-primary font-medium">Toàn bộ giao dịch đều được đồng bộ thời gian thực qua VNPay Gateway</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-surface disabled:opacity-40" disabled>
                      <span className="material-symbols-outlined text-base">chevron_left</span>
                    </button>
                    <button className="w-8 h-8 rounded-lg bg-primary text-on-primary font-bold">1</button>
                    <button className="w-8 h-8 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container">2</button>
                    <button className="w-8 h-8 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container">3</button>
                    <span className="px-1 text-on-surface-variant">...</span>
                    <button className="w-8 h-8 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container">184</button>
                    <button className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-surface hover:bg-surface-container">
                      <span className="material-symbols-outlined text-base">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>
              {/* Security, Compliance & Escrow Verification Notice Card */}
              <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-tertiary-fixed/50 flex items-center justify-center text-tertiary shrink-0">
                    <span className="material-symbols-outlined text-2xl">verified_user</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold font-headline text-on-surface">Cơ chế Kiểm soát Dòng tiền Escrow & Chứng chỉ Chữ ký số Kế toán</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-tertiary-fixed text-on-tertiary-fixed">Đã kiểm toán độc lập</span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed max-w-3xl">Tài khoản nhận tiền phòng của khách hàng được phong toả độc lập tại Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank). StayReco cam kết không chiếm dụng vốn của đối tác lưu trú; hoa hồng 6% chỉ được trích thu sau khi dịch vụ kết thúc an toàn và không có khiếu nại phát sinh.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 self-end lg:self-auto">
                  <div className="text-right">
                    <div className="text-[11px] font-semibold text-on-surface">Mã Checksum Sổ cái Kỳ này:</div>
                    <div className="text-[10px] font-mono text-on-surface-variant">SHA256: 4f89...e10a</div>
                  </div>
                  <button className="h-9 px-3.5 rounded-lg bg-surface-container-low text-primary text-xs font-semibold hover:bg-surface-container transition-colors flex items-center gap-1.5" type="button">
                    <span className="material-symbols-outlined text-base">verified</span>
                    <span className="">Tải file xác thực đối soát</span>
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
