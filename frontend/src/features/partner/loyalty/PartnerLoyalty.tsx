/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Legacy DOM-driven screen; migrate interactions to React state separately.
import React from 'react';

export default function PartnerLoyalty() {
  React.useEffect(() => {
    try {
      function switchLoyaltyTab(tabKey) {
    // Hide all tabs
    document.getElementById('tab-content-rules').classList.add('hidden');
    document.getElementById('tab-content-rewards').classList.add('hidden');
    document.getElementById('tab-content-members').classList.add('hidden');

    // Reset all buttons style
    const tabBtns = document.querySelectorAll('.loyalty-tab-btn');
    tabBtns.forEach(btn => {
      btn.className = 'loyalty-tab-btn flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-all';
    });

    // Show active tab & update button styling
    const targetContent = document.getElementById('tab-content-' + tabKey);
    const targetBtn = document.getElementById('tab-btn-' + tabKey);
    
    if (targetContent && targetBtn) {
      targetContent.classList.remove('hidden');
      targetBtn.className = 'loyalty-tab-btn flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-primary-container text-on-primary shadow-sm transition-all';
    }
  }
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
              <a aria-current="page" className="flex items-center gap-3 px-3 py-2 transition-colors bg-primary-container text-on-primary font-medium rounded-lg shadow-sm" data-path="khach-hang-than-thiet" href="#">
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
            {/* Top Context & Action Bar */}
            <div className="px-8 py-6 bg-surface-container-lowest shadow-sm flex flex-col gap-4">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
                <span>Tiếp thị & Khách hàng</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-primary font-semibold">Khách hàng thân thiết & Điểm thưởng</span>
              </div>
              {/* Title & CTAs */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold font-headline text-primary tracking-tight">Chương trình Hội viên Thân thiết An Nhiên Elite</h1>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-tertiary-fixed text-on-tertiary-fixed">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                      Đang kích hoạt
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant max-w-2xl leading-relaxed">Thiết lập tỷ lệ tích điểm sau mỗi kỳ lưu trú, bảng quy đổi voucher và đặc quyền tri ân dành riêng cho du khách quen thuộc.</p>
                </div>
                <div className="flex items-center gap-3 self-start lg:self-center">
                  <button className="h-11 px-5 rounded-lg bg-surface-container-low text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors flex items-center gap-2" type="button">
                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                    <span>Xem trước trang Loyalty phía du khách</span>
                  </button>
                  <button className="h-11 px-6 rounded-lg bg-primary-container text-on-primary text-xs font-semibold hover:bg-primary shadow-sm transition-colors flex items-center gap-2" type="button">
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    <span>Lưu thay đổi chính sách</span>
                  </button>
                </div>
              </div>
              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 pt-2">
                <button className="loyalty-tab-btn flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-primary-container text-on-primary shadow-sm transition-all" id="tab-btn-rules" onClick={() => { if (typeof window !== 'undefined') { try { switchLoyaltyTab('rules'); } catch(e) { console.error(e); } } }} type="button">
                  <span className="material-symbols-outlined text-[18px]">tune</span>
                  <span>1. Quy tắc tích điểm</span>
                </button>
                <button className="loyalty-tab-btn flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-all" id="tab-btn-rewards" onClick={() => { if (typeof window !== 'undefined') { try { switchLoyaltyTab('rewards'); } catch(e) { console.error(e); } } }} type="button">
                  <span className="material-symbols-outlined text-[18px]">redeem</span>
                  <span>2. Danh mục Đổi điểm thưởng</span>
                </button>
                <button className="loyalty-tab-btn flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-all" id="tab-btn-members" onClick={() => { if (typeof window !== 'undefined') { try { switchLoyaltyTab('members'); } catch(e) { console.error(e); } } }} type="button">
                  <span className="material-symbols-outlined text-[18px]">group</span>
                  <span>3. Thống kê tệp du khách thân thiết</span>
                </button>
              </div>
            </div>
            {/* Main Content Layout */}
            <div className="px-8 py-8">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                {/* Primary Workspace (Tabs Container) */}
                <div className="xl:col-span-8 flex flex-col gap-8">
                  {/* TAB 1: QUY TẮC TÍCH ĐIỂM */}
                  <div className="space-y-8 flex flex-col" id="tab-content-rules">
                    {/* Cơ chế tích điểm cơ sở Card */}
                    <div className="p-7 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-6">
                      <div className="flex items-center justify-between pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-[22px]">toll</span>
                          </div>
                          <div>
                            <h2 className="text-base font-bold font-headline text-primary">Cơ chế tích điểm cơ sở</h2>
                            <p className="text-xs text-on-surface-variant">Quy tắc định danh điểm thưởng tự động ghi nhận theo doanh thu thực tế</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono uppercase font-semibold text-secondary bg-secondary-fixed/50 px-2.5 py-1 rounded-full">Auto Calc v2.4</span>
                      </div>
                      {/* Configuration Form Inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-container-low/40 p-5 rounded-xl">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                            <span>Tỷ lệ quy đổi tiêu chuẩn</span>
                            <span className="material-symbols-outlined text-[14px] text-outline cursor-help" title="Số tiền chi tiêu tương ứng với 1 điểm thưởng">info</span>
                          </label>
                          <div className="relative flex items-center">
                            <span className="absolute left-3.5 text-xs font-medium text-on-surface-variant">Mỗi</span>
                            <input className="h-11 w-full pl-14 pr-20 bg-surface-container-lowest rounded-lg text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container" type="text" defaultValue="10.000" />
                            <span className="absolute right-3.5 text-xs font-semibold text-primary">₫ = 1 Điểm</span>
                          </div>
                          <p className="text-[11px] text-on-surface-variant">Áp dụng cho tiền phòng ròng (chưa bao gồm VAT & phụ phí OTA nếu có)</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                            <span>Thời hạn hiệu lực của điểm</span>
                            <span className="material-symbols-outlined text-[14px] text-outline">history</span>
                          </label>
                          <div className="relative flex items-center">
                            <select className="h-11 w-full px-3.5 bg-surface-container-lowest rounded-lg text-xs font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container appearance-none cursor-pointer">
                              <option selected="" value="12">12 tháng (Kể từ ngày tích lũy cuối cùng)</option>
                              <option value="24">24 tháng (Chính sách linh hoạt cho Resort)</option>
                              <option value="0">Vô thời hạn (Không bao giờ hết hạn)</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-3 pointer-events-none text-on-surface-variant text-[20px]">expand_more</span>
                          </div>
                          <p className="text-[11px] text-on-surface-variant">Tự động gửi thông báo qua Zalo/Email 30 ngày trước khi điểm hết hạn</p>
                        </div>
                      </div>
                      {/* Minh họa trực quan Simulator */}
                      <div className="p-5 rounded-xl bg-surface-container-high/40 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">calculate</span>
                            Mô phỏng chu trình tích lũy mẫu
                          </span>
                          <span className="text-[11px] text-on-surface-variant font-medium">Khách đặt: Nguyễn Hoàng Lan</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          {/* Booking details */}
                          <div className="p-3.5 bg-surface-container-lowest rounded-lg">
                            <p className="text-[11px] text-on-surface-variant">Kỳ nghỉ 2 đêm</p>
                            <p className="text-xs font-bold text-on-surface mt-0.5">Deluxe River View</p>
                            <p className="text-sm font-bold text-primary mt-2 font-mono">2.250.000 ₫</p>
                          </div>
                          {/* Process arrow */}
                          <div className="flex flex-col items-center justify-center text-center px-2">
                            <span className="text-[11px] text-secondary font-medium mb-1">Check-out hoàn tất</span>
                            <div className="flex items-center gap-1 text-primary">
                              <div className="h-0.5 w-12 bg-primary/30 rounded-full"></div>
                              <span className="material-symbols-outlined text-[18px]">east</span>
                            </div>
                            <span className="text-[10px] text-on-surface-variant mt-1">Cộng tự động sau 24h</span>
                          </div>
                          {/* Result */}
                          <div className="p-3.5 bg-tertiary-fixed/40 rounded-lg flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-medium text-on-tertiary-fixed-variant">Tài khoản Hội viên</span>
                              <span className="material-symbols-outlined text-[18px] text-tertiary">verified</span>
                            </div>
                            <div className="mt-2">
                              <span className="text-xl font-extrabold font-headline text-tertiary">+225</span>
                              <span className="text-xs font-semibold text-tertiary ml-1">Điểm Elite</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Phân cấp bậc quyền lợi hội viên */}
                    <div className="p-7 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                            <span className="material-symbols-outlined text-[22px]">military_tech</span>
                          </div>
                          <div>
                            <h2 className="text-base font-bold font-headline text-primary">Phân cấp bậc quyền lợi hội viên (Tiers)</h2>
                            <p className="text-xs text-on-surface-variant">Khuyến khích du khách gia tăng tần suất quay lại nhờ chuỗi đặc quyền lũy tiến</p>
                          </div>
                        </div>
                        <button className="text-xs font-semibold text-primary hover:text-on-primary-fixed-variant flex items-center gap-1" type="button">
                          <span>Chỉnh sửa tiêu chí</span>
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                      </div>
                      {/* Tier Cards Bento Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Silver Tier */}
                        <div className="p-5 rounded-xl bg-surface-container-low/70 flex flex-col justify-between transition-transform hover:-translate-y-1 duration-200">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-surface-dim text-on-surface font-mono">TIER 01</span>
                              <span className="material-symbols-outlined text-[22px] text-outline">workspace_premium</span>
                            </div>
                            <div>
                              <h3 className="text-base font-bold font-headline text-on-surface">Hạng Bạc</h3>
                              <p className="text-[11px] font-mono font-semibold text-on-surface-variant mt-0.5">0 – 2.000 điểm</p>
                            </div>
                            <div className="h-0.5 w-8 bg-outline-variant/60 rounded-full"></div>
                            <ul className="space-y-2.5 pt-2">
                              <li className="flex items-start gap-2 text-xs text-on-surface leading-snug">
                                <span className="material-symbols-outlined text-[16px] text-tertiary shrink-0 mt-0.5">check_circle</span>
                                <span>Ưu tiên hỗ trợ lễ tân khi nhận và trả phòng</span>
                              </li>
                              <li className="flex items-start gap-2 text-xs text-on-surface leading-snug">
                                <span className="material-symbols-outlined text-[16px] text-tertiary shrink-0 mt-0.5">check_circle</span>
                                <span>Tặng voucher sinh nhật giảm 10% giá phòng</span>
                              </li>
                            </ul>
                          </div>
                          <div className="mt-6 pt-4 flex items-center justify-between text-[11px] text-on-surface-variant">
                            <span>Khách đang ở hạng này:</span>
                            <span className="font-bold text-on-surface font-mono">312 khách</span>
                          </div>
                        </div>
                        {/* Gold Tier */}
                        <div className="p-5 rounded-xl bg-secondary-fixed/30 flex flex-col justify-between transition-transform hover:-translate-y-1 duration-200 shadow-sm">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-secondary-container text-on-secondary-container font-mono">TIER 02</span>
                              <span className="material-symbols-outlined text-[22px] text-secondary">stars</span>
                            </div>
                            <div>
                              <h3 className="text-base font-bold font-headline text-secondary">Hạng Vàng</h3>
                              <p className="text-[11px] font-mono font-semibold text-on-secondary-fixed-variant mt-0.5">2.001 – 5.000 điểm</p>
                            </div>
                            <div className="h-0.5 w-8 bg-secondary/40 rounded-full"></div>
                            <ul className="space-y-2.5 pt-2">
                              <li className="flex items-start gap-2 text-xs text-on-surface leading-snug">
                                <span className="material-symbols-outlined text-[16px] text-tertiary shrink-0 mt-0.5">check_circle</span>
                                <span>Bao gồm tất cả đặc quyền Hạng Bạc</span>
                              </li>
                              <li className="flex items-start gap-2 text-xs text-on-surface leading-snug">
                                <span className="material-symbols-outlined text-[16px] text-tertiary shrink-0 mt-0.5">check_circle</span>
                                <span>Giảm 15% toàn bộ dịch vụ F&B tại nhà hàng</span>
                              </li>
                              <li className="flex items-start gap-2 text-xs text-on-surface leading-snug">
                                <span className="material-symbols-outlined text-[16px] text-tertiary shrink-0 mt-0.5">check_circle</span>
                                <span>Ưu tiên trả phòng muộn đến 14:00</span>
                              </li>
                            </ul>
                          </div>
                          <div className="mt-6 pt-4 flex items-center justify-between text-[11px] text-on-secondary-fixed-variant">
                            <span>Khách đang ở hạng này:</span>
                            <span className="font-bold text-secondary font-mono">142 khách</span>
                          </div>
                        </div>
                        {/* Diamond Tier */}
                        <div className="p-5 rounded-xl bg-primary text-on-primary flex flex-col justify-between transition-transform hover:-translate-y-1 duration-200 shadow-md">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-container text-on-primary-container font-mono">VIP TIER</span>
                              <span className="material-symbols-outlined text-[22px] text-secondary-fixed">diamond</span>
                            </div>
                            <div>
                              <h3 className="text-base font-bold font-headline text-on-primary">Hạng Kim Cương</h3>
                              <p className="text-[11px] font-mono font-semibold text-primary-fixed-dim mt-0.5">&gt; 5.000 điểm tích lũy</p>
                            </div>
                            <div className="h-0.5 w-8 bg-primary-fixed-dim/40 rounded-full"></div>
                            <ul className="space-y-2.5 pt-2">
                              <li className="flex items-start gap-2 text-xs text-surface-container-low leading-snug">
                                <span className="material-symbols-outlined text-[16px] text-tertiary-fixed shrink-0 mt-0.5">check_circle</span>
                                <span>Đưa đón sân bay Đà Nẵng 1 chiều miễn phí</span>
                              </li>
                              <li className="flex items-start gap-2 text-xs text-surface-container-low leading-snug">
                                <span className="material-symbols-outlined text-[16px] text-tertiary-fixed shrink-0 mt-0.5">check_circle</span>
                                <span>Quyền tự do chọn tầng cao & góc view theo ý</span>
                              </li>
                              <li className="flex items-start gap-2 text-xs text-surface-container-low leading-snug">
                                <span className="material-symbols-outlined text-[16px] text-tertiary-fixed shrink-0 mt-0.5">check_circle</span>
                                <span>Miễn phí bữa sáng phong cách Floating Breakfast</span>
                              </li>
                            </ul>
                          </div>
                          <div className="mt-6 pt-4 flex items-center justify-between text-[11px] text-on-primary-container">
                            <span>Khách VIP độc quyền:</span>
                            <span className="font-bold text-on-primary font-mono">29 khách</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* TAB 2: DANH MỤC ĐỔI ĐIỂM THƯỞNG */}
                  <div className="space-y-8 flex flex-col hidden" id="tab-content-rewards">
                    <div className="p-7 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-base font-bold font-headline text-primary">Bảng quà tặng & Voucher đổi điểm</h2>
                          <p className="text-xs text-on-surface-variant">Cung cấp các phần quà trải nghiệm thực tế ngay tại cơ sở lưu trú của bạn</p>
                        </div>
                        <button className="h-10 px-4 rounded-lg bg-primary-container text-on-primary text-xs font-semibold hover:bg-primary transition-colors flex items-center gap-2 self-start" type="button">
                          <span className="material-symbols-outlined text-[18px]">add_circle</span>
                          <span>Thêm phần thưởng mới</span>
                        </button>
                      </div>
                      {/* Reward Items Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Item 1: Voucher 100k */}
                        <div className="flex flex-col rounded-xl overflow-hidden bg-surface-container-low/50 transition-all hover:shadow-sm">
                          <div className="h-44 w-full relative overflow-hidden">
                            <img className="w-full h-full object-cover" data-alt="A warm and elegant boutique hotel receipt and luxury stationery resting on a polished dark teak wood surface with warm ambient lighting in Da Nang Vietnam" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgGhQD89N03vRADfTD9Rdv0AZHBAYk2AeA0pQ3gEjYcMNUzhF7gBPFda_qK0ieG91G_zKi6BGuuBKeDcWLqNeOmuI2371FPMqKm7F3qTUIAfKEGrew8bd2zWxvhBpBfFOXmXOHkCCT6xOhMi89T3zDmh52tgloi3aro4DZn-F2X1-vb078rK-I4xBcq6InRJI0A-zp6VrMxVNLB-VsuQPkov7CEsfXOz9xrtfgEAfw3LV8DM1dwP3B" />
                            <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold bg-primary text-on-primary shadow-sm">Giảm trừ phòng</span>
                            <span className="absolute bottom-3 right-3 px-3 py-1 rounded-lg text-xs font-extrabold bg-surface-container-lowest text-primary font-mono shadow-sm">1.000 Điểm</span>
                          </div>
                          <div className="p-5 flex flex-col justify-between flex-1 gap-4">
                            <div className="space-y-1.5">
                              <h3 className="text-sm font-bold text-on-surface">Voucher giảm 100.000 ₫ trừ trực tiếp</h3>
                              <p className="text-xs text-on-surface-variant line-clamp-2">Áp dụng trực tiếp vào tổng hóa đơn phòng cho lần lưu trú tiếp theo. Không giới hạn số lượng cộng dồn.</p>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                              <span className="text-[11px] text-on-surface-variant flex items-center gap-1 font-medium">
                                <span className="material-symbols-outlined text-[16px] text-tertiary">check</span>
                                Đã đổi 64 lượt tháng này
                              </span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input defaultChecked={true} className="sr-only peer" type="checkbox" />
                                <div className="w-9 h-5 bg-surface-dim peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-container"></div>
                              </label>
                            </div>
                          </div>
                        </div>
                        {/* Item 2: Nâng hạng phòng */}
                        <div className="flex flex-col rounded-xl overflow-hidden bg-surface-container-low/50 transition-all hover:shadow-sm">
                          <div className="h-44 w-full relative overflow-hidden">
                            <img className="w-full h-full object-cover" data-alt="A spacious luxury hotel suite bedroom overlooking a tranquil sunlit river in Vietnam, pristine crisp white linen bed, sheer linen curtains, warm morning light, Coastal Blue accents" src="https://lh3.googleusercontent.com/aida-public/AB6AXuClTXHy46ejUM0oKUF49BECZpZLTDXxkSXCRbIZE1cwlp-fPbTR-XG7oQ5nF_eBMIikL2IAyTrzf8l3pspf79GGhAc0l1GrXZarXhnIu0tIJ_KsRphbMIeq4xfVAPUKkv3xcdNqjk2DK7wQFqX0P9Dvuhx3TWv35CHsJhm8G9JAamBXH1g3pJtDbggW273HsVzoyvkVxsD8tIOIJsYQB11NpIjZ-Iqq3moMVFI1E-zwVnHGZ0AYdL1d" />
                            <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold bg-secondary text-on-secondary shadow-sm">Nâng cấp lưu trú</span>
                            <span className="absolute bottom-3 right-3 px-3 py-1 rounded-lg text-xs font-extrabold bg-surface-container-lowest text-secondary font-mono shadow-sm">2.000 Điểm</span>
                          </div>
                          <div className="p-5 flex flex-col justify-between flex-1 gap-4">
                            <div className="space-y-1.5">
                              <h3 className="text-sm font-bold text-on-surface">Miễn phí nâng hạng phòng Suite View Sông</h3>
                              <p className="text-xs text-on-surface-variant line-clamp-2">Nâng cấp từ hạng Deluxe lên Riverfront Executive Suite. Phụ thuộc vào tình trạng phòng trống tại thời điểm nhận phòng.</p>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                              <span className="text-[11px] text-on-surface-variant flex items-center gap-1 font-medium">
                                <span className="material-symbols-outlined text-[16px] text-tertiary">check</span>
                                Đã đổi 28 lượt tháng này
                              </span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input defaultChecked={true} className="sr-only peer" type="checkbox" />
                                <div className="w-9 h-5 bg-surface-dim peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-container"></div>
                              </label>
                            </div>
                          </div>
                        </div>
                        {/* Item 3: Trà chiều thảo mộc */}
                        <div className="flex flex-col rounded-xl overflow-hidden bg-surface-container-low/50 transition-all hover:shadow-sm">
                          <div className="h-44 w-full relative overflow-hidden">
                            <img className="w-full h-full object-cover" data-alt="Artisanal high tea set with ceramic teaware on a balcony overlooking the Han River in Danang, delicate Vietnamese herbal tea pastries, soft afternoon golden hour light" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBBqxq8u6EMQL8OBLfdN_Y7R_zMZ_f4Li-hnKIUwzANdxk1XyQXbKd-sQ4OoV9aEaATRLiBc_FOzpPL5fgEVlcwybLK2mC27l8ZnVwt_78_CHAsqyIH1Are5kUnO9Edi1WHs9nj0L8CpGiMqex6qc7Fc0vyfnadj4-NFgEXb0JnJKHAarf7b4oANKf7Tj2t1OMh6ZcWpPRu5QxQ6wqPK3jgrsswjxvK2-lRSBWN9qh1wp8f0CglPO2e" />
                            <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold bg-tertiary text-on-tertiary shadow-sm">Ẩm thực Sky Lounge</span>
                            <span className="absolute bottom-3 right-3 px-3 py-1 rounded-lg text-xs font-extrabold bg-surface-container-lowest text-tertiary font-mono shadow-sm">1.200 Điểm</span>
                          </div>
                          <div className="p-5 flex flex-col justify-between flex-1 gap-4">
                            <div className="space-y-1.5">
                              <h3 className="text-sm font-bold text-on-surface">01 Set Trà chiều Thảo mộc Cù Lao Chàm</h3>
                              <p className="text-xs text-on-surface-variant line-clamp-2">Trị giá 250.000 ₫ tại Sky Lounge tầng 12, kèm mứt gừng sấy dẻo và bánh thủ công địa phương.</p>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                              <span className="text-[11px] text-on-surface-variant flex items-center gap-1 font-medium">
                                <span className="material-symbols-outlined text-[16px] text-tertiary">check</span>
                                Đã đổi 43 lượt tháng này
                              </span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input defaultChecked={true} className="sr-only peer" type="checkbox" />
                                <div className="w-9 h-5 bg-surface-dim peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-container"></div>
                              </label>
                            </div>
                          </div>
                        </div>
                        {/* Item 4: Early Check-in */}
                        <div className="flex flex-col rounded-xl overflow-hidden bg-surface-container-low/50 transition-all hover:shadow-sm">
                          <div className="h-44 w-full relative overflow-hidden bg-surface-container-high flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2 text-primary">
                              <span className="material-symbols-outlined text-[52px]">schedule</span>
                              <span className="text-xs font-bold uppercase tracking-wider">Early Arrival</span>
                            </div>
                            <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold bg-on-surface-variant text-surface shadow-sm">Dịch vụ nhận phòng</span>
                            <span className="absolute bottom-3 right-3 px-3 py-1 rounded-lg text-xs font-extrabold bg-surface-container-lowest text-primary font-mono shadow-sm">800 Điểm</span>
                          </div>
                          <div className="p-5 flex flex-col justify-between flex-1 gap-4">
                            <div className="space-y-1.5">
                              <h3 className="text-sm font-bold text-on-surface">Miễn phí nhận phòng sớm 2 tiếng</h3>
                              <p className="text-xs text-on-surface-variant line-clamp-2">Khách có thể check-in từ 12:00 trưa thay vì 14:00 tiêu chuẩn, kèm nước trà hibiscus đón tiếp.</p>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                              <span className="text-[11px] text-on-surface-variant flex items-center gap-1 font-medium">
                                <span className="material-symbols-outlined text-[16px] text-tertiary">check</span>
                                Đã đổi 51 lượt tháng này
                              </span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input defaultChecked={true} className="sr-only peer" type="checkbox" />
                                <div className="w-9 h-5 bg-surface-dim peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-container"></div>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* TAB 3: THỐNG KÊ TỆP DU KHÁCH THÂN THIẾT */}
                  <div className="space-y-6 flex flex-col hidden" id="tab-content-members">
                    <div className="p-7 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-base font-bold font-headline text-primary">Danh sách Du khách Hội viên gần đây</h2>
                          <p className="text-xs text-on-surface-variant">483 hội viên đăng ký nhận diện qua số điện thoại và email</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button className="h-9 px-3.5 rounded-lg bg-surface-container-low text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-1.5" type="button">
                            <span className="material-symbols-outlined text-[16px]">download</span>
                            <span>Xuất Excel</span>
                          </button>
                        </div>
                      </div>
                      {/* Table View */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-surface-container-low text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider">
                              <th className="py-3 px-4 rounded-l-lg">Khách hàng</th>
                              <th className="py-3 px-4">Hạng hiện tại</th>
                              <th className="py-3 px-4">Điểm khả dụng</th>
                              <th className="py-3 px-4">Lượt lưu trú</th>
                              <th className="py-3 px-4">Lần cuối ghé thăm</th>
                              <th className="py-3 px-4 text-right rounded-r-lg">Hành động</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y-0 text-on-surface">
                            <tr className="hover:bg-surface-container-low/50 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">NL</div>
                                  <div>
                                    <p className="font-bold text-xs text-on-surface">Nguyễn Hoàng Lan</p>
                                    <p className="text-[11px] text-on-surface-variant">0905 ••• 812</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-on-primary">KIM CƯƠNG</span>
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-primary">6.420 pts</td>
                              <td className="py-3.5 px-4 font-mono">8 lần</td>
                              <td className="py-3.5 px-4 text-on-surface-variant">3 ngày trước</td>
                              <td className="py-3.5 px-4 text-right">
                                <button className="text-primary hover:text-secondary font-semibold text-xs" type="button">Chi tiết</button>
                              </td>
                            </tr>
                            <tr className="hover:bg-surface-container-low/50 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container font-bold flex items-center justify-center text-xs">TH</div>
                                  <div>
                                    <p className="font-bold text-xs text-on-surface">Trần Minh Hoàng</p>
                                    <p className="text-[11px] text-on-surface-variant">0912 ••• 440</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary-container text-on-secondary-container">HẠNG VÀNG</span>
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-primary">3.150 pts</td>
                              <td className="py-3.5 px-4 font-mono">4 lần</td>
                              <td className="py-3.5 px-4 text-on-surface-variant">2 tuần trước</td>
                              <td className="py-3.5 px-4 text-right">
                                <button className="text-primary hover:text-secondary font-semibold text-xs" type="button">Chi tiết</button>
                              </td>
                            </tr>
                            <tr className="hover:bg-surface-container-low/50 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-surface-dim text-on-surface font-bold flex items-center justify-center text-xs">PA</div>
                                  <div>
                                    <p className="font-bold text-xs text-on-surface">Phạm Phương Anh</p>
                                    <p className="text-[11px] text-on-surface-variant">0988 ••• 209</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-dim text-on-surface">HẠNG BẠC</span>
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-primary">1.100 pts</td>
                              <td className="py-3.5 px-4 font-mono">2 lần</td>
                              <td className="py-3.5 px-4 text-on-surface-variant">1 tháng trước</td>
                              <td className="py-3.5 px-4 text-right">
                                <button className="text-primary hover:text-secondary font-semibold text-xs" type="button">Chi tiết</button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Right Column: Thống kê nhanh & Hiệu quả kinh doanh */}
                <div className="xl:col-span-4 flex flex-col gap-6">
                  {/* Main Stats Card */}
                  <div className="p-6 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-6">
                    <div className="flex items-center justify-between pb-2">
                      <h3 className="text-sm font-bold font-headline text-primary uppercase tracking-wide">Hiệu quả Tri ân Khách hàng</h3>
                      <span className="material-symbols-outlined text-secondary text-[20px]">insights</span>
                    </div>
                    {/* Key Stat 1 */}
                    <div className="p-4 rounded-xl bg-surface-container-low/60 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-on-surface-variant">Hội viên đã quay lại lưu trú</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-extrabold font-headline text-primary">142</span>
                          <span className="text-xs font-semibold text-on-surface-variant">du khách</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[24px]">repeat</span>
                      </div>
                    </div>
                    {/* Key Stat 2 */}
                    <div className="p-4 rounded-xl bg-surface-container-low/60 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-on-surface-variant">Đánh giá 5 sao từ khách thân thiết</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-extrabold font-headline text-secondary">86%</span>
                          <span className="text-xs font-medium text-tertiary flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                            +4.2%
                          </span>
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-secondary text-on-secondary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[24px]">grade</span>
                      </div>
                    </div>
                    {/* Key Stat 3 with Chart Visualization */}
                    <div className="p-4 rounded-xl bg-tertiary-fixed/30 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-on-tertiary-fixed-variant">Tỷ lệ giữ chân khách (Retention)</p>
                          <p className="text-2xl font-extrabold font-headline text-tertiary mt-1">+18.5%</p>
                        </div>
                        <span className="text-[11px] font-semibold text-tertiary bg-surface-container-lowest px-2.5 py-1 rounded-full shadow-sm">Vs cùng kỳ</span>
                      </div>
                      {/* Retention mini inline SVG trend */}
                      <div className="w-full pt-2">
                        <svg className="w-full h-12 stroke-current text-tertiary fill-none" preserveAspectRatio="none" viewBox="0 0 200 45">
                          <path d="M0,35 Q30,32 60,25 T120,18 T170,10 T200,4" strokeLinecap="round" strokeWidth="2.5"></path>
                          <path className="fill-current text-tertiary/10" d="M0,35 Q30,32 60,25 T120,18 T170,10 T200,4 L200,45 L0,45 Z" strokeWidth="0"></path>
                        </svg>
                      </div>
                      <p className="text-[11px] text-on-tertiary-fixed-variant leading-relaxed">Du khách thuộc chương trình hội viên đặt phòng trực tiếp nhiều hơn 2.4 lần so với kênh OTA.</p>
                    </div>
                    {/* Distribution Progress Bar */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-on-surface">Cơ cấu hạng hội viên</span>
                        <span className="text-on-surface-variant font-mono">483 tổng số</span>
                      </div>
                      <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden flex">
                        <div className="bg-outline text-transparent h-full transition-all" style={{"width":"65%"}} title="Hạng Bạc: 65%"></div>
                        <div className="bg-secondary text-transparent h-full transition-all" style={{"width":"29%"}} title="Hạng Vàng: 29%"></div>
                        <div className="bg-primary text-transparent h-full transition-all" style={{"width":"6%"}} title="Hạng Kim Cương: 6%"></div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-outline"></span>
                          <span>Bạc (65%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-secondary"></span>
                          <span>Vàng (29%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                          <span>Kim Cương (6%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* AI Recommendation Prompt Card */}
                  <div className="p-6 rounded-xl bg-primary text-on-primary shadow-sm flex flex-col gap-4 relative overflow-hidden">
                    <div className="flex items-center gap-2 text-secondary-fixed">
                      <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                      <span className="text-xs font-bold uppercase tracking-wider">StayReco AI Gợi ý</span>
                    </div>
                    <p className="text-xs text-primary-fixed leading-relaxed">
                      Dịp nghỉ lễ tới, có
                      <strong className="text-on-primary">24 khách Hạng Vàng</strong>
                      đã không quay lại hơn 6 tháng. Đề xuất gửi tin nhắn Zalo ZNS tặng kèm set trà chiều để kích hoạt lại đặt phòng!
                    </p>
                    <button className="h-10 w-full px-4 rounded-lg bg-surface-container-lowest text-primary text-xs font-bold hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2 mt-2" type="button">
                      <span>Tạo chiến dịch kích hoạt lại</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
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
