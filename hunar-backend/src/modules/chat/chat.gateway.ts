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
  ): Promise<{ joined: boolean; conversationId: string }> {
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
      return { joined: true, conversationId: conversation.id };
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
    payload: { conversationId?: string; text?: string; imageKey?: string },
  ): Promise<{ conversationId: string; message: unknown }> {
    const userId = (client.data.user as JwtPayload).sub;
    const conversationId = payload?.conversationId;
    if (!conversationId) {
      throw new WsException('CONVERSATION_ID_REQUIRED');
    }
    const dto = new SendMessageDto();
    dto.text = payload?.text;
    dto.imageKey = payload?.imageKey;
    try {
      // Authorize, then join so this socket also receives the real-time delivery.
      await this.chatService.ensureParticipant(conversationId, userId);
      await client.join(chatRoom(conversationId));
      const message = await this.chatService.sendMessage(conversationId, userId, dto);
      return { conversationId, message };
    } catch (error) {
      throw new WsException(error instanceof Error ? error.message : 'MESSAGE_SEND_FAILED');
    }
  }
}
