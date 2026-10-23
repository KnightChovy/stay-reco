import { z } from 'zod';
import { DocumentType, RoomStatus, StaffPermission, VerificationStatus } from '../enums';
import { emailSchema } from './auth';
import {
  hasAtMost2Decimals,
  listQuerySchema,
  moneySchema,
  phoneSchema,
  reasonSchema,
  timeSchema,
} from './common';

const uniqueIds = (max: number) =>
  z
    .array(z.uuid())
    .max(max)
    .refine((ids) => new Set(ids).size === ids.length, 'ids must be unique');

// ── Hotel ───────────────────────────────────────────────────

const hotelFields = {
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).optional(),
  address: z.string().trim().min(1).max(500),
  city: z.string().trim().min(1).max(100),
  country: z.string().trim().min(1).max(100),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  starRating: z.number().int().min(1).max(5).optional(),
  phone: phoneSchema.optional(),
  email: emailSchema,
  // http(s) only: other schemes such as `javascript:` would run script when the website is shown as a link.
  website: z
    .url({ protocol: /^https?$/ })
    .max(500)
    .optional(),
  checkInTime: timeSchema.optional(),
  checkOutTime: timeSchema.optional(),
};

/** Coordinates only make sense as a pair: both sent or both omitted, both numbers or both `null`. */
const coordinatesTogether = {
  check: (v: { latitude?: number | null; longitude?: number | null }) =>
    (v.latitude === undefined) === (v.longitude === undefined) && (v.latitude === null) === (v.longitude === null),
  params: { message: 'latitude and longitude must be sent together', path: ['longitude'] },
};

// Defaults only on create: in an update schema a default would overwrite the stored value when the field is omitted.
export const createHotelSchema = z
  .strictObject({
    ...hotelFields,
    country: hotelFields.country.default('Vietnam'),
  })
  .refine(coordinatesTogether.check, coordinatesTogether.params);
export type CreateHotelInput = z.infer<typeof createHotelSchema>;

/** Every field optional; `null` clears an optional field (e.g. `website: null`). */
export const updateHotelSchema = z
  .strictObject({
    ...hotelFields,
    description: hotelFields.description.nullable(),
    latitude: hotelFields.latitude.nullable(),
    longitude: hotelFields.longitude.nullable(),
    starRating: hotelFields.starRating.nullable(),
    phone: hotelFields.phone.nullable(),
    website: hotelFields.website.nullable(),
    checkInTime: hotelFields.checkInTime.nullable(),
    checkOutTime: hotelFields.checkOutTime.nullable(),
  })
  .partial()
  .refine(coordinatesTogether.check, coordinatesTogether.params);
export type UpdateHotelInput = z.infer<typeof updateHotelSchema>;

export const hotelAmenitiesSchema = z.strictObject({
  amenityIds: uniqueIds(100),
});
export type HotelAmenitiesInput = z.infer<typeof hotelAmenitiesSchema>;

/** Policies as key/value text, e.g. { cancellation: "...", children: "..." }. */
export const hotelPoliciesSchema = z.strictObject({
  policies: z
    .record(z.string().regex(/^[a-z][a-z0-9_]{0,49}$/, 'policy key must be snake_case'), z.string().trim().max(2000))
    .refine((p) => Object.keys(p).length <= 30, 'at most 30 policies'),
});
export type HotelPoliciesInput = z.infer<typeof hotelPoliciesSchema>;

/** Declared number of physical rooms and the default base price for new room types (contract D4). */
export const roomConfigSchema = z.strictObject({
  totalRooms: z.number().int().min(1).max(10_000),
  basePrice: moneySchema,
});
export type RoomConfigInput = z.infer<typeof roomConfigSchema>;

// ── Uploads and images ──────────────────────────────────────

const MB = 1024 * 1024;

