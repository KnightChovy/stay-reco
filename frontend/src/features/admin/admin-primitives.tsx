'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Construction, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
          <p className="mb-3 inline-flex rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="max-w-4xl text-[28px] font-bold leading-9 tracking-tight text-foreground md:text-[32px] md:leading-10">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
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
  return (
    <Card className={cn('rounded-2xl border-0 bg-card shadow-[0_1px_2px_rgba(1,55,88,0.06)] ring-0', className)}>
      {children}
    </Card>
  );
}

const statTones = {
  primary: { tile: 'bg-primary/10 text-primary', value: 'text-primary' },
  success: { tile: 'bg-success-soft text-success', value: 'text-primary' },
  warning: { tile: 'bg-warning-soft text-warning', value: 'text-warning' },
  danger: { tile: 'bg-danger-soft text-danger', value: 'text-danger' },
} as const;

/** A headline figure: small uppercase label, icon tile, big number and one line of context. A link when `href` is set. */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'primary',
  href,
}: {
  label: string;
  value: number | undefined;
  hint?: ReactNode;
  icon: LucideIcon;
  tone?: keyof typeof statTones;
  href?: string;
}) {
  const card = (
    <Panel className={cn('gap-0 p-5', href && 'transition-shadow hover:shadow-md')}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', statTones[tone].tile)}>
          <Icon size={20} aria-hidden />
        </span>
      </div>
      <p className={cn('mt-2 text-[32px] font-bold leading-10 tabular-nums', statTones[tone].value)}>
        {value === undefined ? '—' : value.toLocaleString('vi-VN')}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Panel>
  );
  return href ? (
    <Link href={href} className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-primary">
      {card}
    </Link>
  ) : (
    card
  );
}

/** A person's initials in a circle, where the design shows an avatar and the API has no photo. */
export function Initials({ name, className }: { name: string; className?: string }) {
  const words = name.trim().split(/\s+/);
  const letters = words.length > 1 ? words[0][0] + words[words.length - 1][0] : name.trim().slice(0, 2);
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold uppercase text-primary',
        className,
      )}
    >
      {letters}
    </span>
  );
}

/** A read-only field: uppercase label above the value in a tinted box. */
export function Tile({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="min-h-11 rounded-[10px] border border-border bg-muted/50 px-3 py-2.5 text-sm font-semibold text-foreground [overflow-wrap:anywhere]">
        {children}
      </dd>
    </div>
  );
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
