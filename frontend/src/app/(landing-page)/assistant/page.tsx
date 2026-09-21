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
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Send,
  User,
  Building2,
  MapPin,
  Star,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  recommendation?: {
    id: string;
    name: string;
    image: string;
    price: string;
    rating: number;
    location: string;
  };
}

export default function AssistantPage() {
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Chào Minh Anh! Tôi là Trợ lý AI StayReco. Hãy cho tôi biết nhu cầu nghỉ dưỡng của bạn (điểm đến, ngân sách, tiện nghi), tôi sẽ tìm chốn nghỉ hợp gu nhất cho bạn!',
    },
    {
      id: '2',
      sender: 'user',
      text: 'Tìm cho mình khách sạn boutique 4 sao tại Đà Nẵng view sông Hàn, yên tĩnh cho 2 người vào dịp 20/10.',
    },
    {
      id: '3',
      sender: 'ai',
      text: 'Dựa trên sở thích thích sự yên tĩnh & view sông Hàn của bạn, tôi đề xuất ngay An Nhiên Riverside Hotel Đà Nẵng:',
      recommendation: {
        id: '1',
        name: 'An Nhiên Riverside Hotel Đà Nẵng',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
        price: '1.250.000 ₫ / đêm',
        rating: 4.9,
        location: 'Đường Bạch Đằng, Quận Hải Châu, Đà Nẵng',
      },
    },
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputQuery,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');

    setTimeout(() => {
      const aiReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'Tôi đã ghi nhận yêu cầu của bạn! Đang phân tích thêm các tiện nghi phù hợp và tình trạng phòng trống...',
      };
      setMessages((prev) => [...prev, aiReply]);
    }, 1000);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputQuery(prompt);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased text-foreground">
      <Header />

      <main className="flex-1 w-full bg-[#f7f9ff] py-6 lg:py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
          
          <AppBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Trợ lý AI StayReco', active: true },
            ]}
          />

          <div className="flex items-center gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-border shadow-2xs">
            <div className="relative flex size-14 shrink-0 items-center justify-center rounded-full bg-white shadow-md ring-4 ring-primary/10">
              <Image
                src="/images/logo_chatbot.png"
                alt="Logo Trợ lý AI StayReco"
                width={56}
                height={56}
                className="size-11 object-contain"
              />
              <span className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                <Sparkles className="size-3 text-amber-500" /> StayReco AI Travel Assistant 2.0
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Trợ lý AI & Gợi ý du lịch thông minh
              </h1>
              <p className="text-xs text-muted-foreground">
                Hỏi đáp trực tiếp với AI để thiết kế lịch trình và lựa chọn phòng nghỉ phù hợp nhất với phong cách cá nhân.
              </p>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              'Resort Đà Nẵng view sông cho 2 người',
              'Homestay Đà Lạt yên tĩnh gần trung tâm',
              'Khách sạn Phú Quốc có hồ bơi vô cực',
              'Boutique hotel Hội An bao gồm bữa sáng',
            ].map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickPrompt(p)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors whitespace-nowrap shadow-2xs"
              >
                ✨ {p}
              </button>
            ))}
          </div>

          {/* Chat Interface Container */}
          <Card className="p-4 sm:p-6 bg-white border border-border shadow-xs rounded-2xl flex flex-col h-137.5 justify-between">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 items-start ${
                    msg.sender === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`size-8 sm:size-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                      msg.sender === 'user'
                        ? 'bg-[#934a33] text-white'
                        : 'bg-white ring-1 ring-primary/15'
                    }`}
                  >
                    {msg.sender === 'user' ? (
                      <User className="size-4" />
                    ) : (
                      <Image
                        src="/images/logo_chatbot.png"
                        alt=""
                        width={36}
                        height={36}
                        className="size-7 object-contain"
                      />
                    )}
                  </div>

                  <div className={`space-y-3 max-w-lg ${msg.sender === 'user' ? 'text-right' : ''}`}>
                    <div
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs inline-block text-left ${
                        msg.sender === 'user'
                          ? 'bg-[#934a33] text-white rounded-tr-none font-medium'
                          : 'bg-primary/5 text-foreground rounded-tl-none border border-primary/15 font-medium'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* Embedded Recommendation Card */}
                    {msg.recommendation && (
                      <Card className="p-3 bg-white border border-border shadow-sm rounded-xl space-y-3 text-left">
                        <div className="flex items-center gap-3">
                          <div className="relative size-16 rounded-lg overflow-hidden shrink-0">
                            <Image
                              src={msg.recommendation.image}
                              alt={msg.recommendation.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <h4 className="text-xs font-bold text-foreground truncate">
                              {msg.recommendation.name}
                            </h4>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <MapPin className="size-3 text-primary" /> {msg.recommendation.location}
                            </p>
                            <span className="text-xs font-bold text-primary block">
                              {msg.recommendation.price}
                            </span>
                          </div>
                        </div>

                        <Link href={`/hotels/${msg.recommendation.id}`}>
                          <Button className="w-full h-8 text-xs font-semibold bg-primary text-primary-foreground gap-1">
                            Xem phòng & Đặt ngay <ArrowRight className="size-3.5" />
                          </Button>
                        </Link>
                      </Card>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="pt-4 border-t border-border flex gap-2">
              <Input
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Nhập câu hỏi hoặc mô tả chốn nghỉ bạn tìm kiếm..."
                className="h-11 text-sm focus-visible:ring-primary font-medium"
              />
              <Button type="submit" className="h-11 px-6 bg-primary text-primary-foreground font-bold shrink-0 gap-1.5">
                <span>Gửi</span> <Send className="size-4" />
              </Button>
            </form>
          </Card>

        </div>
      </main>

      <Footer />
    </div>
  );
}
