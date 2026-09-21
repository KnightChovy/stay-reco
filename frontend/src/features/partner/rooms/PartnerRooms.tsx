/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Legacy DOM-driven screen; migrate interactions to React state separately.
import React from 'react';

export default function PartnerRooms() {
  React.useEffect(() => {
    try {
      (function () {
      const links = document.querySelectorAll('aside nav a');
      links.forEach(l => {
        if (l.getAttribute('data-path') === 'kho-phong') {
          l.className = 'flex items-center gap-3 px-3 py-2 text-sm rounded-lg bg-primary-container text-on-primary font-medium shadow-sm transition-colors';
        }
      });
    })();
    } catch (err) {
      console.error('Error executing interaction script:', err);
    }

    try {
      (function() {
      const saveBtn = document.getElementById('save-room-btn');
      if (saveBtn) {
        saveBtn.addEventListener('click', function() {
          const originalText = saveBtn.innerHTML;
          saveBtn.innerHTML = `
            <span class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
            <span>Đang lưu buồng phòng...</span>
          `;
          saveBtn.disabled = true;

          setTimeout(function() {
            saveBtn.innerHTML = `
              <span class="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Đã lưu thành công!</span>
            `;
            saveBtn.classList.remove('bg-primary-container');
            saveBtn.classList.add('bg-tertiary');

            setTimeout(function() {
              saveBtn.innerHTML = originalText;
              saveBtn.classList.remove('bg-tertiary');
              saveBtn.classList.add('bg-primary-container');
              saveBtn.disabled = false;
            }, 2500);
          }, 800);
        });
      }

      // Radio state highlight feedback
      const radioLabels = document.querySelectorAll('#operational-status-group label');
      radioLabels.forEach(label => {
        label.addEventListener('click', function() {
          radioLabels.forEach(l => {
            l.classList.remove('bg-tertiary-fixed/30', 'shadow-sm');
            l.classList.add('bg-surface-container-low');
          });
          label.classList.add('bg-tertiary-fixed/30', 'shadow-sm');
          label.classList.remove('bg-surface-container-low');
        });
      });
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
              <a aria-current="page" className="flex items-center gap-3 px-3 py-2 transition-colors bg-primary-container text-on-primary font-medium rounded-lg shadow-sm" data-path="kho-phong" href="#">
                <span className="material-symbols-outlined text-[20px]">bed</span>
                Kho phòng
              </a>
              <a className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" data-path="lich-ton-va-kha-dung" href="#">
                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                Lịch tồn & Khả dụng
              </a>
              <a className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" data-path="luat-gia-va-mua-vu" href="#">
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
            {/* Dynamic Sidebar Active Matcher */}
            {/* Main Content Container */}
            <div className="p-6 md:p-8 max-w-[1400px] mx-auto w-full space-y-6">
              {/* Top Ribbon: Breadcrumb & Context Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <nav className="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
                    <span className="hover:text-primary cursor-pointer transition-colors">Quản lý kinh doanh</span>
                    <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
                    <span className="hover:text-primary cursor-pointer transition-colors">Kho phòng</span>
                    <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
                    <span className="hover:text-primary cursor-pointer transition-colors">Phòng vật lý</span>
                    <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
                    <span className="text-primary font-semibold">Chỉnh sửa phòng P.305</span>
                  </nav>
                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-10 h-10 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-2xl">meeting_room</span>
                    </div>
                    <div>
                      <h1 className="text-2xl font-headline font-bold text-on-surface tracking-tight">
                        Chỉnh sửa Buồng phòng vật lý:
                        <span className="text-primary">Phòng P.305</span>
                      </h1>
                      <p className="text-xs text-on-surface-variant flex items-center gap-2">
                        <span>
                          Định danh ID:
                          <code className="font-mono text-[11px] bg-surface-container px-1.5 py-0.5 rounded text-primary">ROOM-VN-DN-305</code>
                        </span>
                        <span>•</span>
                        <span>Cập nhật lần cuối: 09:30 Hôm nay bởi Housekeeping Team</span>
                      </p>
                    </div>
                  </div>
                </div>
                {/* Quick Summary Status Pill */}
                <div className="flex items-center gap-3 bg-surface-container-lowest p-2 pl-3.5 pr-4 rounded-xl shadow-sm self-start md:self-auto">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary-fixed-dim opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-tertiary"></span>
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-tertiary">Sạch - Sẵn sàng đón khách</span>
                      <span className="text-xs text-on-surface-variant font-medium">
                        Hạng phòng:
                        <strong className="text-primary">Deluxe River View</strong>
                      </span>
                    </div>
                  </div>
                  <div className="h-7 w-px bg-surface-container mx-1"></div>
                  <a className="p-2 hover:bg-surface-container-low rounded-lg text-on-surface-variant hover:text-primary transition-colors" href="#quick-preview" title="Xem phòng ảo 3D">
                    <span className="material-symbols-outlined text-[20px]">360</span>
                  </a>
                </div>
              </div>
              {/* Editorial Key Metrics / Status Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[22px]">stairs</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Tầng lầu & Cụm</p>
                    <p className="text-base font-bold text-on-surface">Tầng 3 • River Wing</p>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-[22px]">sell</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Giá niêm yết</p>
                    <p className="text-base font-bold text-on-surface font-mono">
                      1.250.000 ₫
                      <span className="text-xs text-on-surface-variant font-normal">/đêm</span>
                    </p>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-lg bg-surface-container-low flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined text-[22px]">key</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Khóa Smartlock</p>
                    <p className="text-base font-bold text-on-surface flex items-center gap-1.5">
                      <span>Online</span>
                      <span className="text-xs font-normal text-tertiary bg-tertiary-fixed/60 px-1.5 py-0.5 rounded-full font-mono">92% Pin</span>
                    </p>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[22px]">nest_multi_room</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Tỉ lệ lấp đầy tuần</p>
                    <p className="text-base font-bold text-on-surface font-mono">
                      85.7%
                      <span className="text-xs text-tertiary font-normal">(↑ 12%)</span>
                    </p>
                  </div>
                </div>
              </div>
              {/* Main Workspace Two-Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT COLUMN: Room Setup & Technical Attributes (7 Columns) */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Section 1: Room Identification Card */}
                  <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between pb-3 bg-gradient-to-r from-transparent via-surface-container-low/60 to-transparent">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-6 bg-primary rounded-full"></span>
                        <h2 className="text-base font-headline font-bold text-on-surface">1. Định danh buồng phòng</h2>
                      </div>
                      <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-1 rounded bg-surface-container-low text-primary">Cơ sở chính</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-on-surface flex items-center gap-1">
                          <span>Số hiệu phòng vật lý</span>
                          <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-3 text-outline text-[18px]">dialpad</span>
                          <input className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface text-sm font-semibold text-on-surface focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary-container transition-all" type="text" defaultValue="P.305" />
                        </div>
                        <p className="text-[11px] text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-tertiary">check_circle</span>
                          Duy nhất trong toàn bộ cơ sở An Nhiên Riverside
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-on-surface flex items-center gap-1">
                          <span>Vị trí Tầng</span>
                          <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-3 text-outline text-[18px]">layers</span>
                          <input className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface text-sm font-medium text-on-surface focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary-container transition-all" type="text" defaultValue="Tầng 3" />
                        </div>
                        <p className="text-[11px] text-on-surface-variant">Lối thoát hiểm cách 12m về hướng Tây</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-on-surface flex items-center gap-1">
                          <span>Tòa nhà / Phân khu</span>
                          <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-3 text-outline text-[18px]">apartment</span>
                          <input className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface text-sm font-medium text-on-surface focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary-container transition-all" type="text" defaultValue="Tòa River Wing (Hướng chính Đông)" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-on-surface flex items-center gap-1">
                          <span>Hạng phòng thương mại gán vào</span>
                          <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-3 text-secondary text-[18px]">hotel_class</span>
                          <select className="w-full h-11 pl-10 pr-8 rounded-lg bg-surface text-sm font-semibold text-primary focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary-container transition-all appearance-none cursor-pointer">
                            <option selected="" value="deluxe-river">Deluxe River View (1.250.000 ₫/đêm)</option>
                            <option value="premium-river">Premium River Front (1.650.000 ₫/đêm)</option>
                            <option value="executive-suite">Executive Suite An Nhiên (2.450.000 ₫/đêm)</option>
                            <option value="standard-city">Standard City Balcony (950.000 ₫/đêm)</option>
                          </select>
                          <span className="material-symbols-outlined absolute right-3 top-3 text-outline text-[18px] pointer-events-none">expand_more</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Section 2: Operational Housekeeping Status */}
                  <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-6 bg-tertiary rounded-full"></span>
                        <h2 className="text-base font-headline font-bold text-on-surface">2. Trạng thái vận hành buồng phòng</h2>
                      </div>
                      <span className="text-xs font-mono text-on-surface-variant">Real-time sync</span>
                    </div>
                    {/* Radio Selector Group */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="operational-status-group">
                      {/* Option 1: Clean & Inspected (ACTIVE) */}
                      <label className="relative flex items-start gap-3 p-3.5 rounded-xl cursor-pointer bg-tertiary-fixed/30 shadow-sm transition-all hover:bg-tertiary-fixed/40">
                        <input defaultChecked={true} className="mt-1 h-4 w-4 text-tertiary accent-tertiary cursor-pointer" name="room_status" type="radio" defaultValue="clean" />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-on-surface">Sạch - Đã kiểm tra</span>
                            <span className="inline-flex w-2 h-2 rounded-full bg-tertiary"></span>
                          </div>
                          <span className="text-[11px] text-on-surface-variant leading-relaxed">Sẵn sàng xếp khách nhận phòng ngay lập tức</span>
                        </div>
                      </label>
                      {/* Option 2: Occupied */}
                      <label className="relative flex items-start gap-3 p-3.5 rounded-xl cursor-pointer bg-surface-container-low transition-all hover:bg-surface-container">
                        <input className="mt-1 h-4 w-4 text-primary accent-primary cursor-pointer" name="room_status" type="radio" defaultValue="occupied" />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-on-surface">Đang có khách lưu trú</span>
                            <span className="inline-flex w-2 h-2 rounded-full bg-primary"></span>
                          </div>
                          <span className="text-[11px] text-on-surface-variant leading-relaxed">Đã giao chìa khóa, khách đang trong kỳ nghỉ</span>
                        </div>
                      </label>
                      {/* Option 3: Dirty / Pending Cleaning */}
                      <label className="relative flex items-start gap-3 p-3.5 rounded-xl cursor-pointer bg-surface-container-low transition-all hover:bg-surface-container">
                        <input className="mt-1 h-4 w-4 text-secondary accent-secondary cursor-pointer" name="room_status" type="radio" defaultValue="dirty" />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-on-surface">Chờ dọn buồng (Bẩn)</span>
                            <span className="inline-flex w-2 h-2 rounded-full bg-secondary"></span>
                          </div>
                          <span className="text-[11px] text-on-surface-variant leading-relaxed">Khách vừa trả phòng hoặc yêu cầu dọn phòng giữa kỳ</span>
                        </div>
                      </label>
                      {/* Option 4: Out of Order / Maintenance */}
                      <label className="relative flex items-start gap-3 p-3.5 rounded-xl cursor-pointer bg-surface-container-low transition-all hover:bg-surface-container">
                        <input className="mt-1 h-4 w-4 text-error accent-error cursor-pointer" name="room_status" type="radio" defaultValue="maintenance" />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-on-surface">Khóa tạm thời / Bảo trì</span>
                            <span className="inline-flex w-2 h-2 rounded-full bg-error"></span>
                          </div>
                          <span className="text-[11px] text-on-surface-variant leading-relaxed">Hỏng hóc trang thiết bị, sơn sửa hoặc kiểm định</span>
                        </div>
                      </label>
                    </div>
                    {/* Internal Housekeeping & Reception Note */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-secondary">lock</span>
                          <span>Ghi chú vận hành nội bộ</span>
                          <span className="text-[11px] font-normal text-on-surface-variant">(Chỉ lễ tân & buồng phòng thấy)</span>
                        </label>
                        <span className="text-[11px] text-on-surface-variant font-mono">152/500 ký tự</span>
                      </div>
                      <div className="relative">
                        <textarea className="w-full p-3.5 rounded-xl bg-surface text-xs font-normal text-on-surface leading-relaxed focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary-container transition-all" rows="3" defaultValue="Phòng vừa kiểm tra rèm cửa và dàn lạnh Daikin ngày 18/10. Tầm nhìn Cầu Rồng cực thoáng, ưu tiên xếp cho khách VIP có ghi chú ngắm pháo hoa." />
                        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-surface-container-lowest/90 backdrop-blur px-2 py-1 rounded-md text-[10px] text-secondary font-medium">
                          <span className="material-symbols-outlined text-[12px]">verified</span>
                          Đã ghi nhận bởi Quản lý Tầng 3
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Section 3: Physical Features & Hardware Specifications */}
                  <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-6 bg-secondary rounded-full"></span>
                        <h2 className="text-base font-headline font-bold text-on-surface">3. Đặc điểm vật lý riêng biệt của căn phòng</h2>
                      </div>
                      <span className="text-[11px] text-on-surface-variant font-medium">Thiết bị & Tiện nghi cố định</span>
                    </div>
                    {/* Interactive Device Card */}
                    <div className="bg-surface-container-low/70 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm">
                          <span className="material-symbols-outlined text-[26px]">door_sliding</span>
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-on-surface">Khóa cửa thông minh</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-tertiary-fixed text-on-tertiary-fixed">Kết nối ổn định</span>
                          </div>
                          <p className="text-xs text-on-surface-variant">Kaadas Smart Doorlock #L-305 • Chuẩn Bluetooth Gateway 5.0</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-tertiary">battery_charging_90</span>
                            <span className="text-xs font-mono font-bold text-tertiary">Pin: 92%</span>
                          </div>
                          <span className="text-[10px] text-on-surface-variant">Kiểm tra: 08:45</span>
                        </div>
                        <button className="h-9 px-3 text-xs font-medium rounded-lg bg-surface-container-lowest text-primary hover:bg-surface-container-high transition-colors flex items-center gap-1 shadow-sm" type="button">
                          <span className="material-symbols-outlined text-[16px]">sync</span>
                          Đồng bộ
                        </button>
                      </div>
                    </div>
                    {/* Grid of Room Architectural Attributes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Balcony Feature */}
                      <div className="p-4 rounded-xl bg-surface-container-low flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm shrink-0">
                          <span className="material-symbols-outlined text-[20px]">balcony</span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-on-surface">Loại kết nối ban công</p>
                          <p className="text-xs text-on-surface-variant leading-tight">Ban công riêng 4.2m² độc lập, trang bị ghế mây thư giãn hướng sông Hàn</p>
                          <div className="pt-1 flex items-center gap-1 text-[11px] text-tertiary font-medium">
                            <span className="material-symbols-outlined text-[14px]">check</span>
                            Lan can kính an toàn cao 1.35m
                          </div>
                        </div>
                      </div>
                      {/* Smoking Policy Feature */}
                      <div className="p-4 rounded-xl bg-surface-container-low flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center text-secondary shadow-sm shrink-0">
                          <span className="material-symbols-outlined text-[20px]">smoke_free</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-on-surface">Chính sách phòng</p>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary-fixed text-on-secondary-fixed">100% Non-smoking</span>
                          </div>
                          <p className="text-xs text-on-surface-variant leading-tight">Phòng không hút thuốc tuyệt đối. Cảm biến khói quang học độc lập tích hợp chuông cảnh báo</p>
                          <div className="pt-1 text-[11px] text-secondary font-medium">Phí phạt vệ sinh: 2.000.000 ₫</div>
                        </div>
                      </div>
                    </div>
                    {/* Room Visual Photos Preview Thumbnails */}
                    <div className="pt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-on-surface">Hình ảnh thực tế góc nhìn từ phòng P.305</span>
                        <a className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5" href="#">
                          <span>Tải thêm ảnh</span>
                          <span className="material-symbols-outlined text-[14px]">add_photo_alternate</span>
                        </a>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="relative rounded-xl overflow-hidden aspect-[4/3] group shadow-sm bg-surface-container">
                          <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" data-alt="Warm modern Vietnamese boutique hotel bedroom interior with polished wood furnishings, soft warm lighting, crisp white bedding, and floor to ceiling balcony windows framing an authentic Da Nang riverbank." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_i2cf2D2fGN6uncBTu8JoQZ1ylLAb9C8lUnr-NdR3cXJSle35PN1P4HIv44cF0lYePSP1GI6MvhalGtUywv4_7f9w5RHRnwaA878JZitYsD_2utK4tcjm8zc3hzwzcK1Z6mQb3yrktvd4jZgDrwqZNtbj8ft-x_cd8QdO2ESZ8tyTGxfSTDob6zQEb6zx093TJgqgo4znK1OqRsHT1z5-N_SsCLl4EGQJVPEjtxImfFjT0w90t_aQ" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2.5">
                            <span className="text-[11px] font-medium text-white">Góc giường & ban công</span>
                          </div>
                        </div>
                        <div className="relative rounded-xl overflow-hidden aspect-[4/3] group shadow-sm bg-surface-container">
                          <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" data-alt="Bright balcony view from luxury riverfront hotel room overlooking Da Nang Han River with vibrant blue water and distant Dragon Bridge under tranquil golden morning sunlight." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDlRUmFPGUxnCjbSlCA4vmsbepF9XB-5uuOifI5zhhfIKvjqXAHfcAtEHpq6hlA12kqzadzMjzuXmM5pHylmVATyP9voswZZowLI7h4iFSxS6D9nVAQhYt0Bm_VPOewqqWkatZaEKtFMlv_MUbe1w544fWxY5Xd60jzq2SO9PIaIEI0udZSqwF02J8oo5CRAOtTm6E5-P-tLV0GEvsIAuFy8QctZl_M5AVheqDPlpcWgRbL9ZA_4No5" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2.5">
                            <span className="text-[11px] font-medium text-white">Tầm nhìn Cầu Rồng</span>
                          </div>
                        </div>
                        <div className="relative rounded-xl overflow-hidden aspect-[4/3] group shadow-sm bg-surface-container">
                          <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" data-alt="Artisanal ceramic bathroom suite inside a boutique hotel featuring natural terracotta tiles, elegant rain shower, bespoke organic amenities, and spotless warm stone vanity." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDs8ICu1Dpfvq32I85mL5g7JI0Gss65Q4jj98asusc4lc6Eadks4v68iccqeB5-LMb8syPMY1T1Oq_wGuHfyJqUzt2SCRoOTUbYkAsTUd_lW5veZ__-U6zdta1jBsdUDIMBgy44PEMpk0VQGW4xTtAZWQFhPljShPSkXagOFJO6ua7tHfAQryHTe3o2ZbzXMKSk9lQ9a4ZxQKeIJutTL-JiWYIH9R8E0mQ51jfFDpy12RToNjXIwcaq" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2.5">
                            <span className="text-[11px] font-medium text-white">Khu vệ sinh & tắm đứng</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* RIGHT COLUMN: Stay Schedule & Housekeeping History (5 Columns) */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Section 1: 7-Day Allocation Timeline */}
                  <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-6 bg-primary-container rounded-full"></span>
                        <div>
                          <h2 className="text-base font-headline font-bold text-on-surface">Lịch phân bổ lưu trú</h2>
                          <p className="text-[11px] text-on-surface-variant">Lịch đón khách 7 ngày tới cho phòng P.305</p>
                        </div>
                      </div>
                      <button className="h-8 px-2.5 rounded-lg bg-surface-container text-xs text-primary font-medium hover:bg-surface-container-high transition-colors flex items-center gap-1" type="button">
                        <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
                        Gán phòng
                      </button>
                    </div>
                    {/* Timeline Track Visualization */}
                    <div className="space-y-3 relative before:absolute before:top-3 before:bottom-3 before:left-[19px] before:w-[2px] before:bg-surface-container-high">
                      {/* Reservation 1: Nguyễn Minh Anh (TODAY CHECK-IN) */}
                      <div className="relative flex items-start gap-4 pl-1">
                        <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-xs shrink-0 ring-4 ring-surface-container-lowest z-10 shadow-sm">20</div>
                        <div className="flex-1 bg-surface-container-low rounded-xl p-3.5 transition-all hover:bg-surface-container">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-on-surface truncate">Nguyễn Minh Anh</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-tertiary-fixed text-on-tertiary-fixed shrink-0">Check-in 14:00 hôm nay</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-on-surface-variant">
                            <span className="font-mono text-primary font-semibold">#SR-261020-0842</span>
                            <span>•</span>
                            <span>2 đêm (20/10 - 22/10)</span>
                          </div>
                          <div className="mt-2.5 pt-2 flex items-center justify-between text-[11px] text-on-surface-variant">
                            <span className="flex items-center gap-1 text-secondary font-medium">
                              <span className="material-symbols-outlined text-[14px]">star</span>
                              Khách VIP StayReco
                            </span>
                            <button className="text-primary font-semibold hover:underline text-[11px]">Xem đơn hàng →</button>
                          </div>
                        </div>
                      </div>
                      {/* Gap / Ready to Assign Slot */}
                      <div className="relative flex items-start gap-4 pl-1">
                        <div className="w-9 h-9 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-bold text-xs shrink-0 ring-4 ring-surface-container-lowest z-10">22</div>
                        <div className="flex-1 rounded-xl p-3.5 bg-tertiary-fixed/20">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-tertiary flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[16px]">check_circle</span>
                              Trống (Sẵn sàng xếp khách)
                            </span>
                            <span className="text-[11px] text-on-surface-variant font-mono">22/10 - 24/10 (2 đêm)</span>
                          </div>
                          <p className="text-[11px] text-on-surface-variant mt-1">Đang mở bán trực tiếp trên hệ sinh thái StayReco & các kênh OTA liên kết.</p>
                        </div>
                      </div>
                      {/* Reservation 2: David Miller (OTA Agoda) */}
                      <div className="relative flex items-start gap-4 pl-1">
                        <div className="w-9 h-9 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center font-bold text-xs shrink-0 ring-4 ring-surface-container-lowest z-10">24</div>
                        <div className="flex-1 bg-surface-container-low rounded-xl p-3.5 transition-all hover:bg-surface-container">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-on-surface truncate">David Miller</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-container-highest text-on-surface-variant shrink-0">OTA Agoda</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-on-surface-variant">
                            <span className="font-mono text-primary font-semibold">#BK-90412</span>
                            <span>•</span>
                            <span>1 đêm (24/10 - 25/10)</span>
                          </div>
                          <div className="mt-2.5 pt-2 flex items-center justify-between text-[11px] text-on-surface-variant">
                            <span>Yêu cầu: Check-in muộn (21:00)</span>
                            <span className="font-mono font-medium text-primary">Đã thanh toán</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Weekly Occupancy Mini Progress Chart */}
                    <div className="p-3.5 rounded-xl bg-surface-container-low/60 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-on-surface-variant">Mật độ lấp đầy tuần này (3/7 ngày đã đặt)</span>
                        <span className="font-mono font-bold text-primary">42.8%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden flex">
                        <div className="bg-primary h-full w-[28.5%]" title="20-22 Oct: Nguyễn Minh Anh"></div>
                        <div className="bg-transparent h-full w-[28.5%]" title="Trống"></div>
                        <div className="bg-secondary h-full w-[14.3%]" title="24-25 Oct: David Miller"></div>
                        <div className="bg-transparent h-full w-[28.7%]" title="Trống"></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-on-surface-variant font-mono">
                        <span>T2 (20)</span>
                        <span>T4 (22)</span>
                        <span>T6 (24)</span>
                        <span>CN (26)</span>
                      </div>
                    </div>
                  </div>
                  {/* Section 2: Recent Housekeeping & Room Audits */}
                  <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-6 bg-tertiary rounded-full"></span>
                        <div>
                          <h2 className="text-base font-headline font-bold text-on-surface">Lịch sử buồng phòng gần nhất</h2>
                          <p className="text-[11px] text-on-surface-variant">Nhật ký trực ca & kiểm tra buồng phòng</p>
                        </div>
                      </div>
                      <a className="text-xs text-primary font-medium hover:underline" href="#">Toàn bộ</a>
                    </div>
                    <div className="space-y-3">
                      {/* Event 1: Recent Cleaning Today */}
                      <div className="p-3.5 rounded-xl bg-surface-container-low flex items-start gap-3 transition-colors hover:bg-surface-container">
                        <div className="w-8 h-8 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[18px]">sanitizer</span>
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-on-surface">Đã dọn sạch & kiểm tra minibar</span>
                            <span className="text-[10px] text-on-surface-variant font-mono">09:30 hôm nay</span>
                          </div>
                          <p className="text-xs text-on-surface-variant">
                            Housekeeping
                            <strong className="text-on-surface">Lê Thị Mai</strong>
                            đã ký duyệt vệ sinh toàn diện và bổ sung đầy đủ nước suối, trà thảo mộc.
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-surface-container-lowest font-medium text-tertiary">Ga trải giường mới</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-surface-container-lowest font-medium text-tertiary">Khăn tắm chuẩn 5*</span>
                          </div>
                        </div>
                      </div>
                      {/* Event 2: Checkout Yesterday */}
                      <div className="p-3.5 rounded-xl bg-surface-container-low flex items-start gap-3 transition-colors hover:bg-surface-container">
                        <div className="w-8 h-8 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[18px]">logout</span>
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-on-surface">Khách trả phòng & bàn giao</span>
                            <span className="text-[10px] text-on-surface-variant font-mono">08:00 hôm qua</span>
                          </div>
                          <p className="text-xs text-on-surface-variant">Khách check-out bàn giao phòng nguyên vẹn, không phát sinh chi phí thiết bị hư hỏng.</p>
                          <span className="text-[10px] text-on-surface-variant font-medium">Bởi Lễ tân: Phạm Quốc Bảo</span>
                        </div>
                      </div>
                      {/* Event 3: Air Conditioner Inspection */}
                      <div className="p-3.5 rounded-xl bg-surface-container-low flex items-start gap-3 transition-colors hover:bg-surface-container">
                        <div className="w-8 h-8 rounded-lg bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[18px]">build</span>
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-on-surface">Kiểm tra dàn lạnh Daikin & rèm</span>
                            <span className="text-[10px] text-on-surface-variant font-mono">18/10</span>
                          </div>
                          <p className="text-xs text-on-surface-variant">Kỹ thuật viên Nguyễn Hoàng hoàn thành bảo dưỡng lưới lọc định kỳ tháng 10.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Room Key QR Code Generator Card */}
                  <div className="bg-gradient-to-br from-primary-container to-primary text-on-primary rounded-xl p-5 shadow-sm relative overflow-hidden">
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-on-primary-container">Mã Master Key Lễ Tân</span>
                        <h3 className="text-sm font-bold">Kích hoạt thẻ từ P.305</h3>
                        <p className="text-xs text-on-primary-container max-w-[240px]">Chạm thiết bị mã hóa thẻ lễ tân hoặc tạo mã số PIN 6 số dùng 1 lần cho buồng phòng.</p>
                        <div className="pt-2 flex items-center gap-2">
                          <button className="h-8 px-3 rounded-lg bg-surface-container-lowest text-primary text-xs font-bold hover:bg-surface-bright transition-colors" type="button">Tạo mã PIN tức thì</button>
                          <button className="h-8 px-2.5 rounded-lg bg-primary-container/60 hover:bg-primary-container text-xs text-on-primary transition-colors flex items-center gap-1" type="button">
                            <span className="material-symbols-outlined text-[16px]">nfc</span>
                            Ghi thẻ
                          </button>
                        </div>
                      </div>
                      <div className="w-20 h-20 bg-white p-1.5 rounded-lg shrink-0 shadow-md flex items-center justify-center">
                        {/* Crisp SVG QR Code Placeholder */}
                        <svg className="w-full h-full text-primary" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h3v2h-3v-2zm-3 2h2v2h-2v-2zm3 3h3v2h-3v-2zm-2 0h-2v2h2v-2zm-1-3h2v2h-2v-2zm4-4h2v3h-2v-3zm-5 7h1v2h-1v-2zm3-7h2v1h-2v-1z"></path>
                        </svg>
                      </div>
                    </div>
                    {/* Subtle decorative graphic overlay */}
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none"></div>
                  </div>
                </div>
              </div>
              {/* Sticky / Pinned Editorial Action Footer */}
              <div className="sticky bottom-4 z-30 bg-surface-container-lowest/95 backdrop-blur-md rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[20px]">info</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-on-surface">Cập nhật sẽ áp dụng trực tiếp lên sơ đồ kho phòng tức thì</span>
                    <span className="text-[11px] text-on-surface-variant">Hệ thống sẽ đồng bộ lịch sang các kênh OTA liên kết (Booking.com, Agoda) trong 30 giây</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  {/* Maintenance Switch Action */}
                  <button className="h-11 px-4 text-xs font-semibold rounded-lg bg-surface-container-low text-error hover:bg-error-container hover:text-on-error-container transition-colors flex items-center gap-1.5 cursor-pointer" type="button">
                    <span className="material-symbols-outlined text-[18px]">build_circle</span>
                    <span>Đổi sang bảo trì phòng</span>
                  </button>
                  {/* Cancel Action */}
                  <button className="h-11 px-5 text-xs font-semibold rounded-lg bg-surface text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer" type="button">Hủy</button>
                  {/* Primary Save Action */}
                  <button className="h-11 px-6 text-xs font-bold rounded-lg bg-primary-container text-on-primary hover:bg-primary shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer" id="save-room-btn" type="button">
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    <span>Lưu thông tin phòng vật lý</span>
                  </button>
                </div>
              </div>
            </div>
            {/* Interactive Client-side Scripting for Form & Visual Feedback */}
          </div>
        </main>
      </div>
    </div>
  );
}
