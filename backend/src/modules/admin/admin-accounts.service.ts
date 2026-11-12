import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AdminReasonInput,
  AdminUser,
  AdminUserListQuery,
  AdminUserSummary,
  CommissionRateInput,
  SuspensionRequest,
  SuspensionRequestListQuery,
} from '@stayreco/shared';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import type { RequestMeta } from '../../common/decorators/request-meta.decorator';
import { lockAccount } from '../../common/db/locks';
import { ErrorCode } from '../../common/errors/error-code';
import { Paginated } from '../../common/http/api-response';
import { toNumber } from '../../common/http/decimal';
import { pageArgs } from '../../common/http/pagination';
import { isUuid } from '../../common/hotel-access/hotel-access.service';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '../audit/audit.service';
import { CASE_ENTITY, SUSPENSION_EVENTS } from '../platform/compliance-events';
import { AccountMailer } from './account-mailer';
import {
  aboutAccount,
  auditEntrySelect,
  toAuditEntry,
} from './audit-logs.service';
import { loadSuspensionRequests } from './suspension-requests';

const userNotFound = () =>
  new NotFoundException({
    code: ErrorCode.USER_NOT_FOUND,
    message: 'Account not found',
  });
const partnerNotFound = () =>
  new NotFoundException({
    code: ErrorCode.PARTNER_NOT_FOUND,
    message: 'Hotel partner not found',
  });

const summarySelect = {
  userAccountId: true,
  fullName: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  lastLoginAt: true,
  hotelPartner: { select: { partnerName: true } },
  hotelStaff: { select: { hotel: { select: { name: true } } } },
} satisfies Prisma.UserAccountSelect;
type SummaryRow = Prisma.UserAccountGetPayload<{
  select: typeof summarySelect;
}>;

const toSummary = (u: SummaryRow): AdminUserSummary => ({
  id: u.userAccountId,
  fullName: u.fullName,
  email: u.email,
  role: u.role,
  status: u.status,
  organization: u.hotelPartner?.partnerName ?? u.hotelStaff?.hotel.name ?? null,
  createdAt: u.createdAt.toISOString(),
  lastSignInAt: u.lastLoginAt?.toISOString() ?? null,
});

const PARTNER_PATH = '/partner/dashboard';
const MANAGER_PATH = '/manager/compliance';

/**
 * Account administration (UC82, UC83, SRS 3.16.2–3.16.3, BR-13, BR-15, decisions M8–M9). Locking an account and
 * suspending a partner are two different things: a locked account cannot sign in at all; a suspended partner still can,
 * but its hotels leave the search and it cannot change anything.
 */
