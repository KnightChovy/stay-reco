import { Injectable } from '@nestjs/common';
import {
  AUDIT_LOG_LIMITS,
  type AuditLogEntry,
  type AuditLogListQuery,
  auditActionsOf,
  auditSeverityOf,
  type Role,
} from '@stayreco/shared';
import {
  addDays,
  todayInVietnam,
  vietnamDateTime,
} from '../../common/http/calendar-date';
import { Paginated } from '../../common/http/api-response';
import { pageArgs } from '../../common/http/pagination';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const ACTOR_COLUMN = {
  CUSTOMER: 'customerId',
  HOTEL_STAFF: 'hotelStaffId',
  HOTEL_PARTNER: 'hotelPartnerId',
  ADMIN: 'adminId',
  PLATFORM_MANAGER: 'platformManagerId',
} as const satisfies Record<Role, keyof Prisma.AuditLogWhereInput>;

const name = { select: { userAccount: { select: { fullName: true } } } };

/** An audit row with the name of whoever acted. */
export const auditEntrySelect = {
  auditLogId: true,
  action: true,
  entityType: true,
  entityId: true,
  newValue: true,
  ipAddress: true,
  createdAt: true,
  customerId: true,
  hotelStaffId: true,
  hotelPartnerId: true,
  adminId: true,
  platformManagerId: true,
  customer: name,
  hotelStaff: name,
  hotelPartner: name,
  admin: name,
  platformManager: name,
} satisfies Prisma.AuditLogSelect;
type AuditRow = Prisma.AuditLogGetPayload<{ select: typeof auditEntrySelect }>;

/** Keys whose values are account or ID card numbers: only their last 4 digits are shown (BR-26). */
const SECRET_KEYS = /accountnumber|idnumber/i;

const masked = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(masked);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        k,
        SECRET_KEYS.test(k) && typeof v === 'string'
          ? `****${v.slice(-4)}`
          : masked(v),
      ]),
    );
  }
  return value;
};

function details(raw: string | null): Record<string, unknown> | null {
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (masked(parsed) as Record<string, unknown>)
      : { value: parsed };
  } catch {
    return { value: raw };
  }
}

export function toAuditEntry(r: AuditRow): AuditLogEntry {
  const role = (Object.keys(ACTOR_COLUMN) as Role[]).find(
    (k) => r[ACTOR_COLUMN[k]],
  );
  const actorOf = (k: Role) => {
    const column = ACTOR_COLUMN[k];
    const relation = {
      CUSTOMER: r.customer,
      HOTEL_STAFF: r.hotelStaff,
      HOTEL_PARTNER: r.hotelPartner,
      ADMIN: r.admin,
      PLATFORM_MANAGER: r.platformManager,
    }[k];
    return {
      id: r[column]!,
      fullName: relation?.userAccount.fullName ?? '',
      role: k,
    };
  };
  return {
    id: r.auditLogId,
    at: r.createdAt.toISOString(),
    action: r.action,
    severity: auditSeverityOf(r.action),
    actor: role ? actorOf(role) : null,
    entity: r.entityType ? { type: r.entityType, id: r.entityId } : null,
    details: details(r.newValue),
    ip: r.ipAddress,
  };
}

/** Events done by the account, or about it (`entity_type` `user_account`). */
export const aboutAccount = (accountId: string): Prisma.AuditLogWhereInput => ({
  OR: [
    ...Object.values(ACTOR_COLUMN).map((column) => ({ [column]: accountId })),
    { entityType: 'user_account', entityId: accountId },
  ],
});

/** The system logs (UC80, SRS 3.16.7): read-only, newest first, severity derived from the action. */
@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    query: AuditLogListQuery,
    now = new Date(),
  ): Promise<Paginated<AuditLogEntry>> {
    const today = todayInVietnam(now);
    const from =
      query.from ?? addDays(today, -(AUDIT_LOG_LIMITS.defaultDays - 1));
    const to = query.to ?? today;
    const and: Prisma.AuditLogWhereInput[] = [
      {
        createdAt: {
          gte: vietnamDateTime(from, '00:00'),
          lt: vietnamDateTime(addDays(to, 1), '00:00'),
        },
      },
    ];
    if (query.actorId) and.push(aboutActor(query.actorId));
    if (query.role) {
      and.push({
        OR: query.role.map((r) => ({ [ACTOR_COLUMN[r]]: { not: null } })),
      });
    }
    if (query.action) and.push({ action: { in: query.action } });
    if (query.severity) {
      const listed = [
        ...auditActionsOf('CRITICAL'),
        ...auditActionsOf('WARNING'),
      ];
      and.push({
        OR: query.severity.map((s) =>
          s === 'INFO'
            ? { action: { notIn: listed } }
            : { action: { in: auditActionsOf(s) } },
        ),
      });
    }
    if (query.entityType) and.push({ entityType: query.entityType });
    if (query.entityId) and.push({ entityId: query.entityId });

    const where: Prisma.AuditLogWhereInput = { AND: and };
    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        select: auditEntrySelect,
        orderBy: [{ createdAt: 'desc' }, { auditLogId: 'desc' }],
        ...pageArgs(query),
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return Paginated.of(rows.map(toAuditEntry), { ...query, total });
  }
}

/** Events the account did itself, whatever its role. */
const aboutActor = (accountId: string): Prisma.AuditLogWhereInput => ({
  OR: Object.values(ACTOR_COLUMN).map((column) => ({ [column]: accountId })),
});
