import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsListener } from './notifications.listener';

/**
 * Worker notification inbox (Module 1 Task 6 ? Notifications Backend).
 *
 * Depends on the globally-registered PrismaModule, RealtimeModule and the
 * EventEmitter/Schedule roots from AppModule ? nothing extra is imported here.
 */
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsListener],
  exports: [NotificationsService],
})
export class NotificationsModule {}