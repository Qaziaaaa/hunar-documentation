import { Module } from '@nestjs/common';
import {
  CategoriesController,
  DisputesController,
  JobsController,
  WorkerJobsController,
} from './jobs.controller';
import { JobsService } from './jobs.service';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [RealtimeModule],
  controllers: [JobsController, WorkerJobsController, CategoriesController, DisputesController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
