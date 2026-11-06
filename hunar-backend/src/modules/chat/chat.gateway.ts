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
  @SubscribeMessage('chat:send')
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
      const conversation = await this.chatService.ensureParticipant(targetId, userId);
      void client.join([chatRoom(conversation.id), `chat:${conversation.jobId}`]);
      const message = await this.chatService.sendMessage(conversation, userId, dto);
      return { conversationId: conversation.id, jobId: conversation.jobId, message };
    } catch (error) {
      throw new WsException(error instanceof Error ? error.message : 'MESSAGE_SEND_FAILED');
    }
  }

  @SubscribeMessage(CHAT_EVENTS.leave)
  @UseGuards(WsJwtGuard)
  async handleLeave(
    client: Socket,
    payload: { conversationId?: string; jobId?: string },
  ): Promise<{ left: boolean }> {
    const targetId = payload?.conversationId || payload?.jobId;
    if (targetId) {
      await client.leave(chatRoom(targetId));
      await client.leave(`chat:${targetId}`);
      await client.leave(`job:${targetId}`);
    }
    return { left: true };
  }

  @SubscribeMessage(CHAT_EVENTS.read)
  @UseGuards(WsJwtGuard)
  async handleRead(
    client: Socket,
    payload: { conversationId?: string; jobId?: string },
  ): Promise<{ success: boolean; count: number }> {
    const userId = (client.data.user as JwtPayload).sub;
    const targetId = payload?.conversationId || payload?.jobId;
    if (!targetId) {
      throw new WsException('CONVERSATION_ID_REQUIRED');
    }
    return this.chatService.markAsRead(targetId, userId);
  }

  @SubscribeMessage(CHAT_EVENTS.typing)
  @UseGuards(WsJwtGuard)
  async handleTyping(
    client: Socket,
    payload: { conversationId?: string; jobId?: string },
  ): Promise<void> {
    const user = client.data.user as JwtPayload;
    const targetId = payload?.conversationId || payload?.jobId;
    if (!targetId) return;
    try {
      const conversation = await this.chatService.ensureParticipant(targetId, user.sub);
      const typingPayload = {
        conversationId: conversation.id,
        jobId: conversation.jobId,
        userId: user.sub,
        role: user.role,
      };
      client.to(chatRoom(conversation.id)).emit(CHAT_EVENTS.typing, typingPayload);
      client.to(`chat:${conversation.jobId}`).emit(CHAT_EVENTS.typing, typingPayload);
      client.to(`job:${conversation.jobId}`).emit(CHAT_EVENTS.typing, typingPayload);
    } catch {}
  }

  @SubscribeMessage(CHAT_EVENTS.stopTyping)
  @UseGuards(WsJwtGuard)
  async handleStopTyping(
    client: Socket,
    payload: { conversationId?: string; jobId?: string },
  ): Promise<void> {
    const user = client.data.user as JwtPayload;
    const targetId = payload?.conversationId || payload?.jobId;
    if (!targetId) return;
    try {
      const conversation = await this.chatService.ensureParticipant(targetId, user.sub);
      const stopPayload = {
        conversationId: conversation.id,
        jobId: conversation.jobId,
        userId: user.sub,
        role: user.role,
      };
      client.to(chatRoom(conversation.id)).emit(CHAT_EVENTS.stopTyping, stopPayload);
      client.to(`chat:${conversation.jobId}`).emit(CHAT_EVENTS.stopTyping, stopPayload);
      client.to(`job:${conversation.jobId}`).emit(CHAT_EVENTS.stopTyping, stopPayload);
    } catch {}
  }
}
