import { ForbiddenException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

function makeSocket(sub: string) {
  const client = {
    data: { user: { sub } },
    join: jest.fn(async (room: string) => room as unknown as void),
  } as unknown as Socket;
  return client;
}

describe('ChatGateway', () => {
  it('joins the conversation room for a participant', async () => {
    const chatService = { ensureParticipant: jest.fn(async () => ({})) } as unknown as ChatService;
    const gateway = new ChatGateway(chatService);
    const client = makeSocket('w1');

    const result = await gateway.handleJoin(client, { conversationId: 'conv1' });

    expect(chatService.ensureParticipant).toHaveBeenCalledWith('conv1', 'w1');
    expect(client.join).toHaveBeenCalledWith('conversation:conv1');
    expect(result).toEqual({ joined: true, conversationId: 'conv1' });
  });

  it('requires a conversationId', async () => {
    const chatService = { ensureParticipant: jest.fn() } as unknown as ChatService;
    const gateway = new ChatGateway(chatService);

    await expect(gateway.handleJoin(makeSocket('w1'), {})).rejects.toThrow(
      'CONVERSATION_ID_REQUIRED',
    );
    expect(chatService.ensureParticipant).not.toHaveBeenCalled();
  });

  it('wraps participant access errors in a WsException', async () => {
    const chatService = {
      ensureParticipant: jest.fn(async () => {
        throw new ForbiddenException('CONVERSATION_ACCESS_FORBIDDEN: not part of this');
      }),
    } as unknown as ChatService;
    const gateway = new ChatGateway(chatService);

    try {
      await gateway.handleJoin(makeSocket('w2'), { conversationId: 'conv1' });
      throw new Error('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(WsException);
      expect((error as WsException).message).toContain('CONVERSATION_ACCESS_FORBIDDEN');
    }
  });

  it('joins the room before broadcasting a message so the sender receives it', async () => {
    const chatService = {
      ensureParticipant: jest.fn(async () => ({})),
      sendMessage: jest.fn(async (c: string, u: string, dto: unknown) => ({
        id: 'msg-9',
        conversationId: c,
        senderId: u,
        text: (dto as { text?: string })?.text,
      })),
    } as unknown as ChatService;
    const gateway = new ChatGateway(chatService);
    const client = makeSocket('c1');

    const result = await gateway.handleSendMessage(client, {
      conversationId: 'conv1',
      text: 'hi',
    });

    expect(chatService.ensureParticipant).toHaveBeenCalledWith('conv1', 'c1');
    expect(client.join).toHaveBeenCalledWith('conversation:conv1');
    expect(chatService.sendMessage).toHaveBeenCalledWith('conv1', 'c1', {
      text: 'hi',
      imageKey: undefined,
    });
    expect(result).toEqual({
      conversationId: 'conv1',
      message: expect.objectContaining({ id: 'msg-9' }),
    });
  });

  it('requires a conversationId when sending', async () => {
    const chatService = { sendMessage: jest.fn() } as unknown as ChatService;
    const gateway = new ChatGateway(chatService);

    await expect(gateway.handleSendMessage(makeSocket('w1'), { text: 'hi' })).rejects.toThrow(
      'CONVERSATION_ID_REQUIRED',
    );
    expect(chatService.sendMessage).not.toHaveBeenCalled();
  });

  it('wraps send errors in a WsException', async () => {
    const chatService = {
      ensureParticipant: jest.fn(async () => ({})),
      sendMessage: jest.fn(async () => {
        throw new Error('MESSAGE_EMPTY: provide text or an image');
      }),
    } as unknown as ChatService;
    const gateway = new ChatGateway(chatService);

    try {
      await gateway.handleSendMessage(makeSocket('w1'), { conversationId: 'conv1' });
      throw new Error('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(WsException);
      expect((error as WsException).message).toContain('MESSAGE_EMPTY');
    }
  });
});
