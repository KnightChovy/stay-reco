import type {
  AccountStatus,
  DocumentType,
  HotelStatus,
  RoomStatus,
  StaffPermission,
  VerificationRequestType,
  VerificationStatus,
} from '../enums';

/**
 * Content of `data` returned by the phase 1 endpoints (the envelope is `APIResponse<T>`).
 * Money is a number with at most 2 decimals; dates are ISO 8601 strings in UTC.
 */

export interface Amenity {
  id: string;
  name: string;
  icon: string | null;
  category: string;
}

export interface BedType {
  id: string;
  name: string;
  description: string | null;
  capacity: number | null;
}

export interface HotelImage {
  id: string;
  url: string;
  caption: string | null;
  isCover: boolean;
  sortOrder: number;
}

/** One item of `GET /me/hotels`. */
export interface HotelSummary {
  id: string;
  name: string;
  city: string;
  starRating: number | null;
  status: HotelStatus;
  coverImageUrl: string | null;
  /** OWNER for the partner who owns it, STAFF for an assigned staff member. */
  myRole: 'OWNER' | 'STAFF';
}

export interface Hotel {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  starRating: number | null;
  phone: string | null;
  email: string;
  website: string | null;
  /** "HH:mm" */
  checkInTime: string | null;
  checkOutTime: string | null;
  status: HotelStatus;
  amenities: Amenity[];
  images: HotelImage[];
  policies: Record<string, string>;
  /** Declared physical rooms and default base price; null until the partner sets it. */
  roomConfig: { totalRooms: number; basePrice: number } | null;
  createdAt: string;
}

export interface RoomTypeImage {
  id: string;
  url: string;
  caption: string | null;
  sortOrder: number;
}

export interface RoomType {
  id: string;
  hotelId: string;
  name: string;
  description: string | null;
  maxOccupancy: number;
  areaSqm: number;
  basePrice: number;
  beds: { bedTypeId: string; name: string; quantity: number }[];
  amenities: Amenity[];
  images: RoomTypeImage[];
  roomCount: number;
}

export interface Room {
  id: string;
  roomTypeId: string;
  roomNumber: string;
  floor: number | null;
  status: RoomStatus;
  notes: string | null;
}

export interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  position: string;
  status: AccountStatus;
  permissions: StaffPermission[];
}

/** `POST /uploads/verification-documents`: pass `fileId` in `documents[]` when submitting a verification request. */
export interface UploadedDocument {
  fileId: string;
}

export interface VerificationDocument {
  id: string;
  documentType: DocumentType;
  uploadedAt: string;
}

/** One item of the platform manager's queue (`GET /verification-requests`). */
export interface VerificationRequestSummary {
  id: string;
  hotelId: string;
  hotelName: string;
  requestType: VerificationRequestType;
  status: VerificationStatus;
  submittedAt: string;
  reviewedAt: string | null;
}

/** Full request, visible to the hotel owner and platform managers only. */
export interface VerificationRequest extends VerificationRequestSummary {
  /** Reviewer's reason for reject / request changes / re-verification. */
  reason: string | null;
  legal: Record<string, string>;
  beneficiary: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  } | null;
  property: Record<string, string>;
  documents: VerificationDocument[];
}
