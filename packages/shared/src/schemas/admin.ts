import { z } from 'zod';
import { AccountStatus, PaymentMethod, PaymentStatus, Role } from '../enums';
import { dateSchema, daysBetween, hasAtMost2Decimals, isCalendarDate, listQuerySchema, repeatedQuery } from './common';

/** Queries and bodies of the admin endpoints (docs/api/admin.md, decisions M8–M10). */

export const ADMIN_USER_SORTS = ['created-desc', 'created-asc', 'name-asc'] as const;

/** `GET /admin/users`: `search` matches the name or the email; `role` and `status` may be repeated. */
export const adminUserListQuerySchema = listQuerySchema.extend({
  role: repeatedQuery(z.enum(Role)).optional(),
  status: repeatedQuery(z.enum(AccountStatus)).optional(),
  sort: z.enum(ADMIN_USER_SORTS).default('created-desc'),
});
export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>;

/** Lock, unlock, reinstate, approve or reject: always with a reason, written to the audit log and emailed. */
export const adminReasonSchema = z.strictObject({
  reason: z.string().trim().min(1).max(500),
});
export type AdminReasonInput = z.infer<typeof adminReasonSchema>;

/** BR-13: 8–15 %, applied to bookings made afterwards. */
export const COMMISSION_RATE_LIMITS = { min: 8, max: 15 } as const;

export const commissionRateSchema = z.strictObject({
  rate: z
    .number()
    .min(COMMISSION_RATE_LIMITS.min)
    .max(COMMISSION_RATE_LIMITS.max)
    .refine(hasAtMost2Decimals, 'at most 2 decimal places'),
});
export type CommissionRateInput = z.infer<typeof commissionRateSchema>;

/** `GET /admin/suspension-requests`: `PENDING` by default, oldest first; decided ones newest first. */
export const suspensionRequestListQuerySchema = listQuerySchema.omit({ sort: true, search: true }).extend({
  status: repeatedQuery(z.enum(['PENDING', 'APPROVED', 'REJECTED'])).optional(),
});
export type SuspensionRequestListQuery = z.infer<typeof suspensionRequestListQuerySchema>;

// ── System logs ─────────────────────────────────────────────

export const AUDIT_SEVERITIES = ['INFO', 'WARNING', 'CRITICAL'] as const;
export type AuditSeverity = (typeof AUDIT_SEVERITIES)[number];

/** Severity of an audit action (UC80): derived, not stored. Every action not listed is `INFO`. */
export const AUDIT_SEVERITY: Record<string, Exclude<AuditSeverity, 'INFO'>> = {
  REFRESH_TOKEN_REUSE: 'CRITICAL',
  ACCOUNT_SUSPENDED: 'CRITICAL',
  SUSPENSION_APPROVED: 'CRITICAL',
  LOGIN_FAILED: 'WARNING',
  ACCOUNT_LOCKED: 'WARNING',
  SEPAY_TRANSFER_UNMATCHED: 'WARNING',
  SEPAY_TRANSFER_LATE: 'WARNING',
  REFUND_REJECTED: 'WARNING',
  PAYOUT_REJECTED: 'WARNING',
  PAYOUT_ACCOUNT_VIEWED: 'WARNING',
  VERIFICATION_REJECTED: 'WARNING',
  SUSPENSION_REQUESTED: 'WARNING',
};

export const auditSeverityOf = (action: string): AuditSeverity => AUDIT_SEVERITY[action] ?? 'INFO';

/** The actions of a severity, for filtering in SQL. `INFO` is every action not in the list. */
export const auditActionsOf = (severity: Exclude<AuditSeverity, 'INFO'>) =>
  Object.entries(AUDIT_SEVERITY)
    .filter(([, s]) => s === severity)
    .map(([action]) => action);

/** Days the log covers by default, and at most. */
export const AUDIT_LOG_LIMITS = { defaultDays: 7, maxDays: 92 } as const;

