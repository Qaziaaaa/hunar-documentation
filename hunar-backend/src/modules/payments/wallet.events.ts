// Socket.IO event names for the worker wallet (Task 7).
// Delivery channel is the realtime module's per-user rooms (user:<userId>).

export const WALLET_EVENTS = {
  balanceUpdated: 'wallet:balanceUpdated',
  ledgerUpdated: 'wallet:ledgerUpdated',
  commissionHeld: 'wallet:commission:held',
  commissionDeducted: 'wallet:commission:deducted',
  commissionReversed: 'wallet:commission:reversed',
  topupSubmitted: 'wallet:topup:submitted',
  topupDecided: 'wallet:topup:decided',
  earningsRecorded: 'wallet:earnings:recorded',
} as const;

export function walletRoom(userId: string): string {
  return `user:${userId}`;
}
