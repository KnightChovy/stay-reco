import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../decorators/current-user.decorator';
import { HotelAccessService } from './hotel-access.service';

const HOTEL = '11111111-1111-4111-8111-111111111111';
const OTHER_HOTEL = '22222222-2222-4222-8222-222222222222';
const OWNER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const STAFF = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const user = (accountId: string, role: AuthUser['role']): AuthUser => ({
  accountId,
  role,
  sessionId: 'session',
});

/** In-memory stand-in for the two Prisma queries the service makes. */
function createService(partnerStatus = 'APPROVED') {
  const prisma = {
    hotel: {
      findFirst: jest.fn(
        ({ where }: { where: { hotelId: string; hotelPartnerId: string } }) =>
          Promise.resolve(
            where.hotelId === HOTEL && where.hotelPartnerId === OWNER
              ? { hotelPartner: { status: partnerStatus } }
              : null,
          ),
      ),
    },
    hotelStaff: {
      findFirst: jest.fn(
        ({ where }: { where: { hotelStaffId: string; hotelId: string } }) =>
          Promise.resolve(
            where.hotelStaffId === STAFF && where.hotelId === HOTEL
              ? { permissions: ['FRONT_DESK'] }
              : null,
          ),
      ),
    },
  };
  return {
    service: new HotelAccessService(prisma as unknown as PrismaService),
    prisma,
  };
}

const expectCode = async (
  promise: Promise<unknown>,
  type: unknown,
  code: string,
) => {
  await expect(promise).rejects.toBeInstanceOf(type);
  await expect(promise).rejects.toMatchObject({ response: { code } });
};

describe('HotelAccessService', () => {
  it('lets the owner do owner-level actions', async () => {
    const { service } = createService();
    await expect(
      service.assert(user(OWNER, 'HOTEL_PARTNER'), HOTEL, 'owner'),
    ).resolves.toMatchObject({ hotelId: HOTEL, role: 'OWNER' });
  });

  it('lets a suspended partner read its hotel but not change it', async () => {
    const { service } = createService('SUSPENDED');
    const owner = user(OWNER, 'HOTEL_PARTNER');
    await expect(service.assert(owner, HOTEL, 'member')).resolves.toMatchObject(
      { role: 'OWNER', partnerSuspended: true },
    );
    await expectCode(
      service.assert(owner, HOTEL, 'owner'),
      ForbiddenException,
      'PARTNER_SUSPENDED',
    );
  });

  it("hides another partner's hotel as not found", async () => {
    const { service } = createService();
    await expectCode(
      service.assert(user(OWNER, 'HOTEL_PARTNER'), OTHER_HOTEL, 'member'),
      NotFoundException,
      'HOTEL_NOT_FOUND',
    );
  });

  it('lets assigned staff read as members, with their permissions', async () => {
    const { service } = createService();
    await expect(
      service.assert(user(STAFF, 'HOTEL_STAFF'), HOTEL, 'member', 'FRONT_DESK'),
    ).resolves.toMatchObject({ role: 'STAFF', permissions: ['FRONT_DESK'] });
  });

  it('forbids staff from owner-level actions', async () => {
    const { service } = createService();
    await expectCode(
      service.assert(user(STAFF, 'HOTEL_STAFF'), HOTEL, 'owner'),
      ForbiddenException,
      'FORBIDDEN',
    );
  });

  it('forbids staff without the required permission', async () => {
    const { service } = createService();
    await expectCode(
      service.assert(user(STAFF, 'HOTEL_STAFF'), HOTEL, 'member', 'REFUND'),
      ForbiddenException,
      'FORBIDDEN',
    );
  });

  it('hides hotels from staff of another hotel and from other roles', async () => {
    const { service } = createService();
    await expectCode(
      service.assert(user(STAFF, 'HOTEL_STAFF'), OTHER_HOTEL, 'member'),
      NotFoundException,
      'HOTEL_NOT_FOUND',
    );
    await expectCode(
      service.assert(user(OWNER, 'CUSTOMER'), HOTEL, 'member'),
      NotFoundException,
      'HOTEL_NOT_FOUND',
    );
  });

  it('rejects a malformed hotel id without querying the database', async () => {
    const { service, prisma } = createService();
    await expectCode(
      service.assert(user(OWNER, 'HOTEL_PARTNER'), 'not-a-uuid', 'member'),
      NotFoundException,
      'HOTEL_NOT_FOUND',
    );
    expect(prisma.hotel.findFirst).not.toHaveBeenCalled();
  });
});
