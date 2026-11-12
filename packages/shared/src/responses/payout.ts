import { z } from 'zod';
import { PartnerStatus } from '../enums';
import { PAYOUT_STATUSES } from '../schemas/payout';
import { isoDateTime, responseSchemas } from './registry';

/** Content of `data` returned by the withdrawal endpoints (docs/api/partner.md and manager.md, "Withdrawals"). */

const payoutFields = {
  id: z.uuid().describe('The id of the `PAYOUT` wallet movement that reserved the amount (decision M1).'),
  hotel: z.object({ id: z.uuid(), name: z.string() }),
  amount: z.number().describe('VND, whole dong.'),
  status: z.enum(PAYOUT_STATUSES),
  beneficiary: z
    .object({
      bankName: z.string(),
      accountNumber: z.string(),
      accountHolder: z.string(),
    })
    .describe('The account of the verification request approved when the withdrawal was asked for.'),
  requestedAt: isoDateTime(),
  dueBy: isoDateTime().describe('2 working days (Monday to Friday, Vietnam time) after the request (BR-22).'),
  overdue: z.boolean().describe('Still `PENDING` after `dueBy`.'),
  decidedAt: isoDateTime().nullable().describe('When it was paid, rejected or cancelled.'),
  bankReference: z.string().nullable().describe('`PAID`: the reference of the bank transfer.'),
  reason: z.string().nullable().describe("`REJECTED`: the manager's reason."),
};

export const payoutResponseSchema = z
  .object({
    ...payoutFields,
    beneficiary: payoutFields.beneficiary.describe(
      'The account of the verification request approved when the withdrawal was asked for; number masked (`****6789`).',
    ),
  })
  .register(responseSchemas, {
    id: 'Payout',
    description: "A withdrawal from the hotel wallet to the partner's bank account, as the partner sees it.",
  });
export type Payout = z.infer<typeof payoutResponseSchema>;

export const managerPayoutResponseSchema = z
  .object({
    ...payoutFields,
    beneficiary: payoutFields.beneficiary.describe(
      'The account to transfer to: masked in the queue, in full in the detail (each opening is audited, M3).',
    ),
    partner: z.object({
      id: z.uuid(),
      name: z.string(),
      status: z.enum(PartnerStatus),
    }),
    decidedBy: z
      .object({ id: z.uuid(), fullName: z.string() })
      .nullable()
      .describe('The platform manager who paid or rejected it; null while pending or when the partner cancelled.'),
  })
  .register(responseSchemas, {
    id: 'ManagerPayout',
    description: 'A withdrawal in the platform manager queue.',
  });
export type ManagerPayout = z.infer<typeof managerPayoutResponseSchema>;
