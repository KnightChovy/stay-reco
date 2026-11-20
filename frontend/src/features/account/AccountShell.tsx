'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Toast, ToastClose, ToastContent, ToastDescription, ToastPortal, ToastProvider, ToastTitle, ToastViewport, toast, useToastManager } from '@/components/ui/toast';
import AccountSubNav, { ACCOUNT_TABS } from './AccountSubNav';

function AccountToasts() {
  const { toasts } = useToastManager();
  return toasts.map((item) => (
    <Toast key={item.id} toast={item}>
      <ToastContent>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <ToastTitle />
          <ToastDescription />
        </div>
        <ToastClose />
      </ToastContent>
    </Toast>
  ));
}

/**
 * Everything the /account pages share, once: the site header, the account tab bar on the top-level pages (a booking's
 * own pages navigate with their breadcrumb instead), the page background, the footer and the toasts.
 * The toasts sit above the floating AI button.
 */
export function AccountShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isTopLevel = ACCOUNT_TABS.some((tab) => tab.href === pathname);

  return (
    <ToastProvider toastManager={toast}>
      <div className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
        <div className="contents print:hidden">
          <Header />
          {isTopLevel && <AccountSubNav />}
        </div>
        <main className="w-full flex-1">{children}</main>
        <div className="contents print:hidden">
          <Footer />
        </div>
      </div>
      <ToastPortal>
        <ToastViewport className="bottom-24 sm:bottom-24">
          <AccountToasts />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  );
}

/** Short confirmations for the account pages, e.g. `notify.success('Đã lưu')`. */
export const notify = {
  success: (title: string, description?: string) => toast.add({ title, description, type: 'success', timeout: 3500 }),
  error: (title: string, description?: string) => toast.add({ title, description, type: 'error', timeout: 6000 }),
  info: (title: string, description?: string) => toast.add({ title, description, type: 'info', timeout: 3500 }),
};

/**
 * The title block of an account page: an optional eyebrow, the h1, one line of description and the page's actions
 * (an `ActionBar`, never a row of equal buttons).
 */
export function AccountPageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
        {children}
      </div>
      {actions}
    </div>
  );
}

/** Page widths: `wide` for lists and booking pages, `narrow` for forms. */
export const accountContainer = {
  wide: 'mx-auto w-full max-w-marketplace px-4 py-6 sm:px-6 sm:py-8',
  narrow: 'mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8',
} as const;
