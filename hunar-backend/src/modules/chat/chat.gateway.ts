import { UseGuards } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { WsJwtGuard } from '../realtime/realtime.guard';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { ChatService } from './chat.service';
import { chatRoom, CHAT_EVENTS } from './chat.events';
import { SendMessageDto } from './chat.validation';

@WebSocketGateway()
export class ChatGateway {
  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage(CHAT_EVENTS.join)
  @UseGuards(WsJwtGuard)
  async handleJoin(
    client: Socket,
    payload: { conversationId?: string; jobId?: string },
  ): Promise<{ joined: boolean; conversationId: string; jobId: string }> {
    const userId = (client.data.user as JwtPayload).sub;
    const targetId = payload?.conversationId || payload?.jobId;
    if (!targetId) {
      throw new WsException('CONVERSATION_ID_REQUIRED');
    }
    try {
      const conversation = await this.chatService.ensureParticipant(targetId, userId);
      await client.join(chatRoom(conversation.id));
      await client.join(chatRoom(conversation.jobId));
      await client.join(`job:${conversation.jobId}`);
      await client.join(`chat:${conversation.jobId}`);
      return { joined: true, conversationId: conversation.id, jobId: conversation.jobId };
    } catch (error) {
      throw new WsException(
        error instanceof Error ? error.message : 'CONVERSATION_ACCESS_FORBIDDEN',
      );
    }
  }

  @SubscribeMessage(CHAT_EVENTS.message)
  @UseGuards(WsJwtGuard)
  async handleSendMessage(
    client: Socket,
    payload: { conversationId?: string; jobId?: string; text?: string; imageKey?: string },
  ): Promise<{ conversationId: string; jobId: string; message: unknown }> {
    const userId = (client.data.user as JwtPayload).sub;
    const targetId = payload?.conversationId || payload?.jobId;
    if (!targetId) {
      throw new WsException('CONVERSATION_ID_REQUIRED');
    }
    const dto = new SendMessageDto();
    dto.text = payload?.text;
    dto.imageKey = payload?.imageKey;
    try {
      // Authorize, then join both rooms so this socket also receives real-time delivery.
      const conversation = await this.chatService.ensureParticipant(targetId, userId);
      await client.join(chatRoom(conversation.id));
      await client.join(`chat:${conversation.jobId}`);
      const message = await this.chatService.sendMessage(conversation.id, userId, dto);
      return { conversationId: conversation.id, jobId: conversation.jobId, message };
    } catch (error) {
      throw new WsException(error instanceof Error ? error.message : 'MESSAGE_SEND_FAILED');
    }
  }
}
