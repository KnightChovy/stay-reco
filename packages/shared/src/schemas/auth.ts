import { z } from 'zod';

export const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email());

export const passwordSchema = z
  .string()
  .min(8)
  .max(128)
  .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'password must contain at least one letter and one number')
  .meta({ description: 'At least one letter and one number' });

const fullNameSchema = z.string().trim().min(1).max(100);
const tokenSchema = z.string().min(1);

export const registerCustomerSchema = z.strictObject({
  email: emailSchema,
  password: passwordSchema,
  fullName: fullNameSchema,
});
export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;

export const registerPartnerSchema = registerCustomerSchema.extend({
  companyName: z.string().trim().max(200).optional(),
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

export const acceptInvitationSchema = z.strictObject({
  token: tokenSchema,
  password: passwordSchema,
});
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