/**
 * `GET /admin/audit-logs`: newest first. `from` / `to` together or neither (the last 7 days), at most 92 days;
 * `action`, `severity` and `role` may be repeated; `actorId` is the account that acted.
 */
export const auditLogListQuerySchema = listQuerySchema
  .omit({ sort: true, search: true })
  .extend({
    from: dateSchema.optional(),
    to: dateSchema.optional(),
    actorId: z.uuid().optional(),
    role: repeatedQuery(z.enum(Role)).optional(),
    action: repeatedQuery(z.string().trim().min(1).max(100)).optional(),
    severity: repeatedQuery(z.enum(AUDIT_SEVERITIES)).optional(),
    entityType: z.string().trim().min(1).max(100).optional(),
    entityId: z.uuid().optional(),
  })
  .superRefine((v, ctx) => {
    if ((v.from === undefined) !== (v.to === undefined)) {
      ctx.addIssue({ code: 'custom', path: ['to'], message: 'from and to must be sent together' });
      return;
    }
    if (!isCalendarDate(v.from) || !isCalendarDate(v.to)) return;
    if (v.to < v.from) {
      ctx.addIssue({ code: 'custom', path: ['to'], message: 'to must not be before from' });
    } else if (daysBetween(v.from, v.to) + 1 > AUDIT_LOG_LIMITS.maxDays) {
      ctx.addIssue({ code: 'custom', path: ['to'], message: `at most ${AUDIT_LOG_LIMITS.maxDays} days` });
    }
  });
export type AuditLogListQuery = z.infer<typeof auditLogListQuerySchema>;

// ── Transactions and payment settings ───────────────────────

const periodRange = (v: { from?: string; to?: string }, ctx: z.RefinementCtx) => {
  if ((v.from === undefined) !== (v.to === undefined)) {
    ctx.addIssue({ code: 'custom', path: ['to'], message: 'from and to must be sent together' });
    return;
  }
  if (!isCalendarDate(v.from) || !isCalendarDate(v.to)) return;
  if (v.to < v.from) {
    ctx.addIssue({ code: 'custom', path: ['to'], message: 'to must not be before from' });
  } else if (daysBetween(v.from, v.to) + 1 > 366) {
    ctx.addIssue({ code: 'custom', path: ['to'], message: 'at most 366 days' });
  }
};

/**
 * `GET /admin/transactions` (UC79, SRS 3.16.5): one row per invoice, period on its creation (default the last 30 days);
 * `search` matches the booking code or the SePay transaction id; `mismatch=true` keeps the invoices whose confirmed
 * amount differs from the expected one.
 */
export const adminTransactionListQuerySchema = listQuerySchema
  .omit({ sort: true })
  .extend({
    from: dateSchema.optional(),
    to: dateSchema.optional(),
    status: repeatedQuery(z.enum(PaymentStatus)).optional(),
    method: repeatedQuery(z.enum(PaymentMethod)).optional(),
    mismatch: z.enum(['true', 'false']).optional(),
  })
  .superRefine(periodRange);
export type AdminTransactionListQuery = z.infer<typeof adminTransactionListQuerySchema>;

/** `GET /admin/transactions/unmatched`: SePay transfers that confirmed nothing or came late, newest first. */
export const unmatchedTransferListQuerySchema = listQuerySchema
  .omit({ sort: true, search: true })
  .extend({ from: dateSchema.optional(), to: dateSchema.optional() })
  .superRefine(periodRange);
export type UnmatchedTransferListQuery = z.infer<typeof unmatchedTransferListQuerySchema>;

/** Checks of `POST /admin/payment-settings/test` (decision M10: the settings are read-only). */
export const PAYMENT_CHECKS = ['ACCOUNT_CONFIGURED', 'WEBHOOK_KEY_SET', 'WEBHOOK_RECEIVED'] as const;
/** A webhook older than this is reported by the self-test. */
export const WEBHOOK_SILENCE_DAYS = 7;