@Injectable()
export class AdminAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: AccountMailer,
  ) {}

  async list(query: AdminUserListQuery): Promise<Paginated<AdminUserSummary>> {
    const where: Prisma.UserAccountWhereInput = {
      ...(query.role && { role: { in: query.role } }),
      status: query.status ? { in: query.status } : { not: 'DELETED' },
      ...(query.search && {
        OR: [
          { fullName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };
    const orderBy: Prisma.UserAccountOrderByWithRelationInput[] =
      query.sort === 'name-asc'
        ? [{ fullName: 'asc' }, { userAccountId: 'asc' }]
        : [
            { createdAt: query.sort === 'created-asc' ? 'asc' : 'desc' },
            { userAccountId: 'asc' },
          ];
    const [rows, total] = await Promise.all([
      this.prisma.userAccount.findMany({
        where,
        select: summarySelect,
        orderBy,
        ...pageArgs(query),
      }),
      this.prisma.userAccount.count({ where }),
    ]);
    return Paginated.of(rows.map(toSummary), { ...query, total });
  }

  async detail(id: string, now = new Date()): Promise<AdminUser> {
    const u = isUuid(id)
      ? await this.prisma.userAccount.findUnique({
          where: { userAccountId: id },
          select: {
            ...summarySelect,
            phone: true,
            avatarUrl: true,
            hotelPartner: {
              select: {
                partnerName: true,
                status: true,
                commissionRate: true,
                hotels: {
                  select: { hotelId: true, name: true, status: true },
                  orderBy: { name: 'asc' },
                },
              },
            },
            hotelStaff: {
              select: {
                position: true,
                permissions: true,
                hotel: { select: { hotelId: true, name: true } },
              },
            },
          },
        })
      : null;
    if (!u) throw userNotFound();
    const [activeSessions, timeline, requests] = await Promise.all([
      this.prisma.authSession.count({
        where: { userAccountId: id, revokedAt: null, expiresAt: { gt: now } },
      }),
      this.prisma.auditLog.findMany({
        where: aboutAccount(id),
        select: auditEntrySelect,
        orderBy: [{ createdAt: 'desc' }, { auditLogId: 'desc' }],
        take: 50,
      }),
      u.hotelPartner
        ? loadSuspensionRequests(this.prisma, { partnerId: id })
        : Promise.resolve([]),
    ]);
    return {
      ...toSummary(u),
      phone: u.phone,
      avatarUrl: u.avatarUrl,
      activeSessions,
      partner: u.hotelPartner && {
        status: u.hotelPartner.status,
        commissionRate: toNumber(u.hotelPartner.commissionRate),
        hotels: u.hotelPartner.hotels.map((h) => ({
          id: h.hotelId,
          name: h.name,
          status: h.status,
        })),
      },
      staff: u.hotelStaff && {
        hotel: {
          id: u.hotelStaff.hotel.hotelId,
          name: u.hotelStaff.hotel.name,
        },
        position: u.hotelStaff.position,
        permissions: u.hotelStaff.permissions,
      },
      suspensionRequests: requests,
      timeline: timeline.map(toAuditEntry),
    };
  }

  /** Lock: no sign-in, every session revoked. Not for admins (the admin's own account included). */
  async suspend(
    admin: AuthUser,
    id: string,
    input: AdminReasonInput,
    meta: RequestMeta,
  ): Promise<AdminUser> {
    const target = await this.target(id);
    if (target.role === 'ADMIN') {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: 'Admin accounts cannot be locked',
      });
    }
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.userAccount.updateMany({
        where: { userAccountId: id, status: { in: ['ACTIVE', 'INVITED'] } },
        data: { status: 'SUSPENDED' },
      });
      if (!count) throw this.statusConflict();
      await tx.authSession.updateMany({
        where: { userAccountId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await this.record(
        tx,
        admin,
        meta,
        AuditAction.ACCOUNT_SUSPENDED,
        'user_account',
        id,
        {
          reason: input.reason,
          previousStatus: target.status,
        },
      );
    });
    this.mailer.send({
      accountId: id,
      subject: 'Tài khoản StayReco của bạn đã bị khoá',
      lines: [
        'Quản trị viên StayReco đã khoá tài khoản của bạn; bạn không thể đăng nhập cho đến khi tài khoản được mở lại.',
        `Lý do: ${input.reason}`,
      ],
    });
    return this.detail(id);
  }

  /** Unlock: back to ACTIVE, or to INVITED for someone who never set a password. */
  async activate(
    admin: AuthUser,
    id: string,
    input: AdminReasonInput,
    meta: RequestMeta,
  ): Promise<AdminUser> {
    const target = await this.target(id);
    const next = target.passwordHash ? 'ACTIVE' : 'INVITED';
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.userAccount.updateMany({
        where: { userAccountId: id, status: 'SUSPENDED' },
        data: { status: next },
      });
      if (!count) throw this.statusConflict();
      await this.record(
        tx,
        admin,
        meta,
        AuditAction.ACCOUNT_ACTIVATED,
        'user_account',
        id,
        {
          reason: input.reason,
          status: next,
        },
      );
    });
    this.mailer.send({
      accountId: id,
      subject: 'Tài khoản StayReco của bạn đã được mở lại',
      lines: [
        'Quản trị viên StayReco đã mở lại tài khoản của bạn.',
        `Lý do: ${input.reason}`,
      ],
    });
    return this.detail(id);
  }

  /** BR-13: 8–15 %, for bookings made from now on (each booking keeps the rate it was made with). */
  async setCommissionRate(
    admin: AuthUser,
    partnerId: string,
    input: CommissionRateInput,
    meta: RequestMeta,
  ): Promise<AdminUser> {
    const partner = isUuid(partnerId)
      ? await this.prisma.hotelPartner.findUnique({
          where: { hotelPartnerId: partnerId },
          select: { commissionRate: true },
        })
      : null;
    if (!partner) throw partnerNotFound();
    await this.prisma.$transaction(async (tx) => {
      await tx.hotelPartner.update({
        where: { hotelPartnerId: partnerId },
        data: { commissionRate: input.rate },
      });
      await this.record(
        tx,
        admin,
        meta,
        AuditAction.COMMISSION_RATE_CHANGED,
        'user_account',
        partnerId,
        {
          from: toNumber(partner.commissionRate),
          to: input.rate,
        },
      );
    });
    return this.detail(partnerId);
  }

  /** A suspended partner back to APPROVED: its active hotels are listed and bookable again. */
  async reinstate(
    admin: AuthUser,
    partnerId: string,
    input: AdminReasonInput,
    meta: RequestMeta,
  ): Promise<AdminUser> {
    if (!isUuid(partnerId)) throw partnerNotFound();
    await this.prisma.$transaction(async (tx) => {
      const exists = await tx.hotelPartner.count({
        where: { hotelPartnerId: partnerId },
      });
      if (!exists) throw partnerNotFound();
      const { count } = await tx.hotelPartner.updateMany({
        where: { hotelPartnerId: partnerId, status: 'SUSPENDED' },
        data: { status: 'APPROVED' },
      });
      if (!count) {
        throw new ConflictException({
          code: ErrorCode.PARTNER_STATUS_CONFLICT,
          message: 'The partner is not suspended',
        });
      }
      await this.record(
        tx,
        admin,
        meta,
        AuditAction.PARTNER_REINSTATED,
        'user_account',
        partnerId,
        {
          reason: input.reason,
        },
      );
    });
    this.mailer.send({
      accountId: partnerId,
      subject: 'Đối tác của bạn đã được khôi phục trên StayReco',
      lines: [
        'Quản trị viên StayReco đã gỡ đình chỉ: các khách sạn đang hoạt động của bạn đã hiển thị và nhận đặt phòng trở lại.',
        `Lý do: ${input.reason}`,
      ],
      link: PARTNER_PATH,
    });
    return this.detail(partnerId);
  }

  /** PENDING by default, oldest first; decided ones newest first. */
  async suspensionRequests(
    query: SuspensionRequestListQuery,
  ): Promise<Paginated<SuspensionRequest>> {
    const statuses = query.status ?? ['PENDING'];
    const all = (await loadSuspensionRequests(this.prisma)).filter((r) =>
      statuses.includes(r.status),
    );
    if (statuses.length === 1 && statuses[0] === 'PENDING') all.reverse();
    return Paginated.of(
      all.slice((query.page - 1) * query.pageSize, query.page * query.pageSize),
      { ...query, total: all.length },
    );
  }

  /**
   * UC83: approve (the partner becomes SUSPENDED) or reject a pending request, with a reason. Only the latest request
   * of a case that is still undecided can be decided; the partner row lock makes two admins decide once.
   */
  async decide(
    admin: AuthUser,
    requestId: string,
    approve: boolean,
    input: AdminReasonInput,
    meta: RequestMeta,
  ): Promise<SuspensionRequest> {
    const request = isUuid(requestId)
      ? await this.prisma.auditLog.findFirst({
          where: {
            auditLogId: requestId,
            entityType: CASE_ENTITY,
            action: AuditAction.SUSPENSION_REQUESTED,
          },
          select: { entityId: true, platformManagerId: true },
        })
      : null;
    if (!request?.entityId) {
      throw new NotFoundException({
        code: ErrorCode.SUSPENSION_REQUEST_NOT_FOUND,
        message: 'Suspension request not found',
      });
    }
    const caseId = request.entityId;
    const { hotelPartnerId } =
      await this.prisma.policyViolation.findUniqueOrThrow({
        where: { policyViolationId: caseId },
        select: { hotelPartnerId: true },
      });
    await this.prisma.$transaction(async (tx) => {
      await lockAccount(tx, hotelPartnerId);
      const latest = await tx.auditLog.findFirst({
        where: {
          entityType: CASE_ENTITY,
          entityId: caseId,
          action: { in: SUSPENSION_EVENTS },
        },
        orderBy: [{ createdAt: 'desc' }, { auditLogId: 'desc' }],
        select: { auditLogId: true },
      });
      if (latest?.auditLogId !== requestId) {
        throw new ConflictException({
          code: ErrorCode.SUSPENSION_STATUS_CONFLICT,
          message: 'The suspension request was already decided',
        });
      }
      if (approve) {
        await tx.hotelPartner.update({
          where: { hotelPartnerId },
          data: { status: 'SUSPENDED' },
        });
      }
      await this.record(
        tx,
        admin,
        meta,
        approve
          ? AuditAction.SUSPENSION_APPROVED
          : AuditAction.SUSPENSION_REJECTED,
        CASE_ENTITY,
        caseId,
        { reason: input.reason, requestId },
      );
    });

    const decision = approve ? 'đã duyệt' : 'đã từ chối';
    this.mailer.send(
      ...(approve
        ? [
            {
              accountId: hotelPartnerId,
              subject: 'Đối tác của bạn bị đình chỉ trên StayReco',
              lines: [
                'Quản trị viên StayReco đã đình chỉ tài khoản đối tác của bạn: các khách sạn tạm ngừng hiển thị và nhận đặt phòng mới; các đơn đã đặt vẫn được phục vụ, bạn vẫn xem được số liệu và tiền.',
                `Lý do: ${input.reason}`,
              ],
              link: PARTNER_PATH,
            },
          ]
        : []),
      ...(request.platformManagerId
        ? [
            {
              accountId: request.platformManagerId,
              subject: `Đề nghị đình chỉ ${decision}`,
              lines: [
                `Quản trị viên ${decision} đề nghị đình chỉ của bạn.`,
                `Lý do: ${input.reason}`,
              ],
              link: MANAGER_PATH,
            },
          ]
        : []),
    );
    const all = await loadSuspensionRequests(this.prisma, {
      partnerId: hotelPartnerId,
    });
    return all.find((r) => r.id === requestId)!;
  }

  private async target(id: string) {
    const target = isUuid(id)
      ? await this.prisma.userAccount.findUnique({
          where: { userAccountId: id },
          select: { role: true, status: true, passwordHash: true },
        })
      : null;
    if (!target) throw userNotFound();
    return target;
  }

  private statusConflict() {
    return new ConflictException({
      code: ErrorCode.ACCOUNT_STATUS_CONFLICT,
      message: "The account's status does not allow this",
    });
  }

  private record(
    tx: Prisma.TransactionClient,
    admin: AuthUser,
    meta: RequestMeta,
    action: AuditAction,
    entityType: string,
    entityId: string,
    value: object,
  ) {
    return tx.auditLog.create({
      data: {
        action,
        adminId: admin.accountId,
        entityType,
        entityId,
        newValue: JSON.stringify(value),
        ipAddress: meta.ip,
      },
    });
  }
}
