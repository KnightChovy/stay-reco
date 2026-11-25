import type { SuspensionRequest } from '@stayreco/shared';
import type { Prisma } from '../../generated/prisma/client';
import { AuditAction } from '../audit/audit.service';
import {
  CASE_ENTITY,
  type ReasonValue,
  SUSPENSION_EVENTS,
} from '../platform/compliance-events';

type Db = Pick<Prisma.TransactionClient, 'auditLog' | 'policyViolation'>;

const person = (
  role: { id: string; userAccount: { fullName: string } } | null,
) => (role ? { id: role.id, fullName: role.userAccount.fullName } : null);

/**
 * Suspension requests have no table (decision M8): a request is a `SUSPENSION_REQUESTED` event on a compliance case,
 * decided by the next `SUSPENSION_APPROVED` or `SUSPENSION_REJECTED` event of that case. Newest first.
 */
export async function loadSuspensionRequests(
  db: Db,
  filter: { partnerId?: string } = {},
): Promise<SuspensionRequest[]> {
  const cases = await db.policyViolation.findMany({
    where: filter.partnerId ? { hotelPartnerId: filter.partnerId } : {},
    select: {
      policyViolationId: true,
      violationType: true,
      severity: true,
      hotelPartner: {
        select: { hotelPartnerId: true, partnerName: true, status: true },
      },
    },
  });
  if (!cases.length) return [];
  const events = await db.auditLog.findMany({
    where: {
      entityType: CASE_ENTITY,
      entityId: { in: cases.map((c) => c.policyViolationId) },
      action: { in: SUSPENSION_EVENTS },
    },
    orderBy: [{ createdAt: 'asc' }, { auditLogId: 'asc' }],
    select: {
      auditLogId: true,
      entityId: true,
      action: true,
      newValue: true,
      createdAt: true,
      platformManager: {
        select: {
          platformManagerId: true,
          userAccount: { select: { fullName: true } },
        },
      },
      admin: {
        select: { adminId: true, userAccount: { select: { fullName: true } } },
      },
    },
  });
  const byCase = new Map(cases.map((c) => [c.policyViolationId, c]));
  const requests: SuspensionRequest[] = [];
  const open = new Map<string, SuspensionRequest>();
  for (const e of events) {
    const c = byCase.get(e.entityId!)!;
    const value = (
      e.newValue ? JSON.parse(e.newValue) : {}
    ) as Partial<ReasonValue>;
    if (e.action === (AuditAction.SUSPENSION_REQUESTED as string)) {
      const request: SuspensionRequest = {
        id: e.auditLogId,
        status: 'PENDING',
        partner: {
          id: c.hotelPartner.hotelPartnerId,
          name: c.hotelPartner.partnerName,
          status: c.hotelPartner.status,
        },
        case: {
          id: c.policyViolationId,
          type: c.violationType,
          severity: c.severity,
        },
        reason: value.reason ?? '',
        requestedBy: person(
          e.platformManager && {
            id: e.platformManager.platformManagerId,
            userAccount: e.platformManager.userAccount,
          },
        ),
        requestedAt: e.createdAt.toISOString(),
        decidedBy: null,
        decidedAt: null,
        decisionReason: null,
      };
      requests.push(request);
      open.set(c.policyViolationId, request);
    } else {
      const request = open.get(c.policyViolationId);
      if (!request) continue;
      request.status =
        e.action === (AuditAction.SUSPENSION_APPROVED as string)
          ? 'APPROVED'
          : 'REJECTED';
      request.decidedBy = person(
        e.admin && { id: e.admin.adminId, userAccount: e.admin.userAccount },
      );
      request.decidedAt = e.createdAt.toISOString();
      request.decisionReason = value.reason ?? null;
      open.delete(c.policyViolationId);
    }
  }
  return requests.reverse();
}
