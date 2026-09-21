/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Legacy JSX screen pending React state migration.
import React from 'react';

export default function ManagerVerifications() {
  React.useEffect(() => {
    try {
      document.querySelectorAll('aside nav a').forEach(el => {
      if (el.getAttribute('data-path') === 'duyet-ho-so-doi-tac') {
        el.className = 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm bg-primary-container text-on-primary font-semibold shadow-[0_2px_8px_rgba(35,78,112,0.12)] transition-colors';
      } else {
        el.className = 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors';
      }
    });
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
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex flex-col gap-2">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
                  <span className="hover:text-primary transition-colors cursor-pointer">Quản trị nền tảng</span>
                  <span className="material-symbols-outlined text-sm text-outline-variant">chevron_right</span>
                  <span className="text-primary font-semibold">Hàng đợi duyệt đối tác</span>
                </nav>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h1 className="font-headline text-2xl md:text-3xl font-bold tracking-tight text-primary">Hàng đợi Thẩm định & Phê duyệt Đối tác Khách sạn</h1>
                    <p className="text-xs md:text-sm text-on-surface-variant mt-1">Quy trình xác minh hồ sơ pháp lý, thẩm định cơ sở lưu trú và phê duyệt quyền vận hành trên StayReco.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
                    <button className="inline-flex items-center gap-2 px-4 h-11 rounded-lg bg-surface-container-lowest text-on-surface text-sm font-semibold shadow-sm hover:bg-surface-container-low transition-all" type="button">
                      <span className="material-symbols-outlined text-xl text-on-surface-variant">download</span>
                      <span>Xuất danh sách Excel</span>
                    </button>
                    <button className="inline-flex items-center gap-2 px-4 h-11 rounded-lg bg-primary text-on-primary text-sm font-semibold shadow-sm hover:bg-primary/90 transition-all" type="button">
                      <span className="material-symbols-outlined text-xl">assignment_ind</span>
                      <span>Phân công chuyên viên</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-on-surface-variant">Tổng hồ sơ đang xử lý</div>
                    <div className="text-2xl font-bold text-on-surface font-headline mt-0.5">
                      14
                      <span className="text-xs font-normal text-on-surface-variant">cơ sở</span>
                    </div>
                    <div className="text-[11px] text-tertiary flex items-center gap-1 mt-1 font-medium">
                      <span className="material-symbols-outlined text-xs">trending_down</span>
                      <span>-2 so với ngày hôm qua</span>
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-surface-container-low flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-2xl">pending_actions</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-on-surface-variant">SLA Phản hồi Trung bình</div>
                    <div className="text-2xl font-bold text-on-surface font-headline mt-0.5">
                      18.5
                      <span className="text-xs font-normal text-on-surface-variant">giờ</span>
                    </div>
                    <div className="text-[11px] text-tertiary flex items-center gap-1 mt-1 font-medium">
                      <span className="material-symbols-outlined text-xs">check_circle</span>
                      <span>Đạt mục tiêu (&lt; 24h)</span>
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed">
                    <span className="material-symbols-outlined text-2xl">speed</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-on-surface-variant">Khảo sát Thực địa Tuần này</div>
                    <div className="text-2xl font-bold text-on-surface font-headline mt-0.5">9 / 12</div>
                    <div className="text-[11px] text-secondary flex items-center gap-1 mt-1 font-medium">
                      <span className="material-symbols-outlined text-xs">tour</span>
                      <span>3 địa điểm đang tiến hành</span>
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                    <span className="material-symbols-outlined text-2xl">pin_drop</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-on-surface-variant">Tỷ lệ Phê duyệt Hồ sơ</div>
                    <div className="text-2xl font-bold text-on-surface font-headline mt-0.5">87.4%</div>
                    <div className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-1">
                      <span>28 hồ sơ hoàn tất tháng 10</span>
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-surface-container-low flex items-center justify-center text-primary-container">
                    <span className="material-symbols-outlined text-2xl">verified</span>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl shadow-sm p-4 space-y-4">
                <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 text-sm font-medium">
                  <button className="px-3.5 py-2 rounded-lg bg-primary-container text-on-primary font-semibold transition-colors flex items-center gap-2" type="button">
                    <span>Tất cả</span>
                    <span className="px-1.5 py-0.5 text-xs rounded-full bg-surface-container-lowest/20 font-bold">14</span>
                  </button>
                  <button className="px-3.5 py-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-2" type="button">
                    <span>Chờ xét duyệt sơ bộ</span>
                    <span className="px-1.5 py-0.5 text-xs rounded-full bg-primary-fixed text-on-primary-fixed font-semibold">5</span>
                  </button>
                  <button className="px-3.5 py-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-2" type="button">
                    <span>Đang khảo sát thực địa</span>
                    <span className="px-1.5 py-0.5 text-xs rounded-full bg-secondary-fixed text-on-secondary-fixed font-semibold">4</span>
                  </button>
                  <button className="px-3.5 py-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-2" type="button">
                    <span>Cần bổ sung hồ sơ</span>
                    <span className="px-1.5 py-0.5 text-xs rounded-full bg-error-container text-on-error-container font-semibold">3</span>
                  </button>
                  <button className="px-3.5 py-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-2" type="button">
                    <span>Đã hoàn tất duyệt</span>
                    <span className="px-1.5 py-0.5 text-xs rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-semibold">28</span>
                  </button>
                </div>
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                  <div className="relative flex-1 max-w-xl">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">search</span>
                    <input className="w-full h-11 pl-11 pr-4 rounded-lg bg-surface-container-low border-0 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary transition-all" placeholder="Tìm tên đối tác, khách sạn, mã số thuế hoặc người đại diện..." type="text" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative min-w-[220px]">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">location_on</span>
                      <select className="w-full h-11 pl-9 pr-8 rounded-lg bg-surface-container-low border-0 text-xs font-semibold text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer">
                        <option value="">Tất cả khu vực trọng điểm</option>
                        <option selected="" value="dn-qn">Đà Nẵng & Quảng Nam</option>
                        <option value="dl">Lâm Đồng (Đà Lạt)</option>
                        <option value="pq">Kiên Giang (Phú Quốc)</option>
                        <option value="nt">Khánh Hòa (Nha Trang)</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-base">expand_more</span>
                    </div>
                    <button className="h-11 px-3 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface flex items-center gap-1 text-xs font-semibold" type="button">
                      <span className="material-symbols-outlined text-lg">filter_list</span>
                      <span>Lọc nâng cao</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
                        <th className="py-3.5 px-4 w-44" scope="col">Mã hồ sơ & Ngày nộp</th>
                        <th className="py-3.5 px-4" scope="col">Tên cơ sở & Quy mô</th>
                        <th className="py-3.5 px-4" scope="col">Người đại diện & Pháp nhân</th>
                        <th className="py-3.5 px-4" scope="col">Khu vực</th>
                        <th className="py-3.5 px-4" scope="col">Hồ sơ pháp lý</th>
                        <th className="py-3.5 px-4" scope="col">Trạng thái</th>
                        <th className="py-3.5 px-4" scope="col">Chuyên viên</th>
                        <th className="py-3.5 px-4 text-right" scope="col">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      <tr className="hover:bg-surface-container-low/70 transition-colors">
                        <td className="py-4 px-4 align-top">
                          <div className="font-mono text-xs font-bold text-primary">#VER-2026-DN-8492</div>
                          <div className="text-xs text-on-surface mt-1 font-medium">15/10/2026</div>
                          <span className="inline-block mt-0.5 text-[11px] text-on-surface-variant">3 ngày trước</span>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-lg bg-cover bg-center shrink-0" data-alt="Charming exterior of An Nhien Riverside Hotel beside the Han River in Da Nang during late afternoon, showcasing modern boutique architecture with terracotta roof details and warm lighting" style={{"backgroundImage":"url('https://lh3.googleusercontent.com/aida-public/AB6AXuArAJWGX-bxNHRhLjayC_vFZA3h_2RWF9N9S1q0ZgUpIdQht8m2o6IIU8NIljlMmPvI-T_EP40dx1Y6JdnkQ1MH0kSvpExhPi3Dka8wcm3Z9pxOHm1PEBTAjnJ2MVxXFpN9H2e62bY9qDshcwmFKUr9jRo-z2ZksSvQ-3wvqAsB_q-hgNiN2RWzdWI98iPx3l9viD3sOL9VnL96bATbP697TJ0pIcLka84UVALztj2LR0yDupX6DvZr')"}}></div>
                            <div>
                              <div className="font-headline font-semibold text-on-surface">An Nhiên Riverside Hotel</div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-xs text-on-surface-variant">36 phòng</span>
                                <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                                <span className="inline-flex items-center gap-0.5 text-xs text-secondary font-medium">
                                  <span className="material-symbols-outlined text-xs" style={{"fontVariationSettings":"'FILL' 1"}}>star</span>
                                  Boutique 4 sao
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="font-semibold text-on-surface">Trần Nam</div>
                          <div className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">Công ty TNHH Khách sạn An Nhiên Đà Nẵng</div>
                          <div className="text-[11px] font-mono text-on-surface-variant mt-0.5">MST: 0401988234</div>
                        </td>
                        <td className="py-4 px-4 align-top whitespace-nowrap">
                          <div className="font-medium text-on-surface">Hải Châu</div>
                          <div className="text-xs text-on-surface-variant">Đà Nẵng</div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="flex flex-wrap gap-1 max-w-[210px]">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-tertiary-fixed text-on-tertiary-fixed font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                              ĐKKD: Duyệt
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-tertiary-fixed text-on-tertiary-fixed font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                              PCCC: Duyệt
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-surface-container-high text-on-surface-variant font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                              Tiêu chuẩn CS: Đã nộp
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary-fixed text-on-secondary-fixed">
                            <span className="material-symbols-outlined text-sm">nature_people</span>
                            <span>Đang khảo sát thực địa (3/4)</span>
                          </span>
                          <div className="text-[11px] text-on-surface-variant mt-1">Lịch hẹn: 20/10 14:00</div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary-fixed flex items-center justify-center text-primary text-xs font-bold">NV</div>
                            <span className="text-xs font-semibold text-on-surface">Nguyễn Thảo Vy</span>
                          </div>
                          <div className="text-[11px] text-on-surface-variant mt-0.5 pl-8">Thẩm định viên K1</div>
                        </td>
                        <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <a className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold shadow-sm hover:bg-primary/90 transition-colors" href="#">
                              <span>Thẩm định hồ sơ</span>
                              <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </a>
                            <button className="w-8 h-8 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface flex items-center justify-center" title="Gán chuyên viên" type="button">
                              <span className="material-symbols-outlined text-base">swap_horiz</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-container-low/70 transition-colors">
                        <td className="py-4 px-4 align-top">
                          <div className="font-mono text-xs font-bold text-primary">#VER-2026-HA-8501</div>
                          <div className="text-xs text-on-surface mt-1 font-medium">18/10/2026</div>
                          <span className="inline-block mt-0.5 text-[11px] text-secondary font-semibold">Hôm qua</span>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-lg bg-cover bg-center shrink-0" data-alt="Sunlit courtyard of an authentic eco villa in Hoi An, yellow textured heritage walls, lush tropical palms, and traditional Vietnamese wooden doorways" style={{"backgroundImage":"url('https://lh3.googleusercontent.com/aida-public/AB6AXuBXvXeV2piUcRC7TlEnCeuVGOlU47lhVdjNcHSqjLhIwFnsfTDmkdxQtCJ__7e1dQ7neAjrSJFednUD6JGBz-N7nWE67aB_EPpefqUNFqke57ruRlYdzyz8l0lNyyNc9-8xbBLGIUOGFjkzQ9_dFhms6gfMmhf_HyefjChVjUJrlcVsV3fI-u5Pgz7TVtea6HrOuIjsf7gMxM6Tx4B4pcgUJRqP02nK8x5MuQN26_VjWkY-FMKGyAVy')"}}></div>
                            <div>
                              <div className="font-headline font-semibold text-on-surface">Phố Cổ Garden Eco Villa</div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-xs text-on-surface-variant">16 phòng</span>
                                <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                                <span className="inline-flex items-center gap-0.5 text-xs text-secondary font-medium">
                                  <span className="material-symbols-outlined text-xs" style={{"fontVariationSettings":"'FILL' 1"}}>spa</span>
                                  Biệt thự cổ
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="font-semibold text-on-surface">Phạm Đình Hưng</div>
                          <div className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">Hộ kinh doanh Phố Cổ Hội An</div>
                          <div className="text-[11px] font-mono text-on-surface-variant mt-0.5">MST: 4001128910</div>
                        </td>
                        <td className="py-4 px-4 align-top whitespace-nowrap">
                          <div className="font-medium text-on-surface">Minh An, Hội An</div>
                          <div className="text-xs text-on-surface-variant">Quảng Nam</div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="flex flex-wrap gap-1 max-w-[210px]">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-tertiary-fixed text-on-tertiary-fixed font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                              ĐKKD: Duyệt
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-error-container text-on-error-container font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                              PCCC: Bổ sung
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-tertiary-fixed text-on-tertiary-fixed font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                              Cam kết ANTT
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-error-container text-on-error-container">
                            <span className="material-symbols-outlined text-sm">warning</span>
                            <span>Cần bổ sung hồ sơ</span>
                          </span>
                          <div className="text-[11px] text-error mt-1 font-medium">Thiếu biên bản nghiệm thu PCCC</div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed text-xs font-bold">HQ</div>
                            <span className="text-xs font-semibold text-on-surface">Lê Hoàng Quân</span>
                          </div>
                          <div className="text-[11px] text-on-surface-variant mt-0.5 pl-8">Quản lý Miền Trung</div>
                        </td>
                        <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-low text-error text-xs font-semibold hover:bg-error-container transition-colors" type="button">
                              <span className="material-symbols-outlined text-sm">edit_document</span>
                              <span>Xem yêu cầu bổ sung</span>
                            </button>
                            <button className="w-8 h-8 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface flex items-center justify-center" title="Gửi thông báo đối tác" type="button">
                              <span className="material-symbols-outlined text-base">forward_to_inbox</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-container-low/70 transition-colors">
                        <td className="py-4 px-4 align-top">
                          <div className="font-mono text-xs font-bold text-primary">#VER-2026-DL-8507</div>
                          <div className="text-xs text-on-surface mt-1 font-medium">19/10/2026</div>
                          <span className="inline-block mt-0.5 text-[11px] font-bold text-primary bg-primary-fixed px-1.5 py-0.2 rounded">08:30 Hôm nay</span>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-lg bg-cover bg-center shrink-0" data-alt="Serene mountain resort lodge nestled in Da Lat pine forests with morning fog, minimalist wooden A-frame chalets and natural stone walkways" style={{"backgroundImage":"url('https://lh3.googleusercontent.com/aida-public/AB6AXuDDC33gK9YHUNzRRCYf9xMkb5J7MmANuaHBHzfthEWaA4OMZLmSj-7MDjLbqYJ9D9RTbcldO6mA9zXxKocmsWxqDVzGbyxIbczGWbqMwM2VzH9-7Cu-k4Gt8h79-4rtdWOVUAehAtL8inBMesGKK0-6tJHRfW2sSzJH3JjDs5GEYN5My1Z4GOyBPkcc_8dqE5chK2nNZ23iD8oWll2_WXk_YVosI4ApJrlAXaCAs_9o2yFB9MSE_SiS')"}}></div>
                            <div>
                              <div className="font-headline font-semibold text-on-surface">Pine Hill Mountain Retreat</div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-xs text-on-surface-variant">22 phòng</span>
                                <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                                <span className="inline-flex items-center gap-0.5 text-xs text-secondary font-medium">
                                  <span className="material-symbols-outlined text-xs" style={{"fontVariationSettings":"'FILL' 1"}}>cabin</span>
                                  Eco-lodge
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="font-semibold text-on-surface">Nguyễn Thị Bích Thảo</div>
                          <div className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">Công ty CP Du lịch Nghỉ dưỡng Thông Reo</div>
                          <div className="text-[11px] font-mono text-on-surface-variant mt-0.5">MST: 5801429981</div>
                        </td>
                        <td className="py-4 px-4 align-top whitespace-nowrap">
                          <div className="font-medium text-on-surface">Phường 3</div>
                          <div className="text-xs text-on-surface-variant">TP. Đà Lạt</div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="flex flex-wrap gap-1 max-w-[210px]">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-primary-fixed text-on-primary-fixed font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                              ĐKKD: Chờ rà soát
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-primary-fixed text-on-primary-fixed font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                              PCCC: Chờ duyệt
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-tertiary-fixed text-on-tertiary-fixed font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                              HĐ: Đã ký số
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-fixed text-on-primary-fixed">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            <span>Chờ xét duyệt sơ bộ</span>
                          </span>
                          <div className="text-[11px] text-on-surface-variant mt-1">Còn lại: 22h để xử lý SLA</div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="inline-flex items-center gap-1 text-xs text-on-surface-variant">
                            <span className="material-symbols-outlined text-base">person_off</span>
                            <span>Chưa phân công</span>
                          </div>
                          <div className="mt-1">
                            <button className="px-2 py-1 text-[11px] rounded bg-primary-container text-on-primary font-semibold hover:bg-primary transition-colors" type="button">+ Nhận duyệt</button>
                          </div>
                        </td>
                        <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <a className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-low text-primary text-xs font-semibold hover:bg-primary-fixed transition-colors" href="#">
                              <span className="material-symbols-outlined text-sm">visibility</span>
                              <span>Thẩm định hồ sơ</span>
                            </a>
                          </div>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-container-low/70 transition-colors">
                        <td className="py-4 px-4 align-top">
                          <div className="font-mono text-xs font-bold text-primary">#VER-2026-PQ-8488</div>
                          <div className="text-xs text-on-surface mt-1 font-medium">12/10/2026</div>
                          <span className="inline-block mt-0.5 text-[11px] text-on-surface-variant">7 ngày trước</span>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-lg bg-cover bg-center shrink-0" data-alt="Luxury beachfront boutique resort in Phu Quoc overlooking emerald ocean waters with traditional thatched wood roofs and calm tropical infinity pool" style={{"backgroundImage":"url('https://lh3.googleusercontent.com/aida-public/AB6AXuAn1-kj0oWHZL1xLdE-P3OGTKW2_ptrxF_703kxHqI3t86LPmc5LaonRD6ydX1MEwSL_MFauoCS-v3Y5FcshJxR0q-Dq8EZcl8MlHzTZ-LHxLDQQz6lGx-AsDtkQe_d9AcaCAOlhjXqj5_pgmhDbqc1jIl-MGWGXhbDJHgyry0p6qjDuuIuQD9WJa3NMT1F8aXh1rmgmdFwk3JPgXRfiChqoZumRkpMGyo_D6j3AOLZonGh6XmoRF9g')"}}></div>
                            <div>
                              <div className="font-headline font-semibold text-on-surface">Sunset Ocean Bungalows</div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-xs text-on-surface-variant">28 phòng</span>
                                <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                                <span className="inline-flex items-center gap-0.5 text-xs text-secondary font-medium">
                                  <span className="material-symbols-outlined text-xs" style={{"fontVariationSettings":"'FILL' 1"}}>beach_access</span>
                                  Resort biển
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="font-semibold text-on-surface">Lâm Hoài Bảo</div>
                          <div className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">Công ty TNHH Nghỉ dưỡng Bãi Khem</div>
                          <div className="text-[11px] font-mono text-on-surface-variant mt-0.5">MST: 1702094833</div>
                        </td>
                        <td className="py-4 px-4 align-top whitespace-nowrap">
                          <div className="font-medium text-on-surface">An Thới</div>
                          <div className="text-xs text-on-surface-variant">Phú Quốc, Kiên Giang</div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="flex flex-wrap gap-1 max-w-[210px]">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-tertiary-fixed text-on-tertiary-fixed font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                              ĐKKD: Duyệt
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-tertiary-fixed text-on-tertiary-fixed font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                              PCCC: Duyệt
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-tertiary-fixed text-on-tertiary-fixed font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                              Tiêu chuẩn 4 sao
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-tertiary-fixed text-on-tertiary-fixed">
                            <span className="material-symbols-outlined text-sm">task_alt</span>
                            <span>Khảo sát đạt — Chờ kích hoạt</span>
                          </span>
                          <div className="text-[11px] text-tertiary mt-1 font-medium">Báo cáo thực địa 100/100</div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed text-xs font-bold">QT</div>
                            <span className="text-xs font-semibold text-on-surface">Đặng Quốc Tuấn</span>
                          </div>
                          <div className="text-[11px] text-on-surface-variant mt-0.5 pl-8">Thẩm định viên K2</div>
                        </td>
                        <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-tertiary text-on-tertiary text-xs font-semibold shadow-sm hover:bg-tertiary/90 transition-colors" type="button">
                              <span className="material-symbols-outlined text-sm">key</span>
                              <span>Phê duyệt & Cấp tài khoản</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-surface-container-low flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
                  <div className="flex flex-wrap items-center gap-4 text-on-surface-variant">
                    <div>
                      Hiển thị
                      <span className="font-semibold text-on-surface">4</span>
                      trên
                      <span className="font-semibold text-on-surface">14</span>
                      hồ sơ cần xử lý
                    </div>
                    <div className="hidden sm:block w-1 h-1 rounded-full bg-outline-variant"></div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-tertiary">check_circle</span>
                      <span>
                        SLA trung bình thẩm định hiện tại:
                        <strong className="text-on-surface">18.5 giờ làm việc</strong>
                        (Cam kết: &lt; 24 giờ)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="w-8 h-8 rounded-lg bg-surface-container-lowest text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors disabled:opacity-40" disabled type="button">
                      <span className="material-symbols-outlined text-base">chevron_left</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button className="w-8 h-8 rounded-lg bg-primary text-on-primary font-semibold flex items-center justify-center shadow-sm" type="button">1</button>
                      <button className="w-8 h-8 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container flex items-center justify-center font-medium" type="button">2</button>
                      <button className="w-8 h-8 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container flex items-center justify-center font-medium" type="button">3</button>
                      <button className="w-8 h-8 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container flex items-center justify-center font-medium" type="button">4</button>
                    </div>
                    <button className="w-8 h-8 rounded-lg bg-surface-container-lowest text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors" type="button">
                      <span className="material-symbols-outlined text-base">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
