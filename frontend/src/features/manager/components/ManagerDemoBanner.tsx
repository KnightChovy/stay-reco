import { FlaskConical } from "lucide-react";

/**
 * Marks a screen built on the sample data of `@/lib/manager-data`, so its figures are not taken for live ones.
 * Remove it from a screen once that screen reads a real API.
 */
export function ManagerDemoBanner({ what = "Số liệu và danh sách trên màn hình này" }: { what?: string }) {
  return (
    <p
      role="note"
      className="flex items-start gap-3 rounded-xl border border-brand-accent/30 bg-brand-accent-soft p-4 text-sm text-foreground"
    >
      <FlaskConical size={18} className="mt-0.5 shrink-0 text-brand-accent" aria-hidden="true" />
      <span>
        <strong className="text-brand-accent">Dữ liệu minh hoạ.</strong> {what} là số liệu mẫu để trình diễn giao diện,
        không phản ánh hoạt động thật của nền tảng. Các thao tác ở đây chưa được lưu vào hệ thống.
      </span>
    </p>
  );
}
