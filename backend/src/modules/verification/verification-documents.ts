/**
 * Verification documents are uploaded before the request exists, so they are grouped by partner. When a request is
 * submitted, a `fileId` is accepted only if it lies in the submitting partner's folder.
 */
export const verificationFolder = (hotelPartnerId: string) =>
  `stayreco/verification/${hotelPartnerId}`;

export const isOwnVerificationFile = (hotelPartnerId: string, fileId: string) =>
  fileId.startsWith(`${verificationFolder(hotelPartnerId)}/`);
