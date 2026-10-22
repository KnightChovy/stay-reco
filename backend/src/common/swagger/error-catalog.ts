import { ErrorCode } from '../errors/error-code';

interface ErrorInfo {
  status: number;
  description: string;
}

/**
 * HTTP status and meaning of every error code, as listed in docs/api-guide.md §4.3. Typed as a full record so a new
 * code does not compile until it is described here too.
 */
export const ERROR_CATALOG: Record<ErrorCode, ErrorInfo> = {
  BAD_REQUEST: { status: 400, description: 'Malformed request' },
  VALIDATION_ERROR: {
    status: 400,
    description:
      'Invalid body or query, or unknown fields; `details` lists each field',
  },
  UNAUTHENTICATED: {
    status: 401,
    description:
      'Missing, invalid or expired access token, or revoked session; refresh the token',
  },
  FORBIDDEN: { status: 403, description: 'Signed in but not allowed' },
  NOT_FOUND: { status: 404, description: 'Resource or route not found' },
  CONFLICT: { status: 409, description: 'Data conflict' },
  TOO_MANY_REQUESTS: {
    status: 429,
    description: 'Rate limited (login 5/min, emails 3 per 15 min)',
  },
  INTERNAL_ERROR: { status: 500, description: 'Server error' },
  SERVICE_UNAVAILABLE: {
    status: 503,
    description: 'The database is down or not answering; try again later',
  },

  AUTH_INVALID_CREDENTIALS: {
    status: 401,
    description: 'Wrong email or password (including unknown email)',
  },
  AUTH_ACCOUNT_LOCKED: {
    status: 403,
    description: '5 wrong passwords; locked for 15 minutes',
  },
  AUTH_ACCOUNT_SUSPENDED: { status: 403, description: 'Account suspended' },
  AUTH_ACCOUNT_DEACTIVATED: {
    status: 403,
    description: 'Staff account turned off by the hotel partner',
  },
  AUTH_ACCOUNT_INACTIVE: {
    status: 403,
    description: 'Password reset for an inactive account',
  },
  AUTH_EMAIL_NOT_VERIFIED: {
    status: 403,
    description:
      'Correct password but the email code was not entered yet; show the OTP screen',
  },
  AUTH_OTP_INVALID: {
    status: 400,
    description: 'Wrong email code (also returned for unknown emails)',
  },
  AUTH_OTP_EXPIRED: {
    status: 400,
    description: 'Email code expired, already used, or 5 attempts used',
  },
  AUTH_EMAIL_TAKEN: { status: 409, description: 'Email already registered' },
  AUTH_WRONG_PASSWORD: {
    status: 401,
    description: 'Wrong current password',
  },
  AUTH_TOKEN_INVALID: {
    status: 400,
    description:
      'Password-reset or invitation link is invalid, expired or already used',
  },
  AUTH_REFRESH_TOKEN_INVALID: {
    status: 401,
    description:
      'Refresh token missing, invalid, expired or reused; sign in again',
  },
  AUTH_INVITATION_ACCEPTED: {
    status: 409,
    description: 'Invitation already accepted',
  },
  AUTH_SESSION_NOT_FOUND: {
    status: 404,
    description: "Session doesn't exist",
  },

  HOTEL_NOT_FOUND: {
    status: 404,
    description: "Hotel doesn't exist or the caller has no access to it",
  },
  PARTNER_SUSPENDED: {
    status: 403,
    description:
      'The partner is suspended: hotels stay readable, changes are refused',
  },
  HOTEL_STATUS_CONFLICT: {
    status: 409,
    description: "The hotel's status does not allow the action",
  },
  ROOM_TYPE_NOT_FOUND: {
    status: 404,
    description: "Room type doesn't exist or belongs to another hotel",
  },
  ROOM_NOT_FOUND: {
    status: 404,
    description: "Room doesn't exist or belongs to another hotel",
  },
  STAFF_NOT_FOUND: {
    status: 404,
    description: "Staff member doesn't exist or works at another hotel",
  },
  STAFF_STATUS_CONFLICT: {
    status: 409,
    description: "The staff member's status does not allow the action",
  },
  ROOM_NUMBER_TAKEN: {
    status: 409,
    description: 'Room number already used in this hotel',
  },
  ROOM_LIMIT_REACHED: {
    status: 409,
    description:
      'No room configuration yet, or more rooms than its declared total',
  },
  ROOM_TYPE_IN_USE: {
    status: 409,
    description: 'The room type still has rooms or bookings',
  },
  ROOM_NOT_LOCKABLE: {
    status: 409,
    description:
      'Locking a room that has a guest, or unlocking a room that is not locked',
  },
  VERIFICATION_NOT_FOUND: {
    status: 404,
    description:
      "Verification request or document doesn't exist or the caller cannot see it",
  },
  VERIFICATION_PENDING: {
    status: 409,
    description: 'A verification request is already waiting for review',
  },
  VERIFICATION_DOCUMENTS_MISSING: {
    status: 400,
    description:
      'A required document is missing (business license, fire safety, security certificate)',
  },
  VERIFICATION_ALREADY_DECIDED: {
    status: 409,
    description: 'The request already has a decision; reload it',
  },
  UPLOAD_INVALID_FILE: {
    status: 400,
    description:
      'File missing, of a type not allowed, larger than 10 MB, or damaged',
  },
  UPLOAD_UNAVAILABLE: {
    status: 503,
    description: 'File storage not configured or unreachable',
  },
  IMAGE_NOT_FOUND: {
    status: 404,
    description:
      "Image doesn't exist or belongs to a hotel the caller doesn't manage",
  },
  IMAGE_LIMIT_REACHED: {
    status: 409,
    description: 'Already 30 images',
  },
};
