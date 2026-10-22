import { z } from 'zod';
import { AccountStatus, PartnerStatus, Role } from '../enums';
import { isoDateTime, responseSchemas } from './registry';

/**
 * Content of `data` returned by the auth endpoints (the envelope is `APIResponse<T>`).
 * Dates are ISO 8601 strings in UTC, e.g. "2026-10-14T03:00:00.000Z".
 */

export const partnerProfileResponseSchema = z
  .object({
    partnerName: z.string(),
    status: z.enum(PartnerStatus),
  })
  .register(responseSchemas, {
    id: 'PartnerProfile',
    description: '`profile` of a HOTEL_PARTNER account.',
  });
export type PartnerProfile = z.infer<typeof partnerProfileResponseSchema>;

export const staffProfileResponseSchema = z
  .object({
    hotelId: z.uuid(),
    position: z.string(),
  })
  .register(responseSchemas, {
    id: 'StaffProfile',
    description: '`profile` of a HOTEL_STAFF account; a staff member works at exactly one hotel.',
  });
export type StaffProfile = z.infer<typeof staffProfileResponseSchema>;

export const accountResponseSchema = z
  .object({
    id: z.uuid(),
    email: z.email(),
    fullName: z.string(),
    phone: z.string().nullable(),
    avatarUrl: z.string().nullable(),
    role: z.enum(Role),
    status: z.enum(AccountStatus),
    emailVerified: z.boolean(),
    emailVerifiedAt: isoDateTime().nullable(),
    lastLoginAt: isoDateTime().nullable(),
    createdAt: isoDateTime(),
    profile: z
      .union([partnerProfileResponseSchema, staffProfileResponseSchema])
      .nullable()
      .describe('Role-specific data; null for CUSTOMER, ADMIN and PLATFORM_MANAGER.'),
  })
  .register(responseSchemas, {
    id: 'Account',
    description: 'The signed-in account (`GET /auth/me`, and inside every `AuthResult`).',
  });
export type Account = z.infer<typeof accountResponseSchema>;

export const registerResultResponseSchema = z
  .object({ account: accountResponseSchema })
  .register(responseSchemas, {
    id: 'RegisterResult',
    description:
      'The account is PENDING_VERIFICATION and no tokens are issued; the client shows the OTP screen and calls `POST /auth/verify-email`.',
  });
export type RegisterResult = z.infer<typeof registerResultResponseSchema>;

const refreshTokenField = z
  .string()
  .optional()
  .describe('Mobile only. Web (`X-Client-Type: web`) gets it as an httpOnly cookie instead.');

export const authResultResponseSchema = z
  .object({
    account: accountResponseSchema,
    accessToken: z.string(),
    expiresIn: z.number().int().describe('Seconds until the access token expires.'),
    refreshToken: refreshTokenField,
  })
  .register(responseSchemas, {
    id: 'AuthResult',
    description: 'Returned by login, verify-email and invitations/accept.',
  });
export type AuthResult = z.infer<typeof authResultResponseSchema>;

export const refreshResultResponseSchema = z
  .object({
    accessToken: z.string(),
    expiresIn: z.number().int().describe('Seconds until the access token expires.'),
    refreshToken: refreshTokenField,
  })
  .register(responseSchemas, { id: 'RefreshResult' });
export type RefreshResult = z.infer<typeof refreshResultResponseSchema>;

export const sessionInfoResponseSchema = z
  .object({
    id: z.uuid(),
    ip: z.string().nullable(),
    userAgent: z.string().nullable(),
    createdAt: isoDateTime(),
    lastUsedAt: isoDateTime(),
    expiresAt: isoDateTime(),
    current: z.boolean().describe('True for the session that made this request.'),
  })
  .register(responseSchemas, {
    id: 'SessionInfo',
    description: 'A device where the account is signed in.',
  });
export type SessionInfo = z.infer<typeof sessionInfoResponseSchema>;

export const invitationResultResponseSchema = z
  .object({
    id: z.uuid(),
    email: z.email(),
    status: z.enum(AccountStatus),
  })
  .register(responseSchemas, { id: 'InvitationResult' });
export type InvitationResult = z.infer<typeof invitationResultResponseSchema>;
