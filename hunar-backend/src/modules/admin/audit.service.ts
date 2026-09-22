import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

// Canonical admin audit actions. String values are stored as-is in AuditLog.action.
export const AUDIT_ACTIONS = {
  USER_SUSPENDED: 'USER_SUSPENDED',
  USER_REACTIVATED: 'USER_REACTIVATED',
  VERIFICATION_APPROVED: 'VERIFICATION_APPROVED',
  VERIFICATION_REJECTED: 'VERIFICATION_REJECTED',
  VERIFICATION_CHANGES_REQUESTED: 'VERIFICATION_CHANGES_REQUESTED',
  VERIFICATION_REVOKED: 'VERIFICATION_REVOKED',
  JOB_FORCE_CANCELLED: 'JOB_FORCE_CANCELLED',
  WITHDRAWAL_APPROVED: 'WITHDRAWAL_APPROVED',
  WITHDRAWAL_REJECTED: 'WITHDRAWAL_REJECTED',
  WALLET_FROZEN: 'WALLET_FROZEN',
  WALLET_UNFROZEN: 'WALLET_UNFROZEN',
  DISPUTE_RESOLVED: 'DISPUTE_RESOLVED',
  DISPUTE_DISMISSED: 'DISPUTE_DISMISSED',
  DISPUTE_ESCALATED: 'DISPUTE_ESCALATED',
  CATEGORY_CREATED: 'CATEGORY_CREATED',
  CATEGORY_UPDATED: 'CATEGORY_UPDATED',
  CATEGORY_DEACTIVATED: 'CATEGORY_DEACTIVATED',
  COMMISSION_RATE_CHANGED: 'COMMISSION_RATE_CHANGED',
  SETTING_UPDATED: 'SETTING_UPDATED',
  NOTIFICATIONS_MARKED_READ: 'NOTIFICATIONS_MARKED_READ',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export interface AuditEntry {
  actorId: string;
  actorRole: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  reason?: string | null;
  metadata?: Prisma.InputJsonValue;
}

// Central writer for the admin audit trail. Every sensitive admin action goes through here
// so M2/M3 endpoints share one consistent record shape (who, what, to whom, when, why).
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.auditLog.create({
      data: {
        actorId: entry.actorId,
        actorRole: entry.actorRole as Role,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        reason: entry.reason ?? null,
        metadata: entry.metadata,
      },
    });
  }
}
