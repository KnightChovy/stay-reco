import type {
  SubmitVerificationInput,
  VerificationRequest,
  VerificationRequestSummary,
} from '@stayreco/shared';
import type { FieldCipher } from '../../common/crypto/field-cipher';
import type { Prisma } from '../../generated/prisma/client';

/**
 * A request's answers are `hotel_properties` rows linked to it (contract D8), keyed `legal.*`, `property.*` and
 * `beneficiary.*`. Each submission keeps its own copy, so later edits never change what was reviewed.
 */
const PREFIX = {
  legal: 'legal.',
  property: 'property.',
  beneficiary: 'beneficiary.',
} as const;
const ACCOUNT_NUMBER_KEY = `${PREFIX.beneficiary}accountNumber`;

export const requestInclude = {
  hotel: { select: { name: true } },
  hotelProperties: { orderBy: { propertyKey: 'asc' } },
  hotelVerificationDocuments: { orderBy: { uploadedAt: 'asc' } },
} satisfies Prisma.HotelVerificationRequestInclude;

export type RequestWithDetails = Prisma.HotelVerificationRequestGetPayload<{
  include: typeof requestInclude;
}>;

export const summaryInclude = {
  hotel: { select: { name: true } },
} satisfies Prisma.HotelVerificationRequestInclude;

type RequestRow = Prisma.HotelVerificationRequestGetPayload<{
  include: typeof summaryInclude;
}>;

/** Flattens the wizard answers into property rows; the account number is stored encrypted. */
export function toSnapshotRows(
  input: SubmitVerificationInput,
  cipher: FieldCipher,
): { propertyKey: string; propertyValue: string }[] {
  const rows = (prefix: string, values: Record<string, unknown>) =>
    Object.entries(values)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => ({
        propertyKey: prefix + key,
        propertyValue: String(value),
      }));
  return [
    ...rows(PREFIX.legal, input.legal),
    ...rows(PREFIX.property, input.property),
    ...rows(PREFIX.beneficiary, {
      ...input.beneficiary,
      accountNumber: cipher.encrypt(input.beneficiary.accountNumber),
    }),
  ];
}

/** `notificationEmail` given in the request (where decisions are emailed), if any. */
export const notificationEmailOf = (r: RequestWithDetails) =>
  r.hotelProperties.find(
    (p) => p.propertyKey === `${PREFIX.legal}notificationEmail`,
  )?.propertyValue ?? null;

export const toVerificationSummary = (
  r: RequestRow,
): VerificationRequestSummary => ({
  id: r.verificationRequestId,
  hotelId: r.hotelId,
  hotelName: r.hotel.name,
  requestType: r.requestType,
  status: r.status,
  submittedAt: r.createdAt.toISOString(),
  reviewedAt: r.reviewedAt?.toISOString() ?? null,
});

/**
 * `fullAccountNumber`: the detail view shows the whole number to the owner and platform managers; lists show only
 * the last 4 digits (contract D12).
 */
export function toVerificationRequest(
  r: RequestWithDetails,
  cipher: FieldCipher,
  { fullAccountNumber }: { fullAccountNumber: boolean },
): VerificationRequest {
  const section = (prefix: string) =>
    Object.fromEntries(
      r.hotelProperties
        .filter((p) => p.propertyKey.startsWith(prefix))
        .map((p) => [p.propertyKey.slice(prefix.length), p.propertyValue]),
    ) as Record<string, string>;

  const beneficiary = section(PREFIX.beneficiary);
  const encrypted = r.hotelProperties.find(
    (p) => p.propertyKey === ACCOUNT_NUMBER_KEY,
  )?.propertyValue;
  const accountNumber = encrypted ? cipher.decrypt(encrypted) : '';

  return {
    ...toVerificationSummary(r),
    reason: r.notes,
    legal: section(PREFIX.legal),
    // A manager's re-verification request has no answers yet.
    beneficiary: encrypted
      ? {
          bankName: beneficiary.bankName,
          accountNumber: fullAccountNumber
            ? accountNumber
            : `****${accountNumber.slice(-4)}`,
          accountHolder: beneficiary.accountHolder,
        }
      : null,
    property: section(PREFIX.property),
    documents: r.hotelVerificationDocuments.map((d) => ({
      id: d.verificationDocumentId,
      documentType: d.documentType,
      uploadedAt: d.uploadedAt.toISOString(),
    })),
  };
}
