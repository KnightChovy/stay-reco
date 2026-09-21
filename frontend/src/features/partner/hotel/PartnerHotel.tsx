/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Legacy DOM-driven screen; migrate interactions to React state separately.
import React from 'react';

export default function PartnerHotel() {
  React.useEffect(() => {
    try {
      // Simple micro-interaction for Save button
  const saveBtn = document.getElementById('btn-save-changes');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const originalHtml = saveBtn.innerHTML;
      saveBtn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">refresh</span><span>Đang cập nhật...</span>';
      saveBtn.disabled = true;
      setTimeout(() => {
        saveBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">check_circle</span><span>Đã lưu thành công!</span>';
        setTimeout(() => {
          saveBtn.innerHTML = originalHtml;
          saveBtn.disabled = false;
        }, 2000);
      }, 700);
    });
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
              <a aria-current="page" className="flex items-center gap-3 px-3 py-2.5 transition-all bg-primary-container text-on-primary font-semibold rounded-lg shadow-sm" data-path="khach-san-co-so" href="#">
                <span className="material-symbols-outlined text-[20px]">domain</span>
                Khách sạn & Cơ sở
              </a>
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all" data-path="kho-phong" href="#">
                <span className="material-symbols-outlined text-[20px]">bed</span>
                Kho phòng
              </a>
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all" data-path="lich-ton-kha-dung" href="#">
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
          <div className="flex flex-col w-full">
            {/* Page Header */}
            <div className="flex flex-col gap-6 pb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold tracking-wider uppercase text-secondary">Cài đặt đối tác</span>
                    <span className="text-outline-variant">•</span>
                    <span className="text-[11px] font-medium text-on-surface-variant">Mã cơ sở: #STAY-DN-8492</span>
                  </div>
                  <h1 className="font-headline font-bold text-2xl lg:text-3xl text-primary tracking-tight">Thông tin cơ sở, Hình ảnh & Chính sách</h1>
                  <p className="text-xs lg:text-sm text-on-surface-variant max-w-2xl">Quản lý hồ sơ công khai, bộ sưu tập ảnh phòng thực tế và quy định lưu trú hiển thị tới du khách.</p>
                </div>
                <div className="flex items-center gap-3">
                  <a className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-primary hover:bg-surface-container font-medium text-xs transition-colors h-11" href="#">
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    <span>Xem trang khách sạn công khai</span>
                  </a>
                  <button className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary-container text-on-primary font-medium text-xs hover:bg-primary shadow-sm transition-all h-11" id="btn-save-changes">
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    <span>Lưu thay đổi</span>
                  </button>
                </div>
              </div>
              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 p-1.5 bg-surface-container rounded-xl max-w-fit">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-lowest text-primary font-semibold text-xs shadow-sm transition-all">
                  <span className="material-symbols-outlined text-[18px]" style={{"fontVariationSettings":"'FILL' 1"}}>domain</span>
                  <span>Thông tin khách sạn</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/60 font-medium text-xs transition-all">
                  <span className="material-symbols-outlined text-[18px]">photo_library</span>
                  <span>Thư viện hình ảnh</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-surface-container-high text-on-surface-variant">32 ảnh</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/60 font-medium text-xs transition-all">
                  <span className="material-symbols-outlined text-[18px]">policy</span>
                  <span>Chính sách lưu trú & Hủy phòng</span>
                </button>
              </div>
            </div>
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              {/* Left Column (8 cols): Interactive Forms & Declarations */}
              <div className="xl:col-span-8 flex flex-col gap-8">
                {/* Section 1: Thông tin cơ bản & Định vị */}
                <section className="bg-surface-container-lowest rounded-2xl p-6 lg:p-8 shadow-sm flex flex-col gap-6 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-surface-container-high pb-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[20px]">apartment</span>
                      </span>
                      <div>
                        <h2 className="font-headline font-bold text-base text-on-surface">Thông tin cơ bản & Định vị thương hiệu</h2>
                        <p className="text-xs text-on-surface-variant">Dữ liệu định vị cốt lõi trên bản đồ du lịch Đà Nẵng</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-tertiary-fixed text-on-tertiary-fixed">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                      Đã đồng bộ OTA
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Tên cơ sở */}
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-on-surface flex items-center justify-between">
                        <span>Tên cơ sở lưu trú chính thức</span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-tertiary-container">
                          <span className="material-symbols-outlined text-[14px]">verified</span>
                          Hồ sơ đã được kiểm chứng
                        </span>
                      </label>
                      <div className="flex items-center gap-2 bg-surface-container-low px-3.5 py-2.5 rounded-xl text-xs text-on-surface">
                        <span className="material-symbols-outlined text-outline text-[18px]">storefront</span>
                        <input className="bg-transparent border-none w-full text-xs font-semibold text-on-surface focus:outline-none" type="text" defaultValue="An Nhiên Riverside Hotel" />
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">Chính thức</span>
                      </div>
                    </div>
                    {/* Phân loại / Hạng sao */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-on-surface">Hạng sao / Phân loại cơ sở</label>
                      <div className="flex items-center justify-between bg-surface-container-low px-3.5 py-2.5 rounded-xl text-xs">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary text-[18px]">hotel_class</span>
                          <span className="font-medium text-on-surface">4-Star Boutique Hotel</span>
                        </div>
                        <span className="text-[11px] text-on-surface-variant italic">Xác thực bởi StayReco</span>
                      </div>
                    </div>
                    {/* Tọa độ khoảng cách điểm nhấn */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-on-surface">Tọa độ & Khoảng cách biểu tượng</label>
                      <div className="flex items-center gap-2 bg-surface-container-low px-3.5 py-2.5 rounded-xl text-xs text-on-surface">
                        <span className="material-symbols-outlined text-secondary text-[18px]">near_me</span>
                        <input className="bg-transparent border-none w-full text-xs text-on-surface focus:outline-none" type="text" defaultValue="Cách Cầu Rồng 350m, nhìn trực diện sông Hàn" />
                      </div>
                    </div>
                    {/* Địa chỉ */}
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-on-surface">Địa chỉ thực tế</label>
                      <div className="flex items-center gap-2 bg-surface-container-low px-3.5 py-2.5 rounded-xl text-xs text-on-surface">
                        <span className="material-symbols-outlined text-outline text-[18px]">location_on</span>
                        <input className="bg-transparent border-none w-full text-xs text-on-surface focus:outline-none" type="text" defaultValue="128 Đường Bạch Đằng, Phường Hải Châu 1, Quận Hải Châu, TP. Đà Nẵng" />
                      </div>
                    </div>
                    {/* Liên hệ */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-on-surface">Số điện thoại lễ tân 24/7</label>
                      <div className="flex items-center gap-2 bg-surface-container-low px-3.5 py-2.5 rounded-xl text-xs text-on-surface">
                        <span className="material-symbols-outlined text-outline text-[18px]">call</span>
                        <input className="bg-transparent border-none w-full text-xs text-on-surface focus:outline-none" type="text" defaultValue="0236 3888 999" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-on-surface">Email nhận thông báo đặt phòng</label>
                      <div className="flex items-center gap-2 bg-surface-container-low px-3.5 py-2.5 rounded-xl text-xs text-on-surface">
                        <span className="material-symbols-outlined text-outline text-[18px]">alternate_email</span>
                        <input className="bg-transparent border-none w-full text-xs text-on-surface focus:outline-none" type="email" defaultValue="reservation@annhienriverside.vn" />
                      </div>
                    </div>
                    {/* Mô tả phong cách lưu trú (Rich text editor UI) */}
                    <div className="flex flex-col gap-2 md:col-span-2 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-on-surface">Mô tả phong cách lưu trú & Trải nghiệm</label>
                        <span className="text-[11px] text-on-surface-variant">420 ký tự (Đạt độ dài lý tưởng)</span>
                      </div>
                      <div className="bg-surface-container-low rounded-xl overflow-hidden">
                        <div className="flex items-center gap-1 px-3 py-2 bg-surface-container text-on-surface-variant text-xs">
                          <button className="p-1 rounded hover:bg-surface-container-highest text-on-surface transition-colors" type="button">
                            <span className="material-symbols-outlined text-[16px]">format_bold</span>
                          </button>
                          <button className="p-1 rounded hover:bg-surface-container-highest text-on-surface transition-colors" type="button">
                            <span className="material-symbols-outlined text-[16px]">format_italic</span>
                          </button>
                          <button className="p-1 rounded hover:bg-surface-container-highest text-on-surface transition-colors" type="button">
                            <span className="material-symbols-outlined text-[16px]">format_underlined</span>
                          </button>
                          <div className="h-4 w-px bg-outline-variant/50 mx-1"></div>
                          <button className="p-1 rounded hover:bg-surface-container-highest text-on-surface transition-colors" type="button">
                            <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
                          </button>
                          <button className="p-1 rounded hover:bg-surface-container-highest text-on-surface transition-colors" type="button">
                            <span className="material-symbols-outlined text-[16px]">format_quote</span>
                          </button>
                          <div className="h-4 w-px bg-outline-variant/50 mx-1"></div>
                          <span className="text-[11px] text-outline px-1">Gợi ý AI phong cách: Tự nhiên & Sang trọng</span>
                        </div>
                        <textarea className="w-full bg-transparent p-3.5 text-xs text-on-surface leading-relaxed focus:outline-none resize-none" rows="4" defaultValue="Nép mình bên bờ sông Hàn thơ mộng, An Nhiên Riverside mang đậm phong cách Indochine mộc mạc kết hợp hài hòa với nét hiện đại của đô thị miền biển. Mỗi gian phòng được chăm chút tỉ mỉ từ sàn gỗ tếch tự nhiên, rèm lanh dệt thủ công Hội An cho tới hệ cửa kính ban công cách âm đạt tiêu chuẩn Châu Âu. Khách lưu trú có thể thưởng thức trà sen ấm đầu ngày tại góc hiên ngắm bình minh và hòa mình vào làn nước xanh của hồ bơi vô cực trên tầng thượng." />
                      </div>
                    </div>
                  </div>
                </section>
                {/* Section 2: Tiện ích & Trải nghiệm đặc trưng */}
                <section className="bg-surface-container-lowest rounded-2xl p-6 lg:p-8 shadow-sm flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b border-surface-container-high pb-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[20px]">spa</span>
                      </span>
                      <div>
                        <h2 className="font-headline font-bold text-base text-on-surface">Tiện ích & Trải nghiệm cốt lõi</h2>
                        <p className="text-xs text-on-surface-variant">Bộ tiện nghi độc bản làm nổi bật đề xuất giá trị đến du khách thông thái</p>
                      </div>
                    </div>
                    <span className="text-xs text-outline font-medium">6/6 đã kích hoạt</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Item 1 */}
                    <label className="group flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container cursor-pointer transition-all">
                      <input defaultChecked={true} className="mt-0.5 h-4 w-4 rounded accent-primary text-on-primary focus:ring-0 cursor-pointer" type="checkbox" />
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-on-surface">Kính cách âm 2 lớp chuẩn Châu Âu</span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed">Đã kiểm định</span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant">Triệt tiêu 92% tiếng ồn phố thị bên ngoài</p>
                      </div>
                    </label>
                    {/* Item 2 */}
                    <label className="group flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container cursor-pointer transition-all">
                      <input defaultChecked={true} className="mt-0.5 h-4 w-4 rounded accent-primary text-on-primary focus:ring-0 cursor-pointer" type="checkbox" />
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-on-surface">Hồ bơi vô cực ngắm sông Hàn</span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed">Tầng 12 Rooftop</span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant">Mở cửa 06:00 - 21:00 hàng ngày</p>
                      </div>
                    </label>
                    {/* Item 3 */}
                    <label className="group flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container cursor-pointer transition-all">
                      <input defaultChecked={true} className="mt-0.5 h-4 w-4 rounded accent-primary text-on-primary focus:ring-0 cursor-pointer" type="checkbox" />
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-on-surface">Trà chiều thảo mộc Cù Lao Chàm</span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed">Signature</span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant">Phục vụ tại sảnh vườn nhiệt đới từ 15:00</p>
                      </div>
                    </label>
                    {/* Item 4 */}
                    <label className="group flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container cursor-pointer transition-all">
                      <input defaultChecked={true} className="mt-0.5 h-4 w-4 rounded accent-primary text-on-primary focus:ring-0 cursor-pointer" type="checkbox" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-on-surface">Bữa sáng nông sản hữu cơ</span>
                        <p className="text-[11px] text-on-surface-variant">Nông trại sinh thái Hội An giao tươi mỗi sáng</p>
                      </div>
                    </label>
                    {/* Item 5 */}
                    <label className="group flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container cursor-pointer transition-all">
                      <input defaultChecked={true} className="mt-0.5 h-4 w-4 rounded accent-primary text-on-primary focus:ring-0 cursor-pointer" type="checkbox" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-on-surface">Đưa đón sân bay Đà Nẵng 2 chiều</span>
                        <p className="text-[11px] text-on-surface-variant">Xe riêng đón tại sảnh ga T1 & T2 (đặt trước)</p>
                      </div>
                    </label>
                    {/* Item 6 */}
                    <label className="group flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container cursor-pointer transition-all">
                      <input defaultChecked={true} className="mt-0.5 h-4 w-4 rounded accent-primary text-on-primary focus:ring-0 cursor-pointer" type="checkbox" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-on-surface">Xe đạp dạo phố miễn phí</span>
                        <p className="text-[11px] text-on-surface-variant">Trang bị sẵn mũ bảo hiểm & khóa số tự động</p>
                      </div>
                    </label>
                  </div>
                </section>
                {/* Section 3: Quy định giờ giấc & Chính sách cốt lõi */}
                <section className="bg-surface-container-lowest rounded-2xl p-6 lg:p-8 shadow-sm flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b border-surface-container-high pb-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[20px]">rule</span>
                      </span>
                      <div>
                        <h2 className="font-headline font-bold text-base text-on-surface">Quy định giờ giấc & Chính sách cốt lõi</h2>
                        <p className="text-xs text-on-surface-variant">Rõ ràng, minh bạch giúp hạn chế khiếu nại phát sinh khi nhận phòng</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-outline text-[20px]">shield</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Check-in / Check-out */}
                    <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-3">
                      <span className="text-xs font-semibold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
                        Thời gian nhận & trả phòng
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-on-surface-variant">Giờ nhận phòng (Check-in)</span>
                          <div className="px-3 py-2 rounded-lg bg-surface-container-lowest font-headline font-bold text-sm text-primary">14:00</div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-on-surface-variant">Giờ trả phòng (Check-out)</span>
                          <div className="px-3 py-2 rounded-lg bg-surface-container-lowest font-headline font-bold text-sm text-primary">12:00</div>
                        </div>
                      </div>
                      <p className="text-[11px] text-outline">Nhận phòng sớm hoặc trả phòng trễ tùy thuộc vào tình trạng phòng sẵn có.</p>
                    </div>
                    {/* Cancellation Policy */}
                    <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-3">
                      <span className="text-xs font-semibold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">event_busy</span>
                        Chính sách hủy phòng mặc định
                      </span>
                      <div className="p-3 rounded-lg bg-surface-container-lowest flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-tertiary">Miễn phí hủy trước 48 giờ</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed">Hoàn 100%</span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant leading-relaxed">Nếu hủy sau mốc 48 giờ trước ngày nhận phòng, hệ thống sẽ thu phí đêm lưu trú đầu tiên.</p>
                      </div>
                    </div>
                    {/* Children & Extra Bed Policy */}
                    <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-3">
                      <span className="text-xs font-semibold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">child_care</span>
                        Trẻ em & Giường phụ (Extra Bed)
                      </span>
                      <div className="flex flex-col gap-2 text-xs text-on-surface-variant">
                        <div className="flex items-center justify-between p-2 rounded bg-surface-container-lowest">
                          <span>Trẻ dưới 6 tuổi (dùng chung giường):</span>
                          <span className="font-semibold text-tertiary">Miễn phí (Tối đa 1 bé)</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-surface-container-lowest">
                          <span>Phụ thu giường phụ nệm lông vũ:</span>
                          <span className="font-semibold text-on-surface">400.000 ₫ / đêm</span>
                        </div>
                      </div>
                    </div>
                    {/* Smoking & House Rules */}
                    <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-3">
                      <span className="text-xs font-semibold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">smoke_free</span>
                        Quy định hút thuốc & Trật tự
                      </span>
                      <div className="p-3 rounded-lg bg-surface-container-lowest flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-xs font-medium text-error">
                          <span className="material-symbols-outlined text-[16px]">cancel</span>
                          <span>Nghiêm cấm hút thuốc bên trong phòng ngủ</span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant leading-snug">Du khách chỉ được phép hút thuốc tại khu vực ban công riêng ngoài trời hoặc khu vườn mở tầng trệt.</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
              {/* Right Column (4 cols): Profile Completion, Listing Switch & Search Card Mockup Preview */}
              <div className="xl:col-span-4 flex flex-col gap-6 xl:sticky xl:top-24">
                {/* Card 1: Độ hoàn thiện hồ sơ */}
                <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="font-headline font-bold text-sm text-on-surface">Độ hoàn thiện hồ sơ</span>
                    <span className="font-headline font-bold text-sm text-tertiary">95%</span>
                  </div>
                  {/* Progress Track */}
                  <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                    <div className="h-full bg-tertiary-container rounded-full w-[95%] transition-all duration-500"></div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary-fixed/40">
                    <span className="material-symbols-outlined text-secondary text-[18px] mt-0.5">videocam</span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-on-secondary-container">Còn thiếu 1 mục đề xuất:</span>
                      <p className="text-[11px] text-on-secondary-fixed-variant leading-relaxed">Bổ sung video flycam toàn cảnh ban đêm nhìn ra Cầu Rồng để tăng 18% tỷ lệ chuyển đổi đặt phòng.</p>
                    </div>
                  </div>
                </div>
                {/* Card 2: Trạng thái niêm yết công khai */}
                <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="font-headline font-bold text-sm text-on-surface">Trạng thái hiển thị công khai</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-tertiary-fixed text-on-tertiary-fixed">
                      <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                      Đang mở bán
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant">Khách sạn đang mở hiển thị trên kênh tìm kiếm tự nhiên của StayReco và được phép nhận đặt phòng tự động.</p>
                  <div className="flex items-center justify-between pt-2 border-t border-surface-container">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-on-surface">Tạm dừng nhận khách mới</span>
                      <span className="text-[11px] text-outline">Bảo trì cơ sở vật chất</span>
                    </div>
                    <button aria-checked="false" className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full bg-surface-container-highest transition-colors duration-200 ease-in-out focus:outline-none" role="switch" type="button">
                      <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-surface-container-lowest shadow-sm transition duration-200 ease-in-out mt-1"></span>
                    </button>
                  </div>
                </div>
                {/* Card 3: G02 Card Mockup Preview (Marketplace hotel card) */}
                <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px]">visibility</span>
                      <span className="font-headline font-bold text-xs uppercase tracking-wider text-outline">Xem trước thẻ hiển thị (G02)</span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant">Tỷ lệ tương tác cao</span>
                  </div>
                  {/* Simulated Hotel Listing Card */}
                  <div className="group rounded-2xl bg-surface-container-lowest overflow-hidden shadow-md transition-all duration-300">
                    <div className="relative w-full h-44 bg-surface-container overflow-hidden">
                      <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="Warm sunlight casting golden rays across a tranquil boutique hotel room with wooden Indochine furniture and open balcony overlooking the Han River in Da Nang. Muted terracotta accents and clean linen textures fill the calm atmosphere." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxul1lufdbdBr3QVsWL3G8DJNR9l6vKf8NIr59_MRmuBbQ-mJpvWwW6Zo0Qf29Oc7yMVtJXnRunob6JLQybzIKlELmhAlXDr9sZAd_V_o5amG7xucB-xWnuZZMDR3wQMpEe76GqDjZgu4zP-L1CKPefvtLKVfize3H7kUYXVrNO5UXmXrMWdR1jKJafSUOtoL4FRd0WWJT-8QYOSYsb3_ssdZ3ygZm4CFc0gnIxQiYgUZ2dcSs8fRz" />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm shadow-sm">
                        <span className="text-[11px] font-bold text-secondary tracking-wide">Boutique</span>
                        <span className="text-[10px] text-outline">•</span>
                        <span className="text-[11px] text-on-surface font-medium">Bên sông Hàn</span>
                      </div>
                      <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm flex items-center justify-center text-primary shadow-sm cursor-pointer">
                        <span className="material-symbols-outlined text-[16px]">favorite</span>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col gap-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-medium text-secondary">Hải Châu, Đà Nẵng</span>
                          <h3 className="font-headline font-bold text-sm text-on-surface group-hover:text-primary transition-colors">An Nhiên Riverside Hotel</h3>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed">
                          <span className="material-symbols-outlined text-[14px]" style={{"fontVariationSettings":"'FILL' 1"}}>star</span>
                          <span className="font-headline font-bold text-xs">4.6</span>
                          <span className="text-[10px] text-on-tertiary-fixed/80">(128)</span>
                        </div>
                      </div>
                      {/* Recommendation Chips */}
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary-fixed text-on-primary-fixed">Kính cách âm cao cấp</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-surface-container text-on-surface-variant">Gần Cầu Rồng</span>
                      </div>
                      {/* Price & Tax Line */}
                      <div className="flex items-end justify-between pt-2 border-t border-surface-container">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-outline line-through">1.450.000 ₫</span>
                          <span className="font-headline font-bold text-base text-primary">
                            1.250.000 ₫
                            <span className="text-[11px] font-normal text-on-surface-variant">/ đêm</span>
                          </span>
                        </div>
                        <span className="text-[10px] text-outline font-medium">Đã gồm thuế & phí</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-on-surface-variant text-center pt-1 italic">Dữ liệu trên thẻ cập nhật đồng thời cùng các thay đổi bạn đã lưu.</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
