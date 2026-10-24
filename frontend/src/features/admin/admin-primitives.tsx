'use client';

import type { ReactNode } from 'react';
import { Construction } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#636d77]">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-[#013758] md:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#636d77]">
          {description}
        </p>
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function Panel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <Card className={`admin-panel ${className}`}>{children}</Card>;
}

/** Shown instead of sample figures while the backend has no API for the screen (Phase 6). */
export function AdminUnavailable({ upcoming }: { upcoming: string[] }) {
  return (
    <Panel className="flex flex-col items-center gap-4 px-5 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
        <Construction size={22} />
      </span>
      <div className="space-y-2">
        <h2 className="font-bold text-primary">Tính năng chưa có dữ liệu</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Backend chưa cung cấp API cho màn hình này. Dữ liệu sẽ hiển thị khi{' '}
          <strong>Phase 6: Báo cáo và quản trị</strong> được triển khai.
        </p>
      </div>
      <ul className="grid max-w-md gap-2 text-left text-sm text-muted-foreground">
        {upcoming.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden="true" className="text-primary">•</span>
            {item}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
