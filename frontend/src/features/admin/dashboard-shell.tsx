'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CreditCard,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';
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
import { useAuthStore } from '@/lib/auth-store';

const templateImage =
  'https://lh3.googleusercontent.com/aida/AEtjO1V-SCfN5vRag32eaaMCe725o3qjMzRhq78BRcuhKmOXxEDu4G8qm577peTkqU28fF62pdny08VmbaOwjGzlFo32VJpAA8SPA924onlWgQ2t92x5iGKeuhw1fCMiUdigsg6mge97P7ahRot5alw95ynt0-n2m7IucAr968MgN5mTjYAV6AnplZ0Xx-7f4H3KdFhb1vm9RS4hCaI81jJK3nFDIJCSwTS5926q0xHmfGl3sY60Y-Y_wuhSWwMDAhg2Nz8K1d9sN9cn';

const navigation = [
  { href: '/admin/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Người dùng & Phân quyền', icon: UsersRound },
  {
    href: '/admin/payment-settings',
    label: 'Cấu hình thanh toán',
    icon: CreditCard,
  },
  {
    href: '/admin/transactions',
    label: 'Nhật ký giao dịch',
    icon: ReceiptText,
  },
  { href: '/admin/logs', label: 'Nhật ký & Bảo mật', icon: ShieldCheck },
  {
    href: '/admin/ai-settings',
    label: 'Cấu hình AI toàn hệ thống',
    icon: Sparkles,
  },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.replace('/');
  };
  return (
    <div className="min-h-dvh bg-background font-(family-name:--font-body) text-foreground">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col justify-between bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] lg:flex">
        <div>
          <div className="flex h-16 items-center justify-between px-5">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center overflow-hidden rounded-lg bg-primary/5">
                <img
                  src={templateImage}
                  alt="StayReco Logo"
                  className="size-8 rounded-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight tracking-tight text-primary">
                  StayReco Admin
                </p>
                <p className="mt-0.5 text-[10px] leading-none text-muted-foreground">
                  Boutique Hospitality
                </p>
              </div>
            </div>
            <span className="rounded-full bg-[#234e70] px-2 py-0.5 text-[10px] font-semibold text-white">
              Super Admin
            </span>
          </div>
          <p className="px-6 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Hệ thống quản trị
          </p>
          <nav className="space-y-1 px-3" aria-label="Điều hướng quản trị">
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${(href === '/admin/users' || href === '/admin/transactions' ? pathname.startsWith(href) : pathname === href) ? 'bg-primary font-medium text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <Icon size={20} strokeWidth={1.75} />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mx-3 mb-4 rounded-xl bg-muted p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-medium text-success">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-success" />
              </span>{' '}
              Hệ thống ổn định
            </span>
            <strong className="text-[11px] text-success">99.98%</strong>
          </div>
          <div className="mt-3 flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <CircleHelp size={14} /> Trợ giúp & Tài liệu
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              v2.4
            </span>
          </div>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 bg-white/90 px-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-md md:px-8">
          <div className="flex min-w-0 items-center gap-6">
            <div className="hidden items-center gap-2 text-xs text-muted-foreground xl:flex">
              <span>StayReco</span>
              <ChevronRight size={14} className="text-muted-foreground" />
              <span>Quản trị hệ thống</span>
              <ChevronRight size={14} className="text-[#72777e]" />
              <span className="font-medium text-primary">Bảng điều khiển</span>
            </div>
            <label className="relative hidden lg:block">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                className="h-9 w-72 rounded-lg bg-muted py-0 pl-9 pr-14 text-xs outline-none ring-ring focus:ring-1"
                placeholder="Tìm kiếm mã đặt phòng, khách sạn, đối tác..."
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground shadow-sm">
                Ctrl K
              </kbd>
            </label>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <span className="hidden items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-success sm:inline-flex">
              <span className="size-1.5 rounded-full bg-success" />{' '}
              Production Live
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Thông báo"
              className="relative text-muted-foreground"
            >
              <Bell size={22} />
              <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                3
              </span>
            </Button>
            <div className="hidden h-6 w-px bg-border sm:block" />
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger className="flex items-center gap-3 rounded-lg px-1 py-1 text-left hover:bg-muted focus-visible:outline-none">
                <div className="relative">
                  <img src={templateImage} alt="Profile" className="size-8 rounded-full object-cover" />
                  <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-success ring-2 ring-card" />
                </div>
                <div className="hidden text-left md:block">
                  <p className="text-xs font-semibold leading-none">Trần Đình Quân <span className="ml-1.5 rounded bg-warning-soft px-1.5 py-0.5 text-[10px] font-medium text-warning">Admin</span></p>
                  <p className="mt-1 text-[11px] text-muted-foreground">admin@stayreco.vn</p>
                </div>
                <ChevronDown size={18} className="text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48 rounded-xl p-2 shadow-card">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="px-3 py-2 text-xs">Tài khoản quản trị</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="min-h-10 px-3 text-sm text-destructive focus:text-destructive">
                  <LogOut className="size-4" /> Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="min-h-[calc(100dvh-4rem)] bg-background px-4 pb-12 pt-8 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
