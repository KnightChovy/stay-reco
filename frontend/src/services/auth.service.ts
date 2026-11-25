import { api } from "@/lib/axios";
import type { UpdateProfileInput } from "@stayreco/shared";
import type {
  Account,
  AcceptInvitationPayload,
  AuthResponse,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterCustomerPayload,
  RegisterPartnerPayload,
  RegisterResponse,
  ResendVerificationPayload,
  ResetPasswordPayload,
  SessionInfo,
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

/** Signs out every device of the account, this one included. */
export const logoutAll = async (): Promise<void> => {
  await api.post("/auth/logout-all");
};

/** Keeps this device signed in and signs out the others. Wrong current password: AUTH_WRONG_PASSWORD. */
export const changePassword = async (payload: ChangePasswordPayload): Promise<void> => {
  await api.post("/auth/change-password", payload);
};

/** The devices where the account is signed in; `current` marks this one. */
export const getSessions = async (): Promise<SessionInfo[]> => {
  const { data } = await api.get<APIResponse<SessionInfo[]>>("/auth/sessions");
  return data.data;
};

/** Signs out one device. */
export const revokeSession = async (sessionId: string): Promise<void> => {
  await api.delete(`/auth/sessions/${sessionId}`);
};

/** An invited staff member (or platform manager) sets a password and is signed in (same result as login). */
export const acceptInvitation = async (
  payload: AcceptInvitationPayload,
): Promise<APIResponse<AuthResponse>> => {
  const { data } = await api.post<APIResponse<AuthResponse>>("/auth/invitations/accept", payload);
  return data;
};

// ── My profile (every role) ─────────────────────────────────

/** Send only the fields to change; `null` clears one. Returns the updated account. */
export const updateProfile = async (payload: UpdateProfileInput): Promise<Account> => {
  const { data } = await api.patch<APIResponse<Account>>("/me/profile", payload);
  return data.data;
};

/** Replaces the avatar (JPG/PNG/WebP). Returns the updated account with the new `avatarUrl`. */
export const uploadAvatar = async (file: File): Promise<Account> => {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<APIResponse<Account>>("/me/avatar", form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60_000,
  });
  return data.data;
};

/** `avatarUrl` becomes null. */
export const removeAvatar = async (): Promise<void> => {
  await api.delete("/me/avatar");
};
