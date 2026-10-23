'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Account, PartnerStatus } from '@stayreco/shared';
import * as authService from '@/services/auth.service';
import type { AxiosError } from 'axios';

export type UserRole = 'customer' | 'partner' | 'staff' | 'manager' | 'admin';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  emailVerified?: boolean;
  /** Hotel partners only; SUSPENDED partners can read but not create or change anything. */
  partnerStatus?: PartnerStatus;
};

type AuthResult =
  | { success: true; user: AuthUser }
  | { success: false; message: string; code?: string };

type RegisterResult =
  | { success: true; email: string }
  | { success: false; message: string; code?: string };

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (input: { name: string; email: string; password: string }) => Promise<RegisterResult>;
  verifyEmail: (input: { email: string; code: string }) => Promise<AuthResult>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  setAccessToken: (token: string | null) => void;
};

export const roleDashboardPaths: Record<UserRole, string> = {
  customer: '/account/profile',
  partner: '/partner/dashboard',
  staff: '/staff/dashboard',
  manager: '/manager/dashboard',
  admin: '/admin/dashboard',
};

const demoRoles = ['customer', 'partner', 'staff', 'manager', 'admin'] as const;

function getDemoCredentials(role: UserRole) {
  return { email: `${role}@gmail.com`, password: `${role}${123}`, role };
}

export const demoAccounts: ReadonlyArray<ReturnType<typeof getDemoCredentials>> =
  demoRoles.map(getDemoCredentials);

export function mapBackendRoleToFrontend(role: string): UserRole {
  switch (role) {
    case 'HOTEL_PARTNER':
      return 'partner';
    case 'HOTEL_STAFF':
      return 'staff';
    case 'PLATFORM_MANAGER':
      return 'manager';
    case 'ADMIN':
      return 'admin';
    case 'CUSTOMER':
    default:
      return 'customer';
  }
}

export function accountToAuthUser(account: Account): AuthUser {
  return {
    id: account.id,
    name: account.fullName,
    email: account.email,
    phone: account.phone ?? undefined,
    avatarUrl: account.avatarUrl ?? undefined,
    role: mapBackendRoleToFrontend(account.role),
    emailVerified: account.emailVerified,
    partnerStatus:
      account.profile && 'status' in account.profile ? account.profile.status : undefined,
  };
}

export function getSafeNextPath(next: string | null) {
  return next?.startsWith('/') && !next.startsWith('//') ? next : '/';
}

function setWindowAccessToken(token: string | null) {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { __STAYRECO_ACCESS_TOKEN__?: string };
  if (token) {
    w.__STAYRECO_ACCESS_TOKEN__ = token;
  } else {
    delete w.__STAYRECO_ACCESS_TOKEN__;
  }
}

function getErrorCode(error: unknown): string | undefined {
  return (error as AxiosError<{ code?: string }>).response?.data?.code;
}

function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ code?: string; message?: string }>;
  const code = axiosError.response?.data?.code;
  const message = axiosError.response?.data?.message;

  switch (code) {
    case 'AUTH_INVALID_CREDENTIALS':
      return 'Email hoặc mật khẩu không chính xác.';
    case 'AUTH_ACCOUNT_LOCKED':
      return 'Tài khoản tạm thời bị khóa do nhập sai nhiều lần. Vui lòng thử lại sau 15 phút.';
    case 'AUTH_ACCOUNT_SUSPENDED':
      return 'Tài khoản của bạn đã bị tạm ngưng hoạt động.';
    case 'AUTH_EMAIL_NOT_VERIFIED':
      return 'Email chưa được xác thực. Vui lòng nhập mã đã gửi tới hộp thư của bạn.';
    case 'AUTH_OTP_INVALID':
      return 'Mã xác thực không đúng. Vui lòng kiểm tra lại và thử lại.';
    case 'AUTH_OTP_EXPIRED':
      return 'Mã xác thực đã hết hạn hoặc đã nhập sai quá nhiều lần. Vui lòng gửi lại mã mới.';
    case 'AUTH_EMAIL_TAKEN':
      return 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.';
    case 'VALIDATION_ERROR':
      return message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
    case 'AUTH_TOKEN_INVALID':
      return 'Liên kết xác thực hoặc mã token không hợp lệ hoặc đã hết hạn.';
    default:
      return message || 'Đã có lỗi xảy ra. Vui lòng kiểm tra kết nối và thử lại.';
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      hasHydrated: false,

      hydrate: async () => {
        if (get().hasHydrated) return;

        try {
          const res = await authService.getMe();
          if (res.data) {
            const user = accountToAuthUser(res.data);
            set({ user, hasHydrated: true });
            return;
          }
        } catch {
          // Unauthenticated or offline
        }

        set({ hasHydrated: true });
      },

      login: async (email, password) => {
        try {
          const res = await authService.login({ email, password });
          const user = accountToAuthUser(res.data.account);
          const accessToken = res.data.accessToken;

          setWindowAccessToken(accessToken);
          set({ user, accessToken });
          return { success: true, user };
        } catch (err) {
          return {
            success: false,
            message: getErrorMessage(err),
            code: getErrorCode(err),
          };
        }
      },

      register: async ({ name, email, password }) => {
        try {
          const res = await authService.registerCustomer({
            fullName: name,
            email,
            password,
          });
          // No tokens yet: the account is PENDING_VERIFICATION until the emailed code is entered.
          return { success: true, email: res.data.account.email };
        } catch (err) {
          return {
            success: false,
            message: getErrorMessage(err),
            code: getErrorCode(err),
          };
        }
      },

      verifyEmail: async ({ email, code }) => {
        try {
          const res = await authService.verifyEmail({ email, code });
          const user = accountToAuthUser(res.data.account);
          const accessToken = res.data.accessToken;

          setWindowAccessToken(accessToken);
          set({ user, accessToken });
          return { success: true, user };
        } catch (err) {
          return {
            success: false,
            message: getErrorMessage(err),
            code: getErrorCode(err),
          };
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch {
          // Ignore
        }
        if (typeof window !== 'undefined') {
          delete (window as unknown as { __STAYRECO_ACCESS_TOKEN__?: string })
            .__STAYRECO_ACCESS_TOKEN__;
        }
        set({ user: null, accessToken: null });
      },

      setUser: (user) => set({ user }),
      setAccessToken: (accessToken) => {
        if (typeof window !== 'undefined') {
          if (accessToken) {
            (
              window as unknown as { __STAYRECO_ACCESS_TOKEN__?: string }
            ).__STAYRECO_ACCESS_TOKEN__ = accessToken;
          } else {
            delete (window as unknown as { __STAYRECO_ACCESS_TOKEN__?: string })
              .__STAYRECO_ACCESS_TOKEN__;
          }
        }
        set({ accessToken });
      },
    }),
    {
      name: 'stayreco-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }),
    },
  ),
);

// Global event listeners for token refresh and auth expiry
if (typeof window !== 'undefined') {
  window.addEventListener('stayreco:auth-expired', () => {
    useAuthStore.setState({ user: null, accessToken: null });
  });

  window.addEventListener('stayreco:token-refreshed', (e: Event) => {
    const customEvent = e as CustomEvent<{ token: string }>;
    if (customEvent.detail?.token) {
      useAuthStore.setState({ accessToken: customEvent.detail.token });
    }
  });
}
