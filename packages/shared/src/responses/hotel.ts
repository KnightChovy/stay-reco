import { z } from 'zod';
import {
  AccountStatus,
  DocumentType,
  HotelStatus,
  RoomStatus,
  StaffPermission,
  VerificationRequestType,
  VerificationStatus,
} from '../enums';
import { isoDateTime, responseSchemas } from './registry';

/**
 * Content of `data` returned by the hotel onboarding endpoints (the envelope is `APIResponse<T>`).
 * Money is a number with at most 2 decimals; dates are ISO 8601 strings in UTC.
 */

export const amenityResponseSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    icon: z.string().nullable().describe('lucide-react icon name, e.g. `wifi`.'),
    category: z.string(),
  })
  .register(responseSchemas, { id: 'Amenity' });
export type Amenity = z.infer<typeof amenityResponseSchema>;

export const bedTypeResponseSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    description: z.string().nullable(),
    capacity: z.number().int().nullable(),
  })
  .register(responseSchemas, { id: 'BedType' });
export type BedType = z.infer<typeof bedTypeResponseSchema>;

export const hotelImageResponseSchema = z
  .object({
    id: z.uuid(),
    url: z.url(),
    caption: z.string().nullable(),
    isCover: z.boolean().describe('Exactly one image of a hotel is the cover.'),
    sortOrder: z.number().int(),
  })
  .register(responseSchemas, { id: 'HotelImage' });
export type HotelImage = z.infer<typeof hotelImageResponseSchema>;

export const hotelSummaryResponseSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    city: z.string(),
    starRating: z.number().int().nullable(),
    status: z.enum(HotelStatus),
    coverImageUrl: z.url().nullable(),
    myRole: z
      .enum(['OWNER', 'STAFF'])
      .describe('OWNER for the partner who owns it, STAFF for an assigned staff member.'),
  })
  .register(responseSchemas, { id: 'HotelSummary', description: 'One item of `GET /me/hotels`.' });
export type HotelSummary = z.infer<typeof hotelSummaryResponseSchema>;

export const cancellationPolicyResponseSchema = z
  .object({
    freeCancellationDays: z.number().int().nullable().describe('null: no free-cancellation period.'),
    feePercent: z.number(),
  })
  .register(responseSchemas, { id: 'CancellationPolicy' });
export type CancellationPolicy = z.infer<typeof cancellationPolicyResponseSchema>;

const hhmm = z.string().describe('"HH:mm"');

export const hotelResponseSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    description: z.string().nullable(),
    address: z.string(),
    city: z.string(),
    country: z.string(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    starRating: z.number().int().nullable(),
    phone: z.string().nullable(),
    email: z.email(),
    website: z.url().nullable(),
    checkInTime: hhmm.nullable(),
    checkOutTime: hhmm.nullable(),
    status: z.enum(HotelStatus),
    amenities: z.array(amenityResponseSchema),
    images: z.array(hotelImageResponseSchema),
    policies: z
      .record(z.string(), z.string())
      .describe('Policy texts keyed in snake_case, e.g. `cancellation`, `children`.'),
    roomConfig: z
      .object({ totalRooms: z.number().int(), basePrice: z.number() })
      .nullable()
      .describe('Declared physical rooms and default base price; null until the partner sets it.'),
    cancellationPolicy: cancellationPolicyResponseSchema.describe(
      'Fixed on each booking when it is made (BR-07); the default applies until the partner sets one.',
    ),
    createdAt: isoDateTime(),
  })
  .register(responseSchemas, { id: 'Hotel' });
export type Hotel = z.infer<typeof hotelResponseSchema>;

export const roomTypeImageResponseSchema = z
  .object({
    id: z.uuid(),
    url: z.url(),
    caption: z.string().nullable(),
    sortOrder: z.number().int(),
  })
  .register(responseSchemas, { id: 'RoomTypeImage' });
export type RoomTypeImage = z.infer<typeof roomTypeImageResponseSchema>;

