import { BadRequestException } from '@nestjs/common';
import type { AuthUser } from '../../../common/decorators/current-user.decorator';
import type { PrismaService } from '../../../prisma/prisma.service';
import type { AuditService } from '../../audit/audit.service';
import type { StorageService } from '../../storage/storage.service';
import type { AuthService } from './auth.service';
import { ProfileService } from './profile.service';

const ACCOUNT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OWN_FOLDER = `stayreco/avatars/${ACCOUNT}`;

const user = (role: AuthUser['role']): AuthUser => ({
  accountId: ACCOUNT,
  role,
  sessionId: 'session',
});

/** Mocks for one account whose current avatar is `avatarUrl`; storage keys are the URL without its host. */
function createService(avatarUrl: string | null = null) {
  const update = jest.fn(() => Promise.resolve({}));
  const tx = {
    $executeRaw: jest.fn(() => Promise.resolve(1)),
    userAccount: {
      findUniqueOrThrow: jest.fn(() => Promise.resolve({ avatarUrl })),
      update,
    },
  };
  const prisma = {
    userAccount: { update },
    $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
  };
  const storage = {
    uploadImage: jest.fn((_file: Buffer, folder: string) =>
      Promise.resolve({
        storageKey: `${folder}/new`,
        url: `https://cdn/${folder}/new.png`,
      }),
    ),
    imageKeyFromUrl: (url: string) =>
      url.startsWith('https://cdn/')
        ? url.slice('https://cdn/'.length, url.lastIndexOf('.'))
        : null,
    deleteImage: jest.fn(() => Promise.resolve()),
  };
  const audit = { log: jest.fn(() => Promise.resolve()) };
  const auth = { me: jest.fn(() => Promise.resolve({ id: ACCOUNT })) };
  const service = new ProfileService(
    prisma as unknown as PrismaService,
    storage as unknown as StorageService,
    audit as unknown as AuditService,
    auth as unknown as AuthService,
  );
  return { service, update, storage, audit };
}

const expectValidation = async (
  promise: Promise<unknown>,
  details: { field: string }[],
) => {
  await expect(promise).rejects.toBeInstanceOf(BadRequestException);
  await expect(promise).rejects.toMatchObject({
    response: { code: 'VALIDATION_ERROR', details },
  });
};

describe('ProfileService.update', () => {
  it('saves the customer fields in the customer row and clears those sent as null', async () => {
    const { service, update } = createService();
    await service.update(
      user('CUSTOMER'),
      { fullName: 'An', dateOfBirth: '1995-04-30', gender: null },
      {},
    );
    expect(update).toHaveBeenCalledWith({
      where: { userAccountId: ACCOUNT },
      data: {
        fullName: 'An',
        phone: undefined,
        customer: {
          update: {
            dateOfBirth: new Date('1995-04-30T00:00:00Z'),
            gender: null,
            nationality: undefined,
          },
        },
      },
    });
  });

  it('writes the partner name and keeps the contact phone equal to the account phone', async () => {
    const { service, update } = createService();
    await service.update(
      user('HOTEL_PARTNER'),
      { companyName: 'Sea Co', phone: '0912345678' },
      {},
    );
    expect(update).toHaveBeenCalledWith({
      where: { userAccountId: ACCOUNT },
      data: {
        fullName: undefined,
        phone: '0912345678',
        hotelPartner: {
          update: { partnerName: 'Sea Co', contactPhone: '0912345678' },
        },
      },
    });
  });

  it('leaves the role tables alone when only account fields change', async () => {
    const { service, update } = createService();
    await service.update(user('CUSTOMER'), { phone: null }, {});
    await service.update(user('HOTEL_STAFF'), { fullName: 'Lan' }, {});
    expect(update.mock.calls).toEqual([
      [
        {
          where: { userAccountId: ACCOUNT },
          data: { fullName: undefined, phone: null },
        },
      ],
      [
        {
          where: { userAccountId: ACCOUNT },
          data: { fullName: 'Lan', phone: undefined },
        },
      ],
    ]);
  });

  it('refuses the fields of another role, naming each of them', async () => {
    const { service, update } = createService();
    await expectValidation(
      service.update(
        user('HOTEL_PARTNER'),
        { fullName: 'B', gender: 'MALE', nationality: 'VN' },
        {},
      ),
      [{ field: 'gender' }, { field: 'nationality' }],
    );
    await expectValidation(
      service.update(user('HOTEL_STAFF'), { companyName: 'X' }, {}),
      [{ field: 'companyName' }],
    );
    expect(update).not.toHaveBeenCalled();
  });

  it('does not let a partner clear its phone', async () => {
    const { service, update } = createService();
    await expectValidation(
      service.update(user('HOTEL_PARTNER'), { phone: null }, {}),
      [{ field: 'phone' }],
    );
    expect(update).not.toHaveBeenCalled();
  });

  it('records the names of the changed fields, not their values', async () => {
    const { service, audit } = createService();
    await service.update(
      user('CUSTOMER'),
      { phone: '0912345678', nationality: 'VN' },
      { ip: '1.2.3.4' },
    );
    expect(audit.log).toHaveBeenCalledWith(
      'PROFILE_UPDATED',
      ACCOUNT,
      { ip: '1.2.3.4' },
      { fields: ['phone', 'nationality'] },
    );
  });
});

describe('ProfileService avatar', () => {
  const file = Buffer.from('png');

  it('uploads into the account folder and deletes the previous file of that folder', async () => {
    const { service, update, storage } = createService(
      `https://cdn/${OWN_FOLDER}/old.png`,
    );
    await service.uploadAvatar(user('CUSTOMER'), file, {});
    expect(storage.uploadImage).toHaveBeenCalledWith(file, OWN_FOLDER);
    expect(update).toHaveBeenCalledWith({
      where: { userAccountId: ACCOUNT },
      data: { avatarUrl: `https://cdn/${OWN_FOLDER}/new.png` },
    });
    expect(storage.deleteImage).toHaveBeenCalledWith(`${OWN_FOLDER}/old`);
  });

  it('never deletes an avatar file it did not upload for this account', async () => {
    for (const previous of [
      'https://example.com/seed-avatar.png',
      'https://cdn/stayreco/avatars/someone-else/old.png',
      'https://cdn/stayreco/hotels/h1/img.png',
    ]) {
      const { service, storage } = createService(previous);
      await service.uploadAvatar(user('CUSTOMER'), file, {});
      expect(storage.deleteImage).not.toHaveBeenCalled();
    }
  });

  it('deletes the new file when its URL cannot be saved', async () => {
    const { service, update, storage } = createService();
    update.mockRejectedValueOnce(new Error('db down'));
    await expect(
      service.uploadAvatar(user('CUSTOMER'), file, {}),
    ).rejects.toThrow('db down');
    expect(storage.deleteImage).toHaveBeenCalledWith(`${OWN_FOLDER}/new`);
  });

  it('clears the avatar and deletes its file', async () => {
    const { service, update, storage, audit } = createService(
      `https://cdn/${OWN_FOLDER}/old.png`,
    );
    await service.removeAvatar(user('HOTEL_PARTNER'), {});
    expect(update).toHaveBeenCalledWith({
      where: { userAccountId: ACCOUNT },
      data: { avatarUrl: null },
    });
    expect(storage.deleteImage).toHaveBeenCalledWith(`${OWN_FOLDER}/old`);
    expect(audit.log).toHaveBeenCalledTimes(1);
  });

  it('does nothing more when there is no avatar to remove', async () => {
    const { service, storage, audit } = createService(null);
    await service.removeAvatar(user('CUSTOMER'), {});
    expect(storage.deleteImage).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });
});
