import { randomUUID } from 'crypto';
import { createTestApp, FILES } from './helpers';

describe('Hotel verification (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  const partnerWithHotel = async (
    email = 'owner@hotel.test',
    name = 'Riverside',
  ) => {
    const partner = await t.signIn('HOTEL_PARTNER', email);
    const res = await t
      .api()
      .post('/api/v1/hotels')
      .set(auth(partner.token))
      .send({
        name,
        address: '1 Bạch Đằng',
        city: 'Đà Nẵng',
        email: 'contact@hotel.test',
      })
      .expect(201);
    return { ...partner, hotelId: res.body.data.id as string };
  };

  const uploadDocument = async (token: string) =>
    (
      await t
        .api()
        .post('/api/v1/uploads/verification-documents')
        .set(auth(token))
        .attach('file', FILES.pdf, 'doc.pdf')
        .expect(201)
    ).body.data.fileId as string;

  /** The 4-step wizard with the three required documents uploaded by `token`. */
  const wizard = async (
    token: string,
    overrides: Record<string, unknown> = {},
  ) => {
    const documents: { documentType: string; fileId: string }[] = [];
    for (const documentType of [
      'BUSINESS_LICENSE',
      'FIRE_SAFETY',
      'SECURITY_CERTIFICATE',
    ]) {
      documents.push({ documentType, fileId: await uploadDocument(token) });
    }
    return {
      legal: {
        legalName: 'Công ty TNHH An Nhiên',
        taxCode: '0401234567',
        businessType: 'Công ty TNHH',
        representativeName: 'Nguyễn Văn A',
        representativeTitle: 'Giám đốc',
        representativeIdNumber: '079123456789',
        contactPhone: '0901234567',
        notificationEmail: 'legal@annhien.test',
      },
      beneficiary: {
        bankName: 'Vietcombank',
        accountNumber: '0123456789',
        accountHolder: 'CONG TY AN NHIEN',
      },
      property: {
        tradeName: 'An Nhiên Riverside',
        propertyType: 'Khách sạn',
        starRating: 4,
        physicalRooms: 36,
        propertyManager: 'Trần Thị B',
        licensedAddress: '12 Bạch Đằng, Đà Nẵng',
      },
      documents,
      commitment: true,
      ...overrides,
    };
  };

  const submit = (token: string, hotelId: string, body: object) =>
    t
      .api()
      .post(`/api/v1/hotels/${hotelId}/verification-requests`)
      .set(auth(token))
      .send(body);

  /** Uploads fresh documents and submits the default wizard. */
  const submitNew = async (token: string, hotelId: string, status = 201) =>
    submit(token, hotelId, await wizard(token)).expect(status);

  type SubmittedRequest = {
    id: string;
    requestType: string;
    documents: { id: string }[];
  };
  const requestOf = (res: { body: { data: unknown } }) =>
    res.body.data as SubmittedRequest;

  const decide = (
    token: string,
    requestId: string,
    action: 'approve' | 'reject' | 'request-changes',
    reason?: string,
  ) =>
    t
      .api()
      .post(`/api/v1/verification-requests/${requestId}/${action}`)
      .set(auth(token))
      .send(reason ? { reason } : {});

  const hotelStatus = async (hotelId: string) =>
    (await t.prisma.hotel.findUniqueOrThrow({ where: { hotelId } })).status;

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(() => t.reset());

  afterAll(() => t.app.close());

  describe('submission', () => {
    it('stores the wizard, encrypts the account number and puts the hotel in review', async () => {
      const { token, hotelId } = await partnerWithHotel();
      const res = await submitNew(token, hotelId);
      expect(res.body.data).toMatchObject({
        hotelId,
        hotelName: 'Riverside',
        requestType: 'INITIAL',
        status: 'PENDING',
        reason: null,
        reviewedAt: null,
        legal: expect.objectContaining({ taxCode: '0401234567' }),
        // The owner sees the full number in the detail view.
        beneficiary: {
          bankName: 'Vietcombank',
          accountNumber: '0123456789',
          accountHolder: 'CONG TY AN NHIEN',
        },
        property: expect.objectContaining({
          starRating: '4',
          physicalRooms: '36',
        }),
      });
      expect(res.body.data.documents).toHaveLength(3);
      expect(await hotelStatus(hotelId)).toBe('PENDING_VERIFICATION');

      // Only ciphertext in the database.
      const stored = await t.prisma.hotelProperties.findFirstOrThrow({
        where: { propertyKey: 'beneficiary.accountNumber' },
      });
      expect(stored.propertyValue).toMatch(/^v1:/);
      expect(stored.propertyValue).not.toContain('0123456789');

      // Lists show the last 4 digits only.
      const history = await t
        .api()
        .get(`/api/v1/hotels/${hotelId}/verification-requests`)
        .set(auth(token))
        .expect(200);
      expect(history.body.data[0].beneficiary.accountNumber).toBe('****6789');
      // The representative's ID card number is masked in lists too, and full in the detail view.
      expect(history.body.data[0].legal.representativeIdNumber).toBe(
        '****6789',
      );
      expect(res.body.data.legal.representativeIdNumber).toBe('079123456789');

      const again = await submitNew(token, hotelId, 409);
      expect(again.body.code).toBe('VERIFICATION_PENDING');
    });

    it('requires the three documents, own files and the commitment', async () => {
      const { token, hotelId } = await partnerWithHotel('a@hotel.test');
      const other = await partnerWithHotel('b@hotel.test', 'Other');
      const body = await wizard(token);
      const foreignFile = await uploadDocument(other.token);

      const missing = await submit(token, hotelId, {
        ...body,
        documents: body.documents.filter(
          (d) => d.documentType !== 'FIRE_SAFETY',
        ),
      }).expect(400);
      expect(missing.body.code).toBe('VERIFICATION_DOCUMENTS_MISSING');

      // One file cannot stand for several documents.
      const reused = await submit(token, hotelId, {
        ...body,
        documents: body.documents.map((d) => ({
          ...d,
          fileId: body.documents[0].fileId,
        })),
      }).expect(400);
      expect(reused.body.details).toEqual([
        {
          field: 'documents',
          message: 'each document must be a different file',
        },
      ]);

      for (const fileId of [
        foreignFile,
        `stayreco/verification/${randomUUID()}/x.pdf`,
        `${body.documents[0].fileId.split('/').slice(0, 3).join('/')}/../${other.id}/x.pdf`,
      ]) {
        const res = await submit(token, hotelId, {
          ...body,
          documents: [
            { ...body.documents[0], fileId },
            ...body.documents.slice(1),
          ],
        }).expect(400);
        expect(res.body.details).toEqual([
          { field: 'documents.0.fileId', message: expect.any(String) },
        ]);
      }

      await submit(token, hotelId, { ...body, commitment: false }).expect(400);
      // The request type is decided by the backend, not sent.
      await submit(token, hotelId, { ...body, requestType: 'RENEWAL' }).expect(
        400,
      );
      expect(await t.prisma.hotelVerificationRequest.count()).toBe(0);
      expect(await hotelStatus(hotelId)).toBe('DRAFT');
    });

    it('does not create two requests on a double submit', async () => {
      const { token, hotelId } = await partnerWithHotel();
      const body = await wizard(token);
      const results = await Promise.all([
        submit(token, hotelId, body),
        submit(token, hotelId, body),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
      expect(await t.prisma.hotelVerificationRequest.count()).toBe(1);
    });

    it('is refused to staff, other partners and suspended partners', async () => {
      const owner = await partnerWithHotel('a@hotel.test');
      const other = await partnerWithHotel('b@hotel.test', 'Other');
      const staff = await t.signInStaff(owner.hotelId, 'staff@hotel.test', [
        'BOOKING',
      ]);
      const body = await wizard(owner.token);

      await submit(staff.token, owner.hotelId, body).expect(403);
      await submit(other.token, owner.hotelId, body).expect(404);
      await t.prisma.hotelPartner.update({
        where: { hotelPartnerId: owner.id },
        data: { status: 'SUSPENDED' },
      });
      const res = await submit(owner.token, owner.hotelId, body).expect(403);
      expect(res.body.code).toBe('PARTNER_SUSPENDED');
    });
  });

  describe('review', () => {
    it('queues requests oldest first, with search and status filters, for managers only', async () => {
      const manager = await t.signIn('PLATFORM_MANAGER', 'pm@stayreco.test');
      const a = await partnerWithHotel('a@hotel.test', 'Alpha Hotel');
      const b = await partnerWithHotel('b@hotel.test', 'Beta_Inn');
      await submitNew(a.token, a.hotelId);
      await submitNew(b.token, b.hotelId);
      const queue = (query: Record<string, string> = {}) =>
        t
          .api()
          .get('/api/v1/verification-requests')
          .query(query)
          .set(auth(manager.token))
          .expect(200);
      const names = (res: { body: { data: { hotelName: string }[] } }) =>
        res.body.data.map((r) => r.hotelName);

      const all = await queue();
      expect(names(all)).toEqual(['Alpha Hotel', 'Beta_Inn']);
      expect(all.body.meta).toMatchObject({ total: 2, page: 1 });
      expect(all.body.data[0]).not.toHaveProperty('beneficiary');
      expect(names(await queue({ sort: 'submitted-desc' }))).toEqual([
        'Beta_Inn',
        'Alpha Hotel',
      ]);
      expect(names(await queue({ search: 'a_i' }))).toEqual(['Beta_Inn']);
      expect(names(await queue({ status: 'APPROVED' }))).toEqual([]);

      await t
        .api()
        .get('/api/v1/verification-requests')
        .set(auth(a.token))
        .expect(403);
    });

    it('approval activates the hotel, approves the partner and emails the partner', async () => {
      const manager = await t.signIn('PLATFORM_MANAGER', 'pm@stayreco.test');
      const { id: partnerId, token, hotelId } = await partnerWithHotel();
      const request = requestOf(await submitNew(token, hotelId));

      const res = await decide(manager.token, request.id, 'approve').expect(
        200,
      );
      expect(res.body.data).toMatchObject({
        status: 'APPROVED',
        reviewedAt: expect.any(String),
      });
      expect(await hotelStatus(hotelId)).toBe('ACTIVE');
      const partner = await t.prisma.hotelPartner.findUniqueOrThrow({
        where: { hotelPartnerId: partnerId },
      });
      expect(partner.status).toBe('APPROVED');
      expect(t.outbox).toContainEqual(
        expect.objectContaining({
          to: 'legal@annhien.test',
          subject: 'Your hotel has been verified',
        }),
      );

      const again = await decide(
        manager.token,
        request.id,
        'reject',
        'Late',
      ).expect(409);
      expect(again.body.code).toBe('VERIFICATION_ALREADY_DECIDED');
      expect(
        await t.prisma.auditLog.count({
          where: {
            platformManagerId: manager.id,
            action: 'VERIFICATION_APPROVED',
          },
        }),
      ).toBe(1);
    });

    it('lets only one of two managers decide', async () => {
      const m1 = await t.signIn('PLATFORM_MANAGER', 'pm1@stayreco.test');
      const m2 = await t.signIn('PLATFORM_MANAGER', 'pm2@stayreco.test');
      const { token, hotelId } = await partnerWithHotel();
      const request = requestOf(await submitNew(token, hotelId));

      const results = await Promise.all([
        decide(m1.token, request.id, 'approve'),
        decide(m2.token, request.id, 'reject', 'Fake license'),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    });

    it('does not activate the hotel of a partner suspended after submitting', async () => {
      const manager = await t.signIn('PLATFORM_MANAGER', 'pm@stayreco.test');
      const { id: partnerId, token, hotelId } = await partnerWithHotel();
      const request = requestOf(await submitNew(token, hotelId));
      await t.prisma.hotelPartner.update({
        where: { hotelPartnerId: partnerId },
        data: { status: 'SUSPENDED' },
      });

      const refused = await decide(manager.token, request.id, 'approve').expect(
        409,
      );
      expect(refused.body.code).toBe('PARTNER_SUSPENDED');
      // Nothing changed: the request can still be reviewed.
      expect(await hotelStatus(hotelId)).toBe('PENDING_VERIFICATION');
      await decide(
        manager.token,
        request.id,
        'request-changes',
        'Partner suspended',
      ).expect(200);
      expect(await hotelStatus(hotelId)).toBe('DRAFT');
    });

    it('rejection and change requests send the hotel back to DRAFT with the reason, and a new request can follow', async () => {
      const manager = await t.signIn('PLATFORM_MANAGER', 'pm@stayreco.test');
      const { token, hotelId } = await partnerWithHotel();

      const first = requestOf(await submitNew(token, hotelId));
      await decide(manager.token, first.id, 'reject').expect(400);
      await decide(
        manager.token,
        first.id,
        'request-changes',
        'Blurry fire safety certificate',
      ).expect(200);
      expect(await hotelStatus(hotelId)).toBe('DRAFT');
      expect(t.outbox.at(-1)).toMatchObject({
        to: 'legal@annhien.test',
        subject: 'Your hotel verification needs changes',
        text: expect.stringContaining('Blurry fire safety certificate'),
      });

      const second = requestOf(await submitNew(token, hotelId));
      expect(second.requestType).toBe('INITIAL');
      await decide(
        manager.token,
        second.id,
        'reject',
        'License does not match',
      ).expect(200);
      expect(await hotelStatus(hotelId)).toBe('DRAFT');

      const history = await t
        .api()
        .get(`/api/v1/hotels/${hotelId}/verification-requests`)
        .set(auth(token))
        .expect(200);
      expect(
        (history.body.data as { status: string; reason: string }[]).map((r) => [
          r.status,
          r.reason,
        ]),
      ).toEqual([
        ['REJECTED', 'License does not match'],
        ['NEEDS_REVISION', 'Blurry fire safety certificate'],
      ]);
    });
  });

  describe('active hotels', () => {
    const activeHotel = async () => {
      const manager = await t.signIn('PLATFORM_MANAGER', 'pm@stayreco.test');
      const owner = await partnerWithHotel();
      const request = requestOf(await submitNew(owner.token, owner.hotelId));
      await decide(manager.token, request.id, 'approve').expect(200);
      return { manager, owner };
    };

    it('re-verification keeps the hotel active and the next submission is a RENEWAL', async () => {
      const { manager, owner } = await activeHotel();
      const reverify = () =>
        t
          .api()
          .post(`/api/v1/hotels/${owner.hotelId}/reverification`)
          .set(auth(manager.token))
          .send({ reason: 'Business license expired' });

      const res = await reverify().expect(201);
      expect(res.body.data).toMatchObject({
        requestType: 'RENEWAL',
        status: 'NEEDS_REVISION',
        reason: 'Business license expired',
        beneficiary: null,
        documents: [],
      });
      expect(await hotelStatus(owner.hotelId)).toBe('ACTIVE');
      expect(t.outbox.at(-1)).toMatchObject({
        to: 'legal@annhien.test',
        subject: 'Please verify your hotel again',
      });
      const twice = await reverify().expect(409);
      expect(twice.body.code).toBe('VERIFICATION_PENDING');

      const renewal = requestOf(await submitNew(owner.token, owner.hotelId));
      expect(renewal.requestType).toBe('RENEWAL');
      expect(await hotelStatus(owner.hotelId)).toBe('ACTIVE');
      await decide(manager.token, renewal.id, 'reject', 'Still expired').expect(
        200,
      );
      // A rejected renewal does not take the hotel offline here (suspension is a separate decision).
      expect(await hotelStatus(owner.hotelId)).toBe('ACTIVE');
    });

    it('a voluntary update of an active hotel is an UPDATE request', async () => {
      const { owner } = await activeHotel();
      const res = await submitNew(owner.token, owner.hotelId);
      expect(res.body.data.requestType).toBe('UPDATE');
      expect(await hotelStatus(owner.hotelId)).toBe('ACTIVE');
    });

    it('re-verification needs an existing active hotel', async () => {
      const manager = await t.signIn('PLATFORM_MANAGER', 'pm@stayreco.test');
      const { hotelId } = await partnerWithHotel();
      const draft = await t
        .api()
        .post(`/api/v1/hotels/${hotelId}/reverification`)
        .set(auth(manager.token))
        .send({ reason: 'x' })
        .expect(409);
      expect(draft.body.code).toBe('HOTEL_STATUS_CONFLICT');
      for (const id of [randomUUID(), 'nope']) {
        await t
          .api()
          .post(`/api/v1/hotels/${id}/reverification`)
          .set(auth(manager.token))
          .send({ reason: 'x' })
          .expect(404);
      }
    });
  });

  describe('access to requests and documents', () => {
    it('shows requests and private files to the owner and managers only', async () => {
      const manager = await t.signIn('PLATFORM_MANAGER', 'pm@stayreco.test');
      const owner = await partnerWithHotel('a@hotel.test');
      const other = await partnerWithHotel('b@hotel.test', 'Other');
      const staff = await t.signInStaff(owner.hotelId, 'staff@hotel.test', [
        'BOOKING',
      ]);
      const request = requestOf(await submitNew(owner.token, owner.hotelId));
      const documentId = request.documents[0].id;
      const get = (path: string, token: string) =>
        t.api().get(`/api/v1${path}`).set(auth(token));

      for (const token of [owner.token, manager.token]) {
        const detail = await get(
          `/verification-requests/${request.id}`,
          token,
        ).expect(200);
        expect(detail.body.data.beneficiary.accountNumber).toBe('0123456789');
        const link = await get(
          `/verification-documents/${documentId}/file`,
          token,
        ).expect(200);
        expect(link.body.data).toEqual({
          url: expect.stringContaining(
            'https://signed.test/stayreco/verification/',
          ),
          expiresAt: expect.any(String),
        });
      }

      for (const path of [
        `/verification-requests/${request.id}`,
        `/verification-documents/${documentId}/file`,
        '/verification-requests/nope',
      ]) {
        const res = await get(path, other.token).expect(404);
        expect(res.body.code).toBe('VERIFICATION_NOT_FOUND');
      }
      await get(`/verification-requests/${request.id}`, staff.token).expect(
        403,
      );
      await get(
        `/verification-documents/${documentId}/file`,
        staff.token,
      ).expect(403);
      await get(`/verification-requests/${randomUUID()}`, manager.token).expect(
        404,
      );
    });
  });
});
