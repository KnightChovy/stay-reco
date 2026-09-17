'use client';

import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSearch from '@/common/search/HeroSearch';
import HotelCard from '@/common/card/HotelCard';
import DestinationCard from '@/common/card/DestinationCard';
import ArticleCard from '@/common/card/ArticleCard';

export default function HomePage() {
  const curatedStays = [
    {
      id: 'an-villa-hoi-an',
      name: 'An Villa Boutique Hoi An',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApO_9REqPafB0MNVdOLCSbnJaZhE_C21GmUXWGkGh0zIsKYmZCFaltwMj-RFpu1iU4xoy487ScmYsHeudo8BOReAnlRNcqiFKv3SA6UlspXrhb6RsXpmZ3mhyuuErd4vHM_9mqV4I6qTXfpwwMVRE3KIlXgqi4k7PIlDaMUvXH-qUHsuMo5Z59hyUUmkKR_xrXEo5_elp50GgCq4-VgCbGLYpD2ER61tNvJi1KMq1nldsJIihqO5X4',
      starBadge: 'Khách sạn 4 sao',
      location: 'Phố cổ Hội An, Quảng Nam',
      rating: 4.9,
      reviewCount: 128,
      tags: ['Gần sông Hoài', 'Không gian yên tĩnh'],
      cancellationPolicy: 'Miễn phí hủy phòng',
      paymentPolicy: 'Đã gồm thuế, phí',
      price: '1.250.000 đ',
      pricePeriod: '/ đêm',
      detailsHref: '/hotels/an-nhien-riverside',
    },
    {
      id: 'da-lat-pine-haven',
      name: 'Da Lat Pine Haven Retreat',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3nz7ieuFWYUu0vUcpmVA8bY1nhSRfbdfUSpdq3j4oFZimH2MnrG_ymzeXqvRAIgRqOyn-Cq8qRRco9rF1NIqajNdP_r5V2EejpMdvls043sjonT5fcyi4oxaenj6f4hETejzsBUbUEPpoPQ_7w84LWfGg6aED1YRVrkVXfH0TteHSOjsweW-fPaM3X74oN-8-4oy1zQWUfklPzlUni-PgG89ZgLZ6lefUAngn2pIYRPMnz2VuKgIC',
      starBadge: 'Khách sạn 4 sao',
      location: 'Phường 3, Đà Lạt',
      rating: 4.8,
      reviewCount: 94,
      tags: ['Tầm nhìn đồi thông', 'Bữa sáng tự làm'],
      cancellationPolicy: 'Giữ phòng không cần cọc',
      paymentPolicy: 'Đã gồm thuế, phí',
      price: '980.000 đ',
      pricePeriod: '/ đêm',
      detailsHref: '/hotels/an-nhien-riverside',
    },
    {
      id: 'mekong-heritage',
      name: 'Mekong Heritage Eco Resort',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuByhsK6-AXvkU1uzKcnr7bVQEjGixnPYwbBnpf7XBpHb48CgVpJeiUp2usPNNrFc39DsjzCzN1H8BLbRG6pHoj5SgifZ_HKYKs6-b0PgL4iuqUUsodimcbdK2KE4mTG2C7Sxu2ifb4wq28XmQPF3tD2MdIeN2mSz2U2v0sGEW0FsFJreS_kHAY-c_WAXNVeQZAX2qMfDkCxtTOr6dL2A6z7Pmsgwph_mxQpUYzgnzZWrVzN8UHa5gGk',
      starBadge: 'Khách sạn 3 sao',
      location: 'Cần Thơ',
      rating: 4.9,
      reviewCount: 86,
      tags: ['Trải nghiệm văn hóa', 'Vườn cây sinh thái'],
      cancellationPolicy: 'Miễn phí hủy',
      paymentPolicy: 'Đã gồm thuế, phí',
      price: '850.000 đ',
      pricePeriod: '/ đêm',
      detailsHref: '/hotels/an-nhien-riverside',
    },
    {
      id: 'coastal-coral-suites',
      name: 'Coastal Coral Suites Phú Quốc',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxuV-_sCk6qHy_-_J2rZ80j3Gg69eMkFzilGt3TclU_0EvBcVRCLbT0RcQd1BWAEYX4iuaN4d0_0ZLOgMb5j3sIcmp2WuqjoKJexyRckGbmLyqephAcEnhZFMCfV7tyFgH5_m41EehgVcuSEMloGxazBbrkL7E10A0VzaOytzNWpZohUKrJ6S5_uRnZN2ggWuJ1xDi6kLSgQtYEikMqMBSOaTKHeRu_fqlDjq87TIsvnj_5AfUrn_0',
      starBadge: '5 sao boutique',
      location: 'Bãi Ông Lang, Phú Quốc',
      rating: 4.9,
      reviewCount: 150,
      tags: ['Cách biển 50m', 'Hoàng hôn tuyệt đẹp'],
      cancellationPolicy: 'Bữa sáng miễn phí',
      paymentPolicy: 'Đã gồm thuế, phí',
      price: '2.150.000 đ',
      pricePeriod: '/ đêm',
      detailsHref: '/hotels/an-nhien-riverside',
    },
  ];

  const destinations = [
    {
      name: 'Hội An',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAsiNPMoR80a471Yprz9VZm8dWikwo5riP15btQ6MV0P-HYp9ZIqLT5SuGAzJPDQ_c-DBH1zJ9mRckeYXHHsXpQfrd8EyhqzD2-J1kc9xqODOMJs9XHhwnqZk7phj0SObVWzHXhV81SHb5IqHiqjxbEdsqA3GRKzT5of_JsHY0n19frLX5HIo7GIJvjTBsKha1EEgXNMT2HTIXVJ8aiB75ppqFkrUNHCgqCuDxbHqSe3pznv7LEWJTK',
      countText: '240+ chỗ nghỉ boutique',
      href: '/search?destination=HoiAn',
    },
    {
      name: 'Đà Lạt',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQJJI3prPOAY-_on21KHQ8vwpEZEq529kN0Q4BMs9C3_Y8nqlgs2REq8l8_Dszj-oK8RxqWDtmUd7oF5C2zWkayEpQm3Wm71mekprEsxJAnTWQicloD1nyzuFQ1rWXVc1PA60tYY8JpiDrHEUFjmBvd5dXJz9LhFPBpJVyEs6IStqidRaOwjetbRRMz6DfSFfybAASCWBAcKodqOJjvlIZB5DFDes1d6MVW-FYU2B113Hmx71eH_U6',
      countText: '310+ chỗ nghỉ boutique',
      href: '/search?destination=DaLat',
    },
    {
      name: 'Phú Quốc',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4XhdLh0CuG_TSo4zX2jjwnskgidplTzgcvX4_z38uO04Ev9LyHQUOklP_--sH_pjyjnODhlBAGQtvgW8Ro8jQQHqFz3_FJUjigdM0_0WD6YzLixfwS0zZAB7uJwT72mYpbgPbB7x1Y-LLblOktBu-5SAg3TCIPKdMi3zleWmgZ3da_q4s1LZhVEg7-8A_0zLFn44y-XBRY_tTKX-L-hDwEwHcX1DND-U-6hc6ojzeD01xKYoXhtmZ',
      countText: '180+ chỗ nghỉ boutique',
      href: '/search?destination=PhuQuoc',
    },
    {
      name: 'Ninh Bình',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBq_dh6uInEnJdBqblYzP09L3o0LSR_Ys-nNYyOL5TvkKC-xzzMjumnkifQuOmxTipnmtabnuSi8axc-7tytfAgej_ZhDUx0OrzwmX90VLcaoQV9WQj2ET9mpNWApHGNbSLU_t4XNzvKJSOYl1_J-rmS5BgSo3TGzJJFcsULm7eUHiuHH6WDSeJpC1Ux7ynZqpWSXGM4KrQ2b9rTE0KhyTlit7ZEAn31j_QdpPobwbhyGyKnHTfJFsk',
      countText: '95+ chỗ nghỉ boutique',
      href: '/search?destination=NinhBinh',
    },
  ];

  const blogArticles = [
    {
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC2dKNhaI2RdzWIDw82Eknynx_Ue4_cKR_WnWwst9iCYdWEm56ae23eGpLZ6oJrGTUTma_9DCGTf-DSnIXe_FWjMR_K__dBNnCus2wTbKIUTgWO16TX8VsHxW9NzdkCG22FHyFoGJazUqq7HINCVmIk2dt7DP1EfyZLzTYeOLhpgG7qhNW-7hwE81kKskpOM71aPHhrb3Mb4olgekWo_7SQ0qTwPtMtVV1gDKCCaKsGnHP9wGz9xgcx',
      category: 'Cẩm nang lưu trú',
      title: 'Cẩm nang chọn khách sạn boutique Hội An mang phong cách Indochine',
      excerpt: 'Cách nhận biết các khách sạn bảo tồn đúng tinh thần kiến trúc phố Hội và trải nghiệm không gian sống động đậm nét di sản.',
      date: '12 Tháng 10, 2025',
      readTime: '5 phút đọc',
      href: '/blog/cam-nang-chon-khach-san-hoi-an',
    },
    {
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAtctY_xduF9lcOrv8ZQ5sYMVArtk8gOTwQaMff1JnxMS_HR3GP7b1J61OliW5pEt9MnS5UYnpeKegwUTMUEdFob9DAfzD2Q-XCyz1f8462o_076VKNzHitwo0bmReVYsBaxoZmk39LLzQi7u6Y0pC4WM_OCEMLg8qn0G5GFGFo68AWhb2NghEyw1XgJMmbxpXNvJEZtTVmHDEn2gikJ74wlYvnksT5g84aXG-fqN0248eqe7tMSsWT',
      category: 'Mùa du lịch',
      title: 'Mùa hồng chín Đà Lạt: Những chốn nghỉ ngắm đồi thông tĩnh lặng',
      excerpt: 'Tìm về những căn nhà gỗ nép mình bên thung lũng, nơi bạn có thể thức dậy cùng làn sương sớm và tách trà ấm nồng.',
      date: '08 Tháng 10, 2025',
      readTime: '4 phút đọc',
      href: '/blog/mua-hong-chin-da-lat',
    },
    {
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZqGXypWUPjU_JJfsAj1ajYd95RaOQLpxjLOzWrIEcgep9FEYmUTStyKUdL7zKysIsUwszYJ6RHt5nDL2LA_GFP3rvKZ0z-SksZcy7olj71ZsN5TXp2pSwfQKEBmmCF35xaya1SULTJFr12W1Mw9KPczYP-_08S5L1AyiaU4sXi70VY30WT3ulB-ArXLwnfuejolX9D8jiDvSzowi2Pa4yAyz0sBjTvXzvkl3Un1I7Z3sE_JsyymQz',
      category: 'Ẩm thực & Bản sắc',
      title: 'Trải nghiệm ẩm thực Phú Quốc qua góc nhìn của các đầu bếp boutique',
      excerpt: 'Khám phá câu chuyện đằng sau hạt tiêu thơm, nước mắm truyền thống và phong vị biển đảo tinh tế trong từng bữa ăn.',
      date: '01 Tháng 10, 2025',
      readTime: '6 phút đọc',
      href: '/blog/am-thuc-phu-quoc',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa] text-[#1b2a32]">
      {/* Common Header */}
      <Header />

      <main className="flex-grow">
        {/* HERO SECTION */}
        <section className="pt-8 pb-12 md:pt-12 md:pb-16 bg-gradient-to-b from-[#f7f9fb] to-[#ffffff]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Search & Intro */}
              <div className="lg:col-span-7 pt-2">
                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#edf4f9] text-[#1b4360] text-xs font-semibold tracking-wide mb-5">
                  <svg className="w-3.5 h-3.5 text-[#1b4360]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                  <span>Boutique &amp; Khách sạn địa phương được xác thực</span>
                </div>

                {/* Main Heading */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#142d42] leading-[1.2] mb-4">
                  Tìm chốn nghỉ hợp gu,<br className="hidden sm:inline" /> cho chuyến đi của bạn
                </h1>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed max-w-xl mb-7">
                  Nền tảng kết nối du khách với những không gian lưu trú giàu bản sắc, ấm cúng và minh bạch chi phí tại khắp các miền Việt Nam.
                </p>

                {/* Search Panel Component */}
                <HeroSearch />

                {/* AI Assistant Notification Banner */}
                <div className="bg-[#f2f6f9] border border-[#d9e5ee] rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-3">
                  <div className="flex items-start gap-2.5">
                    <span className="p-1.5 rounded-lg bg-[#dde9f2] text-[#1b4360] mt-0.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-[#1b4360]">Chưa rõ điểm đến phù hợp chuyến đi?</h4>
                      <p className="text-[11px] text-gray-600">Khách ẩn danh: gợi ý dựa trên nhu cầu phiên hiện tại, không thu thập lịch sử riêng tư.</p>
                    </div>
                  </div>
                  <Link
                    href="/search"
                    className="whitespace-nowrap px-3.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-xs font-semibold text-[#1b4360] flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 text-[#1b4360]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                    <span>Nhờ AI gợi ý</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: Hero Featured Card */}
              <div className="lg:col-span-5 relative mt-4 lg:mt-0">
                <Link href="/hotels/an-nhien-riverside" className="block relative rounded-3xl overflow-hidden shadow-xl aspect-[4/3] sm:aspect-[16/11] lg:aspect-[4/3.3] bg-gray-100 group">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtAs2PgPDblUiAa9O7vQY69akbTWWLQ5uYgmG3J2H8SK7BT7xAI9mvWhiyFBr1H9V9UnMoWsHcxc334jkkjkf3aCeGzUSyI9PXuciYhMZgoRzc0wyw0vaGZywAex9S1N2hoK8KTmD1MUMqugUymlup7kAzQ1gyBkJUMrkayNVkzYBZKtYlohP2MGoe5gRtbVgiHNFH0hOmneaw3uHMH7ALejOuMIUod_2v4lZ1ZLaR9HhF1QNlfJfl"
                    alt="Hội An Riverside Oasis"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold tracking-wider text-amber-700 uppercase block mb-0.5">Gợi ý tuần này</span>
                      <h3 className="text-base font-bold text-gray-900">Hội An Riverside Oasis</h3>
                      <p className="text-xs text-gray-500">Chỉ cách Chùa Cầu 400m</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 block">Từ</span>
                      <span className="text-base font-bold text-[#1b4360]">1.420.000 đ</span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CURATED STAYS SECTION */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
              <div>
                <span className="text-xs font-bold text-[#d96a43] uppercase tracking-wider block mb-1">Lựa chọn nổi bật</span>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#16364f]">Khám phá cho chuyến đi của bạn</h2>
                <p className="text-sm text-gray-500 mt-1">Những điểm dừng chân được khách hàng đánh giá cao về độ ấm cúng và chuẩn mực phục vụ.</p>
              </div>
              <Link
                href="/search"
                className="mt-3 sm:mt-0 inline-flex items-center text-sm font-semibold text-[#1b4360] hover:text-[#122e42] transition-colors"
              >
                <span>Xem tất cả chỗ nghỉ</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </Link>
            </div>

            {/* 4-Column Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {curatedStays.map((stay) => (
                <HotelCard key={stay.id} {...stay} layout="grid" />
              ))}
            </div>
          </div>
        </section>

        {/* POPULAR DESTINATIONS SECTION */}
        <section className="py-12 bg-[#fcfbfa]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <span className="text-xs font-bold text-[#d96a43] uppercase tracking-wider block mb-1">Địa danh tiêu biểu</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#16364f]">Khám phá theo điểm đến</h2>
              <p className="text-sm text-gray-500 mt-1">Những vùng đất có mạng lưới chỗ nghỉ boutique và dịch vụ giàu bản sắc văn hóa.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {destinations.map((dest, idx) => (
                <DestinationCard key={idx} {...dest} />
              ))}
            </div>
          </div>
        </section>

        {/* TRUST COMMITMENTS SECTION */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="border border-gray-200 rounded-3xl p-6 sm:p-10 bg-white">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="text-xs font-bold text-[#d96a43] uppercase tracking-wider block mb-1">Cam kết dịch vụ</span>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#16364f]">Trải nghiệm đặt phòng chân thực, an tâm tuyệt đối</h2>
                <p className="text-sm text-gray-500 mt-2">Chúng tôi loại bỏ các chiêu trò áp lực, đồng hồ đếm ngược ảo và phí ẩn để bạn thảnh thơi lên kế hoạch.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-[#f8fafc] border border-gray-100 flex flex-col items-start">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#1b4360] mb-4 shadow-xs">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">100% Xác minh thực địa</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">Mỗi khách sạn đối tác đều được đội ngũ StayReco khảo sát tiêu chuẩn dịch vụ, vệ sinh và chất lượng ảnh chụp thực tế trước khi lên sàn.</p>
                </div>

                <div className="p-6 rounded-2xl bg-[#f8fafc] border border-gray-100 flex flex-col items-start">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#1b4360] mb-4 shadow-xs">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">Giá minh bạch, không phí ẩn</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">Báo giá rõ ràng từng đêm và tổng thanh toán; toàn bộ thuế VAT và phí phục vụ được công khai ngay từ bước tìm kiếm ban đầu.</p>
                </div>

                <div className="p-6 rounded-2xl bg-[#f8fafc] border border-gray-100 flex flex-col items-start">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#1b4360] mb-4 shadow-xs">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">Trợ lý gợi ý đúng gu</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">Khám phá nơi lưu trú theo sở thích thực tế của bạn bằng ngôn ngữ tự nhiên mà không cần chia sẻ dữ liệu riêng tư hoặc theo dõi quảng cáo.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BLOG & ARTICLES SECTION */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
              <div>
                <span className="text-xs font-bold text-[#d96a43] uppercase tracking-wider block mb-1">Cẩm nang &amp; Cảm hứng</span>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#16364f]">Bài viết chia sẻ gần đây</h2>
                <p className="text-sm text-gray-500 mt-1">Gợi ý trải nghiệm, kiến trúc bản địa và câu chuyện của những người làm du lịch tử tế.</p>
              </div>
              <Link
                href="/blog"
                className="mt-3 sm:mt-0 inline-flex items-center text-sm font-semibold text-[#1b4360] hover:text-[#122e42] transition-colors"
              >
                <span>Xem chuyên mục Blog</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {blogArticles.map((article, idx) => (
                <ArticleCard key={idx} {...article} />
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Common Footer */}
      <Footer />
    </div>
  );
}
