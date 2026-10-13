'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppBreadcrumb from '@/components/common/breadcrumb/AppBreadcrumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  MapPin,
  Star,
  ArrowRight,
  SlidersHorizontal,
  CheckCircle2,
  Heart
} from 'lucide-react';

export default function RecommendationsPage() {
  const [selectedCity, setSelectedCity] = useState('all');

  const hotels = [
    {
      id: '1',
      name: 'An Nhiên Riverside Hotel Đà Nẵng',
      city: 'danang',
      cityName: 'Đà Nẵng',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
      matchScore: '98%',
      matchReason: 'Phòng view sông Hàn, buffet sáng hữu cơ, kính cách âm tốt',
      price: '1.250.000 ₫',
      rating: 4.9,
      reviews: 128,
      tags: ['Boutique 4 sao', 'Kế bên sông Hàn', 'Miễn phí hủy'],
    },
    {
      id: '2',
      name: 'Ana Mandara Villas Đà Lạt Resort & Spa',
      city: 'dalat',
      cityName: 'Đà Lạt',
      image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80',
      matchScore: '96%',
      matchReason: 'Biệt thự cổ Pháp giữa rừng thông yên tĩnh',
      price: '2.600.000 ₫',
      rating: 4.8,
      reviews: 94,
      tags: ['Vintage Villa', 'Rừng thông', 'Sưởi ấm'],
    },
    {
      id: '3',
      name: 'Hội An Memories Resort & Spa',
      city: 'hoian',
      cityName: 'Hội An',
      image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80',
      matchScore: '94%',
      matchReason: 'Không gian văn hóa di sản, hồ bơi vô cực view sông Thu Bồn',
      price: '1.950.000 ₫',
      rating: 4.9,
      reviews: 210,
      tags: ['Resort di sản', 'Hồ bơi vô cực', 'Ăn sáng bao gồm'],
    },
  ];

  const filteredHotels = hotels.filter(
    (h) => selectedCity === 'all' || h.city === selectedCity
  );

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased text-foreground">
      <Header />

      <main className="flex-1 w-full bg-[#f7f9ff] py-6 lg:py-10">
        <div className="mx-auto max-w-[100rem] px-4 sm:px-6 lg:px-8 space-y-8">
          
          <AppBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Gợi ý dành cho bạn', active: true },
            ]}
          />

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-[#934a33] text-xs font-semibold">
                <Sparkles className="size-3.5" /> Thuật toán AI StayReco Recommendation
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Gợi ý chốn nghỉ hợp gu dành riêng cho bạn
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
                Được cá nhân hóa dựa trên lịch sử đặt phòng, sở thích tiện nghi & phong cách nghỉ dưỡng của bạn.
              </p>
            </div>

            <Link href="/account/preferences">
              <Button variant="outline" className="h-10 text-xs font-semibold gap-2 border-border shrink-0">
                <SlidersHorizontal className="size-4 text-primary" /> Tùy chỉnh gu du lịch AI
              </Button>
            </Link>
          </div>

          {/* City Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all', label: 'Tất cả điểm đến' },
              { id: 'danang', label: 'Đà Nẵng' },
              { id: 'dalat', label: 'Đà Lạt' },
              { id: 'hoian', label: 'Hội An' },
            ].map((city) => (
              <button
                key={city.id}
                type="button"
                onClick={() => setSelectedCity(city.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCity === city.id
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-white text-muted-foreground border border-border hover:bg-slate-50'
                }`}
              >
                {city.label}
              </button>
            ))}
          </div>

          {/* Hotel Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredHotels.map((hotel) => (
              <Card key={hotel.id} className="bg-white border border-border rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-shadow group flex flex-col justify-between">
                <div>
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                    <Image
                      src={hotel.image}
                      alt={hotel.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    
                    <Badge className="absolute top-3 left-3 bg-[#934a33] text-white font-bold text-xs gap-1 shadow-xs border-0">
                      <Sparkles className="size-3" /> {hotel.matchScore} Hợp gu
                    </Badge>

                    <button
                      type="button"
                      className="absolute top-3 right-3 size-8 rounded-full bg-white/90 hover:bg-white text-slate-700 flex items-center justify-center shadow-xs transition-colors"
                    >
                      <Heart className="size-4" />
                    </button>

                    <div className="absolute bottom-3 left-3 right-3">
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 font-bold bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="size-3 text-emerald-400" /> AI Verified Match
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1 mb-1">
                        <MapPin className="size-3.5 text-primary" /> {hotel.cityName}
                      </span>
                      <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {hotel.name}
                      </h3>
                    </div>

                    <div className="p-3 bg-orange-50/90 rounded-xl border border-orange-200/80 text-xs text-amber-950 font-medium leading-relaxed">
                      💡 <strong className="text-[#934a33] font-bold">Lý do AI đề xuất:</strong> {hotel.matchReason}
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {hotel.tags.map((t, idx) => (
                        <span key={idx} className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200/60">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-border mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Giá từ / đêm</span>
                    <span className="text-xl font-bold text-primary">{hotel.price}</span>
                  </div>

                  <Link href={`/hotels/${hotel.id}`}>
                    <Button className="h-10 px-4 bg-primary text-primary-foreground hover:bg-[#193b56] font-semibold text-xs gap-1.5 shadow-xs">
                      <span>Đặt ngay</span> <ArrowRight className="size-3.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
