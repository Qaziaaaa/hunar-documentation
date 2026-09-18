import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

describe('ChatController', () => {
  it('lists conversations for the authenticated user', async () => {
    const chatService = { listConversations: jest.fn(async () => []) } as unknown as ChatService;
    const controller = new ChatController(chatService);

    await controller.listConversations({ sub: 'w1', email: 'w1@x.com', role: 'WORKER' } as never);

    expect(chatService.listConversations).toHaveBeenCalledWith('w1');
  });

  it('delegates getMessages to the service with the user and query', async () => {
    const chatService = {
      getMessages: jest.fn(async () => ({ items: [], meta: {} })),
    } as unknown as ChatService;
    const controller = new ChatController(chatService);

    await controller.getMessages(
      { sub: 'c1', email: 'c1@x.com', role: 'CUSTOMER' } as never,
      'conv1',
      { page: 2, limit: 10 },
    );

    expect(chatService.getMessages).toHaveBeenCalledWith('conv1', 'c1', { page: 2, limit: 10 });
  });

  it('delegates sendMessage to the service', async () => {
    const chatService = { sendMessage: jest.fn(async () => ({})) } as unknown as ChatService;
    const controller = new ChatController(chatService);

    await controller.sendMessage(
      { sub: 'w1', email: 'w1@x.com', role: 'WORKER' } as never,
      'conv1',
      { text: 'hello' },
    );

    expect(chatService.sendMessage).toHaveBeenCalledWith('conv1', 'w1', { text: 'hello' });
  });

  it('exposes worker/customer-only routes under /chat', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, ChatController.prototype.listConversations);
    expect(roles).toEqual(['WORKER', 'CUSTOMER']);
    expect(Reflect.getMetadata(ROLES_KEY, ChatController.prototype.getMessages)).toEqual([
      'WORKER',
      'CUSTOMER',
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, ChatController.prototype.sendMessage)).toEqual([
      'WORKER',
      'CUSTOMER',
    ]);
    expect(Reflect.getMetadata('path', ChatController)).toBe('chat');
  });
});
