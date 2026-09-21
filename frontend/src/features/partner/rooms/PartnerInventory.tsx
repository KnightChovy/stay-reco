/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Legacy JSX display screen pending component-level migration.
import React from 'react';

export default function PartnerInventory() {
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
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all" data-path="khach-san-co-so" href="#">
                <span className="material-symbols-outlined text-[20px]">domain</span>
                Khách sạn & Cơ sở
              </a>
              <a aria-current="page" className="flex items-center gap-3 px-3 py-2.5 transition-all bg-primary-container text-on-primary font-semibold rounded-lg shadow-sm" data-path="kho-phong" href="#">
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
          <div className="flex flex-col w-full gap-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold tracking-widest uppercase text-secondary">Phân hệ Kho vận & Vận hành</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                  <span className="text-xs text-on-surface-variant">Mã cơ sở: #ANR-DN-01</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-headline font-bold text-on-surface tracking-tight">Danh mục Loại phòng & Quản lý Phòng vật lý</h1>
                <p className="text-xs lg:text-sm text-on-surface-variant max-w-3xl">
                  Phân tách rõ ràng giữa
                  <strong className="text-on-surface font-semibold">Loại phòng thương mại</strong>
                  (bán trên kênh trực tuyến StayReco & OTA) và
                  <strong className="text-on-surface font-semibold">Phòng vật lý thực tế</strong>
                  (đánh số phòng, vị trí tầng, trạng thái buồng phòng trực tiếp).
                </p>
              </div>
              <div className="flex items-center gap-3 self-start lg:self-auto flex-wrap">
                <button className="h-11 px-4 rounded-xl bg-surface-container-lowest text-on-surface font-semibold text-xs shadow-sm hover:bg-surface-container-low transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[18px]">add_home_work</span>
                  <span>Thêm phòng vật lý mới</span>
                </button>
                <button className="h-11 px-5 rounded-xl bg-primary-container text-on-primary font-semibold text-xs shadow-md hover:opacity-95 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>Tạo loại phòng mới</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 lg:gap-4">
              <div className="p-4 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant mb-2">
                  <span className="text-xs font-medium">Tổng phòng vật lý</span>
                  <span className="material-symbols-outlined text-primary text-[20px]">hotel</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl lg:text-3xl font-headline font-bold text-on-surface">36</span>
                  <span className="text-[11px] text-on-surface-variant font-medium">phòng thiết lập</span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{"width":"100%"}}></div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant mb-2">
                  <span className="text-xs font-medium">Hạng phòng thương mại</span>
                  <span className="material-symbols-outlined text-primary-container text-[20px]">category</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl lg:text-3xl font-headline font-bold text-primary-container">4</span>
                  <span className="text-[11px] text-tertiary font-semibold">100% mở bán</span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-primary-container h-full rounded-full" style={{"width":"100%"}}></div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant mb-2">
                  <span className="text-xs font-medium">Sẵn sàng đón khách</span>
                  <span className="material-symbols-outlined text-tertiary text-[20px]">check_circle</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl lg:text-3xl font-headline font-bold text-tertiary">32</span>
                  <span className="text-[11px] text-on-surface-variant font-medium">/ 36 phòng</span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-tertiary-container h-full rounded-full" style={{"width":"88.8%"}}></div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant mb-2">
                  <span className="text-xs font-medium">Đang bảo trì</span>
                  <span className="material-symbols-outlined text-secondary text-[20px]">handyman</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl lg:text-3xl font-headline font-bold text-secondary">02</span>
                  <span className="text-[11px] text-secondary font-medium">Hạ tầng lạnh</span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{"width":"5.5%"}}></div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-surface-container-lowest shadow-sm col-span-2 md:col-span-1 flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant mb-2">
                  <span className="text-xs font-medium">Khóa buồng bảo dưỡng</span>
                  <span className="material-symbols-outlined text-outline text-[20px]">lock_clock</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl lg:text-3xl font-headline font-bold text-on-surface-variant">02</span>
                  <span className="text-[11px] text-outline font-medium">Sơn định kỳ</span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-outline h-full rounded-full" style={{"width":"5.5%"}}></div>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-container-highest/60 pb-3">
              <div className="inline-flex p-1 bg-surface-container rounded-xl">
                <button className="px-5 py-2 rounded-lg bg-surface-container-lowest text-primary font-bold text-xs shadow-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">view_agenda</span>
                  <span>Loại phòng mở bán (4 hạng phòng)</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px]">Active</span>
                </button>
                <button className="px-5 py-2 rounded-lg text-on-surface-variant font-medium text-xs hover:text-on-surface flex items-center gap-2 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">meeting_room</span>
                  <span>Phòng vật lý thực tế (36 phòng)</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant text-[10px]">36</span>
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">tune</span>
                  <select className="pl-9 pr-8 h-10 bg-surface-container-lowest rounded-xl text-xs font-medium text-on-surface focus:outline-none shadow-sm cursor-pointer appearance-none">
                    <option>Tất cả trạng thái mở bán</option>
                    <option>Đang trực tuyến (Active)</option>
                    <option>Tạm ẩn / Đang bảo dưỡng</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-outline text-[16px] pointer-events-none">expand_more</span>
                </div>
                <button className="h-10 px-3 bg-surface-container-lowest rounded-xl text-xs font-medium text-on-surface hover:bg-surface-container-low transition-colors shadow-sm flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-primary">download</span>
                  <span>Xuất Excel kho</span>
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/5 rounded-full pointer-events-none"></div>
                <div className="flex flex-col xl:flex-row gap-6">
                  <div className="w-full xl:w-72 h-52 xl:h-auto rounded-2xl overflow-hidden relative flex-shrink-0">
                    <img className="w-full h-full object-cover" data-alt="Sophisticated boutique hotel deluxe bedroom in Da Nang overlooking Han River, floor to ceiling windows, morning natural light, warm timber accents, modern Vietnamese minimalism, tranquil coastal blue aesthetic" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXFPi3vmTOzUT2YE--5cVOO8SgCJxlFmVQMH_87r9Oj5FSj0_8w6m7NkebjM15ArtjzIf8NIqM3jGRtk7oJin-qxqVhkkB074TXyBkUgzFwETbpteA1XPcaBU-DoM8DHwxr3gJwtRx3FLV3lN1VlLSHgtWoG39nC0PDHt7k6iEbhQE4koRyc19czLtQnfEjb7BWsZmvZbSacV_O3P9FsHCL7V2IaTSDoDbnzWP2Z6lGF0zkiZxo_Ch" />
                    <div className="absolute top-3 left-3 bg-secondary text-on-secondary px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase shadow">Hạng phòng chủ lực</div>
                    <div className="absolute bottom-3 left-3 right-3 bg-inverse-surface/85 backdrop-blur-sm text-inverse-on-surface p-2 rounded-xl flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-tertiary-fixed">verified</span>
                        16 phòng kết nối
                      </span>
                      <span className="font-semibold text-tertiary-fixed">Đang mở bán</span>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-between gap-5">
                    <div>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-xl font-headline font-bold text-on-surface">Phòng Deluxe River View</h3>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-tertiary-fixed text-on-tertiary-fixed flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                            Đang mở bán trực tuyến
                          </span>
                          <span className="text-xs text-outline">SKU: DELUXE-RV-DANANG</span>
                        </div>
                        <div className="text-right flex items-baseline md:flex-col justify-between">
                          <span className="text-xs text-on-surface-variant font-medium">Giá bán cơ sở</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-headline font-bold text-secondary">1.250.000 ₫</span>
                            <span className="text-[11px] text-on-surface-variant">/ đêm</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed mb-4">Không gian nghỉ dưỡng thiết kế mở ôm trọn bờ sông Hàn Đà Nẵng, ban công lộng gió đón ánh bình minh. Phù hợp cho cặp đôi và chuyên gia lưu trú dài hạn.</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-3 px-4 bg-surface-container-low rounded-2xl">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-[18px]">aspect_ratio</span>
                          <div>
                            <div className="text-[10px] text-on-surface-variant uppercase font-medium">Diện tích</div>
                            <div className="text-xs font-semibold text-on-surface">28 m²</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-[18px]">group</span>
                          <div>
                            <div className="text-[10px] text-on-surface-variant uppercase font-medium">Tiêu chuẩn</div>
                            <div className="text-xs font-semibold text-on-surface">2 lớn + 1 trẻ em</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-[18px]">bed</span>
                          <div>
                            <div className="text-[10px] text-on-surface-variant uppercase font-medium">Giường ngủ</div>
                            <div className="text-xs font-semibold text-on-surface">1 King Bed (2m)</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-[18px]">balcony</span>
                          <div>
                            <div className="text-[10px] text-on-surface-variant uppercase font-medium">Điểm nhấn</div>
                            <div className="text-xs font-semibold text-on-surface">Ban công sông Hàn</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-surface-container flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div className="flex flex-col gap-1.5 w-full lg:w-auto">
                        <div className="flex items-center justify-between gap-3 text-xs text-on-surface-variant">
                          <span className="font-medium text-on-surface">Phòng vật lý liên kết (16 phòng):</span>
                          <span className="text-[11px] text-tertiary font-semibold">15 Sạch / 1 Chờ dọn</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-1 bg-surface-container rounded-lg text-xs font-semibold text-on-surface hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">301</span>
                          <span className="px-2 py-1 bg-surface-container rounded-lg text-xs font-semibold text-on-surface hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">302</span>
                          <span className="px-2 py-1 bg-surface-container rounded-lg text-xs font-semibold text-on-surface hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">303</span>
                          <span className="px-2 py-1 bg-surface-container rounded-lg text-xs font-semibold text-on-surface hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">304</span>
                          <span className="px-2 py-1 bg-surface-container rounded-lg text-xs font-semibold text-on-surface hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">305</span>
                          <span className="px-2 py-1 bg-surface-container rounded-lg text-xs font-semibold text-on-surface hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">306</span>
                          <span className="px-2 py-1 bg-surface-container rounded-lg text-xs font-semibold text-on-surface hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">307</span>
                          <span className="px-2 py-1 bg-secondary/15 text-secondary rounded-lg text-xs font-bold hover:bg-secondary hover:text-on-secondary transition-colors cursor-pointer" title="Chờ buồng phòng">308*</span>
                          <span className="px-2 py-1 bg-surface-container rounded-lg text-xs font-semibold text-on-surface hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">401</span>
                          <span className="px-2 py-1 bg-surface-container rounded-lg text-xs font-semibold text-on-surface hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">402</span>
                          <span className="px-2 py-1 bg-surface-container rounded-lg text-xs font-semibold text-on-surface hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">403</span>
                          <span className="px-2 py-1 bg-surface-container rounded-lg text-xs font-semibold text-on-surface hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">404</span>
                          <span className="px-2 py-1 bg-surface-container rounded-lg text-xs font-semibold text-on-surface hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">405</span>
                          <span className="px-2 py-1 bg-surface-container rounded-lg text-xs font-semibold text-on-surface hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">406</span>
                          <span className="px-2 py-1 bg-surface-container rounded-lg text-xs font-semibold text-on-surface hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">407</span>
                          <span className="px-2 py-1 bg-surface-container rounded-lg text-xs font-semibold text-on-surface hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">408</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end lg:self-center flex-shrink-0">
                        <button className="h-10 px-3.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs transition-colors flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                          <span>Sửa thông tin</span>
                        </button>
                        <button className="h-10 px-3.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-on-primary font-semibold text-xs transition-colors flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">grid_view</span>
                          <span>Quản lý 16 phòng con</span>
                        </button>
                        <button className="h-10 px-3 rounded-xl bg-surface-container text-on-surface-variant hover:text-error hover:bg-error-container transition-colors flex items-center" title="Tạm dừng bán">
                          <span className="material-symbols-outlined text-[18px]">pause_circle</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="flex flex-col xl:flex-row gap-6">
                  <div className="w-full xl:w-72 h-52 xl:h-auto rounded-2xl overflow-hidden relative flex-shrink-0">
                    <img className="w-full h-full object-cover" data-alt="Luxury suite hotel room in Vietnam with panoramic oversized balcony overlooking the Dragon Bridge, stone bathtub beside window, high ceilings, deep navy accents, terracotta warm tiles, serene ambience" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbmf2Lw3cnKLIdbjGuPU9eJ6d_iIYntHDRyJ3j80IHzV9-oSyCVydCdwvXb3-Nar_MkuOxKzuR58fy4-CP-oAw3BerLu4S0yqLU69vh02jQDb-JdOokNkHLu36wJ7V8-rH4zEig1L77CdFo6jzS2wYEubbMiz-U1EyaaZ8RiA0cQXPwBtkpXiJD7SjUHdZH264hAt48haTgHN5Da8p4vr10zsLPTSQw6zbEk4TciPqAHvlPweM26g5" />
                    <div className="absolute top-3 left-3 bg-primary-container text-on-primary px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase shadow">Hạng phòng cao cấp</div>
                    <div className="absolute bottom-3 left-3 right-3 bg-inverse-surface/85 backdrop-blur-sm text-inverse-on-surface p-2 rounded-xl flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-tertiary-fixed">verified</span>
                        8 phòng kết nối
                      </span>
                      <span className="font-semibold text-tertiary-fixed">Đang mở bán</span>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-between gap-5">
                    <div>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-xl font-headline font-bold text-on-surface">Riverside Suite ban công lớn</h3>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-tertiary-fixed text-on-tertiary-fixed flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                            Đang mở bán trực tuyến
                          </span>
                          <span className="text-xs text-outline">SKU: SUITE-RIV-VIP</span>
                        </div>
                        <div className="text-right flex items-baseline md:flex-col justify-between">
                          <span className="text-xs text-on-surface-variant font-medium">Giá bán cơ sở</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-headline font-bold text-secondary">1.850.000 ₫</span>
                            <span className="text-[11px] text-on-surface-variant">/ đêm</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed mb-4">Không gian sang trọng với sofa lounge tách biệt và bồn tắm đá lộ thiên hướng thẳng Cầu Rồng phun lửa cuối tuần. Trải nghiệm boutique cao cấp nhất tại An Nhiên.</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-3 px-4 bg-surface-container-low rounded-2xl">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-[18px]">aspect_ratio</span>
                          <div>
                            <div className="text-[10px] text-on-surface-variant uppercase font-medium">Diện tích</div>
                            <div className="text-xs font-semibold text-on-surface">42 m²</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-[18px]">group</span>
                          <div>
                            <div className="text-[10px] text-on-surface-variant uppercase font-medium">Tiêu chuẩn</div>
                            <div className="text-xs font-semibold text-on-surface">3 người lớn</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-[18px]">bed</span>
                          <div>
                            <div className="text-[10px] text-on-surface-variant uppercase font-medium">Giường ngủ</div>
                            <div className="text-xs font-semibold text-on-surface">1 King lớn + Sofa</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-[18px]">bathtub</span>
                          <div>
                            <div className="text-[10px] text-on-surface-variant uppercase font-medium">Điểm nhấn</div>
                            <div className="text-xs font-semibold text-on-surface">Bồn tắm đá ngắm cầu</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-surface-container flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div className="flex flex-col gap-1.5 w-full lg:w-auto">
                        <div className="flex items-center justify-between gap-3 text-xs text-on-surface-variant">
                          <span className="font-medium text-on-surface">Phòng vật lý liên kết (8 phòng):</span>
                          <span className="text-[11px] text-tertiary font-semibold">Tầng 5 & 6 ngắm trọn toàn cảnh</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2.5 py-1 bg-surface-container rounded-lg text-xs font-semibold text-on-surface hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">501</span>
                          <span className="px-2.5 py-1 bg-surface-container rounded-lg text-xs font-semibold text-on-surface hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">502</span>
                          <span className="px-2.5 py-1 bg-surface-container rounded-lg text-xs font-semibold text-on-surface hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">503</span>
                          <span className="px-2.5 py-1 bg-surface-container rounded-lg text-xs font-semibold text-on-surface hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">504</span>
                          <span className="px-2.5 py-1 bg-surface-container rounded-lg text-xs font-semibold text-on-surface hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">601</span>
                          <span className="px-2.5 py-1 bg-surface-container rounded-lg text-xs font-semibold text-on-surface hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">602</span>
                          <span className="px-2.5 py-1 bg-surface-container rounded-lg text-xs font-semibold text-on-surface hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">603</span>
                          <span className="px-2.5 py-1 bg-surface-container rounded-lg text-xs font-semibold text-on-surface hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">604</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end lg:self-center flex-shrink-0">
                        <button className="h-10 px-3.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs transition-colors flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                          <span>Sửa thông tin</span>
                        </button>
                        <button className="h-10 px-3.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-on-primary font-semibold text-xs transition-colors flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">grid_view</span>
                          <span>Quản lý 8 phòng con</span>
                        </button>
                        <button className="h-10 px-3 rounded-xl bg-surface-container text-on-surface-variant hover:text-error hover:bg-error-container transition-colors flex items-center" title="Tạm dừng bán">
                          <span className="material-symbols-outlined text-[18px]">pause_circle</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Hạng phòng ấm cúng</span>
                        <h4 className="text-lg font-headline font-bold text-on-surface">Superior Garden View</h4>
                        <p className="text-xs text-on-surface-variant mt-0.5">Không gian tĩnh lặng nhìn ra vườn nội khu xanh mát, sàn gạch men thủ công.</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-on-surface-variant">Giá bán</span>
                        <div className="text-xl font-headline font-bold text-secondary">980.000 ₫</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-surface-container-low rounded-xl mb-4 text-xs">
                      <div>
                        <span className="text-[10px] text-outline block">Diện tích</span>
                        <span className="font-semibold text-on-surface">25 m²</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-outline block">Sức chứa</span>
                        <span className="font-semibold text-on-surface">2 người lớn</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-outline block">Giường</span>
                        <span className="font-semibold text-on-surface">1 Queen hoặc 2 Twin</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-xs font-medium text-on-surface-variant">8 Phòng liên kết:</span>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 bg-surface-container rounded-md text-xs font-medium text-on-surface">201</span>
                        <span className="px-2 py-0.5 bg-surface-container rounded-md text-xs font-medium text-on-surface">202</span>
                        <span className="px-2 py-0.5 bg-surface-container rounded-md text-xs font-medium text-on-surface">203</span>
                        <span className="px-2 py-0.5 bg-surface-container rounded-md text-xs font-medium text-on-surface">204</span>
                        <span className="px-2 py-0.5 bg-surface-container rounded-md text-xs font-medium text-on-surface">205</span>
                        <span className="px-2 py-0.5 bg-surface-container rounded-md text-xs font-medium text-on-surface">206</span>
                        <span className="px-2 py-0.5 bg-surface-container rounded-md text-xs font-medium text-on-surface">207</span>
                        <span className="px-2 py-0.5 bg-surface-container rounded-md text-xs font-medium text-on-surface">208</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 mt-4 border-t border-surface-container flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs text-tertiary font-semibold">
                      <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                      Đang mở bán
                    </span>
                    <div className="flex items-center gap-2">
                      <button className="h-9 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-medium text-on-surface">Sửa</button>
                      <button className="h-9 px-3 rounded-lg bg-primary-container text-on-primary text-xs font-medium">Chi tiết 8 phòng</button>
                    </div>
                  </div>
                </div>
                <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Hạng phòng tiết kiệm</span>
                        <h4 className="text-lg font-headline font-bold text-on-surface">Studio Tiêu Chuẩn Gác Lửng</h4>
                        <p className="text-xs text-on-surface-variant mt-0.5">Thiết kế gác lửng thông minh, trần cao thoáng đãng, trang bị bàn làm việc nhỏ.</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-on-surface-variant">Giá bán</span>
                        <div className="text-xl font-headline font-bold text-secondary">850.000 ₫</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-surface-container-low rounded-xl mb-4 text-xs">
                      <div>
                        <span className="text-[10px] text-outline block">Diện tích</span>
                        <span className="font-semibold text-on-surface">22 m²</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-outline block">Sức chứa</span>
                        <span className="font-semibold text-on-surface">2 người lớn</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-outline block">Giường</span>
                        <span className="font-semibold text-on-surface">1 Double Bed lửng</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-xs font-medium text-on-surface-variant">4 Phòng liên kết:</span>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 bg-surface-container rounded-md text-xs font-medium text-on-surface">101</span>
                        <span className="px-2 py-0.5 bg-surface-container rounded-md text-xs font-medium text-on-surface">102</span>
                        <span className="px-2 py-0.5 bg-surface-container rounded-md text-xs font-medium text-on-surface">103</span>
                        <span className="px-2 py-0.5 bg-surface-container rounded-md text-xs font-medium text-on-surface">104</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 mt-4 border-t border-surface-container flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs text-tertiary font-semibold">
                      <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                      Đang mở bán
                    </span>
                    <div className="flex items-center gap-2">
                      <button className="h-9 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-medium text-on-surface">Sửa</button>
                      <button className="h-9 px-3 rounded-lg bg-primary-container text-on-primary text-xs font-medium">Chi tiết 4 phòng</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-headline font-bold text-on-surface">Điều phối Phòng vật lý theo Ca trực hôm nay</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-wider">Hôm nay, 24/10</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">Theo dõi nhanh tình trạng buồng phòng, phòng đang có khách ở và liên kết mã đặt phòng trực tiếp.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-[11px] text-on-surface-variant mr-2">
                    <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                    Sạch (24)
                    <span className="w-2 h-2 rounded-full bg-secondary ml-2"></span>
                    Đang ở (8)
                    <span className="w-2 h-2 rounded-full bg-secondary-container ml-2"></span>
                    Chờ dọn (2)
                    <span className="w-2 h-2 rounded-full bg-outline ml-2"></span>
                    Bảo trì (2)
                  </div>
                  <button className="h-9 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-medium text-on-surface flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">refresh</span>
                    <span>Làm mới</span>
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant font-semibold">
                      <th className="py-3 px-4 rounded-l-xl">Số phòng</th>
                      <th className="py-3 px-4">Tầng</th>
                      <th className="py-3 px-4">Loại phòng thương mại</th>
                      <th className="py-3 px-4">Tình trạng buồng phòng</th>
                      <th className="py-3 px-4">Trạng thái lưu trú</th>
                      <th className="py-3 px-4">Khách lưu trú & Mã Booking</th>
                      <th className="py-3 px-4 rounded-r-xl text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    <tr className="hover:bg-surface-container-low/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-on-surface font-headline">P.301</td>
                      <td className="py-3.5 px-4 text-on-surface-variant">Tầng 3</td>
                      <td className="py-3.5 px-4 font-medium text-on-surface">Deluxe River View</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-tertiary-fixed text-on-tertiary-fixed">
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                          Sạch - Đã kiểm tra
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-tertiary font-medium">Trống (Sẵn sàng đón)</span>
                      </td>
                      <td className="py-3.5 px-4 text-on-surface-variant">
                        <span>-- Chưa gán nhận hôm nay --</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-primary transition-colors" title="Cập nhật buồng">
                          <span className="material-symbols-outlined text-[18px]">edit_note</span>
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-on-surface font-headline">P.302</td>
                      <td className="py-3.5 px-4 text-on-surface-variant">Tầng 3</td>
                      <td className="py-3.5 px-4 font-medium text-on-surface">Deluxe River View</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary-fixed text-on-primary-fixed">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                          Đang có khách
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-secondary font-semibold">Đang lưu trú (Đêm 2/3)</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-on-surface">Nguyễn Văn Huy</span>
                          <a className="text-[11px] text-primary hover:underline font-mono" href="#">#BK-88291 (StayReco Direct)</a>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-primary transition-colors" title="Xem chi tiết đặt phòng">
                          <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-on-surface font-headline">P.308</td>
                      <td className="py-3.5 px-4 text-on-surface-variant">Tầng 3</td>
                      <td className="py-3.5 px-4 font-medium text-on-surface">Deluxe River View</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-secondary-fixed text-on-secondary-fixed">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                          Chờ dọn phòng
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-on-surface-variant font-medium">Khách trả 11:30</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="text-outline line-through">Lê Thị Mai (Đã trả)</span>
                          <span className="text-[11px] text-secondary font-medium">Đón khách mới lúc 15:00</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button className="px-2 py-1 bg-secondary text-on-secondary rounded-lg font-medium text-[11px] hover:opacity-90">Báo hoàn tất</button>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-on-surface font-headline">P.501</td>
                      <td className="py-3.5 px-4 text-on-surface-variant">Tầng 5</td>
                      <td className="py-3.5 px-4 font-medium text-on-surface">Riverside Suite ban công</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary-fixed text-on-primary-fixed">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                          Đang có khách
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-secondary font-semibold">Đang lưu trú (Đêm 1/2)</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-on-surface">David Miller (VIP)</span>
                          <a className="text-[11px] text-primary hover:underline font-mono" href="#">#BK-90412 (OTA Channel)</a>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-on-surface font-headline">P.204</td>
                      <td className="py-3.5 px-4 text-on-surface-variant">Tầng 2</td>
                      <td className="py-3.5 px-4 font-medium text-on-surface">Superior Garden View</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-error-container text-on-error-container">
                          <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                          Đang bảo trì
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-error font-medium">Khóa bán buồng</span>
                      </td>
                      <td className="py-3.5 px-4 text-on-surface-variant">
                        <span className="text-xs">Sửa hệ thống máy lạnh Daikin Inverter</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-[18px]">build</span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between pt-3 text-xs text-on-surface-variant">
                <span>Hiển thị 5 / 36 phòng vật lý tiêu biểu</span>
                <a className="text-primary font-semibold hover:underline flex items-center gap-1" href="#">
                  <span>Xem toàn bộ sơ đồ 36 phòng trực quan (Floor Plan)</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
