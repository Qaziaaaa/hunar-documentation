import { Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { NotificationsService } from './notifications.service';
import { NotificationListQueryDto } from './notification.validation';

/**
 * Worker notification inbox (Module 1 Task 6 ? Notifications Backend).
 * Every route is worker-scoped: the authenticated user's own inbox only.
 */
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /** Paginated inbox, newest first, with total + unread counts. */
  @Get()
  @Roles(Role.WORKER)
  list(@CurrentUser() user: JwtPayload, @Query() query: NotificationListQueryDto) {
    return this.notifications.listForWorker(user.sub, query);
  }

  /** Unread badge count for the current worker. */
  @Get('unread-count')
  @Roles(Role.WORKER)
  unreadCount(@CurrentUser() user: JwtPayload) {
    return this.notifications.unreadCount(user.sub);
  }

  /** Mark a single notification read (owner-only). */
  @Patch(':id/read')
  @Roles(Role.WORKER)
  markRead(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) notificationId: string,
  ): Promise<boolean> {
    return this.notifications.markRead(user.sub, notificationId);
  }

  /** Mark the entire inbox read. */
  @Patch('read-all')
  @Roles(Role.WORKER)
  markAllRead(@CurrentUser() user: JwtPayload) {
    return this.notifications.markAllRead(user.sub);
  }
}