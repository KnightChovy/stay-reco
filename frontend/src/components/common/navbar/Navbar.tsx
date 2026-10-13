'use client';

import Link from 'next/link';
import { Bell, ChevronDown, House, LogOut, Search, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuthStore } from '@/lib/auth-store';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type NavbarUser = {
  name: string;
  role: string;
  avatarUrl?: string;
};

type NavbarProps = {
  user?: NavbarUser;
  notificationCount?: number;
  searchPlaceholder?: string;
  profileHref?: string;
  homeHref?: string;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  showSidebarTrigger?: boolean;
  className?: string;
  context?: { name: string; meta?: string; status?: string };
};

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function Navbar({
  user = { name: 'Người dùng StayReco', role: 'Tài khoản' },
  notificationCount = 0,
  searchPlaceholder = 'Tìm booking, khách hàng hoặc phòng...',
  profileHref = '/profile',
  homeHref = '/',
  onSearch,
  onNotificationClick,
  showSidebarTrigger = false,
  className,
  context,
}: NavbarProps) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const [query, setQuery] = useState('');
  const visibleNotificationCount =
    notificationCount > 9 ? '9+' : notificationCount;

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch?.(query.trim());
  };

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <header
      className={cn(
        'flex min-h-20 items-center gap-3 border-b border-border bg-white px-4 sm:px-6',
        className,
      )}
    >
      {showSidebarTrigger && (
        <SidebarTrigger
          className="size-10 shrink-0 md:hidden"
          aria-label="Mở thanh điều hướng"
        />
      )}
      {context && (
        <div className="hidden min-w-64 items-center gap-3 rounded-xl bg-muted px-3 py-2 xl:flex">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-card text-primary shadow-sm"><House className="size-4" /></span>
          <span className="min-w-0 flex-1"><strong className="block truncate text-xs text-foreground">{context.name}</strong>{context.meta && <span className="block truncate text-[10px] text-muted-foreground">{context.meta}</span>}</span>
          {context.status && <span className="rounded-full bg-success-soft px-2 py-1 text-[9px] font-semibold text-success">{context.status}</span>}
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </div>
      )}
      <form
        onSubmit={handleSearch}
        className="relative hidden min-w-0 w-full max-w-xl md:block"
        role="search"
      >
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          className="h-11 border-input bg-white pl-10 text-sm placeholder:text-muted-foreground"
          aria-label="Tìm kiếm"
        />
      </form>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          onClick={onNotificationClick}
          className="relative size-11 rounded-lg text-muted-foreground hover:text-primary"
          aria-label={
            notificationCount > 0
              ? `Thông báo, có ${notificationCount} thông báo chưa đọc`
              : 'Thông báo'
          }
        >
          <Bell className="size-5" strokeWidth={1.75} aria-hidden="true" />
          {notificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-4 font-semibold text-primary-foreground">
              {visibleNotificationCount}
            </span>
          )}
        </Button>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger
            className="inline-flex h-12 items-center gap-2 rounded-lg px-1.5 text-left transition-colors hover:bg-muted focus-visible:outline-none sm:pr-2.5"
            aria-label={`Mở menu tài khoản của ${user.name}`}
          >
            <Avatar size="lg" className="size-10">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
              <AvatarFallback className="bg-accent text-sm font-semibold text-primary">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden min-w-0 sm:flex sm:max-w-40 sm:flex-col">
              <span className="truncate text-sm font-semibold text-foreground">
                {user.name}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {user.role}
              </span>
            </span>
            <ChevronDown
              className="hidden size-4 shrink-0 text-muted-foreground sm:block"
              aria-hidden="true"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-56 rounded-xl p-2 shadow-card"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-3 py-2">
                <span className="block text-sm font-semibold text-foreground">
                  {user.name}
                </span>
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                  {user.role}
                </span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={<Link href={profileHref} />}
              className="min-h-10 px-3 text-sm"
            >
              <UserRound className="size-4" aria-hidden="true" />
              Hồ sơ cá nhân
            </DropdownMenuItem>
            <DropdownMenuItem
              render={<Link href={homeHref} />}
              className="min-h-10 px-3 text-sm"
            >
              <House className="size-4" aria-hidden="true" />
              Trang chủ
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="min-h-10 px-3 text-sm text-destructive focus:text-destructive"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
