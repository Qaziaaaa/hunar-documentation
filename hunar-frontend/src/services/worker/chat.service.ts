import { http } from "@/lib/api-client";
import { connectSocket, getSocket } from "@/lib/socket";
import { CHAT_EVENT } from "@/lib/socket-events";
import { isMockMode, simulateLatency } from "@/lib/data-source";
import type {
  ChatAttachment,
  ChatMessage,
  Conversation,
  SendMessageInput,
} from "@/types/chat";
import {
  mockConversations,
  mockMessages,
} from "@/mocks/chat.mock";

type MessageListener = (message: ChatMessage) => void;
type ConversationListener = (conversation: Conversation) => void;

const mockMessageListeners = new Set<MessageListener>();
const mockConversationListeners = new Set<ConversationListener>();

export async function getConversations(): Promise<Conversation[]> {
  if (isMockMode()) {
    return simulateLatency([...mockConversations]);
  }
  return http.get<Conversation[]>(`/conversations/my`);
}

export async function getMessages(
  conversationId: string,
): Promise<ChatMessage[]> {
  if (isMockMode()) {
    const messages = mockMessages[conversationId] ?? [];
    return simulateLatency([...messages]);
  }
  return http.get<ChatMessage[]>(`/conversations/${conversationId}/messages`);
}

export async function sendMessage(
  input: SendMessageInput,
): Promise<ChatMessage> {
  if (isMockMode()) {
    await simulateLatency(undefined, 200, 500);
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId: input.conversationId,
      senderId: "worker-demo-1",
      senderRole: "worker",
      text: input.text,
      imageUrl: input.imageUrl,
      status: "sent" as const,
      createdAt: new Date().toISOString(),
    };
    if (!mockMessages[input.conversationId]) {
      mockMessages[input.conversationId] = [];
    }
    mockMessages[input.conversationId].push(message);
    const conversation = mockConversations.find(
      (c) => c.id === input.conversationId,
    );
    if (conversation) {
      conversation.lastMessage = input.text ?? "Photo";
      conversation.lastMessageAt = message.createdAt;
      notifyMockConversationListeners(conversation);
    }
    for (const listener of mockMessageListeners) {
      listener(message);
    }
    return message;
  }
  const persisted = await http.post<ChatMessage>(
    `/conversations/${input.conversationId}/messages`,
    { text: input.text, imageUrl: input.imageUrl },
  );
  emitSocketMessage(persisted);
  return persisted;
}

export async function markConversationRead(
  conversationId: string,
): Promise<void> {
  if (isMockMode()) {
    await simulateLatency(undefined, 150, 400);
    const conversation = mockConversations.find(
      (c) => c.id === conversationId,
    );
    if (conversation) {
      conversation.unreadCount = 0;
    }
    return;
  }
  await http.put(`/conversations/${conversationId}/read`);
}

export function subscribeToMessages(listener: MessageListener): () => void {
  if (isMockMode()) {
    mockMessageListeners.add(listener);
    return () => {
      mockMessageListeners.delete(listener);
    };
  }
  const socket = getSocket();
  if (!socket) return () => undefined;
  const handle = (message: ChatMessage) => listener(message);
  socket.on(CHAT_EVENT.receive, handle);
  return () => {
    socket.off(CHAT_EVENT.receive, handle);
  };
}

export function subscribeToConversations(
  listener: ConversationListener,
): () => void {
  if (isMockMode()) {
    mockConversationListeners.add(listener);
    return () => {
      mockConversationListeners.delete(listener);
    };
  }
  const socket = getSocket();
  if (!socket) return () => undefined;
  const handle = (conversation: Conversation) => listener(conversation);
  socket.on("conversation:updated", handle);
  return () => {
    socket.off("conversation:updated", handle);
  };
}

export function joinConversationRoom(conversationId: string): void {
  const socket = getSocket();
  if (!socket) return;
  socket.emit(CHAT_EVENT.join, { conversationId });
}

export function leaveConversationRoom(conversationId: string): void {
  const socket = getSocket();
  if (!socket) return;
  socket.emit(CHAT_EVENT.leave, { conversationId });
}

export function convertFileToAttachment(
  file: File,
): ChatAttachment {
  return {
    id: `file-${Date.now()}`,
    name: file.name,
    url: "",
    size: file.size,
    type: file.type,
  };
}

export const queryKeys = {
  conversations: ["worker", "chat", "conversations"] as const,
  messages: (conversationId: string) =>
    ["worker", "chat", "messages", conversationId] as const,
};

function emitSocketMessage(message: ChatMessage): void {
  const socket = connectSocket();
  if (!socket) return;
  socket.emit(CHAT_EVENT.send, message);
}

function notifyMockConversationListeners(conversation: Conversation): void {
  for (const listener of mockConversationListeners) {
    listener({ ...conversation });
  }
}