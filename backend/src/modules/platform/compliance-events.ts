import type { SuspensionRequestStatus } from '@stayreco/shared';
import { Prisma } from '../../generated/prisma/client';
import { AuditAction } from '../audit/audit.service';

/**
 * A compliance case is a `policy_violation` row; what has no column (the hotel concerned, the evidence, the notes, the
 * suspension requests and the admin's decisions) lives in its audit events (decision M8, no schema change).
 */
export const CASE_ENTITY = 'policy_violation';

/** Folder of a manager's evidence uploads; a case only accepts files of the manager who opens it. */
export const evidenceFolder = (managerId: string) =>
  `stayreco/compliance/${managerId}`;

/** Exact shape produced by `StorageService.uploadPrivate`, so `<folder>/../x.pdf` is refused. */
const FILE_NAME = /^[A-Za-z0-9_-]{1,100}\.(pdf|jpg|jpeg|png)$/;

export const isOwnEvidenceFile = (managerId: string, fileId: string) => {
  const folder = `${evidenceFolder(managerId)}/`;
  return (
    fileId.startsWith(folder) && FILE_NAME.test(fileId.slice(folder.length))
  );
};

export const SUSPENSION_STATUS_OF = {
  [AuditAction.SUSPENSION_REQUESTED]: 'PENDING',
  [AuditAction.SUSPENSION_APPROVED]: 'APPROVED',
  [AuditAction.SUSPENSION_REJECTED]: 'REJECTED',
} as const satisfies Record<string, SuspensionRequestStatus>;

export const SUSPENSION_EVENTS = Object.keys(
  SUSPENSION_STATUS_OF,
) as (keyof typeof SUSPENSION_STATUS_OF)[];

/** Values kept in each event's `new_value`. */
export interface OpenedValue {
  hotelId: string | null;
  evidence: string[];
}
export interface UpdatedValue {
  status?: string;
  severity?: string;
  note: string;
}
export interface ReasonValue {
  reason: string;
}

/** The latest suspension event of the case `p` (a `policy_violation` row in the query). */
export const latestSuspensionSql = Prisma.sql`(
  SELECT a.action FROM audit_log a
  WHERE a.entity_type = ${CASE_ENTITY} AND a.entity_id = p.policy_violation_id
    AND a.action IN (${Prisma.join(SUSPENSION_EVENTS)})
  ORDER BY a.created_at DESC, a.audit_log_id DESC
  LIMIT 1)`;
