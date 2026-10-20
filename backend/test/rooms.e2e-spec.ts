import { randomUUID } from 'crypto';
import { lockHotel, lockRoomType } from '../src/common/db/locks';
import { createTestApp, FILES } from './helpers';

describe('Room types and rooms (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let king: string;
  let twin: string;
  let wifi: string;
  let tv: string;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const ids = (items: unknown) => (items as { id: string }[]).map((i) => i.id);
  const fields = (details: unknown) =>
    (details as { field: string }[]).map((d) => d.field);

  const partnerWithHotel = async (email = 'owner@hotel.test') => {
    const partner = await t.signIn('HOTEL_PARTNER', email);
    const res = await t
      .api()
      .post('/api/v1/hotels')
      .set(auth(partner.token))
      .send({
        name: 'Riverside',
        address: '1 Bạch Đằng',
        city: 'Đà Nẵng',
        email: 'contact@riverside.test',
      })
      .expect(201);
    return { ...partner, hotelId: res.body.data.id as string };
  };

  const roomTypeBody = (overrides: Record<string, unknown> = {}) => ({
    name: 'Deluxe River View',
    maxOccupancy: 2,
    areaSqm: 32.5,
    basePrice: 1850000,
    beds: [{ bedTypeId: king, quantity: 1 }],
    amenityIds: [wifi],
    ...overrides,
  });

  const createRoomType = async (
    token: string,
    hotelId: string,
    overrides: Record<string, unknown> = {},
  ) =>
    (
      await t
        .api()
        .post(`/api/v1/hotels/${hotelId}/room-types`)
        .set(auth(token))
        .send(roomTypeBody(overrides))
        .expect(201)
    ).body.data as { id: string };

  const setRoomConfig = (token: string, hotelId: string, totalRooms: number) =>
    t
      .api()
      .put(`/api/v1/hotels/${hotelId}/room-config`)
      .set(auth(token))
      .send({ totalRooms, basePrice: 1500000 })
      .expect(200);

  const createRoom = (
    token: string,
    hotelId: string,
    body: Record<string, unknown>,
  ) =>
    t.api().post(`/api/v1/hotels/${hotelId}/rooms`).set(auth(token)).send(body);

  beforeAll(async () => {
    t = await createTestApp();
    await t.prisma.$executeRawUnsafe(
      'TRUNCATE TABLE amenity, bed_type RESTART IDENTITY CASCADE',
    );
    king = (
      await t.prisma.bedType.create({
        data: { name: 'Giường King', capacity: 2 },
      })
    ).bedTypeId;
    twin = (
      await t.prisma.bedType.create({
        data: { name: 'Giường đơn', capacity: 1 },
      })
    ).bedTypeId;
    wifi = (
      await t.prisma.amenity.create({
        data: { name: 'Wi-Fi', icon: 'wifi', category: 'Phòng' },
      })
    ).amenityId;
    tv = (
      await t.prisma.amenity.create({
        data: { name: 'TV', icon: 'tv', category: 'Phòng' },
      })
    ).amenityId;
  });

  beforeEach(() => t.reset());

  afterAll(() => t.app.close());

  describe('room types', () => {
    it('creates a room type with its base price, beds and amenities', async () => {
      const { token, hotelId } = await partnerWithHotel();
      const res = await t
        .api()
        .post(`/api/v1/hotels/${hotelId}/room-types`)
        .set(auth(token))
        .send(roomTypeBody())
        .expect(201);
      expect(res.body.data).toEqual({
        id: expect.any(String),
        hotelId,
        name: 'Deluxe River View',
        description: null,
        maxOccupancy: 2,
        areaSqm: 32.5,
        basePrice: 1850000,
        beds: [{ bedTypeId: king, name: 'Giường King', quantity: 1 }],
        amenities: [expect.objectContaining({ id: wifi, name: 'Wi-Fi' })],
        images: [],
        roomCount: 0,
      });

      // The base price is a `price` row with no room, dates or weekday (contract D3).
      const prices = await t.prisma.price.findMany({
        where: { roomTypeId: res.body.data.id },
      });
      expect(prices).toEqual([
        expect.objectContaining({
          roomId: null,
          validFrom: null,
          validTo: null,
          dayOfWeek: null,
        }),
      ]);
    });

    it('rejects unknown or repeated bed types and unknown amenities', async () => {
      const { token, hotelId } = await partnerWithHotel();
      const url = `/api/v1/hotels/${hotelId}/room-types`;
      const cases: [Record<string, unknown>, string][] = [
        [{ beds: [{ bedTypeId: randomUUID(), quantity: 1 }] }, 'beds'],
        [
          {
            beds: [
              { bedTypeId: king, quantity: 1 },
              { bedTypeId: king, quantity: 2 },
            ],
          },
          'beds',
        ],
        [{ amenityIds: [randomUUID()] }, 'amenityIds'],
        [{ areaSqm: 10000 }, 'areaSqm'],
      ];
      for (const [overrides, field] of cases) {
        const res = await t
          .api()
          .post(url)
          .set(auth(token))
          .send(roomTypeBody(overrides))
          .expect(400);
        expect(fields(res.body.details)).toEqual([field]);
      }
      expect(await t.prisma.roomType.count()).toBe(0);
    });

    it('updates fields, replaces beds and amenities, and keeps one base price row', async () => {
      const { token, hotelId } = await partnerWithHotel();
      const { id } = await createRoomType(token, hotelId, {
        description: 'River view',
      });

      const res = await t
        .api()
        .patch(`/api/v1/room-types/${id}`)
        .set(auth(token))
        .send({
          name: 'Twin',
          description: null,
          basePrice: 1200000.5,
          beds: [{ bedTypeId: twin, quantity: 2 }],
          amenityIds: [tv],
        })
        .expect(200);
      expect(res.body.data).toMatchObject({
        name: 'Twin',
        description: null,
        maxOccupancy: 2,
        basePrice: 1200000.5,
        beds: [{ bedTypeId: twin, name: 'Giường đơn', quantity: 2 }],
        amenities: [expect.objectContaining({ id: tv })],
      });
      expect(await t.prisma.price.count({ where: { roomTypeId: id } })).toBe(1);

      // Omitted lists stay as they are.
      const kept = await t
        .api()
        .patch(`/api/v1/room-types/${id}`)
        .set(auth(token))
        .send({ maxOccupancy: 3 })
        .expect(200);
      expect(kept.body.data.beds).toHaveLength(1);
      expect(kept.body.data.amenities).toHaveLength(1);
    });

    it('is readable by staff, managed only by the owner and hidden from others', async () => {
      const owner = await partnerWithHotel('a@hotel.test');
      const other = await t.signIn('HOTEL_PARTNER', 'b@hotel.test');
      const staff = await t.signInStaff(owner.hotelId, 'staff@hotel.test');
      const { id } = await createRoomType(owner.token, owner.hotelId);

      const list = await t
        .api()
        .get(`/api/v1/hotels/${owner.hotelId}/room-types`)
        .set(auth(staff.token))
        .expect(200);
      expect(ids(list.body.data)).toEqual([id]);
      await t
        .api()
        .get(`/api/v1/room-types/${id}`)
        .set(auth(staff.token))
        .expect(200);

      const forbidden = await t
        .api()
        .patch(`/api/v1/room-types/${id}`)
        .set(auth(staff.token))
        .send({ name: 'x' })
        .expect(403);
      expect(forbidden.body.code).toBe('FORBIDDEN');

      for (const path of [
        `/api/v1/room-types/${id}`,
        '/api/v1/room-types/nope',
      ]) {
        const res = await t.api().get(path).set(auth(other.token)).expect(404);
        expect(res.body.code).toBe('ROOM_TYPE_NOT_FOUND');
      }
      await t
        .api()
        .delete(`/api/v1/room-types/${id}`)
        .set(auth(other.token))
        .expect(404);
      await t
        .api()
        .post(`/api/v1/hotels/${owner.hotelId}/room-types`)
        .set(auth(other.token))
        .send(roomTypeBody())
        .expect(404);
    });

    it('deletes only unused room types, with their prices and images', async () => {
      const { token, hotelId } = await partnerWithHotel();
      await setRoomConfig(token, hotelId, 5);
      const used = await createRoomType(token, hotelId);
      await createRoom(token, hotelId, {
        roomTypeId: used.id,
        roomNumber: '101',
      }).expect(201);

      const inUse = await t
        .api()
        .delete(`/api/v1/room-types/${used.id}`)
        .set(auth(token))
        .expect(409);
      expect(inUse.body.code).toBe('ROOM_TYPE_IN_USE');

      const unused = await createRoomType(token, hotelId, { name: 'Suite' });
      await t
        .api()
        .post(`/api/v1/room-types/${unused.id}/images`)
        .set(auth(token))
        .attach('file', FILES.png, 'suite.png')
        .expect(201);
      await t
        .api()
        .delete(`/api/v1/room-types/${unused.id}`)
        .set(auth(token))
        .expect(204);

      expect(
        await t.prisma.price.count({ where: { roomTypeId: unused.id } }),
      ).toBe(0);
      expect(
        await t.prisma.roomTypeImage.count({
          where: { roomTypeId: unused.id },
        }),
      ).toBe(0);
      expect(t.storage.deleted).toHaveLength(1);
    });
  });

  describe('room type images', () => {
    it('uploads in order, edits captions, deletes, and hides images from others', async () => {
      const { token, hotelId } = await partnerWithHotel();
      const other = await t.signIn('HOTEL_PARTNER', 'b@hotel.test');
      const { id } = await createRoomType(token, hotelId);
      const upload = () =>
        t
          .api()
          .post(`/api/v1/room-types/${id}/images`)
          .set(auth(token))
          .attach('file', FILES.jpg, 'room.jpg');

      const first = (await upload().expect(201)).body.data;
      const second = (await upload().field('caption', 'Bathroom').expect(201))
        .body.data;
      expect(first).toEqual({
        id: expect.any(String),
        url: expect.stringContaining(`/room-types/${id}/`),
        caption: null,
        sortOrder: 0,
      });
      expect(second).toMatchObject({ caption: 'Bathroom', sortOrder: 1 });

      const edited = await t
        .api()
        .patch(`/api/v1/room-type-images/${first.id}`)
        .set(auth(token))
        .send({ caption: 'Bed', sortOrder: 5 })
        .expect(200);
      expect(edited.body.data).toMatchObject({ caption: 'Bed', sortOrder: 5 });

      const roomType = await t
        .api()
        .get(`/api/v1/room-types/${id}`)
        .set(auth(token))
        .expect(200);
      expect(ids(roomType.body.data.images)).toEqual([second.id, first.id]);

      const hidden = await t
        .api()
        .delete(`/api/v1/room-type-images/${first.id}`)
        .set(auth(other.token))
        .expect(404);
      expect(hidden.body.code).toBe('IMAGE_NOT_FOUND');
      await t
        .api()
        .post(`/api/v1/room-types/${id}/images`)
        .set(auth(other.token))
        .attach('file', FILES.jpg, 'room.jpg')
        .expect(404);

      await t
        .api()
        .delete(`/api/v1/room-type-images/${first.id}`)
        .set(auth(token))
        .expect(204);
      expect(t.storage.deleted).toHaveLength(1);
    });
  });

  describe('rooms', () => {
    it('needs a room configuration and never exceeds its total', async () => {
      const { token, hotelId } = await partnerWithHotel();
      const { id: roomTypeId } = await createRoomType(token, hotelId);

      const noConfig = await createRoom(token, hotelId, {
        roomTypeId,
        roomNumber: '101',
      }).expect(409);
      expect(noConfig.body.code).toBe('ROOM_LIMIT_REACHED');

      await setRoomConfig(token, hotelId, 2);
      const created = await createRoom(token, hotelId, {
        roomTypeId,
        roomNumber: '101',
        floor: 1,
      }).expect(201);
      expect(created.body.data).toEqual({
        id: expect.any(String),
        roomTypeId,
        roomNumber: '101',
        floor: 1,
        status: 'AVAILABLE',
        notes: null,
      });
      await createRoom(token, hotelId, {
        roomTypeId,
        roomNumber: '102',
      }).expect(201);
      const full = await createRoom(token, hotelId, {
        roomTypeId,
        roomNumber: '103',
      }).expect(409);
      expect(full.body.code).toBe('ROOM_LIMIT_REACHED');
    });

    it('keeps room numbers unique per hotel (case-insensitive) and room types in the same hotel', async () => {
      const a = await partnerWithHotel('a@hotel.test');
      const b = await partnerWithHotel('b@hotel.test');
      await setRoomConfig(a.token, a.hotelId, 10);
      await setRoomConfig(b.token, b.hotelId, 10);
      const typeA = await createRoomType(a.token, a.hotelId);
      const typeB = await createRoomType(b.token, b.hotelId);

      await createRoom(a.token, a.hotelId, {
        roomTypeId: typeA.id,
        roomNumber: '201A',
      }).expect(201);
      const taken = await createRoom(a.token, a.hotelId, {
        roomTypeId: typeA.id,
        roomNumber: '201a',
      }).expect(409);
      expect(taken.body.code).toBe('ROOM_NUMBER_TAKEN');
      // The same number in another hotel is fine.
      await createRoom(b.token, b.hotelId, {
        roomTypeId: typeB.id,
        roomNumber: '201A',
      }).expect(201);

      const foreignType = await createRoom(a.token, a.hotelId, {
        roomTypeId: typeB.id,
        roomNumber: '301',
      }).expect(404);
      expect(foreignType.body.code).toBe('ROOM_TYPE_NOT_FOUND');
    });

    it('serializes concurrent creations: one wins the last slot, one wins a number', async () => {
      const { token, hotelId } = await partnerWithHotel();
      await setRoomConfig(token, hotelId, 1);
      const { id: roomTypeId } = await createRoomType(token, hotelId);

      const lastSlot = await Promise.all([
        createRoom(token, hotelId, { roomTypeId, roomNumber: '101' }),
        createRoom(token, hotelId, { roomTypeId, roomNumber: '102' }),
      ]);
      expect(lastSlot.map((r) => r.status).sort()).toEqual([201, 409]);

      await setRoomConfig(token, hotelId, 10);
      const sameNumber = await Promise.all([
        createRoom(token, hotelId, { roomTypeId, roomNumber: '500' }),
        createRoom(token, hotelId, { roomTypeId, roomNumber: '500' }),
      ]);
      expect(sameNumber.map((r) => r.status).sort()).toEqual([201, 409]);
      expect(await t.prisma.room.count()).toBe(2);
    });

    it('lists with pagination, filters, search and named sorts', async () => {
      const { token, hotelId } = await partnerWithHotel();
      await setRoomConfig(token, hotelId, 10);
      const deluxe = await createRoomType(token, hotelId);
      const suite = await createRoomType(token, hotelId, { name: 'Suite' });
      for (const [roomNumber, floor, roomTypeId] of [
        ['101', 1, deluxe.id],
        ['102', 1, deluxe.id],
        ['201', 2, suite.id],
      ] as const) {
        await createRoom(token, hotelId, {
          roomNumber,
          floor,
          roomTypeId,
        }).expect(201);
      }
      const url = `/api/v1/hotels/${hotelId}/rooms`;
      const numbers = (data: unknown) =>
        (data as { roomNumber: string }[]).map((r) => r.roomNumber);

      const page = await t
        .api()
        .get(url)
        .query({ pageSize: 2 })
        .set(auth(token))
        .expect(200);
      expect(numbers(page.body.data)).toEqual(['101', '102']);
      expect(page.body.meta).toEqual({
        page: 1,
        pageSize: 2,
        total: 3,
        totalPages: 2,
      });

      const byFloor = await t
        .api()
        .get(url)
        .query({ sort: 'floor-desc' })
        .set(auth(token))
        .expect(200);
      expect(numbers(byFloor.body.data)).toEqual(['201', '101', '102']);

      const filtered = await t
        .api()
        .get(url)
        .query({ roomTypeId: deluxe.id, search: '02' })
        .set(auth(token))
        .expect(200);
      expect(numbers(filtered.body.data)).toEqual(['102']);

      const badSort = await t
        .api()
        .get(url)
        .query({ sort: 'price-asc' })
        .set(auth(token))
        .expect(400);
      expect(fields(badSort.body.details)).toEqual(['sort']);
    });

    it('updates a room, clears optional fields and moves it to another type of the hotel', async () => {
      const { token, hotelId } = await partnerWithHotel();
      await setRoomConfig(token, hotelId, 10);
      const deluxe = await createRoomType(token, hotelId);
      const suite = await createRoomType(token, hotelId, { name: 'Suite' });
      const a = (
        await createRoom(token, hotelId, {
          roomTypeId: deluxe.id,
          roomNumber: '101',
          floor: 1,
          notes: 'Corner',
        }).expect(201)
      ).body.data;
      await createRoom(token, hotelId, {
        roomTypeId: deluxe.id,
        roomNumber: '102',
      }).expect(201);

      const res = await t
        .api()
        .patch(`/api/v1/rooms/${a.id}`)
        .set(auth(token))
        .send({
          roomTypeId: suite.id,
          roomNumber: '101',
          floor: null,
          notes: null,
        })
        .expect(200);
      expect(res.body.data).toMatchObject({
        roomTypeId: suite.id,
        roomNumber: '101',
        floor: null,
        notes: null,
      });

      const taken = await t
        .api()
        .patch(`/api/v1/rooms/${a.id}`)
        .set(auth(token))
        .send({ roomNumber: '102' })
        .expect(409);
      expect(taken.body.code).toBe('ROOM_NUMBER_TAKEN');
      await t
        .api()
        .patch(`/api/v1/rooms/${a.id}`)
        .set(auth(token))
        .send({ status: 'OCCUPIED' })
        .expect(400);
    });

    it('locks and unlocks rooms, never an occupied one, and audits it', async () => {
      const { id: ownerId, token, hotelId } = await partnerWithHotel();
      await setRoomConfig(token, hotelId, 10);
      const { id: roomTypeId } = await createRoomType(token, hotelId);
      const room = (
        await createRoom(token, hotelId, {
          roomTypeId,
          roomNumber: '101',
        }).expect(201)
      ).body.data;
      const lock = () =>
        t
          .api()
          .post(`/api/v1/rooms/${room.id}/lock`)
          .set(auth(token))
          .send({ reason: 'Broken AC' });
      const unlock = () =>
        t.api().post(`/api/v1/rooms/${room.id}/unlock`).set(auth(token));

      expect((await lock().expect(200)).body.data.status).toBe('MAINTENANCE');
      expect((await unlock().expect(200)).body.data.status).toBe('AVAILABLE');
      const again = await unlock().expect(409);
      expect(again.body.code).toBe('ROOM_NOT_LOCKABLE');

      await t.prisma.room.update({
        where: { roomId: room.id },
        data: { status: 'OCCUPIED' },
      });
      const occupied = await lock().expect(409);
      expect(occupied.body.code).toBe('ROOM_NOT_LOCKABLE');

      const logs = await t.prisma.auditLog.findMany({
        where: { hotelPartnerId: ownerId, action: { startsWith: 'ROOM_' } },
        orderBy: { createdAt: 'asc' },
      });
      expect(logs.map((l) => l.action)).toEqual([
        'ROOM_LOCKED',
        'ROOM_UNLOCKED',
      ]);
      expect(JSON.parse(logs[0].newValue!)).toEqual({
        roomId: room.id,
        reason: 'Broken AC',
      });
    });

    it('lets staff read rooms but only the owner change them', async () => {
      const owner = await partnerWithHotel('a@hotel.test');
      const other = await t.signIn('HOTEL_PARTNER', 'b@hotel.test');
      const staff = await t.signInStaff(owner.hotelId, 'staff@hotel.test', [
        'FRONT_DESK',
      ]);
      await setRoomConfig(owner.token, owner.hotelId, 10);
      const { id: roomTypeId } = await createRoomType(
        owner.token,
        owner.hotelId,
      );
      const room = (
        await createRoom(owner.token, owner.hotelId, {
          roomTypeId,
          roomNumber: '101',
        }).expect(201)
      ).body.data;

      await t
        .api()
        .get(`/api/v1/hotels/${owner.hotelId}/rooms`)
        .set(auth(staff.token))
        .expect(200);
      await createRoom(staff.token, owner.hotelId, {
        roomTypeId,
        roomNumber: '102',
      }).expect(403);
      await t
        .api()
        .post(`/api/v1/rooms/${room.id}/lock`)
        .set(auth(staff.token))
        .send({})
        .expect(403);

      for (const id of [room.id, 'not-a-uuid']) {
        const res = await t
          .api()
          .patch(`/api/v1/rooms/${id}`)
          .set(auth(other.token))
          .send({ notes: 'x' })
          .expect(404);
        expect(res.body.code).toBe('ROOM_NOT_FOUND');
      }
    });
  });

  it('row locks report whether the row exists', async () => {
    const { token, hotelId } = await partnerWithHotel();
    const { id } = await createRoomType(token, hotelId);
    const locked = await t.prisma.$transaction(async (tx) => [
      await lockHotel(tx, hotelId),
      await lockRoomType(tx, id),
      await lockRoomType(tx, randomUUID()),
    ]);
    expect(locked).toEqual([1, 1, 0]);
  });
});
