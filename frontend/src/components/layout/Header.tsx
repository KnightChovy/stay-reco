'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import FloatingAiButton from '@/components/common/FloatingAiButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  Building2,
  CalendarCheck,
  ChevronDown,
  Compass,
  Gift,
  Globe2,
  Lock,
  LogOut,
  Menu,
  Shield,
  Sparkles,
  UserRound,
  Wallet,
  X
} from 'lucide-react';
import { roleDashboardPaths, useAuthStore } from '@/lib/auth-store';

const navigation = [
  { href: '/', label: 'Khám phá' },
  { href: '/recommendations', label: 'Gợi ý cho bạn' },
  { href: '/assistant', label: 'Trợ lý AI' },
  { href: '/blog', label: 'Blog' },
];

function isNavigationItemActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

const roleChannels = {
  customer: null,
  partner: { label: 'Kênh Đối tác Partner', icon: Building2, className: 'text-blue-700' },
  staff: { label: 'Kênh Nhân viên Staff', icon: UserRound, className: 'text-teal-700' },
  manager: { label: 'Kênh Quản lý Manager', icon: Shield, className: 'text-indigo-700' },
  admin: { label: 'Admin Dashboard', icon: Sparkles, className: 'text-purple-700' },
} as const;

type Language = 'vi' | 'en';
type Currency = 'VND' | 'USD';

