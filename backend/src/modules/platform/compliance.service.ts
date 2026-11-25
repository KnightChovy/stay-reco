import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateViolationInput,
  EvidenceLink,
  PolicyViolation,
  PolicyViolationSummary,
  SuspensionRequestInput,
  UpdateViolationInput,
  UploadedEvidence,
  ViolationListQuery,
} from '@stayreco/shared';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import type { RequestMeta } from '../../common/decorators/request-meta.decorator';
import { lockAccount } from '../../common/db/locks';
import { ErrorCode } from '../../common/errors/error-code';
import { Paginated } from '../../common/http/api-response';
import { pageArgs } from '../../common/http/pagination';
import { isUuid } from '../../common/hotel-access/hotel-access.service';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '../audit/audit.service';
import { StorageService } from '../storage/storage.service';
import {
  CASE_ENTITY,
  evidenceFolder,
  isOwnEvidenceFile,
  latestSuspensionSql,
  type OpenedValue,
  type ReasonValue,
  SUSPENSION_EVENTS,
  SUSPENSION_STATUS_OF,
  type UpdatedValue,
} from './compliance-events';

/** Signed evidence links live 5 minutes, like verification documents. */
const LINK_SECONDS = 300;

const notFound = () =>
  new NotFoundException({
    code: ErrorCode.VIOLATION_NOT_FOUND,
    message: 'Compliance case not found',
  });

const OPEN_STATUSES = ['OPEN', 'INVESTIGATING'] as const;
/** Status changes a manager may make; a closed case changes no more. */
const NEXT: Record<string, string[]> = {
  OPEN: ['INVESTIGATING', 'RESOLVED', 'DISMISSED'],
  INVESTIGATING: ['RESOLVED', 'DISMISSED'],
};

const caseSelect = {
  policyViolationId: true,
  violationType: true,
  description: true,
  severity: true,
  status: true,
  createdAt: true,
  resolvedAt: true,
  hotelPartner: {
    select: { hotelPartnerId: true, partnerName: true, status: true },
  },
  platformManager: {
    select: {
      platformManagerId: true,
      userAccount: { select: { fullName: true } },
    },
  },
} satisfies Prisma.PolicyViolationSelect;
type CaseRow = Prisma.PolicyViolationGetPayload<{ select: typeof caseSelect }>;

const eventSelect = {
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
} satisfies Prisma.AuditLogSelect;
type EventRow = Prisma.AuditLogGetPayload<{ select: typeof eventSelect }>;

const byOf = (e: EventRow) =>
  e.platformManager
    ? {
        id: e.platformManager.platformManagerId,
        fullName: e.platformManager.userAccount.fullName,
      }
    : e.admin
      ? { id: e.admin.adminId, fullName: e.admin.userAccount.fullName }
      : null;

const valueOf = <T>(e: EventRow) =>
  (e.newValue ? JSON.parse(e.newValue) : {}) as Partial<T>;

/**
 * Compliance cases (UC72, UC73, SRS 3.14.5, decision M8). A case is a `policy_violation` row; the hotel concerned,
 * the evidence, the notes and the suspension requests are its audit events. A manager can only ask for a suspension;
 * the admin decides (BR-15).
 */
