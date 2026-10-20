import { z } from 'zod';

/** "true" / "false" from .env (z.coerce.boolean would treat "false" as true). */
const booleanString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((v) => v === 'true');

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().min(1),
    CORS_ORIGINS: z
      .string()
      .default('')
      .transform((v) =>
        v
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean),
      ),
    WEB_APP_URL: z.url(),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
    /** Email verification code mailed after registration. */
    EMAIL_OTP_TTL_MINUTES: z.coerce.number().int().positive().default(10),
    EMAIL_OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
    /** Platform commission (%) given to newly registered partners. Business rule: 8–15%. */
    DEFAULT_COMMISSION_RATE: z.coerce.number().min(8).max(15),
    /** SMTP for real emails. Leave SMTP_HOST empty to print emails to the console instead (dev, tests). */
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    /** true for port 465 (implicit TLS); false for 587 (STARTTLS). */
    SMTP_SECURE: booleanString,
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    /** Sender shown to users, e.g. "StayReco <stayreco.noreply@gmail.com>". */
    MAIL_FROM: z.string().optional(),
    /** Cloudinary for hotel images and verification documents. Leave empty to disable uploads (they answer 503). */
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    /**
     * AES-256-GCM key for beneficiary account numbers (contract D12): 32 random bytes in base64. Never change it once
     * data exists, or stored numbers can no longer be read. Generate:
     * node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
     */
    BENEFICIARY_ENCRYPTION_KEY: z
      .string()
      .refine(
        (v) => Buffer.from(v, 'base64').length === 32,
        'must be 32 bytes encoded in base64',
      ),
  })
  .superRefine((env, ctx) => {
    if (env.CLOUDINARY_CLOUD_NAME) {
      for (const key of [
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET',
      ] as const) {
        if (!env[key]) {
          ctx.addIssue({
            code: 'custom',
            path: [key],
            message: `${key} is required when CLOUDINARY_CLOUD_NAME is set`,
          });
        }
      }
    }
    if (!env.SMTP_HOST) return;
    for (const key of ['SMTP_USER', 'SMTP_PASS', 'MAIL_FROM'] as const) {
      if (!env[key]) {
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: `${key} is required when SMTP_HOST is set`,
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `Invalid environment variables:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}
