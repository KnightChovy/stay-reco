import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Env } from '../config/env';
import { PrismaClient } from '../generated/prisma/client';

/** Longest wait for background work at shutdown; hosts give a few more seconds before killing the process. */
const DRAIN_TIMEOUT_MS = 10_000;

/** Prisma 7 requires a driver adapter; it connects through node-postgres. */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly drains: (() => Promise<unknown>)[] = [];

  constructor(config: ConfigService<Env, true>) {
    super({
      adapter: new PrismaPg({
        connectionString: config.get('DATABASE_URL', { infer: true }),
      }),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Background work that still needs the database (emails being sent) registers here and is waited for before the
   * connection closes. Nest's shutdown order does not promise that its module stops before this one.
   */
  onBeforeDisconnect(drain: () => Promise<unknown>) {
    this.drains.push(drain);
  }

  async onModuleDestroy() {
    let timer: NodeJS.Timeout | undefined;
    await Promise.race([
      Promise.allSettled(this.drains.map((drain) => drain())),
      new Promise((resolve) => {
        timer = setTimeout(resolve, DRAIN_TIMEOUT_MS);
      }),
    ]);
    clearTimeout(timer);
    await this.$disconnect();
  }
}
