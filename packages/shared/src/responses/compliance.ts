import { z } from 'zod';
import { PartnerStatus } from '../enums';
import { VIOLATION_SEVERITIES, VIOLATION_STATUSES, VIOLATION_TYPES } from '../schemas/compliance';
import { isoDateTime, responseSchemas } from './registry';

/** Content of `data` returned by the compliance endpoints (docs/api/manager.md, "Compliance cases"). */

export const SUSPENSION_REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type SuspensionRequestStatus = (typeof SUSPENSION_REQUEST_STATUSES)[number];

const person = z.object({ id: z.uuid(), fullName: z.string() });

export const suspensionRequestResponseSchema = z
  .object({
    id: z.uuid().describe('The id of the request event; the admin decides it by this id.'),
    status: z.enum(SUSPENSION_REQUEST_STATUSES),
    partner: z.object({ id: z.uuid(), name: z.string(), status: z.enum(PartnerStatus) }),
    case: z.object({ id: z.uuid(), type: z.string(), severity: z.enum(VIOLATION_SEVERITIES) }),
    reason: z.string(),
    requestedBy: person.nullable(),
    requestedAt: isoDateTime(),
    decidedBy: person.nullable(),
    decidedAt: isoDateTime().nullable(),
    decisionReason: z.string().nullable(),
  })
  .register(responseSchemas, {
    id: 'SuspensionRequest',
    description: 'A platform manager asks the admin to suspend a partner (BR-15).',
  });
export type SuspensionRequest = z.infer<typeof suspensionRequestResponseSchema>;

const violationFields = {
  id: z.uuid(),
  partner: z.object({ id: z.uuid(), name: z.string(), status: z.enum(PartnerStatus) }),
  hotel: z.object({ id: z.uuid(), name: z.string() }).nullable(),
  type: z.enum(VIOLATION_TYPES),
  severity: z.enum(VIOLATION_SEVERITIES),
  status: z.enum(VIOLATION_STATUSES),
  description: z.string(),
  openedBy: person.nullable(),
  createdAt: isoDateTime(),
  resolvedAt: isoDateTime().nullable().describe('When it became RESOLVED or DISMISSED.'),
  suspensionRequest: suspensionRequestResponseSchema
    .omit({ partner: true, case: true })
    .nullable()
    .describe("The case's latest suspension request, or null."),
};

export const policyViolationSummaryResponseSchema = z
  .object(violationFields)
  .register(responseSchemas, { id: 'PolicyViolationSummary', description: 'A compliance case in the list.' });
export type PolicyViolationSummary = z.infer<typeof policyViolationSummaryResponseSchema>;

export const policyViolationResponseSchema = z
  .object({
    ...violationFields,
    evidence: z
      .array(z.object({ index: z.number().int(), fileName: z.string() }))
      .describe('Open one with `GET /policy-violations/:id/evidence/:index`.'),
    timeline: z
      .array(
        z.object({
          action: z.string(),
          at: isoDateTime(),
          by: person.nullable(),
          note: z.string().nullable(),
          status: z.enum(VIOLATION_STATUSES).nullable(),
          severity: z.enum(VIOLATION_SEVERITIES).nullable(),
        }),
      )
      .describe('Every event of the case, oldest first.'),
  })
  .register(responseSchemas, { id: 'PolicyViolation', description: 'A compliance case in full.' });
export type PolicyViolation = z.infer<typeof policyViolationResponseSchema>;

export const evidenceLinkResponseSchema = z
  .object({ url: z.string(), expiresAt: isoDateTime() })
  .register(responseSchemas, { id: 'EvidenceLink', description: 'A signed link to one evidence file, 5 minutes.' });
export type EvidenceLink = z.infer<typeof evidenceLinkResponseSchema>;

export const uploadedEvidenceResponseSchema = z
  .object({ fileId: z.string() })
  .register(responseSchemas, { id: 'UploadedEvidence' });
export type UploadedEvidence = z.infer<typeof uploadedEvidenceResponseSchema>;
