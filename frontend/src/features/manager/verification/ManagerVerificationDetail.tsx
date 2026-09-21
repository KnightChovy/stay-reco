/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Legacy JSX screen pending React state migration.
import React from 'react';

export default function ManagerVerificationDetail() {
  React.useEffect(() => {
    try {
      // Ensure the active state in the App Shell matches requirement
  (function() {
    const aside = document.querySelector('aside');
    if (aside) {
      const activeLink = aside.querySelector('[data-path="duyet-ho-so-doi-tac"]');
      if (activeLink) {
        aside.querySelectorAll('nav a').forEach(a => {
          a.classList.remove('bg-primary-container', 'text-on-primary', 'font-semibold', 'shadow-[0_2px_8px_rgba(35,78,112,0.12)]');
          a.classList.add('text-on-surface-variant');
        });
        activeLink.classList.remove('text-on-surface-variant');
        activeLink.classList.add('bg-primary-container', 'text-on-primary', 'font-semibold', 'shadow-[0_2px_8px_rgba(35,78,112,0.12)]');
      }
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
            <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
              {/* Top Breadcrumb & Actions Bar */}
              <div className="flex flex-col gap-4">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
                  <a className="hover:text-primary transition-colors" href="#">Quản trị nền tảng</a>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <a className="hover:text-primary transition-colors" href="#">Hàng đợi duyệt đối tác</a>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <span className="text-on-surface font-semibold">Thẩm định hồ sơ #VER-2026-DN-8492</span>
                </nav>
                {/* Title & Global Decision CTAs */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-surface-container-lowest p-5 rounded-2xl shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-28">apartment</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-xl lg:text-2xl font-bold font-headline text-on-surface tracking-tight">An Nhiên Riverside Hotel</h1>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary-fixed text-on-secondary-fixed">
                          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                          Đang thẩm định thực địa (Bước 3/4)
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-mono font-medium">#VER-2026-DN-8492</span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-secondary">pin_drop</span>
                        128 Đường Bạch Đằng, P. Hải Châu 1, Q. Hải Châu, TP. Đà Nẵng
                        <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                        Gửi duyệt: 14/10/2026 09:24
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
                    <button className="h-11 px-4 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container text-xs font-semibold transition-colors flex items-center gap-1.5 active:scale-98" type="button">
                      <span className="material-symbols-outlined text-base">contact_support</span>
                      <span>Yêu cầu bổ sung tài liệu</span>
                    </button>
                    <button className="h-11 px-4 rounded-xl bg-error-container/50 text-error hover:bg-error-container text-xs font-semibold transition-colors flex items-center gap-1.5 active:scale-98" type="button">
                      <span className="material-symbols-outlined text-base">block</span>
                      <span>Từ chối hồ sơ</span>
                    </button>
                    <button className="h-11 px-5 rounded-xl bg-primary-container text-on-primary hover:bg-primary shadow-sm text-xs font-semibold transition-all flex items-center gap-2 active:scale-98" type="button">
                      <span className="material-symbols-outlined text-base">verified</span>
                      <span>Phê duyệt hồ sơ & Kích hoạt</span>
                    </button>
                  </div>
                </div>
              </div>
              {/* Main Split Layout Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Interactive Document & Facility Proofs Viewer (55% -> ~7 cols) */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  {/* Document Viewer Container */}
                  <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    {/* Document Tabs Navigation */}
                    <div className="bg-surface-container-low px-4 pt-3 flex items-center gap-2 overflow-x-auto no-scrollbar border-b-0">
                      <button className="px-4 py-2.5 rounded-t-xl text-xs font-semibold flex items-center gap-2 bg-surface-container-lowest text-primary shadow-sm border-b-2 border-primary shrink-0 transition-all">
                        <span className="material-symbols-outlined text-base text-primary">description</span>
                        <span className="truncate max-w-[200px]">Giấy phép ĐKKD</span>
                        <span className="px-1.5 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold">PDF</span>
                      </button>
                      <button className="px-4 py-2.5 rounded-t-xl text-xs font-medium flex items-center gap-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container shrink-0 transition-all">
                        <span className="material-symbols-outlined text-base">local_fire_department</span>
                        <span className="truncate max-w-[190px]">ANTT & PCCC</span>
                      </button>
                      <button className="px-4 py-2.5 rounded-t-xl text-xs font-medium flex items-center gap-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container shrink-0 transition-all">
                        <span className="material-symbols-outlined text-base">hotel_class</span>
                        <span className="truncate max-w-[180px]">Tiêu chuẩn 4★ & Ảnh</span>
                      </button>
                      <button className="px-4 py-2.5 rounded-t-xl text-xs font-medium flex items-center gap-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container shrink-0 transition-all">
                        <span className="material-symbols-outlined text-base">handshake</span>
                        <span className="truncate max-w-[170px]">Hợp đồng đối tác</span>
                      </button>
                    </div>
                    {/* Document Toolbar */}
                    <div className="px-5 py-3 bg-surface-container-low/50 flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
                        <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-mono text-[11px]">gpkd_annhien_riverside_signed.pdf</span>
                        <span className="text-xs">Trang 1/2</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center bg-surface-container-lowest rounded-lg shadow-sm p-0.5">
                          <button aria-label="Zoom out" className="w-8 h-8 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors" type="button">
                            <span className="material-symbols-outlined text-lg">zoom_out</span>
                          </button>
                          <span className="text-xs font-semibold text-on-surface px-2">100%</span>
                          <button aria-label="Zoom in" className="w-8 h-8 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors" type="button">
                            <span className="material-symbols-outlined text-lg">zoom_in</span>
                          </button>
                        </div>
                        <button aria-label="Fullscreen" className="w-8 h-8 rounded-lg bg-surface-container-lowest shadow-sm flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors" type="button">
                          <span className="material-symbols-outlined text-lg">fullscreen</span>
                        </button>
                        <a className="h-8 px-3 rounded-lg bg-surface-container text-on-surface text-xs font-medium hover:bg-surface-variant transition-colors flex items-center gap-1.5 shadow-sm" href="#">
                          <span className="material-symbols-outlined text-sm">download</span>
                          <span>Tải PDF gốc (2.4MB)</span>
                        </a>
                      </div>
                    </div>
                    {/* Simulated High-Fidelity Official Document Viewport */}
                    <div className="p-6 bg-surface-container flex justify-center overflow-auto max-h-[640px]">
                      <div className="w-full max-w-xl bg-surface-container-lowest shadow-xl rounded-xl p-8 sm:p-10 relative text-on-surface select-none">
                        {/* Decorative Government Seal Watermark Background */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                          <span className="material-symbols-outlined text-[320px]">shield</span>
                        </div>
                        {/* Certificate Header */}
                        <div className="text-center space-y-1 pb-6 relative z-10">
                          <p className="text-xs font-bold tracking-wider uppercase text-on-surface">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                          <p className="text-[11px] font-semibold text-on-surface-variant">Độc lập - Tự do - Hạnh phúc</p>
                          <div className="w-24 h-0.5 bg-on-surface/20 mx-auto my-2"></div>
                          <h2 className="text-base sm:text-lg font-bold font-headline text-primary-container tracking-tight uppercase pt-2">GIẤY CHỨNG NHẬN ĐĂNG KÝ DOANH NGHIỆP</h2>
                          <p className="text-[11px] text-on-surface-variant font-medium">CÔNG TY TRÁCH NHIỆM HỮU HẠN MỘT THÀNH VIÊN</p>
                          <p className="text-xs font-bold text-secondary mt-1">Mã số doanh nghiệp: 0401988234</p>
                        </div>
                        {/* Certificate Key Metadata Rows */}
                        <div className="space-y-4 text-xs leading-relaxed relative z-10">
                          <div className="p-3.5 rounded-xl bg-surface-container-low space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <span className="text-on-surface-variant font-medium">Đăng ký lần đầu:</span>
                              <span className="col-span-2 font-semibold text-on-surface">Ngày 12 tháng 04 năm 2019</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <span className="text-on-surface-variant font-medium">Đăng ký thay đổi lần 3:</span>
                              <span className="col-span-2 font-semibold text-on-surface">Ngày 20 tháng 02 năm 2024</span>
                            </div>
                          </div>
                          <div className="space-y-2.5 pt-1">
                            <div>
                              <span className="text-on-surface-variant block text-[11px] uppercase tracking-wider font-semibold">1. Tên doanh nghiệp</span>
                              <p className="text-sm font-bold text-primary tracking-tight">CÔNG TY TNHH KHÁCH SẠN AN NHIÊN ĐÀ NẴNG</p>
                              <p className="text-[11px] text-on-surface-variant italic font-serif">Tên giao dịch quốc tế: AN NHIEN RIVERSIDE DA NANG CO., LTD</p>
                            </div>
                            <div>
                              <span className="text-on-surface-variant block text-[11px] uppercase tracking-wider font-semibold">2. Địa chỉ trụ sở chính</span>
                              <p className="font-medium text-on-surface">128 Đường Bạch Đằng, Phường Hải Châu 1, Quận Hải Châu, Thành phố Đà Nẵng, Việt Nam</p>
                            </div>
                            <div>
                              <span className="text-on-surface-variant block text-[11px] uppercase tracking-wider font-semibold">3. Người đại diện theo pháp luật</span>
                              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low mt-1">
                                <div>
                                  <span className="text-xs font-bold text-on-surface">TRẦN NAM</span>
                                  <span className="text-[11px] text-on-surface-variant block">Chức danh: Giám đốc</span>
                                </div>
                                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant">CCCD: 04808900****</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-on-surface-variant block text-[11px] uppercase tracking-wider font-semibold">4. Ngành nghề kinh doanh chính</span>
                              <p className="text-xs font-medium text-on-surface">Mã ngành 5510: Dịch vụ lưu trú ngắn ngày (Khách sạn, Biệt thự du lịch, Căn hộ du lịch tiêu chuẩn 4 sao).</p>
                            </div>
                          </div>
                          {/* Digital Signatures & Seal */}
                          <div className="pt-6 grid grid-cols-2 gap-4 items-end">
                            <div className="space-y-2">
                              <div className="p-2 rounded-lg bg-tertiary-fixed/40 text-on-tertiary-fixed text-[11px] flex items-center gap-2">
                                <span className="material-symbols-outlined text-base">verified_user</span>
                                <div>
                                  <div className="font-bold">Chữ ký số hợp lệ</div>
                                  <div className="text-[10px] opacity-80">Chứng thực bởi VNPT-CA</div>
                                </div>
                              </div>
                            </div>
                            <div className="text-center relative">
                              <div className="inline-flex flex-col items-center justify-center p-3 rounded-xl bg-error-container/30 border border-error/20 text-error">
                                <span className="material-symbols-outlined text-3xl">token</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">SỞ KẾ HOẠCH & ĐẦU TƯ</span>
                                <span className="text-[9px] font-medium">TP. ĐÀ NẴNG - ĐÃ DUYỆT</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Photo Proofs from Field Inspection */}
                  <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl">camera_outdoor</span>
                        <div>
                          <h2 className="text-sm font-bold font-headline text-on-surface">Hình ảnh đối chiếu thực địa (Field Inspection Proofs)</h2>
                          <p className="text-[11px] text-on-surface-variant">Khảo sát & ghi nhận thực tế vào ngày 18/10/2026 bởi Chuyên viên StayReco</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-tertiary-fixed text-on-tertiary-fixed">Đã xác minh 4/4 điểm mục</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Thumbnail 1 */}
                      <div className="group relative rounded-xl overflow-hidden bg-surface-container cursor-pointer shadow-sm">
                        <img alt="Phòng mẫu Deluxe River View" className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105" data-alt="High-end Vietnamese boutique hotel deluxe bedroom with panoramic window overlooking Han River Da Nang, pristine beige linen, natural wooden furniture, contemporary aesthetic with calm warm tones" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-iK6j1OL3mJEpKbnbM3ymCWxLYe7xluwf53SzBMV4SXzAGnGCGoRKiTPzMVCeCIlbsp-MOvmfdp9tK1EQWkEf6oMw-OyzpbITNJncFArA8hrAFbiPz1hA_79EfHiVXKfNNJmR1XvfwjGllloaM51QwdDW7jgxhcr8YKoe2_odfDrKDwAEbPTg4lIbbkMieaPBvX39m9vhZAb30EPXOnt7IQK5lqTucT0Z32Tsu3RK-ngYYRQsi9uP" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2.5 flex flex-col justify-end">
                          <span className="text-[11px] font-semibold text-white leading-tight">Phòng Deluxe River View</span>
                          <span className="text-[10px] text-white/75">Khớp 100% niêm yết</span>
                        </div>
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center shadow">
                          <span className="material-symbols-outlined text-xs">check</span>
                        </div>
                      </div>
                      {/* Thumbnail 2 */}
                      <div className="group relative rounded-xl overflow-hidden bg-surface-container cursor-pointer shadow-sm">
                        <img alt="Kính cách âm 2 lớp" className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105" data-alt="Close-up detail of double glazed acoustic acoustic soundproof window frame in modern riverside hotel Da Nang, displaying professional decibel measurement test device" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6sKBrlUFzhQ8_z0F0NBGhw6lDMZsVP6bqk9hebSG601Q3MyPKJXYJeLEIFiI_kD_iWnnezCHHZPGovw_QxQD1biaHFaCAj3oPtBoQZ8tSvBQK1K9eXbRmBhVsPGu-Ev1l6ZttjP9iZLpFeQb-1Kib3rk6C1Xz0Z2YgJQk7589M5DwVoHDkTzIdkjvEDJtjiB8jlK5WdK3_6R2NjM2ca4RW9pdb0lA-K0CJhdxxlb0W16mAidTXhYo" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2.5 flex flex-col justify-end">
                          <span className="text-[11px] font-semibold text-white leading-tight">Kính cách âm 2 lớp</span>
                          <span className="text-[10px] text-white/75">Giảm 94% ồn mặt phố</span>
                        </div>
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center shadow">
                          <span className="material-symbols-outlined text-xs">check</span>
                        </div>
                      </div>
                      {/* Thumbnail 3 */}
                      <div className="group relative rounded-xl overflow-hidden bg-surface-container cursor-pointer shadow-sm">
                        <img alt="Hệ thống PCCC hành lang tầng 3" className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105" data-alt="Clean modern hotel hallway corridor showing automatic fire sprinkler ceiling system, fire alarm strobe, clear exit emergency evacuation signage and fire hose cabinet" src="https://lh3.googleusercontent.com/aida-public/AB6AXuADGgN3ocwHhYiEKDYqU5baNwvwj1ZANsTHlZIwAxSNzCzRKOmjKVmxQi_k-Cqt6JcQPgYebzWMKN39wLKwt0_pb4PS4lc_xWylkVA-0TMqVhbu5egQvZc-JjXb_hl6L0GlSsm66VitAoYIWDnJVyJS8OI6LEYwLfSXbCGm48d0zxXud4ZFTLXVxlIRh2Dc3fBzrd7Zuvi23-SytE8tib-VGud6MCklHdZOrHX9Bx3tM0F54pNa_Uyn" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2.5 flex flex-col justify-end">
                          <span className="text-[11px] font-semibold text-white leading-tight">PCCC hành lang tầng 3</span>
                          <span className="text-[10px] text-white/75">Đầu phun & họng nước chuẩn</span>
                        </div>
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center shadow">
                          <span className="material-symbols-outlined text-xs">check</span>
                        </div>
                      </div>
                      {/* Thumbnail 4 */}
                      <div className="group relative rounded-xl overflow-hidden bg-surface-container cursor-pointer shadow-sm">
                        <img alt="Quầy lễ tân" className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105" data-alt="Boutique hospitality reception lobby in Da Nang with warm ambient lighting, terracotta ceramic tile accents, polished stone counter and staff greeting station" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0SDnZDd74P1Il_m5VmnkwurHI2BuslPMsxUOD4JuQk_ZxLEizAPN_LMiN6doo3_VukzGH9w6j4xk_gJRyVSciUaVTjSfi8rqR5MUQrZNlFiva9IRdVZhEQt8I_oqXwaWBy6WTAcGKGunLY_Bbsa3RmICbF_OrFk7fBAXykhtu_tbwfY9HAZzEAkKOGnzZm6MVFwVPLP5DuvgKMFAscnbbp3o73y6rTgcMVEvNX2FttRgArcDfMi3P" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2.5 flex flex-col justify-end">
                          <span className="text-[11px] font-semibold text-white leading-tight">Quầy lễ tân & Sảnh</span>
                          <span className="text-[10px] text-white/75">Đón tiếp 24/7 chuyên nghiệp</span>
                        </div>
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center shadow">
                          <span className="material-symbols-outlined text-xs">check</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Right Column: Platform Review Panel & Operational Checklist (45% -> ~5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  {/* Card 1: Review Checklist */}
                  <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed">
                          <span className="material-symbols-outlined text-lg">fact_check</span>
                        </div>
                        <h2 className="text-base font-bold font-headline text-on-surface">Bảng kiểm tra thẩm định (5/5)</h2>
                      </div>
                      <span className="text-xs font-bold text-tertiary bg-tertiary-fixed/50 px-2.5 py-1 rounded-full">Sẵn sàng kích hoạt</span>
                    </div>
                    {/* Interactive Checklist Items */}
                    <div className="space-y-3">
                      {/* Item 1 */}
                      <div className="p-3.5 rounded-xl bg-surface-container-low flex items-start gap-3 hover:bg-surface-container transition-colors">
                        <div className="w-5 h-5 rounded bg-tertiary text-on-tertiary flex items-center justify-center shrink-0 mt-0.5">
                          <span className="material-symbols-outlined text-sm">check</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-on-surface leading-tight">Tính xác thực pháp nhân & ĐKKD</p>
                            <span className="text-[10px] font-semibold text-tertiary shrink-0">Hợp lệ</span>
                          </div>
                          <p className="text-[11px] text-on-surface-variant mt-0.5">Trùng khớp dữ liệu Tổng cục Thuế và Cổng đăng ký doanh nghiệp Quốc gia.</p>
                        </div>
                      </div>
                      {/* Item 2 */}
                      <div className="p-3.5 rounded-xl bg-surface-container-low flex items-start gap-3 hover:bg-surface-container transition-colors">
                        <div className="w-5 h-5 rounded bg-tertiary text-on-tertiary flex items-center justify-center shrink-0 mt-0.5">
                          <span className="material-symbols-outlined text-sm">check</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-on-surface leading-tight">Tiêu chuẩn an toàn PCCC & ANTT</p>
                            <span className="text-[10px] font-semibold text-tertiary shrink-0">Đạt chuẩn</span>
                          </div>
                          <p className="text-[11px] text-on-surface-variant mt-0.5">Biên bản kiểm tra định kỳ 2026 của CATP Đà Nẵng còn thời hạn hiệu lực.</p>
                        </div>
                      </div>
                      {/* Item 3 */}
                      <div className="p-3.5 rounded-xl bg-surface-container-low flex items-start gap-3 hover:bg-surface-container transition-colors">
                        <div className="w-5 h-5 rounded bg-tertiary text-on-tertiary flex items-center justify-center shrink-0 mt-0.5">
                          <span className="material-symbols-outlined text-sm">check</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-on-surface leading-tight">Cơ sở vật chất khớp mô tả niêm yết</p>
                            <span className="text-[10px] font-semibold text-tertiary shrink-0">Chính xác</span>
                          </div>
                          <p className="text-[11px] text-on-surface-variant mt-0.5">Đã khảo sát thực địa tại 128 Bạch Đằng ngày 18/10 bởi chuyên viên địa bàn.</p>
                        </div>
                      </div>
                      {/* Item 4 */}
                      <div className="p-3.5 rounded-xl bg-surface-container-low flex items-start gap-3 hover:bg-surface-container transition-colors">
                        <div className="w-5 h-5 rounded bg-tertiary text-on-tertiary flex items-center justify-center shrink-0 mt-0.5">
                          <span className="material-symbols-outlined text-sm">check</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-on-surface leading-tight">Kính cách âm đạt cam kết độ yên tĩnh</p>
                            <span className="text-[10px] font-semibold text-tertiary shrink-0">&lt; 38 dB</span>
                          </div>
                          <p className="text-[11px] text-on-surface-variant mt-0.5">Đo đạc thực tế: Triệt tiêu 94% tiếng ồn xe cộ đường Bạch Đằng giờ cao điểm.</p>
                        </div>
                      </div>
                      {/* Item 5 */}
                      <div className="p-3.5 rounded-xl bg-surface-container-low flex items-start gap-3 hover:bg-surface-container transition-colors">
                        <div className="w-5 h-5 rounded bg-tertiary text-on-tertiary flex items-center justify-center shrink-0 mt-0.5">
                          <span className="material-symbols-outlined text-sm">check</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-on-surface leading-tight">Hợp đồng đối tác & Hoa hồng 6%</p>
                            <span className="text-[10px] font-semibold text-tertiary shrink-0">Đã ký điện tử</span>
                          </div>
                          <p className="text-[11px] text-on-surface-variant mt-0.5">Đã hoàn tất ký số Token Doanh nghiệp ngày 15/10/2026.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Card 2: Field Inspector Report & Feedback */}
                  <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl">assignment_ind</span>
                        <h2 className="text-sm font-bold font-headline text-on-surface">Đánh giá của Chuyên viên thẩm định</h2>
                      </div>
                      <span className="text-[11px] text-on-surface-variant font-mono">18/10/2026 - 16:45</span>
                    </div>
                    <div className="p-4 rounded-xl bg-surface-container-low/70 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-sm">TV</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-on-surface">Nguyễn Thảo Vy</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-semibold">Thẩm định viên phụ trách</span>
                          </div>
                          <span className="text-[11px] text-on-surface-variant">Phụ trách địa bàn: Quận Hải Châu & Sơn Trà, TP. Đà Nẵng</span>
                        </div>
                      </div>
                      <p className="text-xs text-on-surface leading-relaxed italic bg-surface-container-lowest p-3 rounded-lg border-l-2 border-primary">“Cơ sở lưu trú vận hành xuất sắc, phòng ốc và hệ thống cách âm vượt chuẩn cam kết. Đề xuất phê duyệt mở bán chính thức trên sàn StayReco và cấp huy hiệu ‘Đối tác xác thực 100%’.”</p>
                      <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                        <div className="flex items-center gap-1.5 text-on-surface-variant">
                          <span className="material-symbols-outlined text-sm text-tertiary">check_circle</span>
                          <span>
                            Điểm thực địa:
                            <strong className="text-on-surface">9.6 / 10</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-on-surface-variant">
                          <span className="material-symbols-outlined text-sm text-secondary">verified</span>
                          <span>
                            Huy hiệu:
                            <strong className="text-on-surface">StayReco Shield</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Card 3: Final Decision Action Block */}
                  <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-xl">gavel</span>
                      <h2 className="text-sm font-bold font-headline text-on-surface">Quyết định thẩm định (Action Decision)</h2>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-on-surface mb-1.5" htmlFor="reviewNotes">Ghi chú phản hồi cho đối tác (Gửi tự động qua Email & Partner Portal)</label>
                        <textarea className="w-full text-xs p-3 rounded-xl bg-surface-container-low border-0 text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all resize-none" id="reviewNotes" placeholder="Nhập căn cứ phê duyệt hoặc điều kiện bổ sung nếu có..." rows="3" defaultValue="Hồ sơ pháp lý đầy đủ, kết quả kiểm tra thực địa đạt xuất sắc. Phê duyệt kích hoạt tài khoản đối tác chính thức và niêm yết 24 phòng tiêu chuẩn." />
                      </div>
                      {/* Confirmation Checkbox */}
                      <label className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer select-none">
                        <input defaultChecked={true} className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer" type="checkbox" />
                        <span className="text-xs text-on-surface leading-snug">
                          Tôi xác nhận đã thẩm định hồ sơ thực tế và chịu trách nhiệm về tính xác thực của cơ sở lưu trú này theo quy chuẩn
                          <strong>StayReco Shield Guarantee</strong>
                          .
                        </span>
                      </label>
                      {/* Actions */}
                      <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                        <button className="w-full sm:w-1/3 h-11 rounded-xl bg-surface-container text-on-surface hover:bg-surface-variant text-xs font-semibold transition-colors flex items-center justify-center gap-1 active:scale-98" type="button">
                          <span className="material-symbols-outlined text-base">save</span>
                          <span>Lưu tạm thời</span>
                        </button>
                        <button className="w-full sm:w-2/3 h-11 rounded-xl bg-primary-container text-on-primary hover:bg-primary shadow-sm text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-98" type="button">
                          <span className="material-symbols-outlined text-base">verified</span>
                          <span>Xác nhận Phê duyệt & Cấp quyền mở bán</span>
                        </button>
                      </div>
                    </div>
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
