import { z } from 'zod';
import { Gender } from '../enums';
import { dateSchema, isCalendarDate } from './common';

export const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email());

export const passwordSchema = z
  .string()
  .min(8)
  .max(128)
  .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'password must contain at least one letter and one number')
  .meta({ description: 'At least one letter and one number' });

const fullNameSchema = z.string().trim().min(1).max(100);
const tokenSchema = z.string().min(1);

/** Phone of an account (`user_account.phone`, a partner's contact phone), e.g. 0901234567 or +84901234567. */
export const accountPhoneSchema = z
  .string()
  .trim()
  .regex(/^\+?\d{9,15}$/, 'phone must be a valid phone number');

export const registerCustomerSchema = z.strictObject({
  email: emailSchema,
  password: passwordSchema,
  fullName: fullNameSchema,
});
export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;

export const registerPartnerSchema = registerCustomerSchema.extend({
  companyName: z.string().trim().max(200).optional(),
  /** Contact phone of the partner. */
  phone: accountPhoneSchema,
});
export type RegisterPartnerInput = z.infer<typeof registerPartnerSchema>;

export const loginSchema = z.strictObject({
  email: emailSchema,
  password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.strictObject({
  /** Mobile sends it in the body; web uses the httpOnly cookie. */
  refreshToken: z.string().optional(),
});
export type RefreshInput = z.infer<typeof refreshSchema>;

export const tokenBodySchema = z.strictObject({ token: tokenSchema });
export type TokenInput = z.infer<typeof tokenBodySchema>;

export const emailBodySchema = z.strictObject({ email: emailSchema });
export type EmailInput = z.infer<typeof emailBodySchema>;

/** 6-digit code mailed after registration. */
export const otpCodeSchema = z.string().trim().regex(/^\d{6}$/, 'code must be 6 digits');

export const verifyEmailSchema = z.strictObject({
  email: emailSchema,
  code: otpCodeSchema,
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const resetPasswordSchema = z.strictObject({
  token: tokenSchema,
  newPassword: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z.strictObject({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const inviteAccountSchema = z.strictObject({
  email: emailSchema,
  fullName: fullNameSchema,
});
export type InviteAccountInput = z.infer<typeof inviteAccountSchema>;

export const inviteStaffSchema = inviteAccountSchema.extend({
  /** Hotel the staff member works at; must belong to the inviting partner. */
  hotelId: z.uuid(),
  position: z.string().trim().min(1).max(50),
});
export type InviteStaffInput = z.infer<typeof inviteStaffSchema>;

export const acceptInvitationSchema = z.strictObject({
  token: tokenSchema,
  password: passwordSchema,
});
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;

/** Earliest accepted date of birth. */
const MIN_DATE_OF_BIRTH = '1900-01-01';

/**
 * `PATCH /me/profile`. Every field is optional, at least one is required, and `null` clears a field.
 * `fullName` and `phone` are for every role; `companyName` only for HOTEL_PARTNER; `dateOfBirth`, `gender` and
 * `nationality` only for CUSTOMER. A field of another role returns VALIDATION_ERROR.
 */
export const updateProfileSchema = z
  .strictObject({
    fullName: fullNameSchema.optional(),
    /** A partner cannot clear it: it is also the partner's contact phone. */
    phone: accountPhoneSchema.nullable().optional(),
    /** Shown as the partner name. */
    companyName: z.string().trim().min(1).max(200).optional(),
    dateOfBirth: dateSchema
      .refine(
        (v) => !isCalendarDate(v) || (v >= MIN_DATE_OF_BIRTH && Date.parse(v) <= Date.now()),
        `dateOfBirth must be between ${MIN_DATE_OF_BIRTH} and today`,
      )
      .nullable()
      .optional(),
    gender: z.enum(Gender).nullable().optional(),
    nationality: z.string().trim().min(1).max(100).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'at least one field is required');
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
