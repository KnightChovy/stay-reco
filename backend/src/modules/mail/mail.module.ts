import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../../config/env';
import {
  ConsoleMailService,
  MailService,
  SmtpMailService,
} from './mail.service';

@Global()
@Module({
  providers: [
    {
      provide: MailService,
      inject: [ConfigService],
      // SMTP when SMTP_HOST is set (env validation guarantees the rest); otherwise print to the console.
      useFactory: (config: ConfigService<Env, true>): MailService => {
        const host = config.get('SMTP_HOST', { infer: true });
        if (!host) return new ConsoleMailService();

        const smtp = new SmtpMailService({
          host,
          port: config.get('SMTP_PORT', { infer: true }),
          secure: config.get('SMTP_SECURE', { infer: true }),
          user: config.get('SMTP_USER', { infer: true }),
          pass: config.get('SMTP_PASS', { infer: true }),
          from: config.get('MAIL_FROM', { infer: true }),
        });
        void smtp.verifyConnection();
        return smtp;
      },
    },
  ],
  exports: [MailService],
})
export class MailModule {}
