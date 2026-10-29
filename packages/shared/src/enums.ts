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
  /** Staff turned off by their hotel partner, who can turn them back on (not an admin suspension). */
  DEACTIVATED: 'DEACTIVATED',
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

/** Booking lifecycle (docs/money-rules.md §5.2). */
export const BookingStatus = {
  /** Rooms held for 15 minutes while waiting for the transfer. */
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
  /** The hold ran out before a matching transfer arrived; the rooms were released. */
  EXPIRED: 'EXPIRED',
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

/** Payment state of a booking, stored on its invoice (no separate payment table). */
export const PaymentStatus = {
  UNPAID: 'UNPAID',
  PAID: 'PAID',
  /** The customer cancelled with money to refund; waiting for the partner's decision. */
  REFUND_PENDING: 'REFUND_PENDING',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
  REFUNDED: 'REFUNDED',
  /** The hold expired unpaid. */
  FAILED: 'FAILED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

/** What an in-app notification is about (the FE picks the icon). */
export const NotificationType = {
  BOOKING: 'BOOKING',
  PAYMENT: 'PAYMENT',
  PROMOTION: 'PROMOTION',
  REVIEW: 'REVIEW',
  ALERT: 'ALERT',
  SYSTEM: 'SYSTEM',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

/** Kinds of pricing rule. BASE is the room type's base price, managed through the room type itself. */
export const PriceRuleType = {
  BASE: 'BASE',
  SEASON: 'SEASON',
  EARLY_BIRD: 'EARLY_BIRD',
  LAST_MINUTE: 'LAST_MINUTE',
} as const;
export type PriceRuleType = (typeof PriceRuleType)[keyof typeof PriceRuleType];

/** How a pricing rule changes the base price of a night. */
export const PriceAdjustmentType = {
  /** `adjustmentValue` is the new nightly price. */
  SET_PRICE: 'SET_PRICE',
  /** `adjustmentValue` is added (negative: subtracted), in VND. */
  AMOUNT: 'AMOUNT',
  /** `adjustmentValue` percent of the base price is added (negative: subtracted). */
  PERCENT: 'PERCENT',
} as const;
export type PriceAdjustmentType = (typeof PriceAdjustmentType)[keyof typeof PriceAdjustmentType];

export const DayOfWeek = {
  MON: 'MON',
  TUE: 'TUE',
  WED: 'WED',
  THU: 'THU',
  FRI: 'FRI',
  SAT: 'SAT',
  SUN: 'SUN',
} as const;
export type DayOfWeek = (typeof DayOfWeek)[keyof typeof DayOfWeek];
