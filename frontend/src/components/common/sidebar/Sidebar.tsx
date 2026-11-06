'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import {
  Building2,
  CalendarDays,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  useSidebar,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export { SidebarProvider };

export type SidebarItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive?: boolean;
  badge?: string | number;
  section?: string;
  /** Not built yet: shown with a "Sắp có" badge and no link, so it is not a dead end. */
  comingSoon?: boolean;
};

export type SidebarProps = {
  items?: SidebarItem[];
  /** The block under the logo is shown only when one of these is given. */
  roleLabel?: string;
  contextName?: string;
  /**
   * Turns sections into dropdowns, each with its icon. Items without a section stay on top as plain links.
   * Without it, sections are labelled lists (items without a section go under "Điều hướng").
   */
  collapsibleSections?: Record<string, LucideIcon>;
  /** Adds a "Thu gọn" button that shrinks the sidebar to its icons (desktop only; mobile keeps the sheet). */
  collapsibleToIcon?: boolean;
  /** Off when the account menu of the navbar already offers it. */
  showLogout?: boolean;
  onLogout?: () => void;
  logoutLabel?: string;
  footerContent?: ReactNode;
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

/** In icon mode the labels stay for screen readers but take no room, so the icon sits centred in its button. */
const iconLabelClassName = 'group-data-[collapsible=icon]:sr-only';

const navItemClassName =
  'relative rounded-xl px-3 text-[13px] group-data-[collapsible=icon]:justify-center before:absolute before:inset-y-2.5 before:left-0 before:w-0.75 before:rounded-r-full before:bg-primary before:opacity-0 data-active:bg-primary data-active:text-primary-foreground data-active:before:bg-primary-foreground data-active:before:opacity-100';

function NavItem({ item }: { item: SidebarItem }) {
  const Icon = item.icon;

  if (item.comingSoon) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          disabled
          tooltip={`${item.label} (sắp có)`}
          className={cn(navItemClassName, 'text-muted-foreground disabled:opacity-100!')}
        >
          <Icon strokeWidth={1.75} aria-hidden="true" />
          <span className={iconLabelClassName}>{item.label}</span>
          <span className={cn('ml-auto shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground', iconLabelClassName)}>
            Sắp có
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
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
        className={cn(navItemClassName, item.isActive && 'font-semibold')}
      >
        <Icon strokeWidth={1.75} aria-hidden="true" />
        <span className={iconLabelClassName}>{item.label}</span>
      </SidebarMenuButton>
      {item.badge !== undefined && (
        <SidebarMenuBadge className="bg-white font-semibold tabular-nums text-primary ring-1 ring-primary/15">
          {item.badge}
        </SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  );
}

/** A section as a dropdown. The sidebar keeps one section open at a time (see `Sidebar`). */
function CollapsibleSection({
  label,
  icon: Icon,
  items,
  iconOnly,
  open,
  onOpenChange,
}: {
  label: string;
  icon: LucideIcon;
  items: SidebarItem[];
  /** The sidebar is shrunk to icons: the section opens as a flyout menu instead of expanding in place. */
  iconOnly: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const hasActive = items.some((item) => item.isActive);
  // Badges of hidden items are summed on the section, so a closed section still shows there is work inside.
  const hiddenBadges = items.reduce(
    (sum, item) => sum + (typeof item.badge === 'number' ? item.badge : 0),
    0,
  );
  const showBadge = !open && hiddenBadges > 0;

  if (iconOnly) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                isActive={hasActive}
                aria-label={hiddenBadges > 0 ? `${label}, ${hiddenBadges} việc chờ xử lý` : label}
                className={cn(navItemClassName, 'cursor-pointer')}
              />
            }
          >
            <Icon strokeWidth={1.75} aria-hidden="true" />
            <span className={iconLabelClassName}>{label}</span>
            {hiddenBadges > 0 && (
              <span className="absolute top-1 right-1 size-2 rounded-full bg-danger ring-2 ring-sidebar" aria-hidden="true" />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" sideOffset={10} className="w-60 rounded-xl p-2 shadow-card">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2">{label}</DropdownMenuLabel>
              {items.map((item) => {
                const ItemIcon = item.icon;
                if (item.comingSoon) {
                  return (
                    <DropdownMenuItem key={`${item.href}-${item.label}`} disabled className="min-h-9 px-2">
                      <ItemIcon strokeWidth={1.75} aria-hidden="true" />
                      <span className="flex-1 truncate">{item.label}</span>
                      <span className="rounded-full bg-muted px-1.5 text-[10px] font-semibold">Sắp có</span>
                    </DropdownMenuItem>
                  );
                }
                return (
                  <DropdownMenuItem
                    key={`${item.href}-${item.label}`}
                    render={<Link href={item.href} aria-current={item.isActive ? 'page' : undefined} />}
                    className={cn('min-h-9 cursor-pointer px-2', item.isActive && 'bg-accent font-semibold text-accent-foreground')}
                  >
                    <ItemIcon strokeWidth={1.75} aria-hidden="true" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="rounded-full bg-primary/10 px-1.5 text-xs font-semibold tabular-nums text-primary">
                        {item.badge}
                      </span>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={onOpenChange} render={<SidebarMenuItem />}>
      <CollapsibleTrigger
        render={
          <SidebarMenuButton
            size="lg"
            tooltip={label}
            className={cn(
              'cursor-pointer rounded-xl px-3 text-[13px] font-medium',
              hasActive && !open && 'bg-primary/10 font-semibold text-primary',
            )}
          />
        }
      >
        <Icon strokeWidth={1.75} aria-hidden="true" />
        <span>{label}</span>
        {showBadge && (
          <span className="ml-auto rounded-full bg-white px-1.5 text-xs font-semibold tabular-nums text-primary ring-1 ring-primary/15">
            {hiddenBadges}
          </span>
        )}
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
            !showBadge && 'ml-auto',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none">
        <SidebarMenu className="mt-0.5 ml-4 gap-0.5 border-l border-sidebar-border pl-2">
          {items.map((item) => (
            <NavItem key={`${item.href}-${item.label}`} item={item} />
          ))}
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function Sidebar({
  items = defaultSidebarItems,
  roleLabel,
  contextName,
  collapsibleSections,
  collapsibleToIcon = false,
  showLogout = true,
  onLogout,
  logoutLabel = 'Đăng xuất',
  footerContent,
  className,
}: SidebarProps) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const { state, isMobile, toggleSidebar } = useSidebar();
  // One open section at a time keeps the sidebar height stable, so the next target does not move under the pointer.
  // It follows the current page until the user opens or closes a section; a new current section takes over again.
  const activeSection = items.find((item) => item.isActive)?.section ?? null;
  const [openSection, setOpenSection] = useState<string | null>(activeSection);
  const [shownSection, setShownSection] = useState(activeSection);
  if (shownSection !== activeSection) {
    setShownSection(activeSection);
    if (activeSection) setOpenSection(activeSection);
  }
  // The mobile sheet always shows the full sidebar, whatever the desktop state.
  const iconOnly = collapsibleToIcon && state === 'collapsed' && !isMobile;
  const showToggle = collapsibleToIcon && !isMobile;
  const topItems = collapsibleSections ? items.filter((item) => !item.section) : [];
  const groupedItems = items.reduce<Array<{ label: string; items: SidebarItem[] }>>(
    (groups, item) => {
      if (collapsibleSections && !item.section) return groups;
      const label = item.section ?? 'Điều hướng';
      const currentGroup = groups.find((group) => group.label === label);
      if (currentGroup) currentGroup.items.push(item);
      else groups.push({ label, items: [item] });
      return groups;
    },
    [],
  );

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }

    logout();
    router.replace('/');
  };

  return (
    <ShadcnSidebar
      collapsible={collapsibleToIcon ? 'icon' : 'offcanvas'}
      className={cn('border-sidebar-border', className)}
    >
      <SidebarHeader className="gap-0 border-b border-sidebar-border p-0">
        <div
          className={cn(
            'group/brand relative flex h-20 items-center',
            iconOnly ? 'justify-center' : 'justify-between pr-3 pl-6',
          )}
        >
          <Link
            href="/"
            className={cn(
              'rounded-md focus-visible:outline-none',
              // Icon mode has no room for both: the mini logo gives way to the expand button on hover or focus.
              showToggle && iconOnly && 'transition-opacity group-hover/brand:opacity-0 group-has-focus-visible/brand:opacity-0',
            )}
            aria-label="StayReco - Trang chủ"
          >
            {iconOnly ? (
              <Image
                src="/images/logo_stayreco_mini.png"
                alt="StayReco"
                width={460}
                height={475}
                priority
                className="h-auto w-8"
              />
            ) : (
              <Image
                src="/images/logo_stayreco.png"
                alt="StayReco"
                width={2055}
                height={765}
                priority
                className="h-auto w-31"
              />
            )}
          </Link>
          {showToggle && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={toggleSidebar}
                    aria-label={iconOnly ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
                    aria-expanded={!iconOnly}
                    className={cn(
                      'grid size-8 cursor-pointer place-items-center rounded-lg text-muted-foreground transition hover:bg-sidebar-accent hover:text-primary focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none',
                      iconOnly &&
                        'absolute inset-0 m-auto opacity-0 group-hover/brand:opacity-100 group-has-focus-visible/brand:opacity-100',
                    )}
                  />
                }
              >
                {iconOnly ? (
                  <PanelLeftOpen className="size-5" strokeWidth={1.75} aria-hidden="true" />
                ) : (
                  <PanelLeftClose className="size-5" strokeWidth={1.75} aria-hidden="true" />
                )}
              </TooltipTrigger>
              <TooltipContent side="right">
                {iconOnly ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'} (Ctrl+B)
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {(roleLabel || contextName) && !iconOnly && (
          <div className="border-t border-sidebar-border px-5 py-4">
            {roleLabel && (
              <p className="text-xs font-medium text-muted-foreground">
                {roleLabel}
              </p>
            )}
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
        )}
      </SidebarHeader>

      <SidebarContent className="py-2">
        <nav aria-label="Điều hướng chính" className="contents">
          {collapsibleSections ? (
            <SidebarGroup className="px-3 py-2 group-data-[collapsible=icon]:px-2">
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {topItems.map((item) => (
                    <NavItem key={`${item.href}-${item.label}`} item={item} />
                  ))}
                  {groupedItems.map((group) => (
                    <CollapsibleSection
                      key={group.label}
                      label={group.label}
                      icon={collapsibleSections[group.label] ?? LayoutDashboard}
                      items={group.items}
                      iconOnly={iconOnly}
                      open={openSection === group.label}
                      onOpenChange={(open) => setOpenSection(open ? group.label : null)}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ) : (
            groupedItems.map((group) => (
              <SidebarGroup key={group.label} className="px-3 py-2 group-data-[collapsible=icon]:px-2">
                <SidebarGroupLabel className="px-3 text-[10px] font-semibold tracking-wide text-muted-foreground">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-0.5">
                    {group.items.map((item) => (
                      <NavItem key={`${item.href}-${item.label}`} item={item} />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))
          )}
        </nav>
      </SidebarContent>

      {(footerContent || showLogout) && (
        <SidebarFooter className="border-t border-sidebar-border p-3 group-data-[collapsible=icon]:p-2">
          {footerContent}
          {showLogout && (
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  onClick={handleLogout}
                  tooltip={logoutLabel}
                  className="cursor-pointer rounded-lg px-3 text-muted-foreground hover:bg-danger-soft hover:text-danger group-data-[collapsible=icon]:justify-center"
                >
                  <LogOut strokeWidth={1.75} aria-hidden="true" />
                  <span className={iconLabelClassName}>{logoutLabel}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )}
        </SidebarFooter>
      )}
    </ShadcnSidebar>
  );
}
