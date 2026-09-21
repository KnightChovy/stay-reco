/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Legacy DOM-driven screen; migrate interactions to React state separately.
import React from 'react';

export default function PartnerRoomTypes() {
  React.useEffect(() => {
    try {
      (function () {
      try {
        const navLinks = document.querySelectorAll('aside nav a[data-path]');
        navLinks.forEach((link) => {
          if (link.getAttribute('data-path') === 'kho-phong') {
            link.className =
              'flex items-center gap-3 px-3 py-2 text-sm rounded-lg bg-primary-container text-on-primary font-medium shadow-sm transition-colors';
          }
        });
      } catch (e) {
        console.error(e);
      }
    })();
    } catch (err) {
      console.error('Error executing interaction script:', err);
    }

    try {
      (() => {
      const nameInput = document.getElementById('input-room-name');
      const descInput = document.getElementById('input-room-desc');
      const areaInput = document.getElementById('input-room-area');
      const priceInput = document.getElementById('input-base-price');

      const previewTitle = document.getElementById('preview-title');
      const previewDesc = document.getElementById('preview-desc');
      const previewArea = document.getElementById('preview-area');
      const previewPrice = document.getElementById('preview-price');

      if (nameInput && previewTitle) {
        nameInput.addEventListener('input', (e) => {
          previewTitle.textContent = e.target.value.trim() || 'Tên loại phòng chưa nhập';
        });
      }

      if (descInput && previewDesc) {
        descInput.addEventListener('input', (e) => {
          previewDesc.textContent = e.target.value.trim() || 'Chưa có mô tả chi tiết.';
        });
      }

      if (areaInput && previewArea) {
        areaInput.addEventListener('input', (e) => {
          previewArea.textContent = (e.target.value || '0') + ' m²';
        });
      }

      if (priceInput && previewPrice) {
        priceInput.addEventListener('input', (e) => {
          previewPrice.textContent = (e.target.value || '0') + ' ₫';
        });
      }

      const saveBtn = document.getElementById('btn-save-room');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          const originalText = saveBtn.innerHTML;
          saveBtn.innerHTML =
            '<span class="material-symbols-outlined text-[18px] animate-spin">refresh</span> Đang lưu dữ liệu...';
          saveBtn.classList.add('opacity-80', 'pointer-events-none');
          setTimeout(() => {
            saveBtn.innerHTML =
              '<span class="material-symbols-outlined text-[18px]">check</span> Đã lưu thành công';
            saveBtn.classList.remove('bg-primary-container');
            saveBtn.classList.add('bg-tertiary');
            setTimeout(() => {
              saveBtn.innerHTML = originalText;
              saveBtn.classList.remove('opacity-80', 'pointer-events-none', 'bg-tertiary');
              saveBtn.classList.add('bg-primary-container');
            }, 2000);
          }, 900);
        });
      }
    });
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
            {/* Script for sidebar active state alignment */}
            {/* Editorial Top Workspace Strip */}
            <div className="px-8 pt-8 pb-6 bg-surface">
              {/* Breadcrumbs */}
              <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-4">
                <span className="hover:text-primary transition-colors cursor-pointer">Quản lý kinh doanh</span>
                <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
                <span className="hover:text-primary transition-colors cursor-pointer">Kho phòng</span>
                <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
                <span className="hover:text-primary transition-colors cursor-pointer">Chỉnh sửa loại phòng</span>
                <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
                <span className="text-primary font-semibold">Deluxe River View</span>
              </nav>
              {/* Header & Metadata Meta Bar */}
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold font-headline text-primary tracking-tight">Chỉnh sửa Loại phòng thương mại: Deluxe River View</h1>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-tertiary-fixed text-on-tertiary-fixed">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                      Đang mở bán
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-on-surface-variant pt-1 font-mono">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-secondary">qr_code_2</span>
                      SKU:
                      <span className="font-semibold text-on-surface tracking-wider">DELUXE-RV-DANANG</span>
                    </span>
                    <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-primary-container">door_front</span>
                      Liên kết:
                      <span className="font-semibold text-primary">16 phòng vật lý</span>
                      thực tế
                    </span>
                    <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">update</span>
                      Lần sửa cuối: 10:42 hôm nay bởi Trần Nam
                    </span>
                  </div>
                </div>
                {/* Quick Actions Header */}
                <div className="flex items-center gap-2.5">
                  <button className="h-10 px-4 rounded-lg bg-surface-container-lowest text-on-surface text-xs font-semibold shadow-sm hover:bg-surface-container transition-all flex items-center gap-2" type="button">
                    <span className="material-symbols-outlined text-[18px]">history</span>
                    Lịch sử cập nhật
                  </button>
                  <button className="h-10 px-4 rounded-lg bg-secondary-fixed text-on-secondary-fixed font-semibold text-xs shadow-sm hover:bg-secondary-fixed-dim transition-all flex items-center gap-2" type="button">
                    <span className="material-symbols-outlined text-[18px]">sync_alt</span>
                    Đồng bộ Channel Manager
                  </button>
                </div>
              </div>
            </div>
            {/* Main Body: Asymmetrical Two-Column Bento Layout */}
            <div className="px-8 pb-32 grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              {/* Left Column: Primary Config Form (7 Cols) */}
              <div className="xl:col-span-7 space-y-6">
                {/* Section 1: Thông tin cơ bản */}
                <section className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_4px_20px_rgba(1,55,88,0.04)] space-y-5">
                  <div className="flex items-center justify-between pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-surface-container-low text-primary flex items-center justify-center font-bold text-xs">01</span>
                      <h2 className="text-base font-bold text-primary font-headline">Thông tin định danh & Không gian</h2>
                    </div>
                    <span className="text-[11px] font-semibold text-tertiary uppercase tracking-wider bg-tertiary-fixed/60 px-2.5 py-1 rounded-md">Bắt buộc</span>
                  </div>
                  <div className="space-y-4 text-xs">
                    {/* Room Name */}
                    <div>
                      <label className="block font-semibold text-on-surface mb-1.5">Tên loại phòng thương mại (Hiển thị cho khách)</label>
                      <div className="relative">
                        <input className="w-full h-11 px-3.5 bg-surface-container-low rounded-lg text-on-surface text-sm font-medium focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition-all" id="input-room-name" type="text" defaultValue="Phòng Deluxe River View" />
                        <span className="absolute right-3 top-3 text-[11px] text-outline">24/60 ký tự</span>
                      </div>
                      <p className="mt-1 text-[11px] text-on-surface-variant">Tên hiển thị tự động trên phiếu xác nhận OTA và cổng đặt trực tiếp.</p>
                    </div>
                    {/* Description */}
                    <div>
                      <label className="block font-semibold text-on-surface mb-1.5">Mô tả thương mại gợi cảm xúc</label>
                      <textarea className="w-full p-3 bg-surface-container-low rounded-lg text-on-surface text-xs leading-relaxed focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition-all resize-none" id="input-room-desc" rows="3" defaultValue="Không gian nghỉ dưỡng thiết kế mở ôm trọn bờ sông Hàn Đà Nẵng, ban công lộng gió đón ánh bình minh." />
                      <div className="flex justify-between items-center mt-1 text-[11px] text-on-surface-variant">
                        <span>Được dịch sang 4 ngôn ngữ tự động qua AI Thương hiệu.</span>
                        <span>105/300 ký tự</span>
                      </div>
                    </div>
                    {/* Grid: Area, Bed, View */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                      <div>
                        <label className="block font-semibold text-on-surface mb-1.5">Diện tích phòng</label>
                        <div className="relative flex items-center">
                          <input className="w-full h-11 pl-3.5 pr-12 bg-surface-container-low rounded-lg text-sm font-semibold text-primary focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition-all" id="input-room-area" type="number" defaultValue="28" />
                          <span className="absolute right-3.5 text-xs font-medium text-on-surface-variant">m²</span>
                        </div>
                      </div>
                      <div>
                        <label className="block font-semibold text-on-surface mb-1.5">Cấu hình giường ngủ</label>
                        <div className="relative">
                          <select className="w-full h-11 px-3 bg-surface-container-low rounded-lg text-xs font-medium text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container appearance-none cursor-pointer" id="select-bed">
                            <option selected="">1 Giường King (2m x 2m)</option>
                            <option>2 Giường Đơn (Twin Bed)</option>
                            <option>1 Giường Queen (1m8 x 2m)</option>
                            <option>1 King + 1 Giường phụ sofa</option>
                          </select>
                          <span className="material-symbols-outlined text-outline pointer-events-none absolute right-2.5 top-3 text-[18px]">expand_more</span>
                        </div>
                      </div>
                      <div>
                        <label className="block font-semibold text-on-surface mb-1.5">Hướng nhìn chính (View)</label>
                        <div className="relative">
                          <select className="w-full h-11 px-3 bg-surface-container-low rounded-lg text-xs font-medium text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container appearance-none cursor-pointer" id="select-view">
                            <option selected="">Sông Hàn & Cầu Rồng</option>
                            <option>Biển Mỹ Khê (Trực diện)</option>
                            <option>Thành phố lung linh ban đêm</option>
                            <option>Sân vườn nội khu tĩnh mịch</option>
                          </select>
                          <span className="material-symbols-outlined text-outline pointer-events-none absolute right-2.5 top-3 text-[18px]">expand_more</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
                {/* Section 2: Sức chứa tiêu chuẩn & Trẻ em */}
                <section className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_4px_20px_rgba(1,55,88,0.04)] space-y-5">
                  <div className="flex items-center justify-between pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-surface-container-low text-primary flex items-center justify-center font-bold text-xs">02</span>
                      <h2 className="text-base font-bold text-primary font-headline">Sức chứa & Chính sách trẻ nhỏ</h2>
                    </div>
                    <span className="text-xs text-secondary font-medium">Chính sách thân thiện gia đình</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Standard Adults */}
                    <div className="p-4 bg-surface-container-low/60 rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-bold text-on-surface text-sm">Người lớn tiêu chuẩn</span>
                        <p className="text-[11px] text-on-surface-variant">Số lượng tối ưu cho loại giường</p>
                      </div>
                      <div className="flex items-center gap-2 bg-surface-container-lowest px-2 py-1 rounded-lg shadow-sm">
                        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-container text-primary font-bold transition-colors" type="button">-</button>
                        <span className="w-6 text-center font-bold text-primary text-sm" id="std-adults">2</span>
                        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-container text-primary font-bold transition-colors" type="button">+</button>
                      </div>
                    </div>
                    {/* Max Adults */}
                    <div className="p-4 bg-surface-container-low/60 rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-bold text-on-surface text-sm">Tối đa người lớn</span>
                        <p className="text-[11px] text-on-surface-variant">Giới hạn nghiêm ngặt theo PCCC</p>
                      </div>
                      <div className="flex items-center gap-2 bg-surface-container-lowest px-2 py-1 rounded-lg shadow-sm">
                        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-container text-primary font-bold transition-colors" type="button">-</button>
                        <span className="w-6 text-center font-bold text-primary text-sm">2</span>
                        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-container text-primary font-bold transition-colors" type="button">+</button>
                      </div>
                    </div>
                    {/* Free Child */}
                    <div className="p-4 bg-surface-container-low/60 rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-bold text-on-surface text-sm">Trẻ em đi kèm miễn phí</span>
                        <p className="text-[11px] text-on-surface-variant">Áp dụng trẻ dưới 6 tuổi, chung giường</p>
                      </div>
                      <div className="flex items-center gap-2 bg-surface-container-lowest px-2 py-1 rounded-lg shadow-sm">
                        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-container text-primary font-bold transition-colors" type="button">-</button>
                        <span className="w-6 text-center font-bold text-tertiary text-sm" id="free-child">1</span>
                        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-container text-primary font-bold transition-colors" type="button">+</button>
                      </div>
                    </div>
                    {/* Crib & Extra Bed */}
                    <div className="p-4 bg-surface-container-low/60 rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-on-surface text-sm">Nôi trẻ sơ sinh & Giường phụ</span>
                          <span className="w-2 h-2 rounded-full bg-secondary"></span>
                        </div>
                        <p className="text-[11px] text-secondary font-medium">+400.000 ₫/đêm (phụ thu theo yêu cầu)</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input defaultChecked={true} className="sr-only peer" type="checkbox" />
                        <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-surface-container-lowest after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:border-surface-dim after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
                      </label>
                    </div>
                  </div>
                </section>
                {/* Section 3: Bộ sưu tập hình ảnh thực tế */}
                <section className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_4px_20px_rgba(1,55,88,0.04)] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-surface-container-low text-primary flex items-center justify-center font-bold text-xs">03</span>
                      <div>
                        <h2 className="text-base font-bold text-primary font-headline leading-tight">Bộ sưu tập hình ảnh thực tế</h2>
                        <p className="text-[11px] text-on-surface-variant">Kéo thả để sắp xếp ảnh thẻ preview. Ảnh đầu tiên sẽ là ảnh đại diện chính.</p>
                      </div>
                    </div>
                    <button className="h-9 px-3.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-1.5 shadow-sm" type="button">
                      <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
                      Tải thêm ảnh
                    </button>
                  </div>
                  {/* Image Gallery Grid (6 Existing Photos) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                    {/* Photo 1: Main Bedroom (Cover) */}
                    <div className="group relative rounded-xl overflow-hidden shadow-sm aspect-[4/3] bg-surface-container">
                      <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" data-alt="Bright airy hotel bedroom with king bed facing panoramic floor to ceiling glass windows overlooking gentle river waters at sunrise. Clean crisp linen, warm wood panels, natural terracotta ceramic vase accents on the bedside table." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBg66dB4U8GP3jhJu_uUHAhki8r1XXO3WLQ9lYPJ8fGYqGs4g36RJTJOg7cgk-BEbCixkVWzQI_WGXVQ7k9we9RwQrbUHRPkLREqQ3T4JeOsOtg71oxpZfZdhvKpkJlCXfZR1y5XhQ_MZMa7CChBKo3qKrNb9TVhe5gu5cU0lAxK0wpcTj32aBg3xnvJLEKa04kq7NDi0RpGXrt_iejJHqitJ8rsWgAquyMhMFk3Hym4vwTdQ4CoaBJ" />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent opacity-90"></div>
                      <div className="absolute top-2 left-2 bg-secondary text-on-secondary text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">star</span>
                        Ảnh bìa chính
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-on-primary text-[11px] font-medium">
                        <span>Phòng ngủ King & Ban công</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="w-6 h-6 rounded bg-surface-container-lowest/80 text-primary flex items-center justify-center hover:bg-surface-container-lowest">
                            <span className="material-symbols-outlined text-[14px]">edit</span>
                          </button>
                          <button className="w-6 h-6 rounded bg-surface-container-lowest/80 text-error flex items-center justify-center hover:bg-surface-container-lowest">
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Photo 2: Stone Bathtub */}
                    <div className="group relative rounded-xl overflow-hidden shadow-sm aspect-[4/3] bg-surface-container">
                      <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" data-alt="Luxury organic riverfront resort bathroom featuring a standalone artisan grey stone soaking tub surrounded by potted green palms, natural morning sunlight reflecting on polished slate floor." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfXbZ4UcoWmS1DwHxrxl-KChBtOFzgWV5Spt0clLKkXikdYPw1XGnfOHIbPYcGQIU56OdiWb_DfwsU4da0fOn8JTpCFJxdERHQnsvL_4m9tcWO_1MqstMr_w-K-tIe2jlglKNU696NGDk8Ib534PC9EiReGnpVQ16K8LILSgdO2yT_gNKnYU_owoStrBQJRYd4xjUNwazRnXT3UYMYDTlJ5kJEvjtF8zjRRtGil8T_bBmeIKpUeY0C" />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-on-primary text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Bồn tắm đá ngâm thảo mộc</span>
                        <button className="w-6 h-6 rounded bg-surface-container-lowest/80 text-error flex items-center justify-center">
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    </div>
                    {/* Photo 3: Balcony River View */}
                    <div className="group relative rounded-xl overflow-hidden shadow-sm aspect-[4/3] bg-surface-container">
                      <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" data-alt="Private boutique hotel balcony overlooking Han River in Da Nang with modern rattan armchairs, teak side table with two porcelain tea cups, distant Dragon Bridge silhouette under soft blue sky." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCg7arLBMfRfQubR47Ut6cjUM0DjKey5B9_rlEEYx6cKdeLShXoqyKY7_W7gBskKMLHz9jeozlBDoHoaeV7tFO8f5XNUaULg_hY5gMHRt2f_vNYDtVd8cZaFpek4tJgADtheXFb4wSxuOXBt-j4UqnWT-D3B0VPsXRirfYUFdxlobWYttxH-BaT8wlQzP0qeOB76fefVK68A0f120zvpj_PPJ2u6kCYWauaIYeAWgJbJH-7hr06SDX0" />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-on-primary text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Ban công riêng hướng sông</span>
                        <button className="w-6 h-6 rounded bg-surface-container-lowest/80 text-error flex items-center justify-center">
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    </div>
                    {/* Photo 4: Workspace & Coffee */}
                    <div className="group relative rounded-xl overflow-hidden shadow-sm aspect-[4/3] bg-surface-container">
                      <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" data-alt="Minimalist work desk inside hotel room with espresso capsule machine, steaming coffee mug, natural oak desk, Dyson hair dryer kit nicely placed in custom fabric pouch nearby." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBm1i0aLsitoO8IvF3V75Pj8xwN6ZJ9Lf2h416onJGYVahoQQfT100Xcs7Y2Q_JDd6p39hgfOpCIhtMEXTudbapAgeDDqhQlBLxV_W0-Dyi2W_gpTdkkaQpLSRXeOxj642-Cx4uqnoBNS1gkDRT0oerjG7ZNDmWXqwFsjeYtmPW0_n7H6MVIyrIhhvZXqD9z_nauodesN5vFRj2g6fY46psUKKCSBCifr067wg2ymKy1b-hzNAy5sva" />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-on-primary text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Góc cà phê Espresso</span>
                        <button className="w-6 h-6 rounded bg-surface-container-lowest/80 text-error flex items-center justify-center">
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    </div>
                    {/* Photo 5: Sunset Room Tone */}
                    <div className="group relative rounded-xl overflow-hidden shadow-sm aspect-[4/3] bg-surface-container">
                      <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" data-alt="Boutique hotel room at sunset hour with ambient recessed warm LED lighting, cozy armchair reading nook, tranquil river reflecting warm terracotta evening glow." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZRaZVt73M5QmykGHKx1PaunFcst61S_K2wK042ay4eUNeaOrVOaVNNXL0W9OSgUIjNUmwu-9ydfPn5dUO4w3FMCpmJdiWstYVcRwWqxaILnHfZ715B2hstjDDV1h8qzjrGKJiPR3cISMZCLIMJIJvlTrHI63fxqmHp0X_baG2IGa41MhFfETFmIVfMdD6RxOjJByXwbp9X3rt4OBJYepyPMK0zCL9UEJ65GFj0J09oYKB32lURsyf" />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-on-primary text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Góc thư giãn hoàng hôn</span>
                        <button className="w-6 h-6 rounded bg-surface-container-lowest/80 text-error flex items-center justify-center">
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    </div>
                    {/* Photo 6: Vanity & Wardrobe */}
                    <div className="group relative rounded-xl overflow-hidden shadow-sm aspect-[4/3] bg-surface-container">
                      <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" data-alt="Spacious walk in closet and double sink vanity counter in hotel room with eco friendly amenities, clean cotton bathrobes, soft illuminated circular mirrors." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAzSg4HC-1KCoE4kiVblf5eHVOEE6KQfbSBxaWb3pyZEbe9LUNUpD2AM8bUBs_cKD7Iz2Ylq0-v5nw9O4IuZSr6otQMPwgKkUhMwdkU6pulZf6-OrJ0iA4eWhp2LZDPk3lSWlv7mSsr8woAjHAjNWSNLr0Gj8iRBbddOJdpMmK7efq0jlraiw9tMOaIj9fHCZ_nkp9oJzg1r85FZZvduYg6VegQ1zk87JGGrtRWPiiZ6p4sUvW5eMBB" />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-on-primary text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Bàn trang điểm & Áo choàng</span>
                        <button className="w-6 h-6 rounded bg-surface-container-lowest/80 text-error flex items-center justify-center">
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
                {/* Section 4: Giá bán cơ sở & Thuế phí */}
                <section className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_4px_20px_rgba(1,55,88,0.04)] space-y-5">
                  <div className="flex items-center justify-between pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-surface-container-low text-primary flex items-center justify-center font-bold text-xs">04</span>
                      <h2 className="text-base font-bold text-primary font-headline">Giá niêm yết cơ sở & Thuế phí</h2>
                    </div>
                    <span className="text-xs text-primary font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      Quy định minh bạch giá StayReco
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Base Rate Input */}
                    <div className="p-4 bg-surface-container-low/50 rounded-xl space-y-2">
                      <label className="block font-bold text-on-surface">Giá niêm yết cơ sở (Base Rate / đêm)</label>
                      <div className="relative flex items-center">
                        <input className="w-full h-11 pl-4 pr-12 bg-surface-container-lowest rounded-lg text-base font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary-container shadow-sm transition-all" id="input-base-price" type="text" defaultValue="1.250.000" />
                        <span className="absolute right-3.5 text-xs font-semibold text-secondary">₫ / đêm</span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant">Giá chuẩn ngày thường chưa bao gồm quy tắc phụ thu cuối tuần / lễ Tết.</p>
                    </div>
                    {/* Tax Breakdown Card */}
                    <div className="p-4 bg-surface-container-low/50 rounded-xl space-y-2 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-on-surface">Chế độ thuế & phí</span>
                        <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-semibold">Đã cấu hình</span>
                      </div>
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between text-on-surface-variant">
                          <span>Thuế GTGT (VAT 8%):</span>
                          <span className="font-mono text-on-surface font-semibold">100.000 ₫</span>
                        </div>
                        <div className="flex justify-between text-on-surface-variant">
                          <span>Phí dịch vụ khách sạn (5%):</span>
                          <span className="font-mono text-on-surface font-semibold">62.500 ₫</span>
                        </div>
                        <div className="flex justify-between text-primary font-semibold pt-1">
                          <span>Trực tiếp hiển thị tới khách:</span>
                          <span className="font-mono font-bold">Đã bao gồm tất cả</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Breakfast Inclusions */}
                  <div className="p-4 bg-surface-container-low/50 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm">
                        <span className="material-symbols-outlined text-[22px]">restaurant</span>
                      </div>
                      <div>
                        <span className="font-bold text-sm text-on-surface block leading-tight">Bữa sáng mặc định theo gói</span>
                        <span className="text-xs text-on-surface-variant">Bữa sáng buffet hữu cơ hàng ngày (Bao gồm cho 2 người lớn)</span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-fixed text-on-primary-fixed">
                      <span className="material-symbols-outlined text-[15px]">check_circle</span>
                      Miễn phí
                    </span>
                  </div>
                </section>
                {/* Section 5: Tiện nghi độc quyền loại phòng */}
                <section className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_4px_20px_rgba(1,55,88,0.04)] space-y-5">
                  <div className="flex items-center justify-between pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-surface-container-low text-primary flex items-center justify-center font-bold text-xs">05</span>
                      <h2 className="text-base font-bold text-primary font-headline">Tiện nghi độc quyền loại phòng</h2>
                    </div>
                    <span className="text-xs text-on-surface-variant">5 tiện nghi nổi bật đã chọn</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Item 1: Checked */}
                    <label className="p-3.5 rounded-xl bg-surface-container-low/60 flex items-start gap-3 cursor-pointer hover:bg-surface-container-low transition-colors">
                      <input defaultChecked={true} className="mt-0.5 rounded text-primary focus:ring-primary-container w-4 h-4" type="checkbox" />
                      <div className="space-y-0.5">
                        <span className="font-bold text-on-surface block">Kính cách âm 2 lớp chuẩn Châu Âu</span>
                        <span className="text-[11px] text-on-surface-variant">Đảm bảo giấc ngủ hoàn hảo không tiếng còi xe</span>
                      </div>
                    </label>
                    {/* Item 2: Checked */}
                    <label className="p-3.5 rounded-xl bg-surface-container-low/60 flex items-start gap-3 cursor-pointer hover:bg-surface-container-low transition-colors">
                      <input defaultChecked={true} className="mt-0.5 rounded text-primary focus:ring-primary-container w-4 h-4" type="checkbox" />
                      <div className="space-y-0.5">
                        <span className="font-bold text-on-surface block">Bồn tắm đá ngâm thảo mộc</span>
                        <span className="text-[11px] text-on-surface-variant">Kèm muối biển hữu cơ & tinh dầu quế trà</span>
                      </div>
                    </label>
                    {/* Item 3: Checked */}
                    <label className="p-3.5 rounded-xl bg-surface-container-low/60 flex items-start gap-3 cursor-pointer hover:bg-surface-container-low transition-colors">
                      <input defaultChecked={true} className="mt-0.5 rounded text-primary focus:ring-primary-container w-4 h-4" type="checkbox" />
                      <div className="space-y-0.5">
                        <span className="font-bold text-on-surface block">Máy sấy tóc tạo kiểu Dyson</span>
                        <span className="text-[11px] text-on-surface-variant">Trang bị tại bàn phấn phòng ngủ Master</span>
                      </div>
                    </label>
                    {/* Item 4: Checked */}
                    <label className="p-3.5 rounded-xl bg-surface-container-low/60 flex items-start gap-3 cursor-pointer hover:bg-surface-container-low transition-colors">
                      <input defaultChecked={true} className="mt-0.5 rounded text-primary focus:ring-primary-container w-4 h-4" type="checkbox" />
                      <div className="space-y-0.5">
                        <span className="font-bold text-on-surface block">Ban công riêng biệt đón gió sông</span>
                        <span className="text-[11px] text-on-surface-variant">Bàn trà ngoài trời & tầm nhìn trọn bờ sông Hàn</span>
                      </div>
                    </label>
                    {/* Item 5: Checked */}
                    <label className="p-3.5 rounded-xl bg-surface-container-low/60 flex items-start gap-3 cursor-pointer hover:bg-surface-container-low transition-colors">
                      <input defaultChecked={true} className="mt-0.5 rounded text-primary focus:ring-primary-container w-4 h-4" type="checkbox" />
                      <div className="space-y-0.5">
                        <span className="font-bold text-on-surface block">Smart TV 55 inch 4K Ultra HD</span>
                        <span className="text-[11px] text-on-surface-variant">Cài đặt sẵn tài khoản Netflix Premium</span>
                      </div>
                    </label>
                    {/* Item 6: Unchecked */}
                    <label className="p-3.5 rounded-xl bg-surface-container-low/30 flex items-start gap-3 cursor-pointer hover:bg-surface-container-low transition-colors">
                      <input className="mt-0.5 rounded text-primary focus:ring-primary-container w-4 h-4" type="checkbox" />
                      <div className="space-y-0.5">
                        <span className="font-medium text-on-surface block">Hồ bơi vô cực riêng (Private Plunge Pool)</span>
                        <span className="text-[11px] text-on-surface-variant">Chỉ dành riêng cho hạng Signature Villa</span>
                      </div>
                    </label>
                  </div>
                </section>
              </div>
              {/* Right Column: Live Guest Preview Card (5 Cols Sticky) */}
              <div className="xl:col-span-5 sticky top-24 space-y-4">
                {/* Live Preview Badge Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">visibility</span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-primary font-headline">Bản xem trước trực tiếp (Guest Marketplace)</h3>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-tertiary bg-tertiary-fixed px-2 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-ping"></span>
                    Tự động đồng bộ
                  </span>
                </div>
                {/* Marketplace Preview Card: True to G04 / G02 Architecture */}
                <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0_12px_36px_rgba(1,55,88,0.08)] transition-all">
                  {/* Card Image Hero with overlay chips */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-surface-container">
                    <img className="w-full h-full object-cover" data-alt="Editorial photograph of the Deluxe River View hotel room interior in Da Nang, bathed in calm morning light. Polished stone textures, pristine linens, panoramic river vista visible through expansive glazing." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGpGe1k1SLvzp1FC4xWLSkkVkzqz4hzDTJ9clEPvesIY9-JHkxyblEDb_m4Tu9chMecwoS3l0sZvlWPR4ebPfsCKqRTqD6LN4imlUDdQOhwg_QpF8bJ9FYjJXFGuL062RZXtd2eWu33d7BWBSF_jZlVBoFwCrdK5vJOxMYoENiyUG9r6YF-pC_ATm4k6xHZfQ2BFmeOIw3Ft5Z6Xfsh_1gLwntPUFGFKp87-yNnkszfCF-Rw3WLzdp" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>
                    {/* Top tags */}
                    <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-secondary text-on-secondary shadow-sm">Bán chạy nhất</span>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-surface-container-lowest/90 text-primary backdrop-blur-md shadow-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-tertiary">water</span>
                        Hướng sông Hàn
                      </span>
                    </div>
                    {/* Photo gallery badge */}
                    <div className="absolute bottom-3.5 right-3.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg text-on-primary text-[11px] font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">photo_library</span>
                      6 bức ảnh
                    </div>
                    {/* Rating badge preview */}
                    <div className="absolute bottom-3.5 left-3.5 bg-surface-container-lowest/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-primary text-xs font-bold flex items-center gap-1.5 shadow-sm">
                      <span className="material-symbols-outlined text-[15px] text-amber-500 fill-current">star</span>
                      <span>4.9</span>
                      <span className="text-[10px] text-on-surface-variant font-normal">(128 đánh giá)</span>
                    </div>
                  </div>
                  {/* Card Content Body */}
                  <div className="p-5 space-y-4">
                    {/* Room Title & Specs */}
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-lg font-bold text-on-surface font-headline leading-snug" id="preview-title">Phòng Deluxe River View</h4>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1 line-clamp-2 leading-relaxed" id="preview-desc">Không gian nghỉ dưỡng thiết kế mở ôm trọn bờ sông Hàn Đà Nẵng, ban công lộng gió đón ánh bình minh.</p>
                    </div>
                    {/* Room Metadata Metrics Chips */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-medium text-on-surface-variant">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-low rounded-md">
                        <span className="material-symbols-outlined text-[14px] text-primary">square_foot</span>
                        <span id="preview-area">28 m²</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-low rounded-md">
                        <span className="material-symbols-outlined text-[14px] text-primary">king_bed</span>
                        <span id="preview-bed">1 Giường King</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-low rounded-md">
                        <span className="material-symbols-outlined text-[14px] text-primary">person</span>
                        <span>2 người lớn + 1 bé</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-low rounded-md">
                        <span className="material-symbols-outlined text-[14px] text-primary">balcony</span>
                        <span>Ban công sông</span>
                      </span>
                    </div>
                    {/* Personalized Recommendation Reasoning Pills (StayReco Signature) */}
                    <div className="p-3 bg-surface-container-low/70 rounded-xl space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                        Lý do phù hợp với du khách
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-primary-fixed text-on-primary-fixed">Hợp gu yên tĩnh & ngắm cảnh</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-surface-container-lowest text-primary shadow-2xs">Kính cách âm cao cấp</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-surface-container-lowest text-tertiary shadow-2xs">Bữa sáng buffet bao gồm</span>
                      </div>
                    </div>
                    {/* Pricing & Direct CTA Section */}
                    <div className="pt-2 flex items-end justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-outline uppercase font-semibold tracking-wider block">Giá đã bao gồm thuế & phí</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold font-headline text-primary" id="preview-price">1.250.000 ₫</span>
                          <span className="text-xs text-on-surface-variant font-medium">/ đêm</span>
                        </div>
                      </div>
                      <button className="h-10 px-4 rounded-lg bg-primary-container text-on-primary text-xs font-semibold hover:bg-primary transition-colors flex items-center gap-1.5 shadow-sm" type="button">
                        <span>Xem phòng</span>
                        <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
                {/* Quick Inventory Allocation Insight Box */}
                <div className="p-4 rounded-xl bg-surface-container-low/80 space-y-2 text-xs text-on-surface-variant">
                  <div className="flex items-center justify-between font-semibold text-primary">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[17px] text-secondary">domain_verification</span>
                      Phân bổ phòng vật lý thực tế
                    </span>
                    <span className="font-mono text-xs">16 / 16 phòng</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-primary-container h-full rounded-full" style={{"width":"100%"}}></div>
                  </div>
                  <p className="text-[11px]">Đang được gắn với các số phòng: 301-308, 401-408 tại Tòa Sông Hàn. Đảm bảo toàn bộ phòng được dọn sẵn.</p>
                </div>
              </div>
            </div>
            {/* Bottom Floating Action Bar */}
            <div className="fixed bottom-0 left-64 right-0 h-20 bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(1,55,88,0.06)] px-8 flex items-center justify-between z-30">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary"></span>
                <span className="text-xs font-semibold text-on-surface">Tất cả thay đổi nội dung tự động tạo bản sao lưu tạm.</span>
              </div>
              <div className="flex items-center gap-3">
                <button className="h-11 px-5 rounded-lg bg-surface-container-low text-on-surface text-xs font-semibold hover:bg-surface-container transition-all" type="button">Hủy thay đổi</button>
                <button className="h-11 px-5 rounded-lg bg-surface-container-lowest text-primary text-xs font-semibold shadow-sm hover:bg-surface-container-low transition-all flex items-center gap-1.5" type="button">
                  <span className="material-symbols-outlined text-[17px]">open_in_new</span>
                  Xem trước hiển thị
                </button>
                <button className="h-11 px-7 rounded-lg bg-primary-container text-on-primary text-xs font-bold hover:bg-primary shadow-md hover:shadow-lg transition-all flex items-center gap-2" id="btn-save-room" type="button">
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  Lưu thông tin loại phòng
                </button>
              </div>
            </div>
            {/* Inline Micro-Interactions Script for Realtime Card Preview Update */}
          </div>
        </main>
      </div>
    </div>
  );
}
