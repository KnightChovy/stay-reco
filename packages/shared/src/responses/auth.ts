import type { AccountStatus, PartnerStatus, Role } from '../enums';

/**
 * Content of `data` returned by the auth endpoints (the envelope is `APIResponse<T>`).
 * Dates are ISO 8601 strings in UTC, e.g. "2026-10-14T03:00:00.000Z".
 */

/** `profile` of a HOTEL_PARTNER account. */
export interface PartnerProfile {
  partnerName: string;
  status: PartnerStatus;
}

/** `profile` of a HOTEL_STAFF account; a staff member works at exactly one hotel. */
export interface StaffProfile {
  hotelId: string;
  position: string;
}

/** The signed-in account (`GET /auth/me`, and inside every `AuthResult`). */
export interface Account {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: Role;
  status: AccountStatus;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  /** Role-specific data; null for CUSTOMER, ADMIN and PLATFORM_MANAGER. */
  profile: PartnerProfile | StaffProfile | null;
}

/**
 * Returned by login, register/customer, register/partner and invitations/accept.
 * `refreshToken` is only in the body for mobile; web (`X-Client-Type: web`) gets it as an httpOnly cookie.
 */
export interface AuthResult {
  account: Account;
  accessToken: string;
  /** Seconds until the access token expires. */
  expiresIn: number;
  refreshToken?: string;
}

/** Returned by `POST /auth/refresh`. `refreshToken` is only in the body for mobile. */
export interface RefreshResult {
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
}

/** One item of `GET /auth/sessions`: a device where the account is signed in. */
export interface SessionInfo {
  id: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  /** True for the session that made this request. */
  current: boolean;
}

/** Returned by `POST /auth/invitations/staff` and `/auth/invitations/platform-manager`. */
export interface InvitationResult {
  id: string;
  email: string;
  status: AccountStatus;
}