export const roomTypeResponseSchema = z
  .object({
    id: z.uuid(),
    hotelId: z.uuid(),
    name: z.string(),
    description: z.string().nullable(),
    maxOccupancy: z.number().int(),
    areaSqm: z.number(),
    basePrice: z
      .number()
      .nullable()
      .describe(
        'Price per night before seasonal rules. `null` only for a room type created outside the API; `PATCH basePrice` sets it.',
      ),
    beds: z.array(
      z.object({ bedTypeId: z.uuid(), name: z.string(), quantity: z.number().int() }),
    ),
    amenities: z.array(amenityResponseSchema),
    images: z.array(roomTypeImageResponseSchema),
    roomCount: z.number().int().describe('Physical rooms of this type.'),
  })
  .register(responseSchemas, { id: 'RoomType' });
export type RoomType = z.infer<typeof roomTypeResponseSchema>;

export const roomResponseSchema = z
  .object({
    id: z.uuid(),
    roomTypeId: z.uuid(),
    roomNumber: z.string(),
    floor: z.number().int().nullable(),
    status: z.enum(RoomStatus),
    notes: z.string().nullable(),
  })
  .register(responseSchemas, { id: 'Room' });
export type Room = z.infer<typeof roomResponseSchema>;

export const staffMemberResponseSchema = z
  .object({
    id: z.uuid(),
    fullName: z.string(),
    email: z.email(),
    position: z.string(),
    status: z.enum(AccountStatus),
    permissions: z.array(z.enum(StaffPermission)),
  })
  .register(responseSchemas, { id: 'StaffMember' });
export type StaffMember = z.infer<typeof staffMemberResponseSchema>;

export const uploadedDocumentResponseSchema = z
  .object({ fileId: z.string() })
  .register(responseSchemas, {
    id: 'UploadedDocument',
    description: 'Pass `fileId` in `documents[]` when submitting a verification request.',
  });
export type UploadedDocument = z.infer<typeof uploadedDocumentResponseSchema>;

export const verificationDocumentResponseSchema = z
  .object({
    id: z.uuid(),
    documentType: z.enum(DocumentType),
    uploadedAt: isoDateTime(),
  })
  .register(responseSchemas, { id: 'VerificationDocument' });
export type VerificationDocument = z.infer<typeof verificationDocumentResponseSchema>;

export const verificationFileLinkResponseSchema = z
  .object({
    url: z.url().describe('Signed link; open it in a new tab or use it as an <img> / <iframe> src.'),
    expiresAt: isoDateTime(),
  })
  .register(responseSchemas, {
    id: 'VerificationFileLink',
    description: 'A short-lived link (5 minutes) to open the private file. Ask for a new one each time.',
  });
export type VerificationFileLink = z.infer<typeof verificationFileLinkResponseSchema>;

export const verificationRequestSummaryResponseSchema = z
  .object({
    id: z.uuid(),
    hotelId: z.uuid(),
    hotelName: z.string(),
    requestType: z.enum(VerificationRequestType),
    status: z.enum(VerificationStatus),
    submittedAt: isoDateTime(),
    reviewedAt: isoDateTime().nullable(),
  })
  .register(responseSchemas, {
    id: 'VerificationRequestSummary',
    description: "One item of the platform manager's queue; no beneficiary data.",
  });
export type VerificationRequestSummary = z.infer<typeof verificationRequestSummaryResponseSchema>;

export const verificationRequestResponseSchema = verificationRequestSummaryResponseSchema
  .extend({
    reason: z
      .string()
      .nullable()
      .describe("Reviewer's reason for reject / request changes / re-verification."),
    legal: z.record(z.string(), z.string()),
    beneficiary: z
      .object({
        bankName: z.string(),
        accountNumber: z.string().describe('Masked as `****1234` in the history list.'),
        accountHolder: z.string(),
      })
      .nullable(),
    property: z.record(z.string(), z.string()),
    documents: z.array(verificationDocumentResponseSchema),
  })
  .register(responseSchemas, {
    id: 'VerificationRequest',
    description: 'Full request, visible to the hotel owner and platform managers only.',
  });
export type VerificationRequest = z.infer<typeof verificationRequestResponseSchema>;
