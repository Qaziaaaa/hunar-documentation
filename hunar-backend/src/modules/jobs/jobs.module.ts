import { Module } from '@nestjs/common';
import { JobsController, WorkerJobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [RealtimeModule],
  controllers: [JobsController, WorkerJobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
