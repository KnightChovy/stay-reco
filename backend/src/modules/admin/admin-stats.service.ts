import { Injectable } from '@nestjs/common';
import {
  type AdminOverview,
  auditActionsOf,
  type PlatformRangeQuery,
  Role,
} from '@stayreco/shared';
import {
  addDays,
  todayInVietnam,
  vietnamDateTime,
} from '../../common/http/calendar-date';
import { PrismaService } from '../../prisma/prisma.service';
import { platformPeriod } from '../platform/platform-stats.service';
import { metric, previousPeriod } from '../stats/stats-math';
import { auditEntrySelect, toAuditEntry } from './audit-logs.service';
import { loadSuspensionRequests } from './suspension-requests';

const startOf = (date: string) => vietnamDateTime(date, '00:00');

/** The admin dashboard (UC77, SRS 3.16.1): accounts, pending decisions, payment issues, recent security events. */
@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(
    query: PlatformRangeQuery,
    now = new Date(),
  ): Promise<AdminOverview> {
    const period = platformPeriod(query, todayInVietnam(now));
    const previous = previousPeriod(period);
    const cs = startOf(period.from);
    const ce = startOf(addDays(period.to, 1));
    const ps = startOf(previous.from);
    const [accounts, requests, payments, events] = await Promise.all([
      this.prisma.$queryRaw<
        {
          role: string;
          total: number;
          active: number;
          suspended: number;
          invited: number;
          new: number;
          previous: number;
        }[]
      >`
        SELECT role::text AS role,
          count(*)::int AS total,
          count(*) FILTER (WHERE status = 'ACTIVE')::int AS active,
          count(*) FILTER (WHERE status = 'SUSPENDED')::int AS suspended,
          count(*) FILTER (WHERE status = 'INVITED')::int AS invited,
          count(*) FILTER (WHERE created_at >= ${cs} AND created_at < ${ce})::int AS new,
          count(*) FILTER (WHERE created_at >= ${ps} AND created_at < ${cs})::int AS previous
        FROM user_account WHERE status <> 'DELETED'
        GROUP BY role`,
      loadSuspensionRequests(this.prisma),
      this.prisma.$queryRaw<
        { unmatched: number; late: number; refunds: number }[]
      >`
        SELECT
          (SELECT count(*) FROM audit_log WHERE action = 'SEPAY_TRANSFER_UNMATCHED'
            AND created_at >= ${cs} AND created_at < ${ce})::int AS unmatched,
          (SELECT count(*) FROM audit_log WHERE action = 'SEPAY_TRANSFER_LATE'
            AND created_at >= ${cs} AND created_at < ${ce})::int AS late,
          (SELECT count(*) FROM invoice WHERE payment_status = 'REFUND_PENDING')::int AS refunds`,
      this.prisma.auditLog.findMany({
        where: {
          action: {
            in: [...auditActionsOf('CRITICAL'), ...auditActionsOf('WARNING')],
          },
        },
        select: auditEntrySelect,
        orderBy: [{ createdAt: 'desc' }, { auditLogId: 'desc' }],
        take: 10,
      }),
    ]);
    const pending = requests.filter((r) => r.status === 'PENDING');
    const byRole = new Map(accounts.map((a) => [a.role, a]));
    return {
      generatedAt: now.toISOString(),
      period,
      accounts: Object.values(Role).map((role) => {
        const a = byRole.get(role);
        return {
          role,
          total: a?.total ?? 0,
          active: a?.active ?? 0,
          suspended: a?.suspended ?? 0,
          invited: a?.invited ?? 0,
          new: metric(a?.new ?? 0, a?.previous ?? 0),
        };
      }),
      suspensionRequests: {
        pending: pending.length,
        // Newest first: the oldest is the last one.
        oldestRequestedAt: pending[pending.length - 1]?.requestedAt ?? null,
      },
      payments: {
        unmatchedTransfers: payments[0].unmatched,
        lateTransfers: payments[0].late,
        refundsPending: payments[0].refunds,
      },
      securityEvents: events.map(toAuditEntry),
    };
  }
}
