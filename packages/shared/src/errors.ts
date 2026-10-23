/**
 * Stable error codes returned in `APIError.code`. Clients map these to UI messages (MSGxx) and i18n,
 * so never rename a published code; add a new one instead.
 */
export const ErrorCode = {
  // Generic: used when an exception carries no specific code (derived from the HTTP status).
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  /** Missing, invalid or expired access token. The only 401 a client should answer with a token refresh. */
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  /** A dependency the backend needs (the database) is down or not answering; try again later. */
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Auth
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
  AUTH_ACCOUNT_SUSPENDED: 'AUTH_ACCOUNT_SUSPENDED',
  /** Staff account turned off by the hotel partner. */
  AUTH_ACCOUNT_DEACTIVATED: 'AUTH_ACCOUNT_DEACTIVATED',
  AUTH_ACCOUNT_INACTIVE: 'AUTH_ACCOUNT_INACTIVE',
  /** Correct password but the email has not been verified yet; show the OTP screen. */
  AUTH_EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',
  /** Wrong email OTP; the user may try again. */
  AUTH_OTP_INVALID: 'AUTH_OTP_INVALID',
  /** Email OTP expired, already used or too many wrong attempts; the user must request a new code. */
  AUTH_OTP_EXPIRED: 'AUTH_OTP_EXPIRED',
  AUTH_EMAIL_TAKEN: 'AUTH_EMAIL_TAKEN',
  AUTH_WRONG_PASSWORD: 'AUTH_WRONG_PASSWORD',
  /** Email-verification, password-reset or invitation token is invalid, expired or already used. */
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  /** Refresh token missing, invalid, expired or reused. The client must sign in again. */
  AUTH_REFRESH_TOKEN_INVALID: 'AUTH_REFRESH_TOKEN_INVALID',
  AUTH_INVITATION_ACCEPTED: 'AUTH_INVITATION_ACCEPTED',
  AUTH_SESSION_NOT_FOUND: 'AUTH_SESSION_NOT_FOUND',

  // Hotel (resources the caller cannot access are reported as not found, so existence is not revealed)
  /** Hotel does not exist or does not belong to the caller (the two cases are not distinguished). */
  HOTEL_NOT_FOUND: 'HOTEL_NOT_FOUND',
  /** The partner is suspended: its hotels stay readable, but it cannot create or change anything. */
  PARTNER_SUSPENDED: 'PARTNER_SUSPENDED',
  /** The hotel's status does not allow the action (e.g. verifying a suspended hotel). */
  HOTEL_STATUS_CONFLICT: 'HOTEL_STATUS_CONFLICT',
  ROOM_TYPE_NOT_FOUND: 'ROOM_TYPE_NOT_FOUND',
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  STAFF_NOT_FOUND: 'STAFF_NOT_FOUND',
  /** The staff account is not in a state the action applies to (e.g. deactivating a pending invitation). */
  STAFF_STATUS_CONFLICT: 'STAFF_STATUS_CONFLICT',
  /** The room number already exists in this hotel. */
  ROOM_NUMBER_TAKEN: 'ROOM_NUMBER_TAKEN',
  /** Creating the room would exceed `totalRooms` of the hotel's room configuration. */
  ROOM_LIMIT_REACHED: 'ROOM_LIMIT_REACHED',
  /** The room type still has physical rooms and cannot be deleted. */
  ROOM_TYPE_IN_USE: 'ROOM_TYPE_IN_USE',
  /** The room is occupied and cannot be locked. */
  ROOM_NOT_LOCKABLE: 'ROOM_NOT_LOCKABLE',

  // Verification
  /** Verification request or document does not exist or the caller cannot see it. */
  VERIFICATION_NOT_FOUND: 'VERIFICATION_NOT_FOUND',
  /** The hotel already has a request waiting for review. */
  VERIFICATION_PENDING: 'VERIFICATION_PENDING',
  /** A required document (business license, fire safety, security) is missing. */
  VERIFICATION_DOCUMENTS_MISSING: 'VERIFICATION_DOCUMENTS_MISSING',
  /** The request was already approved, rejected or sent back. */
  VERIFICATION_ALREADY_DECIDED: 'VERIFICATION_ALREADY_DECIDED',

  // Uploads
  /** Unsupported file type or file larger than allowed. */
  UPLOAD_INVALID_FILE: 'UPLOAD_INVALID_FILE',
  /** File storage is not configured or not reachable; try again later. */
  UPLOAD_UNAVAILABLE: 'UPLOAD_UNAVAILABLE',
  /** Hotel or room type image does not exist or belongs to a hotel the caller cannot manage. */
  IMAGE_NOT_FOUND: 'IMAGE_NOT_FOUND',
  /** The hotel or room type already has the maximum number of images. */
  IMAGE_LIMIT_REACHED: 'IMAGE_LIMIT_REACHED',

  // Pricing and availability
  /** Pricing rule does not exist or belongs to a hotel the caller cannot manage. */
  PRICING_RULE_NOT_FOUND: 'PRICING_RULE_NOT_FOUND',
  /** Rooms on sale set below the rooms already booked or held for a day. */
  AVAILABILITY_BELOW_BOOKED: 'AVAILABILITY_BELOW_BOOKED',

  // Bookings
  /** Not enough rooms of the type left for every night of the stay (MSG12). */
  ROOM_SOLD_OUT: 'ROOM_SOLD_OUT',
  /** The total differs from `expectedTotal`; `details` holds the new total (MSG13). */
  BOOKING_PRICE_CHANGED: 'BOOKING_PRICE_CHANGED',
  /** Booking does not exist or the caller cannot see it. */
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
  /** The booking's status does not allow the action. */
  BOOKING_STATUS_CONFLICT: 'BOOKING_STATUS_CONFLICT',
  /** Cancelling after check-in (BR-09). */
  CANCELLATION_NOT_ALLOWED: 'CANCELLATION_NOT_ALLOWED',
  /** Deciding a refund that is not pending. */
  REFUND_STATUS_CONFLICT: 'REFUND_STATUS_CONFLICT',
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
