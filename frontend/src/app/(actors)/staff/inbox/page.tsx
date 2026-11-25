'use client';

import { MessageSquare, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** Illustrative only: there is no chat or complaint API yet, so nothing here is real or sendable. */
const SAMPLES = [
  { name: 'Khách mẫu A', channel: 'Chat trực tiếp', last: 'Cho mình hỏi có thể nhận phòng sớm không?' },
  { name: 'Khách mẫu B', channel: 'Chat trực tiếp', last: 'Phòng của mình cần thêm một bộ khăn.' },
  { name: 'Khách mẫu C', channel: 'Chat trực tiếp', last: 'Cảm ơn khách sạn, mình đã nhận được phòng.' },
];

export default function StaffInboxPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 font-sans antialiased text-foreground">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-primary">Hộp thư khách</h1>
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-xs text-amber-700">Sắp ra mắt</Badge>
        </div>
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Tính năng chat và khiếu nại của khách chưa được kết nối. Nội dung bên dưới chỉ là bản minh hoạ, không phải tin nhắn thật.
          Khi cần hỗ trợ khách, hãy dùng số điện thoại trong chi tiết đặt phòng.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-[18rem_1fr]" aria-label="Bản minh hoạ, chưa hoạt động">
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card opacity-80">
          {SAMPLES.map((item) => (
            <li key={item.name} className="flex min-h-14 items-start gap-3 px-4 py-3">
              <MessageSquare className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{item.name}</p>
                <p className="truncate text-xs text-muted-foreground">{item.last}</p>
                <p className="text-xs text-muted-foreground">{item.channel} · minh hoạ</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex min-h-64 flex-col justify-end gap-3 rounded-xl border border-dashed border-border bg-card p-4">
          <p className="text-center text-sm text-muted-foreground">Chọn một cuộc trò chuyện sẽ hiển thị ở đây khi tính năng ra mắt.</p>
          <div className="flex items-center gap-2">
            <Input disabled aria-label="Soạn tin nhắn (chưa hoạt động)" placeholder="Chưa thể gửi tin nhắn" className="h-10" />
            <Button disabled aria-label="Gửi (chưa hoạt động)" className="h-10 w-10 shrink-0 p-0">
              <Send className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
