'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type UserRole = 'customer' | 'partner' | 'staff' | 'manager' | 'admin';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
};

type MockAccount = AuthUser & { password: string };

type AuthResult =
  | { success: true; user: AuthUser }
  | { success: false; message: string };

type AuthState = {
  user: AuthUser | null;
  users: MockAccount[];
  hasHydrated: boolean;
  hydrate: () => void;
  login: (email: string, password: string) => AuthResult;
  register: (input: Omit<MockAccount, 'id' | 'role'>) => AuthResult;
  logout: () => void;
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

export const demoAccounts: ReadonlyArray<Pick<MockAccount, 'email' | 'password' | 'role'>> =
  demoRoles.map(getDemoCredentials);

const demoProfiles: Record<UserRole, Omit<MockAccount, 'email' | 'password' | 'role'>> = {
  customer: { id: 'customer-1', name: 'Nguyễn Minh Anh', phone: '0901234567' },
  partner: { id: 'partner-1', name: 'Nguyễn Hoàng Nam' },
  staff: { id: 'staff-1', name: 'Lê Thảo Vy' },
  manager: { id: 'manager-1', name: 'Trần Đình Quân' },
  admin: { id: 'admin-1', name: 'Phạm Gia Huy' },
};

const initialUsers: MockAccount[] = demoAccounts.map((account) => ({
  ...demoProfiles[account.role],
  ...account,
}));

function toAuthUser(account: MockAccount): AuthUser {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    phone: account.phone,
    avatarUrl: account.avatarUrl,
    role: account.role,
  };
}

export function getSafeNextPath(next: string | null) {
  return next?.startsWith('/') && !next.startsWith('//') ? next : '/';
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      users: initialUsers,
      hasHydrated: false,
      hydrate: () => set({ hasHydrated: true }),
      login: (email, password) => {
        const account = [...initialUsers, ...get().users].find(
          (item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password,
        );

        if (!account) {
          return { success: false, message: 'Email hoặc mật khẩu chưa đúng.' };
        }

        const user = toAuthUser(account);
        set({ user });
        return { success: true, user };
      },
      register: ({ name, email, phone, password }) => {
        const normalizedEmail = email.trim().toLowerCase();
        if (get().users.some((item) => item.email.toLowerCase() === normalizedEmail)) {
          return { success: false, message: 'Email này đã được đăng ký.' };
        }

        const account: MockAccount = {
          id: `customer-${Date.now()}`,
          name: name.trim(),
          email: normalizedEmail,
          phone: phone?.trim(),
          password,
          role: 'customer',
        };
        const user = toAuthUser(account);
        set((state) => ({ users: [...state.users, account], user }));
        return { success: true, user };
      },
      logout: () => set({ user: null }),
    }),
    {
      name: 'stayreco-mock-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, users: state.users }),
    },
  ),
);