@Injectable()
export class ComplianceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async uploadEvidence(
    user: AuthUser,
    file: Buffer,
  ): Promise<UploadedEvidence> {
    const fileId = await this.storage.uploadPrivate(
      file,
      evidenceFolder(user.accountId),
    );
    return { fileId };
  }

  /** OPEN and INVESTIGATING by default; the most severe first, then the oldest. */
  async list(
    query: ViolationListQuery,
  ): Promise<Paginated<PolicyViolationSummary>> {
    const where: Prisma.PolicyViolationWhereInput = {
      status: { in: query.status ?? [...OPEN_STATUSES] },
      ...(query.severity && { severity: { in: query.severity } }),
      ...(query.partnerId && { hotelPartnerId: query.partnerId }),
    };
    const [rows, total] = await Promise.all([
      this.prisma.policyViolation.findMany({
        where,
        select: caseSelect,
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'asc' },
          { policyViolationId: 'asc' },
        ],
        ...pageArgs(query),
      }),
      this.prisma.policyViolation.count({ where }),
    ]);
    const views = await this.views(rows);
    return Paginated.of(views.map(toSummary), { ...query, total });
  }

  async detail(id: string): Promise<PolicyViolation> {
    const row = isUuid(id)
      ? await this.prisma.policyViolation.findUnique({
          where: { policyViolationId: id },
          select: caseSelect,
        })
      : null;
    if (!row) throw notFound();
    const [view] = await this.views([row]);
    return view;
  }

  async create(
    user: AuthUser,
    input: CreateViolationInput,
    meta: RequestMeta,
  ): Promise<PolicyViolation> {
    const partner = await this.prisma.hotelPartner.findUnique({
      where: { hotelPartnerId: input.partnerId },
      select: { hotelPartnerId: true },
    });
    if (!partner) {
      throw new NotFoundException({
        code: ErrorCode.PARTNER_NOT_FOUND,
        message: 'Hotel partner not found',
      });
    }
    if (input.hotelId) {
      const hotel = await this.prisma.hotel.count({
        where: { hotelId: input.hotelId, hotelPartnerId: input.partnerId },
      });
      if (!hotel) {
        throw new NotFoundException({
          code: ErrorCode.HOTEL_NOT_FOUND,
          message: 'The hotel does not belong to this partner',
        });
      }
    }
    const evidence = input.evidence ?? [];
    const foreign = evidence
      .map((fileId, i) => ({ fileId, i }))
      .filter(({ fileId }) => !isOwnEvidenceFile(user.accountId, fileId));
    if (foreign.length) {
      throw new BadRequestException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        details: foreign.map(({ i }) => ({
          field: `evidence.${i}`,
          message:
            'Upload the file with POST /policy-violations/evidence first',
        })),
      });
    }

    const id = await this.prisma.$transaction(async (tx) => {
      const created = await tx.policyViolation.create({
        data: {
          platformManagerId: user.accountId,
          hotelPartnerId: input.partnerId,
          violationType: input.type,
          description: input.description,
          severity: input.severity,
        },
        select: { policyViolationId: true },
      });
      await this.record(
        tx,
        created.policyViolationId,
        AuditAction.VIOLATION_OPENED,
        user,
        meta,
        {
          hotelId: input.hotelId ?? null,
          evidence,
        } satisfies OpenedValue,
      );
      return created.policyViolationId;
    });
    return this.detail(id);
  }

  /** Status along OPEN → INVESTIGATING → RESOLVED / DISMISSED, severity, and a note kept in the timeline. */
  async update(
    user: AuthUser,
    id: string,
    input: UpdateViolationInput,
    meta: RequestMeta,
  ): Promise<PolicyViolation> {
    const current = await this.findOpen(id);
    const status =
      input.status && input.status !== current.status
        ? input.status
        : undefined;
    if (status && !NEXT[current.status]?.includes(status)) {
      throw this.statusConflict();
    }
    await this.prisma.$transaction(async (tx) => {
      // Conditional on the status read, so two managers closing the case at once apply once.
      const { count } = await tx.policyViolation.updateMany({
        where: { policyViolationId: id, status: current.status },
        data: {
          ...(status && { status }),
          ...(input.severity && { severity: input.severity }),
          ...(status && !NEXT[status] ? { resolvedAt: new Date() } : {}),
        },
      });
      if (!count) throw this.statusConflict();
      await this.record(tx, id, AuditAction.VIOLATION_UPDATED, user, meta, {
        ...(status && { status }),
        ...(input.severity && { severity: input.severity }),
        note: input.note,
      } satisfies UpdatedValue);
    });
    return this.detail(id);
  }

  /** BR-15: the manager asks, the admin decides. One pending request per partner; not for a suspended partner. */
  async requestSuspension(
    user: AuthUser,
    id: string,
    input: SuspensionRequestInput,
    meta: RequestMeta,
  ): Promise<PolicyViolation> {
    const current = await this.findOpen(id);
    await this.prisma.$transaction(async (tx) => {
      // The case row first: a manager closing the case at the same moment either goes first (then the request is
      // refused below) or waits until the request is recorded on the still open case.
      await tx.$executeRaw`SELECT 1 FROM policy_violation WHERE policy_violation_id = ${id}::uuid FOR UPDATE`;
      const { status } = await tx.policyViolation.findUniqueOrThrow({
        where: { policyViolationId: id },
        select: { status: true },
      });
      if (!(OPEN_STATUSES as readonly string[]).includes(status)) {
        throw this.statusConflict();
      }
      // The partner's account row serialises requests about the same partner from several cases.
      await lockAccount(tx, current.hotelPartnerId);
      const partner = await tx.hotelPartner.findUniqueOrThrow({
        where: { hotelPartnerId: current.hotelPartnerId },
        select: { status: true },
      });
      if (partner.status === 'SUSPENDED') {
        throw new ConflictException({
          code: ErrorCode.PARTNER_SUSPENDED,
          message: 'The partner is already suspended',
        });
      }
      const [{ pending }] = await tx.$queryRaw<{ pending: number }[]>`
        SELECT count(*)::int AS pending FROM policy_violation p
        WHERE p.hotel_partner_id = ${current.hotelPartnerId}::uuid
          AND ${latestSuspensionSql} = 'SUSPENSION_REQUESTED'`;
      if (pending) {
        throw new ConflictException({
          code: ErrorCode.SUSPENSION_REQUEST_PENDING,
          message: 'The partner already has a suspension request waiting',
        });
      }
      await this.record(tx, id, AuditAction.SUSPENSION_REQUESTED, user, meta, {
        reason: input.reason,
      } satisfies ReasonValue);
    });
    return this.detail(id);
  }

  async evidenceLink(id: string, index: number): Promise<EvidenceLink> {
    const opened = isUuid(id)
      ? await this.prisma.auditLog.findFirst({
          where: {
            entityType: CASE_ENTITY,
            entityId: id,
            action: AuditAction.VIOLATION_OPENED,
          },
          select: { newValue: true },
        })
      : null;
    const fileId = opened
      ? (JSON.parse(opened.newValue ?? '{}') as Partial<OpenedValue>)
          .evidence?.[index]
      : undefined;
    if (!fileId) throw notFound();
    return {
      url: this.storage.signedUrl(fileId, LINK_SECONDS),
      expiresAt: new Date(Date.now() + LINK_SECONDS * 1000).toISOString(),
    };
  }

  private async findOpen(id: string) {
    const row = isUuid(id)
      ? await this.prisma.policyViolation.findUnique({
          where: { policyViolationId: id },
          select: { status: true, hotelPartnerId: true },
        })
      : null;
    if (!row) throw notFound();
    if (!(OPEN_STATUSES as readonly string[]).includes(row.status)) {
      throw this.statusConflict();
    }
    return row;
  }

  private statusConflict() {
    return new ConflictException({
      code: ErrorCode.VIOLATION_STATUS_CONFLICT,
      message:
        'The case is closed, or the change is not allowed from its status',
    });
  }

  private record(
    tx: Prisma.TransactionClient,
    caseId: string,
    action: AuditAction,
    user: AuthUser,
    meta: RequestMeta,
    value: object,
  ) {
    return tx.auditLog.create({
      data: {
        action,
        platformManagerId: user.accountId,
        entityType: CASE_ENTITY,
        entityId: caseId,
        newValue: JSON.stringify(value),
        ipAddress: meta.ip,
      },
    });
  }

  /** Cases with their hotel, evidence, timeline and latest suspension request, from their audit events. */
  private async views(rows: CaseRow[]): Promise<PolicyViolation[]> {
    if (!rows.length) return [];
    const events = await this.prisma.auditLog.findMany({
      where: {
        entityType: CASE_ENTITY,
        entityId: { in: rows.map((r) => r.policyViolationId) },
      },
      orderBy: [{ createdAt: 'asc' }, { auditLogId: 'asc' }],
      select: eventSelect,
    });
    const hotelIds = events
      .filter((e) => e.action === (AuditAction.VIOLATION_OPENED as string))
      .map((e) => valueOf<OpenedValue>(e).hotelId)
      .filter((h): h is string => !!h);
    const hotels = new Map(
      (
        await this.prisma.hotel.findMany({
          where: { hotelId: { in: hotelIds } },
          select: { hotelId: true, name: true },
        })
      ).map((h) => [h.hotelId, h.name]),
    );

    return rows.map((r) => {
      const own = events.filter((e) => e.entityId === r.policyViolationId);
      const opened = own.find(
        (e) => e.action === (AuditAction.VIOLATION_OPENED as string),
      );
      const openedValue = opened ? valueOf<OpenedValue>(opened) : {};
      const hotelId = openedValue.hotelId ?? null;
      const suspension = own.filter((e) =>
        (SUSPENSION_EVENTS as string[]).includes(e.action),
      );
      const last = suspension[suspension.length - 1];
      const request = [...suspension]
        .reverse()
        .find((e) => e.action === (AuditAction.SUSPENSION_REQUESTED as string));
      const decision = last && last !== request ? last : null;
      return {
        id: r.policyViolationId,
        partner: {
          id: r.hotelPartner.hotelPartnerId,
          name: r.hotelPartner.partnerName,
          status: r.hotelPartner.status,
        },
        hotel: hotelId
          ? { id: hotelId, name: hotels.get(hotelId) ?? '' }
          : null,
        type: r.violationType as PolicyViolation['type'],
        severity: r.severity,
        status: r.status,
        description: r.description ?? '',
        openedBy: r.platformManager
          ? {
              id: r.platformManager.platformManagerId,
              fullName: r.platformManager.userAccount.fullName,
            }
          : null,
        createdAt: r.createdAt.toISOString(),
        resolvedAt: r.resolvedAt?.toISOString() ?? null,
        suspensionRequest:
          request && last
            ? {
                id: request.auditLogId,
                status:
                  SUSPENSION_STATUS_OF[
                    last.action as keyof typeof SUSPENSION_STATUS_OF
                  ],
                reason: valueOf<ReasonValue>(request).reason ?? '',
                requestedBy: byOf(request),
                requestedAt: request.createdAt.toISOString(),
                decidedBy: decision ? byOf(decision) : null,
                decidedAt: decision?.createdAt.toISOString() ?? null,
                decisionReason: decision
                  ? (valueOf<ReasonValue>(decision).reason ?? null)
                  : null,
              }
            : null,
        evidence: (openedValue.evidence ?? []).map((fileId, index) => ({
          index,
          fileName: fileId.split('/').pop() ?? fileId,
        })),
        timeline: own.map((e) => {
          const v = valueOf<UpdatedValue & ReasonValue>(e);
          return {
            action: e.action,
            at: e.createdAt.toISOString(),
            by: byOf(e),
            note: v.note ?? v.reason ?? null,
            status: (v.status as PolicyViolation['status']) ?? null,
            severity: (v.severity as PolicyViolation['severity']) ?? null,
          };
        }),
      };
    });
  }
}

/** The list shows a case without its evidence and timeline. */
const toSummary = (v: PolicyViolation): PolicyViolationSummary => ({
  id: v.id,
  partner: v.partner,
  hotel: v.hotel,
  type: v.type,
  severity: v.severity,
  status: v.status,
  description: v.description,
  openedBy: v.openedBy,
  createdAt: v.createdAt,
  resolvedAt: v.resolvedAt,
  suspensionRequest: v.suspensionRequest,
});
