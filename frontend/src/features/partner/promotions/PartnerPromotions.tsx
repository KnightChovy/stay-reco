/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Legacy JSX display screen pending component-level migration.
import React from 'react';

export default function PartnerPromotions() {
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
              <a aria-current="page" className="flex items-center gap-3 px-3 py-2 transition-colors bg-primary-container text-on-primary font-medium rounded-lg shadow-sm" data-path="chien-dich-va-giam-gia" href="#">
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
            {/* Top Command & Breadcrumb Section */}
            <div className="px-8 pt-8 pb-6 bg-surface-container-lowest">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <nav className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
                    <span className="hover:text-primary transition-colors cursor-pointer">Tiếp thị & Khách hàng</span>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    <span className="text-primary font-semibold">Chiến dịch & Mã giảm giá</span>
                  </nav>
                  <h1 className="text-2xl font-bold font-headline tracking-tight text-primary">Chiến dịch Khuyến mãi & Mã Voucher Khách sạn</h1>
                  <p className="text-xs text-on-surface-variant max-w-2xl leading-relaxed">
                    Thiết lập các chương trình kích cầu lưu trú, voucher riêng của
                    <span className="font-semibold text-on-surface">An Nhiên Riverside Hotel</span>
                    và kiểm soát điều kiện áp dụng minh bạch theo chuẩn lòng tin lưu trú.
                  </p>
                </div>
                {/* Main Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <button className="h-11 px-4 bg-surface-container-lowest text-on-surface rounded-lg text-xs font-semibold hover:bg-surface-container-low transition-all duration-200 shadow-sm flex items-center gap-2" type="button">
                    <span className="material-symbols-outlined text-[18px] text-secondary">analytics</span>
                    Báo cáo hiệu quả voucher
                  </button>
                  <button className="h-11 px-5 bg-primary-container text-on-primary rounded-lg text-xs font-semibold hover:bg-primary transition-all duration-200 shadow-sm flex items-center gap-2" type="button">
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    + Tạo chiến dịch mới
                  </button>
                </div>
              </div>
            </div>
            <div className="p-8 space-y-8 bg-surface">
              {/* Khu vực 1: 4 Thẻ KPI chương trình khuyến mãi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {/* Card 1 */}
                <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Tổng mã phát hành</span>
                      <div className="text-3xl font-bold text-primary font-headline tracking-tight mt-1">
                        450
                        <span className="text-sm font-normal text-on-surface-variant">mã</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[22px]">confirmation_number</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 flex items-center justify-between text-[11px]">
                    <span className="text-on-surface-variant">3 chương trình đang kích hoạt</span>
                    <span className="inline-flex items-center text-tertiary font-semibold gap-0.5">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      100% hợp lệ
                    </span>
                  </div>
                </div>
                {/* Card 2 */}
                <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Áp dụng thành công</span>
                      <div className="text-3xl font-bold text-primary font-headline tracking-tight mt-1">
                        128
                        <span className="text-sm font-normal text-on-surface-variant">lượt</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-tertiary-fixed flex items-center justify-center text-tertiary">
                      <span className="material-symbols-outlined text-[22px]">sell</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 flex items-center justify-between text-[11px] bg-surface-container-low/60 -mx-5 -mb-5 px-5 py-2.5">
                    <span className="text-on-surface-variant">Doanh thu kích cầu:</span>
                    <span className="font-bold text-primary">288.000.000 ₫</span>
                  </div>
                </div>
                {/* Card 3 */}
                <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Chi phí voucher tài trợ</span>
                      <div className="text-3xl font-bold text-secondary font-headline tracking-tight mt-1">
                        32.000.000
                        <span className="text-sm font-normal text-on-surface-variant">₫</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-secondary-fixed flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-[22px]">payments</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 flex items-center justify-between text-[11px] bg-secondary-fixed/30 -mx-5 -mb-5 px-5 py-2.5">
                    <span className="text-on-secondary-fixed-variant font-medium">Chỉ số ROI chiến dịch:</span>
                    <span className="font-bold text-secondary text-xs">9.0x doanh thu</span>
                  </div>
                </div>
                {/* Card 4 */}
                <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Tỷ lệ chuyển đổi booking</span>
                      <div className="text-3xl font-bold text-primary font-headline tracking-tight mt-1">24.5%</div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[22px]">trending_up</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 flex items-center gap-2 text-[11px]">
                    <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary-container h-1.5 rounded-full" style={{"width":"24.5%"}}></div>
                    </div>
                    <span className="text-tertiary font-medium shrink-0">+4.2%</span>
                  </div>
                </div>
              </div>
              {/* Main Workspace Layout: Campaigns List & Detail Inspection */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Khu vực 2: Danh sách chiến dịch đang diễn ra & đã lên lịch (8 Cols) */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-primary font-headline tracking-tight">Chiến dịch đang triển khai & Lịch sắp tới</h2>
                      <p className="text-xs text-on-surface-variant">Kiểm soát tiến độ sử dụng hạn mức ngân sách và quy tắc áp phòng</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-container-lowest text-primary shadow-sm hover:bg-surface-container-low transition-colors">Tất cả (3)</button>
                      <button className="px-3 py-1.5 text-xs font-medium rounded-lg text-on-surface-variant hover:bg-surface-container-lowest transition-colors">Đang hoạt động</button>
                      <button className="px-3 py-1.5 text-xs font-medium rounded-lg text-on-surface-variant hover:bg-surface-container-lowest transition-colors">Đã lên lịch</button>
                    </div>
                  </div>
                  {/* Campaign Card 1: ANHNIEN250 */}
                  <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm hover:shadow-md transition-all space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-tertiary-container/10 text-tertiary flex items-center justify-center font-bold text-lg">
                          <span className="material-symbols-outlined text-[20px]">local_offer</span>
                        </span>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h3 className="font-bold text-sm text-on-surface font-headline">Voucher Độc quyền Thu Đông</h3>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-tertiary-fixed text-on-tertiary-fixed">
                              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                              Đang hoạt động
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-xs font-bold text-primary bg-primary-fixed px-2 py-0.5 rounded">ANHNIEN250</span>
                            <span className="text-xs text-secondary font-semibold">Giảm 250.000 ₫ trực tiếp</span>
                            <span className="text-xs text-outline">•</span>
                            <span className="text-xs text-on-surface-variant">Đơn tối thiểu 2.000.000 ₫</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 self-end sm:self-auto">
                        <button className="p-2 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-container-low transition-colors" title="Chỉnh sửa">
                          <span className="material-symbols-outlined text-[18px]">edit_note</span>
                        </button>
                        <button className="p-2 text-on-surface-variant hover:text-secondary rounded-lg hover:bg-surface-container-low transition-colors" title="Tạm dừng">
                          <span className="material-symbols-outlined text-[18px]">pause_circle</span>
                        </button>
                      </div>
                    </div>
                    {/* Quota & Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-lg bg-surface-container-low/60 text-xs">
                      <div className="space-y-1">
                        <span className="text-[11px] font-medium text-on-surface-variant">Hạng phòng áp dụng:</span>
                        <p className="font-semibold text-on-surface">Deluxe River View & Riverside Suite</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[11px] font-medium text-on-surface-variant">Thời gian hiệu lực:</span>
                        <p className="font-semibold text-on-surface">01/10 - 30/11/2026</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-medium text-on-surface-variant">Hạn mức sử dụng:</span>
                          <span className="font-bold text-primary">84 / 200 lượt</span>
                        </div>
                        <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden mt-1">
                          <div className="bg-primary-container h-2 rounded-full" style={{"width":"42%"}}></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 text-[11px] text-on-surface-variant">
                      <div className="flex items-center gap-1.5 text-secondary">
                        <span className="material-symbols-outlined text-[16px]">info</span>
                        <span>Điều kiện: Không cộng dồn cùng mã flash-sale khác. Tối đa 01 voucher/lượt đặt.</span>
                      </div>
                      <span className="font-mono text-[10px] text-outline">Tạo bởi: Quản trị viên (15 ngày trước)</span>
                    </div>
                  </div>
                  {/* Campaign Card 2: EARLYFEST15 */}
                  <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm hover:shadow-md transition-all space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-secondary-fixed/40 text-secondary flex items-center justify-center font-bold text-lg">
                          <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                        </span>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h3 className="font-bold text-sm text-on-surface font-headline">Ưu đãi Đặt trước Mùa Lễ Hội</h3>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container-high text-on-surface-variant">
                              <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                              Đã lên lịch kích hoạt
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-xs font-bold text-secondary bg-secondary-fixed px-2 py-0.5 rounded">EARLYFEST15</span>
                            <span className="text-xs text-primary font-semibold">Giảm 15% tổng tiền phòng</span>
                            <span className="text-xs text-outline">•</span>
                            <span className="text-xs text-on-surface-variant">Tối đa giảm 300.000 ₫</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 self-end sm:self-auto">
                        <button className="p-2 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-container-low transition-colors" title="Chỉnh sửa">
                          <span className="material-symbols-outlined text-[18px]">edit_note</span>
                        </button>
                        <button className="p-2 text-on-surface-variant hover:text-error rounded-lg hover:bg-surface-container-low transition-colors" title="Hủy lịch">
                          <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                        </button>
                      </div>
                    </div>
                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-lg bg-surface-container-low/60 text-xs">
                      <div className="space-y-1">
                        <span className="text-[11px] font-medium text-on-surface-variant">Hạng phòng áp dụng:</span>
                        <p className="font-semibold text-on-surface">Toàn bộ hạng phòng tại khách sạn</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[11px] font-medium text-on-surface-variant">Quy định đặt sớm:</span>
                        <p className="font-semibold text-secondary">Đặt trước tối thiểu 30 ngày</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[11px] font-medium text-on-surface-variant">Kỳ áp dụng lưu trú:</span>
                        <p className="font-semibold text-on-surface">20/12/2026 - 05/01/2027</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 text-[11px] text-on-surface-variant">
                      <div className="flex items-center gap-1.5 text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px]">verified</span>
                        <span>Áp dụng tự động trên kênh StayReco khi du khách thỏa mãn mốc thời gian booking.</span>
                      </div>
                      <span className="text-xs font-semibold text-primary">Kích hoạt sau 14 ngày</span>
                    </div>
                  </div>
                  {/* Campaign Card 3: WELLNESS PACKAGE */}
                  <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm hover:shadow-md transition-all space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-bold text-lg">
                          <span className="material-symbols-outlined text-[20px]">spa</span>
                        </span>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h3 className="font-bold text-sm text-on-surface font-headline">Gói Chăm sóc Sức khỏe Thảo mộc</h3>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-tertiary-fixed text-on-tertiary-fixed">
                              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                              Đang hoạt động
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-xs font-bold text-tertiary bg-tertiary-container/10 px-2 py-0.5 rounded">HERBALTEA</span>
                            <span className="text-xs text-primary font-semibold">Tặng kèm Set Trà chiều Thảo mộc sông Hàn</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 self-end sm:self-auto">
                        <button className="p-2 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-container-low transition-colors">
                          <span className="material-symbols-outlined text-[18px]">edit_note</span>
                        </button>
                        <button className="p-2 text-on-surface-variant hover:text-secondary rounded-lg hover:bg-surface-container-low transition-colors">
                          <span className="material-symbols-outlined text-[18px]">pause_circle</span>
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-lg bg-surface-container-low/60 text-xs">
                      <div className="space-y-1">
                        <span className="text-[11px] font-medium text-on-surface-variant">Hình thức ưu đãi:</span>
                        <p className="font-semibold text-on-surface">Voucher Quà tặng Dịch vụ F&B</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[11px] font-medium text-on-surface-variant">Điều kiện booking:</span>
                        <p className="font-semibold text-on-surface">Lưu trú từ 2 đêm liên tiếp</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[11px] font-medium text-on-surface-variant">Hạn mức cấp:</span>
                        <p className="font-semibold text-tertiary">Không giới hạn số lượt</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Right Column: Khu vực 3 & 4 (4 Cols) */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Khu vực 3: Live Pricing Breakdown ví dụ áp dụng (Theo chuẩn StayReco) */}
                  <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">calculate</span>
                      <h3 className="font-bold text-sm text-primary font-headline">Minh bạch Giá & Giảm trừ Voucher</h3>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Xem trước cách thức hiển thị giá thực tế cho khách lưu trú khi áp mã
                      <span className="font-mono font-semibold text-primary">ANHNIEN250</span>
                      . Cam kết không phí ẩn, không tạo độ khan hiếm ảo.
                    </p>
                    {/* Room Context Mini-Card */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low">
                      <img className="w-14 h-14 rounded-lg object-cover" data-alt="Boutique hotel room interior at An Nhien Riverside Hotel with warm wooden furniture and river view through panoramic floor-to-ceiling glass doors in soft natural morning daylight" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBEX2um7r7xuH_z3X3ChS1c8EYLkHHsLDeHXQ0JdO5ZAUHgzTXfKTpOQN1P_yDhGNIM_Uc5M1YXaUNPfc_JwtPPsfGZeuymJbE2gV96AqeqtQr1p9G7jkwKPoxuZZD_BTb55enF2OgaPyxLVF4vjoWY4wlMWwk5Itw2XQEZHUNKWPBZpb01HRxNOBYR6HeOsqtqJtKS8iWwgT3qNrwUV2b7pOfKfdTanTb9m4FR6l-sx-jhzg5QL3Qj" />
                      <div className="min-w-0">
                        <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider">Hạng phòng mẫu</span>
                        <h4 className="text-xs font-bold text-on-surface truncate">Deluxe River View (2 Đêm)</h4>
                        <p className="text-[11px] text-on-surface-variant">2 người lớn • Bao gồm buffet sáng</p>
                      </div>
                    </div>
                    {/* Billing Breakdown Lines */}
                    <div className="space-y-3 pt-2 text-xs">
                      <div className="flex justify-between items-center text-on-surface-variant">
                        <span>Giá phòng gốc niêm yết (2 đêm)</span>
                        <span className="font-medium text-on-surface">2.500.000 ₫</span>
                      </div>
                      <div className="flex justify-between items-center text-secondary font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">local_offer</span>
                          <span>Voucher ANHNIEN250</span>
                        </div>
                        <span>- 250.000 ₫</span>
                      </div>
                      <div className="flex justify-between items-center text-on-surface-variant">
                        <span>Thuế GTGT (8%) & Phí dịch vụ (5%)</span>
                        <span className="text-tertiary font-medium">Đã bao gồm đầy đủ</span>
                      </div>
                      <div className="h-px bg-surface-container-high my-2"></div>
                      <div className="flex justify-between items-end pt-1">
                        <div>
                          <span className="text-[11px] text-on-surface-variant block">Khách thực thanh toán</span>
                          <span className="text-[10px] text-tertiary font-medium">Đúng số tiền khi xác nhận</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold font-headline text-primary tracking-tight">2.250.000 ₫</div>
                          <span className="text-[10px] text-outline-variant">Thanh toán trực tuyến / Tại lễ tân</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-surface-container-low/70 rounded-lg text-[11px] text-on-surface-variant flex items-start gap-2">
                      <span className="material-symbols-outlined text-primary text-[16px] shrink-0 mt-0.5">verified_user</span>
                      <span>Khách sạn được StayReco đối soát tự động khoản tài trợ 250.000 ₫ vào kỳ thanh toán định kỳ thứ Hai hàng tuần.</span>
                    </div>
                  </div>
                  {/* Khu vực 4: Liên kết luồng marketing AI (S09/S10) */}
                  <div className="bg-primary text-on-primary rounded-xl p-6 shadow-md relative overflow-hidden space-y-4">
                    <div className="relative z-10 space-y-2">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-tertiary-container text-on-tertiary-container">
                        <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                        Tích hợp S09 / S10
                      </div>
                      <h3 className="font-bold text-base font-headline tracking-tight text-on-primary">Khuyếch đại Tiếp thị với AI</h3>
                      <p className="text-xs text-on-primary-container leading-relaxed">
                        Tự động trích xuất các điều kiện, quyền lợi từ mã
                        <span className="font-mono text-surface-bright font-bold">ANHNIEN250</span>
                        và sinh nội dung bài viết quảng bá chuẩn phong cách mộc mạc của An Nhiên Riverside.
                      </p>
                    </div>
                    <div className="relative z-10 pt-2">
                      <button className="w-full h-11 px-4 bg-surface-container-lowest text-primary rounded-lg text-xs font-bold hover:bg-surface-container-low transition-all duration-200 shadow-sm flex items-center justify-center gap-2 group" type="button">
                        <span>Đẩy nội dung sang Thư viện Marketing AI (S09/S10)</span>
                        <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                      </button>
                    </div>
                    {/* Ambient Decorative Accent */}
                    <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-primary-container/40 pointer-events-none blur-xl"></div>
                  </div>
                  {/* Tips & Guidance Card */}
                  <div className="p-5 rounded-xl bg-surface-container-lowest shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
                      <span className="material-symbols-outlined text-secondary text-[18px]">lightbulb</span>
                      <span>Gợi ý tối ưu hiệu quả voucher</span>
                    </div>
                    <ul className="text-xs text-on-surface-variant space-y-2 list-disc pl-4 leading-relaxed">
                      <li>Nên kết hợp mã giảm giá với các đêm giữa tuần (Chủ nhật - Thứ 5) để cân bằng tỷ lệ lấp phòng.</li>
                      <li>Hạn chế đặt giới hạn áp dụng quá khắt khe khiến trải nghiệm khách hàng bị gián đoạn.</li>
                    </ul>
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
