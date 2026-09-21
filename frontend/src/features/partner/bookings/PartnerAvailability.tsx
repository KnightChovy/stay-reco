/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Legacy DOM-driven screen; migrate interactions to React state separately.
import React from 'react';

export default function PartnerAvailability() {
  React.useEffect(() => {
    try {
      function toggleBulkDrawer(show) {
    const modal = document.getElementById('bulk-modal');
    if (!modal) return;
    if (show) {
      modal.classList.remove('hidden');
    } else {
      modal.classList.add('hidden');
    }
  }

  function clearSelection() {
    const bar = document.getElementById('selection-bar');
    if (bar) bar.style.display = 'none';
  }

  function saveChanges() {
    toggleBulkDrawer(false);
    const bar = document.getElementById('selection-bar');
    if (bar) bar.style.display = 'none';
  }
    } catch (err) {
      console.error('Error executing interaction script:', err);
    }
  }, []);

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
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all" data-path="tong-quan" href="#">
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
              <a aria-current="page" className="flex items-center gap-3 px-3 py-2.5 transition-all bg-primary-container text-on-primary font-semibold rounded-lg shadow-sm" data-path="lich-ton-kha-dung" href="#">
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
          <div className="flex flex-col w-full gap-6 pb-28">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl shadow-sm">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-semibold tracking-wide uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Hệ thống phân phối đa kênh (CRS/Channel Manager)
                </div>
                <h1 className="text-2xl font-bold font-headline text-on-surface tracking-tight">Lịch tồn phòng & Khả dụng bán</h1>
                <p className="text-xs text-on-surface-variant leading-relaxed">Ma trận kiểm soát số lượng phòng trống theo ngày và giá mở bán thực tế cho từng hạng phòng tại An Nhiên Riverside.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button className="inline-flex items-center gap-1.5 px-4 h-11 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-all">
                  <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                  Đóng/Mở phòng nhanh
                </button>
                <button className="inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-primary-container hover:bg-primary text-on-primary text-xs font-semibold shadow-sm hover:shadow-md transition-all" onClick={() => { if (typeof window !== 'undefined') { try { toggleBulkDrawer(true); } catch(e) { console.error(e); } } }}>
                  <span className="material-symbols-outlined text-[18px]">tune</span>
                  Cập nhật hàng loạt (Bulk Edit)
                </button>
              </div>
            </div>
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-surface-container-lowest px-6 py-4 rounded-xl shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center bg-surface-container rounded-lg p-1">
                  <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-container-lowest text-on-surface-variant transition-colors" title="Tuần trước">
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>
                  <button className="px-3 h-8 text-xs font-semibold text-primary rounded-md bg-surface-container-lowest shadow-xs">Hôm nay</button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-container-lowest text-on-surface-variant transition-colors" title="Tuần sau">
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 px-3 h-10 bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface">
                  <span className="material-symbols-outlined text-[18px] text-primary">calendar_today</span>
                  <span>20 Thg 10 – 02 Thg 11, 2026</span>
                  <span className="text-[11px] font-normal text-on-surface-variant">(14 ngày)</span>
                </div>
                <div className="relative">
                  <select className="appearance-none h-10 pl-3 pr-8 bg-surface-container-low text-xs font-medium text-on-surface rounded-lg focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer">
                    <option>Tất cả hạng phòng (4)</option>
                    <option>Deluxe River View (16)</option>
                    <option>Riverside Suite (8)</option>
                    <option>Superior Garden (8)</option>
                    <option>Studio Gác Lửng (4)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-[16px] pointer-events-none text-outline">unfold_more</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="text-on-surface-variant text-[11px] font-medium mr-1">Quy ước màu trạng thái:</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-medium">
                  <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                  Còn phòng (≥ 3)
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] font-medium">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  Sắp hết (1 - 2)
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error-container text-on-error-container text-[11px] font-medium">
                  <span className="w-2 h-2 rounded-full bg-error"></span>
                  Hết phòng (0)
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-highest text-on-surface-variant text-[11px] font-medium">
                  <span className="w-2 h-2 rounded-full bg-outline"></span>
                  Khóa bán / Bảo trì
                </span>
              </div>
            </div>
            <div className="relative w-full bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto select-none">
                <div className="min-w-[1420px]">
                  <div className="grid grid-cols-[280px_repeat(14,minmax(80px,1fr))] bg-surface-container-low text-xs font-semibold text-on-surface-variant sticky top-0 z-20">
                    <div className="p-3.5 pl-5 sticky left-0 z-30 bg-surface-container-low shadow-[4px_0_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
                      <span className="uppercase tracking-wider text-[11px] font-bold text-outline">Hạng phòng & Công suất</span>
                      <span className="text-[10px] text-outline font-normal">Khai thác: 36 phòng</span>
                    </div>
                    <div className="p-2.5 text-center bg-surface-container-low">
                      <div className="text-[10px] uppercase font-bold text-outline">Th 3</div>
                      <div className="text-sm font-bold text-on-surface font-headline">20/10</div>
                    </div>
                    <div className="p-2.5 text-center bg-surface-container-low">
                      <div className="text-[10px] uppercase font-bold text-outline">Th 4</div>
                      <div className="text-sm font-bold text-on-surface font-headline">21/10</div>
                    </div>
                    <div className="p-2.5 text-center bg-surface-container-low">
                      <div className="text-[10px] uppercase font-bold text-outline">Th 5</div>
                      <div className="text-sm font-bold text-on-surface font-headline">22/10</div>
                    </div>
                    <div className="p-2.5 text-center bg-surface-container-high/60">
                      <div className="text-[10px] uppercase font-bold text-secondary">Th 6</div>
                      <div className="text-sm font-bold text-on-surface font-headline">23/10</div>
                    </div>
                    <div className="p-2.5 text-center bg-secondary-fixed/50">
                      <div className="text-[10px] uppercase font-bold text-on-secondary-fixed">Th 7</div>
                      <div className="text-sm font-bold text-on-secondary-fixed font-headline">24/10</div>
                    </div>
                    <div className="p-2.5 text-center bg-secondary-fixed/50">
                      <div className="text-[10px] uppercase font-bold text-on-secondary-fixed">CN</div>
                      <div className="text-sm font-bold text-on-secondary-fixed font-headline">25/10</div>
                    </div>
                    <div className="p-2.5 text-center bg-surface-container-low">
                      <div className="text-[10px] uppercase font-bold text-outline">Th 2</div>
                      <div className="text-sm font-bold text-on-surface font-headline">26/10</div>
                    </div>
                    <div className="p-2.5 text-center bg-surface-container-low">
                      <div className="text-[10px] uppercase font-bold text-outline">Th 3</div>
                      <div className="text-sm font-bold text-on-surface font-headline">27/10</div>
                    </div>
                    <div className="p-2.5 text-center bg-surface-container-low">
                      <div className="text-[10px] uppercase font-bold text-outline">Th 4</div>
                      <div className="text-sm font-bold text-on-surface font-headline">28/10</div>
                    </div>
                    <div className="p-2.5 text-center bg-surface-container-low">
                      <div className="text-[10px] uppercase font-bold text-outline">Th 5</div>
                      <div className="text-sm font-bold text-on-surface font-headline">29/10</div>
                    </div>
                    <div className="p-2.5 text-center bg-surface-container-high/60">
                      <div className="text-[10px] uppercase font-bold text-secondary">Th 6</div>
                      <div className="text-sm font-bold text-on-surface font-headline">30/10</div>
                    </div>
                    <div className="p-2.5 text-center bg-secondary-fixed/50">
                      <div className="text-[10px] uppercase font-bold text-on-secondary-fixed">Th 7</div>
                      <div className="text-sm font-bold text-on-secondary-fixed font-headline">31/10</div>
                    </div>
                    <div className="p-2.5 text-center bg-secondary-fixed/50">
                      <div className="text-[10px] uppercase font-bold text-on-secondary-fixed">CN</div>
                      <div className="text-sm font-bold text-on-secondary-fixed font-headline">01/11</div>
                    </div>
                    <div className="p-2.5 text-center bg-surface-container-low">
                      <div className="text-[10px] uppercase font-bold text-outline">Th 2</div>
                      <div className="text-sm font-bold text-on-surface font-headline">02/11</div>
                    </div>
                  </div>
                  {/* ROW 1: Deluxe River View */}
                  <div className="grid grid-cols-[280px_repeat(14,minmax(80px,1fr))] hover:bg-surface-container-low/40 transition-colors group">
                    <div className="p-3.5 pl-5 sticky left-0 z-10 bg-surface-container-lowest group-hover:bg-surface-container-low/80 shadow-[4px_0_8px_rgba(0,0,0,0.02)] flex flex-col justify-center">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm bg-primary"></span>
                        <span className="font-headline font-bold text-xs text-on-surface leading-tight">Deluxe River View</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mt-1 pl-4.5">
                        <span>Tổng 16 phòng</span>
                        <span className="text-outline">•</span>
                        <span className="text-primary font-medium">Bán chạy nhất</span>
                      </div>
                    </div>
                    {/* 20/10 */}
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">3</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">1.250k</span>
                      <span className="text-[9px] text-outline">OTA: 2 | TT: 1</span>
                    </div>
                    {/* 21/10 */}
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold text-xs">2</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">1.250k</span>
                      <span className="text-[9px] text-outline">OTA: 1 | TT: 1</span>
                    </div>
                    {/* 22/10 */}
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">4</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">1.250k</span>
                      <span className="text-[9px] text-outline">OTA: 3 | TT: 1</span>
                    </div>
                    {/* 23/10 (Selected preview 1) */}
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer bg-primary-fixed/40 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold text-xs">1</span>
                      <span className="font-mono text-[11px] font-bold text-primary mt-1">1.450k</span>
                      <span className="text-[9px] text-secondary font-medium">Cuối tuần</span>
                    </div>
                    {/* 24/10 (Selected preview 2 - SOLD OUT) */}
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer bg-error-container/30 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[32px] h-6 px-1.5 rounded bg-error text-on-error font-bold text-[11px]">HẾT</span>
                      <span className="font-mono text-[11px] font-bold text-outline mt-1 line-through">1.450k</span>
                      <span className="text-[9px] text-error font-semibold">0 trống</span>
                    </div>
                    {/* 25/10 (Selected preview 3) */}
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer bg-primary-fixed/40 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold text-xs">2</span>
                      <span className="font-mono text-[11px] font-bold text-primary mt-1">1.350k</span>
                      <span className="text-[9px] text-outline">OTA: 2 | TT: 0</span>
                    </div>
                    {/* 26/10 */}
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">5</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">1.200k</span>
                      <span className="text-[9px] text-outline">OTA: 3 | TT: 2</span>
                    </div>
                    {/* 27/10 */}
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">6</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">1.200k</span>
                      <span className="text-[9px] text-outline">OTA: 4 | TT: 2</span>
                    </div>
                    {/* 28/10 */}
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">5</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">1.200k</span>
                      <span className="text-[9px] text-outline">OTA: 3 | TT: 2</span>
                    </div>
                    {/* 29/10 */}
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">4</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">1.250k</span>
                      <span className="text-[9px] text-outline">OTA: 2 | TT: 2</span>
                    </div>
                    {/* 30/10 */}
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold text-xs">2</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">1.450k</span>
                      <span className="text-[9px] text-outline">OTA: 2 | TT: 0</span>
                    </div>
                    {/* 31/10 */}
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold text-xs">1</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">1.500k</span>
                      <span className="text-[9px] text-secondary font-medium">Lễ hội</span>
                    </div>
                    {/* 01/11 */}
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">3</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">1.350k</span>
                      <span className="text-[9px] text-outline">OTA: 2 | TT: 1</span>
                    </div>
                    {/* 02/11 */}
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">7</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">1.200k</span>
                      <span className="text-[9px] text-outline">OTA: 4 | TT: 3</span>
                    </div>
                  </div>
                  {/* ROW 2: Riverside Suite */}
                  <div className="grid grid-cols-[280px_repeat(14,minmax(80px,1fr))] hover:bg-surface-container-low/40 transition-colors group">
                    <div className="p-3.5 pl-5 sticky left-0 z-10 bg-surface-container-lowest group-hover:bg-surface-container-low/80 shadow-[4px_0_8px_rgba(0,0,0,0.02)] flex flex-col justify-center">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm bg-secondary"></span>
                        <span className="font-headline font-bold text-xs text-on-surface leading-tight">Riverside Suite</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mt-1 pl-4.5">
                        <span>Tổng 8 phòng</span>
                        <span className="text-outline">•</span>
                        <span>Hạng cao cấp</span>
                      </div>
                    </div>
                    {/* 20/10 */}
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">3</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">1.850k</span>
                      <span className="text-[9px] text-outline">OTA: 2 | TT: 1</span>
                    </div>
                    {/* 21/10 */}
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">3</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">1.850k</span>
                      <span className="text-[9px] text-outline">OTA: 2 | TT: 1</span>
                    </div>
                    {/* 22/10 */}
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">3</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">1.850k</span>
                      <span className="text-[9px] text-outline">OTA: 2 | TT: 1</span>
                    </div>
                    {/* 23/10 */}
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold text-xs">1</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">2.100k</span>
                      <span className="text-[9px] text-secondary font-medium">Cuối tuần</span>
                    </div>
                    {/* 24/10 (SOLD OUT) */}
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer bg-error-container/20 hover:bg-error-container/40 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[32px] h-6 px-1.5 rounded bg-error text-on-error font-bold text-[11px]">HẾT</span>
                      <span className="font-mono text-[11px] font-semibold text-outline mt-1 line-through">2.100k</span>
                      <span className="text-[9px] text-error font-semibold">0 trống</span>
                    </div>
                    {/* 25/10 */}
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold text-xs">2</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">1.950k</span>
                      <span className="text-[9px] text-outline">OTA: 1 | TT: 1</span>
                    </div>
                    {/* 26/10 to 02/11 repeated realistic values */}
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">4</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">1.850k</span>
                      <span className="text-[9px] text-outline">OTA: 3 | TT: 1</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">4</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">1.850k</span>
                      <span className="text-[9px] text-outline">OTA: 3 | TT: 1</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">3</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">1.850k</span>
                      <span className="text-[9px] text-outline">OTA: 2 | TT: 1</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">3</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">1.850k</span>
                      <span className="text-[9px] text-outline">OTA: 2 | TT: 1</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold text-xs">2</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">2.100k</span>
                      <span className="text-[9px] text-outline">OTA: 1 | TT: 1</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold text-xs">1</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">2.100k</span>
                      <span className="text-[9px] text-outline">OTA: 1 | TT: 0</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">3</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">1.950k</span>
                      <span className="text-[9px] text-outline">OTA: 2 | TT: 1</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">4</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">1.850k</span>
                      <span className="text-[9px] text-outline">OTA: 3 | TT: 1</span>
                    </div>
                  </div>
                  {/* ROW 3: Superior Garden */}
                  <div className="grid grid-cols-[280px_repeat(14,minmax(80px,1fr))] hover:bg-surface-container-low/40 transition-colors group">
                    <div className="p-3.5 pl-5 sticky left-0 z-10 bg-surface-container-lowest group-hover:bg-surface-container-low/80 shadow-[4px_0_8px_rgba(0,0,0,0.02)] flex flex-col justify-center">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm bg-tertiary"></span>
                        <span className="font-headline font-bold text-xs text-on-surface leading-tight">Superior Garden</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mt-1 pl-4.5">
                        <span>Tổng 8 phòng</span>
                        <span className="text-outline">•</span>
                        <span>Khả dụng đều đặn</span>
                      </div>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">5</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">980k</span>
                      <span className="text-[9px] text-outline">OTA: 3 | TT: 2</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">6</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">980k</span>
                      <span className="text-[9px] text-outline">OTA: 4 | TT: 2</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">5</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">980k</span>
                      <span className="text-[9px] text-outline">OTA: 3 | TT: 2</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">4</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">1.050k</span>
                      <span className="text-[9px] text-secondary font-medium">Cuối tuần</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">3</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">1.050k</span>
                      <span className="text-[9px] text-outline">OTA: 2 | TT: 1</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">4</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">980k</span>
                      <span className="text-[9px] text-outline">OTA: 2 | TT: 2</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">6</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">980k</span>
                      <span className="text-[9px] text-outline">OTA: 4 | TT: 2</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">6</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">980k</span>
                      <span className="text-[9px] text-outline">OTA: 4 | TT: 2</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">5</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">980k</span>
                      <span className="text-[9px] text-outline">OTA: 3 | TT: 2</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">4</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">980k</span>
                      <span className="text-[9px] text-outline">OTA: 3 | TT: 1</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">3</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">1.050k</span>
                      <span className="text-[9px] text-outline">OTA: 2 | TT: 1</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold text-xs">2</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">1.050k</span>
                      <span className="text-[9px] text-outline">OTA: 1 | TT: 1</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">4</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">980k</span>
                      <span className="text-[9px] text-outline">OTA: 3 | TT: 1</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">5</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">980k</span>
                      <span className="text-[9px] text-outline">OTA: 3 | TT: 2</span>
                    </div>
                  </div>
                  {/* ROW 4: Studio Gác Lửng */}
                  <div className="grid grid-cols-[280px_repeat(14,minmax(80px,1fr))] hover:bg-surface-container-low/40 transition-colors group">
                    <div className="p-3.5 pl-5 sticky left-0 z-10 bg-surface-container-lowest group-hover:bg-surface-container-low/80 shadow-[4px_0_8px_rgba(0,0,0,0.02)] flex flex-col justify-center">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm bg-outline"></span>
                        <span className="font-headline font-bold text-xs text-on-surface leading-tight">Studio Gác Lửng</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mt-1 pl-4.5">
                        <span>Tổng 4 phòng</span>
                        <span className="text-outline">•</span>
                        <span>Số lượng hạn chế</span>
                      </div>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold text-xs">2</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">850k</span>
                      <span className="text-[9px] text-outline">OTA: 1 | TT: 1</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold text-xs">1</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">850k</span>
                      <span className="text-[9px] text-outline">OTA: 1 | TT: 0</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold text-xs">2</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">850k</span>
                      <span className="text-[9px] text-outline">OTA: 1 | TT: 1</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold text-xs">1</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">920k</span>
                      <span className="text-[9px] text-secondary font-medium">Cuối tuần</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer bg-error-container/20 hover:bg-error-container/40 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[32px] h-6 px-1.5 rounded bg-error text-on-error font-bold text-[11px]">HẾT</span>
                      <span className="font-mono text-[11px] font-semibold text-outline mt-1 line-through">920k</span>
                      <span className="text-[9px] text-error font-semibold">0 trống</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold text-xs">1</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">850k</span>
                      <span className="text-[9px] text-outline">OTA: 1 | TT: 0</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold text-xs">2</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">850k</span>
                      <span className="text-[9px] text-outline">OTA: 1 | TT: 1</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold text-xs">2</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">850k</span>
                      <span className="text-[9px] text-outline">OTA: 1 | TT: 1</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold text-xs">1</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">850k</span>
                      <span className="text-[9px] text-outline">OTA: 1 | TT: 0</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold text-xs">2</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">850k</span>
                      <span className="text-[9px] text-outline">OTA: 1 | TT: 1</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold text-xs">1</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">920k</span>
                      <span className="text-[9px] text-outline">OTA: 1 | TT: 0</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold text-xs">1</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">920k</span>
                      <span className="text-[9px] text-outline">OTA: 1 | TT: 0</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold text-xs">2</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">850k</span>
                      <span className="text-[9px] text-outline">OTA: 1 | TT: 1</span>
                    </div>
                    <div className="p-2 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-primary/5 transition-all">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold text-xs">2</span>
                      <span className="font-mono text-[11px] font-semibold text-on-surface mt-1">850k</span>
                      <span className="text-[9px] text-outline">OTA: 1 | TT: 1</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-surface-container-lowest p-4 rounded-xl flex items-start gap-3.5 shadow-sm">
                <div className="p-2 rounded-lg bg-primary-fixed text-on-primary-fixed">
                  <span className="material-symbols-outlined text-[20px]">storefront</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-on-surface">StayReco Direct (TT)</span>
                  <span className="text-[11px] text-on-surface-variant mt-0.5">Kênh bán trực tiếp không tốn hoa hồng OTA. Ưu tiên giữ phòng cho khách hội viên trung thành.</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-4 rounded-xl flex items-start gap-3.5 shadow-sm">
                <div className="p-2 rounded-lg bg-secondary-fixed text-on-secondary-fixed">
                  <span className="material-symbols-outlined text-[20px]">hub</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-on-surface">OTA Allotment (OTA)</span>
                  <span className="text-[11px] text-on-surface-variant mt-0.5">Số lượng cam kết tự động phân bổ qua Channel Manager (Booking.com, Agoda, Traveloka).</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-4 rounded-xl flex items-start gap-3.5 shadow-sm">
                <div className="p-2 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed">
                  <span className="material-symbols-outlined text-[20px]">hourglass_top</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-on-surface">Phòng tạm giữ (Hold: 15p)</span>
                  <span className="text-[11px] text-on-surface-variant mt-0.5">Đang trong tiến trình thanh toán trực tuyến hoặc giữ phòng bởi lễ tân chưa xuất hóa đơn cọc.</span>
                </div>
              </div>
            </div>
            {/* FLOATING QUICK EDIT BAR (Sticky at bottom viewport) */}
            <div className="fixed bottom-6 left-[280px] right-8 bg-surface-container-lowest p-4 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 z-40" id="selection-bar">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-xs">3</div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-on-surface">Đang chọn: Deluxe River View</span>
                    <span className="text-[11px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">23, 24, 25 Thg 10</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">Sẵn sàng áp dụng thay đổi giá và allotment cho 3 ngày cao điểm.</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center bg-surface-container-low rounded-lg p-1">
                  <button className="px-2.5 py-1 text-xs font-semibold text-on-surface hover:bg-surface-container-lowest rounded transition-colors">-5%</button>
                  <button className="px-2.5 py-1 text-xs font-semibold text-on-surface hover:bg-surface-container-lowest rounded transition-colors">+10%</button>
                  <button className="px-2.5 py-1 text-xs font-semibold text-secondary hover:bg-surface-container-lowest rounded transition-colors">Giá cuối tuần</button>
                </div>
                <button className="inline-flex items-center gap-1.5 px-3.5 h-10 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors">
                  <span className="material-symbols-outlined text-[16px]">block</span>
                  Đóng phòng
                </button>
                <button className="inline-flex items-center gap-1.5 px-4 h-10 rounded-lg bg-primary-container hover:bg-primary text-on-primary text-xs font-semibold transition-colors" onClick={() => { if (typeof window !== 'undefined') { try { toggleBulkDrawer(true); } catch(e) { console.error(e); } } }}>
                  <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
                  Mở bảng điều chỉnh chi tiết
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg text-outline hover:text-on-surface transition-colors" onClick={() => { if (typeof window !== 'undefined') { try { clearSelection(); } catch(e) { console.error(e); } } }}>
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>
            {/* BULK EDIT DRAWER MODAL OVERLAY */}
            <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-xs z-50 flex justify-end transition-opacity duration-300 hidden" id="bulk-modal">
              <div className="w-full max-w-md bg-surface-container-lowest h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4">
                    <div className="flex flex-col">
                      <h3 className="font-headline font-bold text-base text-on-surface">Cập nhật hàng loạt (Bulk Edit)</h3>
                      <span className="text-xs text-on-surface-variant">Điều chỉnh giá, allotment & đóng/mở bán</span>
                    </div>
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container text-on-surface-variant" onClick={() => { if (typeof window !== 'undefined') { try { toggleBulkDrawer(false); } catch(e) { console.error(e); } } }}>
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1.5">Hạng phòng áp dụng</label>
                      <select className="w-full h-11 px-3 bg-surface-container-low text-xs font-medium text-on-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                        <option>Deluxe River View (16 phòng)</option>
                        <option>Riverside Suite (8 phòng)</option>
                        <option>Superior Garden (8 phòng)</option>
                        <option>Studio Gác Lửng (4 phòng)</option>
                        <option>Áp dụng toàn bộ 4 hạng phòng</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1.5">Khoảng thời gian</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input className="h-11 px-3 bg-surface-container-low text-xs font-medium text-on-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" type="text" defaultValue="23/10/2026" />
                        <input className="h-11 px-3 bg-surface-container-low text-xs font-medium text-on-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" type="text" defaultValue="25/10/2026" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1.5">Áp dụng cho các ngày</label>
                      <div className="grid grid-cols-7 gap-1 text-center text-xs">
                        <span className="p-2 rounded bg-surface-container-low text-outline font-semibold">T2</span>
                        <span className="p-2 rounded bg-surface-container-low text-outline font-semibold">T3</span>
                        <span className="p-2 rounded bg-surface-container-low text-outline font-semibold">T4</span>
                        <span className="p-2 rounded bg-surface-container-low text-outline font-semibold">T5</span>
                        <span className="p-2 rounded bg-primary-container text-on-primary font-bold">T6</span>
                        <span className="p-2 rounded bg-primary-container text-on-primary font-bold">T7</span>
                        <span className="p-2 rounded bg-primary-container text-on-primary font-bold">CN</span>
                      </div>
                    </div>
                    <div className="p-4 bg-surface-container-low rounded-xl space-y-3">
                      <span className="text-xs font-bold text-on-surface block">Mức giá mở bán tiêu chuẩn</span>
                      <div className="relative">
                        <input className="w-full h-11 pl-3 pr-10 bg-surface-container-lowest font-mono font-bold text-sm text-on-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" type="text" defaultValue="1.450.000" />
                        <span className="absolute right-3 top-3 text-xs text-outline font-medium">₫/đêm</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input defaultChecked={true} className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer" id="tax_incl" type="checkbox" />
                        <label className="text-xs text-on-surface-variant cursor-pointer" htmlFor="tax_incl">Đã gồm thuế GTGT & phí dịch vụ</label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-on-surface">Phân bổ kho allotment (Số phòng)</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-surface-container-low rounded-lg">
                          <span className="text-[11px] text-on-surface-variant block mb-1">StayReco Direct</span>
                          <input className="w-full h-9 px-2.5 bg-surface-container-lowest text-xs font-bold text-on-surface rounded" type="number" defaultValue="2" />
                        </div>
                        <div className="p-3 bg-surface-container-low rounded-lg">
                          <span className="text-[11px] text-on-surface-variant block mb-1">Kênh OTA</span>
                          <input className="w-full h-9 px-2.5 bg-surface-container-lowest text-xs font-bold text-on-surface rounded" type="number" defaultValue="3" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-6 mt-6 flex items-center gap-3">
                  <button className="flex-1 h-11 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors" onClick={() => { if (typeof window !== 'undefined') { try { toggleBulkDrawer(false); } catch(e) { console.error(e); } } }}>Hủy bỏ</button>
                  <button className="flex-1 h-11 rounded-lg bg-primary-container hover:bg-primary text-on-primary text-xs font-semibold transition-all shadow-sm" onClick={() => { if (typeof window !== 'undefined') { try { saveChanges(); } catch(e) { console.error(e); } } }}>Lưu & Đồng bộ ngay</button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
