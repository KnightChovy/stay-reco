import { api } from "@/lib/axios";
import type {
  Account,
  AuthResponse,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterCustomerPayload,
  RegisterPartnerPayload,
  RegisterResponse,
  ResendVerificationPayload,
  ResetPasswordPayload,
  VerifyEmailPayload,
} from "@/types/auth.type";
import type { APIResponse } from "@/types/response.type";

export const login = async (
  payload: LoginPayload,
): Promise<APIResponse<AuthResponse>> => {
  const { data } = await api.post<APIResponse<AuthResponse>>(
    "/auth/login",
    payload,
  );
  return data;
};

/** Creates a PENDING_VERIFICATION account and mails a 6-digit code; no tokens are issued. */
export const registerCustomer = async (
  payload: RegisterCustomerPayload,
): Promise<APIResponse<RegisterResponse>> => {
  const { data } = await api.post<APIResponse<RegisterResponse>>(
    "/auth/register/customer",
    payload,
  );
  return data;
};

export const registerPartner = async (
  payload: RegisterPartnerPayload,
): Promise<APIResponse<RegisterResponse>> => {
  const { data } = await api.post<APIResponse<RegisterResponse>>(
    "/auth/register/partner",
    payload,
  );
  return data;
};

/** Verifies the 6-digit code and signs the account in (returns the same result as login). */
export const verifyEmail = async (
  payload: VerifyEmailPayload,
): Promise<APIResponse<AuthResponse>> => {
  const { data } = await api.post<APIResponse<AuthResponse>>(
    "/auth/verify-email",
    payload,
  );
  return data;
};

export const resendVerification = async (
  payload: ResendVerificationPayload,
): Promise<void> => {
  await api.post("/auth/resend-verification", payload);
};

export const forgotPassword = async (
  payload: ForgotPasswordPayload,
): Promise<void> => {
  await api.post("/auth/forgot-password", payload);
};

export const resetPassword = async (
  payload: ResetPasswordPayload,
): Promise<void> => {
  await api.post("/auth/reset-password", payload);
};

export const getMe = async (): Promise<APIResponse<Account>> => {
  const { data } = await api.get<APIResponse<Account>>("/auth/me");
  return data;
};

export const logout = async (): Promise<void> => {
  await api.post("/auth/logout");
};
