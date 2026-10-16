/**
 * Stable error codes returned in `ErrorResponse.code`. Clients map these to UI messages (MSGxx) and i18n,
 * so never rename a published code; add a new one instead.
 */
export enum ErrorCode {
  // Generic: used when an exception carries no specific code (derived from the HTTP status).
  BAD_REQUEST = 'BAD_REQUEST',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  /** Missing, invalid or expired access token. The only 401 a client should answer with a token refresh. */
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  INTERNAL_ERROR = 'INTERNAL_ERROR',

  // Auth
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_ACCOUNT_LOCKED = 'AUTH_ACCOUNT_LOCKED',
  AUTH_ACCOUNT_SUSPENDED = 'AUTH_ACCOUNT_SUSPENDED',
  AUTH_ACCOUNT_INACTIVE = 'AUTH_ACCOUNT_INACTIVE',
  AUTH_EMAIL_TAKEN = 'AUTH_EMAIL_TAKEN',
  AUTH_WRONG_PASSWORD = 'AUTH_WRONG_PASSWORD',
  /** Email-verification, password-reset or invitation token is invalid, expired or already used. */
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  /** Refresh token missing, invalid, expired or reused. The client must sign in again. */
  AUTH_REFRESH_TOKEN_INVALID = 'AUTH_REFRESH_TOKEN_INVALID',
  AUTH_INVITATION_ACCEPTED = 'AUTH_INVITATION_ACCEPTED',
  AUTH_SESSION_NOT_FOUND = 'AUTH_SESSION_NOT_FOUND',

  // Hotel
  /** Hotel does not exist or does not belong to the caller (the two cases are not distinguished). */
  HOTEL_NOT_FOUND = 'HOTEL_NOT_FOUND',
}
