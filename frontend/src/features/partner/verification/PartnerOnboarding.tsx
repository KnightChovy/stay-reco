/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Legacy JSX display screen pending component-level migration.
import React from 'react';

export default function PartnerOnboarding() {
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
              <a aria-current="page" className="flex items-center gap-3 px-3 py-2 transition-colors bg-primary-container text-on-primary font-medium rounded-lg shadow-sm" data-path="ho-so-va-xac-minh" href="#">
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
            {/* Subtle Ambient Glow Background Decorative Layer */}
            <div className="relative w-full max-w-7xl mx-auto px-6 lg:px-10 py-8 overflow-hidden">
              {/* Fluid Decorative Blobs contained inside */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute top-1/2 -left-20 w-80 h-80 bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>
              {/* Breadcrumbs */}
              <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-4 font-label">
                <a className="hover:text-primary transition-colors" href="#">Trang chủ</a>
                <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
                <a className="hover:text-primary transition-colors" href="#">Đối tác</a>
                <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
                <span className="font-medium text-primary">Đăng ký hồ sơ cơ sở lưu trú</span>
              </nav>
              {/* Header Section */}
              <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1.5 max-w-3xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-semibold tracking-wide">
                    <span className="material-symbols-outlined text-[15px]" style={{"fontVariationSettings":"'FILL' 1"}}>shield_with_house</span>
                    Xác thực Đối tác Lưu trú Cao cấp
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold font-headline text-primary tracking-tight">Đăng ký Đối tác Khách sạn & Cơ sở lưu trú StayReco</h1>
                  <p className="text-sm text-on-surface-variant leading-relaxed">Tham gia mạng lưới khách sạn boutique & nghỉ dưỡng bản địa được xác thực tại Việt Nam. Quy trình duyệt nhanh trong 24 giờ làm việc.</p>
                </div>
                {/* Quick Status Badge & Help */}
                <div className="flex items-center gap-3 self-start md:self-auto bg-surface-container-lowest px-4 py-2.5 rounded-xl shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed font-bold text-xs">67%</div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-on-surface-variant uppercase font-medium">Tiến độ hồ sơ</span>
                    <span className="text-xs font-semibold text-primary">Đã hoàn thành 2/3 bước</span>
                  </div>
                </div>
              </div>
              {/* 3-Step Wizard Navigation Tracker */}
              <div className="bg-surface-container-lowest rounded-2xl p-5 mb-8 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                  {/* Step 1 (Completed) */}
                  <div className="flex items-center gap-3.5 p-3 rounded-xl bg-surface-container-low transition-all">
                    <div className="w-9 h-9 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[20px]" style={{"fontVariationSettings":"'FILL' 1"}}>check</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-tertiary uppercase tracking-wider block">Bước 1 • Hoàn thành</span>
                      <p className="text-sm font-semibold text-on-surface truncate">Thông tin doanh nghiệp & Cơ sở</p>
                    </div>
                  </div>
                  {/* Step 2 (Active/In Progress) */}
                  <div className="flex items-center gap-3.5 p-3 rounded-xl bg-primary-container/10 transition-all relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary-container"></div>
                    <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="font-bold text-sm font-headline">2</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block">Bước 2 • Đang thực hiện</span>
                      <p className="text-sm font-bold text-primary truncate">Giấy phép kinh doanh & Thẩm định</p>
                    </div>
                  </div>
                  {/* Step 3 (Pending) */}
                  <div className="flex items-center gap-3.5 p-3 rounded-xl bg-surface-container-lowest opacity-60">
                    <div className="w-9 h-9 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center flex-shrink-0">
                      <span className="font-medium text-sm font-headline">3</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">Bước 3 • Chờ gửi</span>
                      <p className="text-sm font-medium text-on-surface-variant truncate">Kiểm tra & Gửi hồ sơ</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Main Content Layout (Split 2-column: Form 8 cols, Sidebar 4 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Primary Form Column */}
                <div className="lg:col-span-8 space-y-8">
                  {/* Card 1: Enterprise Legal Identity */}
                  <div className="bg-surface-container-lowest rounded-2xl p-6 lg:p-8 shadow-sm">
                    <div className="flex items-center justify-between pb-5 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                          <span className="material-symbols-outlined text-[24px]">business_center</span>
                        </div>
                        <div>
                          <h2 className="text-base lg:text-lg font-bold text-primary font-headline">1. Thông tin doanh nghiệp & Pháp nhân</h2>
                          <p className="text-xs text-on-surface-variant">Dữ liệu pháp lý đối chiếu hợp đồng ký kết đối tác điện tử</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-tertiary-fixed text-on-tertiary-fixed">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                        Đã xác thực ĐKKD
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Company Name */}
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-xs font-semibold text-on-surface flex items-center gap-1">
                          Tên công ty / Hộ kinh doanh đăng ký
                          <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                          <input className="w-full h-11 px-4 text-sm font-medium bg-surface-container-low text-on-surface rounded-xl focus:outline-none cursor-default" readOnly type="text" defaultValue="Công ty TNHH Khách sạn An Nhiên Đà Nẵng" />
                          <span className="material-symbols-outlined absolute right-3.5 top-2.5 text-tertiary text-[20px]" style={{"fontVariationSettings":"'FILL' 1"}}>verified</span>
                        </div>
                      </div>
                      {/* Tax Code / Business License */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-on-surface flex items-center gap-1">
                          Mã số thuế / Số ĐKKD
                          <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                          <input className="w-full h-11 px-4 text-sm font-medium font-mono bg-surface-container-low text-on-surface rounded-xl focus:outline-none cursor-default" readOnly type="text" defaultValue="0401988234" />
                          <span className="material-symbols-outlined absolute right-3.5 top-2.5 text-tertiary text-[20px]" style={{"fontVariationSettings":"'FILL' 1"}}>check_circle</span>
                        </div>
                      </div>
                      {/* Representative Name */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-on-surface flex items-center gap-1">
                          Người đại diện pháp luật
                          <span className="text-error">*</span>
                        </label>
                        <input className="w-full h-11 px-4 text-sm font-medium bg-surface-container-low text-on-surface rounded-xl focus:outline-none cursor-default" readOnly type="text" defaultValue="Trần Nam (Giám đốc)" />
                      </div>
                      {/* Legal ID Card */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-on-surface flex items-center gap-1">
                          Số CCCD / Hộ chiếu đại diện
                          <span className="text-error">*</span>
                        </label>
                        <input className="w-full h-11 px-4 text-sm font-medium bg-surface-container-low text-on-surface rounded-xl focus:outline-none cursor-default" readOnly type="text" defaultValue="048091002341 (Cấp ngày 12/04/2021)" />
                      </div>
                      {/* Hotline Phone */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-on-surface flex items-center gap-1">
                          Số điện thoại liên hệ chính thức
                          <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                          <input className="w-full h-11 px-4 text-sm font-medium bg-surface-container-low text-on-surface rounded-xl focus:outline-none cursor-default" readOnly type="tel" defaultValue="0236 3888 999" />
                          <span className="material-symbols-outlined absolute right-3.5 top-2.5 text-on-surface-variant text-[20px]">call</span>
                        </div>
                      </div>
                      {/* Email */}
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-xs font-semibold text-on-surface flex items-center gap-1">
                          Hộp thư điện tử nhận thông báo kinh doanh & Đặt phòng
                          <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                          <input className="w-full h-11 px-4 text-sm font-medium bg-surface-container-low text-on-surface rounded-xl focus:outline-none cursor-default" readOnly type="email" defaultValue="contact@annhienriverside.vn" />
                          <span className="material-symbols-outlined absolute right-3.5 top-2.5 text-on-surface-variant text-[20px]">mail</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Card 2: Property Profile & Location Context */}
                  <div className="bg-surface-container-lowest rounded-2xl p-6 lg:p-8 shadow-sm">
                    <div className="flex items-center justify-between pb-5 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                          <span className="material-symbols-outlined text-[24px]">apartment</span>
                        </div>
                        <div>
                          <h2 className="text-base lg:text-lg font-bold text-primary font-headline">2. Thông tin cơ sở lưu trú đăng ký</h2>
                          <p className="text-xs text-on-surface-variant">Chi tiết vị trí, quy mô và phân khúc định vị trên StayReco</p>
                        </div>
                      </div>
                      <button className="text-xs font-semibold text-primary hover:text-on-primary-fixed-variant flex items-center gap-1 transition-colors" type="button">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                        Chỉnh sửa
                      </button>
                    </div>
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="md:col-span-2 space-y-1.5">
                          <label className="text-xs font-semibold text-on-surface">Tên cơ sở niêm yết thương hiệu</label>
                          <input className="w-full h-11 px-4 text-sm font-semibold bg-surface-container-low text-primary rounded-xl focus:outline-none" readOnly type="text" defaultValue="An Nhiên Riverside Hotel" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-on-surface">Mô hình & Quy mô</label>
                          <div className="h-11 px-4 flex items-center justify-between bg-surface-container-low rounded-xl text-sm font-medium text-on-surface">
                            <span>Khách sạn Boutique</span>
                            <span className="text-xs px-2 py-0.5 rounded-md bg-surface-container-highest text-secondary font-bold">36 phòng</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-on-surface">Địa chỉ cụ thể trên giấy phép</label>
                        <input className="w-full h-11 px-4 text-sm font-medium bg-surface-container-low text-on-surface rounded-xl focus:outline-none" readOnly type="text" defaultValue="128 Đường Bạch Đằng, Phường Hải Châu 1, Quận Hải Châu, TP. Đà Nẵng" />
                      </div>
                      {/* Visual Geographic Card / Static Map Representation */}
                      <div className="rounded-xl p-4 bg-surface-container-low flex flex-col md:flex-row items-center gap-4">
                        <div className="w-full md:w-48 h-32 bg-surface-container-highest rounded-xl flex-shrink-0 bg-cover bg-center relative overflow-hidden shadow-inner" data-location="128 Bach Dang Street, Da Nang, Vietnam" style={{"backgroundImage":"url('https://lh3.googleusercontent.com/aida-public/AB6AXuCZ0dYXbycfblgsiIDLE1XRZCj2FlMjlGwm0yM6inCgd-soNn1IBsdcDxuGZbyt1HhXB8T5Bg0rZrWiM22pGqhZuGju-qaI0MQtUTI12fHB2PSZHRXCUJpB_RkbhTj6fK6IOP2OdI-UNW2gPdOpTuQmElewF99zPK2dxkl4oShwgZV7KR7G1gTOPYnJdaAQ_iiCUUljkDOLU5zGEkQZhME0mxh4iSsCN_TO2uwUS7ybVdvmOvVTKXv4')"}}>
                          <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent"></div>
                          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-surface-container-lowest/90 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-semibold text-primary">
                            <span className="material-symbols-outlined text-[13px] text-secondary">pin_drop</span>
                            Hải Châu, Đà Nẵng
                          </div>
                        </div>
                        <div className="space-y-2 flex-grow">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary text-[20px]">near_me</span>
                            <span className="text-xs font-bold text-on-surface uppercase tracking-wide">Điểm định vị đặc trưng</span>
                          </div>
                          <p className="text-sm font-semibold text-primary">Cách Cầu Rồng 350m, nhìn trực diện sông Hàn</p>
                          <p className="text-xs text-on-surface-variant leading-relaxed">Cơ sở nằm trong trục phố đi bộ Bạch Đằng, thuận tiện tản bộ và thưởng thức ẩm thực địa phương. Đã được định vị tự động qua hệ thống trắc địa GIS StayReco.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Card 3: Legal Verification Documents Upload */}
                  <div className="bg-surface-container-lowest rounded-2xl p-6 lg:p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center">
                          <span className="material-symbols-outlined text-[24px]">verified_user</span>
                        </div>
                        <div>
                          <h2 className="text-base lg:text-lg font-bold text-primary font-headline">3. Hồ sơ pháp lý & Thẩm định an toàn</h2>
                          <p className="text-xs text-on-surface-variant">Tải lên các văn bằng chứng nhận bắt buộc theo quy định Luật Du lịch Việt Nam</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-secondary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">info</span>
                        Hỗ trợ định dạng PDF, JPG, PNG (&lt; 10MB)
                      </span>
                    </div>
                    {/* Document 1: Business Registration */}
                    <div className="p-4 rounded-xl bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-surface-container">
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-error flex-shrink-0 shadow-xs">
                          <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-on-surface">Giấy chứng nhận đăng ký doanh nghiệp</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-tertiary-fixed text-on-tertiary-fixed">Hợp lệ</span>
                          </div>
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            Tệp:
                            <span className="font-mono text-primary font-medium">gpkd_annhien_riverside_signed.pdf</span>
                            • Dung lượng: 2.4 MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end md:self-auto">
                        <button className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-xs font-semibold text-primary hover:bg-primary/10 transition-colors flex items-center gap-1.5 shadow-xs" type="button">
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                          Xem trước
                        </button>
                        <button className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-xs font-semibold text-on-surface-variant hover:text-error hover:bg-error-container transition-colors flex items-center gap-1.5 shadow-xs" type="button">
                          <span className="material-symbols-outlined text-[16px]">autorenew</span>
                          Thay thế
                        </button>
                      </div>
                    </div>
                    {/* Document 2: Fire Safety & Police Clearance */}
                    <div className="p-4 rounded-xl bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-surface-container">
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-error flex-shrink-0 shadow-xs">
                          <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-on-surface">Giấy chứng nhận đủ điều kiện ANTT & PCCC</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-tertiary-fixed text-on-tertiary-fixed">Đã kiểm tra</span>
                          </div>
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            Tệp:
                            <span className="font-mono text-primary font-medium">pccc_verified_2025.pdf</span>
                            • Dung lượng: 4.1 MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end md:self-auto">
                        <button className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-xs font-semibold text-primary hover:bg-primary/10 transition-colors flex items-center gap-1.5 shadow-xs" type="button">
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                          Xem trước
                        </button>
                        <button className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-xs font-semibold text-on-surface-variant hover:text-error hover:bg-error-container transition-colors flex items-center gap-1.5 shadow-xs" type="button">
                          <span className="material-symbols-outlined text-[16px]">autorenew</span>
                          Thay thế
                        </button>
                      </div>
                    </div>
                    {/* Document 3: Star Rating / Self-Declaration */}
                    <div className="p-5 rounded-xl bg-surface-container-low/60 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                        <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
                      </div>
                      <h3 className="text-sm font-bold text-on-surface">Giấy chứng nhận tiêu chuẩn xếp hạng hoặc tự công bố cơ sở lưu trú</h3>
                      <p className="text-xs text-on-surface-variant max-w-md mt-1 mb-4">Nếu khách sạn chưa thẩm định sao, vui lòng tải lên bản tự công bố điều kiện kinh doanh lưu trú theo mẫu số 01/NĐ-CP.</p>
                      <div className="flex items-center gap-3">
                        <label className="cursor-pointer px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-xs">
                          <span className="material-symbols-outlined text-[18px]">add_circle</span>
                          Tải tệp tin lên
                          <input className="hidden" type="file" />
                        </label>
                        <button className="px-4 py-2 bg-surface-container-lowest text-on-surface text-xs font-semibold rounded-xl hover:bg-surface-container transition-colors" type="button">Tải mẫu tự công bố</button>
                      </div>
                    </div>
                    {/* Verification Terms Checkbox */}
                    <div className="p-4 rounded-xl bg-secondary-fixed/30 flex items-start gap-3">
                      <input defaultChecked={true} className="mt-0.5 rounded text-primary focus:ring-0 cursor-pointer w-4 h-4" id="confirm_term" type="checkbox" />
                      <label className="text-xs text-on-secondary-container leading-relaxed cursor-pointer select-none" htmlFor="confirm_term">Tôi cam kết toàn bộ thông tin đăng ký và hồ sơ tải lên là hoàn toàn chính xác, đúng pháp luật. Tôi đồng ý để StayReco đối soát và cử chuyên viên kiểm định thực tế trước khi kích hoạt cơ sở lưu trú.</label>
                    </div>
                  </div>
                  {/* Action Footer Controls */}
                  <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-2">
                    <button className="w-full sm:w-auto px-6 py-3 rounded-xl bg-surface-container-lowest text-on-surface font-semibold text-xs hover:bg-surface-container-low transition-colors shadow-sm flex items-center justify-center gap-2" type="button">
                      <span className="material-symbols-outlined text-[18px]">bookmark</span>
                      Lưu bản nháp
                    </button>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button className="w-1/3 sm:w-auto px-5 py-3 rounded-xl bg-surface-container-low text-on-surface-variant font-semibold text-xs hover:bg-surface-container transition-colors" type="button">Quay lại</button>
                      <button className="flex-1 sm:w-auto px-8 py-3 rounded-xl bg-primary-container text-on-primary font-bold text-xs hover:bg-primary transition-all shadow-md flex items-center justify-center gap-2" type="button">
                        <span>Tiếp tục: Kiểm tra & Gửi hồ sơ</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
                {/* Right Column: StayReco Exclusive Value & Partner Benefits */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Preview Card of Property in Registration */}
                  <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm">
                    <div className="relative h-44 w-full">
                      <img className="w-full h-full object-cover" data-alt="A tranquil boutique hotel bedroom in Da Nang overlooking the Han River, natural wood textures, terracotta ceramic elements, soft warm morning light, Vietnamese artisanal decoration, coastal luxury atmosphere." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpBmkDx01J58DvopXHAls8MQsxOxhpJcAjQbYPPkGdYcGIAcUlqPPRRGC9KgyhlLh_xeF5rQaved8uWLhVnZ7oifpkOzamnDKyd67o70wa9x8qbi4DNmAcFCOxPx5P7PpsiXujoApBLwtDdXsHUTRnkLbQtr_qv3OTjEx0jt4EcxpswfS-DR7_g797lvqb5TkTEtBxa6BB692z6dRb3r_nK3MLsvVub6yHqeMmQTjr0XWECXs704fy" />
                      <div className="absolute top-3 right-3 bg-tertiary text-on-tertiary text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed animate-ping"></span>
                        Đang duyệt hồ sơ
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 bg-surface-container-lowest/90 backdrop-blur-md p-3 rounded-xl">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-primary truncate">An Nhiên Riverside Hotel</span>
                          <span className="text-[11px] font-semibold text-secondary">4 Sao</span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant truncate">Hải Châu 1, Hải Châu, Đà Nẵng</p>
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between text-xs py-1 text-on-surface-variant">
                        <span>Loại hình lưu trú:</span>
                        <span className="font-semibold text-on-surface">Khách sạn Boutique</span>
                      </div>
                      <div className="flex items-center justify-between text-xs py-1 text-on-surface-variant">
                        <span>Thời gian xét duyệt:</span>
                        <span className="font-semibold text-tertiary">Trong vòng 24h</span>
                      </div>
                      <div className="flex items-center justify-between text-xs py-1 text-on-surface-variant">
                        <span>Chuyên viên phụ trách:</span>
                        <span className="font-semibold text-on-surface">Võ Hoàng Lam (Đà Nẵng Desk)</span>
                      </div>
                    </div>
                  </div>
                  {/* Partner Benefits Breakdown */}
                  <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined text-[20px]" style={{"fontVariationSettings":"'FILL' 1"}}>workspace_premium</span>
                      </div>
                      <h3 className="font-bold text-sm text-primary font-headline">Đặc quyền đối tác StayReco</h3>
                    </div>
                    <ul className="space-y-4 text-xs">
                      {/* Benefit 1 */}
                      <li className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="material-symbols-outlined text-[14px]">done</span>
                        </div>
                        <div>
                          <p className="font-bold text-on-surface leading-tight">Tệp khách hàng tinh tế & Tôn trọng văn hoá</p>
                          <p className="text-on-surface-variant text-[11px] mt-0.5">Tiếp cận 150.000+ du khách tìm kiếm trải nghiệm bản địa chất lượng cao.</p>
                        </div>
                      </li>
                      {/* Benefit 2 */}
                      <li className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="material-symbols-outlined text-[14px]">percent</span>
                        </div>
                        <div>
                          <p className="font-bold text-on-surface leading-tight">Hoa hồng cố định chỉ 6% minh bạch</p>
                          <p className="text-on-surface-variant text-[11px] mt-0.5">Không phụ phí ẩn, không phí duy trì năm, không phạt hủy lịch đột xuất.</p>
                        </div>
                      </li>
                      {/* Benefit 3 */}
                      <li className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="material-symbols-outlined text-[14px]">sync_alt</span>
                        </div>
                        <div>
                          <p className="font-bold text-on-surface leading-tight">Kết nối PMS & Channel Manager tự động</p>
                          <p className="text-on-surface-variant text-[11px] mt-0.5">Tích hợp sẵn Cloudbeds, SiteMinder, HotelLink và trợ lý AI tối ưu giá.</p>
                        </div>
                      </li>
                      {/* Benefit 4 */}
                      <li className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="material-symbols-outlined text-[14px]">support_agent</span>
                        </div>
                        <div>
                          <p className="font-bold text-on-surface leading-tight">Tư vấn kinh doanh 1-1 chuyên sâu</p>
                          <p className="text-on-surface-variant text-[11px] mt-0.5">Hỗ trợ thiết lập hình ảnh, lời văn phong cách thương hiệu cùng chuyên viên.</p>
                        </div>
                      </li>
                    </ul>
                    {/* Help Callout */}
                    <div className="p-4 rounded-xl bg-surface-container-low flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-secondary text-[22px]">phone_in_talk</span>
                        <div>
                          <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider block">Hotline hỗ trợ đối tác</span>
                          <span className="text-sm font-bold text-secondary font-mono tracking-tight">1900 6822</span>
                        </div>
                      </div>
                      <a className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-xs font-semibold text-primary hover:bg-primary hover:text-on-primary transition-colors shadow-xs" href="tel:19006822">Gọi ngay</a>
                    </div>
                  </div>
                  {/* Security & Privacy Guarantee Note */}
                  <div className="p-4 rounded-2xl bg-surface-container-low/60 flex items-start gap-3">
                    <span className="material-symbols-outlined text-outline text-[20px] flex-shrink-0">lock</span>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">Dữ liệu pháp lý doanh nghiệp được mã hóa 256-bit chuẩn TLS 1.3 và lưu trữ an toàn tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.</p>
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
