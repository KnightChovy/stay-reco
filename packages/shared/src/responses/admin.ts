import { z } from 'zod';
import {
  AccountStatus,
  BookingStatus,
  HotelStatus,
  PartnerStatus,
  PaymentMethod,
  PaymentStatus,
  Role,
  StaffPermission,
  WalletTxnType,
} from '../enums';
import { AUDIT_SEVERITIES, PAYMENT_CHECKS } from '../schemas/admin';
import { suspensionRequestResponseSchema } from './compliance';
import { isoDateTime, responseSchemas } from './registry';
import { metricResponseSchema, statsPeriodResponseSchema } from './stats';

/** Content of `data` returned by the admin endpoints (docs/api/admin.md). */

const person = z.object({ id: z.uuid(), fullName: z.string(), role: z.enum(Role) });

export const auditLogEntryResponseSchema = z
  .object({
    id: z.uuid(),
    at: isoDateTime(),
    action: z.string(),
    severity: z.enum(AUDIT_SEVERITIES),
    actor: person.nullable().describe('The account that acted; null for the system (jobs, webhooks).'),
    entity: z.object({ type: z.string(), id: z.uuid().nullable() }).nullable(),
    details: z
      .record(z.string(), z.unknown())
      .nullable()
      .describe('What the event recorded; account and ID card numbers masked.'),
    ip: z.string().nullable(),
  })
  .register(responseSchemas, { id: 'AuditLogEntry', description: 'One audit log event, read-only.' });
export type AuditLogEntry = z.infer<typeof auditLogEntryResponseSchema>;

export const adminOverviewResponseSchema = z
  .object({
    generatedAt: isoDateTime(),
    period: statsPeriodResponseSchema,
    accounts: z
      .array(
        z.object({
          role: z.enum(Role),
          total: z.number().int().describe('Every account of the role except deleted ones.'),
          active: z.number().int(),
          suspended: z.number().int(),
          invited: z.number().int(),
          new: metricResponseSchema,
        }),
      )
      .describe('One row per role.'),
    suspensionRequests: z.object({ pending: z.number().int(), oldestRequestedAt: isoDateTime().nullable() }),
    payments: z.object({
      unmatchedTransfers: z.number().int().describe('SePay transfers in the period that confirmed nothing.'),
      lateTransfers: z.number().int().describe('SePay transfers in the period for a booking no longer waiting.'),
      refundsPending: z.number().int().describe('Invoices waiting for a refund decision now.'),
    }),
    securityEvents: z.array(auditLogEntryResponseSchema).describe('The 10 latest WARNING or CRITICAL events.'),
  })
  .register(responseSchemas, { id: 'AdminOverview' });
export type AdminOverview = z.infer<typeof adminOverviewResponseSchema>;

const userFields = {
  id: z.uuid(),
  fullName: z.string(),
  email: z.string(),
  role: z.enum(Role),
  status: z.enum(AccountStatus),
  organization: z.string().nullable().describe("The partner's company, the staff member's hotel, or null."),
  createdAt: isoDateTime(),
  lastSignInAt: isoDateTime().nullable(),
};

export const adminUserSummaryResponseSchema = z
  .object(userFields)
  .register(responseSchemas, { id: 'AdminUserSummary' });
export type AdminUserSummary = z.infer<typeof adminUserSummaryResponseSchema>;

export const adminUserResponseSchema = z
  .object({
    ...userFields,
    phone: z.string().nullable(),
    avatarUrl: z.string().nullable(),
    activeSessions: z.number().int().describe('Devices signed in now.'),
    partner: z
      .object({
        status: z.enum(PartnerStatus),
        commissionRate: z.number(),
        hotels: z.array(z.object({ id: z.uuid(), name: z.string(), status: z.enum(HotelStatus) })),
      })
      .nullable(),
    staff: z
      .object({
        hotel: z.object({ id: z.uuid(), name: z.string() }),
        position: z.string().nullable(),
        permissions: z.array(z.enum(StaffPermission)),
      })
      .nullable(),
    suspensionRequests: z
      .array(suspensionRequestResponseSchema)
      .describe("A partner's suspension requests, newest first."),
    timeline: z.array(auditLogEntryResponseSchema).describe('The 50 latest events done by or about the account.'),
  })
  .register(responseSchemas, { id: 'AdminUser' });
