/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Legacy DOM-driven screen pending React state migration.
import React from 'react';

export default function ManagerRevenueTransactions() {
  React.useEffect(() => {
    try {
      function showToast(message, icon = 'check_circle') {
      const toast = document.getElementById('toast-notify');
      const msg = document.getElementById('toast-msg');
      const iconEl = document.getElementById('toast-icon');
      if (!toast || !msg || !iconEl) return;

      msg.innerText = message;
      iconEl.innerText = icon;
      toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');

      setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
      }, 3200);
    }

    function exportReconciliationPDF() {
      showToast('Đang kết xuất Biên lai Đối soát #SR-261020-0842 (PDF)...', 'downloading');
      setTimeout(() => {
        showToast('Tải xuống thành công file: Bien_lai_SR-261020-0842.pdf', 'file_download_done');
      }, 1400);
    }

    function queryVNPayGateway() {
      showToast('Đang truy vấn trạng thái chuẩn chi VNPay Gateway: VNP142981023...', 'sync');
      setTimeout(() => {
        showToast('Cổng VNPay xác nhận: Giao dịch thành công (Mã phản hồi: 00)', 'verified');
      }, 1200);
    }

    function copyBankAccount() {
      navigator.clipboard.writeText('0401988234').then(() => {
        showToast('Đã sao chép số tài khoản Vietcombank: 0401988234', 'content_copy');
      }).catch(() => {
        showToast('Đã chọn STK: 0401988234', 'content_copy');
      });
    }

    function refreshLedger() {
      showToast('Đã đồng bộ lại dữ liệu Sổ cái kiểm toán mới nhất', 'refresh');
    }
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
            <span className="">Tổng quan & Tăng trưởng</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" data-path="duyet-ho-so-doi-tac" href="#">
            <span className="material-symbols-outlined text-xl">verified_user</span>
            <span className="">Duyệt hồ sơ đối tác</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" data-path="giam-sat-doi-tac" href="#">
            <span className="material-symbols-outlined text-xl">storefront</span>
            <span className="">Giám sát đối tác</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" data-path="tuan-thu-&-vi-pham" href="#">
            <span className="material-symbols-outlined text-xl">gavel</span>
            <span className="">Tuân thủ & Vi phạm</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-surface-container-low hover:text-on-surface transition-colors bg-primary-container text-on-primary" data-path="doanh-thu-&-hoa-hong" href="#">
            <span className="material-symbols-outlined text-xl">payments</span>
            <span className="">Doanh thu & Hoa hồng</span>
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
            {/* Interactive Toast Notification Component (Self-contained) */}
            <div className="fixed bottom-6 right-6 z-50 transform translate-y-20 opacity-0 transition-all duration-300 pointer-events-none bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm" id="toast-notify">
              <span className="material-symbols-outlined text-tertiary-fixed text-xl" id="toast-icon">check_circle</span>
              <span id="toast-msg" className="">Thao tác thành công</span>
            </div>
            <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto w-full">
              {/* 1. Breadcrumbs & Top Quick Navigation */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs md:text-sm text-on-surface-variant font-medium">
                  <a className="hover:text-primary transition-colors flex items-center gap-1.5" href="#">
                    <span className="material-symbols-outlined text-base">dashboard</span>
                    <span className="">Quản trị nền tảng</span>
                  </a>
                  <span className="material-symbols-outlined text-xs text-outline-variant">chevron_right</span>
                  <a className="hover:text-primary transition-colors" href="#">Báo cáo Doanh thu & Đối soát (M06)</a>
                  <span className="material-symbols-outlined text-xs text-outline-variant">chevron_right</span>
                  <a className="hover:text-primary transition-colors flex items-center gap-1" href="#">
                    <span className="material-symbols-outlined text-sm">apartment</span>
                    <span className="">An Nhiên Riverside Hotel (#ANR-DN-01) (M06a)</span>
                  </a>
                  <span className="material-symbols-outlined text-xs text-outline-variant">chevron_right</span>
                  <span className="text-primary font-semibold">Chi tiết giao dịch #SR-261020-0842</span>
                </nav>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-tertiary-container text-on-tertiary-container flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed animate-pulse"></span>
                    Ký quỹ Escrow an toàn
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface-container-high text-on-surface-variant">Batch: #SETTLE-W43-DN</span>
                </div>
              </div>
              {/* 2. Header & Action Controls */}
              <div className="p-4 rounded-xl bg-surface-container-low flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-0">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-surface-container-lowest text-primary flex items-center justify-center font-bold text-xl shadow-sm shrink-0">
                    <span className="material-symbols-outlined text-2xl">apartment</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-on-surface text-base">Khách sạn An Nhiên Riverside Hotel</span>
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-primary-fixed text-on-primary-fixed">#ANR-DN-01</span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-tertiary-container text-on-tertiary-container flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed"></span>
                        Hợp tác chính thức
                      </span>
                    </div>
                    <div className="text-xs text-on-surface-variant flex flex-wrap items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-secondary">
                        <span className="material-symbols-outlined text-xs">location_on</span>
                        128 Đường Bạch Đằng, P. Hải Châu 1, Q. Hải Châu, TP. Đà Nẵng
                      </span>
                      <span className="text-outline-variant">•</span>
                      <span className="">
                        Kỳ đối soát:
                        <strong className="text-on-surface">Tháng 10/2026 (W43)</strong>
                      </span>
                      <span className="text-outline-variant">•</span>
                      <span className="">
                        Chu kỳ thanh toán:
                        <strong className="text-on-surface">Thứ Hai hàng tuần</strong>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs">
                  <div className="p-2.5 rounded-lg bg-surface-container-lowest shadow-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">account_balance</span>
                    <div>
                      <span className="text-[11px] text-on-surface-variant block">Tài khoản Escrow VCB</span>
                      <span className="font-mono font-bold text-primary">0401988234</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-2">
                <div className="space-y-2 max-w-3xl">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl md:text-3xl font-bold font-headline text-primary tracking-tight">Chi tiết Dòng tiền & Phân rã Khấu trừ Giao dịch</h1>
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-primary-fixed text-on-primary-fixed">#SR-261020-0842</span>
                  </div>
                  <p className="text-sm md:text-base text-on-surface-variant leading-relaxed">Bóc tách từng bước số tiền vào/ra của hệ thống, luồng chuyển tiền qua cổng thanh toán, chiết khấu voucher sàn/đối tác và hoa hồng thực thu của StayReco.</p>
                </div>
                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <a className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-surface-container-low text-on-surface hover:bg-surface-container transition-all flex items-center gap-2" href="#">
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    <span className="">Quay lại Khách sạn (M06a)</span>
                  </a>
                  <button className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-surface-container-lowest text-primary hover:bg-surface-container-low shadow-sm transition-all flex items-center gap-2" onClick={() => { if (typeof window !== 'undefined') { try { queryVNPayGateway(); } catch(e) { console.error(e); } } }}>
                    <span className="material-symbols-outlined text-lg text-primary-container">sync</span>
                    <span className="">Truy vấn cổng VNPay</span>
                  </button>
                  <button className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary-container text-on-primary hover:bg-primary transition-all shadow-sm flex items-center gap-2" onClick={() => { if (typeof window !== 'undefined') { try { exportReconciliationPDF(); } catch(e) { console.error(e); } } }}>
                    <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                    <span className="">Xuất biên lai đối soát PDF</span>
                  </button>
                </div>
              </div>
              {/* 3. KHỐI TỔNG HỢP SỐ TIỀN VÀO - RA HỆ THỐNG (4 Thẻ KPI Bento) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                {/* KPI Card 1: Thực thu khách */}
                <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant/90">Thực thu từ du khách (Dòng vào)</span>
                    <div className="w-8 h-8 rounded-lg bg-surface-container-low text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">arrow_downward_alt</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl md:text-3xl font-bold font-headline text-on-surface tracking-tight">
                      2.250.000
                      <span className="text-lg font-normal text-on-surface-variant">₫</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-on-surface-variant">
                      <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                      <span className="font-medium text-tertiary">Cổng VNPay thành công</span>
                      <span className="text-outline-variant">•</span>
                      <span className="">Đã gồm VAT</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/20"></div>
                </div>
                {/* KPI Card 2: Giảm trừ voucher */}
                <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant/90">Tổng giảm trừ Voucher / Ưu đãi</span>
                    <div className="w-8 h-8 rounded-lg bg-secondary-fixed text-secondary flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">local_activity</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl md:text-3xl font-bold font-headline text-secondary tracking-tight">
                      -250.000
                      <span className="text-lg font-normal text-secondary/80">₫</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-on-surface-variant">
                      <span className="font-mono font-medium text-secondary">ANHNIEN250</span>
                      <span className="text-outline-variant">•</span>
                      <span className="truncate">Đối tác tài trợ 100%</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary/30"></div>
                </div>
                {/* KPI Card 3: Hoa hồng StayReco */}
                <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant/90">Hoa hồng sàn StayReco (6.0%)</span>
                    <div className="w-8 h-8 rounded-lg bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">percent</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl md:text-3xl font-bold font-headline text-primary tracking-tight">
                      +135.000
                      <span className="text-lg font-normal text-on-surface-variant">₫</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-on-surface-variant">
                      <span className="">Doanh thu thuần:</span>
                      <span className="font-semibold text-primary">2.250.000 ₫ × 6%</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary"></div>
                </div>
                {/* KPI Card 4: Nghĩa vụ chi trả đối tác */}
                <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant/90">Nghĩa vụ chi trả đối tác (Dòng ra)</span>
                    <div className="w-8 h-8 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">payments</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl md:text-3xl font-bold font-headline text-tertiary tracking-tight">
                      2.115.000
                      <span className="text-lg font-normal text-tertiary/80">₫</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-sm text-tertiary">calendar_today</span>
                      <span className="">Thanh toán Thứ Hai 25/10/2026</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-tertiary"></div>
                </div>
              </div>
              {/* 4. BẢNG PHÂN RÃ BƯỚC KHẤU TRỪ THANH TOÁN (STEP-BY-STEP BREAKDOWN) */}
              <section className="bg-surface-container-lowest rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-secondary">Quy trình Hạch toán & Đối soát</div>
                    <h2 className="text-xl font-bold font-headline text-on-surface">Luồng phân rã khấu trừ thanh toán 5 bước</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant">Mô hình: Escrow Bảo Chứng</span>
                  </div>
                </div>
                {/* Stepper / Waterfall Visualization Card Container */}
                <div className="space-y-4">
                  {/* Step 1 */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between p-4 md:p-5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-surface-container-lowest text-primary flex items-center justify-center font-bold text-base shadow-sm shrink-0">01</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-on-surface text-base">Giá gốc niêm yết phòng (Gross Room Rate)</span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-container-high text-on-surface-variant">100% Giá chuẩn</span>
                        </div>
                        <p className="text-xs md:text-sm text-on-surface-variant mt-1">2 đêm × 1.250.000 ₫/đêm cho phòng Deluxe River View (Bao gồm VAT 8% và phí dịch vụ lưu trú).</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 lg:pl-6">
                      <div className="text-xl font-bold font-headline text-on-surface tabular-nums">2.500.000 ₫</div>
                      <div className="text-xs text-on-surface-variant">Tổng giá trị ban đầu</div>
                    </div>
                  </div>
                  {/* Step 2 */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between p-4 md:p-5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-secondary flex items-center justify-center font-bold text-base shadow-sm shrink-0">02</div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-on-surface text-base">Áp dụng Voucher Ưu đãi Đối tác</span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-secondary text-on-secondary">Mã: ANHNIEN250</span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-surface-container-high text-on-surface-variant">Đối tác chi trả</span>
                        </div>
                        <p className="text-xs md:text-sm text-on-surface-variant mt-1">Giảm trừ trực tiếp do Khách sạn An Nhiên Riverside tài trợ 100% (-250.000 ₫). Sàn StayReco không trích quỹ trợ giá.</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 lg:pl-6">
                      <div className="text-xl font-bold font-headline text-secondary tabular-nums">-250.000 ₫</div>
                      <div className="text-xs text-secondary/80">Khấu trừ tài trợ đối tác</div>
                    </div>
                  </div>
                  {/* Step 3 */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between p-4 md:p-5 rounded-xl bg-primary-fixed/20 hover:bg-primary-fixed/30 transition-colors gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-bold text-base shadow-sm shrink-0">03</div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-on-surface text-base">Số tiền khách thanh toán qua VNPay Gateway</span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-tertiary text-on-tertiary">Đã nhận tiền</span>
                          <span className="text-xs font-mono text-on-surface-variant">Mã GD: VNP142981023</span>
                        </div>
                        <p className="text-xs md:text-sm text-on-surface-variant mt-1">Đã hạch toán vào Tài khoản phong tỏa ký quỹ StayReco Escrow Account lúc 09:22:15 ngày 20/10/2026. Phí cổng do sàn chi trả.</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 lg:pl-6">
                      <div className="text-xl font-bold font-headline text-primary tabular-nums">2.250.000 ₫</div>
                      <div className="text-xs text-primary font-medium">Thực nhận ký quỹ</div>
                    </div>
                  </div>
                  {/* Step 4 */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between p-4 md:p-5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-surface-container-lowest text-primary-container flex items-center justify-center font-bold text-base shadow-sm shrink-0">04</div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-on-surface text-base">Trích khấu trừ Phí hoa hồng nền tảng StayReco</span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-primary-fixed text-on-primary-fixed">Take-rate 6.0%</span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-surface-container-high text-on-surface-variant">Hóa đơn điện tử #INV-SR-9410</span>
                        </div>
                        <p className="text-xs md:text-sm text-on-surface-variant mt-1">Tính trên doanh số thực thu sau khuyến mại (2.250.000 ₫ × 6.0%). Sàn giữ lại, tự động xuất hóa đơn GTGT dịch vụ sàn cho khách sạn.</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 lg:pl-6">
                      <div className="text-xl font-bold font-headline text-primary tabular-nums">+135.000 ₫</div>
                      <div className="text-xs text-on-surface-variant">Phí sàn giữ lại</div>
                    </div>
                  </div>
                  {/* Step 5 (Final Net Payout) */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between p-5 rounded-xl bg-tertiary/10 hover:bg-tertiary/15 transition-colors gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-tertiary text-on-tertiary flex items-center justify-center font-bold text-base shadow-sm shrink-0">05</div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-tertiary text-base">Quyết toán ròng giải ngân cho Khách sạn (Net Payout)</span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-tertiary text-on-tertiary">Đã khớp lệnh đối soát</span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-container-lowest text-on-surface">Lệnh chi 25/10/2026</span>
                        </div>
                        <p className="text-xs md:text-sm text-on-surface-variant mt-1">Công thức: [Số tiền khách thanh toán 2.250.000 ₫] - [Hoa hồng StayReco 135.000 ₫] = 2.115.000 ₫. Sẵn sàng giải ngân sau khi khách check-out hoàn tất.</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 lg:pl-6">
                      <div className="text-2xl font-bold font-headline text-tertiary tabular-nums">2.115.000 ₫</div>
                      <div className="text-xs font-semibold text-tertiary">Số dư chuyển khoản thực tế</div>
                    </div>
                  </div>
                </div>
              </section>
              {/* 5. BỐ CỤC 2 CỘT CHI TIẾT (65% / 35%) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Cột Trái (65% - 8 cols trên desktop) */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Thông tin Đặt phòng & Người dùng */}
                  <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-6">
                    <div className="flex items-center justify-between pb-3">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl">book_online</span>
                        <h3 className="text-base font-bold text-on-surface">Hồ sơ Đặt phòng & Thực đơn Lưu trú</h3>
                      </div>
                      <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-surface-container-low text-on-surface-variant">
                        <span className="flex items-center gap-1 text-tertiary">
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
                          Đang lưu trú (20/10 - 22/10/2026)
                        </span>
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Customer Card */}
                      <div className="p-4 rounded-xl bg-surface-container-low space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase text-on-surface-variant">Khách lưu trú</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-variant text-on-surface">Hạng Bạc (Silver)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed font-bold text-sm">MA</div>
                          <div>
                            <div className="font-bold text-sm text-on-surface">Nguyễn Minh Anh</div>
                            <div className="text-xs text-on-surface-variant">ID: SR-99482 • 0918 ••• 882</div>
                          </div>
                        </div>
                        <div className="text-xs text-on-surface-variant pt-1 flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-tertiary">verified</span>
                          <span className="">CCCD đã xác thực định danh VNeID</span>
                        </div>
                      </div>
                      {/* Room Details Card */}
                      <div className="p-4 rounded-xl bg-surface-container-low space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase text-on-surface-variant">Chi tiết phòng</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container-highest text-on-surface">Phòng #608</span>
                        </div>
                        <div>
                          <div className="font-bold text-sm text-on-surface">Deluxe River View (Tầng 6)</div>
                          <div className="text-xs text-on-surface-variant">2 người lớn • Gồm bữa sáng buffet hàng ngày</div>
                        </div>
                        <div className="text-xs text-on-surface-variant pt-1 flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-primary">badge</span>
                          <span className="">Lễ tân hỗ trợ: Nguyễn Hương Ly</span>
                        </div>
                      </div>
                    </div>
                    {/* Stay timeline details */}
                    <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <span className="material-symbols-outlined text-primary text-xl">login</span>
                        <div>
                          <div className="font-semibold text-on-surface">Nhận phòng (Check-in)</div>
                          <div className="text-on-surface-variant">14:15 • 20/10/2026 (Thứ Ba)</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-on-surface-variant font-medium px-3 py-1 bg-surface-container-low rounded-full">
                        <span className="">2 đêm lưu trú trọn gói</span>
                      </div>
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <span className="material-symbols-outlined text-secondary text-xl">logout</span>
                        <div>
                          <div className="font-semibold text-on-surface">Trả phòng (Check-out)</div>
                          <div className="text-on-surface-variant">Dự kiến 12:00 • 22/10/2026 (Thứ Năm)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Bảng Nhật ký Dòng tiền hệ thống (System Ledger Audit Log) */}
                  <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-xl">account_balance_wallet</span>
                          <h3 className="text-base font-bold text-on-surface">Sổ cái Kiểm toán Dòng tiền (System Ledger Audit Log)</h3>
                        </div>
                        <p className="text-xs text-on-surface-variant">Bảo chứng tính minh bạch theo tiêu chuẩn bảo mật thanh toán tài chính PCI-DSS & HMAC-SHA512.</p>
                      </div>
                      <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors" onClick={() => { if (typeof window !== 'undefined') { try { refreshLedger(); } catch(e) { console.error(e); } } }} title="Làm mới sổ cái">
                        <span className="material-symbols-outlined text-lg">refresh</span>
                      </button>
                    </div>
                    {/* Ledger Table */}
                    <div className="overflow-x-auto rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-surface-container text-on-surface-variant font-semibold">
                          <tr>
                            <th className="p-3">Thời gian (VN)</th>
                            <th className="p-3">Loại bút toán</th>
                            <th className="p-3">Tài khoản ghi nợ/có</th>
                            <th className="p-3">Số tiền</th>
                            <th className="p-3">Mã Hash giao dịch</th>
                            <th className="p-3 text-right">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container-low text-on-surface">
                          {/* Row 1 */}
                          <tr className="hover:bg-surface-container-low transition-colors">
                            <td className="p-3 whitespace-nowrap text-on-surface-variant font-mono">20/10/2026 09:22:15</td>
                            <td className="p-3 font-semibold text-primary">CREDIT (Khách trả)</td>
                            <td className="p-3">VNPay Gateway → StayReco Escrow</td>
                            <td className="p-3 font-bold text-on-surface tabular-nums">+2.250.000 ₫</td>
                            <td className="p-3 font-mono text-[11px] text-on-surface-variant truncate max-w-[120px]" title="0x7f9a12c8b9d4e5f1">0x7f9a...e5f1</td>
                            <td className="p-3 text-right">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-tertiary-container text-on-tertiary-container">ĐÃ KHỚP</span>
                            </td>
                          </tr>
                          {/* Row 2 */}
                          <tr className="hover:bg-surface-container-low transition-colors">
                            <td className="p-3 whitespace-nowrap text-on-surface-variant font-mono">20/10/2026 09:22:16</td>
                            <td className="p-3 font-semibold text-secondary">VOUCHER_ADJUST</td>
                            <td className="p-3">Hotel Subsidy Ledger (#ANR-DN-01)</td>
                            <td className="p-3 font-bold text-secondary tabular-nums">-250.000 ₫</td>
                            <td className="p-3 font-mono text-[11px] text-on-surface-variant truncate max-w-[120px]" title="0x8a1b34e2c7a9f0d3">0x8a1b...f0d3</td>
                            <td className="p-3 text-right">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-container-high text-on-surface-variant">GHI NHẬN</span>
                            </td>
                          </tr>
                          {/* Row 3 */}
                          <tr className="hover:bg-surface-container-low transition-colors">
                            <td className="p-3 whitespace-nowrap text-on-surface-variant font-mono">20/10/2026 09:22:18</td>
                            <td className="p-3 font-semibold text-primary">COMMISSION_FEE</td>
                            <td className="p-3">StayReco Escrow → Operating Account</td>
                            <td className="p-3 font-bold text-primary tabular-nums">+135.000 ₫</td>
                            <td className="p-3 font-mono text-[11px] text-on-surface-variant truncate max-w-[120px]" title="0x3c2d58f4a1e9b7a2">0x3c2d...b7a2</td>
                            <td className="p-3 text-right">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-fixed text-on-primary-fixed">TRÍCH THU</span>
                            </td>
                          </tr>
                          {/* Row 4 */}
                          <tr className="hover:bg-surface-container-low transition-colors">
                            <td className="p-3 whitespace-nowrap text-on-surface-variant font-mono">20/10/2026 09:23:00</td>
                            <td className="p-3 font-semibold text-tertiary">PAYOUT_SCHEDULED</td>
                            <td className="p-3">Escrow Allocation → VCB 0401988234</td>
                            <td className="p-3 font-bold text-tertiary tabular-nums">2.115.000 ₫</td>
                            <td className="p-3 font-mono text-[11px] text-on-surface-variant truncate max-w-[120px]" title="0x9e4b11f7c2d8a3e0">0x9e4b...a3e0</td>
                            <td className="p-3 text-right">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-tertiary-fixed text-on-tertiary-fixed">CHỜ GIẢI NGÂN</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                {/* Cột Phải (35% - 4 cols trên desktop) */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Hộp thông tin Đối tác thụ hưởng */}
                  <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between pb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Đối tác thụ hưởng</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-tertiary-container text-on-tertiary-container">Hợp tác chính thức</span>
                    </div>
                    {/* Hotel brand identity mini */}
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-2xl">apartment</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface text-base">Khách sạn An Nhiên Riverside</h4>
                        <div className="text-xs text-on-surface-variant font-mono mt-0.5">Mã đối tác: #ANR-DN-01</div>
                        <div className="flex items-center gap-1 text-xs text-secondary mt-1">
                          <span className="material-symbols-outlined text-xs">location_on</span>
                          <span className="">Bạch Đằng, Hải Châu, Đà Nẵng</span>
                        </div>
                      </div>
                    </div>
                    {/* Bank Account Details Card */}
                    <div className="p-4 rounded-xl bg-surface-container-low space-y-2.5">
                      <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Tài khoản nhận thanh toán</div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-on-surface-variant">Ngân hàng:</span>
                        <span className="text-xs font-semibold text-on-surface">Vietcombank (VCB)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-on-surface-variant">Chi nhánh:</span>
                        <span className="text-xs font-semibold text-on-surface">Chi nhánh Đà Nẵng</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-on-surface-variant">Số tài khoản:</span>
                        <span className="text-xs font-mono font-bold text-primary flex items-center gap-1">
                          0401988234
                          <button className="hover:text-primary-container" onClick={() => { if (typeof window !== 'undefined') { try { copyBankAccount(); } catch(e) { console.error(e); } } }} title="Sao chép STK">
                            <span className="material-symbols-outlined text-sm">content_copy</span>
                          </button>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-on-surface-variant">Chủ tài khoản:</span>
                        <span className="text-xs font-semibold text-on-surface uppercase">CONG TY TNHH AN NHIEN RS</span>
                      </div>
                    </div>
                    {/* Contract terms */}
                    <div className="space-y-2 pt-1 text-xs">
                      <div className="flex items-center justify-between py-1">
                        <span className="text-on-surface-variant">Tỷ lệ hoa hồng thỏa thuận:</span>
                        <span className="font-bold text-primary">Cố định 6.0%</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-on-surface-variant">Kỳ thanh toán (Cycle):</span>
                        <span className="font-semibold text-on-surface">Weekly (Thứ Hai)</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-on-surface-variant">Mức xếp hạng uy tín:</span>
                        <span className="font-semibold text-tertiary flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">verified</span>
                          Hạng A+ (100% SLA)
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Trạng thái Ký quỹ & An toàn tài chính (StayReco Shield Guarantee) */}
                  <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                      <span className="material-symbols-outlined text-2xl text-primary">shield_with_heart</span>
                      <h4 className="font-bold font-headline text-base text-on-surface">StayReco Shield Guarantee</h4>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Cơ chế bảo chứng dòng tiền: Tiền phòng
                      <span className="font-bold text-on-surface">2.115.000 ₫</span>
                      được tách bạch tuyệt đối trong tài khoản Escrow độc lập tại ngân hàng đối tác, không gộp chung với quỹ vận hành của StayReco.
                    </p>
                    {/* Safe Milestones */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-start gap-2.5 text-xs">
                        <span className="material-symbols-outlined text-tertiary text-base shrink-0 mt-0.5">check_circle</span>
                        <div>
                          <span className="font-semibold text-on-surface">Đã giữ hộ an toàn</span>
                          <p className="text-on-surface-variant text-[11px]">Tiền được bảo vệ từ thời điểm thanh toán 20/10.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs">
                        <span className="material-symbols-outlined text-tertiary text-base shrink-0 mt-0.5">lock_clock</span>
                        <div>
                          <span className="font-semibold text-on-surface">Mở khóa ký quỹ khi Check-out</span>
                          <p className="text-on-surface-variant text-[11px]">Thời điểm hoàn tất dịch vụ: 12:00 ngày 22/10/2026.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs">
                        <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">send_money</span>
                        <div>
                          <span className="font-semibold text-on-surface">Giải ngân lệnh chi Thứ Hai</span>
                          <p className="text-on-surface-variant text-[11px]">Đợt đối soát W43: Ngày 25/10/2026 chuyển trực tiếp VCB.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Quy tắc hạch toán đối soát kế toán */}
                  <div className="bg-surface-container-low rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-on-surface-variant text-lg">info</span>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-on-surface">Chính sách hạch toán sàn</h5>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      - Mọi hóa đơn điện tử cho 6.0% phí dịch vụ được khởi tạo tự động vào 23:59 chủ nhật cùng tuần.
                      <br />
                      - Trường hợp khách hàng có phát sinh tranh chấp hoặc hủy phòng sau quy định, luồng hoàn tiền sẽ áp dụng theo
                      <span className="font-semibold text-primary">Chính sách Hủy phòng Tiêu chuẩn #CP-02</span>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* Inline Micro-interactions JavaScript */}
          </div>
        </main>
      </div>
    </div>
  );
}
