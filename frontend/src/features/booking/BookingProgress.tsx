'use client';

import { Check } from 'lucide-react';
import { usePathname } from 'next/navigation';

const steps = [
  { label: 'Thông tin đặt phòng', href: '/booking' },
  { label: 'Thanh toán', href: '/booking/payment' },
  { label: 'Xác nhận & Voucher', href: '/booking/confirmation' },
];

export default function BookingProgress() {
  const pathname = usePathname();
  const activeStep = pathname.includes('/confirmation') ? 2 : pathname.includes('/payment') ? 1 : 0;

  return (
    <nav aria-label="Tiến trình đặt phòng" className="border-b border-slate-200/80 bg-white">
      <div className="mx-auto flex max-w-marketplace items-center px-4 py-4 sm:px-6">
        {steps.map((step, index) => {
          const complete = index < activeStep;
          const active = index === activeStep;

          return (
            <div key={step.href} className="flex min-w-0 flex-1 items-center last:flex-none">
              <div className={`flex items-center gap-2 sm:gap-2.5 ${active ? 'text-[#013758]' : complete ? 'text-[#35624A]' : 'text-slate-400'}`}>
                <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${active ? 'bg-[#234e70] text-white' : complete ? 'bg-[#EDF4EE] text-[#35624A]' : 'bg-slate-100 text-slate-500'}`}>
                  {complete ? <Check className="size-4" /> : index + 1}
                </span>
                <span className={`hidden text-sm sm:block ${active ? 'font-bold' : 'font-medium'}`}>{step.label}</span>
              </div>
              {index < steps.length - 1 && <span className={`mx-2 h-0.5 flex-1 rounded-full sm:mx-4 ${index < activeStep ? 'bg-[#35624A]' : 'bg-slate-200'}`} />}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
