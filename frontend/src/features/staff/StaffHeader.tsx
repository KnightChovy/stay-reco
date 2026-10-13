'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, Bell, HelpCircle, Sparkles, Building2, LogOut } from 'lucide-react';
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

export default function StaffHeader() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <header className="fixed top-0 left-[248px] right-0 h-16 bg-white/95 backdrop-blur-md z-40 border-b border-border shadow-2xs flex items-center justify-between px-6 font-sans antialiased">
      {/* Left branding & operational context */}
      <div className="flex items-center gap-4 min-w-0">
        <Link href="/staff/dashboard" className="flex items-center gap-3 shrink-0">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm tracking-wider shadow-2xs">
            SR
          </div>
          <span className="font-bold text-base text-primary tracking-tight">StayReco Staff</span>
        </Link>
        <div className="h-4 w-px bg-border hidden sm:block" />
        <div className="hidden sm:flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-foreground truncate">An Nhiên Riverside Hotel</span>
          <span className="text-[11px] text-muted-foreground shrink-0">•</span>
          <span className="text-xs text-muted-foreground shrink-0">4-Star Boutique</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-full shrink-0 ml-1 border border-emerald-200">
            <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Ca sáng (06:00 - 14:00)
          </span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        <div className="relative hidden md:flex items-center">
          <Search className="size-4 text-muted-foreground absolute left-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm đặt phòng..."
            className="h-9 w-64 pl-9 pr-14 text-xs bg-slate-100 text-foreground placeholder:text-muted-foreground rounded-lg border border-transparent focus:border-border focus:bg-white focus:outline-none transition-all font-medium"
          />
          <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-white rounded shadow-2xs border border-border">
            Ctrl+K
          </kbd>
        </div>

        <button
          type="button"
          aria-label="Thông báo"
          className="relative size-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-slate-100 hover:text-foreground transition-colors"
        >
          <Bell className="size-5" />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <button
          type="button"
          aria-label="Trợ giúp"
          className="size-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-slate-100 hover:text-foreground transition-colors"
        >
          <HelpCircle className="size-5" />
        </button>

        <div className="h-5 w-px bg-border mx-1" />

        {/* Staff User Menu */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger className="flex items-center gap-2.5 pl-1 focus:outline-none cursor-pointer">
            <div className="relative">
              <Image
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80"
                alt="Nguyễn Hương Ly"
                width={32}
                height={32}
                className="size-8 rounded-full object-cover ring-1 ring-border shadow-2xs"
              />
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-xs font-semibold text-foreground leading-tight">Nguyễn Hương Ly</div>
              <div className="text-[11px] text-muted-foreground font-medium">Trưởng ca Lễ tân</div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48 rounded-xl p-2 shadow-md">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-3 py-1.5 text-xs font-bold text-foreground">
                Nguyễn Hương Ly (Ca sáng)
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/staff/dashboard" />} className="min-h-9 px-3 text-xs font-semibold">
              <Sparkles className="size-4 text-primary" /> Tổng quan ca làm
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/partner/dashboard" />} className="min-h-9 px-3 text-xs font-semibold">
              <Building2 className="size-4 text-blue-600" /> Chuyển sang Portal Partner
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="min-h-9 px-3 text-xs font-semibold text-red-600 focus:text-red-600">
              <LogOut className="size-4" /> Đăng xuất ca trực
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
