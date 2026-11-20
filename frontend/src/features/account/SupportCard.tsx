import { Headset, Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

/** StayReco's customer support, in one place so every page shows the same contacts. */
export const SUPPORT = {
  email: 'support@stayreco.vn',
  hotline: '1900 6868',
  hotlineHref: 'tel:19006868',
  hours: '8:00 – 22:00 mỗi ngày',
} as const;

export function SupportCard({ note, className }: { note?: string; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-4 text-sm', className)}>
      <p className="flex items-center gap-1.5 font-semibold text-foreground">
        <Headset className="size-4 text-primary" aria-hidden /> Cần hỗ trợ?
      </p>
      {note && <p className="mt-1 text-muted-foreground">{note}</p>}
      <div className="mt-3 flex flex-col gap-1.5">
        <a href={SUPPORT.hotlineHref} className="inline-flex min-h-9 items-center gap-2 font-semibold text-primary hover:underline">
          <Phone className="size-4" aria-hidden /> {SUPPORT.hotline}
          <span className="font-normal text-muted-foreground">· {SUPPORT.hours}</span>
        </a>
        <a href={`mailto:${SUPPORT.email}`} className="inline-flex min-h-9 items-center gap-2 font-semibold text-primary hover:underline">
          <Mail className="size-4" aria-hidden /> {SUPPORT.email}
        </a>
      </div>
    </div>
  );
}
