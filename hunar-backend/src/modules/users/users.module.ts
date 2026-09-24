import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { WorkersController } from './workers.controller';
import { UsersService } from './users.service';
import { WorkerProfileService } from './worker-profile.service';
import { MapboxService } from './mapbox.service';

@Module({
  controllers: [UsersController, WorkersController],
  providers: [UsersService, WorkerProfileService, MapboxService],
})
export class UsersModule {}
