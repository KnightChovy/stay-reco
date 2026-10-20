import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  REQUIRED_VERIFICATION_DOCUMENTS,
  type SubmitVerificationInput,
  type VerificationFileLink,
  type VerificationListQuery,
  type VerificationRequest,
  type VerificationRequestSummary,
} from '@stayreco/shared';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import type { RequestMeta } from '../../common/decorators/request-meta.decorator';
import { FieldCipher } from '../../common/crypto/field-cipher';
import { escapeLike } from '../../common/db/like';
import { lockHotel } from '../../common/db/locks';
import { ErrorCode } from '../../common/errors/error-code';
import {
  HotelAccessService,
  isUuid,
} from '../../common/hotel-access/hotel-access.service';
import { Paginated } from '../../common/http/api-response';
import { pageArgs } from '../../common/http/pagination';
import type { Env } from '../../config/env';
import type {
  Prisma,
  VerificationRequestType,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, AuditService } from '../audit/audit.service';
import { StorageService } from '../storage/storage.service';
import { isOwnVerificationFile } from './verification-documents';
import {
  type VerificationOutcome,
  VerificationMailer,
} from './verification-mailer';
import {
  notificationEmailOf,
  requestInclude,
  summaryInclude,
  toSnapshotRows,
  toVerificationRequest,
  toVerificationSummary,
} from './verification.mapper';

/** Signed links to private documents expire quickly; the client asks for a new one when needed. */
const FILE_LINK_SECONDS = 5 * 60;

const notFound = () =>
  new NotFoundException({
    code: ErrorCode.VERIFICATION_NOT_FOUND,
    message: 'Verification request or document not found',
  });

const hotelNotFound = () =>
  new NotFoundException({
    code: ErrorCode.HOTEL_NOT_FOUND,
    message: 'Hotel not found',
  });

const pending = (message: string) =>
  new ConflictException({ code: ErrorCode.VERIFICATION_PENDING, message });

const hotelStatusConflict = (message: string) =>
  new ConflictException({ code: ErrorCode.HOTEL_STATUS_CONFLICT, message });

type Decision = 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';

const DECISION_AUDIT: Record<Decision, AuditAction> = {
  APPROVED: AuditAction.VERIFICATION_APPROVED,
  REJECTED: AuditAction.VERIFICATION_REJECTED,
  NEEDS_REVISION: AuditAction.VERIFICATION_CHANGES_REQUESTED,
};

/**
 * Hotel verification (SRS UC50/UC51, contract §2): the partner submits the 4-step wizard, a platform manager decides.
 *   hotel:   DRAFT --submit--> PENDING_VERIFICATION --approve--> ACTIVE; reject / request changes --> DRAFT
 *   request: PENDING --> APPROVED | REJECTED | NEEDS_REVISION (resubmitting creates a new request)
 * ACTIVE hotels are never taken offline here: UPDATE and RENEWAL requests leave the hotel ACTIVE whatever the outcome.
 */
