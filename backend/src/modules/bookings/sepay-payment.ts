import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env';
import type { PaymentDetails } from './booking.mapper';

/**
 * What the payment page shows (customer.md, "Payment (SePay)"): the platform account linked to SePay and a VietQR
 * image with the amount and the booking code filled in, so the banking app pre-fills the transfer.
 */
@Injectable()
export class SepayPayment {
  constructor(private readonly config: ConfigService<Env, true>) {}

  readonly details: PaymentDetails = ({ amount, code, expiresAt }) => {
    const get = <K extends keyof Env>(key: K) =>
      this.config.get(key, { infer: true });
    const qr = new URL('https://qr.sepay.vn/img');
    qr.search = new URLSearchParams({
      acc: get('SEPAY_ACCOUNT_NUMBER'),
      bank: get('SEPAY_BANK_CODE'),
      amount: amount.toString(),
      des: code,
    }).toString();
    return {
      method: 'SEPAY',
      bankName: get('SEPAY_BANK_NAME'),
      accountNumber: get('SEPAY_ACCOUNT_NUMBER'),
      accountName: get('SEPAY_ACCOUNT_NAME'),
      amount,
      transferContent: code,
      qrImageUrl: qr.toString(),
      expiresAt: expiresAt.toISOString(),
    };
  };
}
