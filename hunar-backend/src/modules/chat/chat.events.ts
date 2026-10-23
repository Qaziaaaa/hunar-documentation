export const CHAT_EVENTS = {
  join: 'chat:join',
  leave: 'chat:leave',
  message: 'chat:message',
  read: 'chat:read',
  typing: 'chat:typing',
  stopTyping: 'chat:stopTyping',
} as const;

export const CHAT_ROOM_PREFIX = 'conversation:';

export function chatRoom(conversationId: string): string {
  return `${CHAT_ROOM_PREFIX}${conversationId}`;
}
