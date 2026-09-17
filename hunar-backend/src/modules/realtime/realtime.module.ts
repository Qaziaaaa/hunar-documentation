import { Module, Global } from '@nestjs/common';
import { RealtimeService } from './realtime.service';
import { RealtimeGateway } from './realtime.gateway';
import { WsJwtGuard } from './realtime.guard';

@Global()
@Module({
  providers: [RealtimeService, RealtimeGateway, WsJwtGuard],
  exports: [RealtimeService, WsJwtGuard],
})
export class RealtimeModule {}
