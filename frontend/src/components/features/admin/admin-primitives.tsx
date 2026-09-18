'use client';

import type { ReactNode } from 'react';
import { Check, X, type LucideIcon } from 'lucide-react';
import { Badge as ShadcnBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const tone: Record<string, string> = {
  'Hoạt động': 'bg-[#edf4ee] text-[#35624a]',
  'Tạm khóa': 'bg-[#ffdad6] text-[#ba1a1a]',
  'Chờ xác minh': 'bg-[#ffdbd0] text-[#783520]',
  'Khớp 100%': 'bg-[#edf4ee] text-[#35624a]',
  'Chờ IPN': 'bg-[#ffdbd0] text-[#783520]',
  'Cần đối soát': 'bg-[#ffdad6] text-[#ba1a1a]',
  'Hoàn tiền một phần': 'bg-[#eaf0f5] text-[#013758]',
  'Thông tin': 'bg-[#eaf0f5] text-[#013758]',
  'Cảnh báo': 'bg-[#ffdbd0] text-[#783520]',
  Cao: 'bg-[#ffdad6] text-[#ba1a1a]',
};

export type ScreenProps = { notify: (message: string) => void };

export function Badge({ children }: { children: string }) {
  return (
    <ShadcnBadge
      className={`h-auto rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone[children] ?? 'bg-[#f1f3f9] text-[#42474e]'}`}
    >
      {children}
    </ShadcnBadge>
  );
}

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

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl bg-white p-0 text-[#181c20]">
        <DialogHeader className="border-b border-[#e6e8ee] px-6 py-4">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="p-6">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

export function Notice({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <output
      className="fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-3 rounded-2xl border border-[#cde5ff] bg-white p-4 text-sm text-[#181c20] shadow-xl"
    >
      <Check size={18} className="shrink-0 text-[#35624a]" />
      <span className="flex-1">{message}</span>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="admin-icon-button"
      >
        <X size={16} />
      </Button>
    </output>
  );
}

export function Metric({
  label,
  value,
  hint,
  icon: Icon,
  state = 'primary',
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  state?: 'primary' | 'danger' | 'success';
}) {
  let color = 'bg-[#eaf0f5] text-[#013758]';
  if (state === 'danger') color = 'bg-[#ffdad6] text-[#ba1a1a]';
  if (state === 'success') color = 'bg-[#edf4ee] text-[#35624a]';
  return (
    <Panel className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#636d77]">
            {label}
          </p>
          <p
            className={`mt-3 text-3xl font-bold tracking-tight ${state === 'danger' ? 'text-[#934a33]' : 'text-[#013758]'}`}
          >
            {value}
          </p>
        </div>
        <span className={`grid size-11 place-items-center rounded-xl ${color}`}>
          <Icon size={22} />
        </span>
      </div>
      <p className="mt-5 text-xs text-[#636d77]">{hint}</p>
    </Panel>
  );
}
