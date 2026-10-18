/** Mirrors the Prisma enums in backend/prisma/schema.prisma (same names and values). Keep both in sync. */
export const Role = {
  CUSTOMER: 'CUSTOMER',
  HOTEL_PARTNER: 'HOTEL_PARTNER',
  HOTEL_STAFF: 'HOTEL_STAFF',
  PLATFORM_MANAGER: 'PLATFORM_MANAGER',
  ADMIN: 'ADMIN',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const AccountStatus = {
  /** Registered but the email OTP has not been entered yet; cannot sign in. */
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  ACTIVE: 'ACTIVE',
  INVITED: 'INVITED',
  SUSPENDED: 'SUSPENDED',
  DELETED: 'DELETED',
} as const;
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];

export const PartnerStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
} as const;
export type PartnerStatus = (typeof PartnerStatus)[keyof typeof PartnerStatus];

/** Only ACTIVE hotels are visible to guests (BR-01). */
export const HotelStatus = {
  DRAFT: 'DRAFT',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  INACTIVE: 'INACTIVE',
} as const;
export type HotelStatus = (typeof HotelStatus)[keyof typeof HotelStatus];

export const VerificationStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  NEEDS_REVISION: 'NEEDS_REVISION',
} as const;
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const VerificationRequestType = {
  INITIAL: 'INITIAL',
  UPDATE: 'UPDATE',
  RENEWAL: 'RENEWAL',
} as const;
export type VerificationRequestType = (typeof VerificationRequestType)[keyof typeof VerificationRequestType];

export const DocumentType = {
  BUSINESS_LICENSE: 'BUSINESS_LICENSE',
  SECURITY_CERTIFICATE: 'SECURITY_CERTIFICATE',
  FIRE_SAFETY: 'FIRE_SAFETY',
  ID_CARD: 'ID_CARD',
  OTHER: 'OTHER',
} as const;
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

/** Documents every verification request must include (contract phase 1, D10). */
export const REQUIRED_VERIFICATION_DOCUMENTS: readonly DocumentType[] = [
  DocumentType.BUSINESS_LICENSE,
  DocumentType.FIRE_SAFETY,
  DocumentType.SECURITY_CERTIFICATE,
];

/** Only AVAILABLE rooms can be booked or assigned; the others mean "not ready". */
export const RoomStatus = {
  AVAILABLE: 'AVAILABLE',
  OCCUPIED: 'OCCUPIED',
  CLEANING: 'CLEANING',
  MAINTENANCE: 'MAINTENANCE',
} as const;
export type RoomStatus = (typeof RoomStatus)[keyof typeof RoomStatus];

/** Permission groups a hotel partner grants to staff (SRS UC62). */
export const StaffPermission = {
  BOOKING: 'BOOKING',
  FRONT_DESK: 'FRONT_DESK',
  CUSTOMER_CARE: 'CUSTOMER_CARE',
  REFUND: 'REFUND',
  MARKETING: 'MARKETING',
} as const;
export type StaffPermission = (typeof StaffPermission)[keyof typeof StaffPermission];
