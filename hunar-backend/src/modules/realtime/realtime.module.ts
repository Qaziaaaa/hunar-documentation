import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RealtimeService } from './realtime.service';
import { RealtimeGateway } from './realtime.gateway';
import { WsJwtGuard } from './realtime.guard';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
      }),
    }),
  ],
  providers: [RealtimeService, RealtimeGateway, WsJwtGuard],
  exports: [RealtimeService, WsJwtGuard, JwtModule],
})
export class RealtimeModule {}
