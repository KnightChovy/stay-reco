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
  /** More rooms asked on sale than are left after bookings and holds on some day; `details` lists those days. */
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

  // Front desk and change requests
  /** The voucher QR token was edited or is not a StayReco voucher (MSG20). */
  VOUCHER_INVALID: 'VOUCHER_INVALID',
  /** Check-in before the check-in date, or on / after the check-out date. */
  CHECK_IN_NOT_OPEN: 'CHECK_IN_NOT_OPEN',
  /** Check-in or no-show while a refund request waits for the hotel. */
  REFUND_DECISION_PENDING: 'REFUND_DECISION_PENDING',
  /** A chosen room is of another room type, not AVAILABLE, or taken on a remaining night (BR-10). */
  ROOM_NOT_ASSIGNABLE: 'ROOM_NOT_ASSIGNABLE',
  /** Marking a no-show before the day after the check-in date. */
  NO_SHOW_NOT_ALLOWED: 'NO_SHOW_NOT_ALLOWED',
  /** Marking a room cleaned when it is not CLEANING. */
  ROOM_STATUS_CONFLICT: 'ROOM_STATUS_CONFLICT',
  /** The booking already has a change request waiting. */
  CHANGE_REQUEST_PENDING: 'CHANGE_REQUEST_PENDING',
  /** Accepting or rejecting when no change request is waiting. */
  CHANGE_REQUEST_STATUS_CONFLICT: 'CHANGE_REQUEST_STATUS_CONFLICT',

  // Notifications
  /** Notification does not exist or belongs to someone else. */
  NOTIFICATION_NOT_FOUND: 'NOTIFICATION_NOT_FOUND',

  // Reviews (BR-12)
  /** The review does not exist, or belongs to another customer. */
  REVIEW_NOT_FOUND: 'REVIEW_NOT_FOUND',
  /** Writing a review for a stay that is not COMPLETED yet. */
  REVIEW_NOT_ALLOWED: 'REVIEW_NOT_ALLOWED',
  /** The booking already has a review; one review per stay. */
  REVIEW_ALREADY_EXISTS: 'REVIEW_ALREADY_EXISTS',
  /** The review window closed (REVIEW_WINDOW_DAYS after check-out). */
  REVIEW_WINDOW_CLOSED: 'REVIEW_WINDOW_CLOSED',
  /** A sub-rating names a criterion that does not exist. */
  RATING_CRITERION_NOT_FOUND: 'RATING_CRITERION_NOT_FOUND',
  /** The review photo does not exist, or belongs to another customer's review. */
  REVIEW_IMAGE_NOT_FOUND: 'REVIEW_IMAGE_NOT_FOUND',
  /** Flagging the same review, or the same photo, twice. */
  REPORT_ALREADY_RAISED: 'REPORT_ALREADY_RAISED',
  /** The report does not exist. */
  REPORT_NOT_FOUND: 'REPORT_NOT_FOUND',
  /** Deciding a report that is already resolved or dismissed. */
  REPORT_STATUS_CONFLICT: 'REPORT_STATUS_CONFLICT',

  // Promotions and vouchers (BR-06)
  /** The discount code does not exist, or belongs to another customer. */
  VOUCHER_NOT_FOUND: 'VOUCHER_NOT_FOUND',
  /** The voucher was already used on another booking. */
  VOUCHER_ALREADY_USED: 'VOUCHER_ALREADY_USED',
  /** The voucher, or the campaign behind it, is past its end date. */
  VOUCHER_EXPIRED: 'VOUCHER_EXPIRED',
  /** The stay is below the campaign's minimum amount, or is at another hotel. */
  VOUCHER_NOT_APPLICABLE: 'VOUCHER_NOT_APPLICABLE',
  /** The promotion does not exist, or belongs to another hotel. */
  PROMOTION_NOT_FOUND: 'PROMOTION_NOT_FOUND',
  /** The campaign is switched off, outside its dates, or has run out of uses. */
  PROMOTION_NOT_ACTIVE: 'PROMOTION_NOT_ACTIVE',

  // Loyalty (BR-11)
  /** No loyalty programme is running, so points cannot be earned or spent. */
  LOYALTY_PROGRAM_NOT_FOUND: 'LOYALTY_PROGRAM_NOT_FOUND',
  /** Spending more points than the customer holds. */
  LOYALTY_POINTS_INSUFFICIENT: 'LOYALTY_POINTS_INSUFFICIENT',

  // Customer wallet
  /** The wallet balance does not cover the whole booking; paying from it is all or nothing (decision W1). */
  WALLET_INSUFFICIENT: 'WALLET_INSUFFICIENT',

  // Withdrawals (BR-22, decisions M1–M3)
  /** The withdrawal doesn't exist, or belongs to another hotel. */
  PAYOUT_NOT_FOUND: 'PAYOUT_NOT_FOUND',
  /** The hotel already has a withdrawal waiting for a platform manager; one at a time. */
  PAYOUT_PENDING: 'PAYOUT_PENDING',
  /** More than the available balance (MSG30); `details[0].message` holds the available balance. */
  PAYOUT_EXCEEDS_BALANCE: 'PAYOUT_EXCEEDS_BALANCE',
  /** The hotel has no approved verification with a beneficiary account to pay to. */
  BENEFICIARY_MISSING: 'BENEFICIARY_MISSING',
  /** The withdrawal is no longer pending (paid, rejected or cancelled in the meantime). */
  PAYOUT_STATUS_CONFLICT: 'PAYOUT_STATUS_CONFLICT',

  // Compliance (BR-15, decision M8)
  /** The compliance case doesn't exist. */
  VIOLATION_NOT_FOUND: 'VIOLATION_NOT_FOUND',
  /** The case is closed, or the status change does not follow OPEN → INVESTIGATING → RESOLVED / DISMISSED. */
  VIOLATION_STATUS_CONFLICT: 'VIOLATION_STATUS_CONFLICT',
  /** The partner already has a suspension request waiting for the admin. */
  SUSPENSION_REQUEST_PENDING: 'SUSPENSION_REQUEST_PENDING',
  /** The hotel partner doesn't exist. */
  PARTNER_NOT_FOUND: 'PARTNER_NOT_FOUND',
  /** The partner's status does not allow it (reinstating a partner that is not suspended). */
  PARTNER_STATUS_CONFLICT: 'PARTNER_STATUS_CONFLICT',
  /** The suspension request doesn't exist. */
  SUSPENSION_REQUEST_NOT_FOUND: 'SUSPENSION_REQUEST_NOT_FOUND',
  /** The suspension request was already decided. */
  SUSPENSION_STATUS_CONFLICT: 'SUSPENSION_STATUS_CONFLICT',

  // Administration
  /** The account doesn't exist. */
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  /** The account's status does not allow it (locking a locked account, unlocking an active one). */
  ACCOUNT_STATUS_CONFLICT: 'ACCOUNT_STATUS_CONFLICT',

  // Payments
  /** A webhook call (SePay) with a missing or wrong API key; nothing is processed. Not a client error to refresh. */
  INVALID_API_KEY: 'INVALID_API_KEY',
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
