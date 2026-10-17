// Auth request/response types are defined once in packages/shared, matching the backend exactly.
import type {
  LoginInput,
  RegisterCustomerInput,
  RegisterPartnerInput,
  ResetPasswordInput,
  TokenInput,
  EmailInput,
  ChangePasswordInput,
  AcceptInvitationInput,
} from "@stayreco/shared";

export type {
  Account,
  AuthResult,
  InvitationResult,
  PartnerProfile,
  RefreshResult,
  SessionInfo,
  StaffProfile,
} from "@stayreco/shared";

export type LoginPayload = LoginInput;
export type RegisterCustomerPayload = RegisterCustomerInput;
export type RegisterPartnerPayload = RegisterPartnerInput;
export type ResetPasswordPayload = ResetPasswordInput;
export type VerifyEmailPayload = TokenInput;
export type ResendVerificationPayload = EmailInput;
export type ForgotPasswordPayload = EmailInput;
export type ChangePasswordPayload = ChangePasswordInput;
export type AcceptInvitationPayload = AcceptInvitationInput;

/** `data` of POST /auth/login: `{ account, accessToken, expiresIn }` (+ `refreshToken` on mobile). */
export type AuthResponse = import("@stayreco/shared").AuthResult;
