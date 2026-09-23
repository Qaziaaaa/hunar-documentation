import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from './wallet.service';

// Subscribes the wallet to domain events outside the request lifecycle:
//  - commission.statusChanged -> RECEIVED  => confirm (deduct) the held commission.
//  - job.statusChanged        -> COMPLETED => credit earnings (locked visit charge).
//  - job.cancelled                           => reverse the held commission.
// Every handler is isolated so a wallet failure can never crash the emitter.
@Injectable()
export class WalletListener {
  private readonly logger = new Logger(WalletListener.name);

  constructor(
    private readonly wallet: WalletService,
    private readonly prisma: PrismaService,
  ) {}

  /** Commission RECEIVED (payment screenshot submitted) is the wallet "confirmation" step. */
  @OnEvent('commission.statusChanged')
  async handleCommissionStatusChanged(payload: {
    commissionId: string;
    jobId: string;
    status: string;
  }) {
    if (payload.status !== 'RECEIVED') return;
    await this.safe('confirm commission', () =>
      this.wallet.confirmCommission(payload.jobId, payload.commissionId),
    );
  }

  /** A cancelled job returns any pending held commission to the worker. */
  @OnEvent('job.cancelled')
  async handleJobCancelled(payload: { jobId: string; reason?: string }) {
    await this.safe('reverse commission', () => this.wallet.reverseCommissionForJob(payload.jobId));
  }

  /** A completed job credits the worker's gross visit charge as earnings. */
  @OnEvent('job.statusChanged')
  async handleJobCompleted(payload: { jobId: string; oldStatus: string; newStatus: string }) {
    if (payload.newStatus !== 'COMPLETED') return;
    // Guarded: only credit for a job that actually reached COMPLETED, not replays.
    const job = await this.prisma.serviceRequest.findUnique({
      where: { id: payload.jobId },
      select: { status: true },
    });
    if (job?.status !== 'COMPLETED') return;
    await this.safe('record earnings', () => this.wallet.recordEarningsForJob(payload.jobId));
  }

  private async safe(name: string, fn: () => Promise<unknown>): Promise<void> {
    try {
      await fn();
    } catch (error) {
      this.logger.error(
        `wallet handler failed for ${name}`,
        error instanceof Error ? (error.stack ?? error.message) : String(error),
      );
    }
  }
}
