'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Building2,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';

export { SidebarProvider };

export type SidebarItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive?: boolean;
  badge?: string | number;
  section?: string;
};

export type SidebarProps = {
  items?: SidebarItem[];
  roleLabel?: string;
  contextName?: string;
  onLogout?: () => void;
  logoutLabel?: string;
  className?: string;
};

export const defaultSidebarItems: SidebarItem[] = [
  {
    href: '/dashboard',
    label: 'Tổng quan',
    icon: LayoutDashboard,
    isActive: true,
  },
  { href: '/bookings', label: 'Đặt phòng', icon: CalendarDays },
  { href: '/inbox', label: 'Hộp thư', icon: MessageSquare },
  { href: '/settings', label: 'Cài đặt', icon: Settings },
];

export default function Sidebar({
  items = defaultSidebarItems,
  roleLabel = 'Không gian làm việc',
  contextName,
  onLogout,
  logoutLabel = 'Đăng xuất',
  className,
}: SidebarProps) {
  const groupedItems = items.reduce<Array<{ label: string; items: SidebarItem[] }>>(
    (groups, item) => {
      const label = item.section ?? 'Điều hướng';
      const currentGroup = groups.find((group) => group.label === label);
      if (currentGroup) currentGroup.items.push(item);
      else groups.push({ label, items: [item] });
      return groups;
    },
    [],
  );

  return (
    <ShadcnSidebar
      collapsible="offcanvas"
      className={cn('border-sidebar-border', className)}
    >
      <SidebarHeader className="gap-0 border-b border-sidebar-border p-0">
        <div className="flex h-20 items-center px-6">
          <Link
            href="/"
            className="rounded-md focus-visible:outline-none"
            aria-label="StayReco - Trang chủ"
          >
            <Image
              src="/images/logo_stayreco.png"
              alt="StayReco"
              width={2055}
              height={765}
              priority
              className="h-auto w-31"
            />
          </Link>
        </div>
        <div className="border-t border-sidebar-border px-5 py-4">
          <p className="text-xs font-medium text-muted-foreground">
            {roleLabel}
          </p>
          {contextName && (
            <p className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Building2
                className="size-4 shrink-0 text-primary"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span className="truncate">{contextName}</span>
            </p>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">
        {groupedItems.map((group) => (
        <SidebarGroup key={group.label} className="px-3 py-2">
          <SidebarGroupLabel className="px-3 text-[10px] font-semibold tracking-wide text-muted-foreground">
            {group.label}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={`${item.href}-${item.label}`}>
                    <SidebarMenuButton
                      render={
                        <Link
                          href={item.href}
                          aria-current={item.isActive ? 'page' : undefined}
                        />
                      }
                      isActive={item.isActive}
                      size="lg"
                      tooltip={item.label}
                      className={cn(
                        'relative rounded-xl px-3 text-[13px] before:absolute before:inset-y-2.5 before:left-0 before:w-0.75 before:rounded-r-full before:bg-primary before:opacity-0 data-active:bg-primary data-active:text-primary-foreground data-active:before:bg-primary-foreground data-active:before:opacity-100',
                        item.isActive && 'font-semibold',
                      )}
                    >
                      <Icon strokeWidth={1.75} aria-hidden="true" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    {item.badge !== undefined && (
                      <SidebarMenuBadge className="bg-white font-semibold tabular-nums text-primary ring-1 ring-primary/15">
                        {item.badge}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => onLogout?.()}
              tooltip={logoutLabel}
              className="rounded-lg px-3 text-muted-foreground hover:bg-danger-soft hover:text-danger"
            >
              <LogOut strokeWidth={1.75} aria-hidden="true" />
              <span>{logoutLabel}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </ShadcnSidebar>
  );
}
