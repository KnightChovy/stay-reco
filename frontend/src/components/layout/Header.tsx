'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, Globe2, LogOut, Menu, UserRound, X } from 'lucide-react';
import { useState } from 'react';

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
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar';

const navigation = [
  { href: '/', label: 'Khám phá', active: true },
  { href: '/recommendations', label: 'Gợi ý cho bạn' },
  { href: '/blog', label: 'Blog' },
  { href: '/support', label: 'Hỗ trợ' },
];

type HeaderProps = {
  isAuthenticated?: boolean;
  user?: {
    name?: string;
    avatarUrl?: string;
  };
  onLogout?: () => void;
};

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

export default function Header({
  isAuthenticated = false,
  user,
  onLogout,
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('vi');
  const [currency, setCurrency] = useState<Currency>('VND');

  const languageLabel = language === 'vi' ? 'VI' : 'ENG';
  const userName = user?.name ?? 'Khách hàng StayReco';

  return (
    <header className="relative z-40 border-b border-border bg-white">
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
              aria-current={item.active ? 'page' : undefined}
              className={`relative py-6 text-base font-medium leading-6 transition-colors hover:text-primary focus-visible:outline-none ${
                item.active
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
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-white px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none"
              aria-label={`Chọn ngôn ngữ, hiện tại là ${language === 'vi' ? 'Tiếng Việt' : 'English'}`}
            >
              <Globe2
                className="size-5 text-muted-foreground"
                strokeWidth={2}
                aria-hidden="true"
              />
              {languageLabel}
              <ChevronDown
                className="size-4 text-muted-foreground"
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
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none"
              aria-label={`Chọn đơn vị tiền tệ, hiện tại là ${currency}`}
            >
              {currency}
              <ChevronDown
                className="size-4 text-muted-foreground"
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
                className="inline-flex size-14 items-center justify-center rounded-full focus-visible:outline-none"
                aria-label={`Mở menu tài khoản của ${userName}`}
              >
                <Avatar size="lg" className="size-12">
                  {user?.avatarUrl && (
                    <AvatarImage src={user.avatarUrl} alt="" />
                  )}
                  <AvatarFallback className="bg-accent text-sm font-semibold text-primary">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-52 rounded-xl p-2 shadow-card"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="px-3 py-2 text-sm font-medium text-foreground">
                    {userName}
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  render={<Link href="/profile" />}
                  className="min-h-10 px-3 text-sm"
                >
                  <UserRound className="size-4" aria-hidden="true" />
                  Hồ sơ cá nhân
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  className="min-h-10 px-3 text-sm"
                  onClick={() => onLogout?.()}
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-16 items-center justify-center rounded-xl bg-primary px-6 text-lg font-semibold text-primary-foreground transition-colors hover:bg-[#193b56] focus-visible:outline-none"
            >
              Đăng ký / Đăng nhập
            </Link>
          )}
        </div>

        {isAuthenticated && (
          <Link
            href="/profile"
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
                aria-current={item.active ? 'page' : undefined}
                onClick={() => setIsMenuOpen(false)}
                className={`rounded-lg px-4 py-3 text-base font-medium transition-colors focus-visible:outline-none ${
                  item.active
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
                  href="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground focus-visible:outline-none"
                >
                  <UserRound className="size-4" aria-hidden="true" />
                  Hồ sơ cá nhân
                </Link>
                <button
                  type="button"
                  onClick={() => onLogout?.()}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-danger/25 px-4 text-sm font-medium text-danger focus-visible:outline-none"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  Đăng xuất
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="mt-2 inline-flex h-12 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground focus-visible:outline-none"
              >
                Đăng ký / Đăng nhập
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
