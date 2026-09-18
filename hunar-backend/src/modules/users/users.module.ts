import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { WorkerProfileService } from './worker-profile.service';
import { MapboxService } from './mapbox.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, WorkerProfileService, MapboxService],
})
export class UsersModule {}
