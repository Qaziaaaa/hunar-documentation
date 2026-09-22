// Realtime (Socket.IO) event names for the admin dashboard.
// Namespace: '/' (admin alerts and notifications).

export const ADMIN_EVENTS = {
  // Verification events
  verificationSubmitted: 'admin:verification:submitted',
  verificationApproved: 'admin:verification:approved',
  verificationRejected: 'admin:verification:rejected',
  verificationChangesRequested: 'admin:verification:changes_requested',
  verificationRevoked: 'admin:verification:revoked',

  // Dispute events
  disputeCreated: 'admin:dispute:created',
  disputeResolved: 'admin:dispute:resolved',
  disputeDismissed: 'admin:dispute:dismissed',
  disputeEscalated: 'admin:dispute:escalated',

  // Withdrawal events
  withdrawalRequested: 'admin:withdrawal:requested',
  withdrawalProcessed: 'admin:withdrawal:processed',
  withdrawalRejected: 'admin:withdrawal:rejected',

  // Job events
  jobForceCancelled: 'admin:job:force_cancelled',
  jobStatusChanged: 'admin:job:status_changed',

  // User events
  userSuspended: 'admin:user:suspended',
  userReactivated: 'admin:user:reactivated',

  // Wallet events
  walletFrozen: 'admin:wallet:frozen',
  walletUnfrozen: 'admin:wallet:unfrozen',

  // Category events
  categoryCreated: 'admin:category:created',
  categoryUpdated: 'admin:category:updated',
  categoryDeactivated: 'admin:category:deactivated',

  // Settings events
  commissionRateChanged: 'admin:settings:commission_rate_changed',
  settingsUpdated: 'admin:settings:updated',

  // General admin notification
  newAlert: 'admin:alert',
} as const;

export const ADMIN_ROOM = 'admin:alerts';
