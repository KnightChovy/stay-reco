'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { type UserRole, useAuthStore } from '@/lib/auth-store';

const protectedRoutes: Array<{ prefix: string; role: UserRole }> = [
  { prefix: '/booking', role: 'customer' },
  { prefix: '/account', role: 'customer' },
  { prefix: '/partner', role: 'partner' },
  { prefix: '/staff', role: 'staff' },
  { prefix: '/manager', role: 'manager' },
  { prefix: '/admin', role: 'admin' },
];

export default function AuthRouteGuard({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const hydrate = useAuthStore((state) => state.hydrate);
  const requiredRoute = protectedRoutes.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hasHydrated || !requiredRoute) return;

    if (!user) {
      // Keep the query string: /booking?roomTypeId=… must survive the login round-trip.
      const search = typeof window === "undefined" ? "" : window.location.search;
      router.replace(`/login?next=${encodeURIComponent(`${pathname}${search}`)}`);
      return;
    }

    if (user.role !== requiredRoute.role) {
      router.replace('/403');
    }
  }, [hasHydrated, pathname, requiredRoute, router, user]);

  if (requiredRoute && (!hasHydrated || user?.role !== requiredRoute.role)) {
    return null;
  }

  return children;
}
