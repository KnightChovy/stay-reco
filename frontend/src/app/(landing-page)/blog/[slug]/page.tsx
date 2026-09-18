'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppBreadcrumb from '@/common/breadcrumb/AppBreadcrumb';
import ArticleCard, { type ArticleCardProps } from '@/common/card/ArticleCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

export default function BlogDetailPage() {
  const [isLiked, setIsLiked] = useState(false);

  const relatedArticles: ArticleCardProps[] = [
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
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC2dKNhaI2RdzWIDw82Eknynx_Ue4_cKR_WnWwst9iCYdWEm56ae23eGpLZ6oJrGTUTma_9DCGTf-DSnIXe_FWjMR_K__dBNnCus2wTbKIUTgWO16TX8VsHxW9NzdkCG22FHyFoGJazUqq7HINCVmIk2dt7DP1EfyZLzTYeOLhpgG7qhNW-7hwE81kKskpOM71aPHhrb3Mb4olgekWo_7SQ0qTwPtMtVV1gDKCCaKsGnHP9wGz9xgcx',
      category: 'Cẩm nang lưu trú',
      title: 'Cẩm nang chọn khách sạn boutique Hội An mang phong cách Indochine',
      excerpt: 'Cách nhận biết các khách sạn bảo tồn đúng tinh thần kiến trúc phố Hội và trải nghiệm không gian sống động đậm nét di sản.',
      date: '08 Tháng 10, 2025',
      readTime: '4 phút đọc',
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
  ];

  return (
    <div className="min-h-screen flex flex-col antialiased text-slate-800 bg-[#f7f6f2]">
      {/* Common Header */}
      <Header />

      {/* Main Content */}
      <main className="grow w-full max-w-240 mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Breadcrumb */}
        <AppBreadcrumb
          items={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Blog du lịch', href: '/blog' },
            { label: 'Hành trình 48 giờ giữa phố cổ Hội An và biển Mỹ Khê' },
          ]}
          className="mb-4"
        />

        {/* Article Header */}
        <header className="mb-8">
          <Badge className="bg-[#18385c] text-white hover:bg-[#122b47] text-xs px-3 py-1 mb-4 rounded-full font-medium">
            Điểm đến nổi bật • Đà Nẵng – Hội An
          </Badge>

          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#1a2d42] leading-tight mb-4">
            Hành trình 48 giờ giữa phố cổ Hội An và nhịp thở biển Mỹ Khê: Chọn chỗ nghỉ nào để trọn vẹn yên bình?
          </h1>

          <p className="text-stone-600 text-base sm:text-lg leading-relaxed mb-6">
            Không chỉ là chuyến đi nghỉ dưỡng đơn thuần, hành trình dẫn bạn qua những ngõ nhỏ đầy hoa giấy, thưởng thức tách cà phê mộc bên sông Hoài và dừng chân tại những chốn dừng bình yên ven sông Hàn.
          </p>

          {/* Author & Share Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-stone-200">
            <div className="flex items-center space-x-3">
              <Avatar className="size-11">
                <AvatarImage src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTMVfrBuTkxrOD13FSMCqwwPOmdnG1cgncEhi-mqqtEaWHgBbPsrN3dI4K_Gtdd2BPvvo1V42mcyHEM6UwrEIm8QeJ1FPqJ4NwQtdvVs4F3KAtKF5q1lK9oJd1qo7jwZgZHwU5SkdVCrW0Okn2oFGjD1qsjeif9kGgZCuQ1tIMTwMBe0Gpr9nkkyelThoMLVgFG9DYs-5976DqWE2y6UbvxaKpbRpY1Z4kD5FxA1tatVfyOVvJrvHB" />
                <AvatarFallback className="bg-[#18385c] text-white font-bold">BN</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-slate-900 text-sm">Bảo Ngọc</p>
                <p className="text-xs text-stone-500">Biên tập viên Du lịch StayReco • 14/10/2026 • 6 phút đọc</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={isLiked ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsLiked(!isLiked)}
                className={`text-xs gap-1.5 rounded-lg ${isLiked ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''}`}
              >
                ❤️ {isLiked ? 'Đã yêu thích' : 'Lưu bài viết'}
              </Button>
              <Button variant="outline" size="sm" className="text-xs gap-1.5 rounded-lg">
                🔗 Chia sẻ
              </Button>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        <div className="rounded-2xl overflow-hidden mb-8 shadow-sm">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTMVfrBuTkxrOD13FSMCqwwPOmdnG1cgncEhi-mqqtEaWHgBbPsrN3dI4K_Gtdd2BPvvo1V42mcyHEM6UwrEIm8QeJ1FPqJ4NwQtdvVs4F3KAtKF5q1lK9oJd1qo7jwZgZHwU5SkdVCrW0Okn2oFGjD1qsjeif9kGgZCuQ1tIMTwMBe0Gpr9nkkyelThoMLVgFG9DYs-5976DqWE2y6UbvxaKpbRpY1Z4kD5FxA1tatVfyOVvJrvHB"
            alt="Hoàng hôn bên sông Hoài Hội An"
            className="w-full h-100 sm:h-120 object-cover"
          />
          <p className="text-xs text-stone-500 text-center italic py-2 bg-stone-100">
            Nét dịu dàng buổi hoàng hôn bên dòng sông Hoài – Hội An, Quảng Nam.
          </p>
        </div>

        {/* Article Content */}
        <article className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm sm:text-base space-y-6">
          <p className="font-medium text-slate-900 text-base sm:text-lg leading-relaxed">
            Nếu bạn đang tìm kiếm một chuyến đi nạp lại năng lượng sau những ngày bận rộn, hành trình kết hợp giữa nét hoài cổ của Hội An và biển xanh thanh bình Đà Nẵng là lựa chọn lý tưởng. Chỉ với 48 giờ, bạn hoàn toàn có thể cảm nhận trọn vẹn nhịp sống thư thái của dải đất miền Trung này.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 pt-4 border-b border-stone-200 pb-2">
            Ngày 1: Thức dậy ở Hội An – Thảnh thơi cà phê mộc bên sông Hoài
          </h2>

          <p>
            Bắt đầu buổi sáng lúc 6:30, khi ánh nắng đầu ngày khẽ rọi qua từng mái ngói âm dương trầm mặc. Phố cổ lúc này chưa nhộn nhịp du khách, trả lại vẻ yên bình thanh thản vốn có. Hãy ghé một quán cà phê mộc ven sông Hoài, gọi tách cà phê phin đậm đà và thong thả ngắm nhìn nhịp sống chậm rãi của người dân địa phương.
          </p>

          {/* Highlight Quote Box */}
          <div className="my-6 border-l-4 border-[#18385c] bg-white p-5 rounded-r-xl shadow-2xs italic text-slate-800">
            &quot;Bản chất của du lịch nghỉ dưỡng không phải là đi được bao nhiêu điểm, mà là bạn giữ được bao nhiêu khoảnh khắc bình yên trong tâm trí.&quot;
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 pt-4 border-b border-stone-200 pb-2">
            Ngày 2: Trở về Đà Nẵng – Ngắm hoàng hôn ven sông Hàn &amp; Biển Mỹ Khê
          </h2>

          <p>
            Chiều ngày thứ hai, di chuyển dọc cung đường biển rợp bóng dừa về trung tâm Đà Nẵng. Chọn một chốn dừng chân ven sông Hàn như <strong>An Nhiên Riverside Hotel</strong>, bạn có thể vừa ngắm trọn vẹn nhịp chảy hiền hòa của dòng sông, vừa dễ dàng đi bộ ra Cầu Rồng đón gió mát khi phố đêm lên đèn.
          </p>

          {/* Recommended Hotel Card Component inside blog */}
          <Card className="my-8 border-2 border-[#18385c]/20 bg-white p-5 rounded-2xl shadow-xs">
            <CardContent className="p-0 flex flex-col sm:flex-row gap-5 items-center">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAcemNhDpfdDg56P-LQAbCv7XiIMdq0Fko0-ADCh1akmwhZVOUpHFIs2NjmkBX1VCe3w5K5ew9creKalcIXiT7f597mnHvIsfXJ3SIpu2sup3Pfp6pZDl0hWqRdeMpy33vDEYkVcPvUTJ-kXl4UMFVJppN061siBaQVaFaP4zEx7mYC-2Y2PJtgq8uVlyEZteoILkNe4NYAdOn6iiS23w8MRzSMowid0nlunu9h4bATXZSrrAJF-PcM"
                alt="An Nhiên Riverside Hotel"
                className="w-full sm:w-48 h-36 object-cover rounded-xl shrink-0"
              />
              <div className="flex-1 text-xs sm:text-sm space-y-2">
                <Badge className="bg-[#18385c] text-white">Gợi ý chốn nghỉ đúng gu StayReco</Badge>
                <h3 className="font-bold text-slate-900 text-base">An Nhiên Riverside Hotel Đà Nẵng</h3>
                <p className="text-slate-600 line-clamp-2">
                  Khách sạn boutique 4 sao ven sông Hàn, cách Cầu Rồng 350m, phòng Deluxe ban công view sông lãng mạn kèm bữa sáng mì Quảng chuẩn vị.
                </p>
                <div className="flex items-center justify-between pt-2">
                  <span className="font-bold text-[#18385c] text-base">Từ 1.250.000 ₫ / đêm</span>
                  <Link href="/hotels/an-nhien-riverside">
                    <Button size="sm" className="bg-[#18385c] hover:bg-[#122b47] text-white text-xs">
                      Xem phòng trống ➔
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 pt-4 border-b border-stone-200 pb-2">
            Lời kết cho chuyến đi
          </h2>

          <p>
            48 giờ ngắn ngủi nhưng đủ để bạn nạp đầy năng lượng tươi mới. Đừng quên chuẩn bị hành trang nhẹ nhàng, tinh thần cởi mở và chọn cho mình một điểm dừng chân chuẩn gu nghỉ dưỡng tại StayReco.
          </p>
        </article>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-stone-200">
          <span className="text-xs font-semibold text-stone-500">Thẻ bài viết:</span>
          {['Hội An', 'Đà Nẵng', 'Boutique Hotel', 'Cẩm nang lưu trú', 'Cầu Rồng'].map((tag, idx) => (
            <Badge key={idx} variant="outline" className="bg-white text-stone-600 border-stone-300 text-xs px-2.5 py-1">
              #{tag}
            </Badge>
          ))}
        </div>

        {/* Author Bio Box */}
        <Card className="mt-8 bg-white p-6 rounded-2xl border border-stone-200">
          <CardContent className="p-0 flex items-start space-x-4">
            <Avatar className="size-14 shrink-0">
              <AvatarImage src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTMVfrBuTkxrOD13FSMCqwwPOmdnG1cgncEhi-mqqtEaWHgBbPsrN3dI4K_Gtdd2BPvvo1V42mcyHEM6UwrEIm8QeJ1FPqJ4NwQtdvVs4F3KAtKF5q1lK9oJd1qo7jwZgZHwU5SkdVCrW0Okn2oFGjD1qsjeif9kGgZCuQ1tIMTwMBe0Gpr9nkkyelThoMLVgFG9DYs-5976DqWE2y6UbvxaKpbRpY1Z4kD5FxA1tatVfyOVvJrvHB" />
              <AvatarFallback>BN</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-slate-900 text-base">Bảo Ngọc</p>
              <p className="text-xs text-[#18385c] font-semibold mb-1">Biên tập viên Du lịch StayReco</p>
              <p className="text-xs text-stone-600 leading-relaxed">
                Đam mê khám phá nét đẹp văn hóa bản địa, kiến trúc di sản và mang đến cho du khách những trải nghiệm nghỉ dưỡng chân thực nhất trên khắp Việt Nam.
              </p>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-12" />

        {/* Related Articles Section */}
        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">Bài viết cùng chủ đề</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((article, idx) => (
              <ArticleCard key={idx} {...article} variant="grid" />
            ))}
          </div>
        </section>
      </main>

      {/* Common Footer */}
      <Footer />
    </div>
  );
}
