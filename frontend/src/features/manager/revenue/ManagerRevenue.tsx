/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Legacy JSX screen pending React state migration.
import React from "react";

export default function ManagerRevenue() {
  React.useEffect(() => {
    try {
      () => {
        // Sync active state in the App Shell sidebar
        const navLinks = document.querySelectorAll("aside nav a");
        navLinks.forEach((link) => {
          if (link.getAttribute("data-path") === "doanh-thu-&-hoa-hong") {
            link.className =
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold bg-primary-container text-on-primary shadow-[0_2px_8px_rgba(35,78,112,0.12)]";
          }
        });
      };
    } catch (err) {
      console.error("Error executing interaction script:", err);
    }
  }, []);

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
            <span className="">Tổng quan & Tăng trưởng</span>
          </a>
          <a
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
            data-path="duyet-ho-so-doi-tac"
            href="#"
          >
            <span className="material-symbols-outlined text-xl">
              verified_user
            </span>
            <span className="">Duyệt hồ sơ đối tác</span>
          </a>
          <a
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
            data-path="giam-sat-doi-tac"
            href="#"
          >
            <span className="material-symbols-outlined text-xl">
              storefront
            </span>
            <span className="">Giám sát đối tác</span>
          </a>
          <a
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
            data-path="tuan-thu-&-vi-pham"
            href="#"
          >
            <span className="material-symbols-outlined text-xl">gavel</span>
            <span className="">Tuân thủ & Vi phạm</span>
          </a>
          <a
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold bg-primary-container text-on-primary shadow-[0_2px_8px_rgba(35,78,112,0.12)]"
            data-path="doanh-thu-&-hoa-hong"
            href="#"
          >
            <span className="material-symbols-outlined text-xl">payments</span>
            <span className="">Doanh thu & Hoa hồng</span>
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
          <div className="flex flex-col w-full">
            {/* Top Hero/Header Ribbon */}
            <div className="p-8 pb-6 flex flex-col gap-6">
              {/* Breadcrumb & System State Info */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <nav className="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
                  <span className="">Quản trị nền tảng</span>
                  <span className="material-symbols-outlined text-sm text-outline">
                    chevron_right
                  </span>
                  <span className="text-primary font-semibold">
                    Báo cáo Tài chính & Doanh thu Sàn
                  </span>
                </nav>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium bg-surface-container-low px-3 py-1.5 rounded-full shadow-sm">
                  <span className="inline-block w-2 h-2 rounded-full bg-tertiary"></span>
                  <span className="">
                    Kỳ hạch toán tự động: Chu kỳ Thứ Hai (25/10/2026)
                  </span>
                </div>
              </div>
              {/* Title & Executive Action Suite */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="max-w-2xl">
                  <h1 className="text-2xl lg:text-3xl font-bold font-headline text-primary tracking-tight">
                    Báo cáo Doanh thu Hoa hồng & Đối soát Doanh số Nền tảng
                  </h1>
                  <p className="mt-1.5 text-sm text-on-surface-variant">
                    Theo dõi tổng doanh thu GMV, tỷ lệ chiết khấu cố định minh
                    bạch 6% và tiến độ thanh toán tài khoản thụ hưởng của toàn
                    bộ đối tác lưu trú.
                  </p>
                </div>
                {/* Primary Operational Actions */}
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <button
                    className="h-11 px-4 rounded-xl bg-primary-fixed text-on-primary-fixed text-sm font-semibold shadow-sm hover:bg-primary-container hover:text-on-primary transition-all flex items-center gap-2 active:scale-95"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-xl">
                      account_balance
                    </span>
                  </button>
                  <button
                    className="h-11 px-4 rounded-xl bg-surface-container-lowest text-primary text-sm font-semibold shadow-sm hover:bg-surface-container-high transition-all flex items-center gap-2 active:scale-95"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-xl">
                      history
                    </span>
                    <span className="">Lịch sử chu kỳ thanh toán</span>
                  </button>
                  <button
                    className="h-11 px-5 rounded-xl bg-primary-container text-on-primary text-sm font-semibold shadow-md hover:bg-primary transition-all flex items-center gap-2 active:scale-95"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-xl">
                      file_download
                    </span>
                    <span className="">
                      Xuất file đối soát kế toán (Excel / CSV)
                    </span>
                  </button>
                </div>
              </div>
              {/* Global Control & Filtering Bar */}
              <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm flex flex-wrap lg:flex-nowrap items-center gap-3">
                {/* Period Selector */}
                <div className="flex items-center gap-2 bg-surface-container-low px-3.5 py-2 rounded-xl text-sm min-w-[280px]">
                  <span className="material-symbols-outlined text-primary text-xl">
                    calendar_month
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">
                      Kỳ báo cáo
                    </span>
                    <span className="font-semibold text-on-surface">
                      Tháng 10/2026 (01/10 - 31/10)
                    </span>
                  </div>
                  <span className="ml-auto inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-tertiary-fixed text-on-tertiary-fixed">
                    <span className="material-symbols-outlined text-sm">
                      trending_up
                    </span>
                    +18.2%
                  </span>
                </div>
                {/* Quick Region Dropdown Filter */}
                <div className="relative flex-1 min-w-[160px]">
                  <select className="w-full h-11 pl-9 pr-8 bg-surface-container-low text-sm font-medium text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-container appearance-none cursor-pointer">
                    <option value="all">Tất cả khu vực (Toàn quốc)</option>
                    <option value="dn">Đà Nẵng</option>
                    <option value="ha">Hội An</option>
                    <option value="dl">Đà Lạt</option>
                    <option value="pq">Phú Quốc</option>
                  </select>
                  <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-lg pointer-events-none">
                    location_on
                  </span>
                  <span className="material-symbols-outlined absolute right-3 top-3 text-on-surface-variant text-lg pointer-events-none">
                    expand_more
                  </span>
                </div>
                {/* Commission Model Filter */}
                <div className="relative flex-1 min-w-[170px]">
                  <select className="w-full h-11 pl-9 pr-8 bg-surface-container-low text-sm font-medium text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-container appearance-none cursor-pointer">
                    <option value="standard">
                      Tỷ lệ hoa hồng: Tiêu chuẩn 6%
                    </option>
                    <option value="all">Tất cả tỷ lệ áp dụng</option>
                  </select>
                  <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-lg pointer-events-none">
                    percent
                  </span>
                  <span className="material-symbols-outlined absolute right-3 top-3 text-on-surface-variant text-lg pointer-events-none">
                    expand_more
                  </span>
                </div>
                {/* Settlement Status Filter */}
                <div className="relative flex-1 min-w-[170px]">
                  <select className="w-full h-11 pl-9 pr-8 bg-surface-container-low text-sm font-medium text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-container appearance-none cursor-pointer">
                    <option value="all">Tất cả trạng thái quyết toán</option>
                    <option value="paid">Đã quyết toán hoàn tất</option>
                    <option value="pending">Chờ đối soát (Kỳ 25/10)</option>
                    <option value="hold">Đang giữ cấn trừ</option>
                  </select>
                  <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-lg pointer-events-none">
                    rule
                  </span>
                  <span className="material-symbols-outlined absolute right-3 top-3 text-on-surface-variant text-lg pointer-events-none">
                    expand_more
                  </span>
                </div>
                <button
                  className="h-11 px-4 rounded-xl bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high text-sm font-semibold transition-colors flex items-center justify-center shrink-0"
                  type="button"
                >
                  <span className="material-symbols-outlined text-lg">
                    restart_alt
                  </span>
                  <span className="ml-1.5 hidden sm:inline">Đặt lại</span>
                </button>
              </div>
            </div>
            {/* KPI Cards Grid (4 Cards) */}
            <div className="px-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {/* Card 1: GMV */}
              <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl bg-primary-fixed text-on-primary-fixed">
                    <span className="material-symbols-outlined text-2xl">
                      receipt_long
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-0.5 text-xs font-bold text-tertiary">
                    <span className="material-symbols-outlined text-sm">
                      arrow_upward
                    </span>
                    +18.2%
                  </span>
                </div>
                <div className="mt-4">
                  <span className="text-xs uppercase font-bold tracking-wider text-on-surface-variant block">
                    Tổng Doanh số Đặt phòng (GMV)
                  </span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold font-headline text-on-surface tracking-tight">
                      4.850.000.000
                    </span>
                    <span className="text-sm font-medium text-on-surface-variant">
                      ₫
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-primary">
                      check_circle
                    </span>
                    <span className="">
                      <strong>3.820</strong>
                      lượt đặt phòng hoàn tất
                    </span>
                  </p>
                </div>
              </div>
              {/* Card 2: Net Commission */}
              <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed">
                    <span className="material-symbols-outlined text-2xl">
                      account_balance_wallet
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary-container text-on-primary">
                    Cố định 6.0%
                  </span>
                </div>
                <div className="mt-4">
                  <span className="text-xs uppercase font-bold tracking-wider text-on-surface-variant block">
                    Doanh thu Hoa hồng Sàn
                  </span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold font-headline text-tertiary tracking-tight">
                      291.000.000
                    </span>
                    <span className="text-sm font-medium text-on-surface-variant">
                      ₫
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-tertiary">
                      verified
                    </span>
                    <span className="">
                      Chiết khấu trực tiếp, không phí phát sinh
                    </span>
                  </p>
                </div>
              </div>
              {/* Card 3: Settled Commission */}
              <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl bg-surface-container-high text-primary">
                    <span className="material-symbols-outlined text-2xl">
                      verified_user
                    </span>
                  </div>
                  <span className="text-xs font-bold text-tertiary bg-tertiary-fixed/60 px-2 py-0.5 rounded-full">
                    84.2% Hoàn tất
                  </span>
                </div>
                <div className="mt-4">
                  <span className="text-xs uppercase font-bold tracking-wider text-on-surface-variant block">
                    Đã Thu hồi & Đối soát Thành công
                  </span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold font-headline text-on-surface tracking-tight">
                      245.000.000
                    </span>
                    <span className="text-sm font-medium text-on-surface-variant">
                      ₫
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-tertiary h-full rounded-full"
                      style={{ width: "84.2%" }}
                    ></div>
                  </div>
                </div>
              </div>
              {/* Card 4: Outstanding Commission */}
              <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl bg-secondary-fixed text-on-secondary-fixed">
                    <span className="material-symbols-outlined text-2xl">
                      pending_actions
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-secondary/15 text-secondary">
                    Kỳ 25/10
                  </span>
                </div>
                <div className="mt-4">
                  <span className="text-xs uppercase font-bold tracking-wider text-on-surface-variant block">
                    Khoản Phải thu Còn lại
                  </span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold font-headline text-secondary tracking-tight">
                      46.000.000
                    </span>
                    <span className="text-sm font-medium text-on-surface-variant">
                      ₫
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-secondary">
                      schedule
                    </span>
                    <span className="">
                      <strong>14 đối tác</strong>
                      đang chuẩn bị lệnh giải ngân
                    </span>
                  </p>
                </div>
              </div>
            </div>
            {/* Analytics & Trend Breakdown Section */}
            <div className="p-8 pb-0">
              <div className="mb-4 p-4 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl text-primary">
                      account_balance
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold font-headline text-on-surface">
                        Báo cáo Dòng tiền & Biến động Số dư
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-tertiary-fixed text-on-tertiary-fixed">
                        Thời gian thực
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Kiểm tra chi tiết đối soát dòng tiền vào/ra, chiết khấu 6%
                      và quỹ bảo đảm thanh toán.
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  <a
                    href="/manager/revenue/cashflow"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-container hover:bg-primary text-on-primary text-sm font-semibold rounded-xl shadow-md transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-lg">
                      account_balance
                    </span>
                    <span className="">Chi tiết dòng tiền</span>
                    <span className="material-symbols-outlined text-lg">
                      arrow_forward
                    </span>
                  </a>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-xl">
                        query_stats
                      </span>
                      <h2 className="text-base font-bold font-headline text-on-surface">
                        Biểu đồ Phân bổ Doanh thu Hoa hồng theo Vùng địa lý & Xu
                        hướng Tuần
                      </h2>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Đà Nẵng & Hội An tiếp tục giữ vị thế trọng tâm du lịch
                      Boutique với 48% thị phần đóng góp hoa hồng sàn.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-primary-container"></span>
                      <span className="text-on-surface-variant font-medium">
                        Đà Nẵng & Hội An (48%)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-secondary"></span>
                      <span className="text-on-surface-variant font-medium">
                        Đà Lạt (24%)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-tertiary-container"></span>
                      <span className="text-on-surface-variant font-medium">
                        Phú Quốc (18%)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-surface-container-high"></span>
                      <span className="text-on-surface-variant font-medium">
                        Khu vực khác (10%)
                      </span>
                    </div>
                    <a
                      href="#"
                      data-target="m07-cash-flow"
                      className="ml-auto md:ml-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-semibold text-xs shadow-md transition-all active:scale-95 border-0"
                    >
                      <span className="material-symbols-outlined text-base">
                        account_balance
                      </span>
                      <span className="">Xem chi tiết dòng tiền (M07)</span>
                      <span className="material-symbols-outlined text-sm">
                        arrow_forward
                      </span>
                    </a>
                  </div>
                </div>
                {/* Graphical Representation: Regional Split & Weekly Flow */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 items-center">
                  {/* Progress Bar / Distribution Bar */}
                  <div className="lg:col-span-12">
                    <div className="flex h-4 w-full rounded-full overflow-hidden bg-surface-container-low p-0.5">
                      <div
                        className="bg-primary-container h-full rounded-l-full transition-all"
                        style={{ width: "48%" }}
                        title="Đà Nẵng & Hội An: 48%"
                      ></div>
                      <div
                        className="bg-secondary h-full transition-all"
                        style={{ width: "24%" }}
                        title="Đà Lạt: 24%"
                      ></div>
                      <div
                        className="bg-tertiary-container h-full transition-all"
                        style={{ width: "18%" }}
                        title="Phú Quốc: 18%"
                      ></div>
                      <div
                        className="bg-surface-variant h-full rounded-r-full transition-all"
                        style={{ width: "10%" }}
                        title="Khu vực khác: 10%"
                      ></div>
                    </div>
                  </div>
                  {/* Weekly Performance Sparkline / Bars */}
                  <div className="lg:col-span-8 bg-surface-container-low p-5 rounded-xl">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                        Tiến độ doanh thu theo 4 Tuần hạch toán (VNĐ)
                      </span>
                      <span className="text-xs font-semibold text-primary">
                        Trung bình: 72.75M / tuần
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 h-40 items-end pt-4 px-2">
                      {/* W1 */}
                      <div className="flex flex-col items-center gap-2 h-full justify-end group">
                        <div className="text-[11px] font-semibold text-on-surface opacity-0 group-hover:opacity-100 transition-opacity">
                          64.5M
                        </div>
                        <div
                          className="w-full bg-primary/20 hover:bg-primary rounded-t-lg transition-all"
                          style={{ height: "62%" }}
                        ></div>
                        <span className="text-xs font-medium text-on-surface-variant">
                          Tuần 1 (01-07)
                        </span>
                      </div>
                      {/* W2 */}
                      <div className="flex flex-col items-center gap-2 h-full justify-end group">
                        <div className="text-[11px] font-semibold text-on-surface opacity-0 group-hover:opacity-100 transition-opacity">
                          71.8M
                        </div>
                        <div
                          className="w-full bg-primary/20 hover:bg-primary rounded-t-lg transition-all"
                          style={{ height: "74%" }}
                        ></div>
                        <span className="text-xs font-medium text-on-surface-variant">
                          Tuần 2 (08-14)
                        </span>
                      </div>
                      {/* W3 */}
                      <div className="flex flex-col items-center gap-2 h-full justify-end group">
                        <div className="text-[11px] font-semibold text-on-surface opacity-0 group-hover:opacity-100 transition-opacity">
                          82.3M
                        </div>
                        <div
                          className="w-full bg-primary/20 hover:bg-primary rounded-t-lg transition-all"
                          style={{ height: "88%" }}
                        ></div>
                        <span className="text-xs font-medium text-on-surface-variant">
                          Tuần 3 (15-21)
                        </span>
                      </div>
                      {/* W4 */}
                      <div className="flex flex-col items-center gap-2 h-full justify-end group">
                        <div className="text-[11px] font-semibold text-on-surface opacity-0 group-hover:opacity-100 transition-opacity">
                          72.4M
                        </div>
                        <div
                          className="w-full bg-primary-container hover:bg-primary rounded-t-lg transition-all relative"
                          style={{ height: "78%" }}
                        >
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-surface-container-lowest px-1.5 py-0.5 rounded shadow-sm text-[10px] font-bold text-primary">
                            Hiện tại
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-primary">
                          Tuần 4 (22-31)
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Metric Snapshot Quick View */}
                  <div className="lg:col-span-4 flex flex-col gap-3">
                    <div className="bg-surface-container-low p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary font-bold text-sm">
                          48%
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-on-surface">
                            Đà Nẵng & Hội An
                          </h4>
                          <p className="text-[11px] text-on-surface-variant">
                            139.680.000 ₫ hoa hồng ghi nhận
                          </p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-tertiary text-lg">
                        check
                      </span>
                    </div>
                    <div className="bg-surface-container-low p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-secondary font-bold text-sm">
                          24%
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-on-surface">
                            Đà Lạt
                          </h4>
                          <p className="text-[11px] text-on-surface-variant">
                            69.840.000 ₫ hoa hồng ghi nhận
                          </p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-tertiary text-lg">
                        check
                      </span>
                    </div>
                    <div className="bg-surface-container-low p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-tertiary font-bold text-sm">
                          18%
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-on-surface">
                            Phú Quốc & Khác
                          </h4>
                          <p className="text-[11px] text-on-surface-variant">
                            81.480.000 ₫ hoa hồng ghi nhận
                          </p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-secondary text-lg">
                        schedule
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Operational Table Section */}
            <div className="p-8">
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
                {/* Table Header & Controls */}
                <div className="p-6 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold font-headline text-on-surface">
                      Chi tiết Doanh số & Đối soát Hoa hồng từng Đối tác Khách
                      sạn
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Dữ liệu ghi nhận tự động theo thời gian thực từ cổng thanh
                      toán và xác nhận lưu trú đã hoàn tất (Check-out).
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <input
                        className="h-10 pl-9 pr-3 rounded-xl bg-surface-container-low text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container w-64 transition-all"
                        placeholder="Tìm theo tên/mã đối tác..."
                        type="text"
                      />
                      <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-on-surface-variant text-base">
                        search
                      </span>
                    </div>
                    <button
                      aria-label="Bộ lọc nâng cao"
                      className="h-10 w-10 rounded-xl bg-surface-container-low text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-lg">
                        tune
                      </span>
                    </button>
                  </div>
                </div>
                {/* Table Container */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">
                        <th className="py-3.5 pl-6 pr-4" scope="col">
                          Khách sạn & Mã Đối tác
                        </th>
                        <th className="py-3.5 px-3" scope="col">
                          Khu vực
                        </th>
                        <th className="py-3.5 px-3 text-right" scope="col">
                          Booking xong
                        </th>
                        <th className="py-3.5 px-3 text-right" scope="col">
                          Tổng GMV Tiền phòng
                        </th>
                        <th className="py-3.5 px-3 text-center" scope="col">
                          Tỷ lệ
                        </th>
                        <th className="py-3.5 px-3 text-right" scope="col">
                          Hoa hồng Sàn
                        </th>
                        <th className="py-3.5 px-3 text-right" scope="col">
                          Trừ Trợ giá
                        </th>
                        <th
                          className="py-3.5 px-3 text-right font-bold text-on-surface"
                          scope="col"
                        >
                          Thực nhận
                        </th>
                        <th className="py-3.5 px-3 text-center" scope="col">
                          Trạng thái
                        </th>
                        <th className="py-3.5 pr-6 pl-4 text-right" scope="col">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-0 text-xs">
                      {/* Row 1 */}
                      <tr className="hover:bg-surface-container-low transition-colors group">
                        <td className="py-4 pl-6 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-surface-container-high overflow-hidden shrink-0 flex items-center justify-center text-primary font-bold">
                              <img
                                className="w-full h-full object-cover"
                                data-alt="Charming boutique hotel facade in Da Nang with warm stone walls, lush tropical greenery, and handcrafted wooden entryway lanterns in the soft morning sunlight."
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZVcgz2A3hB1JAgnuGnTV4IDhh7unFY9kmb8WdYOB9Tmk15gvRP1X7fgNKIbDVCSZOCbaUIxSstIqmGcZRLWYZlyDBmDbZ6ti6bBE2ja0NmheW-QyLeZlkylaWABgY2GeQv-SdZUU4jfUlzKBJ3oSls-mUYKodecFmJLMZaTkmXkicHnqqbMoRFeeVTWW8KQB-KUV5kr_yytuzR97sDHmwCsUYCTqThPO7QrYlK_4KMPz3AHtgf_nx"
                              />
                            </div>
                            <div>
                              <div className="font-bold text-on-surface group-hover:text-primary transition-colors text-[13px]">
                                An Nhiên Riverside Hotel
                              </div>
                              <div className="text-[11px] text-on-surface-variant font-mono">
                                #ANR-DN-01
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-container text-on-surface-variant">
                            Đà Nẵng
                          </span>
                        </td>
                        <td className="py-4 px-3 text-right font-medium text-on-surface">
                          228 đơn
                        </td>
                        <td className="py-4 px-3 text-right font-semibold text-on-surface font-mono">
                          285.000.000 ₫
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-surface-container text-[11px] font-bold text-primary">
                            6.0%
                          </span>
                        </td>
                        <td className="py-4 px-3 text-right font-mono font-medium text-on-surface">
                          17.100.000 ₫
                        </td>
                        <td className="py-4 px-3 text-right font-mono text-on-surface-variant">
                          - 0 ₫
                        </td>
                        <td className="py-4 px-3 text-right font-mono font-bold text-primary text-[13px]">
                          17.100.000 ₫
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-tertiary-fixed text-on-tertiary-fixed">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                            Đã quyết toán
                          </span>
                        </td>
                        <td className="py-4 pr-6 pl-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-medium text-xs transition-colors"
                              type="button"
                            >
                              Xem bảng kê
                            </button>
                            <button
                              className="px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface font-medium text-xs transition-colors flex items-center gap-1"
                              title="Tải hóa đơn điện tử VAT"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-sm">
                                download
                              </span>
                              VAT
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Row 2 */}
                      <tr className="hover:bg-surface-container-low transition-colors group">
                        <td className="py-4 pl-6 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-surface-container-high overflow-hidden shrink-0 flex items-center justify-center text-primary font-bold">
                              <img
                                className="w-full h-full object-cover"
                                data-alt="Traditional terracotta-roofed heritage boutique villa in Hoi An ancient town with hanging silk lanterns and potted lotus plants under golden sunset."
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMr5_5y0Z924e3WeaR6besMEYEQ0-clXgWrfWP22huniPpfxJYsTZIiLmJ-LBOQnmZrnn51sBTNFn74p3VE1BZTBKOpcR3LJYzn02o3X24XZgbN9BOOYv-W_bPT9LscmHGYkknYh1ok01eToPjrI34-9Ep8yiZKLgUYamlLX4T47uQSTwHlXrtVWg1frQEjTN6bKgBDRydtQIyQpppzCTl8HyRQWdig9kuTS8JfJRfp7tfbubMT08G"
                              />
                            </div>
                            <div>
                              <div className="font-bold text-on-surface group-hover:text-primary transition-colors text-[13px]">
                                Phố Hoài Heritage Villa
                              </div>
                              <div className="text-[11px] text-on-surface-variant font-mono">
                                #PHH-HA-02
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-container text-on-surface-variant">
                            Hội An
                          </span>
                        </td>
                        <td className="py-4 px-3 text-right font-medium text-on-surface">
                          196 đơn
                        </td>
                        <td className="py-4 px-3 text-right font-semibold text-on-surface font-mono">
                          215.600.000 ₫
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-surface-container text-[11px] font-bold text-primary">
                            6.0%
                          </span>
                        </td>
                        <td className="py-4 px-3 text-right font-mono font-medium text-on-surface">
                          12.936.000 ₫
                        </td>
                        <td className="py-4 px-3 text-right font-mono text-on-surface-variant">
                          - 0 ₫
                        </td>
                        <td className="py-4 px-3 text-right font-mono font-bold text-primary text-[13px]">
                          12.936.000 ₫
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-tertiary-fixed text-on-tertiary-fixed">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                            Đã quyết toán
                          </span>
                        </td>
                        <td className="py-4 pr-6 pl-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-medium text-xs transition-colors"
                              type="button"
                            >
                              Xem bảng kê
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Row 3 */}
                      <tr className="hover:bg-surface-container-low transition-colors group">
                        <td className="py-4 pl-6 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-surface-container-high overflow-hidden shrink-0 flex items-center justify-center text-primary font-bold">
                              <img
                                className="w-full h-full object-cover"
                                data-alt="Eco-lodge situated on pine-forested hill in Da Lat with wooden architecture, warm indoor hearth, and panoramic misty mountain views."
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDOZatZy4xMMatfsJfPHwgdxum8zEhQsidvGDbfxCXdHl0mH7YoOuxJZGQkqnmUy42omFh3X8ULKSt1Cp0hAFkgGEC2OdRF0AtFnlS7n9tzH2EyAi1YUxuUEdrhrfy3_QC1iPq8G3cK9MU4-QuWPJFilNZElW92wmrLqJFTnf0-vDP06m2-jZtMW2dvKQuaRMDt161AA0sd4JDfet3aQneOEyKVFuOR27F7yKYEm--5guGQ7uMsMT5Q"
                              />
                            </div>
                            <div>
                              <div className="font-bold text-on-surface group-hover:text-primary transition-colors text-[13px]">
                                Mộc Nhiên Eco-Lodge
                              </div>
                              <div className="text-[11px] text-on-surface-variant font-mono">
                                #MNE-DL-03
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-container text-on-surface-variant">
                            Đà Lạt
                          </span>
                        </td>
                        <td className="py-4 px-3 text-right font-medium text-on-surface">
                          172 đơn
                        </td>
                        <td className="py-4 px-3 text-right font-semibold text-on-surface font-mono">
                          249.400.000 ₫
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-surface-container text-[11px] font-bold text-primary">
                            6.0%
                          </span>
                        </td>
                        <td className="py-4 px-3 text-right font-mono font-medium text-on-surface">
                          14.964.000 ₫
                        </td>
                        <td className="py-4 px-3 text-right font-mono text-on-surface-variant">
                          - 0 ₫
                        </td>
                        <td className="py-4 px-3 text-right font-mono font-bold text-primary text-[13px]">
                          14.964.000 ₫
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-tertiary-fixed text-on-tertiary-fixed">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                            Đã quyết toán
                          </span>
                        </td>
                        <td className="py-4 pr-6 pl-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-medium text-xs transition-colors"
                              type="button"
                            >
                              Xem bảng kê
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Row 4 (Pending Cycle) */}
                      <tr className="hover:bg-surface-container-low transition-colors group bg-secondary-fixed/20">
                        <td className="py-4 pl-6 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-surface-container-high overflow-hidden shrink-0 flex items-center justify-center text-primary font-bold">
                              <img
                                className="w-full h-full object-cover"
                                data-alt="Luxury coastal boutique resort in Phu Quoc overlooking calm blue sea waters with thatched pavilion rooftops and sunlit infinity pool."
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAFAnYkpJZ6YSi67oTlGMWjWTHy3dFyhcZCTbCwL2vChFrj5x3B6SvRPjAlpTnpQbdactXN1mEW8Bku1A1ob2uq8nnu8ZfADXzZYX_WRIqSWrUTF6iABVGqKVT0eX-UyodOvljzuEcTncGU-_Y0sAtAoemYOw6AjWuysrpGQnFKT6xqEDYakkJ6cOiMpNbKvkhSMSA7R7XWdA9yTnfXNwaM-TgjD5fwIZQ-g5Ey8h2X3EIYPm9Z4Wt0"
                              />
                            </div>
                            <div>
                              <div className="font-bold text-on-surface group-hover:text-primary transition-colors text-[13px]">
                                Sunset Bay Boutique Retreat
                              </div>
                              <div className="text-[11px] text-on-surface-variant font-mono">
                                #SBR-PQ-04
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-container text-on-surface-variant">
                            Phú Quốc
                          </span>
                        </td>
                        <td className="py-4 px-3 text-right font-medium text-on-surface">
                          165 đơn
                        </td>
                        <td className="py-4 px-3 text-right font-semibold text-on-surface font-mono">
                          354.750.000 ₫
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-surface-container text-[11px] font-bold text-primary">
                            6.0%
                          </span>
                        </td>
                        <td className="py-4 px-3 text-right font-mono font-medium text-on-surface">
                          21.285.000 ₫
                        </td>
                        <td className="py-4 px-3 text-right font-mono text-on-surface-variant">
                          - 0 ₫
                        </td>
                        <td className="py-4 px-3 text-right font-mono font-bold text-secondary text-[13px]">
                          21.285.000 ₫
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-secondary-container text-on-secondary-container">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                            Chờ đối soát kỳ 25/10
                          </span>
                        </td>
                        <td className="py-4 pr-6 pl-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="px-3 py-1.5 rounded-lg bg-secondary text-on-secondary hover:bg-secondary/90 font-medium text-xs transition-colors flex items-center gap-1 shadow-sm"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-sm">
                                send
                              </span>
                              Gửi thông báo đối soát
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Row 5 */}
                      <tr className="hover:bg-surface-container-low transition-colors group">
                        <td className="py-4 pl-6 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-surface-container-high overflow-hidden shrink-0 flex items-center justify-center text-primary font-bold">
                              <img
                                className="w-full h-full object-cover"
                                data-alt="Serene boutique villa in Da Nang centered around an interior courtyard with blooming lotus flowers, handcrafted ceramic vessels, and teak wood furniture."
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtCCNZwZ1DbC6ufWtesh8zIC_cCVyyrdx2Xpr3nCVnfVvV-z4gnbitmJMv1gG47VqBAEViObZKfu1HqPo65biSfzLzdML0FVbDlJ6qIdzSEACK2yilAsE3lApsUveSdhvd0J41ilv_WqirUX0Mh4FKIMsge7vPLDat2vIU5E48NgVWyJXdY1q8e6dA52Zf1NRvNMhglMVt18I27ILoseyYCIXe9_7xP6b6yau_8RYwPrOY5sK_fk9h"
                              />
                            </div>
                            <div>
                              <div className="font-bold text-on-surface group-hover:text-primary transition-colors text-[13px]">
                                Sen Boutique Heritage Villa
                              </div>
                              <div className="text-[11px] text-on-surface-variant font-mono">
                                #SBH-DN-05
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-container text-on-surface-variant">
                            Đà Nẵng
                          </span>
                        </td>
                        <td className="py-4 px-3 text-right font-medium text-on-surface">
                          142 đơn
                        </td>
                        <td className="py-4 px-3 text-right font-semibold text-on-surface font-mono">
                          170.400.000 ₫
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-surface-container text-[11px] font-bold text-primary">
                            6.0%
                          </span>
                        </td>
                        <td className="py-4 px-3 text-right font-mono font-medium text-on-surface">
                          10.224.000 ₫
                        </td>
                        <td className="py-4 px-3 text-right font-mono text-on-surface-variant">
                          - 0 ₫
                        </td>
                        <td className="py-4 px-3 text-right font-mono font-bold text-primary text-[13px]">
                          10.224.000 ₫
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-tertiary-fixed text-on-tertiary-fixed">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                            Đã quyết toán
                          </span>
                        </td>
                        <td className="py-4 pr-6 pl-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-medium text-xs transition-colors"
                              type="button"
                            >
                              Xem bảng kê
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {/* Pagination & Table Metadata */}
                <div className="p-4 px-6 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-on-surface-variant">
                    Hiển thị
                    <strong className="text-on-surface">5</strong>
                    trên
                    <strong className="text-on-surface">84</strong>
                    đối tác khách sạn phát sinh doanh số tháng 10/2026
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-40"
                      disabled
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">
                        chevron_left
                      </span>
                    </button>
                    <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-primary-container text-on-primary">
                      1
                    </span>
                    <button
                      className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
                      type="button"
                    >
                      2
                    </button>
                    <button
                      className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
                      type="button"
                    >
                      3
                    </button>
                    <span className="text-xs text-on-surface-variant">...</span>
                    <button
                      className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
                      type="button"
                    >
                      17
                    </button>
                    <button
                      className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">
                        chevron_right
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {/* Settlement Transparency & Compliance Note */}
            <div className="px-8 pb-12">
              <div className="p-6 rounded-2xl bg-surface-container-low flex flex-col md:flex-row items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">
                    shield
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                      Nguyên tắc Tài chính & Minh bạch Dòng tiền StayReco
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-tertiary text-on-tertiary">
                      ISO-27001 Certified
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-on-surface-variant">
                    Nguyên tắc tài chính StayReco: Tách bạch tuyệt đối giữa
                    Doanh số phòng của Đối tác (Gross Booking Value) và Doanh
                    thu thực của Sàn (Commission 6%). Hệ thống không giữ tiền
                    cọc của khách trái phép và tự động đối soát định kỳ vào thứ
                    Hai hàng tuần. Tất cả giao dịch chiết khấu đều được xuất hóa
                    đơn điện tử GTGT tuân thủ quy chuẩn Tổng cục Thuế Việt Nam.
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <button
                    className="px-3 py-2 rounded-xl bg-surface-container-lowest text-xs font-semibold text-primary hover:bg-surface-container-high transition-colors shadow-sm"
                    type="button"
                  >
                    Chính sách Chiết khấu 6%
                  </button>
                </div>
              </div>
            </div>
            {/* Embedded Client Micro-interactions */}
          </div>
        </main>
      </div>
    </div>
  );
}
