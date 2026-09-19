export const CHAT_EVENTS = {
  join: 'chat:join',
  message: 'chat:message',
} as const;

export const CHAT_ROOM_PREFIX = 'conversation:';

export function chatRoom(conversationId: string): string {
  return `${CHAT_ROOM_PREFIX}${conversationId}`;
}
