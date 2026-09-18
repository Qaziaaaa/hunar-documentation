// Copy for the 17 required worker notification types (Module 1 Task 6 — Notifications Panel).

export interface NotificationTemplate {
  title: string;
  body: string;
}

export interface NotificationData {
  jobId?: string;
  jobTitle?: string;
  offerId?: string;
  workerId?: string;
  customerId?: string;
  amount?: number;
  rating?: number;
  visitId?: string;
  conversationId?: string;
  messageId?: string;
  commissionId?: string;
  topUpId?: string;
  text?: string;
  scheduledAt?: string | Date;
  reason?: string | null;
  status?: string | null;
}

function fmtAmount(amount: number | undefined): string {
  return Number(amount).toLocaleString('en-PK');
}

function fmtTime(value: string | Date | undefined): string {
  if (!value) return 'scheduled time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

// Template resolved from a notification type + the domain-event payload.
export function buildNotificationTemplate(
  type: keyof typeof notificationTemplates,
  data: NotificationData = {},
): NotificationTemplate {
  return notificationTemplates[type](data);
}

// One function per required notification type. Keys stay in sync with NotificationType.
export const notificationTemplates: Record<
  string,
  (d: NotificationData) => NotificationTemplate
> = {
  JOB_MATCHED: (d) => ({
    title: 'New matching job',
    body: d.jobTitle
      ? `A new job "${d.jobTitle}" matches your skills in your area.`
      : 'A new job matches your skills in your area.',
  }),

  OFFER_ACCEPTED: (d) => ({
    title: 'Offer accepted',
    body: `Your offer of Rs. ${fmtAmount(d.amount)} for "${d.jobTitle ?? 'the job'}" was accepted.`,
  }),

  OFFER_REJECTED: (d) => ({
    title: 'Offer rejected',
    body: `Your offer for "${d.jobTitle ?? 'the job'}" was not accepted.`,
  }),

  COUNTER_OFFER: (d) => ({
    title: 'Counter offer',
    body: `The customer countered your offer for "${d.jobTitle ?? 'the job'}" at Rs. ${fmtAmount(d.amount)}.`,
  }),

  COUNTER_ACCEPTED: (d) => ({
    title: 'Counter accepted',
    body: `Your counter of Rs. ${fmtAmount(d.amount)} for "${d.jobTitle ?? 'the job'}" was accepted.`,
  }),

  VISIT_WINDOW_APPROACHING: (d) => ({
    title: 'Visit window approaching',
    body: `Your visit for "${d.jobTitle ?? 'the job'}" is scheduled at ${fmtTime(d.scheduledAt)}.`,
  }),

  NEW_MESSAGE: (d) => ({
    title: 'New message',
    body: d.jobTitle
      ? `You have a new message about "${d.jobTitle}".`
      : 'You have a new message.',
  }),

  COMMISSION_HELD: (d) => ({
    title: 'Commission held',
    body: `Commission Rs. ${fmtAmount(d.amount)} held from your wallet for job "${d.jobTitle ?? 'the job'}". Complete the visit to finalize.`,
  }),

  COMMISSION_DEDUCTED: (d) => ({
    title: 'Commission deducted',
    body: `Commission Rs. ${fmtAmount(d.amount)} deducted. Thank you for using HUNAR.`,
  }),

  COMMISSION_REVERSED: (d) => ({
    title: 'Commission reversed',
    body: `Commission held Rs. ${fmtAmount(d.amount)} returned to your wallet.`,
  }),

  INSUFFICIENT_BALANCE: () => ({
    title: 'Insufficient balance',
    body: 'Insufficient wallet balance. Top up to keep accepting visits — send money to the given number and upload your screenshot proof.',
  }),

  TOPUP_SUBMITTED: (d) => ({
    title: 'Top-up submitted',
    body: `Your wallet top-up of Rs. ${fmtAmount(d.amount)} is pending review.`,
  }),

  TOPUP_APPROVED: (d) => ({
    title: 'Top-up approved',
    body: `Your wallet top-up of Rs. ${fmtAmount(d.amount)} has been verified and credited.`,
  }),

  TOPUP_REJECTED: (d) => ({
    title: 'Top-up rejected',
    body: d.reason
      ? `Your wallet top-up of Rs. ${fmtAmount(d.amount)} was rejected: ${d.reason}`
      : `Your wallet top-up of Rs. ${fmtAmount(d.amount)} was rejected.`,
  }),

  EARNINGS_RECORDED: (d) => ({
    title: 'Earnings recorded',
    body: `Rs. ${fmtAmount(d.amount)} from "${d.jobTitle ?? 'the job'}" was credited to your wallet.`,
  }),

  REVIEW_RECEIVED: (d) => ({
    title: 'New review',
    body: `You received a ${d.rating ?? 5}-star review on "${d.jobTitle ?? 'the job'}".`,
  }),

  VERIFICATION_RESULT: (d) => {
    switch (d.status) {
      case 'APPROVED':
        return {
          title: 'Verification result',
          body: 'Congratulations, your worker profile was approved. You can now receive jobs.',
        };
      case 'REJECTED':
        return {
          title: 'Verification result',
          body: `Your verification was rejected${d.reason ? `: ${d.reason}` : ''}.`,
        };
      case 'REQUEST_CHANGES':
        return {
          title: 'Verification result',
          body: d.reason
            ? `Your verification needs changes: ${d.reason}`
            : 'Your verification needs changes. Please update your profile.',
        };
      default:
        return { title: 'Verification result', body: 'Your verification status was updated.' };
    }
  },
};