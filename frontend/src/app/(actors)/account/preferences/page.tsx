'use client';

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppBreadcrumb from '@/components/common/breadcrumb/AppBreadcrumb';
import AccountSubNav from '@/features/account/AccountSubNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Compass,
  Sparkles,
  CheckCircle2,
  Save,
  Coffee,
  Trees,
  Palmtree,
  Utensils,
  Briefcase,
  Users,
  Check
} from 'lucide-react';

export default function PreferencesPage() {
  const [selectedStyles, setSelectedStyles] = useState<string[]>(['resort', 'nature', 'foodie']);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(['pool', 'view', 'breakfast']);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toggleStyle = (id: string) => {
    setSelectedStyles((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleAmenity = (id: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage('Sở thích du lịch AI đã được lưu thành công! Gợi ý phòng sẽ cập nhật tự động.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased text-foreground">
      <Header />

      <main className="flex-1 w-full bg-[#f7f9ff]">
        <AccountSubNav activeTab="preferences" />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <AppBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Tài khoản', href: '/account/profile' },
              { label: 'Sở thích du lịch', active: true },
            ]}
          />

          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Sparkles className="size-3.5" /> Cá nhân hóa AI StayReco
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Sở thích du lịch cá nhân hóa
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Hệ thống AI đề xuất StayReco phân tích gu du lịch của bạn để gợi ý khách sạn & phòng nghỉ hoàn hảo nhất.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Travel Styles */}
            <Card className="p-6 sm:p-8 bg-white border border-border shadow-xs rounded-2xl space-y-6">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Compass className="size-5 text-primary" /> Phong cách du lịch yêu thích
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'resort', title: 'Nghỉ dưỡng & Relax', icon: Palmtree, desc: 'Resort yên tĩnh, view biển/sông' },
                  { id: 'nature', title: 'Thiên nhiên & Eco', icon: Trees, desc: 'Lodge rừng thông, khu sinh thái' },
                  { id: 'foodie', title: 'Ẩm thực & Văn hóa', icon: Utensils, desc: 'Boutique gần phố cổ & quán ngon' },
                  { id: 'business', title: 'Công tác Sang trọng', icon: Briefcase, desc: 'Khách sạn trung tâm, bàn làm việc' },
                  { id: 'family', title: 'Gia đình & Trẻ nhỏ', icon: Users, desc: 'Phòng rộng, hồ bơi & khu vui chơi' },
                  { id: 'chill', title: 'Coffee & Check-in', icon: Coffee, desc: 'Homestay thiết kế gu, góc chụp đẹp' },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = selectedStyles.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleStyle(item.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all space-y-2 relative ${
                        active
                          ? 'border-primary bg-primary/5 shadow-xs'
                          : 'border-border bg-slate-50 hover:bg-white'
                      }`}
                    >
                      {active && (
                        <span className="absolute top-3 right-3 size-5 rounded-full bg-primary text-white flex items-center justify-center text-xs">
                          <Check className="size-3" />
                        </span>
                      )}
                      <Icon className={`size-6 ${active ? 'text-primary' : 'text-slate-500'}`} />
                      <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Amenities */}
            <Card className="p-6 sm:p-8 bg-white border border-border shadow-xs rounded-2xl space-y-6">
              <h2 className="text-lg font-bold text-foreground">Tiện nghi phòng ưu tiên</h2>

              <div className="flex flex-wrap gap-2.5">
                {[
                  { id: 'pool', label: 'Hồ bơi bơi vô cực' },
                  { id: 'view', label: 'View sông / view biển' },
                  { id: 'breakfast', label: 'Bữa sáng buffet bao gồm' },
                  { id: 'spa', label: 'Dịch vụ Spa & Massage' },
                  { id: 'quiet', label: 'Phòng kính cách âm tầng cao' },
                  { id: 'tub', label: 'Bồn tắm ngâm thư giãn' },
                  { id: 'shuttle', label: 'Xe đưa đón sân bay' },
                ].map((item) => {
                  const active = selectedAmenities.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleAmenity(item.id)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                        active
                          ? 'bg-primary text-primary-foreground border-primary shadow-2xs'
                          : 'bg-slate-50 text-muted-foreground border-border hover:bg-slate-100'
                      }`}
                    >
                      {active && <Check className="size-3.5" />} {item.label}
                    </button>
                  );
                })}
              </div>
            </Card>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                className="h-11 px-8 bg-primary text-primary-foreground hover:bg-[#193b56] font-bold text-xs sm:text-sm gap-2 shadow-sm"
              >
                <Save className="size-4" /> <span>Lưu sở thích du lịch AI</span>
              </Button>
            </div>
          </form>
        </div>
      </main>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
          <div>
            <h4 className="text-xs sm:text-sm font-bold">Cập nhật thành công!</h4>
            <p className="text-[11px] text-white/80">{toastMessage}</p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
