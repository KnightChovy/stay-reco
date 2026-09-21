/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Legacy JSX display screen pending component-level migration.
import React from 'react';

export default function PartnerVerification() {
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
            <div className="p-6 md:p-8 lg:p-10 space-y-8 max-w-7xl mx-auto w-full">
              {/* Top Breadcrumb & Metadata Section */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1.5">
                  <nav className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <a className="hover:text-primary transition-colors" href="#">Tổ chức & Hồ sơ</a>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    <span className="text-secondary font-medium">Hồ sơ & Trạng thái thẩm định</span>
                  </nav>
                  <h1 className="text-2xl md:text-3xl font-headline font-bold text-primary tracking-tight">Trạng thái Thẩm định & Xác minh Hồ sơ Đối tác</h1>
                </div>
                <div className="flex items-center gap-3 self-start md:self-auto bg-surface-container-low px-4 py-2 rounded-xl shadow-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></div>
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-semibold text-on-surface tracking-wide">Mã hồ sơ: #VER-2026-DN-8492</span>
                    <span className="text-[11px] text-on-surface-variant">Ngày nộp: 15/10/2026</span>
                  </div>
                </div>
              </div>
              {/* Status Banner (Step 2/3 Waiting for On-site Inspection) */}
              <div className="relative overflow-hidden bg-secondary-fixed/40 rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="absolute -right-8 -top-8 w-48 h-48 bg-secondary-container/20 rounded-full blur-2xl pointer-events-none"></div>
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  <div className="space-y-3 max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-secondary-container text-on-secondary-container shadow-xs">
                      <span className="material-symbols-outlined text-[16px]" style={{"fontVariationSettings":"'FILL' 1"}}>pending</span>
                      <span>Đang chờ thẩm định thực địa (Step 2/3)</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-headline font-bold text-on-secondary-fixed leading-snug">Hồ sơ pháp lý đã hợp lệ — Chuyên viên thẩm định chuẩn bị khảo sát thực tế tại cơ sở.</h2>
                    <p className="text-sm md:text-base text-on-surface-variant leading-relaxed">
                      Hồ sơ ĐKKD và PCCC của
                      <span className="font-semibold text-primary">An Nhiên Riverside Hotel</span>
                      đã được Platform Manager xét duyệt sơ bộ. Chuyên viên StayReco sẽ liên hệ trực tiếp trong vòng 24h làm việc để đặt lịch khảo sát phòng mẫu và chất lượng tiện ích thực địa.
                    </p>
                  </div>
                  {/* Quick Status Radial Mini Viz */}
                  <div className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-xl shadow-sm shrink-0 self-start lg:self-center">
                    <div className="relative w-14 h-14 flex items-center justify-center">
                      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
                        <circle className="text-surface-container-high" cx="24" cy="24" fill="none" r="20" stroke="currentColor" strokeWidth="4"></circle>
                        <circle className="text-secondary" cx="24" cy="24" fill="none" r="20" stroke="currentColor" strokeDasharray="125.6" strokeDashoffset="41.8" strokeLinecap="round" strokeWidth="4"></circle>
                      </svg>
                      <span className="absolute text-xs font-bold text-on-surface">66%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs uppercase font-semibold text-on-surface-variant tracking-wider">Tiến độ xác thực</span>
                      <span className="text-sm font-bold text-primary">Bước 3 / 4</span>
                      <span className="text-[11px] text-tertiary font-medium">Đạt 2 cột mốc chính</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Main Content 2-Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Timeline & Documents (7 Cols) */}
                <div className="lg:col-span-7 space-y-8">
                  {/* Verification Timeline Section */}
                  <div className="bg-surface-container-lowest rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-xs uppercase font-semibold tracking-wider text-secondary">Quy trình thẩm định</span>
                        <h3 className="text-lg font-headline font-bold text-primary">Lộ trình xét duyệt minh bạch</h3>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-tertiary-fixed text-on-tertiary-fixed">Đúng thời hạn</span>
                    </div>
                    <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-surface-container-high">
                      {/* Step 1 (Completed) */}
                      <div className="relative flex items-start gap-4">
                        <div className="absolute -left-6 top-1 w-6 h-6 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center shadow-xs">
                          <span className="material-symbols-outlined text-[14px]">check</span>
                        </div>
                        <div className="flex-1 bg-surface-container-low/60 rounded-xl p-4 transition-all">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-semibold text-on-surface">1. Nộp hồ sơ trực tuyến</h4>
                            <span className="text-[11px] font-medium text-tertiary bg-tertiary-fixed/60 px-2 py-0.5 rounded-full">Hoàn tất</span>
                          </div>
                          <p className="text-xs text-on-surface-variant leading-relaxed">
                            Đã tải lên đầy đủ giấy tờ định danh & thông tin cơ sở kinh doanh ngày 15/10/2026 bởi người đại diện
                            <strong className="text-on-surface">Trần Nam</strong>
                            .
                          </p>
                        </div>
                      </div>
                      {/* Step 2 (Completed) */}
                      <div className="relative flex items-start gap-4">
                        <div className="absolute -left-6 top-1 w-6 h-6 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center shadow-xs">
                          <span className="material-symbols-outlined text-[14px]">check</span>
                        </div>
                        <div className="flex-1 bg-surface-container-low/60 rounded-xl p-4 transition-all">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-semibold text-on-surface">2. Rà soát giấy tờ pháp lý & Đối soát thuế</h4>
                            <span className="text-[11px] font-medium text-tertiary bg-tertiary-fixed/60 px-2 py-0.5 rounded-full">Đã duyệt</span>
                          </div>
                          <p className="text-xs text-on-surface-variant leading-relaxed">
                            Kiểm tra chéo cơ sở dữ liệu doanh nghiệp và PCCC hoàn tất ngày 16/10/2026 bởi Platform Manager
                            <strong className="text-on-surface">Lê Hoàng Quân</strong>
                            .
                          </p>
                        </div>
                      </div>
                      {/* Step 3 (In Progress / Active) */}
                      <div className="relative flex items-start gap-4">
                        <div className="absolute -left-6 top-1 w-6 h-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center ring-4 ring-secondary-fixed/50 shadow-xs">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                        </div>
                        <div className="flex-1 bg-secondary-fixed/20 rounded-xl p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-bold text-on-secondary-fixed">3. Khảo sát thẩm định thực địa & Chụp ảnh đối tác</h4>
                            <span className="text-[11px] font-semibold text-on-secondary-container bg-secondary-container/80 px-2 py-0.5 rounded-full animate-pulse">Đang tiến hành</span>
                          </div>
                          <p className="text-xs text-on-surface-variant leading-relaxed mb-3">Chuyên viên khu vực sẽ liên hệ đặt lịch khảo sát phòng tiêu chuẩn, quy chuẩn vệ sinh, và chụp ảnh thực tế đạt chuẩn hiển thị StayReco.</p>
                          <div className="flex items-center gap-2 text-xs font-semibold text-secondary">
                            <span className="material-symbols-outlined text-[16px]">event_available</span>
                            <span>Dự kiến hoàn thành: 22/10/2026</span>
                          </div>
                        </div>
                      </div>
                      {/* Step 4 (Pending) */}
                      <div className="relative flex items-start gap-4 opacity-75">
                        <div className="absolute -left-6 top-1 w-6 h-6 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center">
                          <span className="text-[11px] font-bold">4</span>
                        </div>
                        <div className="flex-1 bg-surface-container-low/30 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-semibold text-on-surface-variant">4. Kích hoạt tài khoản & Mở bán phòng trên StayReco</h4>
                            <span className="text-[11px] text-outline">Chờ duyệt bước 3</span>
                          </div>
                          <p className="text-xs text-on-surface-variant/80 leading-relaxed">Cấp chứng nhận Huy hiệu Đối tác Đã Xác Thực, kết nối cổng thanh toán trực tuyến, và đẩy phòng lên công cụ gợi ý thuật toán AI.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Verified Documents Section */}
                  <div className="bg-surface-container-lowest rounded-2xl p-6 md:p-8 shadow-sm space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs uppercase font-semibold tracking-wider text-secondary">Danh mục tài liệu</span>
                        <h3 className="text-lg font-headline font-bold text-primary">Tài liệu pháp lý đã xác thực</h3>
                      </div>
                      <span className="text-xs text-tertiary font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">task_alt</span>
                        3/3 hợp lệ
                      </span>
                    </div>
                    <div className="space-y-3">
                      {/* Doc 1 */}
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low/70 hover:bg-surface-container-low transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary-container/10 text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-[20px]">badge</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-on-surface">Giấy phép kinh doanh số 0401988234</span>
                            <span className="text-[11px] text-on-surface-variant">Cấp bởi Sở KH&ĐT TP. Đà Nẵng • Định dạng PDF (2.4 MB)</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-tertiary bg-tertiary-fixed px-2.5 py-1 rounded-full">
                            <span className="material-symbols-outlined text-[13px]">check_circle</span>
                            Hợp lệ
                          </span>
                          <button className="p-1.5 rounded-lg text-outline hover:text-primary transition-colors" title="Xem chi tiết">
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                        </div>
                      </div>
                      {/* Doc 2 */}
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low/70 hover:bg-surface-container-low transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary-container/10 text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-[20px]">local_fire_department</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-on-surface">Chứng chỉ PCCC & An ninh trật tự</span>
                            <span className="text-[11px] text-on-surface-variant">Thẩm duyệt số 188/TD-PCCC • Có giá trị đến 2029</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-tertiary bg-tertiary-fixed px-2.5 py-1 rounded-full">
                            <span className="material-symbols-outlined text-[13px]">check_circle</span>
                            Hợp lệ
                          </span>
                          <button className="p-1.5 rounded-lg text-outline hover:text-primary transition-colors" title="Xem chi tiết">
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                        </div>
                      </div>
                      {/* Doc 3 */}
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low/70 hover:bg-surface-container-low transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary-container/10 text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-[20px]">draw</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-on-surface">Hợp đồng hợp tác phân phối StayReco</span>
                            <span className="text-[11px] text-on-surface-variant">Ký số bởi Token Doanh nghiệp • Mã HĐ: SR-2026-088</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-tertiary bg-tertiary-fixed px-2.5 py-1 rounded-full">
                            <span className="material-symbols-outlined text-[13px]">verified</span>
                            Đã ký điện tử
                          </span>
                          <button className="p-1.5 rounded-lg text-outline hover:text-primary transition-colors" title="Xem chi tiết">
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Property Verification Spotlight Mini Card */}
                  <div className="relative overflow-hidden rounded-2xl bg-surface-container-low p-5 flex flex-col sm:flex-row items-center gap-5">
                    <img className="w-full sm:w-36 h-28 object-cover rounded-xl shadow-xs shrink-0" data-alt="A sunlit luxury riverfront boutique hotel bedroom interior in Da Nang, showcasing neutral organic linens, Vietnamese wooden craftsmanship, and floor-to-ceiling windows overlooking a serene water view." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPc_JApD5v0sOcrxMSISWNfZphaQ49_tymGsW5H0xBcpBtwiBMKpzS6bvErGrvSZW5eH4v6-qZS-TFAP-WaG5R-b-wY_Rn0P7bPX1JJbEkU94K13aQkNd6AfbJxkTGeirOxe4o8q1L5nkkKhcu-5U35YOPPABCxa6Wu6Ux78OqiNddqDe3bp9zoiOl57gNtvtXBCJhNUa5Ybp4aGHBGZdEYwATtq1rXRfW-atR-GduaZPWbMp2VZDn" />
                    <div className="flex flex-col space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Cơ sở được thẩm định</span>
                      <span className="text-sm font-headline font-bold text-on-surface">An Nhiên Riverside Hotel (Đà Nẵng)</span>
                      <p className="text-xs text-on-surface-variant line-clamp-2">Boutique 4 sao gồm 32 phòng nghỉ dưỡng phong cách bản địa tại Bờ sông Hàn, Sơn Trà, Đà Nẵng.</p>
                      <div className="flex items-center gap-2 pt-1 text-[11px] font-medium text-primary">
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        <span>120 Bạch Đằng kéo dài, Nại Hiên Đông, Sơn Trà</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Right Column: Operational Permissions, Agent Contact & Actions (5 Cols) */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Permissions During Waiting Status */}
                  <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">lock_open_right</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-headline font-bold text-primary">Giới hạn trong thời gian chờ thẩm định</h3>
                        <p className="text-[11px] text-on-surface-variant">Phân quyền tạm thời trong thời gian chuẩn bị</p>
                      </div>
                    </div>
                    {/* Can Do */}
                    <div className="space-y-2.5">
                      <span className="text-xs font-bold text-tertiary flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Bạn có thể thao tác ngay:
                      </span>
                      <ul className="space-y-2 text-xs text-on-surface-variant">
                        <li className="flex items-start gap-2 bg-surface-container-low/50 p-2.5 rounded-lg">
                          <span className="material-symbols-outlined text-tertiary text-[16px] shrink-0 mt-0.5">bed</span>
                          <span>
                            Cài đặt trước danh mục hạng phòng
                            <strong className="text-on-surface font-semibold">(P05 / Kho phòng & P06)</strong>
                          </span>
                        </li>
                        <li className="flex items-start gap-2 bg-surface-container-low/50 p-2.5 rounded-lg">
                          <span className="material-symbols-outlined text-tertiary text-[16px] shrink-0 mt-0.5">pool</span>
                          <span>
                            Cập nhật tiện ích, ảnh dịch vụ & trải nghiệm ẩm thực
                            <strong className="text-on-surface font-semibold">(P04)</strong>
                          </span>
                        </li>
                        <li className="flex items-start gap-2 bg-surface-container-low/50 p-2.5 rounded-lg">
                          <span className="material-symbols-outlined text-tertiary text-[16px] shrink-0 mt-0.5">auto_awesome</span>
                          <span>
                            Thiết lập Giọng điệu Thương hiệu AI tư vấn tự động
                            <strong className="text-on-surface font-semibold">(P13)</strong>
                          </span>
                        </li>
                      </ul>
                    </div>
                    {/* Locked */}
                    <div className="space-y-2.5 pt-2">
                      <span className="text-xs font-bold text-secondary flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                        Chưa mở cho tới khi đạt khảo sát:
                      </span>
                      <ul className="space-y-2 text-xs text-on-surface-variant">
                        <li className="flex items-start gap-2 bg-secondary-fixed/20 p-2.5 rounded-lg">
                          <span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">storefront</span>
                          <span>
                            Mở bán trực tuyến tới du khách toàn mạng lưới
                            <strong className="text-secondary font-semibold">(Trạng thái: Tạm khóa)</strong>
                          </span>
                        </li>
                        <li className="flex items-start gap-2 bg-secondary-fixed/20 p-2.5 rounded-lg">
                          <span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">account_balance_wallet</span>
                          <span>Nhận tiền thanh toán trực tiếp từ các đơn đặt phòng tự động</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  {/* Assigned Auditor Profile Card */}
                  <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs uppercase font-semibold tracking-wider text-secondary">Đại diện StayReco</span>
                        <h3 className="text-sm font-headline font-bold text-primary">Chuyên viên thẩm định phụ trách</h3>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-tertiary-fixed text-on-tertiary-fixed">Đà Nẵng & Miền Trung</span>
                    </div>
                    <div className="flex items-center gap-4 bg-surface-container-low p-4 rounded-xl">
                      <img className="w-12 h-12 rounded-full object-cover shadow-xs ring-2 ring-surface-container-highest" data-alt="Professional portrait of a friendly female Vietnamese hospitality quality assurance specialist wearing a modern tailored blue blazer, warmly smiling in an upscale hotel foyer." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3H_i7A8lyws0h5s3fcWp0A_mnafQBVig6TLxKq4lM9lRs61Jj8p9DkRDt3S89HLLvaAC5zz78kHk3fbC5Hn31ijKqztTtNZovdoeD_Ketz4-c68vKAqmwu4OoUu8kpSy01xwO6J2hM5A5XnOzKAdnuCyZFRR6TbpoGJuonPByMx3V-3WWtAJAZj-g_FJMV3eUhSUyGfHEnHoAmb2ALjzv_BuZT4O6OpiucahAQCAoPpBNS0fahR0z" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-on-surface">Nguyễn Thảo Vy</span>
                        <span className="text-xs text-on-surface-variant">Chuyên viên Đảm bảo Chất lượng Đối tác</span>
                        <span className="text-[11px] text-tertiary font-medium mt-0.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                          Sẵn sàng phản hồi
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low/40">
                        <span className="text-on-surface-variant flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-secondary">phone_in_talk</span>
                          Hotline ưu tiên:
                        </span>
                        <a className="font-bold text-primary hover:text-on-primary-fixed-variant transition-colors" href="tel:0905888xxx">0905.888.xxx</a>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low/40">
                        <span className="text-on-surface-variant flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-primary">mail</span>
                          Email trao đổi:
                        </span>
                        <a className="font-medium text-primary hover:underline transition-colors" href="mailto:support-partner@stayreco.vn">support-partner@stayreco.vn</a>
                      </div>
                    </div>
                    <div className="bg-surface-container-low p-3 rounded-xl text-[11px] text-on-surface-variant leading-relaxed">
                      <strong className="text-on-surface font-semibold">Lưu ý trước ngày khảo sát:</strong>
                      Quý khách vui lòng chuẩn bị 01 phòng tiêu chuẩn và 01 phòng Suite trong trạng thái sẵn sàng đón khách để chuyên viên tiến hành quay chụp tư liệu.
                    </div>
                  </div>
                  {/* Action Center Buttons */}
                  <div className="space-y-3">
                    <button className="w-full h-11 px-5 rounded-xl bg-primary hover:bg-on-primary-fixed-variant text-on-primary text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]" type="button">
                      <span className="material-symbols-outlined text-[18px]">download</span>
                      <span>Tải trọn bộ hồ sơ đối tác (PDF)</span>
                    </button>
                    <button className="w-full h-11 px-5 rounded-xl bg-surface-container-lowest hover:bg-surface-container-low text-on-surface text-sm font-medium flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99]" type="button">
                      <span className="material-symbols-outlined text-[18px] text-secondary">edit_document</span>
                      <span>Chỉnh sửa / Bổ sung tài liệu</span>
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
