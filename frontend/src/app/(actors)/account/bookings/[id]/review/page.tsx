'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppBreadcrumb from '@/components/common/breadcrumb/AppBreadcrumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Star,
  Upload,
  CheckCircle2,
  MapPin,
  Calendar,
  Building2,
  Trash2,
  Edit2,
  ThumbsUp,
  Wrench,
  Award,
  ShieldCheck,
  ArrowLeft,
  Send,
  Info,
  Check,
  Plus
} from 'lucide-react';

export default function ReviewBookingPage() {
  const [overallRating, setOverallRating] = useState(5);
  const [subRatings, setSubRatings] = useState({
    cleanliness: 5,
    location: 5,
    service: 4.8,
    quietness: 4.5,
    value: 5,
  });

  const [title, setTitle] = useState('Kỳ nghỉ tuyệt vời ngắm trọn Cầu Rồng, phòng ốc chỉn chu và bữa sáng xuất sắc');
  const [body, setBody] = useState('Gia đình mình có 2 đêm nghỉ ngơi thực sự thư giãn tại phòng 608 nhìn thẳng ra dòng sông Hàn thơ mộng. Khách sạn sở hữu phong cách boutique tối giản rất có gu, các vật dụng thủ công làm từ gốm và gỗ tự nhiên tạo cảm giác ấm cúng. Đặc biệt ấn tượng với buffet sáng món Việt hữu cơ tươi ngon, nước ép ép lạnh nguyên chất.');
  
  const [positiveTags, setPositiveTags] = useState(['View sông Hàn thoáng đãng', 'Bữa sáng buffet hữu cơ', 'Kính cách âm cực tốt', 'Lễ tân thân thiện chu đáo']);
  const [improvementTags, setImprovementTags] = useState(['Cần thêm móc treo đồ trong phòng tắm', 'Tăng áp lực nước vòi sen giờ cao điểm']);
  const [confirmedAuthentic, setConfirmedAuthentic] = useState(true);

  const starDescriptors: Record<number, string> = {
    1: '1 sao: Kém - Trải nghiệm không như mong đợi',
    2: '2 sao: Trung bình - Cần cải thiện nhiều điểm',
    3: '3 sao: Khá - Tạm ổn nhưng chưa nổi bật',
    4: '4 sao: Tốt - Hài lòng với dịch vụ',
    5: '5 sao: Tuyệt hảo - Vượt trên kỳ vọng',
  };

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;

  const togglePositiveTag = (tag: string) => {
    setPositiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleImprovementTag = (tag: string) => {
    setImprovementTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Cảm ơn bạn đã đóng góp đánh giá! Bạn đã nhận +100 điểm thưởng StayReco Elite.');
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased text-foreground">
      <Header />

      <main className="flex-1 w-full bg-[#f7f9ff] py-6 lg:py-10">
        <div className="mx-auto max-w-[100rem] px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb */}
          <AppBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Tài khoản', href: '/account/profile' },
              { label: 'Chuyến đi của tôi', href: '/account/bookings' },
              { label: 'Chi tiết #SR-261020-0842', href: '/account/bookings/SR-261020-0842' },
              { label: 'Viết đánh giá', active: true },
            ]}
          />

          {/* Page Header */}
          <div className="mt-6 mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
              <Award className="size-3.5" /> Mã đặt phòng: #SR-261020-0842
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Đánh giá kỳ nghỉ & Đóng góp hình ảnh thực tế
            </h1>
            <p className="text-muted-foreground text-sm mt-1.5 max-w-3xl">
              Chia sẻ trải nghiệm chân thực của bạn tại An Nhiên Riverside Hotel để giúp cộng đồng du khách StayReco có thêm góc nhìn khách quan.
            </p>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column (8 cols) */}
            <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-6">
              
              {/* 1. Hotel Snippet Card */}
              <Card className="p-5 bg-white border border-border shadow-xs rounded-xl flex flex-col md:flex-row gap-5 items-start">
                <div className="relative w-full md:w-44 h-32 rounded-lg overflow-hidden shrink-0">
                  <Image
                    src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"
                    alt="An Nhiên Riverside Hotel"
                    fill
                    className="object-cover"
                  />
                  <Badge className="absolute top-2 left-2 bg-white/95 text-foreground hover:bg-white text-[10px]">
                    ★ 4 sao
                  </Badge>
                </div>

                <div className="flex-1 space-y-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                    <CheckCircle2 className="size-3.5" /> Lưu trú đã hoàn tất & Được xác thực bởi StayReco
                  </span>
                  <h2 className="text-lg font-bold text-foreground">An Nhiên Riverside Hotel Đà Nẵng</h2>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="size-3.5 text-primary" /> 128 Bạch Đằng, Quận Hải Châu, TP. Đà Nẵng
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border text-xs text-muted-foreground">
                    <div>
                      <span>Kỳ lưu trú: <strong className="text-foreground">20/10 – 22/10/2026 (2 đêm)</strong></span>
                    </div>
                    <div>
                      <span>Phòng: <strong className="text-foreground">Deluxe River View (P.608)</strong></span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 2. Detailed Rating Section */}
              <Card className="p-5 sm:p-6 bg-white border border-border shadow-xs rounded-xl space-y-6">
                <div className="pb-4 border-b border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider">
                      Điểm đánh giá tổng thể *
                    </label>
                    <span className="text-xs text-primary font-semibold">
                      {starDescriptors[overallRating]}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setOverallRating(star)}
                        className="p-1 text-amber-400 hover:scale-110 transition-transform focus:outline-none"
                      >
                        <Star
                          className={`size-8 sm:size-9 ${
                            star <= overallRating ? 'fill-amber-400' : 'text-slate-200'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-3xl font-bold text-foreground ml-3">{overallRating}.0</span>
                  </div>
                </div>

                {/* Sub Ratings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground">Chi tiết tiêu chí phục vụ & chất lượng</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {[
                      { key: 'cleanliness', label: 'Vệ sinh & Tiện nghi phòng', val: subRatings.cleanliness },
                      { key: 'location', label: 'Vị trí & Tầm nhìn bờ sông Hàn', val: subRatings.location },
                      { key: 'service', label: 'Thái độ phục vụ & Lễ tân', val: subRatings.service },
                      { key: 'quietness', label: 'Độ yên tĩnh & Giấc ngủ', val: subRatings.quietness },
                      { key: 'value', label: 'Giá trị tương xứng với chi phí', val: subRatings.value },
                    ].map((item) => (
                      <div key={item.key} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium text-foreground">
                          <span>{item.label}</span>
                          <span className="font-bold">{item.val.toFixed(1)}</span>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <button
                              key={level}
                              type="button"
                              onClick={() =>
                                setSubRatings({ ...subRatings, [item.key]: level })
                              }
                              className={`h-2 flex-1 rounded-full transition-colors ${
                                level <= item.val ? 'bg-primary' : 'bg-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* 3. Review Text Inputs */}
              <Card className="p-5 sm:p-6 bg-white border border-border shadow-xs rounded-xl space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="review-title" className="text-xs sm:text-sm font-semibold">
                    Tiêu đề đánh giá (Tóm tắt trải nghiệm) *
                  </Label>
                  <Input
                    id="review-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-11 text-sm focus-visible:ring-primary font-medium"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="review-body" className="text-xs sm:text-sm font-semibold">
                      Nội dung chi tiết kỳ nghỉ *
                    </Label>
                    <span
                      className={`text-xs font-semibold flex items-center gap-1 ${
                        wordCount >= 30 ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      <CheckCircle2 className="size-3.5" />
                      {wordCount >= 30
                        ? `Đã đạt tiêu chuẩn chi tiết (${wordCount} từ / tối thiểu 30 từ)`
                        : `Cần thêm ${30 - wordCount} từ để đạt mức chi tiết`}
                    </span>
                  </div>
                  <textarea
                    id="review-body"
                    rows={5}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full p-3.5 rounded-lg border border-border bg-slate-50 text-sm focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed resize-none"
                    required
                  />
                  <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                    <span>Đánh giá cụ thể giúp tăng điểm độ tin cậy của tài khoản</span>
                    <span>{body.length} ký tự</span>
                  </div>
                </div>

                {/* Tag Pills */}
                <div className="space-y-4 pt-3 border-t border-border">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <ThumbsUp className="size-4 text-emerald-600" /> Điểm bạn thích nhất ở An Nhiên Riverside:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'View sông Hàn thoáng đãng',
                        'Bữa sáng buffet hữu cơ',
                        'Kính cách âm cực tốt',
                        'Lễ tân thân thiện chu đáo',
                        'Hồ bơi sân thượng',
                        'Trà chiều miễn phí',
                      ].map((tag) => {
                        const active = positiveTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => togglePositiveTag(tag)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 ${
                              active
                                ? 'bg-primary/10 border-primary text-primary'
                                : 'bg-slate-50 border-border text-muted-foreground hover:bg-slate-100'
                            }`}
                          >
                            {active ? <Check className="size-3.5" /> : <Plus className="size-3.5" />} {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Wrench className="size-4 text-secondary" /> Góp ý để khách sạn hoàn thiện hơn (Tùy chọn):
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Cần thêm móc treo đồ trong phòng tắm',
                        'Tăng áp lực nước vòi sen giờ cao điểm',
                        'Đỗ xe ô tô lúc đông khách',
                        'Đa dạng thêm đồ uống minibar',
                      ].map((tag) => {
                        const active = improvementTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleImprovementTag(tag)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 ${
                              active
                                ? 'bg-orange-50 border-secondary text-secondary'
                                : 'bg-slate-50 border-border text-muted-foreground hover:bg-slate-100'
                            }`}
                          >
                            {active ? <Check className="size-3.5" /> : <Plus className="size-3.5" />} {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>

              {/* 4. Photos Section */}
              <Card className="p-5 sm:p-6 bg-white border border-border shadow-xs rounded-xl space-y-5">
                <div>
                  <h3 className="text-base font-bold text-foreground">Hình ảnh thực tế từ chuyến đi của bạn</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Hình ảnh chân thực giúp cộng đồng hình dung rõ nét nhất. Hỗ trợ JPG, PNG (tối đa 10MB/ảnh).
                  </p>
                </div>

                {/* Upload box */}
                <div className="border-2 border-dashed border-border hover:border-primary rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/50 hover:bg-primary/5 transition-colors">
                  <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <Upload className="size-6" />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-foreground">
                    Kéo thả hình ảnh vào đây hoặc <span className="text-primary underline">chọn từ thiết bị</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Tối đa 8 ảnh • Bạn đã tải lên 3/8 hình
                  </p>
                </div>

                {/* Image Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80',
                      caption: 'View ban công ngắm sông Hàn',
                      meta: 'P.608 • Đã kiểm duyệt',
                      size: '4.2 MB',
                    },
                    {
                      img: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=400&q=80',
                      caption: 'Bữa sáng tại nhà hàng Sen Vàng',
                      meta: 'Tầng 2 • 07:30 AM',
                      size: '3.8 MB',
                    },
                    {
                      img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=400&q=80',
                      caption: 'Giường ngủ phòng Deluxe #608',
                      meta: 'Góc nhìn cận cảnh',
                      size: '5.1 MB',
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-lg overflow-hidden border border-border group">
                      <div className="relative h-32 w-full">
                        <Image src={item.img} alt={item.caption} fill className="object-cover" />
                        <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-xs">
                          {item.size}
                        </span>
                        <button
                          type="button"
                          className="absolute top-2 right-2 size-7 rounded-full bg-white/90 text-red-600 hover:bg-white flex items-center justify-center shadow-xs"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                      <div className="p-2.5 space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                          <span className="truncate">{item.caption}</span>
                          <Edit2 className="size-3 text-muted-foreground shrink-0" />
                        </div>
                        <span className="text-[10px] text-muted-foreground block">{item.meta}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="authentic"
                      checked={confirmedAuthentic}
                      onCheckedChange={(checked) => setConfirmedAuthentic(!!checked)}
                      className="mt-0.5"
                    />
                    <label htmlFor="authentic" className="text-xs text-foreground leading-normal cursor-pointer">
                      Tôi xác nhận những hình ảnh và nội dung đánh giá này hoàn toàn xuất phát từ trải nghiệm lưu trú thực tế cá nhân của tôi tại An Nhiên Riverside Hotel và không nhận thù lao quảng cáo trái phép.
                    </label>
                  </div>
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 mb-10">
                <Link href="/account/bookings/SR-261020-0842">
                  <Button variant="ghost" className="text-xs font-semibold gap-2">
                    <ArrowLeft className="size-4" /> Hủy và quay lại chi tiết chuyến đi
                  </Button>
                </Link>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button variant="outline" type="button" className="h-11 px-5 text-xs sm:text-sm font-semibold">
                    Lưu bản nháp
                  </Button>
                  <Button
                    type="submit"
                    className="h-11 px-8 bg-primary text-primary-foreground hover:bg-[#193b56] font-bold text-xs sm:text-sm gap-2 shadow-md"
                  >
                    <span>Gửi đánh giá & Nhận +100 Điểm StayReco Elite</span>
                    <Send className="size-4" />
                  </Button>
                </div>
              </div>

            </form>

            {/* Right Sidebar (4 cols) */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              
              {/* Reward Banner */}
              <Card className="p-5 bg-white border border-secondary/30 rounded-xl shadow-xs space-y-3 relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-orange-100 text-secondary flex items-center justify-center font-bold text-base">
                    <Award className="size-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-secondary">Đặc quyền đóng góp</span>
                    <h3 className="font-bold text-sm text-foreground">Thưởng StayReco Elite</h3>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Mỗi nhận xét kèm hình ảnh chất lượng giúp bạn tiến gần hơn tới cấp thành viên <strong className="text-foreground font-semibold">Bạch Kim</strong>.
                </p>

                <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between border border-border">
                  <span className="text-xs font-semibold text-foreground">Điểm cộng nhận được</span>
                  <span className="text-base font-bold text-secondary">+100 pts</span>
                </div>
              </Card>

              {/* Policy Guidelines */}
              <Card className="p-5 bg-white border border-border shadow-xs rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-sm border-b border-border pb-3">
                  <ShieldCheck className="size-5" /> Tiêu chuẩn đánh giá StayReco
                </div>

                <div className="space-y-3 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong className="text-foreground">100% khách thực:</strong> Chỉ du khách đã hoàn tất kỳ nghỉ mới có quyền xuất bản nhận xét.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong className="text-foreground">Bảo vệ riêng tư:</strong> Không công khai số điện thoại, email hay số căn cước của bạn.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong className="text-foreground">Kiểm duyệt khách quan:</strong> Hệ thống rà soát tự động trong vòng 2 giờ.</span>
                  </div>
                </div>
              </Card>

              {/* Hotel Response Note */}
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Info className="size-4" /> Phản hồi từ khách sạn
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Đội ngũ Ban quản lý <strong className="text-foreground">An Nhiên Riverside Hotel</strong> sẽ trực tiếp đọc và phản hồi tới bạn trong vòng 24 giờ.
                </p>
              </div>

            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
