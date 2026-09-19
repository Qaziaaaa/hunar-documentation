import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationTypeId, NotificationsService } from './notifications.service';
import { NotificationData } from './notification.templates';

// Every handler is isolated so a notification failure can never break the emitter
// or the business action that triggered it (EventEmitter2 rethrows sync errors).
@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(
    private readonly notifications: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  // 1. New matching job
  @OnEvent('job.created')
  async handleJobCreated(payload: {
    jobId: string;
    categoryId: string;
    latitude: number;
    longitude: number;
  }) {
    await this.safe('job.created', async () => {
      const job = await this.getJobTitle(payload.jobId);
      const workers = await this.notifications.findMatchingWorkerIds(
        payload.categoryId,
        payload.latitude,
        payload.longitude,
      );
      if (workers.length === 0) return;
      await Promise.allSettled(
        workers.map((workerId) =>
          this.notifications.createNotification(workerId, 'JOB_MATCHED', {
            jobId: payload.jobId,
            jobTitle: job?.title,
          }),
        ),
      );
    });
  }

  // 2. Offer accepted / 5. counter accepted (an accepted offer that had been countered).
  @OnEvent('offer.accepted')
  async handleOfferAccepted(payload: {
    offerId: string;
    jobId: string;
    workerId: string;
    lockedVisitCharge: number;
  }) {
    await this.safe('offer.accepted', async () => {
      const [offer, job] = await Promise.all([
        this.prisma.jobOffer.findUnique({
          where: { id: payload.offerId },
          select: { status: true },
        }),
        this.getJobTitle(payload.jobId),
      ]);
      const type = offer?.status === 'COUNTERED' ? 'COUNTER_ACCEPTED' : 'OFFER_ACCEPTED';
      await this.notifications.createNotification(payload.workerId, type, {
        jobId: payload.jobId,
        jobTitle: job?.title,
        offerId: payload.offerId,
        amount: Number(payload.lockedVisitCharge),
      });
    });
  }

  // 2. Offer rejected
  @OnEvent('offer.rejected')
  async handleOfferRejected(payload: { offerId: string; jobId: string; workerId: string }) {
    await this.safe('offer.rejected', async () => {
      const job = await this.getJobTitle(payload.jobId);
      await this.notifications.createNotification(payload.workerId, 'OFFER_REJECTED', {
        jobId: payload.jobId,
        jobTitle: job?.title,
        offerId: payload.offerId,
      });
    });
  }

  // 3. Counter offer (only when the customer counters the worker's offer)
  @OnEvent('offer.countered')
  async handleOfferCountered(payload: {
    offerId: string;
    jobId: string;
    by: 'worker' | 'customer';
    amount: number;
    round: number;
  }) {
    await this.safe('offer.countered', async () => {
      if (payload.by !== 'customer') return;
      const [offer, job] = await Promise.all([
        this.prisma.jobOffer.findUnique({
          where: { id: payload.offerId },
          select: { workerId: true },
        }),
        this.getJobTitle(payload.jobId),
      ]);
      if (!offer) return;
      await this.notifications.createNotification(offer.workerId, 'COUNTER_OFFER', {
        jobId: payload.jobId,
        jobTitle: job?.title,
        offerId: payload.offerId,
        amount: Number(payload.amount),
      });
    });
  }

  // 6. Commission held (wallet module holds 10% on worker arrival, Task 7)
  @OnEvent('commission.held')
  async handleWalletCommissionHeld(payload: {
    commissionId: string;
    jobId: string;
    workerId: string;
    amount: number;
  }) {
    await this.safe('commission.held', async () =>
      this.notifyWithJob(payload.workerId, payload.jobId, 'COMMISSION_HELD', {
        commissionId: payload.commissionId,
        amount: Number(payload.amount),
      }),
    );
  }

  @OnEvent('commission.deducted')
  async handleWalletCommissionDeducted(payload: {
    commissionId: string;
    jobId: string;
    workerId: string;
    amount: number;
  }) {
    await this.safe('commission.deducted', async () =>
      this.notifyWithJob(payload.workerId, payload.jobId, 'COMMISSION_DEDUCTED', {
        commissionId: payload.commissionId,
        amount: Number(payload.amount),
      }),
    );
  }

  @OnEvent('commission.reversed')
  async handleWalletCommissionReversed(payload: {
    commissionId: string;
    jobId: string;
    workerId: string;
    amount: number;
  }) {
    await this.safe('commission.reversed', async () =>
      this.notifyWithJob(payload.workerId, payload.jobId, 'COMMISSION_REVERSED', {
        commissionId: payload.commissionId,
        amount: Number(payload.amount),
      }),
    );
  }

  // 7. Insufficient balance top-up warning (Task 7 wallet module emits this)
  @OnEvent('wallet.insufficientBalance')
  async handleWalletInsufficientBalance(payload: { workerId: string }) {
    await this.safe('wallet.insufficientBalance', async () => {
      await this.notifications.createNotification(payload.workerId, 'INSUFFICIENT_BALANCE', {});
    });
  }

  // 8. Top-up submitted / approved / rejected (Task 7 wallet module emits these)
  @OnEvent('topup.submitted')
  async handleTopupSubmitted(payload: { topUpId: string; workerId: string; amount: number }) {
    await this.safe('topup.submitted', async () =>
      this.notifications.createNotification(payload.workerId, 'TOPUP_SUBMITTED', {
        topUpId: payload.topUpId,
        amount: Number(payload.amount),
      }),
    );
  }

  @OnEvent('topup.approved')
  async handleTopupApproved(payload: { topUpId: string; workerId: string; amount: number }) {
    await this.safe('topup.approved', async () =>
      this.notifications.createNotification(payload.workerId, 'TOPUP_APPROVED', {
        topUpId: payload.topUpId,
        amount: Number(payload.amount),
      }),
    );
  }

  @OnEvent('topup.rejected')
  async handleTopupRejected(payload: {
    topUpId: string;
    workerId: string;
    amount: number;
    reason?: string;
  }) {
    await this.safe('topup.rejected', async () =>
      this.notifications.createNotification(payload.workerId, 'TOPUP_REJECTED', {
        topUpId: payload.topUpId,
        amount: Number(payload.amount),
        reason: payload.reason,
      }),
    );
  }

  // 9. Earnings recorded (Task 7 wallet module emits this)
  @OnEvent('earnings.recorded')
  async handleEarningsRecorded(payload: { jobId: string; workerId: string; amount: number }) {
    await this.safe('earnings.recorded', async () =>
      this.notifyWithJob(payload.workerId, payload.jobId, 'EARNINGS_RECORDED', {
        amount: Number(payload.amount),
      }),
    );
  }

  // 5. New message (only when the customer messages the worker)
  @OnEvent('chat.message')
  async handleChatMessage(payload: {
    messageId: string;
    conversationId: string;
    senderId: string;
    customerId: string;
    workerId: string;
    text?: string;
    imageUrl?: string;
  }) {
    await this.safe('chat.message', async () => {
      if (payload.senderId !== payload.customerId) return;
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: payload.conversationId },
        select: { job: { select: { title: true } } },
      });
      await this.notifications.createNotification(payload.workerId, 'NEW_MESSAGE', {
        conversationId: payload.conversationId,
        messageId: payload.messageId,
        jobTitle: conversation?.job.title,
        text: payload.text,
      });
    });
  }

  // 11. Verification result (admin decision)
  @OnEvent('worker.verification.decided')
  async handleVerificationDecided(payload: {
    userId: string;
    verificationStatus: string;
    rejectionReason?: string | null;
    adminNote?: string | null;
  }) {
    await this.safe('worker.verification.decided', async () => {
      await this.notifications.createNotification(payload.userId, 'VERIFICATION_RESULT', {
        status: payload.verificationStatus,
        reason: payload.rejectionReason ?? payload.adminNote,
      });
    });
  }

  // 4. Visit window approaching — every 15 minutes (idempotent per visit).
  @Cron('0 */15 * * * *')
  async cronScanUpcomingVisits() {
    await this.safe('visit-window scan', async () => {
      await this.notifications.scanUpcomingVisits();
    });
  }

  private async notifyWithJob(
    workerId: string,
    jobId: string,
    type: NotificationTypeId,
    data: NotificationData,
  ) {
    const job = await this.getJobTitle(jobId);
    await this.notifications.createNotification(workerId, type, {
      ...data,
      jobId,
      jobTitle: job?.title,
    });
  }

  private async getJobTitle(jobId: string | undefined) {
    if (!jobId) return null;
    return this.prisma.serviceRequest.findUnique({
      where: { id: jobId },
      select: { id: true, title: true },
    });
  }

  private async safe(name: string, fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
    } catch (error) {
      this.logger.error(
        `notification handler failed for ${name}`,
        error instanceof Error ? error.stack ?? error.message : String(error),
      );
    }
  }
}