/** Upload rules (contract D5, D10). Clients can check files with them before sending. */
export const UPLOAD_RULES = {
  image: { maxBytes: 10 * MB, mimeTypes: ['image/jpeg', 'image/png', 'image/webp'] },
  document: { maxBytes: 10 * MB, mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'] },
  /** Maximum images per hotel and per room type. */
  maxImages: 30,
} as const;

/** Text fields sent with the image file. The request is multipart/form-data, so values arrive as strings. */
export const uploadHotelImageSchema = z.strictObject({
  caption: z.string().trim().max(255).optional(),
  /** "true" makes this the cover image. The first image of a hotel always becomes the cover. */
  isCover: z.stringbool().optional(),
});
export type UploadHotelImageInput = z.infer<typeof uploadHotelImageSchema>;

export const updateHotelImageSchema = z.strictObject({
  caption: z.string().trim().max(255).nullable().optional(),
  /** Moves the cover to this image. The cover cannot be removed, only moved. */
  isCover: z.literal(true).optional(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
});
export type UpdateHotelImageInput = z.infer<typeof updateHotelImageSchema>;

/** Room type images have no cover: the first one in `sortOrder` is shown first. */
export const uploadRoomTypeImageSchema = z.strictObject({
  caption: z.string().trim().max(255).optional(),
});
export type UploadRoomTypeImageInput = z.infer<typeof uploadRoomTypeImageSchema>;

export const updateRoomTypeImageSchema = z.strictObject({
  caption: z.string().trim().max(255).nullable().optional(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
});
export type UpdateRoomTypeImageInput = z.infer<typeof updateRoomTypeImageSchema>;

// ── Room types and rooms ────────────────────────────────────

const roomTypeFields = {
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(5000).optional(),
  maxOccupancy: z.number().int().min(1).max(50),
  areaSqm: z.number().positive().max(9999.99).refine(hasAtMost2Decimals, 'at most 2 decimal places'),
  basePrice: moneySchema,
  beds: z
    .array(
      z.strictObject({
        bedTypeId: z.uuid(),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1)
    .max(10)
    .refine((beds) => new Set(beds.map((b) => b.bedTypeId)).size === beds.length, 'bed types must be unique'),
  amenityIds: uniqueIds(100),
};

export const createRoomTypeSchema = z.strictObject({
  ...roomTypeFields,
  amenityIds: roomTypeFields.amenityIds.default([]),
});
export type CreateRoomTypeInput = z.infer<typeof createRoomTypeSchema>;

/** `beds` and `amenityIds`, when sent, replace the whole list; `description: null` clears it. */
export const updateRoomTypeSchema = z
  .strictObject({ ...roomTypeFields, description: roomTypeFields.description.nullable() })
  .partial();
export type UpdateRoomTypeInput = z.infer<typeof updateRoomTypeSchema>;

const roomFields = {
  roomTypeId: z.uuid(),
  roomNumber: z.string().trim().min(1).max(20),
  floor: z.number().int().min(-5).max(200).optional(),
  notes: z.string().trim().max(1000).optional(),
};

export const createRoomSchema = z.strictObject(roomFields);
export type CreateRoomInput = z.infer<typeof createRoomSchema>;

/** The status is not edited here: use lock / unlock (and front-desk actions later). `null` clears floor or notes. */
export const updateRoomSchema = z
  .strictObject({ ...roomFields, floor: roomFields.floor.nullable(), notes: roomFields.notes.nullable() })
  .partial();
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;

export const lockRoomSchema = z.strictObject({
  reason: z.string().trim().max(500).optional(),
});
export type LockRoomInput = z.infer<typeof lockRoomSchema>;

export const ROOM_SORTS = ['room-number-asc', 'room-number-desc', 'floor-asc', 'floor-desc'] as const;

/** `search` matches the room number; default order is `room-number-asc`. */
export const roomListQuerySchema = listQuerySchema.extend({
  sort: z.enum(ROOM_SORTS).default('room-number-asc'),
  roomTypeId: z.uuid().optional(),
  status: z.enum(RoomStatus).optional(),
});
export type RoomListQuery = z.infer<typeof roomListQuerySchema>;

// ── Staff ───────────────────────────────────────────────────

export const staffPermissionsSchema = z.strictObject({
  permissions: z
    .array(z.enum(StaffPermission))
    .refine((p) => new Set(p).size === p.length, 'permissions must be unique'),
});
export type StaffPermissionsInput = z.infer<typeof staffPermissionsSchema>;

// ── Verification ────────────────────────────────────────────

/**
 * The 4-step wizard. The request type is not sent: the backend derives it from the hotel (DRAFT → INITIAL, a pending
 * re-verification → RENEWAL, any other ACTIVE hotel → UPDATE).
 */
export const submitVerificationSchema = z.strictObject({
  legal: z.strictObject({
    legalName: z.string().trim().min(1).max(255),
    taxCode: z
      .string()
      .trim()
      .regex(/^\d{10}(-\d{3})?$/, 'tax code must be 10 or 13 digits'),
    businessType: z.string().trim().min(1).max(100),
    representativeName: z.string().trim().min(1).max(100),
    representativeTitle: z.string().trim().min(1).max(100),
    representativeIdNumber: z
      .string()
      .trim()
      .regex(/^[A-Z0-9]{8,12}$/, 'ID number must be 8-12 letters or digits'),
    contactPhone: phoneSchema,
    notificationEmail: emailSchema,
  }),
  beneficiary: z.strictObject({
    bankName: z.string().trim().min(1).max(100),
    accountNumber: z
      .string()
      .trim()
      .regex(/^\d{6,20}$/, 'account number must be 6-20 digits'),
    accountHolder: z.string().trim().min(1).max(100),
  }),
  property: z.strictObject({
    tradeName: z.string().trim().min(1).max(255),
    propertyType: z.string().trim().min(1).max(100),
    starRating: z.number().int().min(1).max(5).optional(),
    physicalRooms: z.number().int().min(1).max(10_000),
    propertyManager: z.string().trim().min(1).max(100),
    licensedAddress: z.string().trim().min(1).max(500),
    landmark: z.string().trim().max(255).optional(),
    frontDeskHours: z.string().trim().max(50).optional(),
    surveyNotes: z.string().trim().max(2000).optional(),
  }),
  documents: z
    .array(
      z.strictObject({
        documentType: z.enum(DocumentType),
        fileId: z.string().min(1).max(255),
      }),
    )
    .min(1)
    .max(10)
    // One PDF reused for every required type would satisfy D10 without real documents.
    .refine(
      (docs) => new Set(docs.map((d) => d.fileId)).size === docs.length,
      'each document must be a different file',
    ),
  /** Step 4: the partner confirms the information is accurate. */
  commitment: z.literal(true),
});
export type SubmitVerificationInput = z.infer<typeof submitVerificationSchema>;

export const verificationDecisionSchema = z.strictObject({
  reason: reasonSchema,
});
export type VerificationDecisionInput = z.infer<typeof verificationDecisionSchema>;

export const VERIFICATION_SORTS = ['submitted-asc', 'submitted-desc'] as const;

/** Manager queue: `search` matches the hotel name; oldest first by default (SLA). */
export const verificationListQuerySchema = listQuerySchema.extend({
  sort: z.enum(VERIFICATION_SORTS).default('submitted-asc'),
  status: z.enum(VerificationStatus).optional(),
});
export type VerificationListQuery = z.infer<typeof verificationListQuerySchema>;
