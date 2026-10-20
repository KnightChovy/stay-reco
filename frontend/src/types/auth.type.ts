// Auth request/response types are defined once in packages/shared, matching the backend exactly.
import type {
  LoginInput,
  RegisterCustomerInput,
  RegisterPartnerInput,
  ResetPasswordInput,
  VerifyEmailInput,
  EmailInput,
  ChangePasswordInput,
  AcceptInvitationInput,
} from "@stayreco/shared";

export type {
  Account,
  AuthResult,
  RegisterResult,
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
export type VerifyEmailPayload = VerifyEmailInput;
export type ResendVerificationPayload = EmailInput;
export type ForgotPasswordPayload = EmailInput;
export type ChangePasswordPayload = ChangePasswordInput;
export type AcceptInvitationPayload = AcceptInvitationInput;

/** `data` of POST /auth/login and /auth/verify-email: `{ account, accessToken, expiresIn }`. */
export type AuthResponse = import("@stayreco/shared").AuthResult;

/** `data` of POST /auth/register/customer and /auth/register/partner: `{ account }`, no tokens. */
export type RegisterResponse = import("@stayreco/shared").RegisterResult;