function getInitials(name?: string) {
  return (
    name
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() ?? 'SR'
  );
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('vi');
  const [currency, setCurrency] = useState<Currency>('VND');
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const logout = useAuthStore((state) => state.logout);
  const isAuthenticated = hasHydrated && Boolean(user);

  const languageLabel = language === 'vi' ? 'VI' : 'ENG';
  const userName = user?.name ?? 'Khách hàng StayReco';
  const roleChannel = user ? roleChannels[user.role] : null;
  const RoleChannelIcon = roleChannel?.icon;
  const authHref = `/login?next=${encodeURIComponent(pathname)}`;
  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white">
      <div className="mx-auto flex min-h-16 max-w-[100rem] items-center gap-4 px-4 sm:px-6 lg:min-h-20 lg:px-7">
        <Link
          href="/"
          className="shrink-0 rounded-md focus-visible:outline-none"
          aria-label="StayReco - Trang chủ"
        >
          <Image
            src="/images/logo_stayreco.png"
            alt="StayReco"
            width={2055}
            height={765}
            priority
            className="h-auto w-28 sm:w-30 lg:w-31"
          />
        </Link>

        <nav
          className="ml-3 hidden items-center gap-6 lg:flex"
          aria-label="Điều hướng chính"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isNavigationItemActive(pathname, item.href) ? 'page' : undefined}
              className={`relative py-6 text-base font-medium leading-6 transition-colors hover:text-primary focus-visible:outline-none ${
                isNavigationItemActive(pathname, item.href)
                  ? 'text-primary after:absolute after:inset-x-0 after:bottom-4.5 after:h-0.5 after:bg-primary'
                  : 'text-muted-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-4 lg:flex">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs sm:text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none"
              aria-label={`Chọn ngôn ngữ, hiện tại là ${language === 'vi' ? 'Tiếng Việt' : 'English'}`}
            >
              <Globe2
                className="size-4 text-muted-foreground"
                strokeWidth={2}
                aria-hidden="true"
              />
              {languageLabel}
              <ChevronDown
                className="size-3.5 text-muted-foreground"
                aria-hidden="true"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-44 rounded-xl p-2 shadow-card"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-3 py-2 text-sm font-medium text-foreground">
                  Ngôn ngữ
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuRadioGroup
                value={language}
                onValueChange={(value) => setLanguage(value as Language)}
              >
                <DropdownMenuRadioItem
                  value="vi"
                  closeOnClick
                  className="min-h-10 px-3 text-sm"
                >
                  Tiếng Việt{' '}
                  <span className="ml-auto mr-5 text-muted-foreground">VI</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="en"
                  closeOnClick
                  className="min-h-10 px-3 text-sm"
                >
                  English{' '}
                  <span className="ml-auto mr-5 text-muted-foreground">
                    ENG
                  </span>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs sm:text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none"
              aria-label={`Chọn đơn vị tiền tệ, hiện tại là ${currency}`}
            >
              {currency}
              <ChevronDown
                className="size-3.5 text-muted-foreground"
                aria-hidden="true"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-36 rounded-xl p-2 shadow-card"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-3 py-2 text-sm font-medium text-foreground">
                  Tiền tệ
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuRadioGroup
                value={currency}
                onValueChange={(value) => setCurrency(value as Currency)}
              >
                <DropdownMenuRadioItem
                  value="VND"
                  closeOnClick
                  className="min-h-10 px-3 text-sm"
                >
                  VND{' '}
                  <span className="ml-auto mr-5 text-muted-foreground">₫</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="USD"
                  closeOnClick
                  className="min-h-10 px-3 text-sm"
                >
                  USD{' '}
                  <span className="ml-auto mr-5 text-muted-foreground">$</span>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {isAuthenticated ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger
                className="inline-flex size-10 items-center justify-center rounded-full focus-visible:outline-none"
                aria-label={`Mở menu tài khoản của ${userName}`}
              >
                <Avatar size="default" className="size-9">
                  {user?.avatarUrl && (
                    <AvatarImage src={user.avatarUrl} alt="" />
                  )}
                  <AvatarFallback className="bg-accent text-xs font-semibold text-primary">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-56 rounded-xl p-2 shadow-card space-y-1"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="px-3 py-2 text-sm font-bold text-foreground">
                    {userName}
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  render={<Link href="/account/bookings" />}
                  className="min-h-10 px-3 text-sm cursor-pointer"
                >
                  <CalendarCheck className="size-4 text-primary" aria-hidden="true" />
                  Chuyến đi của tôi
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={<Link href="/account/profile" />}
                  className="min-h-10 px-3 text-sm cursor-pointer"
                >
                  <UserRound className="size-4 text-primary" aria-hidden="true" />
                  Hồ sơ cá nhân
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={<Link href="/account/notifications" />}
                  className="min-h-10 px-3 text-sm cursor-pointer"
                >
                  <Bell className="size-4 text-primary" aria-hidden="true" />
                  Thông báo
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={<Link href="/account/preferences" />}
                  className="min-h-10 px-3 text-sm cursor-pointer"
                >
                  <Compass className="size-4 text-primary" aria-hidden="true" />
                  Sở thích du lịch
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={<Link href="/account/rewards" />}
                  className="min-h-10 px-3 text-sm cursor-pointer"
                >
                  <Gift className="size-4 text-amber-500" aria-hidden="true" />
                  Voucher & Điểm thưởng
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={<Link href="/account/wallet" />}
                  className="min-h-10 px-3 text-sm cursor-pointer"
                >
                  <Wallet className="size-4 text-emerald-600" aria-hidden="true" />
                  Ví StayReco Wallet
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={<Link href="/account/security" />}
                  className="min-h-10 px-3 text-sm cursor-pointer"
                >
                  <Lock className="size-4 text-primary" aria-hidden="true" />
                  Mật khẩu & Bảo mật
                </DropdownMenuItem>

                {roleChannel && RoleChannelIcon && user && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="px-3 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Kênh hệ thống
                      </DropdownMenuLabel>
                    </DropdownMenuGroup>
                    <DropdownMenuItem
                      render={<Link href={roleDashboardPaths[user.role]} />}
                      className={`min-h-10 cursor-pointer px-3 text-sm font-semibold ${roleChannel.className}`}
                    >
                      <RoleChannelIcon className="size-4" aria-hidden="true" />
                      {roleChannel.label}
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  className="min-h-10 px-3 text-sm cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href={authHref}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-xs sm:text-sm font-semibold text-primary-foreground transition-colors hover:bg-[#193b56] focus-visible:outline-none shadow-xs"
            >
              Đăng ký / Đăng nhập
            </Link>
          )}
        </div>

        {isAuthenticated && (
          <Link
            href="/account/profile"
            className="ml-auto inline-flex size-11 items-center justify-center rounded-full focus-visible:outline-none lg:hidden"
            aria-label="Hồ sơ cá nhân"
          >
            <Avatar className="size-10">
              {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
              <AvatarFallback className="bg-accent text-xs font-semibold text-primary">
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
          </Link>
        )}
        <button
          type="button"
          className={`${isAuthenticated ? '' : 'ml-auto'} inline-flex size-11 items-center justify-center rounded-lg text-primary hover:bg-accent focus-visible:outline-none lg:hidden`}
          aria-label={isMenuOpen ? 'Đóng menu' : 'Mở menu'}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? (
            <X className="size-6" aria-hidden="true" />
          ) : (
            <Menu className="size-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {isMenuOpen && (
        <div
          id="mobile-navigation"
          className="border-t border-border bg-white px-4 py-3 lg:hidden"
        >
          <nav
            className="mx-auto grid max-w-[100rem] gap-1"
            aria-label="Điều hướng trên di động"
          >
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isNavigationItemActive(pathname, item.href) ? 'page' : undefined}
                onClick={() => setIsMenuOpen(false)}
                className={`rounded-lg px-4 py-3 text-base font-medium transition-colors focus-visible:outline-none ${
                  isNavigationItemActive(pathname, item.href)
                    ? 'bg-accent text-primary'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-3">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border text-sm font-medium text-foreground">
                  <Globe2 className="size-4" aria-hidden="true" />{' '}
                  {languageLabel}
                  <ChevronDown
                    className="size-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="min-w-40 rounded-xl p-2 shadow-card"
                >
                  <DropdownMenuRadioGroup
                    value={language}
                    onValueChange={(value) => setLanguage(value as Language)}
                  >
                    <DropdownMenuRadioItem
                      value="vi"
                      closeOnClick
                      className="min-h-10 px-3 text-sm"
                    >
                      Tiếng Việt
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="en"
                      closeOnClick
                      className="min-h-10 px-3 text-sm"
                    >
                      English
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border text-sm font-medium text-foreground">
                  {currency}
                  <ChevronDown
                    className="size-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="min-w-32 rounded-xl p-2 shadow-card"
                >
                  <DropdownMenuRadioGroup
                    value={currency}
                    onValueChange={(value) => setCurrency(value as Currency)}
                  >
                    <DropdownMenuRadioItem
                      value="VND"
                      closeOnClick
                      className="min-h-10 px-3 text-sm"
                    >
                      VND (₫)
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="USD"
                      closeOnClick
                      className="min-h-10 px-3 text-sm"
                    >
                      USD ($)
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {isAuthenticated ? (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link
                  href="/account/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground focus-visible:outline-none"
                >
                  <UserRound className="size-4" aria-hidden="true" />
                  Hồ sơ cá nhân
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-danger/25 px-4 text-sm font-medium text-danger focus-visible:outline-none"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  Đăng xuất
                </button>
              </div>
            ) : (
              <Link
                href={authHref}
                onClick={() => setIsMenuOpen(false)}
                className="mt-2 inline-flex h-12 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground focus-visible:outline-none"
              >
                Đăng ký / Đăng nhập
              </Link>
            )}
          </nav>
        </div>
      )}

      {/* Global Floating AI Assistant Circular Button */}
      <FloatingAiButton />
    </header>
  );
}
