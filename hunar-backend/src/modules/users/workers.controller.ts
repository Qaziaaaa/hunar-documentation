import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { WorkerProfileService } from './worker-profile.service';

// Task 15 (documented customer contract): `GET /workers/[id]`.
// Delegates to the same public-profile resolver exposed at `GET /users/worker/:id`.
@Controller('workers')
export class WorkersController {
  constructor(private readonly workerProfileService: WorkerProfileService) {}

  @Get(':id')
  getPublicWorkerProfile(@Param('id', ParseUUIDPipe) id: string) {
    return this.workerProfileService.getPublicProfile(id);
  }
}
