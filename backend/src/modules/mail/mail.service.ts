import { Injectable, Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';

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

export interface SmtpOptions {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

/** Sends real emails through any SMTP server (Gmail, Mailtrap, Brevo...): switching provider only changes .env. */
export class SmtpMailService extends MailService {
  private readonly logger = new Logger('Mail');
  private readonly transporter: Transporter;

  constructor(private readonly options: SmtpOptions) {
    super();
    this.transporter = createTransport({
      host: options.host,
      port: options.port,
      secure: options.secure,
      auth: { user: options.user, pass: options.pass },
      // Nodemailer waits up to 2 minutes by default; a blocked SMTP port (some hosts block it) would hold the request.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }

  /** Checks the SMTP login at startup so a wrong config shows up in the logs right away, not on the first email. */
  async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.log(
        `SMTP ready: ${this.options.host}:${this.options.port} as ${this.options.user}`,
      );
    } catch (err) {
      this.logger.error(
        `SMTP connection failed (${this.options.host}:${this.options.port}): ${describe(err)}`,
      );
    }
  }

  /**
   * Never throws: a mail failure must not break the request (the account is already saved and the
   * user can ask to resend). The SMTP server's answer is logged so delivery problems can be traced.
   */
  async send(message: MailMessage): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.options.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
      });
      this.logger.log(
        `Sent "${message.subject}" to ${message.to} (${info.messageId})`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to send "${message.subject}" to ${message.to}: ${describe(err)}`,
      );
    }
  }
}

/** Nodemailer errors carry the SMTP code and server response, which explain most delivery problems. */
function describe(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  const { code, responseCode, response } = err as Error & {
    code?: string;
    responseCode?: number;
    response?: string;
  };
  return [err.message, code, responseCode, response]
    .filter(Boolean)
    .join(' | ');
}
