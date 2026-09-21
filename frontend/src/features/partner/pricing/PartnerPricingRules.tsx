/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Legacy DOM-driven screen; migrate interactions to React state separately.
import React from 'react';

export default function PartnerPricingRules() {
  React.useEffect(() => {
    try {
      (function() {
      const btnOpen = document.getElementById('btn-create-rule');
      const modal = document.getElementById('modal-create-rule');
      const btnClose = document.getElementById('btn-close-modal');
      const btnCancel = document.getElementById('btn-cancel-modal');
      const btnSimulator = document.getElementById('btn-open-simulator');

      function toggleModal(show) {
        if (!modal) return;
        if (show) {
          modal.classList.remove('hidden');
        } else {
          modal.classList.add('hidden');
        }
      }

      if (btnOpen) btnOpen.addEventListener('click', () => toggleModal(true));
      if (btnClose) btnClose.addEventListener('click', () => toggleModal(false));
      if (btnCancel) btnCancel.addEventListener('click', () => toggleModal(false));
      
      // Close on backdrop click
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) toggleModal(false);
        });
      }

      // Smooth scroll to Live simulator if clicked from top
      if (btnSimulator) {
        btnSimulator.addEventListener('click', () => {
          const simElement = document.querySelector('aside');
          if (simElement) {
            simElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            simElement.classList.add('scale-[1.01]');
            setTimeout(() => {
              simElement.classList.remove('scale-[1.01]');
            }, 300);
          }
        });
      }

      // Live Simulator Dynamic Change
      const simSelect = document.getElementById('sim-room-select');
      if (simSelect) {
        simSelect.addEventListener('change', function(e) {
          const val = e.target.value;
          // Visual feedback on select change
          const breakdown = document.querySelector('aside');
          if (breakdown) {
            breakdown.classList.add('opacity-80');
            setTimeout(() => breakdown.classList.remove('opacity-80'), 150);
          }
        });
      }
    })();
    } catch (err) {
      console.error('Error executing interaction script:', err);
    }
  }, []);

  return (
    <div className="bg-surface font-body text-on-surface antialiased">
      <aside className="fixed left-0 top-0 h-screen w-64 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between overflow-y-auto">
        <div className="flex flex-col">
          <div className="h-16 px-5 flex items-center gap-3 bg-surface-container-lowest">
            <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center text-on-primary font-headline font-bold text-lg">S</div>
            <div className="flex flex-col">
              <span className="font-headline font-bold text-sm tracking-tight text-primary leading-tight">StayReco</span>
              <span className="text-[11px] font-medium text-secondary uppercase tracking-wider">Partner Portal</span>
            </div>
          </div>
          <nav className="px-3 pt-4 space-y-6" data-active-classes="bg-primary-container text-on-primary font-medium rounded-lg shadow-sm">
            <div className="space-y-1">
              <p className="px-3 pb-1 text-[11px] font-semibold text-on-surface-variant/70 tracking-wider uppercase">Quản lý kinh doanh</p>
              <a className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" data-path="tong-quan" href="#">
                <span className="material-symbols-outlined text-[20px]">dashboard</span>
                Tổng quan
              </a>
              <a className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" data-path="khach-san-va-co-so" href="#">
                <span className="material-symbols-outlined text-[20px]">apartment</span>
                Khách sạn & Cơ sở
              </a>
              <a className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" data-path="kho-phong" href="#">
                <span className="material-symbols-outlined text-[20px]">bed</span>
                Kho phòng
              </a>
              <a className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" data-path="lich-ton-va-kha-dung" href="#">
                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                Lịch tồn & Khả dụng
              </a>
              <a aria-current="page" className="flex items-center gap-3 px-3 py-2 transition-colors bg-primary-container text-on-primary font-medium rounded-lg shadow-sm" data-path="luat-gia-va-mua-vu" href="#">
                <span className="material-symbols-outlined text-[20px]">price_change</span>
                Luật giá & Mùa vụ
              </a>
            </div>
            <div className="space-y-1">
              <p className="px-3 pb-1 text-[11px] font-semibold text-on-surface-variant/70 tracking-wider uppercase">Tiếp thị & Khách hàng</p>
              <a className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" data-path="chien-dich-va-giam-gia" href="#">
                <span className="material-symbols-outlined text-[20px]">campaign</span>
                Chiến dịch & Giảm giá
              </a>
              <a className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" data-path="khach-hang-than-thiet" href="#">
                <span className="material-symbols-outlined text-[20px]">loyalty</span>
                Khách hàng thân thiết
              </a>
              <a className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" data-path="giong-thuong-hieu-ai" href="#">
                <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                Giọng thương hiệu AI
              </a>
            </div>
            <div className="space-y-1">
              <p className="px-3 pb-1 text-[11px] font-semibold text-on-surface-variant/70 tracking-wider uppercase">Tổ chức & Hồ sơ</p>
              <a className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" data-path="nhan-vien-va-phan-quyen" href="#">
                <span className="material-symbols-outlined text-[20px]">badge</span>
                Nhân viên & Phân quyền
              </a>
              <a className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" data-path="ho-so-va-xac-minh" href="#">
                <span className="material-symbols-outlined text-[20px]">verified_user</span>
                Hồ sơ & Xác minh
              </a>
            </div>
          </nav>
        </div>
        <div className="p-3 space-y-2 bg-surface-container-low/50 m-3 rounded-xl">
          <a className="flex items-center justify-between px-3 py-2 text-xs font-medium text-primary hover:text-on-primary-fixed-variant rounded-lg hover:bg-surface-container-lowest transition-colors" href="#">
            <span>Xem trang khách sạn</span>
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </a>
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-on-surface-variant">
            <span className="inline-block w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
            <span className="text-[11px]">CM: Đang đồng bộ</span>
          </div>
        </div>
      </aside>
      <div className="pl-64">
        <header className="fixed top-0 left-64 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-lg">
              <span className="material-symbols-outlined text-secondary text-[20px]">domain</span>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-on-surface leading-tight">An Nhiên Riverside Hotel</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-on-surface-variant">4-Star, Đà Nẵng</span>
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-tertiary-fixed text-on-tertiary-fixed">Đã xác minh</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-[18px] ml-1 cursor-pointer">arrow_drop_down</span>
            </div>
            <div className="relative hidden lg:block w-72">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">search</span>
              <input className="w-full pl-9 pr-3 py-2 bg-surface-container-low rounded-lg text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container" placeholder="Tìm kiếm đặt phòng, phòng, khách sạn..." type="text" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" type="button">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" type="button">
              <span className="material-symbols-outlined text-[20px]">help_outline</span>
            </button>
            <div className="h-6 w-px bg-surface-container-high mx-1"></div>
            <div className="flex items-center gap-3 pl-1">
              <div className="flex flex-col items-end">
                <span className="text-xs font-semibold text-on-surface leading-tight">Trần Nam</span>
                <span className="text-[11px] text-secondary font-medium">Chủ khách sạn</span>
              </div>
              <img alt="Profile" className="w-8 h-8 rounded-full object-cover ring-1 ring-outline-variant" src="https://lh3.googleusercontent.com/aida/AEtjO1V-SCfN5vRag32eaaMCe725o3qjMzRhq78BRcuhKmOXxEDu4G8qm577peTkqU28fF62pdny08VmbaOwjGzlFo32VJpAA8SPA924onlWgQ2t92x5iGKeuhw1fCMiUdigsg6mge97P7ahRot5alw95ynt0-n2m7IucAr968MgN5mTjYAV6AnplZ0Xx-7f4H3KdFhb1vm9RS4hCaI81jJK3nFDIJCSwTS5926q0xHmfGl3sY60Y-Y_wuhSWwMDAhg2Nz8K1d9sN9cn" />
            </div>
          </div>
        </header>
        <main className="w-full pt-16 bg-surface min-h-screen">
          <div className="flex flex-col w-full">
            {/* Top Action & Context Header */}
            <div className="px-8 pt-8 pb-6 flex flex-col gap-4">
              {/* Breadcrumb & Status Indicator */}
              <div className="flex items-center justify-between">
                <nav className="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
                  <span>Quản lý kinh doanh</span>
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  <span className="text-primary font-semibold">Luật giá & Giá theo mùa</span>
                </nav>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-low text-[11px] text-on-surface-variant font-medium">
                  <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                  <span>Bộ máy tính giá thời gian thực: Tự động tối ưu theo độ ưu tiên</span>
                </div>
              </div>
              {/* Title & Top Primary Actions */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-1">
                <div>
                  <h1 className="font-headline font-bold text-2xl lg:text-3xl text-primary tracking-tight">Thiết lập Luật giá & Bảng giá theo mùa vụ</h1>
                  <p className="text-sm text-on-surface-variant mt-1.5 max-w-3xl leading-relaxed">Quản lý các quy tắc phụ thu cuối tuần, giá lễ hội pháo hoa DIFF, và giá ưu đãi ngày trong tuần cho An Nhiên Riverside Hotel.</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button className="h-11 px-4 rounded-xl bg-surface-container-lowest text-on-surface hover:bg-surface-container-low text-xs font-semibold flex items-center gap-2 shadow-sm transition-all duration-200" id="btn-open-simulator">
                    <span className="material-symbols-outlined text-[18px] text-primary">calculate</span>
                    <span>Mô phỏng tính giá phòng</span>
                  </button>
                  <button className="h-11 px-5 rounded-xl bg-primary-container text-on-primary hover:bg-primary text-xs font-semibold flex items-center gap-2 shadow-sm transition-all duration-200" id="btn-create-rule">
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    <span>+ Tạo quy tắc giá mới</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="px-8 pb-12 flex flex-col gap-8">
              {/* KHU VỰC 1: 4 Thẻ quy tắc giá đang kích hoạt (Bento Cards with Visuals) */}
              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[20px]">tune</span>
                    <h2 className="text-base font-bold font-headline text-on-surface tracking-tight">Các quy tắc giá hiệu lực cao nhất</h2>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container-high text-on-surface-variant">4 Đang hoạt động</span>
                  </div>
                  <span className="text-xs text-outline font-medium">Hệ thống áp dụng ghi đè tự động theo thứ tự ưu tiên (Mức 1 &gt; Mức 5)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {/* Card 1: Phụ thu Cuối tuần */}
                  <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-surface-container-low/60 -z-0 pointer-events-none group-hover:scale-110 transition-transform"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-surface-container-high text-on-surface-variant flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                          Ưu tiên: Mức 3
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed">Quanh năm</span>
                      </div>
                      <h3 className="font-headline font-bold text-base text-on-surface leading-snug">Phụ thu Cuối tuần</h3>
                      <p className="text-xs text-on-surface-variant mt-0.5">Thứ 6 & Thứ 7 hàng tuần</p>
                      <div className="mt-4 pt-3 bg-surface-container-low/40 rounded-xl p-3 flex flex-col gap-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-on-surface-variant font-medium">Điều chỉnh</span>
                          <span className="text-base font-bold text-secondary font-headline">+15%</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                          <span>Áp dụng</span>
                          <span className="font-semibold text-on-surface">Tất cả hạng phòng</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 flex items-center justify-between text-[11px] text-on-surface-variant relative z-10">
                      <span className="flex items-center gap-1 text-tertiary font-medium">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        Đang áp dụng
                      </span>
                      <button className="text-primary hover:text-on-primary-fixed-variant font-semibold flex items-center gap-0.5 transition-colors">
                        Chi tiết
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                  {/* Card 2: Mùa DIFF 2026 (Highlight) */}
                  <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-secondary-fixed/40 via-transparent to-transparent pointer-events-none"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-secondary text-on-secondary flex items-center gap-1 shadow-sm">
                          <span className="material-symbols-outlined text-[12px]">local_fire_department</span>
                          Ưu tiên: Mức 1 (Cao nhất)
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant">24/10 - 26/10</span>
                      </div>
                      <h3 className="font-headline font-bold text-base text-primary leading-snug">Pháo hoa Quốc tế Đà Nẵng</h3>
                      <p className="text-xs text-secondary font-medium mt-0.5">Mùa cao điểm DIFF 2026</p>
                      <div className="mt-4 pt-3 bg-secondary-fixed/20 rounded-xl p-3 flex flex-col gap-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-on-surface-variant font-medium">Điều chỉnh</span>
                          <span className="text-base font-bold text-secondary font-headline">
                            +25%
                            <span className="text-[11px] font-normal text-on-surface-variant">hoặc +300.000 ₫</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                          <span>Áp dụng</span>
                          <span className="font-semibold text-primary truncate max-w-[140px]" title="Deluxe River View & Suite">Deluxe River View & Suite</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 flex items-center justify-between text-[11px] text-on-surface-variant relative z-10">
                      <span className="flex items-center gap-1 text-primary-container font-medium">
                        <span className="material-symbols-outlined text-[14px]">event_upcoming</span>
                        Đã lên lịch
                      </span>
                      <button className="text-primary hover:text-on-primary-fixed-variant font-semibold flex items-center gap-0.5 transition-colors">
                        Chỉnh sửa
                        <span className="material-symbols-outlined text-[14px]">tune</span>
                      </button>
                    </div>
                  </div>
                  {/* Card 3: Ưu đãi Lưu trú dài ngày */}
                  <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-tertiary-fixed/20 -z-0 pointer-events-none group-hover:scale-110 transition-transform"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-surface-container-high text-on-surface-variant flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                          Ưu tiên: Mức 4
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant">≥ 4 đêm</span>
                      </div>
                      <h3 className="font-headline font-bold text-base text-on-surface leading-snug">Ưu đãi Lưu trú dài ngày</h3>
                      <p className="text-xs text-on-surface-variant mt-0.5">Khách ở từ 4 đêm trở lên</p>
                      <div className="mt-4 pt-3 bg-surface-container-low/40 rounded-xl p-3 flex flex-col gap-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-on-surface-variant font-medium">Điều chỉnh</span>
                          <span className="text-base font-bold text-tertiary font-headline">
                            -10%
                            <span className="text-[10px] font-normal text-on-surface-variant">tổng hóa đơn</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                          <span>Áp dụng</span>
                          <span className="font-semibold text-on-surface">Tất cả hạng phòng</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 flex items-center justify-between text-[11px] text-on-surface-variant relative z-10">
                      <span className="flex items-center gap-1 text-tertiary font-medium">
                        <span className="material-symbols-outlined text-[14px]">toggle_on</span>
                        Đang kích hoạt
                      </span>
                      <button className="text-primary hover:text-on-primary-fixed-variant font-semibold flex items-center gap-0.5 transition-colors">
                        Chi tiết
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                  {/* Card 4: Ưu đãi Đặt sớm */}
                  <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-primary-fixed/30 -z-0 pointer-events-none group-hover:scale-110 transition-transform"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-surface-container-high text-on-surface-variant flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                          Ưu tiên: Mức 5
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant">Trước 21 ngày</span>
                      </div>
                      <h3 className="font-headline font-bold text-base text-on-surface leading-snug">Ưu đãi Early Bird</h3>
                      <p className="text-xs text-on-surface-variant mt-0.5">Đặt sớm từ 21 ngày trước nhận phòng</p>
                      <div className="mt-4 pt-3 bg-surface-container-low/40 rounded-xl p-3 flex flex-col gap-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-on-surface-variant font-medium">Điều chỉnh</span>
                          <span className="text-base font-bold text-tertiary font-headline">-8%</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                          <span>Áp dụng</span>
                          <span className="font-semibold text-on-surface truncate max-w-[140px]" title="Superior Garden View & Studio">Superior & Studio</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 flex items-center justify-between text-[11px] text-on-surface-variant relative z-10">
                      <span className="flex items-center gap-1 text-tertiary font-medium">
                        <span className="material-symbols-outlined text-[14px]">toggle_on</span>
                        Đang kích hoạt
                      </span>
                      <button className="text-primary hover:text-on-primary-fixed-variant font-semibold flex items-center gap-0.5 transition-colors">
                        Chi tiết
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
              {/* Main Workspace Split: KHU VỰC 2 (Bảng danh sách) & KHU VỰC 3 (Bộ mô phỏng) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* KHU VỰC 2: Bảng danh sách chi tiết các quy tắc định giá (Pricing Rules Table) (Col 8) */}
                <section className="lg:col-span-8 flex flex-col gap-4">
                  <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-6 flex flex-col gap-5">
                    {/* Table Header Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <h2 className="font-headline font-bold text-lg text-primary">Danh mục quy tắc định giá</h2>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant">6 quy tắc</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[16px]">filter_list</span>
                          <select className="pl-8 pr-7 py-2 bg-surface-container-low rounded-lg text-xs font-medium text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary-container cursor-pointer">
                            <option>Tất cả trạng thái</option>
                            <option>Đang kích hoạt</option>
                            <option>Đã lên lịch</option>
                            <option>Tạm dừng</option>
                          </select>
                          <span className="material-symbols-outlined absolute right-2 top-2.5 text-on-surface-variant text-[16px] pointer-events-none">arrow_drop_down</span>
                        </div>
                        <button className="h-9 px-3 bg-surface-container-low rounded-lg text-xs font-medium text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 transition-colors">
                          <span className="material-symbols-outlined text-[16px]">swap_vert</span>
                          Ưu tiên
                        </button>
                      </div>
                    </div>
                    {/* Table Container */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-surface-container-low text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider rounded-lg">
                            <th className="py-3.5 px-4 rounded-l-lg">Tên quy tắc</th>
                            <th className="py-3.5 px-4">Hạng phòng</th>
                            <th className="py-3.5 px-4">Khoảng thời gian</th>
                            <th className="py-3.5 px-4">Mức điều chỉnh</th>
                            <th className="py-3.5 px-4 text-center">Ưu tiên</th>
                            <th className="py-3.5 px-4">Trạng thái</th>
                            <th className="py-3.5 px-4 rounded-r-lg text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y-0 space-y-1">
                          {/* Row 1: DIFF 2026 */}
                          <tr className="hover:bg-surface-container-low/60 transition-colors rounded-xl group">
                            <td className="py-4 px-4 font-semibold text-primary">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                                <div>
                                  <p className="text-xs font-bold text-on-surface">Lễ hội Pháo hoa DIFF 2026</p>
                                  <p className="text-[10px] text-on-surface-variant">Sự kiện đặc biệt hè - sông Hàn</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-on-surface">
                              <span className="inline-block px-2 py-0.5 rounded bg-surface-container-high text-[11px] text-on-surface-variant font-medium">Deluxe & Suite</span>
                            </td>
                            <td className="py-4 px-4 text-on-surface-variant">
                              <span className="font-medium text-on-surface">24/10 - 26/10/2026</span>
                              <span className="block text-[10px] text-secondary">3 đêm cao điểm</span>
                            </td>
                            <td className="py-4 px-4 font-headline font-bold text-secondary">
                              +25%
                              <span className="text-[10px] text-on-surface-variant font-normal">(+300.000 ₫)</span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-bold text-[11px]">1</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-primary-fixed text-on-primary-fixed-variant">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                                Đã lên lịch
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="inline-flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-primary transition-colors" title="Chỉnh sửa">
                                  <span className="material-symbols-outlined text-[16px]">edit</span>
                                </button>
                                <button className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-primary transition-colors" title="Sao chép">
                                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                </button>
                                <button className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-error transition-colors" title="Tạm dừng">
                                  <span className="material-symbols-outlined text-[16px]">pause_circle</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                          {/* Row 2: Phụ thu Cuối tuần */}
                          <tr className="hover:bg-surface-container-low/60 transition-colors rounded-xl group">
                            <td className="py-4 px-4 font-semibold text-primary">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                                <div>
                                  <p className="text-xs font-bold text-on-surface">Phụ thu Cuối tuần (T6 & T7)</p>
                                  <p className="text-[10px] text-on-surface-variant">Lịch lặp lại hàng tuần</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-on-surface">
                              <span className="inline-block px-2 py-0.5 rounded bg-surface-container-high text-[11px] text-on-surface-variant font-medium">Tất cả hạng phòng</span>
                            </td>
                            <td className="py-4 px-4 text-on-surface-variant">
                              <span className="font-medium text-on-surface">Quanh năm</span>
                              <span className="block text-[10px]">T6, T7</span>
                            </td>
                            <td className="py-4 px-4 font-headline font-bold text-secondary">+15%</td>
                            <td className="py-4 px-4 text-center">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-container-high text-on-surface font-semibold text-[11px]">3</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-tertiary-fixed text-on-tertiary-fixed">
                                <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                                Kích hoạt
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="inline-flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-primary transition-colors" title="Chỉnh sửa">
                                  <span className="material-symbols-outlined text-[16px]">edit</span>
                                </button>
                                <button className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-primary transition-colors" title="Sao chép">
                                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                </button>
                                <button className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-error transition-colors" title="Tạm dừng">
                                  <span className="material-symbols-outlined text-[16px]">pause_circle</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                          {/* Row 3: Lưu trú dài ngày */}
                          <tr className="hover:bg-surface-container-low/60 transition-colors rounded-xl group">
                            <td className="py-4 px-4 font-semibold text-primary">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                                <div>
                                  <p className="text-xs font-bold text-on-surface">Lưu trú dài ngày (≥ 4 đêm)</p>
                                  <p className="text-[10px] text-on-surface-variant">Tự động trừ trên tổng giỏ hàng</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-on-surface">
                              <span className="inline-block px-2 py-0.5 rounded bg-surface-container-high text-[11px] text-on-surface-variant font-medium">Tất cả hạng phòng</span>
                            </td>
                            <td className="py-4 px-4 text-on-surface-variant">
                              <span className="font-medium text-on-surface">01/01 - 31/12/2026</span>
                              <span className="block text-[10px]">Tối thiểu 4 đêm</span>
                            </td>
                            <td className="py-4 px-4 font-headline font-bold text-tertiary">-10%</td>
                            <td className="py-4 px-4 text-center">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-container-high text-on-surface font-semibold text-[11px]">4</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-tertiary-fixed text-on-tertiary-fixed">
                                <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                                Kích hoạt
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="inline-flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-primary transition-colors" title="Chỉnh sửa">
                                  <span className="material-symbols-outlined text-[16px]">edit</span>
                                </button>
                                <button className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-primary transition-colors" title="Sao chép">
                                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                </button>
                                <button className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-error transition-colors" title="Tạm dừng">
                                  <span className="material-symbols-outlined text-[16px]">pause_circle</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                          {/* Row 4: Ưu đãi Đặt sớm Early Bird */}
                          <tr className="hover:bg-surface-container-low/60 transition-colors rounded-xl group">
                            <td className="py-4 px-4 font-semibold text-primary">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary-fixed-dim"></span>
                                <div>
                                  <p className="text-xs font-bold text-on-surface">Ưu đãi Early Bird 21 ngày</p>
                                  <p className="text-[10px] text-on-surface-variant">Khuyến khích lập kế hoạch sớm</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-on-surface">
                              <span className="inline-block px-2 py-0.5 rounded bg-surface-container-high text-[11px] text-on-surface-variant font-medium">Superior & Studio</span>
                            </td>
                            <td className="py-4 px-4 text-on-surface-variant">
                              <span className="font-medium text-on-surface">Không giới hạn</span>
                              <span className="block text-[10px]">Lead time ≥ 21 ngày</span>
                            </td>
                            <td className="py-4 px-4 font-headline font-bold text-tertiary">-8%</td>
                            <td className="py-4 px-4 text-center">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-container-high text-on-surface font-semibold text-[11px]">5</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-tertiary-fixed text-on-tertiary-fixed">
                                <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                                Kích hoạt
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="inline-flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-primary transition-colors" title="Chỉnh sửa">
                                  <span className="material-symbols-outlined text-[16px]">edit</span>
                                </button>
                                <button className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-primary transition-colors" title="Sao chép">
                                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                </button>
                                <button className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-error transition-colors" title="Tạm dừng">
                                  <span className="material-symbols-outlined text-[16px]">pause_circle</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                          {/* Row 5: Giảm giá ngày giữa tuần (Thứ 2 - Thứ 4) */}
                          <tr className="hover:bg-surface-container-low/60 transition-colors rounded-xl group">
                            <td className="py-4 px-4 font-semibold text-primary">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-outline"></span>
                                <div>
                                  <p className="text-xs font-bold text-on-surface">Giờ vàng giữa tuần (T2 - T4)</p>
                                  <p className="text-[10px] text-on-surface-variant">Lấp đầy công suất mùa thấp điểm</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-on-surface">
                              <span className="inline-block px-2 py-0.5 rounded bg-surface-container-high text-[11px] text-on-surface-variant font-medium">Tất cả hạng phòng</span>
                            </td>
                            <td className="py-4 px-4 text-on-surface-variant">
                              <span className="font-medium text-on-surface">01/09 - 30/11/2026</span>
                              <span className="block text-[10px]">T2, T3, T4</span>
                            </td>
                            <td className="py-4 px-4 font-headline font-bold text-tertiary">-12%</td>
                            <td className="py-4 px-4 text-center">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-container-high text-on-surface font-semibold text-[11px]">6</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-surface-container-high text-on-surface-variant">
                                <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                                Tạm ngưng
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="inline-flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-primary transition-colors" title="Chỉnh sửa">
                                  <span className="material-symbols-outlined text-[16px]">edit</span>
                                </button>
                                <button className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-tertiary transition-colors" title="Kích hoạt lại">
                                  <span className="material-symbols-outlined text-[16px]">play_circle</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    {/* Bottom Micro-summary */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between text-xs text-on-surface-variant gap-2">
                      <span>Hiển thị 5 trên 5 quy tắc đang cấu hình</span>
                      <div className="flex items-center gap-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-tertiary"></span>
                        <span>Cập nhật đồng bộ Channel Manager lần cuối: Hôm nay 14:32</span>
                      </div>
                    </div>
                  </div>
                  {/* Visual Mini Insight Chart: Mùa pháo hoa tác động giá */}
                  <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col gap-1 max-w-sm">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Phân tích tác động doanh thu</span>
                      <h3 className="font-headline font-bold text-base text-primary">Dự báo mùa lễ hội DIFF 2026</h3>
                      <p className="text-xs text-on-surface-variant leading-relaxed">Quy tắc Mức 1 (tăng 25%) kết hợp loại bỏ phụ thu trùng lặp giúp tối ưu RevPAR thêm 18,4% so với mùa thường mà vẫn giữ điểm đánh giá mức độ hài lòng về giá ở mức 4.8/5.</p>
                    </div>
                    {/* Inline Sparkline Graph */}
                    <div className="w-full sm:w-64 flex flex-col items-center bg-surface-container-low rounded-xl p-4">
                      <div className="flex items-baseline justify-between w-full mb-2">
                        <span className="text-[11px] text-on-surface-variant font-medium">RevPAR dự kiến</span>
                        <span className="text-sm font-bold text-secondary font-headline">1.820.000 ₫</span>
                      </div>
                      <svg className="w-full h-16" fill="none" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 45 C30 42, 50 48, 80 40 C110 32, 130 10, 160 8 C180 6, 190 2, 200 4" stroke="#934a33" strokeLinecap="round" strokeWidth="2.5"></path>
                        <path d="M0 45 C30 42, 50 48, 80 40 C110 32, 130 10, 160 8 C180 6, 190 2, 200 4 L200 60 L0 60 Z" fill="url(#revGrad)" opacity="0.15"></path>
                        <defs>
                          <linearGradient gradientunits="userSpaceOnUse" id="revGrad" x1="0" x2="0" y1="0" y2="60">
                            <stop stopColor="#934a33"></stop>
                            <stop offset="1" stopColor="#934a33" stopOpacity="0"></stop>
                          </linearGradient>
                        </defs>
                        {/* Indicator points */}
                        <circle cx="160" cy="8" fill="#234e70" r="3.5"></circle>
                        <circle cx="200" cy="4" fill="#934a33" r="3.5"></circle>
                      </svg>
                      <div className="flex justify-between w-full text-[10px] text-on-surface-variant mt-1">
                        <span>Đầu tuần</span>
                        <span className="font-semibold text-secondary">Đêm pháo hoa (24-26/10)</span>
                      </div>
                    </div>
                  </div>
                </section>
                {/* KHU VỰC 3: Khung mô phỏng kiểm tra giá (Live Price Simulator) (Col 4) */}
                <aside className="lg:col-span-4 flex flex-col gap-6 sticky top-20">
                  <div className="bg-surface-container-lowest rounded-2xl shadow-md p-6 flex flex-col gap-5 relative overflow-hidden">
                    {/* Top Accent Band */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-container via-secondary to-tertiary"></div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-[18px]">calculate</span>
                        </span>
                        <div>
                          <h3 className="font-headline font-bold text-base text-primary">Mô phỏng tính giá phòng</h3>
                          <p className="text-[11px] text-on-surface-variant">Live Price Breakdown Sandbox</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-tertiary-fixed text-on-tertiary-fixed">Test Mode</span>
                    </div>
                    {/* Interactive Parameter Controls */}
                    <div className="flex flex-col gap-3.5 bg-surface-container-low/50 p-4 rounded-xl">
                      {/* Room Selection */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Hạng phòng kiểm tra</label>
                        <div className="relative">
                          <select className="w-full h-10 pl-3 pr-8 bg-surface-container-lowest rounded-lg text-xs font-semibold text-primary appearance-none focus:outline-none focus:ring-2 focus:ring-primary-container cursor-pointer shadow-sm" id="sim-room-select">
                            <option selected="" value="deluxe">Deluxe River View (Cơ sở: 1.250.000 ₫)</option>
                            <option value="suite">Executive Suite (Cơ sở: 2.100.000 ₫)</option>
                            <option value="superior">Superior Garden (Cơ sở: 850.000 ₫)</option>
                          </select>
                          <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-on-surface-variant text-[18px] pointer-events-none">arrow_drop_down</span>
                        </div>
                      </div>
                      {/* Date Selection */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Ngày lưu trú mô phỏng</label>
                        <div className="flex items-center gap-2 h-10 px-3 bg-surface-container-lowest rounded-lg text-xs font-medium text-on-surface shadow-sm">
                          <span className="material-symbols-outlined text-secondary text-[18px]">event</span>
                          <span className="font-semibold text-primary">24/10/2026</span>
                          <span className="text-[11px] text-on-surface-variant ml-auto font-medium">(Thứ Bảy • Mùa DIFF)</span>
                        </div>
                      </div>
                      {/* Stay Condition Badges */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary-fixed text-on-secondary-fixed">Trùng: Đêm Lễ hội pháo hoa</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-container-high text-on-surface-variant">Trùng: Thứ 7 (Cuối tuần)</span>
                      </div>
                    </div>
                    {/* Decomposition & Price Breakdown Result */}
                    <div className="flex flex-col gap-3">
                      <h4 className="text-xs font-bold font-headline text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-primary">receipt_long</span>
                        Phân rã công thức định giá tự động
                      </h4>
                      <div className="space-y-2 text-xs">
                        {/* Item 1: Base Price */}
                        <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-surface-container-low/40">
                          <span className="text-on-surface-variant">Giá phòng cơ sở (Base rate):</span>
                          <span className="font-bold text-on-surface font-headline">1.250.000 ₫</span>
                        </div>
                        {/* Item 2: Applied Rule (Winner) */}
                        <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-secondary-fixed/20 text-on-secondary-container">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px] text-secondary">check</span>
                            <span className="font-medium">DIFF 2026 (+25% Mức 1):</span>
                          </div>
                          <span className="font-bold text-secondary font-headline">+312.500 ₫</span>
                        </div>
                        {/* Item 3: Suppressed Rule (Priority conflict resolved) */}
                        <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-surface-container-low/30 text-outline">
                          <div className="flex items-center gap-1.5 line-through">
                            <span className="material-symbols-outlined text-[14px]">block</span>
                            <span>Phụ thu Cuối tuần (+15% Mức 3):</span>
                          </div>
                          <span className="text-[11px] italic">Bị ghi đè (0 ₫)</span>
                        </div>
                      </div>
                      {/* Dynamic Total Card */}
                      <div className="mt-2 p-4 rounded-xl bg-primary text-on-primary shadow-sm flex flex-col gap-1.5">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs font-medium opacity-90">Tổng giá bán hiển thị:</span>
                          <div className="text-right">
                            <span className="text-2xl font-bold font-headline tracking-tight">1.562.500 ₫</span>
                            <span className="text-[10px] block opacity-80 font-normal">/ đêm (Đã gồm thuế & phí)</span>
                          </div>
                        </div>
                        <div className="h-px bg-white/10 my-1"></div>
                        <p className="text-[11px] leading-tight opacity-85">
                          Quy tắc
                          <strong>Mức 1 (DIFF)</strong>
                          có độ ưu tiên cao nhất, tự động vô hiệu hóa quy tắc
                          <strong>Mức 3 (Cuối tuần)</strong>
                          nhằm tránh phụ thu trùng lặp gây tiêu cực cho khách đặt phòng.
                        </p>
                      </div>
                    </div>
                    {/* Transparency Logic Explanation */}
                    <div className="p-3 bg-surface-container-low rounded-xl text-[11px] text-on-surface-variant flex gap-2.5 items-start">
                      <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">verified</span>
                      <div className="flex flex-col gap-1 leading-relaxed">
                        <span className="font-semibold text-primary">Minh bạch thuật toán StayReco</span>
                        <span>Hệ thống tuân thủ nghiêm ngặt bảng thứ tự ưu tiên. Khách sạn luôn kiểm soát được biên độ điều chỉnh tối đa mà không xảy ra tình trạng "đội giá chéo".</span>
                      </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button className="w-full h-10 rounded-xl bg-primary-container text-on-primary hover:bg-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">print</span>
                        <span>Xuất biểu mẫu giá</span>
                      </button>
                      <button className="h-10 px-3 rounded-xl bg-surface-container-low text-on-surface-variant hover:text-on-surface text-xs font-semibold flex items-center justify-center transition-colors" title="Làm mới mô phỏng">
                        <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                      </button>
                    </div>
                  </div>
                  {/* Channel Sync Safety Notice */}
                  <div className="rounded-xl p-4 bg-tertiary-fixed/30 text-on-tertiary-container flex items-start gap-3">
                    <span className="material-symbols-outlined text-tertiary text-[20px] shrink-0">sync_saved_locally</span>
                    <div className="flex flex-col gap-0.5 text-xs">
                      <span className="font-bold text-tertiary">Bảo vệ tính khả dụng phòng</span>
                      <span className="text-[11px] text-on-tertiary-fixed-variant leading-snug">Bất kỳ thay đổi luật giá nào được kích hoạt sẽ tự động cập nhật đến OTA (Agoda, Booking, Traveloka) trong vòng tối đa 90 giây.</span>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
            {/* Interactive Slide-over / Modal (Hidden by default, for creating new rule) */}
            <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm z-50 hidden flex justify-end transition-opacity duration-300" id="modal-create-rule">
              <div className="w-full max-w-lg bg-surface-container-lowest h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between pb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[24px]">post_add</span>
                      <h3 className="font-headline font-bold text-lg text-primary">Tạo quy tắc định giá mới</h3>
                    </div>
                    <button className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors" id="btn-close-modal">
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>
                  <div className="flex flex-col gap-4 text-xs">
                    <div>
                      <label className="font-semibold text-on-surface-variant block mb-1">Tên quy tắc</label>
                      <input className="w-full h-11 px-3 bg-surface-container-low rounded-xl text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container" placeholder="VD: Phụ thu Tết Nguyên Đán 2027" type="text" />
                    </div>
                    <div>
                      <label className="font-semibold text-on-surface-variant block mb-1">Hạng phòng áp dụng</label>
                      <select className="w-full h-11 px-3 bg-surface-container-low rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container">
                        <option>Tất cả các hạng phòng</option>
                        <option>Deluxe River View</option>
                        <option>Executive River Suite</option>
                        <option>Superior Garden View</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-on-surface-variant block mb-1">Loại điều chỉnh</label>
                        <select className="w-full h-11 px-3 bg-surface-container-low rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container">
                          <option>Tăng theo tỷ lệ (%)</option>
                          <option>Giảm theo tỷ lệ (%)</option>
                          <option>Tăng cố định (VND)</option>
                          <option>Giảm cố định (VND)</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-semibold text-on-surface-variant block mb-1">Giá trị điều chỉnh</label>
                        <input className="w-full h-11 px-3 bg-surface-container-low rounded-xl text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container" placeholder="15" type="number" />
                      </div>
                    </div>
                    <div>
                      <label className="font-semibold text-on-surface-variant block mb-1">Mức độ ưu tiên ghi đè</label>
                      <select className="w-full h-11 px-3 bg-surface-container-low rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container">
                        <option>Mức 1 (Cao nhất - Lễ hội, Sự kiện đặc quyền)</option>
                        <option>Mức 2 (Mùa cao điểm du lịch hè)</option>
                        <option selected="">Mức 3 (Cuối tuần định kỳ)</option>
                        <option>Mức 4 (Ưu đãi lưu trú dài ngày)</option>
                        <option>Mức 5 (Early bird & Khách thân thiết)</option>
                      </select>
                      <span className="text-[10px] text-on-surface-variant mt-1 block">Quy tắc mức ưu tiên cao hơn sẽ tự động ghi đè hoặc quyết định việc cộng dồn phụ thu.</span>
                    </div>
                    <div>
                      <label className="font-semibold text-on-surface-variant block mb-1">Thời gian hiệu lực</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input className="h-11 px-3 bg-surface-container-low rounded-xl text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary-container" type="date" />
                        <input className="h-11 px-3 bg-surface-container-low rounded-xl text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary-container" type="date" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-6 flex items-center gap-3">
                  <button className="w-1/2 h-11 rounded-xl bg-surface-container-low text-on-surface font-semibold text-xs hover:bg-surface-container-high transition-colors" id="btn-cancel-modal">Hủy bỏ</button>
                  <button className="w-1/2 h-11 rounded-xl bg-primary text-on-primary font-semibold text-xs hover:bg-on-primary-fixed-variant transition-colors shadow-sm">Lưu & Áp dụng</button>
                </div>
              </div>
            </div>
            {/* Inline Interaction Script */}
          </div>
        </main>
      </div>
    </div>
  );
}