export type AdminUser = z.infer<typeof adminUserResponseSchema>;

// ── Transactions and payment settings ───────────────────────

export const adminTransactionResponseSchema = z
  .object({
    invoiceId: z.uuid(),
    booking: z.object({ id: z.uuid(), code: z.string() }),
    hotel: z.object({ id: z.uuid(), name: z.string() }),
    method: z.enum(PaymentMethod),
    status: z.enum(PaymentStatus),
    expectedAmount: z.number().describe('`invoice.totalAmount`.'),
    confirmedAmount: z
      .number()
      .nullable()
      .describe('What the payment confirmation reported (SePay transfer or wallet); null while unpaid.'),
    refunded: z.number().describe('Refunded to the customer wallet.'),
    gatewayTransactionId: z.string().nullable().describe('The SePay transaction id.'),
    paidAt: isoDateTime().nullable(),
    createdAt: isoDateTime(),
    mismatch: z.boolean().describe('`confirmedAmount` differs from `expectedAmount`.'),
  })
  .register(responseSchemas, { id: 'AdminTransaction', description: 'The payment of one booking and its refunds.' });
export type AdminTransaction = z.infer<typeof adminTransactionResponseSchema>;

export const adminTransactionDetailResponseSchema = adminTransactionResponseSchema
  .extend({
    booking: z.object({ id: z.uuid(), code: z.string(), status: z.enum(BookingStatus) }),
    customer: z.object({ id: z.uuid(), fullName: z.string(), email: z.string() }),
    events: z
      .array(z.object({ action: z.string(), at: isoDateTime(), details: z.record(z.string(), z.unknown()).nullable() }))
      .describe("The booking's history, oldest first."),
    walletMovements: z
      .array(
        z.object({
          wallet: z.enum(['HOTEL', 'CUSTOMER', 'PLATFORM']),
          type: z.enum(WalletTxnType),
          amount: z.number(),
          description: z.string().nullable(),
          createdAt: isoDateTime(),
        }),
      )
      .describe('Every wallet movement of the booking, oldest first.'),
  })
  .register(responseSchemas, { id: 'AdminTransactionDetail' });
export type AdminTransactionDetail = z.infer<typeof adminTransactionDetailResponseSchema>;

export const unmatchedTransferResponseSchema = z
  .object({
    id: z.uuid(),
    at: isoDateTime(),
    kind: z.enum(['UNMATCHED', 'LATE']),
    reason: z.string().nullable(),
    code: z.string().nullable().describe('The booking code found in the transfer content, if any.'),
    bookingId: z.uuid().nullable(),
    amount: z.number().nullable(),
    content: z.string().nullable(),
    sepayId: z.string().nullable(),
  })
  .register(responseSchemas, {
    id: 'UnmatchedTransfer',
    description: 'A SePay transfer that confirmed nothing or came late: to refund by hand.',
  });
export type UnmatchedTransfer = z.infer<typeof unmatchedTransferResponseSchema>;

export const paymentSettingsResponseSchema = z
  .object({
    provider: z.literal('SEPAY'),
    bank: z.object({ code: z.string(), name: z.string() }),
    accountNumber: z.string().describe('Masked: `****6789`.'),
    accountName: z.string(),
    webhookUrl: z.string(),
    webhookKeySet: z.boolean(),
    lastWebhookAt: isoDateTime().nullable().describe('The latest SePay notification received; null if none.'),
    paymentHoldMinutes: z.number().int(),
    walletHoldDays: z.number(),
    defaultCommissionRate: z.number(),
  })
  .register(responseSchemas, {
    id: 'PaymentSettings',
    description: 'Read-only (decision M10): server environment settings.',
  });
export type PaymentSettings = z.infer<typeof paymentSettingsResponseSchema>;

export const paymentSettingsCheckResponseSchema = z
  .object({
    checks: z.array(z.object({ name: z.enum(PAYMENT_CHECKS), ok: z.boolean(), message: z.string().nullable() })),
  })
  .register(responseSchemas, { id: 'PaymentSettingsCheck' });
export type PaymentSettingsCheck = z.infer<typeof paymentSettingsCheckResponseSchema>;
