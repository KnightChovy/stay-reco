import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';

const REVENUE_PATH = '/partner/revenue';

const vnd = (amount: number) =>
  `${new Intl.NumberFormat('vi-VN').format(amount)} ₫`;

/**
 * Tells the partner what happened to a withdrawal (SRS 3.15.5: "the partner is notified either way"): one in-app
 * notification and one email to the owner's account. Sent in the background, so a slow SMTP server never holds the
 * manager's click; failures are logged, the decision stands.
 */
@Injectable()
export class PayoutMailer {
  private readonly logger = new Logger(PayoutMailer.name);
  private readonly pending = new Set<Promise<void>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  paid(payoutId: string, bankReference: string) {
    this.send(payoutId, (p) => ({
      subject: `Đã chuyển khoản ${vnd(p.amount)} cho ${p.hotel}`,
      lines: [
        `Yêu cầu rút ${vnd(p.amount)} của khách sạn ${p.hotel} đã được chuyển về tài khoản thụ hưởng.`,
        `Mã giao dịch ngân hàng: ${bankReference}`,
      ],
    }));
  }

  rejected(payoutId: string, reason: string) {
    this.send(payoutId, (p) => ({
      subject: `Yêu cầu rút tiền của ${p.hotel} bị từ chối`,
      lines: [
        `Yêu cầu rút ${vnd(p.amount)} của khách sạn ${p.hotel} đã bị từ chối.`,
        `Lý do: ${reason}`,
        'Số tiền đã được trả lại số dư khả dụng của ví khách sạn.',
      ],
    }));
  }

  /** Resolves once the messages already started are sent (tests wait on it instead of guessing a delay). */
  async idle() {
    while (this.pending.size) await Promise.all([...this.pending]);
  }

  private send(
    payoutId: string,
    compose: (p: { amount: number; hotel: string }) => {
      subject: string;
      lines: string[];
    },
  ) {
    const task: Promise<void> = this.deliver(payoutId, compose).finally(() =>
      this.pending.delete(task),
    );
    this.pending.add(task);
  }

  private async deliver(
    payoutId: string,
    compose: (p: { amount: number; hotel: string }) => {
      subject: string;
      lines: string[];
    },
  ) {
    try {
      const row = await this.prisma.walletTransaction.findUnique({
        where: { walletTransactionId: payoutId },
        select: {
          amount: true,
          wallet: {
            select: {
              hotel: {
                select: {
                  name: true,
                  hotelPartner: {
                    select: {
                      hotelPartnerId: true,
                      userAccount: { select: { email: true, fullName: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });
      const hotel = row?.wallet.hotel;
      if (!row || !hotel) return;
      const { subject, lines } = compose({
        amount: row.amount.negated().toNumber(),
        hotel: hotel.name,
      });
      const owner = hotel.hotelPartner;
      await this.notifications.create({
        userAccountId: owner.hotelPartnerId,
        type: 'PAYMENT',
        title: subject,
        message: lines.join(' '),
        link: REVENUE_PATH,
      });
      await this.mail.send({
        to: owner.userAccount.email,
        subject,
        text: [
          `Xin chào ${owner.userAccount.fullName},`,
          '',
          ...lines,
          '',
          `Xem ví khách sạn: ${this.webApp()}${REVENUE_PATH}`,
        ].join('\n'),
      });
    } catch (err) {
      this.logger.error(
        `Withdrawal message for ${payoutId} failed: ${String(err)}`,
      );
    }
  }

  private webApp() {
    return this.config.get('WEB_APP_URL', { infer: true }).replace(/\/$/, '');
  }
}
