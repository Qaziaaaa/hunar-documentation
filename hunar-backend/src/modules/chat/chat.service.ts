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
    const rows = await this.prisma.conversation.findMany({
      where: { OR: [{ customerId: userId }, { workerId: userId }] },
      orderBy: { lastMessageAt: 'desc' },
    });
    if (rows.length === 0) return [];

    // The three `include`s used to run serially after the parent query (4 DB
    // round trips); batch the relation reads into one parallel wave.
    const jobIds = [...new Set(rows.map((r) => r.jobId))];
    const customerIds = [...new Set(rows.map((r) => r.customerId))];
    const workerIds = [...new Set(rows.map((r) => r.workerId))];
    const [jobs, customers, workers] = await Promise.all([
      this.prisma.serviceRequest.findMany({
        where: { id: { in: jobIds } },
        select: { id: true, title: true, status: true },
      }),
      this.prisma.user.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, name: true, avatarUrl: true },
      }),
      this.prisma.user.findMany({
        where: { id: { in: workerIds } },
        select: { id: true, name: true, avatarUrl: true },
      }),
    ]);
    const jobMap = new Map(jobs.map((j) => [j.id, j]));
    const customerMap = new Map(customers.map((c) => [c.id, c]));
    const workerMap = new Map(workers.map((w) => [w.id, w]));

    return rows.map((r) => ({
      ...r,
      job: jobMap.get(r.jobId) ?? null,
      customer: customerMap.get(r.customerId) ?? null,
      worker: workerMap.get(r.workerId) ?? null,
    }));
  }

  /**
   * Task 26 — resolve the conversation for a job (conversation is keyed by the
   * unique jobId and created when the offer is accepted), then return its messages.
   */
  async getMessagesByJob(jobId: string, userId: string, query: MessageListQueryDto = {}) {
    const conversation = await this.getConversationByJob(jobId, userId);
    return this.getMessages(conversation.id, userId, query);
  }

  /**
   * Task 26 — send a message to the conversation belonging to a job.
   * Delegates to sendMessage so realtime + the chat.message event are preserved.
   */
  async sendMessageByJob(jobId: string, userId: string, dto: SendMessageDto) {
    const conversation = await this.getConversationByJob(jobId, userId);
    return this.sendMessage(conversation.id, userId, dto);
  }

  async getConversationByJob(jobId: string, userId: string) {
    let conversation = await this.prisma.conversation.findUnique({ where: { jobId } });
    if (!conversation) {
      const job = await this.prisma.serviceRequest.findUnique({ where: { id: jobId } });
      if (job) {
        let workerId = job.selectedWorkerId || (userId === job.customerId ? null : userId);
        if (!workerId) {
          const acceptedOffer = await this.prisma.jobOffer.findFirst({
            where: { jobId: job.id, status: 'ACCEPTED' },
          });
          if (acceptedOffer) {
            workerId = acceptedOffer.workerId;
          }
        }
        if (workerId && (job.customerId === userId || workerId === userId)) {
          conversation = await this.prisma.conversation.upsert({
            where: { jobId: job.id },
            update: {},
            create: {
              jobId: job.id,
              customerId: job.customerId,
              workerId,
            },
          });
        }
      }
    }
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

  async getMessages(conversationId: string, userId: string, query: MessageListQueryDto = {}) {
    const conversation = await this.ensureParticipant(conversationId, userId);
    const { page, limit, skip } = normalizePage(query);
    const where = { conversationId: conversation.id };
    const [items, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({ where }),
    ]);
    const itemsWithJob = items.map((item) => ({
      ...item,
      jobId: conversation.jobId,
    }));
    return toPageResult(itemsWithJob, total, page, limit);
  }

  async sendMessage(conversationId: string, userId: string, dto: SendMessageDto) {
    const conversation = await this.getConversationWithActiveJob(conversationId, userId);
    const { text, imageUrl } = this.resolveContent(dto);

    const created = await this.prisma.message.create({
      data: { conversationId, senderId: userId, text, imageUrl },
    });
    const message = {
      ...created,
      jobId: conversation.jobId,
    };
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessage: text ?? (imageUrl ? '[Image]' : undefined),
        lastMessageAt: message.createdAt,
      },
    });

    const realtimePayload = {
      conversationId: conversation.id,
      jobId: conversation.jobId,
      message,
    };

    // Real-time delivery to everyone joined to the conversation room and job room (incl. sender).
    this.realtime.emitToRoom(chatRoom(conversation.id), CHAT_EVENTS.message, realtimePayload);
    this.realtime.emitToRoom(chatRoom(conversation.jobId), CHAT_EVENTS.message, realtimePayload);
    this.realtime.emitToRoom(`job:${conversation.jobId}`, CHAT_EVENTS.message, realtimePayload);
    this.realtime.emitToRoom(`chat:${conversation.jobId}`, CHAT_EVENTS.message, realtimePayload);

    // Direct delivery to user-specific socket rooms (always connected upon login)
    this.realtime.emitToUsers(
      [conversation.customerId, conversation.workerId],
      CHAT_EVENTS.message,
      realtimePayload,
    );

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
  async ensureParticipant(conversationOrJobId: string, userId: string) {
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        OR: [{ id: conversationOrJobId }, { jobId: conversationOrJobId }],
      },
    });

    if (!conversation) {
      const job = await this.prisma.serviceRequest.findUnique({
        where: { id: conversationOrJobId },
      });
      if (job) {
        let workerId = job.selectedWorkerId || (userId === job.customerId ? null : userId);
        if (!workerId) {
          const acceptedOffer = await this.prisma.jobOffer.findFirst({
            where: { jobId: job.id, status: 'ACCEPTED' },
          });
          if (acceptedOffer) {
            workerId = acceptedOffer.workerId;
          }
        }
        if (workerId && (job.customerId === userId || workerId === userId)) {
          conversation = await this.prisma.conversation.upsert({
            where: { jobId: job.id },
            update: {},
            create: {
              jobId: job.id,
              customerId: job.customerId,
              workerId,
            },
          });
        }
      }
    }

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
    if (!conversation.job?.selectedWorkerId && !conversation.workerId) {
      throw new BadRequestException(
        'CHAT_JOB_NOT_ACCEPTED: chat is only available after a worker is accepted',
      );
    }
    if (conversation.job && JOB_STATUS_BLOCKED_FOR_CHAT.has(conversation.job.status)) {
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
