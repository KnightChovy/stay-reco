// Auth request/response types are defined once in packages/shared, matching the backend exactly.
import type { AuthResult, LoginInput } from "@stayreco/shared";

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

/** `data` of POST /auth/login: `{ account, accessToken, expiresIn }` (+ `refreshToken` on mobile). */
export type AuthResponse = AuthResult;
