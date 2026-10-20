/**
 * Verification documents are uploaded before the request exists, so they are grouped by partner. When a request is
 * submitted, a `fileId` is accepted only if it lies in the submitting partner's folder.
 */
export const verificationFolder = (hotelPartnerId: string) =>
  `stayreco/verification/${hotelPartnerId}`;

/**
 * Exact shape produced by `StorageService.uploadPrivate`: `<folder>/<public id>.<format>`. A prefix check alone would
 * also accept crafted ids such as `<folder>/../<other partner>/x.pdf`.
 */
const FILE_NAME = /^[A-Za-z0-9_-]{1,100}\.(pdf|jpg|jpeg|png)$/;

export const isOwnVerificationFile = (
  hotelPartnerId: string,
  fileId: string,
) => {
  const folder = `${verificationFolder(hotelPartnerId)}/`;
  return (
    fileId.startsWith(folder) && FILE_NAME.test(fileId.slice(folder.length))
  );
};
