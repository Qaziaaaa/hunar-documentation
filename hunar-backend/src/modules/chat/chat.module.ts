import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { UploadsModule } from '../uploads/uploads.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [UploadsModule, RealtimeModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}
