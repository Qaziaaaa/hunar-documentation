import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { UploadsService } from '../uploads/uploads.service';
import { RealtimeService } from '../realtime/realtime.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';

const makeEventBus = () => ({ emit: jest.fn() } as unknown as EventBusService);

class Db {
  users = new Map<string, any>();
  serviceRequests = new Map<string, any>();
  conversations = new Map<string, any>();
  messages = new Map<string, any>();
  counter = 0;
}

function seedUser(db: Db, id: string, name: string) {
  db.users.set(id, { id, name, avatarUrl: `https://cdn/${id}.jpg` });
}

function seedJob(
  db: Db,
  id: string,
  customerId: string,
  selectedWorkerId: string | null,
  status: string,
) {
  db.serviceRequests.set(id, { id, customerId, selectedWorkerId, status, title: `Job ${id}` });
}

function seedConversation(db: Db, id: string, jobId: string, customerId: string, workerId: string) {
  db.conversations.set(id, {
    id,
    jobId,
    customerId,
    workerId,
    lastMessage: null,
    lastMessageAt: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function makeFakes(db: Db) {
  const prisma: any = {
    db,
    conversation: {
      async findUnique({
        where,
        include,
      }: {
        where: { id?: string; jobId?: string };
        include?: { job?: { select: Record<string, boolean> } };
      }) {
        const found = where.id
          ? db.conversations.get(where.id)
          : where.jobId
            ? Array.from(db.conversations.values()).find((c) => c.jobId === where.jobId)
            : undefined;
        if (!found) return null;
        if (include?.job?.select) {
          const job = db.serviceRequests.get(found.jobId);
          return {
            ...found,
            job: job ? { id: found.jobId, ...pickSelect(job, include.job.select) } : undefined,
          };
        }
        return found;
      },
      async upsert({ where, create }: { where: { jobId: string }; create: any }) {
        const existing = Array.from(db.conversations.values()).find((c) => c.jobId === where.jobId);
        if (existing) return existing;
        const conversation = { ...create, id: `conv-${db.counter++}` };
        db.conversations.set(conversation.id, conversation);
        return conversation;
      },
      async findMany({
        where,
        include,
        orderBy,
      }: {
        where: { OR?: Array<Record<string, string>> };
        include: Record<string, { select: Record<string, boolean> }>;
        orderBy?: Record<string, string>;
      }) {
        const conditions = where?.OR ?? [];
        let rows = Array.from(db.conversations.values()).filter((c) =>
          conditions.some((cond) => Object.entries(cond).some(([k, v]) => c[k] === v)),
        );
        if (orderBy?.lastMessageAt === 'desc') {
          rows = rows.sort((a, b) => {
            const at = a.lastMessageAt?.getTime() ?? 0;
            const bt = b.lastMessageAt?.getTime() ?? 0;
            return bt - at;
          });
        }
        return rows.map((c) => ({
          ...c,
          job:
            include?.job?.select && db.serviceRequests.get(c.jobId)
              ? Object.assign(
                  { id: c.jobId },
                  pickSelect(db.serviceRequests.get(c.jobId), include.job.select),
                )
              : undefined,
          customer:
            include?.customer?.select && db.users.get(c.customerId)
              ? {
                  id: c.customerId,
                  ...pickSelect(db.users.get(c.customerId), include.customer.select),
                }
              : undefined,
          worker:
            include?.worker?.select && db.users.get(c.workerId)
              ? { id: c.workerId, ...pickSelect(db.users.get(c.workerId), include.worker.select) }
              : undefined,
        }));
      },
      async update({ where, data }: { where: { id: string }; data: any }) {
        const conversation = db.conversations.get(where.id);
        if (!conversation) return null;
        Object.assign(conversation, data);
        return conversation;
      },
    },
    message: {
      async create({ data }: { data: any }) {
        const message = {
          ...data,
          id: `msg-${db.counter++}`,
          isRead: false,
          createdAt: new Date(1700000000000 + db.counter),
        };
        db.messages.set(message.id, message);
        return message;
      },
      async findMany({
        where,
        orderBy,
        skip,
        take,
      }: {
        where: { conversationId: string };
        orderBy?: Record<string, string>;
        skip?: number;
        take?: number;
      }) {
        let rows = Array.from(db.messages.values()).filter(
          (m) => m.conversationId === where.conversationId,
        );
        if (orderBy?.createdAt === 'desc') {
          rows = rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        return rows.slice(skip ?? 0, (skip ?? 0) + (take ?? rows.length));
      },
      async count({ where }: { where: { conversationId: string } }) {
        return Array.from(db.messages.values()).filter(
          (m) => m.conversationId === where.conversationId,
        ).length;
      },
    },
  };
  const uploads = {
    getUrl: jest.fn((key: string) => `http://localhost:9000/hunar-uploads/${key}`),
  } as unknown as UploadsService;
  const realtime = { emitToRoom: jest.fn() } as unknown as RealtimeService;

  return { prisma, uploads, realtime };
}

function pickSelect(row: Record<string, unknown>, select: Record<string, boolean>) {
  const out: Record<string, unknown> = {};
  for (const [key, enabled] of Object.entries(select)) {
    if (enabled && key in row) out[key] = row[key];
  }
  return out;
}

function setupActiveConversation(db: Db) {
  seedUser(db, 'c1', 'Customer One');
  seedUser(db, 'w1', 'Worker One');
  seedUser(db, 'w2', 'Worker Two');
  seedJob(db, 'job1', 'c1', 'w1', 'WORKER_ASSIGNED');
  seedJob(db, 'job-closed', 'c1', 'w1', 'CANCELLED');
  seedJob(db, 'job-unassigned', 'c1', null, 'OPEN');
  seedConversation(db, 'conv1', 'job1', 'c1', 'w1');
  seedConversation(db, 'conv-closed', 'job-closed', 'c1', 'w1');
  seedConversation(db, 'conv-unassigned', 'job-unassigned', 'c1', 'w1');
}

describe('ChatService', () => {
  it('creates a conversation automatically on offer.accepted and is idempotent', async () => {
    const db = new Db();
    const { prisma } = makeFakes(db);
    const service = new ChatService(prisma, {} as UploadsService, {} as RealtimeService, makeEventBus());

    await service.handleOfferAccepted({ jobId: 'jobX', workerId: 'w1', customerId: 'c1' });
    await service.handleOfferAccepted({ jobId: 'jobX', workerId: 'w1', customerId: 'c1' });

    expect(db.conversations.size).toBe(1);
    const conversation = Array.from(db.conversations.values())[0];
    expect(conversation.jobId).toBe('jobX');
    expect(conversation.workerId).toBe('w1');
    expect(conversation.customerId).toBe('c1');
  });

  it('listConversations only returns conversations the user participates in', async () => {
    const db = new Db();
    const { prisma } = makeFakes(db);
    setupActiveConversation(db);
    const service = new ChatService(prisma, {} as UploadsService, {} as RealtimeService, makeEventBus());

    const listW1 = await service.listConversations('w1');
    expect(listW1).toHaveLength(3);

    const listW2 = await service.listConversations('w2');
    expect(listW2).toHaveLength(0);
  });

  describe('getMessages', () => {
    it('returns paginated history for a participant', async () => {
      const db = new Db();
      const { prisma } = makeFakes(db);
      setupActiveConversation(db);
      const service = new ChatService(prisma, {} as UploadsService, {} as RealtimeService, makeEventBus());

      await prisma.message.create({
        data: { conversationId: 'conv1', senderId: 'w1', text: 'first', imageUrl: null },
      });
      await prisma.message.create({
        data: { conversationId: 'conv1', senderId: 'c1', text: 'second', imageUrl: null },
      });

      const result = await service.getMessages('conv1', 'w1', { page: 1, limit: 20 });
      expect(result.items).toHaveLength(2);
      expect(result.items[0].text).toBe('second');
      expect(result.meta.total).toBe(2);
    });

    it('rejects a non-participant', async () => {
      const db = new Db();
      const { prisma } = makeFakes(db);
      setupActiveConversation(db);
      const service = new ChatService(prisma, {} as UploadsService, {} as RealtimeService, makeEventBus());

      await expect(service.getMessages('conv1', 'w2', {})).rejects.toThrow(ForbiddenException);
    });

    it('returns 404 for an unknown conversation', async () => {
      const db = new Db();
      const { prisma } = makeFakes(db);
      setupActiveConversation(db);
      const service = new ChatService(prisma, {} as UploadsService, {} as RealtimeService, makeEventBus());

      await expect(service.getMessages('conv-missing', 'w1', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('sendMessage', () => {
    it('stores a text message, updates the conversation and emits real-time', async () => {
      const db = new Db();
      const { prisma, uploads, realtime } = makeFakes(db);
      setupActiveConversation(db);
      const service = new ChatService(prisma, uploads, realtime, makeEventBus());

      const message = await service.sendMessage('conv1', 'w1', { text: 'Hello!' });

      expect(message.conversationId).toBe('conv1');
      expect(message.senderId).toBe('w1');
      expect(message.text).toBe('Hello!');
      expect(db.conversations.get('conv1').lastMessage).toBe('Hello!');
      expect(db.conversations.get('conv1').lastMessageAt).toEqual(message.createdAt);
      expect(realtime.emitToRoom).toHaveBeenCalledWith(
        'conversation:conv1',
        'chat:message',
        expect.objectContaining({ conversationId: 'conv1', message }),
      );
    });

    it('resolves a chat-image key to its stored URL', async () => {
      const db = new Db();
      const { prisma, uploads, realtime } = makeFakes(db);
      setupActiveConversation(db);
      const service = new ChatService(prisma, uploads, realtime, makeEventBus());

      const message = await service.sendMessage('conv1', 'c1', {
        text: 'look at this',
        imageKey: 'chat-images/c1/abc.jpg',
      });

      expect(uploads.getUrl).toHaveBeenCalledWith('chat-images/c1/abc.jpg');
      expect(message.imageUrl).toBe('http://localhost:9000/hunar-uploads/chat-images/c1/abc.jpg');
      expect(message.text).toBe('look at this');
      expect(db.conversations.get('conv1').lastMessage).toBe('look at this');
    });

    it('rejects an image key outside the chat-images folder', async () => {
      const db = new Db();
      const { prisma, uploads } = makeFakes(db);
      setupActiveConversation(db);
      const service = new ChatService(prisma, uploads, {} as RealtimeService, makeEventBus());

      await expect(
        service.sendMessage('conv1', 'w1', { imageKey: 'cnic-documents/w1/a.jpg' }),
      ).rejects.toThrow(/IMAGE_KEY_INVALID/);
      expect(uploads.getUrl).not.toHaveBeenCalled();
    });

    it('requires text or an image', async () => {
      const db = new Db();
      const { prisma } = makeFakes(db);
      setupActiveConversation(db);
      const service = new ChatService(prisma, {} as UploadsService, {} as RealtimeService, makeEventBus());

      await expect(service.sendMessage('conv1', 'w1', { text: '  ' })).rejects.toThrow(
        /MESSAGE_EMPTY/,
      );
      await expect(service.sendMessage('conv1', 'w1', {})).rejects.toThrow(/MESSAGE_EMPTY/);
    });

    it('rejects oversized text', async () => {
      const db = new Db();
      const { prisma } = makeFakes(db);
      setupActiveConversation(db);
      const service = new ChatService(prisma, {} as UploadsService, {} as RealtimeService, makeEventBus());

      await expect(service.sendMessage('conv1', 'w1', { text: 'x'.repeat(2001) })).rejects.toThrow(
        /MESSAGE_TOO_LONG/,
      );
    });

    it('forbids a user who is not a participant', async () => {
      const db = new Db();
      const { prisma } = makeFakes(db);
      setupActiveConversation(db);
      const service = new ChatService(prisma, {} as UploadsService, {} as RealtimeService, makeEventBus());

      await expect(service.sendMessage('conv1', 'w2', { text: 'hi' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('blocks messaging once the job is closed (cancelled/disputed)', async () => {
      const db = new Db();
      const { prisma } = makeFakes(db);
      setupActiveConversation(db);
      const service = new ChatService(prisma, {} as UploadsService, {} as RealtimeService, makeEventBus());

      await expect(service.sendMessage('conv-closed', 'w1', { text: 'hi' })).rejects.toThrow(
        /CHAT_JOB_CLOSED/,
      );
    });

    it('blocks messages for a job with no accepted worker', async () => {
      const db = new Db();
      const { prisma } = makeFakes(db);
      setupActiveConversation(db);
      const service = new ChatService(prisma, {} as UploadsService, {} as RealtimeService, makeEventBus());

      await expect(service.sendMessage('conv-unassigned', 'w1', { text: 'hi' })).rejects.toThrow(
        /CHAT_JOB_NOT_ACCEPTED/,
      );
    });
  });

  describe('ensureParticipant (socket join guard)', () => {
    it('joins participants and rejects others', async () => {
      const db = new Db();
      const { prisma } = makeFakes(db);
      setupActiveConversation(db);
      const service = new ChatService(prisma, {} as UploadsService, {} as RealtimeService, makeEventBus());

      await expect(service.ensureParticipant('conv1', 'w1')).resolves.toBeTruthy();
      await expect(service.ensureParticipant('conv1', 'c1')).resolves.toBeTruthy();
      await expect(service.ensureParticipant('conv1', 'w2')).rejects.toThrow(ForbiddenException);
      await expect(service.ensureParticipant('conv-missing', 'w1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
