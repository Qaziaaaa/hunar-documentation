import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { RealtimeService } from '../realtime/realtime.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { normalizePage, toPageResult } from '../../common/helpers/pagination.util';
import { chatRoom, CHAT_EVENTS } from './chat.events';
import { MessageListQueryDto, SendMessageDto } from './chat.validation';

// Conversations are only created from the offer.accepted domain event; messaging is
// blocked once the job leaves the active lifecycle (cancelled / disputed).
const JOB_STATUS_BLOCKED_FOR_CHAT = new Set(['CANCELLED', 'DISPUTED']);
const CHAT_IMAGE_FOLDER = 'chat-images/';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
    private readonly realtime: RealtimeService,
    private readonly eventBus: EventBusService,
  ) {}

  // Conversation is created automatically when a worker's offer is accepted (Module 9).
  @OnEvent('offer.accepted')
  async handleOfferAccepted(payload: {
    jobId: string;
    workerId: string;
    customerId: string;
  }): Promise<void> {
    if (!payload?.jobId || !payload?.workerId || !payload?.customerId) return;
    await this.prisma.conversation.upsert({
      where: { jobId: payload.jobId },
      update: {},
      create: {
        jobId: payload.jobId,
        workerId: payload.workerId,
        customerId: payload.customerId,
      },
    });
  }

  async listConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: { OR: [{ customerId: userId }, { workerId: userId }] },
      include: {
        job: { select: { id: true, title: true, status: true } },
        customer: { select: { id: true, name: true, avatarUrl: true } },
        worker: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async getMessages(conversationId: string, userId: string, query: MessageListQueryDto = {}) {
    await this.ensureParticipant(conversationId, userId);
    const { page, limit, skip } = normalizePage(query);
    const where = { conversationId };
    const [items, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({ where }),
    ]);
    return toPageResult(items, total, page, limit);
  }

  async sendMessage(conversationId: string, userId: string, dto: SendMessageDto) {
    const conversation = await this.getConversationWithActiveJob(conversationId, userId);
    const { text, imageUrl } = this.resolveContent(dto);

    const message = await this.prisma.message.create({
      data: { conversationId, senderId: userId, text, imageUrl },
    });
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessage: text ?? (imageUrl ? '[Image]' : undefined),
        lastMessageAt: message.createdAt,
      },
    });

    // Real-time delivery to everyone joined to the conversation room (incl. sender).
    this.realtime.emitToRoom(chatRoom(conversation.id), CHAT_EVENTS.message, {
      conversationId: conversation.id,
      message,
    });

    // Domain event for the notifications module ("new message" to the worker).
    this.eventBus.emit('chat.message', {
      messageId: message.id,
      conversationId: conversation.id,
      senderId: userId,
      customerId: conversation.customerId,
      workerId: conversation.workerId,
      text: text ?? undefined,
      imageUrl: imageUrl ?? undefined,
    });

    return message;
  }

  // Socket join guard — verifies the socket user belongs to the conversation.
  async ensureParticipant(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('CONVERSATION_NOT_FOUND');
    }
    if (conversation.customerId !== userId && conversation.workerId !== userId) {
      throw new ForbiddenException(
        'CONVERSATION_ACCESS_FORBIDDEN: you are not part of this conversation',
      );
    }
    return conversation;
  }

  private async getConversationWithActiveJob(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { job: { select: { selectedWorkerId: true, status: true } } },
    });
    if (!conversation) {
      throw new NotFoundException('CONVERSATION_NOT_FOUND');
    }
    if (conversation.customerId !== userId && conversation.workerId !== userId) {
      throw new ForbiddenException(
        'CONVERSATION_ACCESS_FORBIDDEN: you are not part of this conversation',
      );
    }
    if (!conversation.job.selectedWorkerId) {
      throw new BadRequestException(
        'CHAT_JOB_NOT_ACCEPTED: chat is only available after a worker is accepted',
      );
    }
    if (JOB_STATUS_BLOCKED_FOR_CHAT.has(conversation.job.status)) {
      throw new BadRequestException(
        'CHAT_JOB_CLOSED: the job is no longer active, messages are disabled',
      );
    }
    return conversation;
  }

  private resolveContent(dto: SendMessageDto): { text?: string; imageUrl?: string } {
    const text = dto?.text?.trim();
    if (text && text.length > 2000) {
      throw new BadRequestException('MESSAGE_TOO_LONG: text must be at most 2000 characters');
    }
    if ((!text || text.length === 0) && !dto?.imageKey) {
      throw new BadRequestException('MESSAGE_EMPTY: provide text or an image');
    }
    if (dto?.imageKey) {
      if (!dto.imageKey.startsWith(CHAT_IMAGE_FOLDER)) {
        throw new BadRequestException(
          'IMAGE_KEY_INVALID: images must be uploaded through POST /uploads/chat-image',
        );
      }
      return { text: text || undefined, imageUrl: this.uploads.getUrl(dto.imageKey) };
    }
    return { text, imageUrl: undefined };
  }
}
