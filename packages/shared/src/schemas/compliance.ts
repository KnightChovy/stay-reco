import { z } from 'zod';
import { listQuerySchema, repeatedQuery } from './common';

/** Compliance cases on `policy_violation` (UC72, UC73, BR-15, decision M8; docs/api/manager.md). */

export const VIOLATION_TYPES = [
  'FRAUD',
  'FAKE_LISTING',
  'GUEST_SAFETY',
  'LICENSE_EXPIRED',
  'PAYMENT_ABUSE',
  'REVIEW_MANIPULATION',
  'OTHER',
] as const;
export type ViolationType = (typeof VIOLATION_TYPES)[number];

/** Same values as the `violation_severity` and `violation_status` enums. */
export const VIOLATION_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export const VIOLATION_STATUSES = ['OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'] as const;

/** At most this many evidence files per case. */
export const VIOLATION_MAX_EVIDENCE = 5;

/** `POST /policy-violations`: each `evidence` id comes from `POST /policy-violations/evidence` by the same manager. */
export const createViolationSchema = z.strictObject({
  partnerId: z.uuid(),
  hotelId: z.uuid().optional(),
  type: z.enum(VIOLATION_TYPES),
  severity: z.enum(VIOLATION_SEVERITIES),
  description: z.string().trim().min(1).max(4000),
  evidence: z.array(z.string().min(1).max(300)).max(VIOLATION_MAX_EVIDENCE).optional(),
});
export type CreateViolationInput = z.infer<typeof createViolationSchema>;

/** `PATCH /policy-violations/:id`: a note is kept in the timeline with every change. */
export const updateViolationSchema = z.strictObject({
  status: z.enum(VIOLATION_STATUSES).optional(),
  severity: z.enum(VIOLATION_SEVERITIES).optional(),
  note: z.string().trim().min(1).max(2000),
});
export type UpdateViolationInput = z.infer<typeof updateViolationSchema>;

/** `GET /policy-violations`: `OPEN` and `INVESTIGATING` by default, the most severe first, then the oldest. */
export const violationListQuerySchema = listQuerySchema.omit({ sort: true, search: true }).extend({
  status: repeatedQuery(z.enum(VIOLATION_STATUSES)).optional(),
  severity: repeatedQuery(z.enum(VIOLATION_SEVERITIES)).optional(),
  partnerId: z.uuid().optional(),
});
export type ViolationListQuery = z.infer<typeof violationListQuerySchema>;

/** `POST /policy-violations/:id/suspension-request`: sent to the admin, who decides (BR-15). */
export const suspensionRequestSchema = z.strictObject({
  reason: z.string().trim().min(1).max(2000),
});
export type SuspensionRequestInput = z.infer<typeof suspensionRequestSchema>;
