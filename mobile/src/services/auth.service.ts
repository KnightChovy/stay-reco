import type {
  Account,
  APIResponse,
  AuthResult,
  EmailInput,
  LoginInput,
  RegisterCustomerInput,
  RegisterResult,
  VerifyEmailInput,
} from "@stayreco/shared";
import { apiService } from "./ApiService";

export const login = async (payload: LoginInput): Promise<APIResponse<AuthResult>> => {
  const { data } = await apiService.post<APIResponse<AuthResult>>("/auth/login", payload);
  return data;
};

/** Tạo tài khoản PENDING_VERIFICATION và gửi mã 6 số qua email; chưa cấp token. */
export const registerCustomer = async (
  payload: RegisterCustomerInput,
): Promise<APIResponse<RegisterResult>> => {
  const { data } = await apiService.post<APIResponse<RegisterResult>>("/auth/register/customer", payload);
  return data;
};

/** Xác thực mã 6 số và đăng nhập luôn (kết quả giống login). */
export const verifyEmail = async (payload: VerifyEmailInput): Promise<APIResponse<AuthResult>> => {
  const { data } = await apiService.post<APIResponse<AuthResult>>("/auth/verify-email", payload);
  return data;
};

export const resendVerification = async (payload: EmailInput): Promise<void> => {
  await apiService.post("/auth/resend-verification", payload);
};

export const forgotPassword = async (payload: EmailInput): Promise<void> => {
  await apiService.post("/auth/forgot-password", payload);
};

export const getMe = async (): Promise<APIResponse<Account>> => {
  const { data } = await apiService.get<APIResponse<Account>>("/auth/me");
  return data;
};

export const logout = async (): Promise<void> => {
  await apiService.post("/auth/logout");
};
