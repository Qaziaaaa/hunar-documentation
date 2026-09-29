import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const CONNECT_ATTEMPTS = 5;
const CONNECT_RETRY_BASE_DELAY_MS = 1000;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      transactionOptions: {
        maxWait: 15000,
        timeout: 30000,
      },
    });
  }

  async onModuleInit(): Promise<void> {
    await this.connectWithRetry();
  }

  // The database endpoint (Neon pooler) intermittently refuses the very first
  // connection, so a single transient failure must not crash the whole app at boot.
  private async connectWithRetry(
    attempts = CONNECT_ATTEMPTS,
    baseDelayMs = CONNECT_RETRY_BASE_DELAY_MS,
  ): Promise<void> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        await this.$connect();
        if (attempt > 1) {
          this.logger.log(`Database connected on attempt ${attempt}/${attempts}`);
        }
        return;
      } catch (error) {
        lastError = error;
        if (attempt >= attempts) break;
        const delayMs = baseDelayMs * attempt;
        this.logger.warn(
          `Database connection attempt ${attempt}/${attempts} failed; retrying in ${delayMs}ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    throw lastError;
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
