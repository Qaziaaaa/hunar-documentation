import { http, getStoredUserRaw, getStoredUser } from "@/lib/api-client";
import { unwrapRows } from "@/lib/unwrap-rows";
import { connectSocket, getSocket } from "@/lib/socket";
import { CHAT_EVENT } from "@/lib/socket-events";
import { isMockMode, simulateLatency } from "@/lib/data-source";
import type {
  ChatAttachment,
  ChatMessage,
  Conversation,
  SendMessageInput,
  MessageSenderRole,
} from "@/types/chat";
import {
  mockConversations,
  mockMessages,
} from "@/mocks/chat.mock";

type MessageListener = (message: ChatMessage) => void;
type ConversationListener = (conversation: Conversation) => void;

const mockMessageListeners = new Set<MessageListener>();
const mockConversationListeners = new Set<ConversationListener>();

function getCurrentUserId(): string | undefined {
  try {
    const raw = getStoredUserRaw();
    if (!raw) return undefined;
    return JSON.parse(raw)?.id;
  } catch {
    return undefined;
  }
}

export async function getConversations(): Promise<Conversation[]> {
  if (isMockMode()) {
    return simulateLatency([...mockConversations]);
  }
  try {
    const res = await http.get<any[]>("/chat/conversations");
    const rawList: any[] = unwrapRows(res);
    return rawList.map((item) => ({
      id: item.id,
      jobId: item.jobId,
      jobTitle: item.job?.title || "Job Order",
      customerId: item.customerId,
      customerName: item.customer?.name || "Customer",
      customerAvatar: item.customer?.avatarUrl ?? undefined,
      lastMessage: item.lastMessage ?? undefined,
      lastMessageAt: item.lastMessageAt ?? item.updatedAt ?? undefined,
      unreadCount: 0,
      active: item.isActive ?? true,
    }));
  } catch (err) {
    console.error("[getConversations] Failed to load conversations:", err);
    throw err;
  }
}

export async function getMessages(
  conversationId: string,
): Promise<ChatMessage[]> {
  if (isMockMode()) {
    const messages = mockMessages[conversationId] ?? [];
    return simulateLatency([...messages]);
  }
  try {
    // Try by conversationId first
    let res: any;
    try {
      res = await http.get<any>(`/chat/${conversationId}/messages`);
    } catch {
      // Fallback: try resolving by jobId in case conversationId was a jobId
      res = await http.get<any>(`/chat/${conversationId}`);
    }

    const rawList: any[] = unwrapRows(res);
    const user = getStoredUser();
    const currentUserId = user?.id;
    const isWorker = user?.role === "WORKER";

    return rawList
      .map((item: any) => {
        const isFromMe = Boolean(item.senderId && currentUserId && item.senderId === currentUserId);
        const senderRole: MessageSenderRole = isFromMe
          ? (isWorker ? "worker" : "customer")
          : (isWorker ? "customer" : "worker");
        return {
          id: item.id || `msg-${Date.now()}`,
          conversationId: item.conversationId || conversationId,
          senderId: item.senderId,
          senderRole,
          text: item.text ?? item.content ?? undefined,
          imageUrl: item.imageUrl ?? undefined,
          status: "sent" as const,
          createdAt: item.createdAt || new Date().toISOString(),
        };
      })
      .reverse(); // Backend returns desc (newest first), reverse to asc
  } catch (err) {
    console.error(`[getMessages] Failed to load messages for ${conversationId}:`, err);
    throw err;
  }
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

  const currentUserId = getCurrentUserId();

  try {
    const raw = await http.post<any>(
      `/chat/${input.conversationId}/messages`,
      { text: input.text },
    );
    const persisted: ChatMessage = {
      id: raw.id || `msg-${Date.now()}`,
      conversationId: raw.conversationId || input.conversationId,
      senderId: raw.senderId || currentUserId || "worker",
      senderRole: "worker",
      text: raw.text ?? input.text,
      imageUrl: raw.imageUrl ?? input.imageUrl,
      status: "sent",
      createdAt: raw.createdAt || new Date().toISOString(),
    };
    return persisted;
  } catch (err) {
    // If conversationId was actually a jobId, try /chat/send
    try {
      const raw = await http.post<any>("/chat/send", {
        jobId: input.conversationId,
        text: input.text,
      });
      const persisted: ChatMessage = {
        id: raw.id || `msg-${Date.now()}`,
        conversationId: raw.conversationId || input.conversationId,
        senderId: raw.senderId || currentUserId || "worker",
        senderRole: "worker",
        text: raw.text ?? input.text,
        imageUrl: raw.imageUrl ?? input.imageUrl,
        status: "sent",
        createdAt: raw.createdAt || new Date().toISOString(),
      };
      return persisted;
    } catch {
      console.warn("[sendMessage] Failed to send via backend:", err);
      throw err;
    }
  }
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
  // Backend does not maintain per-message unread flag mutations via REST; no-op gracefully
}

export function subscribeToMessages(listener: MessageListener): () => void {
  if (isMockMode()) {
    mockMessageListeners.add(listener);
    return () => {
      mockMessageListeners.delete(listener);
    };
  }
  const socket = connectSocket();
  if (!socket) return () => undefined;

  const handle = (payload: any) => {
    const raw = payload?.message ?? payload;
    if (!raw || (!raw.text && !raw.content)) return;

    const user = getStoredUser();
    const currentUserId = user?.id;
    const isWorker = user?.role === "WORKER";

    const isFromMe = Boolean(raw.senderId && currentUserId && raw.senderId === currentUserId);
    const senderRole: MessageSenderRole = isFromMe
      ? (isWorker ? "worker" : "customer")
      : (isWorker ? "customer" : "worker");

    const msg: ChatMessage = {
      id: raw.id || `msg-${Date.now()}`,
      messageId: raw.id,
      conversationId: raw.conversationId || payload?.conversationId,
      jobId: payload?.jobId || raw.jobId,
      senderId: raw.senderId || "unknown",
      senderRole,
      text: raw.text ?? raw.content,
      content: raw.text ?? raw.content,
      imageUrl: raw.imageUrl,
      status: "sent",
      createdAt: raw.createdAt || new Date().toISOString(),
    };
    listener(msg);
  };

  socket.on(CHAT_EVENT.receive, handle);
  socket.on("message", handle);
  return () => {
    socket.off(CHAT_EVENT.receive, handle);
    socket.off("message", handle);
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
  const socket = connectSocket();
  if (!socket) return () => undefined;
  const handle = (conversation: Conversation) => listener(conversation);
  socket.on("conversation:updated", handle);
  return () => {
    socket.off("conversation:updated", handle);
  };
}

export function joinConversationRoom(conversationId: string): void {
  const socket = connectSocket();
  if (!socket) return;
  socket.emit(CHAT_EVENT.join, {
    conversationId,
    jobId: conversationId,
  });
}

export function leaveConversationRoom(conversationId: string): void {
  const socket = getSocket();
  if (!socket) return;
  socket.emit(CHAT_EVENT.leave, {
    conversationId,
    jobId: conversationId,
  });
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

function notifyMockConversationListeners(conversation: Conversation): void {
  for (const listener of mockConversationListeners) {
    listener({ ...conversation });
  }
}