@Injectable()
export class VerificationService {
  private readonly cipher: FieldCipher;

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: HotelAccessService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
    private readonly mailer: VerificationMailer,
    config: ConfigService<Env, true>,
  ) {
    this.cipher = new FieldCipher(
      config.get('BENEFICIARY_ENCRYPTION_KEY', { infer: true }),
    );
  }

  /** `hotelId` was checked by `HotelAccessRequired('owner')`. The request type is derived from the hotel. */
  async submit(
    user: AuthUser,
    hotelId: string,
    input: SubmitVerificationInput,
    meta: RequestMeta,
  ): Promise<VerificationRequest> {
    this.assertDocuments(user.accountId, input);

    const requestId = await this.prisma.$transaction(async (tx) => {
      // One submission at a time per hotel, so two clicks cannot create two pending requests.
      await lockHotel(tx, hotelId);
      const hotel = await tx.hotel.findUniqueOrThrow({
        where: { hotelId },
        select: { status: true },
      });
      const open = await tx.hotelVerificationRequest.count({
        where: { hotelId, status: 'PENDING' },
      });
      if (open) throw pending('A verification request is already waiting');

      const requestType = await this.requestTypeFor(tx, hotelId, hotel.status);
      const request = await tx.hotelVerificationRequest.create({
        data: { hotelId, requestType, status: 'PENDING' },
        select: { verificationRequestId: true },
      });
      const { verificationRequestId } = request;
      await tx.hotelProperties.createMany({
        data: toSnapshotRows(input, this.cipher).map((row) => ({
          ...row,
          hotelId,
          verificationRequestId,
        })),
      });
      await tx.hotelVerificationDocument.createMany({
        data: input.documents.map((d) => ({
          verificationRequestId,
          documentType: d.documentType,
          fileUrl: d.fileId,
        })),
      });
      if (requestType === 'INITIAL') {
        await tx.hotel.update({
          where: { hotelId },
          data: { status: 'PENDING_VERIFICATION' },
        });
      }
      return verificationRequestId;
    });

    await this.audit.log(
      AuditAction.VERIFICATION_SUBMITTED,
      user.accountId,
      meta,
      { hotelId, verificationRequestId: requestId },
    );
    return this.view(requestId, true);
  }

  /** The hotel's requests, newest first, with reasons; account numbers masked. */
  async history(hotelId: string): Promise<VerificationRequest[]> {
    const requests = await this.prisma.hotelVerificationRequest.findMany({
      where: { hotelId },
      include: requestInclude,
      orderBy: { createdAt: 'desc' },
    });
    return requests.map((r) =>
      toVerificationRequest(r, this.cipher, { fullAccountNumber: false }),
    );
  }

  /** Platform manager queue. `search` matches the hotel name. */
  async queue(
    query: VerificationListQuery,
  ): Promise<Paginated<VerificationRequestSummary>> {
    const where: Prisma.HotelVerificationRequestWhereInput = {
      status: query.status,
      ...(query.search && {
        hotel: {
          name: { contains: escapeLike(query.search), mode: 'insensitive' },
        },
      }),
    };
    const [requests, total] = await Promise.all([
      this.prisma.hotelVerificationRequest.findMany({
        where,
        include: summaryInclude,
        orderBy: {
          createdAt: query.sort === 'submitted-desc' ? 'desc' : 'asc',
        },
        ...pageArgs(query),
      }),
      this.prisma.hotelVerificationRequest.count({ where }),
    ]);
    return Paginated.of(requests.map(toVerificationSummary), {
      ...query,
      total,
    });
  }

  /** Full request, account number included: platform managers and the hotel owner only. */
  async detail(user: AuthUser, requestId: string) {
    const request = isUuid(requestId)
      ? await this.prisma.hotelVerificationRequest.findUnique({
          where: { verificationRequestId: requestId },
          select: { hotelId: true },
        })
      : null;
    await this.assertCanSee(user, request?.hotelId);
    return this.view(requestId, true);
  }

  /** Short-lived link to a private document (contract D5). */
  async fileLink(
    user: AuthUser,
    documentId: string,
  ): Promise<VerificationFileLink> {
    const document = isUuid(documentId)
      ? await this.prisma.hotelVerificationDocument.findUnique({
          where: { verificationDocumentId: documentId },
          select: {
            fileUrl: true,
            verificationRequest: { select: { hotelId: true } },
          },
        })
      : null;
    await this.assertCanSee(user, document?.verificationRequest.hotelId);
    return {
      url: this.storage.signedUrl(document!.fileUrl, FILE_LINK_SECONDS),
      expiresAt: new Date(Date.now() + FILE_LINK_SECONDS * 1000).toISOString(),
    };
  }

  /**
   * Approve / reject / request changes. Only a PENDING request can be decided (a second manager gets
   * VERIFICATION_ALREADY_DECIDED). The first approved hotel makes the partner APPROVED (contract D6).
   */
  async decide(
    user: AuthUser,
    requestId: string,
    decision: Decision,
    reason: string | null,
    meta: RequestMeta,
  ): Promise<VerificationRequest> {
    if (!isUuid(requestId)) throw notFound();
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.hotelVerificationRequest.updateMany({
        where: { verificationRequestId: requestId, status: 'PENDING' },
        data: {
          status: decision,
          platformManagerId: user.accountId,
          reviewedAt: new Date(),
          notes: reason,
        },
      });
      const request = await tx.hotelVerificationRequest.findUnique({
        where: { verificationRequestId: requestId },
        select: {
          hotelId: true,
          requestType: true,
          hotel: { select: { hotelPartnerId: true } },
        },
      });
      if (!request) throw notFound();
      if (!count) {
        throw new ConflictException({
          code: ErrorCode.VERIFICATION_ALREADY_DECIDED,
          message: 'The request was already decided',
        });
      }
      if (request.requestType !== 'INITIAL') return;

      if (decision === 'APPROVED') {
        // Locked read: a suspension cannot land between this check and the activation below.
        const [partner] = await tx.$queryRaw<{ status: string }[]>`
          SELECT status::text AS status FROM hotel_partner
          WHERE hotel_partner_id = ${request.hotel.hotelPartnerId}::uuid FOR UPDATE`;
        // A suspended partner keeps read-only access (#25), so its hotel must not go live; the manager can still
        // reject or request changes. Throwing rolls back the decision above.
        if (partner?.status === 'SUSPENDED') {
          throw new ConflictException({
            code: ErrorCode.PARTNER_SUSPENDED,
            message:
              'The partner is suspended: lift the suspension before approving',
          });
        }
      }

      // Conditional on PENDING_VERIFICATION, so a hotel suspended meanwhile is not reactivated.
      await tx.hotel.updateMany({
        where: { hotelId: request.hotelId, status: 'PENDING_VERIFICATION' },
        data: { status: decision === 'APPROVED' ? 'ACTIVE' : 'DRAFT' },
      });
      if (decision === 'APPROVED') {
        await tx.hotelPartner.updateMany({
          where: {
            hotelPartnerId: request.hotel.hotelPartnerId,
            status: { in: ['PENDING', 'REJECTED'] },
          },
          data: { status: 'APPROVED' },
        });
      }
    });

    const result = await this.loadRequest(requestId);
    await this.audit.log(DECISION_AUDIT[decision], user.accountId, meta, {
      hotelId: result.hotelId,
      verificationRequestId: requestId,
      reason,
    });
    await this.notify(result, decision, reason);
    return toVerificationRequest(result, this.cipher, {
      fullAccountNumber: true,
    });
  }

  /**
   * A platform manager asks an ACTIVE hotel to verify again (contract D9), e.g. an expired license. Creates a
   * RENEWAL request already in NEEDS_REVISION with the reason; the hotel stays ACTIVE meanwhile.
   */
  async requestReverification(
    user: AuthUser,
    hotelId: string,
    reason: string,
    meta: RequestMeta,
  ): Promise<VerificationRequest> {
    if (!isUuid(hotelId)) throw hotelNotFound();
    const requestId = await this.prisma.$transaction(async (tx) => {
      if (!(await lockHotel(tx, hotelId))) throw hotelNotFound();
      const hotel = await tx.hotel.findUniqueOrThrow({
        where: { hotelId },
        select: { status: true },
      });
      if (hotel.status !== 'ACTIVE') {
        throw hotelStatusConflict('Only an active hotel can be re-verified');
      }
      const latest = await tx.hotelVerificationRequest.findFirst({
        where: { hotelId },
        orderBy: { createdAt: 'desc' },
        select: { status: true, requestType: true },
      });
      if (latest?.status === 'PENDING') {
        throw pending('A verification request is already waiting');
      }
      if (
        latest?.requestType === 'RENEWAL' &&
        latest.status === 'NEEDS_REVISION'
      ) {
        throw pending('A re-verification is already requested');
      }
      const request = await tx.hotelVerificationRequest.create({
        data: {
          hotelId,
          requestType: 'RENEWAL',
          status: 'NEEDS_REVISION',
          platformManagerId: user.accountId,
          reviewedAt: new Date(),
          notes: reason,
        },
        select: { verificationRequestId: true },
      });
      return request.verificationRequestId;
    });

    const result = await this.loadRequest(requestId);
    await this.audit.log(
      AuditAction.VERIFICATION_REVERIFICATION_REQUESTED,
      user.accountId,
      meta,
      { hotelId, verificationRequestId: requestId, reason },
    );
    await this.notify(result, 'REVERIFICATION', reason);
    return toVerificationRequest(result, this.cipher, {
      fullAccountNumber: true,
    });
  }

  /** DRAFT → INITIAL; ACTIVE → RENEWAL when a re-verification is open, otherwise UPDATE. */
  private async requestTypeFor(
    tx: Prisma.TransactionClient,
    hotelId: string,
    status: string,
  ): Promise<VerificationRequestType> {
    if (status === 'DRAFT') return 'INITIAL';
    if (status !== 'ACTIVE') {
      throw hotelStatusConflict(`A ${status} hotel cannot be verified`);
    }
    const latest = await tx.hotelVerificationRequest.findFirst({
      where: { hotelId },
      orderBy: { createdAt: 'desc' },
      select: { status: true, requestType: true },
    });
    return latest?.requestType === 'RENEWAL' &&
      latest.status === 'NEEDS_REVISION'
      ? 'RENEWAL'
      : 'UPDATE';
  }

  /** Files must be ones this partner uploaded, and the required documents must all be there (contract D10). */
  private assertDocuments(partnerId: string, input: SubmitVerificationInput) {
    const foreign = input.documents
      .map((d, i) => ({ d, i }))
      .filter(({ d }) => !isOwnVerificationFile(partnerId, d.fileId));
    if (foreign.length) {
      throw new BadRequestException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        details: foreign.map(({ i }) => ({
          field: `documents.${i}.fileId`,
          message: 'Unknown file: upload it first',
        })),
      });
    }
    const missing = REQUIRED_VERIFICATION_DOCUMENTS.filter(
      (type) => !input.documents.some((d) => d.documentType === type),
    );
    if (missing.length) {
      throw new BadRequestException({
        code: ErrorCode.VERIFICATION_DOCUMENTS_MISSING,
        message: `Missing documents: ${missing.join(', ')}`,
        details: missing.map((type) => ({
          field: 'documents',
          message: `${type} is required`,
        })),
      });
    }
  }

  /** Platform managers see every request; partners only those of hotels they own (staff never). */
  private async assertCanSee(user: AuthUser, hotelId: string | undefined) {
    if (user.role === 'PLATFORM_MANAGER') {
      if (!hotelId) throw notFound();
      return;
    }
    await this.access.assertResource(user, hotelId, 'owner-view', notFound);
  }

  private async view(requestId: string, fullAccountNumber: boolean) {
    return toVerificationRequest(
      await this.loadRequest(requestId),
      this.cipher,
      {
        fullAccountNumber,
      },
    );
  }

  private loadRequest(requestId: string) {
    return this.prisma.hotelVerificationRequest.findUniqueOrThrow({
      where: { verificationRequestId: requestId },
      include: requestInclude,
    });
  }

  /** Decisions go to the request's notification email; a re-verification uses the latest one given, or the partner. */
  private async notify(
    request: Awaited<ReturnType<VerificationService['loadRequest']>>,
    outcome: VerificationOutcome,
    reason: string | null,
  ) {
    let to = notificationEmailOf(request);
    if (!to) {
      const previous = await this.prisma.hotelVerificationRequest.findFirst({
        where: {
          hotelId: request.hotelId,
          hotelProperties: { some: { propertyKey: 'legal.notificationEmail' } },
        },
        orderBy: { createdAt: 'desc' },
        include: requestInclude,
      });
      to = previous ? notificationEmailOf(previous) : null;
    }
    if (!to) {
      const owner = await this.prisma.hotel.findUniqueOrThrow({
        where: { hotelId: request.hotelId },
        select: { hotelPartner: { select: { contactEmail: true } } },
      });
      to = owner.hotelPartner.contactEmail;
    }
    await this.mailer.send(to, outcome, request.hotel.name, reason);
  }
}
