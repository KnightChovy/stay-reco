import { Injectable } from '@nestjs/common';
import { MailService } from '../mail/mail.service';

export type VerificationOutcome =
  'APPROVED' | 'REJECTED' | 'NEEDS_REVISION' | 'REVERIFICATION';

const SUBJECT: Record<VerificationOutcome, string> = {
  APPROVED: 'Your hotel has been verified',
  REJECTED: 'Your hotel verification was rejected',
  NEEDS_REVISION: 'Your hotel verification needs changes',
  REVERIFICATION: 'Please verify your hotel again',
};

const BODY: Record<VerificationOutcome, string> = {
  APPROVED: 'is now active on StayReco and visible to guests.',
  REJECTED: 'was not approved.',
  NEEDS_REVISION:
    'needs changes before it can be approved. Update the request and submit it again.',
  REVERIFICATION:
    'must be verified again. It stays active meanwhile; submit an updated verification request.',
};

/** Emails the partner each verification decision (decided 2026-10-20), with the reviewer's reason. */
@Injectable()
export class VerificationMailer {
  constructor(private readonly mail: MailService) {}

  /** MailService never throws, so a mail problem cannot undo a decision already saved. */
  send(
    to: string,
    outcome: VerificationOutcome,
    hotelName: string,
    reason: string | null,
  ) {
    return this.mail.send({
      to,
      subject: SUBJECT[outcome],
      text: [
        `The verification of "${hotelName}" ${BODY[outcome]}`,
        reason ? `\nReason: ${reason}` : '',
        '\nOpen the partner portal to see the details.',
      ].join('\n'),
    });
  }
}
