import { Injectable, Logger } from '@nestjs/common';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

/** Swap the provider in MailModule (SMTP, Resend, ...) without touching callers. */
export abstract class MailService {
  abstract send(message: MailMessage): Promise<void>;
}

@Injectable()
export class ConsoleMailService extends MailService {
  private readonly logger = new Logger('Mail');

  send(message: MailMessage): Promise<void> {
    this.logger.log(
      `\nTo: ${message.to}\nSubject: ${message.subject}\n\n${message.text}\n`,
    );
    return Promise.resolve();
  }
}
