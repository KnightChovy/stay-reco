'use client';

import { Bot, FlaskConical, Gauge, KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageTitle, Panel } from './admin-primitives';

/** The only admin route without an API: system AI settings (UC81) belong to the AI phase. */
export function AdminScreen({ mode }: { mode: 'ai-settings' }) {
  void mode;
  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Quản trị hệ thống"
        title="Cấu hình AI toàn hệ thống"
        description="Quản lý mô hình, hạn mức và bộ lọc an toàn cho trợ lý du lịch. Các chức năng đang chờ tích hợp và chưa thể thay đổi."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Tiêu thụ tokens', 'Hạn mức & Chi phí'],
          ['Độ chính xác tri thức', 'Chất lượng tư vấn'],
          ['Độ trễ trung bình', 'Thời gian phản hồi'],
        ].map(([title, label]) => (
          <Panel key={title} className="gap-2 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
            <h2 className="font-semibold">{title}</h2><p className="text-3xl font-bold text-primary">—</p>
            <p className="text-xs text-muted-foreground">Chưa có dữ liệu đo lường</p>
          </Panel>
        ))}
      </div>
      <Panel className="gap-5 p-6">
        <h2 className="flex items-center gap-3 text-lg font-bold"><Bot className="text-primary" />1. Phân bổ Mô hình & Nhà cung cấp</h2>
        <p className="text-sm text-muted-foreground">Chưa có cấu hình mô hình được công bố.</p>
        {['Trợ lý Chat & Tư vấn du lịch', 'Thuật toán Gợi ý cá nhân hóa', 'Trình tạo nội dung Marketing'].map((name) => (
          <div key={name} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted p-4">
            <div><h3 className="text-sm font-semibold">{name}</h3><p className="mt-1 text-xs text-muted-foreground">Chưa khả dụng</p></div>
            <Button variant="outline" disabled><LockKeyhole />Chưa kết nối mô hình</Button>
          </div>
        ))}
      </Panel>
      <Panel className="gap-4 p-6">
        <h2 className="flex items-center gap-3 text-lg font-bold"><KeyRound className="text-primary" />2. Khóa bảo mật API & Chứng thực</h2>
        <p className="text-sm text-muted-foreground">Chưa hỗ trợ quản lý thông tin xác thực tại đây.</p>
        <label className="grid gap-2 text-sm font-medium">Khóa API<Input disabled placeholder="Chưa có thông tin cấu hình" /></label>
      </Panel>
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Panel className="gap-4 p-6">
          <h2 className="flex items-center gap-3 text-lg font-bold"><Gauge className="shrink-0 text-primary" />3. Giới hạn truy vấn & Hạn mức</h2>
          <p className="text-sm leading-6 text-muted-foreground">Hạn mức cho khách vãng lai, thành viên và số kết nối đồng thời sẽ hiển thị khi được tích hợp.</p>
          <Button variant="outline" disabled>Chưa có hạn mức</Button>
        </Panel>
        <Panel className="gap-4 p-6">
          <h2 className="flex items-center gap-3 text-lg font-bold"><ShieldCheck className="shrink-0 text-primary" />4. Bộ lọc An toàn & Chống ảo giác</h2>
          <p className="text-sm leading-6 text-muted-foreground">Trạng thái ràng buộc tri thức, chuyển tiếp nhân viên và bộ lọc nội dung chưa được cung cấp.</p>
          <Button variant="outline" disabled>Chưa có cấu hình an toàn</Button>
        </Panel>
      </div>
      <Panel className="gap-4 p-6">
        <h2 className="flex items-center gap-3 text-lg font-bold"><FlaskConical className="text-primary" />Khu vực thử nghiệm nhanh Prompt</h2>
        <p className="text-sm text-muted-foreground">Chưa thể chạy thử vì tính năng AI chưa được kết nối.</p>
        <label className="grid gap-2 text-sm font-medium">Prompt thử nghiệm<Input disabled placeholder="Chờ tích hợp AI để thử nghiệm" /></label>
        <Button disabled className="self-end">Chạy kiểm tra</Button>
      </Panel>
    </div>
  );
}
