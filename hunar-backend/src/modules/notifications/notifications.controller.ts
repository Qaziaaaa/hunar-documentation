import { Body, Controller, Get, Optional, Param, ParseUUIDPipe, Patch, Put, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { NotificationsService } from './notifications.service';
import { NotificationListQueryDto } from './notification.validation';
import { RedisService } from '../../common/redis/redis.service';

/**
 * Notification inbox (Task 6 worker + Task 24 customer).
 * Every route is user-scoped: the authenticated user's own inbox only.
 * The WorkerNotification row is userId-keyed, so the same service serves both roles.
 */
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    @Optional() private readonly redis?: RedisService,
  ) {}

  /** Paginated inbox, newest first, with total + unread counts. */
  @Get()
  @Roles(Role.WORKER, Role.CUSTOMER)
  list(@CurrentUser() user: JwtPayload, @Query() query: NotificationListQueryDto) {
    return this.notifications.listForWorker(user.sub, query);
  }

  /** Unread badge count for the current user. */
  @Get('unread-count')
  @Roles(Role.WORKER, Role.CUSTOMER)
  unreadCount(@CurrentUser() user: JwtPayload) {
    return this.notifications.unreadCount(user.sub);
  }

  /** Mark a single notification read (owner-only). */
  @Patch(':id/read')
  @Roles(Role.WORKER, Role.CUSTOMER)
  markRead(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) notificationId: string,
  ): Promise<boolean> {
    return this.notifications.markRead(user.sub, notificationId);
  }

  /** Task 25 — mark the entire inbox read (PUT /notifications/read). */
  @Put('read')
  @Roles(Role.WORKER, Role.CUSTOMER)
  markAllRead(@CurrentUser() user: JwtPayload) {
    return this.notifications.markAllRead(user.sub);
  }

  /** Mark the entire inbox read (PATCH alias kept for the worker app). */
  @Patch('read-all')
  @Roles(Role.WORKER, Role.CUSTOMER)
  markAllReadPatch(@CurrentUser() user: JwtPayload) {
    return this.notifications.markAllRead(user.sub);
  }

  /** Notification preferences (GET /notifications/preferences) */
  @Get('preferences')
  @Roles(Role.WORKER, Role.CUSTOMER)
  async getPreferences(@CurrentUser() user: JwtPayload) {
    const defaultPrefs = {
      pushEnabled: true,
      smsEnabled: true,
      inAppEnabled: true,
      jobAlerts: true,
      chatAlerts: true,
    };
    if (this.redis) {
      const cached = await this.redis.get(`notif_prefs:${user.sub}`);
      if (cached) {
        try {
          return { ...defaultPrefs, ...JSON.parse(cached) };
        } catch {}
      }
    }
    return defaultPrefs;
  }

  /** Update notification preferences (PUT /notifications/preferences) */
  @Put('preferences')
  @Roles(Role.WORKER, Role.CUSTOMER)
  async updatePreferences(@CurrentUser() user: JwtPayload, @Body() body: any) {
    const current = await this.getPreferences(user);
    const updated = {
      ...current,
      pushEnabled: Boolean(body?.pushEnabled ?? current.pushEnabled),
      smsEnabled: Boolean(body?.smsEnabled ?? current.smsEnabled),
      inAppEnabled: Boolean(body?.inAppEnabled ?? current.inAppEnabled),
      jobAlerts: Boolean(body?.jobAlerts ?? current.jobAlerts),
      chatAlerts: Boolean(body?.chatAlerts ?? current.chatAlerts),
    };
    if (this.redis) {
      await this.redis.set(`notif_prefs:${user.sub}`, JSON.stringify(updated));
    }
    return updated;
  }
}
