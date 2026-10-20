import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { StaffMember, StaffPermission } from '@stayreco/shared';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import type { RequestMeta } from '../../common/decorators/request-meta.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import {
  HotelAccessService,
  isUuid,
} from '../../common/hotel-access/hotel-access.service';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, AuditService } from '../audit/audit.service';

const staffNotFound = () =>
  new NotFoundException({
    code: ErrorCode.STAFF_NOT_FOUND,
    message: 'Staff member not found',
  });

const statusConflict = (message: string) =>
  new ConflictException({ code: ErrorCode.STAFF_STATUS_CONFLICT, message });

const staffSelect = {
  hotelStaffId: true,
  position: true,
  permissions: true,
  userAccount: { select: { fullName: true, email: true, status: true } },
} satisfies Prisma.HotelStaffSelect;

type StaffRow = Prisma.HotelStaffGetPayload<{ select: typeof staffSelect }>;

const toStaffMember = (s: StaffRow): StaffMember => ({
  id: s.hotelStaffId,
  fullName: s.userAccount.fullName,
  email: s.userAccount.email,
  position: s.position,
  status: s.userAccount.status,
  permissions: s.permissions,
});

/**
 * The partner's view of its staff: permission groups (SRS UC62) and turning accounts off and on. Inviting staff is
 * `POST /auth/invitations/staff`. Deactivation uses its own status (DEACTIVATED), so the partner can never lift an
 * admin suspension (SUSPENDED) by "activating" someone.
 */
@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: HotelAccessService,
    private readonly audit: AuditService,
  ) {}

  /** `hotelId` was checked by `HotelAccessRequired`. Pending invitations are listed too (status INVITED). */
  async list(hotelId: string): Promise<StaffMember[]> {
    const staff = await this.prisma.hotelStaff.findMany({
      where: { hotelId },
      select: staffSelect,
      orderBy: { userAccount: { fullName: 'asc' } },
    });
    return staff.map(toStaffMember);
  }

  /** Replaces the permission groups; they apply from the staff member's next request. */
  async setPermissions(
    user: AuthUser,
    staffId: string,
    permissions: StaffPermission[],
    meta: RequestMeta,
  ): Promise<StaffMember> {
    await this.findForOwner(user, staffId);
    const staff = await this.prisma.hotelStaff.update({
      where: { hotelStaffId: staffId },
      data: { permissions },
      select: staffSelect,
    });
    await this.audit.log(
      AuditAction.STAFF_PERMISSIONS_CHANGED,
      user.accountId,
      meta,
      { staffId, permissions },
    );
    return toStaffMember(staff);
  }

  /** ACTIVE → DEACTIVATED, and every session is revoked so the staff member is signed out at once. */
  async deactivate(
    user: AuthUser,
    staffId: string,
    meta: RequestMeta,
  ): Promise<StaffMember> {
    await this.findForOwner(user, staffId);
    await this.prisma.$transaction(async (tx) => {
      // Conditional update: the status cannot change between the check and the write.
      const { count } = await tx.userAccount.updateMany({
        where: { userAccountId: staffId, status: 'ACTIVE' },
        data: { status: 'DEACTIVATED' },
      });
      if (!count) {
        throw statusConflict('Only an active staff member can be deactivated');
      }
      await tx.authSession.updateMany({
        where: { userAccountId: staffId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
    await this.audit.log(AuditAction.STAFF_DEACTIVATED, user.accountId, meta, {
      staffId,
    });
    return this.load(staffId);
  }

  /** DEACTIVATED → ACTIVE. A suspended account (admin decision) is not touched. */
  async activate(
    user: AuthUser,
    staffId: string,
    meta: RequestMeta,
  ): Promise<StaffMember> {
    await this.findForOwner(user, staffId);
    const { count } = await this.prisma.userAccount.updateMany({
      where: { userAccountId: staffId, status: 'DEACTIVATED' },
      data: { status: 'ACTIVE' },
    });
    if (!count) {
      throw statusConflict('Only a deactivated staff member can be activated');
    }
    await this.audit.log(AuditAction.STAFF_ACTIVATED, user.accountId, meta, {
      staffId,
    });
    return this.load(staffId);
  }

  private async load(staffId: string): Promise<StaffMember> {
    return toStaffMember(
      await this.prisma.hotelStaff.findUniqueOrThrow({
        where: { hotelStaffId: staffId },
        select: staffSelect,
      }),
    );
  }

  /** Only the owner manages staff; outsiders get STAFF_NOT_FOUND, other staff 403. */
  private async findForOwner(user: AuthUser, staffId: string) {
    const staff = isUuid(staffId)
      ? await this.prisma.hotelStaff.findUnique({
          where: { hotelStaffId: staffId },
          select: { hotelId: true },
        })
      : null;
    await this.access.assertResource(
      user,
      staff?.hotelId,
      'owner',
      staffNotFound,
    );
  }
}
