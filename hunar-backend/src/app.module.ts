import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';

import appConfig from './config/app.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';

import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { EventBusModule } from './common/event-bus/event-bus.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { OffersModule } from './modules/offers/offers.module';
import { VisitsModule } from './modules/visits/visits.module';
import { RepairModule } from './modules/repair/repair.module';
import { CommissionsModule } from './modules/commissions/commissions.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { RealtimeModule } from './modules/realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, redisConfig],
    }),
    EventEmitterModule.forRoot({ wildcard: true }),
    PrismaModule,
    RedisModule,
    EventBusModule,
    HealthModule,
    // TEMPORARY auth (testing placeholder — Hakim Ullah's real Auth module will replace this).
    AuthModule,
    JobsModule,
    OffersModule,
    VisitsModule,
    RepairModule,
    CommissionsModule,
    ReviewsModule,
    RealtimeModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
