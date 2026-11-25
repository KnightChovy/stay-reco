import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface AccountMessage {
  /** The account it goes to. */
  accountId: string;
  subject: string;
  lines: string[];
  /** Also an in-app notification opening this path; left out for an account that cannot sign in. */
  link?: string;
}

/**
 * Tells people about the admin's decisions on their account (locked, unlocked, partner suspended or reinstated) and
 * the manager about the decision on a suspension request. Sent in the background like the booking emails; failures are
 * logged, the decision stands.
 */
@Injectable()
export class AccountMailer {
  private readonly logger = new Logger(AccountMailer.name);
  private readonly pending = new Set<Promise<void>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  send(...messages: AccountMessage[]) {
    const task: Promise<void> = this.deliver(messages).finally(() =>
      this.pending.delete(task),
    );
    this.pending.add(task);
  }

  /** Resolves once the messages already started are sent (tests wait on it instead of guessing a delay). */
  async idle() {
    while (this.pending.size) await Promise.all([...this.pending]);
  }

  private async deliver(messages: AccountMessage[]) {
    for (const m of messages) {
      try {
        const account = await this.prisma.userAccount.findUnique({
          where: { userAccountId: m.accountId },
          select: { email: true, fullName: true },
        });
        if (!account) continue;
        if (m.link) {
          await this.notifications.create({
            userAccountId: m.accountId,
            type: 'SYSTEM',
            title: m.subject,
            message: m.lines.join(' '),
            link: m.link,
          });
        }
        await this.mail.send({
          to: account.email,
          subject: m.subject,
          text: [
            `Xin chào ${account.fullName},`,
            '',
            ...m.lines,
            ...(m.link ? ['', `Xem chi tiết: ${this.webApp()}${m.link}`] : []),
          ].join('\n'),
        });
      } catch (err) {
        this.logger.error(
          `Account message to ${m.accountId} failed: ${String(err)}`,
        );
      }
    }
  }

  private webApp() {
    return this.config.get('WEB_APP_URL', { infer: true }).replace(/\/$/, '');
  }
}
