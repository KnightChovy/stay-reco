import { create } from 'zustand';
import type { AxiosError } from 'axios';
import type { Account, AuthResult } from '@stayreco/shared';
import { clearSession, loadRefreshToken, persistRefreshToken, refreshSession, session } from '@/services/ApiService';
import * as authService from '@/services/auth.service';

type Result<T = object> = ({ success: true } & T) | { success: false; message: string; code?: string };

type AuthState = {
  account: Account | null;
  /** Đang khôi phục phiên đã ghi nhớ; các màn cần đăng nhập hiện loading thay vì mời đăng nhập. */
  hydrating: boolean;
  /** Khôi phục phiên đã ghi nhớ khi mở app. */
  hydrate: () => Promise<void>;
  login: (email: string, password: string, remember: boolean) => Promise<Result>;
  register: (input: { fullName: string; email: string; password: string }) => Promise<Result<{ email: string }>>;
  verifyEmail: (email: string, code: string) => Promise<Result>;
  resendVerification: (email: string) => Promise<Result>;
  forgotPassword: (email: string) => Promise<Result>;
  logout: () => Promise<void>;
};

// Cùng thông báo lỗi với frontend/src/stores/auth.store.ts.
function getErrorMessage(error: unknown): string {
  const data = (error as AxiosError<{ code?: string; message?: string }>).response?.data;
  switch (data?.code) {
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
      return data.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
    default:
      return data?.message || 'Đã có lỗi xảy ra. Vui lòng kiểm tra kết nối và thử lại.';
  }
}

function fail(error: unknown) {
  return {
    success: false as const,
    message: getErrorMessage(error),
    code: (error as AxiosError<{ code?: string }>).response?.data?.code,
  };
}

export const useAuthStore = create<AuthState>()((set) => {
  const signIn = ({ account, accessToken, refreshToken }: AuthResult, remember: boolean) => {
    session.accessToken = accessToken;
    session.refreshToken = refreshToken ?? null;
    session.remember = remember;
    void persistRefreshToken(remember ? session.refreshToken : null);
    set({ account });
  };

  session.onExpired = () => set({ account: null });

  return {
    account: null,
    hydrating: false,

    hydrate: async () => {
      const refreshToken = await loadRefreshToken();
      if (!refreshToken) return;
      session.refreshToken = refreshToken;
      session.remember = true;
      set({ hydrating: true });
      try {
        await refreshSession();
        set({ account: (await authService.getMe()).data });
      } catch {
        // Token bị từ chối thì refreshSession đã xóa phiên; mất mạng thì giữ token để lần sau thử lại.
      } finally {
        set({ hydrating: false });
      }
    },

    login: async (email, password, remember) => {
      try {
        signIn((await authService.login({ email, password })).data, remember);
        return { success: true };
      } catch (err) {
        return fail(err);
      }
    },

    register: async (input) => {
      try {
        const res = await authService.registerCustomer(input);
        return { success: true, email: res.data.account.email };
      } catch (err) {
        return fail(err);
      }
    },

    verifyEmail: async (email, code) => {
      try {
        // Vừa đăng ký xong thì ghi nhớ luôn để khỏi đăng nhập lại.
        signIn((await authService.verifyEmail({ email, code })).data, true);
        return { success: true };
      } catch (err) {
        return fail(err);
      }
    },

    resendVerification: async (email) => {
      try {
        await authService.resendVerification({ email });
        return { success: true };
      } catch (err) {
        return fail(err);
      }
    },

    forgotPassword: async (email) => {
      try {
        await authService.forgotPassword({ email });
        return { success: true };
      } catch (err) {
        return fail(err);
      }
    },

    logout: async () => {
      try {
        await authService.logout();
      } catch {
        // Vẫn xóa phiên ở máy dù server lỗi.
      }
      clearSession();
      set({ account: null });
    },
  };
});
