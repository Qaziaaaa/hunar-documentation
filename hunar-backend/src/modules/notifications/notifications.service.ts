import { Injectable, Logger } from '@nestjs/common';
import { NotificationType, Prisma, WorkerVerificationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { NOTIFICATION_EVENTS, VISIT_WINDOW_AHEAD_MINUTES } from './notifications.events';
import {
  buildNotificationTemplate,
  notificationTemplates,
  NotificationData,
} from './notification.templates';

// Notification type identifiers mirror the tracked NotificationType.prisma enum 1:1 so the
// listener can pass plain string literals. Keys are proven by notification.templates.ts.
export type NotificationTypeId = keyof typeof notificationTemplates;

/**
 * Worker notification inbox (Module 1 Task 6 ? Notifications Backend).
 *
 * Responsibilities:
 *  - Persist one notification row per worker event (Domain Events -> listener -> here).
 *  - Expose the REST inbox (list / unread count / mark read / mark all read).
 *  - Push each new notification into the worker's realtime room (`user:<id>`)
 *    so the app updates the badge + list immediately.
 *
 * Domain event -> notification translation lives in `NotificationsListener`;
 * the service here is deliberately CRUD + realtime + persistence only.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  /** Create + persist + realtime-push a notification for one worker. */
  async createNotification(
    userId: string,
    type: NotificationTypeId,
    data: NotificationData = {},
  ): Promise<void> {
    const { title, body } = buildNotificationTemplate(type, data);
    await this.prisma.workerNotification.create({
      data: {
        userId,
        type: type as NotificationType,
        title,
        body,
        data: Object.keys(data).length > 0 ? (data as Prisma.InputJsonValue) : undefined,
      },
    });
    this.realtime.emitToUsers([userId], NOTIFICATION_EVENTS.new, {
      type,
      title,
      body,
      data,
      createdAt: new Date(),
    });
  }

  /**
   * Workers whose approved, available profile covers the job's category and incidence area.
   * Proximity uses WorkerProfile.serviceRadiusKm against each ServiceArea (haversine), same
   * semantics as the jobs module's getAvailableJobs PostGIS query but without GIS coupling.
   */
  async findMatchingWorkerIds(
    categoryId: string,
    latitude: number,
    longitude: number,
  ): Promise<string[]> {
    const candidates = await this.prisma.workerProfile.findMany({
      where: {
        verificationStatus: WorkerVerificationStatus.APPROVED,
        isAvailable: true,
        skills: { has: categoryId },
      },
      select: { userId: true, serviceRadiusKm: true },
    });
    if (candidates.length === 0) return [];

    const userIds = candidates.map((c) => c.userId);
    const radiusByUser = new Map(candidates.map((c) => [c.userId, c.serviceRadiusKm ?? 10]));
    const areas = await this.prisma.serviceArea.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, latitude: true, longitude: true },
    });

    const matched = new Set<string>();
    for (const area of areas) {
      const radius = radiusByUser.get(area.userId);
      if (radius == null || matched.has(area.userId)) continue;
      if (haversineKm(latitude, longitude, area.latitude, area.longitude) <= radius) {
        matched.add(area.userId);
      }
    }
    return Array.from(matched);
  }

  /**
   * Idempotent cron: warn workers whose scheduled visit starts within the next window
   * (VISIT_WINDOW_AHEAD_MINUTES). One VISIT_WINDOW_APPROACHING per visit (deduped by visitId).
   */
  async scanUpcomingVisits(): Promise<{ count: number }> {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + VISIT_WINDOW_AHEAD_MINUTES * 60_000);
    const visits = await this.prisma.visit.findMany({
      where: {
        workerId: { not: null },
        status: 'SCHEDULED',
        scheduledDate: { gte: now, lte: windowEnd },
      },
      select: {
        id: true,
        workerId: true,
        scheduledDate: true,
        job: { select: { title: true } },
      },
    });

    let count = 0;
    for (const visit of visits) {
      if (!visit.workerId) continue;
      const existing = await this.prisma.workerNotification.findFirst({
        where: {
          userId: visit.workerId,
          type: 'VISIT_WINDOW_APPROACHING',
          data: { path: ['visitId'], equals: visit.id },
        },
        select: { id: true },
      });
      if (existing) continue;
      await this.createNotification(visit.workerId, 'VISIT_WINDOW_APPROACHING', {
        visitId: visit.id,
        jobTitle: visit.job?.title,
        scheduledAt: visit.scheduledDate.toISOString(),
      });
      count += 1;
    }
    return { count };
  }

  /** List a worker's inbox, newest first, with pagination + total unread. */
  async listForWorker(
    userId: string,
    query: { page?: number; limit?: number } = {},
  ): Promise<{
    items: Array<{
      id: string;
      type: NotificationTypeId;
      title: string;
      body: string;
      isRead: boolean;
      readAt: Date | null;
      createdAt: Date;
    }>;
    page: number;
    limit: number;
    total: number;
    unread: number;
  }> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 && query.limit <= 200 ? query.limit : 50;
    const [items, total, unread] = await Promise.all([
      this.prisma.workerNotification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          isRead: true,
          readAt: true,
          createdAt: true,
        },
      }),
      this.prisma.workerNotification.count({ where: { userId } }),
      this.prisma.workerNotification.count({ where: { userId, isRead: false } }),
    ]);
    return { items, page, limit, total, unread };
  }

  /** Unread-only count (drives the badge). */
  async unreadCount(userId: string): Promise<number> {
    return this.prisma.workerNotification.count({
      where: { userId, isRead: false },
    });
  }

  /** Mark one notification read (owner-only). Returns true when it existed. */
  async markRead(userId: string, notificationId: string): Promise<boolean> {
    const updated = await this.prisma.workerNotification.updateMany({
      where: { id: notificationId, userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    if (updated.count === 1) {
      this.realtime.emitToUsers([userId], NOTIFICATION_EVENTS.read, {
        notificationId,
        readAt: new Date(),
      });
    }
    return updated.count === 1;
  }

  /** Mark every unread notification read. Returns count actually updated. */
  async markAllRead(userId: string): Promise<{ count: number }> {
    const updated = await this.prisma.workerNotification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    this.realtime.emitToUsers([userId], NOTIFICATION_EVENTS.readAll, {
      count: updated.count,
      readAt: new Date(),
    });
    return { count: updated.count };
  }
}

/** Great-circle distance in kilometres (matcher used by findMatchingWorkerIds). */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}