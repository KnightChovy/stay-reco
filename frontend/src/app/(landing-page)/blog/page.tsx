'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppBreadcrumb from '@/common/breadcrumb/AppBreadcrumb';
import ArticleCard, { type ArticleCardProps } from '@/common/card/ArticleCard';
import Pagination from '@/common/pagination/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function BlogPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const featuredArticle: ArticleCardProps = {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTMVfrBuTkxrOD13FSMCqwwPOmdnG1cgncEhi-mqqtEaWHgBbPsrN3dI4K_Gtdd2BPvvo1V42mcyHEM6UwrEIm8QeJ1FPqJ4NwQtdvVs4F3KAtKF5q1lK9oJd1qo7jwZgZHwU5SkdVCrW0Okn2oFGjD1qsjeif9kGgZCuQ1tIMTwMBe0Gpr9nkkyelThoMLVgFG9DYs-5976DqWE2y6UbvxaKpbRpY1Z4kD5FxA1tatVfyOVvJrvHB',
    category: 'Điểm đến nổi bật • Đà Nẵng – Hội An',
    title: 'Hành trình 48 giờ giữa phố cổ Hội An và nhịp thở biển Mỹ Khê: Chọn chỗ nghỉ nào để trọn vẹn yên bình?',
    excerpt: 'Không chỉ là chuyến đi nghỉ dưỡng đơn thuần, hành trình dẫn bạn qua những ngõ nhỏ đầy hoa giấy, thưởng thức tách cà phê mộc bên sông Hoài và dừng chân tại những chốn dừng bình yên...',
    date: '14/10/2026',
    readTime: '6 phút đọc',
    author: 'Bảo Ngọc (Biên tập viên Du lịch StayReco)',
    href: '/blog/hanh-trinh-48-gio-hoi-an',
    variant: 'featured',
  };

  const recentArticles: ArticleCardProps[] = [
    {
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADUkVMp5PS1S58792y50WIF6y77NAWnRFRJ1LxN2XQx1Cnfds3oIPxsVHyjqdIgjskUxZeCX5y8yMDETl8r8TRN1rYjPva0cmwGDVsQ2dZCICnDWtyBSXKroPYmHR9P0qLOLCzAHb9J3SFEfNKkTRDPHxdPbvX0ErknXVrd-OvVrEJYIexoKLk6u',
      category: 'Đà Nẵng & Hội An',
      title: 'Khách sạn boutique ven sông Hàn: Gợi ý 5 chốn dừng chân bình yên cho kỳ nghỉ thu',
      excerpt: 'Tổng hợp những chỗ nghỉ có tầm nhìn đẹp hướng dòng sông Hàn hiền hòa, không gian tĩnh lặng và phong cách phục vụ chu đáo.',
      date: '12 Tháng 10, 2025',
      readTime: '5 phút đọc',
      href: '/blog/khach-san-boutique-ven-song-han',
    },
    {
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAtctY_xduF9lcOrv8ZQ5sYMVArtk8gOTwQaMff1JnxMS_HR3GP7b1J61OliW5pEt9MnS5UYnpeKegwUTMUEdFob9DAfzD2Q-XCyz1f8462o_076VKNzHitwo0bmReVYsBaxoZmk39LLzQi7u6Y0pC4WM_OCEMLg8qn0G5GFGFo68AWhb2NghEyw1XgJMmbxpXNvJEZtTVmHDEn2gikJ74wlYvnksT5g84aXG-fqN0248eqe7tMSsWT',
      category: 'Đà Lạt & Tây Nguyên',
      title: 'Mùa hồng chín Đà Lạt: Những căn nhà gỗ nép mình bên thung lũng sương mờ',
      excerpt: 'Tìm về không gian ngập tràn sắc thu Đà Lạt với mây mù ôm trọn đỉnh đồi và hương cà phê mộc ngát thơm mỗi sáng.',
      date: '08 Tháng 10, 2025',
      readTime: '4 phút đọc',
      href: '/blog/mua-hong-chin-da-lat',
    },
    {
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC2dKNhaI2RdzWIDw82Eknynx_Ue4_cKR_WnWwst9iCYdWEm56ae23eGpLZ6oJrGTUTma_9DCGTf-DSnIXe_FWjMR_K__dBNnCus2wTbKIUTgWO16TX8VsHxW9NzdkCG22FHyFoGJazUqq7HINCVmIk2dt7DP1EfyZLzTYeOLhpgG7qhNW-7hwE81kKskpOM71aPHhrb3Mb4olgekWo_7SQ0qTwPtMtVV1gDKCCaKsGnHP9wGz9xgcx',
      category: 'Kinh nghiệm lưu trú',
      title: 'Bí quyết nhận ưu đãi nâng hạng phòng boutique mà không phát sinh thêm chi phí',
      excerpt: 'Những mẹo nhỏ hữu ích giúp bạn tối ưu trải nghiệm đặt phòng, chọn được căn phòng có tầm nhìn đẹp nhất.',
      date: '05 Tháng 10, 2025',
      readTime: '3 phút đọc',
      href: '/blog/cam-nang-chon-khach-san-hoi-an',
    },
    {
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZqGXypWUPjU_JJfsAj1ajYd95RaOQLpxjLOzWrIEcgep9FEYmUTStyKUdL7zKysIsUwszYJ6RHt5nDL2LA_GFP3rvKZ0z-SksZcy7olj71ZsN5TXp2pSwfQKEBmmCF35xaya1SULTJFr12W1Mw9KPczYP-_08S5L1AyiaU4sXi70VY30WT3ulB-ArXLwnfuejolX9D8jiDvSzowi2Pa4yAyz0sBjTvXzvkl3Un1I7Z3sE_JsyymQz',
      category: 'Ẩm thực & Bản sắc',
      title: 'Thưởng thức mì Quảng và văn hóa ẩm thực địa phương qua góc nhìn người bản địa',
      excerpt: 'Khám phá hương vị đậm đà truyền thống và câu chuyện đằng sau những tô mì Quảng chuẩn vị xứ Quảng.',
      date: '01 Tháng 10, 2025',
      readTime: '6 phút đọc',
      href: '/blog/am-thuc-mi-quang',
    },
    {
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxuV-_sCk6qHy_-_J2rZ80j3Gg69eMkFzilGt3TclU_0EvBcVRCLbT0RcQd1BWAEYX4iuaN4d0_0ZLOgMb5j3sIcmp2WuqjoKJexyRckGbmLyqephAcEnhZFMCfV7tyFgH5_m41EehgVcuSEMloGxazBbrkL7E10A0VzaOytzNWpZohUKrJ6S5_uRnZN2ggWuJ1xDi6kLSgQtYEikMqMBSOaTKHeRu_fqlDjq87TIsvnj_5AfUrn_0',
      category: 'Biển đảo Việt Nam',
      title: 'Phú Quốc mùa biển lặng: Trải nghiệm lưu trú tại các resort xanh bền vững',
      excerpt: 'Hòa mình vào làn nước trong xanh và tận hưởng kỳ nghỉ thân thiện với môi trường tại đảo ngọc.',
      date: '28 Tháng 9, 2025',
      readTime: '5 phút đọc',
      href: '/blog/phu-quoc-mua-bien-lang',
    },
    {
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuByhsK6-AXvkU1uzKcnr7bVQEjGixnPYwbBnpf7XBpHb48CgVpJeiUp2usPNNrFc39DsjzCzN1H8BLbRG6pHoj5SgifZ_HKYKs6-b0PgL4iuqUUsodimcbdK2KE4mTG2C7Sxu2ifb4wq28XmQPF3tD2MdIeN2mSz2U2v0sGEW0FsFJreS_kHAY-c_WAXNVeQZAX2qMfDkCxtTOr6dL2A6z7Pmsgwph_mxQpUYzgnzZWrVzN8UHa5gGk',
      category: 'Kiến trúc & Cảm hứng',
      title: 'Tinh thần Indochine trong kiến trúc lưu trú Việt Nam hiện đại',
      excerpt: 'Sự kết hợp tinh tế giữa đường nét hoài cổ và tiện nghi hiện đại mang đến chiều sâu cho từng không gian nghỉ dưỡng.',
      date: '25 Tháng 9, 2025',
      readTime: '7 phút đọc',
      href: '/blog/tinh-than-indochine-trong-kien-truc',
    },
  ];

  const filterTabs = [
    { id: 'all', label: 'Tất cả bài viết', count: 24 },
    { id: 'danang', label: 'Đà Nẵng & Hội An', count: 12 },
    { id: 'dalat', label: 'Đà Lạt phố sương', count: 6 },
    { id: 'boutique', label: 'Nghệ thuật lưu trú Boutique', count: 4 },
    { id: 'food', label: 'Ẩm thực & Văn hóa', count: 8 },
    { id: 'tips', label: 'Kinh nghiệm đặt phòng...' },
  ];

  return (
    <div className="min-h-screen flex flex-col antialiased text-slate-800 bg-[#f7f6f2]">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="grow w-full max-w-310 mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Breadcrumb */}
        <AppBreadcrumb
          items={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Blog du lịch' },
          ]}
          className="mb-3"
        />

        {/* Page Heading */}
        <div className="mb-6 max-w-3xl">
          <h1 className="text-2xl sm:text-[32px] font-bold tracking-tight text-[#1a2d42] leading-tight mb-2">
            Cảm hứng cho chuyến đi tiếp theo
          </h1>
          <p className="text-stone-600 text-sm sm:text-[15px] leading-relaxed">
            Khám phá câu chuyện lưu trú bản địa, kinh nghiệm du lịch thực tế và văn hóa nghỉ dưỡng từ các chuyên gia StayReco.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-5 max-w-2xl">
          <div className="relative flex items-center bg-white border border-stone-300/80 rounded-xl p-1.5 shadow-xs focus-within:ring-2 focus-within:ring-[#18385c]/20 focus-within:border-[#18385c] transition-all">
            <div className="pl-3 pr-2 text-stone-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </div>
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bài viết, điểm đến (ví dụ: Đà Nẵng, Hội An, Đà Lạt)..."
              className="w-full bg-transparent border-0 focus-visible:ring-0 text-sm text-stone-700 placeholder-stone-400 shadow-none"
            />
            <Button
              className="bg-[#18385c] hover:bg-[#122b47] text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0"
            >
              Tìm kiếm
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-8 text-xs sm:text-sm whitespace-nowrap">
          {filterTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-1.5 h-auto text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#18385c] text-white hover:bg-[#122b47]'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                {tab.label} {tab.count !== undefined && <span className={isActive ? 'text-blue-100 font-normal ml-1' : 'text-stone-400 font-normal ml-1'}>({tab.count})</span>}
              </Button>
            );
          })}
        </div>

        {/* Featured Article Card */}
        <section className="mb-14">
          <ArticleCard {...featuredArticle} />
        </section>

        {/* Recent Articles Section */}
        <section className="mb-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-2 border-b border-stone-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Bài viết mới cập nhật</h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">Chọn lọc các địa điểm độc bản, chia sẻ phong vị ẩm thực và góc nhìn lưu trú</p>
            </div>
            <div className="mt-3 sm:mt-0 flex items-center gap-1.5 text-xs text-stone-500">
              <span>Sắp xếp theo:</span>
              <button className="font-semibold text-slate-800 hover:text-[#18385c] flex items-center gap-1 cursor-pointer">
                Mới nhất
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </button>
            </div>
          </div>

          {/* Article Grid (3 columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentArticles.map((article, idx) => (
              <ArticleCard key={idx} {...article} variant="grid" />
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-10 pt-4 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={3}
              onPageChange={setCurrentPage}
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
