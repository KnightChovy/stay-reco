'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { postLoginPath, type UserRole, useAuthStore } from '@/lib/auth-store';

const protectedRoutes: Array<{ prefix: string; role: UserRole }> = [
  { prefix: '/booking', role: 'customer' },
  { prefix: '/account', role: 'customer' },
  { prefix: '/partner', role: 'partner' },
  { prefix: '/staff', role: 'staff' },
  { prefix: '/manager', role: 'manager' },
  { prefix: '/admin', role: 'admin' },
];

/**
 * Pages only for someone signed out: a signed-in user is sent where signing in would have taken them. The links from
 * emails (`/reset-password`, `/accept-invitation`) stay open: they act on the account named in the link.
 */
const guestOnlyRoutes = ['/login', '/register', '/forgot-password', '/verify-email'];

const matches = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

export default function AuthRouteGuard({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const hydrate = useAuthStore((state) => state.hydrate);
  const requiredRoute = protectedRoutes.find(({ prefix }) => matches(pathname, prefix));
  const guestOnly = guestOnlyRoutes.some((prefix) => matches(pathname, prefix));

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hasHydrated || !guestOnly || !user) return;
    // Also the moment a sign-in or an email code succeeds here: the same destination the page itself sends them to.
    const next = new URLSearchParams(window.location.search).get('next');
    router.replace(postLoginPath(user.role, next));
  }, [guestOnly, hasHydrated, router, user]);

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

  // Nothing of the sign-in form flashes for someone already signed in.
  if (guestOnly && (!hasHydrated || user)) {
    return null;
  }

  return children;
}
