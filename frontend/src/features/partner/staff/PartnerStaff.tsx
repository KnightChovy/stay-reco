/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Legacy DOM-driven screen; migrate interactions to React state separately.
import React from 'react';

export default function PartnerStaff() {
  React.useEffect(() => {
    try {
      (function() {
      // Elements
      const drawer = document.getElementById('permissionDrawer');
      const drawerOverlay = document.getElementById('drawerOverlay');
      const closeDrawerBtn = document.getElementById('closeDrawerBtn');
      const cancelDrawerBtn = document.getElementById('cancelDrawerBtn');
      const saveDrawerBtn = document.getElementById('saveDrawerBtn');
      const drawerStaffName = document.getElementById('drawerStaffName');
      const drawerStaffRole = document.getElementById('drawerStaffRole');
      const drawerStaffEmail = document.getElementById('drawerStaffEmail');

      const addStaffModal = document.getElementById('addStaffModal');
      const addStaffModalBox = document.getElementById('addStaffModalBox');
      const openAddStaffBtn = document.getElementById('openAddStaffBtn');
      const closeAddStaffBtn = document.getElementById('closeAddStaffBtn');
      const cancelAddStaffBtn = document.getElementById('cancelAddStaffBtn');
      const submitAddStaffBtn = document.getElementById('submitAddStaffBtn');

      const auditModal = document.getElementById('auditModal');
      const auditModalBox = document.getElementById('auditModalBox');
      const openAuditBtn = document.getElementById('openAuditBtn');
      const closeAuditModalBtn = document.getElementById('closeAuditModalBtn');
      const dismissAuditModalBtn = document.getElementById('dismissAuditModalBtn');

      const openMatrixOverviewBtn = document.getElementById('openMatrixOverviewBtn');
      const toast = document.getElementById('toastNotification');
      const toastMessage = document.getElementById('toastMessage');

      function showToast(msg) {
        toastMessage.textContent = msg;
        toast.classList.remove('translate-y-20', 'opacity-0');
        setTimeout(() => {
          toast.classList.add('translate-y-20', 'opacity-0');
        }, 3000);
      }

      // Open Drawer
      function openDrawer(name, role, email) {
        if(name) drawerStaffName.textContent = name;
        if(role) drawerStaffRole.textContent = role;
        if(email) drawerStaffEmail.textContent = email;

        drawerOverlay.classList.remove('opacity-0', 'pointer-events-none');
        drawer.classList.remove('translate-x-full');
      }

      function closeDrawer() {
        drawerOverlay.classList.add('opacity-0', 'pointer-events-none');
        drawer.classList.add('translate-x-full');
      }

      document.querySelectorAll('.open-permission-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const name = btn.getAttribute('data-name');
          const role = btn.getAttribute('data-role');
          const email = btn.getAttribute('data-email');
          openDrawer(name, role, email);
        });
      });

      if (openMatrixOverviewBtn) {
        openMatrixOverviewBtn.addEventListener('click', () => {
          openDrawer('Cấu hình Phân quyền Chung', 'Toàn bộ khối lễ tân & vận hành', 'annhien. riverside@partner.stayreco.vn');
        });
      }

      drawerOverlay.addEventListener('click', closeDrawer);
      closeDrawerBtn.addEventListener('click', closeDrawer);
      cancelDrawerBtn.addEventListener('click', closeDrawer);

      saveDrawerBtn.addEventListener('click', () => {
        closeDrawer();
        showToast('Ma trận phân quyền đã được đồng bộ lên máy chủ cơ sở!');
      });

      // Add Staff Modal
      function openAddStaff() {
        addStaffModal.classList.remove('opacity-0', 'pointer-events-none');
        addStaffModalBox.classList.remove('scale-95');
        addStaffModalBox.classList.add('scale-100');
      }

      function closeAddStaff() {
        addStaffModal.classList.add('opacity-0', 'pointer-events-none');
        addStaffModalBox.classList.add('scale-95');
        addStaffModalBox.classList.remove('scale-100');
      }

      openAddStaffBtn.addEventListener('click', openAddStaff);
      closeAddStaffBtn.addEventListener('click', closeAddStaff);
      cancelAddStaffBtn.addEventListener('click', closeAddStaff);
      submitAddStaffBtn.addEventListener('click', () => {
        closeAddStaff();
        showToast('Đã gửi thư mời kích hoạt tài khoản kèm mã bảo mật!');
      });

      // Audit Log Modal
      function openAudit() {
        auditModal.classList.remove('opacity-0', 'pointer-events-none');
        auditModalBox.classList.remove('scale-95');
        auditModalBox.classList.add('scale-100');
      }

      function closeAudit() {
        auditModal.classList.add('opacity-0', 'pointer-events-none');
        auditModalBox.classList.add('scale-95');
        auditModalBox.classList.remove('scale-100');
      }

      openAuditBtn.addEventListener('click', openAudit);
      closeAuditModalBtn.addEventListener('click', closeAudit);
      dismissAuditModalBtn.addEventListener('click', closeAudit);

      // Reset password micro-interactions
      document.querySelectorAll('.reset-pwd-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          showToast('Đã gửi liên kết tạo mới mật khẩu tới email nhân viên!');
        });
      });

      // Lock account micro-interactions
      document.querySelectorAll('.lock-acc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if(confirm('Bạn có chắc chắn muốn tạm khóa phiên đăng nhập của nhân viên này?')) {
            showToast('Tài khoản đã được chuyển sang trạng thái Tạm khóa!');
          }
        });
      });

      // Simple Search filter
      const searchInput = document.getElementById('staffSearchInput');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          const term = e.target.value.toLowerCase();
          const rows = document.querySelectorAll('tbody tr');
          rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
          });
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
              <a aria-current="page" className="flex items-center gap-3 px-3 py-2 transition-colors bg-primary-container text-on-primary font-medium rounded-lg shadow-sm" data-path="nhan-vien-va-phan-quyen" href="#">
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
            {/* Top Bar / Breadcrumbs & Hero Header */}
            <section className="w-full px-6 lg:px-10 py-6 bg-surface-container-low flex flex-col gap-5">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
                <span className="hover:text-primary cursor-pointer transition-colors">Tổ chức & Hồ sơ</span>
                <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
                <span className="text-primary font-semibold">Nhân viên & Phân quyền</span>
                <span className="inline-flex items-center ml-3 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-tertiary-fixed text-on-tertiary-fixed">An Nhiên Riverside Hotel</span>
              </div>
              {/* Header & Actions */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-2xl lg:text-3xl font-headline font-bold text-primary tracking-tight">Danh sách Nhân viên & Ma trận Phân quyền Cơ sở</h1>
                  <p className="text-xs lg:text-sm text-on-surface-variant max-w-2xl leading-relaxed">Quản lý tài khoản nhân viên lễ tân, buồng phòng và chuyên viên nội dung marketing phụ trách An Nhiên Riverside Hotel.</p>
                </div>
                <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
                  <button className="h-11 px-4 rounded-lg bg-surface-container-lowest text-primary font-medium text-xs lg:text-sm shadow-sm hover:bg-surface-container transition-all flex items-center gap-2 cursor-pointer" id="openAuditBtn" type="button">
                    <span className="material-symbols-outlined text-[18px]">history</span>
                    <span>Xem lịch sử truy cập (Audit)</span>
                  </button>
                  <button className="h-11 px-5 rounded-lg bg-primary text-on-primary font-medium text-xs lg:text-sm shadow-md hover:bg-primary-container transition-all flex items-center gap-2 cursor-pointer" id="openAddStaffBtn" type="button">
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                    <span>+ Thêm tài khoản nhân viên mới</span>
                  </button>
                </div>
              </div>
            </section>
            {/* Content Container */}
            <div className="w-full px-6 lg:px-10 py-8 space-y-8">
              {/* KHU VỰC 1: 4 Thẻ tóm tắt tổ chức & Trạng thái ca trực */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Tổng nhân sự */}
                <div className="relative overflow-hidden bg-surface-container-lowest rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Tổng nhân sự cơ sở</span>
                      <div className="text-3xl font-headline font-bold text-primary tracking-tight">
                        8
                        <span className="text-xs font-normal text-on-surface-variant">thành viên</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[22px]">badge</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 bg-surface-container-low/60 -mx-5 -mb-5 px-5 py-2.5 flex items-center justify-between text-[11px] text-on-surface-variant">
                    <span>Tài khoản chính thức</span>
                    <span className="font-semibold text-tertiary">100% đã kích hoạt</span>
                  </div>
                </div>
                {/* Card 2: Ca sáng trực tuyến */}
                <div className="relative overflow-hidden bg-surface-container-lowest rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Ca sáng trực tuyến</span>
                      <div className="text-3xl font-headline font-bold text-primary tracking-tight">
                        3
                        <span className="text-xs font-normal text-on-surface-variant">nhân viên</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed">
                      <span className="material-symbols-outlined text-[22px]">wb_sunny</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 bg-surface-container-low/60 -mx-5 -mb-5 px-5 py-2.5 flex items-center justify-between text-[11px]">
                    <span className="text-on-surface-variant">Thời gian ca</span>
                    <span className="font-medium text-primary">06:30 - 14:30</span>
                  </div>
                </div>
                {/* Card 3: Ca chiều / tối */}
                <div className="relative overflow-hidden bg-surface-container-lowest rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Ca chiều & tối</span>
                      <div className="text-3xl font-headline font-bold text-primary tracking-tight">
                        2
                        <span className="text-xs font-normal text-on-surface-variant">nhân viên</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                      <span className="material-symbols-outlined text-[22px]">dark_mode</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 bg-surface-container-low/60 -mx-5 -mb-5 px-5 py-2.5 flex items-center justify-between text-[11px]">
                    <span className="text-on-surface-variant">Dự kiến giao ca lúc</span>
                    <span className="font-medium text-secondary">14:30 chiều nay</span>
                  </div>
                </div>
                {/* Card 4: Phân nhóm quyền */}
                <div className="relative overflow-hidden bg-surface-container-lowest rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Phân nhóm quyền hạn</span>
                      <div className="text-sm font-semibold text-primary mt-1">3 Khối nghiệp vụ</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface">
                      <span className="material-symbols-outlined text-[22px]">admin_panel_settings</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[11px] bg-primary/10 text-primary font-medium">Lễ tân (4)</span>
                    <span className="px-2 py-0.5 rounded text-[11px] bg-secondary/10 text-secondary font-medium">Marketing (2)</span>
                    <span className="px-2 py-0.5 rounded text-[11px] bg-tertiary/10 text-tertiary font-medium">Buồng phòng (2)</span>
                  </div>
                </div>
              </section>
              {/* Notice Bar: Quyền hạn và Bảo mật Cảnh báo */}
              <div className="bg-surface-container-low rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">security</span>
                  </div>
                  <p className="text-xs text-on-surface leading-normal">
                    <strong className="font-semibold text-primary">Nguyên tắc Bảo mật Phân cấp:</strong>
                    Tài khoản trực thuộc cơ sở lưu trú chỉ được vận hành trong phạm vi khách sạn. Mọi quyền cấp Admin cấp nền tảng hoặc Platform Manager đều bị vô hiệu hóa từ giao diện Partner Portal.
                  </p>
                </div>
                <button className="text-xs font-semibold text-primary hover:text-primary-container flex items-center gap-1 transition-colors" id="openMatrixOverviewBtn">
                  <span>Xem ma trận phân quyền</span>
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                </button>
              </div>
              {/* KHU VỰC 2: Bảng danh sách nhân viên trực quan (Staff Directory) */}
              <section className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
                {/* Toolbar Bộ lọc & Tìm kiếm */}
                <div className="p-4 lg:p-6 bg-surface-container-lowest flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 max-w-md">
                    <div className="relative w-full">
                      <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-outline text-[18px]">search</span>
                      <input className="w-full pl-10 pr-4 py-2 text-xs bg-surface-container-low text-on-surface rounded-lg placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all" id="staffSearchInput" placeholder="Tìm tên nhân viên, email, số điện thoại..." type="text" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1 md:pb-0">
                    <div className="flex items-center gap-1.5 bg-surface-container-low p-1 rounded-lg">
                      <button className="px-3 py-1.5 text-xs font-medium rounded-md bg-surface-container-lowest text-primary shadow-xs">Tất cả (8)</button>
                      <button className="px-3 py-1.5 text-xs font-medium rounded-md text-on-surface-variant hover:text-on-surface">Lễ tân</button>
                      <button className="px-3 py-1.5 text-xs font-medium rounded-md text-on-surface-variant hover:text-on-surface">Buồng phòng</button>
                      <button className="px-3 py-1.5 text-xs font-medium rounded-md text-on-surface-variant hover:text-on-surface">Marketing AI</button>
                    </div>
                    <div className="h-6 w-px bg-surface-container-high mx-1 hidden sm:block"></div>
                    <button className="h-9 px-3 text-xs font-medium rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">filter_list</span>
                      <span>Trạng thái: Hoạt động</span>
                    </button>
                  </div>
                </div>
                {/* Bảng dữ liệu */}
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant font-semibold">
                        <th className="py-3.5 px-5">Họ và tên</th>
                        <th className="py-3.5 px-4">Vị trí chuyên trách</th>
                        <th className="py-3.5 px-4">Liên hệ</th>
                        <th className="py-3.5 px-4 min-w-[220px]">Quyền hạn được cấp</th>
                        <th className="py-3.5 px-4">Trạng thái</th>
                        <th className="py-3.5 px-5 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-0">
                      {/* Row 1: Nguyễn Hương Ly */}
                      <tr className="hover:bg-surface-container-low/50 transition-colors group">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 shadow-xs bg-surface-container">
                              <img className="w-full h-full object-cover" data-alt="Chân dung nữ trưởng ca lễ tân Việt Nam thanh lịch với áo dài đồng phục khách sạn, ánh mắt tự tin, phông nền sảnh lễ tân ấm cúng tone màu coastal blue và gỗ tự nhiên" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBId2enmrbxdCM4_H6jqhkoTkBYNCu-7r9Jrxy4tYEVcRe-rgZ4eih9EDvNNJvX_0m6iRsojNB2BwPLjy5GYg4trdQ0xEKoysywmbCPXrhQic__uA2sS8NS2vO_AwuYycNKbar2KzFV4liw9u0mt0QBXWpNJcpsfDuoCe-hReNVBZbl9fjbQty2pLVwZA3FJNiohDTXsqA90Xgj6dR1BhcCAi84WupfPM7xtz7BnHVVY_omwFDgFqTx" />
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-tertiary ring-2 ring-surface-container-lowest" title="Đang trực tuyến"></span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-headline font-semibold text-on-surface text-sm">Nguyễn Hương Ly</span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-tertiary/15 text-tertiary">Ca sáng</span>
                              </div>
                              <span className="text-[11px] text-on-surface-variant">Mã NV: AR-1029</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-primary">Trưởng ca Lễ tân</div>
                          <div className="text-[11px] text-on-surface-variant">Bộ phận Tiền sảnh (FO)</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-on-surface font-medium">ly.nguyen@annhienhotel.vn</div>
                          <div className="text-on-surface-variant text-[11px]">0914 382 910</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            <span className="px-2 py-0.5 rounded text-[11px] bg-primary-fixed/60 text-on-primary-fixed font-medium">Đặt phòng</span>
                            <span className="px-2 py-0.5 rounded text-[11px] bg-primary-fixed/60 text-on-primary-fixed font-medium">Check-in/out</span>
                            <span className="px-2 py-0.5 rounded text-[11px] bg-secondary-fixed text-on-secondary-fixed font-medium">Hoàn tiền sơ bộ</span>
                            <span className="px-2 py-0.5 rounded text-[11px] bg-tertiary-fixed text-on-tertiary-fixed font-medium">Chat du khách</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-tertiary-fixed text-on-tertiary-fixed">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                            Đang trực tuyến
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="open-permission-btn p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors" data-email="ly.nguyen@annhienhotel.vn" data-name="Nguyễn Hương Ly" data-role="Trưởng ca Lễ tân" title="Chỉnh sửa quyền" type="button">
                              <span className="material-symbols-outlined text-[18px]">key</span>
                            </button>
                            <button className="reset-pwd-btn p-2 rounded-lg text-on-surface-variant hover:text-secondary hover:bg-surface-container transition-colors" title="Đặt lại mật khẩu" type="button">
                              <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                            </button>
                            <button className="lock-acc-btn p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-surface-container transition-colors" title="Khóa tài khoản" type="button">
                              <span className="material-symbols-outlined text-[18px]">block</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Row 2: Lê Thị Mai */}
                      <tr className="hover:bg-surface-container-low/50 transition-colors group">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 shadow-xs bg-surface-container">
                              <img className="w-full h-full object-cover" data-alt="Chân dung người phụ nữ trung niên Việt Nam chuẩn mực, nụ cười phúc hậu, giám sát buồng phòng với đồng phục khách sạn thanh lịch màu be sẫm ấm áp" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnMGMDqmJ93sZij_a5o_qFe1x4cidJlpBnUqRs1Gd48HAW1dJrEdTz95ly89Mnbbd6NQWPcrynnNwCSY81TO8KGHB6shH7C2SR9LSHeofHrlO0U51KKj-_P1vxwZNBZqXurbwwH5smRPJOYcNlBiwBBbwUgwMdW9gPzcpOPGh3zbetN5MUK-kUfJBR6r41alPjdAo5nmuAZ_rww66iowThtlWHipC3XcC4dZ5xcV8RJhsq51FA1Qx6" />
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-outline ring-2 ring-surface-container-lowest" title="Ngoại tuyến"></span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-headline font-semibold text-on-surface text-sm">Lê Thị Mai</span>
                              </div>
                              <span className="text-[11px] text-on-surface-variant">Mã NV: AR-1044</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-primary">Giám sát Buồng phòng & Tiện ích</div>
                          <div className="text-[11px] text-on-surface-variant">Khối Dịch vụ Phòng (HK)</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-on-surface font-medium">mai.le@annhienhotel.vn</div>
                          <div className="text-on-surface-variant text-[11px]">0905 129 481</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            <span className="px-2 py-0.5 rounded text-[11px] bg-primary-fixed/60 text-on-primary-fixed font-medium">Trạng thái phòng</span>
                            <span className="px-2 py-0.5 rounded text-[11px] bg-surface-container text-on-surface font-medium">Khóa bảo trì buồng</span>
                            <span className="px-2 py-0.5 rounded text-[11px] bg-surface-container text-on-surface font-medium">SOP Vệ sinh</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface-container-high text-on-surface-variant">
                            <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                            Ngoại tuyến (Offline)
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="open-permission-btn p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors" data-email="mai.le@annhienhotel.vn" data-name="Lê Thị Mai" data-role="Giám sát Buồng phòng & Tiện ích" title="Chỉnh sửa quyền" type="button">
                              <span className="material-symbols-outlined text-[18px]">key</span>
                            </button>
                            <button className="reset-pwd-btn p-2 rounded-lg text-on-surface-variant hover:text-secondary hover:bg-surface-container transition-colors" title="Đặt lại mật khẩu" type="button">
                              <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                            </button>
                            <button className="lock-acc-btn p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-surface-container transition-colors" title="Khóa tài khoản" type="button">
                              <span className="material-symbols-outlined text-[18px]">block</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Row 3: Bùi Thảo Linh */}
                      <tr className="hover:bg-surface-container-low/50 transition-colors group">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 shadow-xs bg-surface-container">
                              <img className="w-full h-full object-cover" data-alt="Chân dung cô gái trẻ người Việt làm chuyên viên marketing sáng tạo, mỉm cười tự nhiên, áo sơ mi gọn gàng, góc làm việc hiện đại tràn ngập ánh sáng tự nhiên" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCi8PNRyxADGx2ppdVSoouQxTrA9aAWNVIrve_FtVb8PFFKem60MVFQdR_qeUOhAQoignNsxuwa51N0YRJ8kte7sHuK3IM63MVBbMsnqBZJnnpWDyt7oE-47S6yqIwo7nKiKvaGQK8cgtjkjw3dloKNs1vXyKZya7xPvQMXO2zV6VuPSvnH-GybJV2Z3Ybl5iLFZlZLO9TAOTFikF6zuLHkDP0cRItZYsiIF8TPimxRFeaa9iXWYKBp" />
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-tertiary ring-2 ring-surface-container-lowest" title="Đang trực tuyến"></span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-headline font-semibold text-on-surface text-sm">Bùi Thảo Linh</span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary-fixed text-on-secondary-fixed">Marketing</span>
                              </div>
                              <span className="text-[11px] text-on-surface-variant">Mã NV: AR-1082</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-primary">Chuyên viên Marketing & Nội dung AI</div>
                          <div className="text-[11px] text-on-surface-variant">Phòng Truyền thông & Ưu đãi</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-on-surface font-medium">linh.bui@annhienhotel.vn</div>
                          <div className="text-on-surface-variant text-[11px]">0988 563 218</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            <span className="px-2 py-0.5 rounded text-[11px] bg-secondary-fixed text-on-secondary-fixed font-medium">Soạn thảo AI</span>
                            <span className="px-2 py-0.5 rounded text-[11px] bg-secondary-fixed text-on-secondary-fixed font-medium">Thư viện nội dung</span>
                            <span className="px-2 py-0.5 rounded text-[11px] bg-secondary-fixed text-on-secondary-fixed font-medium">Lịch đăng kênh</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-tertiary-fixed text-on-tertiary-fixed">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                            Đang hoạt động
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="open-permission-btn p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors" data-email="linh.bui@annhienhotel.vn" data-name="Bùi Thảo Linh" data-role="Chuyên viên Marketing & Nội dung AI" title="Chỉnh sửa quyền" type="button">
                              <span className="material-symbols-outlined text-[18px]">key</span>
                            </button>
                            <button className="reset-pwd-btn p-2 rounded-lg text-on-surface-variant hover:text-secondary hover:bg-surface-container transition-colors" title="Đặt lại mật khẩu" type="button">
                              <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                            </button>
                            <button className="lock-acc-btn p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-surface-container transition-colors" title="Khóa tài khoản" type="button">
                              <span className="material-symbols-outlined text-[18px]">block</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Row 4: Phạm Quốc Bảo */}
                      <tr className="hover:bg-surface-container-low/50 transition-colors group">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 shadow-xs bg-surface-container">
                              <img className="w-full h-full object-cover" data-alt="Chân dung nam nhân viên tiếp tân trẻ người Việt mặc suit đen lịch sự, nụ cười chu đáo, phông nền khách sạn sang trọng đẳng cấp 4 sao" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOHGnpiFULjb_ApYUDOXYCG9OJy1IlsVdT1l8UkMq60mvDLoIHeygoR2kske3_uLMxuHUdYMuClvreVxHS-Q_CGD3drBUa_R7gVqRd3Z8eQ6y7YBMA2Kmq0mYBb9eHKA3wx_NKVt1MtG0qwaJpSJG6PkC0lG0bqLml0j703qrveonHdoxenum23KPgbt-ptX739Ys6RZDUtO4wKtM1cNQt9HjtEHkoEUOvCBK6GCvRCHFmbuNAIwYO" />
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-tertiary ring-2 ring-surface-container-lowest" title="Đang trực tuyến"></span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-headline font-semibold text-on-surface text-sm">Phạm Quốc Bảo</span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary-fixed text-on-primary-fixed">Ca chiều</span>
                              </div>
                              <span className="text-[11px] text-on-surface-variant">Mã NV: AR-1102</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-primary">Lễ tân viên ca chiều</div>
                          <div className="text-[11px] text-on-surface-variant">Bộ phận Tiền sảnh (FO)</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-on-surface font-medium">bao.pham@annhienhotel.vn</div>
                          <div className="text-on-surface-variant text-[11px]">0935 901 772</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            <span className="px-2 py-0.5 rounded text-[11px] bg-primary-fixed/60 text-on-primary-fixed font-medium">Check-in/out</span>
                            <span className="px-2 py-0.5 rounded text-[11px] bg-primary-fixed/60 text-on-primary-fixed font-medium">Quét QR voucher</span>
                            <span className="px-2 py-0.5 rounded text-[11px] bg-surface-container text-on-surface font-medium">Xem lịch đặt phòng</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-tertiary-fixed text-on-tertiary-fixed">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                            Đang hoạt động
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="open-permission-btn p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors" data-email="bao.pham@annhienhotel.vn" data-name="Phạm Quốc Bảo" data-role="Lễ tân viên ca chiều" title="Chỉnh sửa quyền" type="button">
                              <span className="material-symbols-outlined text-[18px]">key</span>
                            </button>
                            <button className="reset-pwd-btn p-2 rounded-lg text-on-surface-variant hover:text-secondary hover:bg-surface-container transition-colors" title="Đặt lại mật khẩu" type="button">
                              <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                            </button>
                            <button className="lock-acc-btn p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-surface-container transition-colors" title="Khóa tài khoản" type="button">
                              <span className="material-symbols-outlined text-[18px]">block</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {/* Pagination footer */}
                <div className="px-6 py-4 bg-surface-container-low/40 flex items-center justify-between text-xs text-on-surface-variant">
                  <span>Hiển thị 4 trong tổng số 8 nhân viên</span>
                  <div className="flex items-center gap-1">
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-container-lowest text-on-surface shadow-xs disabled:opacity-40" disabled>
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary text-on-primary font-semibold">1</button>
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors">2</button>
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-container-lowest text-on-surface shadow-xs hover:bg-surface-container transition-colors">
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>
                </div>
              </section>
              {/* KHU VỰC: Tổng quan phân quyền dạng lưới thẻ trực quan (Visual Matrix Overview) */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-headline font-bold text-primary">5 Nhóm Quyền Hạn Vận Hành Nội Bộ Cơ Sở</h2>
                    <p className="text-xs text-on-surface-variant">Mô hình phân tầng bảo mật theo vai trò thực tế tại cơ sở An Nhiên Riverside Hotel</p>
                  </div>
                  <span className="text-xs font-medium text-secondary bg-secondary-fixed px-3 py-1 rounded-full">Chế độ phân quyền nghiêm ngặt (RBAC)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Nhóm 1 */}
                  <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">book_online</span>
                      </div>
                      <h3 className="font-headline font-semibold text-xs text-on-surface">1. Quản lý Đặt phòng</h3>
                      <ul className="space-y-2 text-[11px] text-on-surface-variant">
                        <li className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-tertiary">check_circle</span>
                          Xem danh sách booking
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-tertiary">check_circle</span>
                          Xác nhận đặt phòng
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-tertiary">check_circle</span>
                          Hỗ trợ đổi ngày lưu trú
                        </li>
                      </ul>
                    </div>
                    <div className="mt-4 pt-3 bg-surface-container-low/50 -mx-4 -mb-4 px-4 py-2 text-[10px] text-primary font-medium">Áp dụng: Lễ tân & Quản lý</div>
                  </div>
                  {/* Nhóm 2 */}
                  <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">bed</span>
                      </div>
                      <h3 className="font-headline font-semibold text-xs text-on-surface">2. Nghiệp vụ Lễ tân & Buồng</h3>
                      <ul className="space-y-2 text-[11px] text-on-surface-variant">
                        <li className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-tertiary">check_circle</span>
                          Gán phòng vật lý
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-tertiary">check_circle</span>
                          Check-in QR / Check-out
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-tertiary">check_circle</span>
                          Báo phòng sạch / bẩn / khóa
                        </li>
                      </ul>
                    </div>
                    <div className="mt-4 pt-3 bg-surface-container-low/50 -mx-4 -mb-4 px-4 py-2 text-[10px] text-primary font-medium">Áp dụng: Lễ tân & Buồng phòng</div>
                  </div>
                  {/* Nhóm 3 */}
                  <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">forum</span>
                      </div>
                      <h3 className="font-headline font-semibold text-xs text-on-surface">3. Chăm sóc khách & Hộp thư</h3>
                      <ul className="space-y-2 text-[11px] text-on-surface-variant">
                        <li className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-tertiary">check_circle</span>
                          Tiếp nhận hội thoại AI
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-tertiary">check_circle</span>
                          Trả lời tin nhắn khách
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-tertiary">check_circle</span>
                          Xử lý yêu cầu dịch vụ phòng
                        </li>
                      </ul>
                    </div>
                    <div className="mt-4 pt-3 bg-surface-container-low/50 -mx-4 -mb-4 px-4 py-2 text-[10px] text-primary font-medium">Áp dụng: Trực tổng đài & Lễ tân</div>
                  </div>
                  {/* Nhóm 4 */}
                  <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary-fixed/50 text-secondary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                      </div>
                      <h3 className="font-headline font-semibold text-xs text-on-surface">4. Hoàn tiền & Chính sách</h3>
                      <ul className="space-y-2 text-[11px] text-on-surface-variant">
                        <li className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-tertiary">check_circle</span>
                          Xem yêu cầu hoàn tiền
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-tertiary">check_circle</span>
                          Thẩm định sơ bộ
                        </li>
                        <li className="flex items-center gap-1.5 text-secondary">
                          <span className="material-symbols-outlined text-[14px] text-secondary">lock</span>
                          Cần Chủ duyệt chi lớn
                        </li>
                      </ul>
                    </div>
                    <div className="mt-4 pt-3 bg-surface-container-low/50 -mx-4 -mb-4 px-4 py-2 text-[10px] text-secondary font-medium">Chỉ định: Trưởng ca / Quản lý</div>
                  </div>
                  {/* Nhóm 5 */}
                  <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="w-8 h-8 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                      </div>
                      <h3 className="font-headline font-semibold text-xs text-on-surface">5. Nội dung & Tiếp thị AI</h3>
                      <ul className="space-y-2 text-[11px] text-on-surface-variant">
                        <li className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-tertiary">check_circle</span>
                          Tạo bài nháp bằng AI
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-tertiary">check_circle</span>
                          Gửi duyệt khuyến mãi
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-tertiary">check_circle</span>
                          Xuất bản lịch đăng kênh
                        </li>
                      </ul>
                    </div>
                    <div className="mt-4 pt-3 bg-surface-container-low/50 -mx-4 -mb-4 px-4 py-2 text-[10px] text-tertiary font-medium">Áp dụng: Chuyên viên Marketing</div>
                  </div>
                </div>
              </section>
            </div>
            {/* KHU VỰC 3: Slide-over Drawer / Form ma trận phân quyền chi tiết (Permission Matrix Drawer) */}
            <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-xs z-50 transition-opacity opacity-0 pointer-events-none duration-300" id="drawerOverlay"></div>
            <aside className="fixed top-0 right-0 h-screen w-full max-w-xl bg-surface-container-lowest shadow-2xl z-50 translate-x-full transition-transform duration-300 flex flex-col justify-between" id="permissionDrawer">
              {/* Drawer Header */}
              <div className="px-6 py-5 bg-surface-container-low flex items-center justify-between shrink-0">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
                    <h3 className="font-headline font-bold text-base text-primary">Ma trận Phân quyền Tài khoản</h3>
                  </div>
                  <p className="text-xs text-on-surface-variant">Thiết lập chi tiết quyền thao tác cho thành viên tại An Nhiên Riverside Hotel</p>
                </div>
                <button className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors" id="closeDrawerBtn" type="button">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              {/* Drawer Content Scrollable */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {/* Thông tin nhân sự đang cấu hình */}
                <div className="p-4 rounded-xl bg-surface-container-low flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary text-on-primary font-headline font-bold flex items-center justify-center text-sm shrink-0">NL</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-headline font-semibold text-sm text-on-surface truncate" id="drawerStaffName">Nguyễn Hương Ly</h4>
                    <p className="text-xs text-primary font-medium truncate" id="drawerStaffRole">Trưởng ca Lễ tân</p>
                    <p className="text-[11px] text-on-surface-variant truncate" id="drawerStaffEmail">ly.nguyen@annhienhotel.vn</p>
                  </div>
                  <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-tertiary-fixed text-on-tertiary-fixed shrink-0">Đã kích hoạt</span>
                </div>
                {/* Khối Cảnh báo bảo mật quyền cấp cơ sở */}
                <div className="p-3.5 rounded-xl bg-secondary-fixed/40 flex items-start gap-2.5 text-xs text-on-secondary-fixed">
                  <span className="material-symbols-outlined text-[18px] text-secondary shrink-0 mt-0.5">verified_user</span>
                  <div>
                    <strong className="font-semibold text-secondary">Giới hạn Quyền Hạn Cơ sở:</strong>
                    Các tính năng thanh lý tài khoản công ty, chỉnh sửa thông tin đăng ký kinh doanh và rút quỹ ngân hàng thuộc quyền sở hữu của
                    <span className="font-medium underline">Chủ khách sạn</span>
                    , không hiển thị trong ma trận này.
                  </div>
                </div>
                {/* Danh sách 5 nhóm quyền chi tiết dạng checkbox toggle */}
                <form className="space-y-5" id="permissionForm">
                  {/* Nhóm 1 */}
                  <div className="bg-surface rounded-xl p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">calendar_add_on</span>
                        <span className="text-xs font-headline font-bold text-primary">1. Quản lý Đặt phòng & Khách hàng</span>
                      </div>
                      <span className="text-[11px] text-on-surface-variant font-medium">3 chức năng</span>
                    </div>
                    <div className="space-y-2 pt-1">
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input defaultChecked={true} className="mt-0.5 rounded text-primary focus:ring-primary w-4 h-4" type="checkbox" />
                        <div className="text-xs leading-tight">
                          <span className="font-medium text-on-surface">Xem danh sách đặt phòng và thông tin khách lưu trú</span>
                          <p className="text-[11px] text-on-surface-variant">Tra cứu mã booking, số phòng, ghi chú đặc biệt của khách.</p>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input defaultChecked={true} className="mt-0.5 rounded text-primary focus:ring-primary w-4 h-4" type="checkbox" />
                        <div className="text-xs leading-tight">
                          <span className="font-medium text-on-surface">Xác nhận đơn đặt phòng mới và tạo đơn trực tiếp</span>
                          <p className="text-[11px] text-on-surface-variant">Tạo booking vãng lai (walk-in) tại quầy lễ tân.</p>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input defaultChecked={true} className="mt-0.5 rounded text-primary focus:ring-primary w-4 h-4" type="checkbox" />
                        <div className="text-xs leading-tight">
                          <span className="font-medium text-on-surface">Điều chỉnh ngày lưu trú & Nâng hạng phòng (Upgrade)</span>
                          <p className="text-[11px] text-on-surface-variant">Thay đổi ngày đến/đi hoặc đổi loại phòng theo quỹ phòng trống.</p>
                        </div>
                      </label>
                    </div>
                  </div>
                  {/* Nhóm 2 */}
                  <div className="bg-surface rounded-xl p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">key</span>
                        <span className="text-xs font-headline font-bold text-primary">2. Nghiệp vụ Lễ tân & Buồng phòng</span>
                      </div>
                      <span className="text-[11px] text-on-surface-variant font-medium">3 chức năng</span>
                    </div>
                    <div className="space-y-2 pt-1">
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input defaultChecked={true} className="mt-0.5 rounded text-primary focus:ring-primary w-4 h-4" type="checkbox" />
                        <div className="text-xs leading-tight">
                          <span className="font-medium text-on-surface">Gán số phòng vật lý cho khách lưu trú</span>
                          <p className="text-[11px] text-on-surface-variant">Chọn phòng số cụ thể (ví dụ: Phòng 302, Tầng 3) trước giờ nhận.</p>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input defaultChecked={true} className="mt-0.5 rounded text-primary focus:ring-primary w-4 h-4" type="checkbox" />
                        <div className="text-xs leading-tight">
                          <span className="font-medium text-on-surface">Thực hiện Check-in QR & Check-out nhanh</span>
                          <p className="text-[11px] text-on-surface-variant">Quét mã nhận phòng từ ứng dụng khách hàng StayReco.</p>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input className="mt-0.5 rounded text-primary focus:ring-primary w-4 h-4" type="checkbox" />
                        <div className="text-xs leading-tight">
                          <span className="font-medium text-on-surface">Khóa bảo trì buồng phòng (Out of Order)</span>
                          <p className="text-[11px] text-on-surface-variant">Tạm ngừng khai thác phòng để sơn sửa, khắc phục lỗi kỹ thuật.</p>
                        </div>
                      </label>
                    </div>
                  </div>
                  {/* Nhóm 3 */}
                  <div className="bg-surface rounded-xl p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">chat</span>
                        <span className="text-xs font-headline font-bold text-primary">3. Chăm sóc khách & Hộp thư trung tâm</span>
                      </div>
                      <span className="text-[11px] text-on-surface-variant font-medium">2 chức năng</span>
                    </div>
                    <div className="space-y-2 pt-1">
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input defaultChecked={true} className="mt-0.5 rounded text-primary focus:ring-primary w-4 h-4" type="checkbox" />
                        <div className="text-xs leading-tight">
                          <span className="font-medium text-on-surface">Tiếp nhận hội thoại AI và tiếp quản chat (Human Takeover)</span>
                          <p className="text-[11px] text-on-surface-variant">Trực tiếp can thiệp trả lời khi trợ lý AI không thể giải quyết thắc mắc.</p>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input defaultChecked={true} className="mt-0.5 rounded text-primary focus:ring-primary w-4 h-4" type="checkbox" />
                        <div className="text-xs leading-tight">
                          <span className="font-medium text-on-surface">Ghi nhận và phản hồi khiếu nại chất lượng dịch vụ</span>
                          <p className="text-[11px] text-on-surface-variant">Tạo phiếu hỗ trợ nội bộ gửi tới bộ phận kỹ thuật / dọn phòng.</p>
                        </div>
                      </label>
                    </div>
                  </div>
                  {/* Nhóm 4 */}
                  <div className="bg-surface rounded-xl p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-[18px]">currency_exchange</span>
                        <span className="text-xs font-headline font-bold text-secondary">4. Hoàn tiền & Chính sách huỷ</span>
                      </div>
                      <span className="text-[11px] text-secondary font-medium">Phê duyệt 2 lớp</span>
                    </div>
                    <div className="space-y-2 pt-1">
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input defaultChecked={true} className="mt-0.5 rounded text-primary focus:ring-primary w-4 h-4" type="checkbox" />
                        <div className="text-xs leading-tight">
                          <span className="font-medium text-on-surface">Xem danh sách yêu cầu hoàn phí / hủy phòng</span>
                          <p className="text-[11px] text-on-surface-variant">Theo dõi các khiếu nại hủy do lý do bất khả kháng từ khách hàng.</p>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input defaultChecked={true} className="mt-0.5 rounded text-primary focus:ring-primary w-4 h-4" type="checkbox" />
                        <div className="text-xs leading-tight">
                          <span className="font-medium text-on-surface">Thẩm định sơ bộ và đề xuất mức hoàn cọc (≤ 500.000đ)</span>
                          <p className="text-[11px] text-on-surface-variant">Yêu cầu hoàn trả mức cao hơn bắt buộc phải có OTP xác thực của Chủ khách sạn.</p>
                        </div>
                      </label>
                    </div>
                  </div>
                  {/* Nhóm 5 */}
                  <div className="bg-surface rounded-xl p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-tertiary text-[18px]">auto_fix</span>
                        <span className="text-xs font-headline font-bold text-tertiary">5. Nội dung & Tiếp thị AI</span>
                      </div>
                      <span className="text-[11px] text-on-surface-variant font-medium">3 chức năng</span>
                    </div>
                    <div className="space-y-2 pt-1">
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input className="mt-0.5 rounded text-primary focus:ring-primary w-4 h-4" type="checkbox" />
                        <div className="text-xs leading-tight">
                          <span className="font-medium text-on-surface">Tạo nội dung truyền thông bằng Giọng thương hiệu AI</span>
                          <p className="text-[11px] text-on-surface-variant">Sử dụng prompt mẫu và kho ảnh cơ sở để tạo bài giới thiệu.</p>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input className="mt-0.5 rounded text-primary focus:ring-primary w-4 h-4" type="checkbox" />
                        <div className="text-xs leading-tight">
                          <span className="font-medium text-on-surface">Gửi duyệt gói ưu đãi & Voucher giảm giá</span>
                          <p className="text-[11px] text-on-surface-variant">Soạn thảo chương trình flash sale chờ ban quản trị ký duyệt.</p>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input className="mt-0.5 rounded text-primary focus:ring-primary w-4 h-4" type="checkbox" />
                        <div className="text-xs leading-tight">
                          <span className="font-medium text-on-surface">Xuất bản bài viết trực tiếp lên Hồ sơ khách sạn</span>
                          <p className="text-[11px] text-on-surface-variant">Đăng tải thông báo, hướng dẫn check-in, ẩm thực địa phương.</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </form>
              </div>
              {/* Drawer Actions Footer */}
              <div className="p-5 bg-surface-container-low flex items-center justify-between shrink-0">
                <button className="h-11 px-4 rounded-lg bg-surface-container-lowest text-on-surface font-medium text-xs hover:bg-surface-container transition-colors" id="cancelDrawerBtn" type="button">Hủy bỏ</button>
                <div className="flex items-center gap-2">
                  <button className="h-11 px-3 text-xs text-on-surface-variant hover:text-on-surface font-medium transition-colors" id="resetDrawerBtn" type="button">Khôi phục mặc định</button>
                  <button className="h-11 px-6 rounded-lg bg-primary text-on-primary font-medium text-xs shadow-md hover:bg-primary-container transition-all flex items-center gap-2" id="saveDrawerBtn" type="button">
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>Lưu thay đổi quyền hạn</span>
                  </button>
                </div>
              </div>
            </aside>
            {/* Modal: Thêm tài khoản nhân viên mới */}
            <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 opacity-0 pointer-events-none transition-opacity duration-300" id="addStaffModal">
              <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 transform scale-95 transition-transform duration-300" id="addStaffModalBox">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary-container text-on-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">person_add</span>
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-base text-primary">Thêm tài khoản nhân viên mới</h3>
                      <p className="text-xs text-on-surface-variant">Cấp quyền truy cập hệ thống quản lý cơ sở An Nhiên Riverside</p>
                    </div>
                  </div>
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors" id="closeAddStaffBtn">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
                <form className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-on-surface">Họ và tên nhân viên *</label>
                    <input className="w-full h-11 px-3.5 bg-surface rounded-lg text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Ví dụ: Trần Văn An" type="text" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-on-surface">Email công việc *</label>
                      <input className="w-full h-11 px-3.5 bg-surface rounded-lg text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="ten@annhienhotel.vn" type="email" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-semibold text-on-surface">Số điện thoại *</label>
                      <input className="w-full h-11 px-3.5 bg-surface rounded-lg text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="090x xxx xxx" type="tel" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-on-surface">Vị trí chuyên trách</label>
                      <select className="w-full h-11 px-3 bg-surface rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <option>Lễ tân viên</option>
                        <option>Trưởng ca Lễ tân</option>
                        <option>Giám sát buồng phòng</option>
                        <option>Chuyên viên nội dung AI</option>
                        <option>Nhân viên cứu hộ / Bể bơi</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-semibold text-on-surface">Nhóm mẫu quyền mẫu</label>
                      <select className="w-full h-11 px-3 bg-surface rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <option>Tiền sảnh cơ bản (Check-in/out)</option>
                        <option>Trưởng ca tiền sảnh (Toàn quyền FO)</option>
                        <option>Buồng phòng & SOP Tiện ích</option>
                        <option>Tiếp thị số & Quản lý bài đăng</option>
                      </select>
                    </div>
                  </div>
                  <div className="p-3 bg-surface-container-low rounded-xl flex items-start gap-2.5 text-[11px] text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">info</span>
                    <span>Mật khẩu khởi tạo ngẫu nhiên và đường link kích hoạt xác minh 2 bước (2FA) sẽ được gửi trực tiếp tới email của nhân viên.</span>
                  </div>
                  <div className="pt-3 flex items-center justify-end gap-2.5">
                    <button className="h-11 px-4 rounded-lg bg-surface-container text-on-surface font-medium hover:bg-surface-container-high transition-colors" id="cancelAddStaffBtn" type="button">Hủy bỏ</button>
                    <button className="h-11 px-5 rounded-lg bg-primary text-on-primary font-medium shadow-sm hover:bg-primary-container transition-all flex items-center gap-1.5" id="submitAddStaffBtn" type="button">
                      <span className="material-symbols-outlined text-[16px]">send</span>
                      <span>Tạo tài khoản & Gửi lời mời</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
            {/* Modal: Xem lịch sử truy cập (Audit Log Modal) */}
            <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 opacity-0 pointer-events-none transition-opacity duration-300" id="auditModal">
              <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 transform scale-95 transition-transform duration-300" id="auditModalBox">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">history_toggle_off</span>
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-base text-primary">Nhật ký Truy cập & Thao tác (Audit Trail)</h3>
                      <p className="text-xs text-on-surface-variant">Ghi nhận tự động các lượt đăng nhập, phân quyền và thao tác nghiệp vụ</p>
                    </div>
                  </div>
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors" id="closeAuditModalBtn">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
                {/* Log Timeline List */}
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  <div className="p-3 bg-surface rounded-xl flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-tertiary mt-1.5 shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-on-surface">Nguyễn Hương Ly đã Check-in phòng 304 (Mã BK-8821)</span>
                        <span className="text-[10px] text-on-surface-variant">10:42 Hôm nay</span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">IP: 118.69.182.11 (Quầy Lễ tân 01) • Quét mã QR StayReco thành công.</p>
                    </div>
                  </div>
                  <div className="p-3 bg-surface rounded-xl flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-secondary mt-1.5 shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-on-surface">Trần Nam (Chủ khách sạn) cập nhật quyền hạn</span>
                        <span className="text-[10px] text-on-surface-variant">08:15 Hôm nay</span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">Thêm quyền "Thẩm định sơ bộ hoàn tiền" cho Trưởng ca Nguyễn Hương Ly.</p>
                    </div>
                  </div>
                  <div className="p-3 bg-surface rounded-xl flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-on-surface">Bùi Thảo Linh tạo bản nháp chiến dịch "Đêm sông Hàn"</span>
                        <span className="text-[10px] text-on-surface-variant">Hôm qua, 16:30</span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">Tạo 3 biến thể nội dung từ Giọng thương hiệu AI & lưu trữ vào thư viện.</p>
                    </div>
                  </div>
                  <div className="p-3 bg-surface rounded-xl flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-outline mt-1.5 shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-on-surface">Lê Thị Mai cập nhật trạng thái dọn buồng</span>
                        <span className="text-[10px] text-on-surface-variant">Hôm qua, 14:10</span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">Chuyển 6 phòng tầng 2 sang trạng thái "Sẵn sàng đón khách".</p>
                    </div>
                  </div>
                </div>
                <div className="pt-2 flex items-center justify-between text-xs">
                  <button className="text-primary hover:underline font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    <span>Tải file CSV lịch sử (30 ngày)</span>
                  </button>
                  <button className="h-10 px-4 rounded-lg bg-surface-container text-on-surface font-medium hover:bg-surface-container-high transition-colors" id="dismissAuditModalBtn">Đóng</button>
                </div>
              </div>
            </div>
            {/* Notification Toast Popup */}
            <div className="fixed bottom-6 right-6 bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-xl shadow-xl z-50 flex items-center gap-2.5 transform translate-y-20 opacity-0 transition-all duration-300 text-xs" id="toastNotification">
              <span className="material-symbols-outlined text-[18px] text-tertiary-fixed">check_circle</span>
              <span id="toastMessage">Quyền hạn nhân viên đã được cập nhật thành công!</span>
            </div>
            {/* Interactive JavaScript Logic */}
          </div>
        </main>
      </div>
    </div>
  );
}
