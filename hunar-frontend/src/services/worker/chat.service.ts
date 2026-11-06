import { http, getStoredUserRaw, getStoredUser } from "@/lib/api-client";
import { unwrapRows } from "@/lib/unwrap-rows";
import { connectSocket, getSocket } from "@/lib/socket";
import { CHAT_EVENT } from "@/lib/socket-events";
import type {
  ChatAttachment,
  ChatMessage,
  Conversation,
  SendMessageInput,
  MessageSenderRole,
} from "@/types/chat";

type MessageListener = (message: ChatMessage) => void;
type ConversationListener = (conversation: Conversation) => void;

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
  try {
    const res = await http.get<any[]>("/chat/conversations");
    const rawList: any[] = unwrapRows(res);
    return rawList.map((item) => ({
      id: item.id,
      jobId: item.jobId,
      jobTitle: item.job?.title || "Job Order",
      jobStatus: item.job?.status,
      customerId: item.customerId,
      customerName: item.customer?.name || "Customer",
      customerAvatar: item.customer?.avatarUrl ?? undefined,
      lastMessage: item.lastMessage ?? undefined,
      lastMessageAt: item.lastMessageAt ?? item.updatedAt ?? undefined,
      unreadCount: typeof item.unreadCount === "number" ? item.unreadCount : 0,
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
          isRead: Boolean(item.isRead),
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
  const currentUserId = getCurrentUserId();
  const socket = getSocket();

  // Fast-path: Direct WebSocket emission if connected and text message (sub-10ms delivery)
  if (socket?.connected && !input.imageKey) {
    try {
      const wsRes = await new Promise<any>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("WS_TIMEOUT")), 300);
        socket.emit(
          "chat:send",
          {
            conversationId: input.conversationId,
            jobId: input.conversationId,
            text: input.text || undefined,
          },
          (response: any) => {
            clearTimeout(timer);
            if (response?.error) reject(new Error(response.error));
            else resolve(response?.message || response);
          }
        );
      });
      const msgObj = wsRes?.message || wsRes;
      if (msgObj && (msgObj.id || msgObj.text || msgObj.content)) {
        return {
          id: msgObj.id || `msg-${Date.now()}`,
          conversationId: msgObj.conversationId || input.conversationId,
          senderId: msgObj.senderId || currentUserId || "worker",
          senderRole: "worker",
          text: msgObj.text ?? input.text,
          imageUrl: msgObj.imageUrl ?? input.imageUrl,
          status: "sent",
          isRead: false,
          createdAt: msgObj.createdAt || new Date().toISOString(),
        };
      }
    } catch {
      // Fallback to HTTP gracefully
    }
  }

  try {
    const raw = await http.post<any>(
      `/chat/${input.conversationId}/messages`,
      {
        text: input.text || undefined,
        imageKey: input.imageKey,
      },
    );
    const persisted: ChatMessage = {
      id: raw.id || `msg-${Date.now()}`,
      conversationId: raw.conversationId || input.conversationId,
      senderId: raw.senderId || currentUserId || "worker",
      senderRole: "worker",
      text: raw.text ?? input.text,
      imageUrl: raw.imageUrl ?? input.imageUrl,
      status: "sent",
      isRead: false,
      createdAt: raw.createdAt || new Date().toISOString(),
    };
    return persisted;
  } catch (err) {
    // If conversationId was actually a jobId, try /chat/send
    try {
      const raw = await http.post<any>("/chat/send", {
        jobId: input.conversationId,
        text: input.text || undefined,
        imageKey: input.imageKey,
      });
      const persisted: ChatMessage = {
        id: raw.id || `msg-${Date.now()}`,
        conversationId: raw.conversationId || input.conversationId,
        senderId: raw.senderId || currentUserId || "worker",
        senderRole: "worker",
        text: raw.text ?? input.text,
        imageUrl: raw.imageUrl ?? input.imageUrl,
        status: "sent",
        isRead: false,
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
  try {
    await http.post(`/chat/${conversationId}/read`);
  } catch (err) {
    console.warn("[markConversationRead] Failed via HTTP endpoint:", err);
  }
  const socket = getSocket();
  if (socket) {
    socket.emit(CHAT_EVENT.read, {
      conversationId,
      jobId: conversationId,
    });
  }
}

export function subscribeToMessages(listener: MessageListener): () => void {
  const socket = connectSocket();
  if (!socket) return () => undefined;

  const handle = (payload: any) => {
    const raw = payload?.message ?? payload;
    if (!raw || (!raw.text && !raw.content && !raw.imageUrl)) return;

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
      isRead: Boolean(raw.isRead),
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

export function subscribeToReadReceipts(
  listener: (data: { conversationId?: string; jobId?: string; readerId: string; readAt: string }) => void,
): () => void {
  const socket = connectSocket();
  if (!socket) return () => undefined;
  const handle = (payload: any) => {
    if (payload) listener(payload);
  };
  socket.on(CHAT_EVENT.read, handle);
  return () => {
    socket.off(CHAT_EVENT.read, handle);
  };
}

export function subscribeToTyping(
  listener: (data: { conversationId?: string; jobId?: string; userId: string; role?: string; isTyping: boolean }) => void,
): () => void {
  const socket = connectSocket();
  if (!socket) return () => undefined;
  const handleTyping = (payload: any) => {
    if (payload) listener({ ...payload, isTyping: true });
  };
  const handleStopTyping = (payload: any) => {
    if (payload) listener({ ...payload, isTyping: false });
  };
  socket.on(CHAT_EVENT.typing, handleTyping);
  socket.on(CHAT_EVENT.stopTyping, handleStopTyping);
  return () => {
    socket.off(CHAT_EVENT.typing, handleTyping);
    socket.off(CHAT_EVENT.stopTyping, handleStopTyping);
  };
}

export function sendTyping(conversationId: string, jobId?: string): void {
  const socket = getSocket();
  if (!socket) return;
  const user = getStoredUser();
  socket.emit(CHAT_EVENT.typing, {
    conversationId,
    jobId: jobId || conversationId,
    userId: user?.id,
    role: user?.role,
  });
}

export function sendStopTyping(conversationId: string, jobId?: string): void {
  const socket = getSocket();
  if (!socket) return;
  const user = getStoredUser();
  socket.emit(CHAT_EVENT.stopTyping, {
    conversationId,
    jobId: jobId || conversationId,
    userId: user?.id,
    role: user?.role,
  });
}

export function subscribeToConversations(
  listener: ConversationListener,
): () => void {
  const socket = connectSocket();
  if (!socket) return () => undefined;
  const handle = (conversation: Conversation) => listener(conversation);
  socket.on("conversation:updated", handle);
  return () => {
    socket.off("conversation:updated", handle);
  };
}

const activeJoinedRooms = new Set<string>();

export function joinConversationRoom(conversationId: string): void {
  if (!conversationId) return;
  activeJoinedRooms.add(conversationId);
  const socket = connectSocket();
  if (!socket) return;
  socket.emit(CHAT_EVENT.join, {
    conversationId,
    jobId: conversationId,
  });

  if (!(socket as any).__hunarRoomRejoinAttached) {
    (socket as any).__hunarRoomRejoinAttached = true;
    socket.on("connect", () => {
      for (const roomId of activeJoinedRooms) {
        socket.emit(CHAT_EVENT.join, {
          conversationId: roomId,
          jobId: roomId,
        });
      }
    });
  }
}

export function leaveConversationRoom(conversationId: string): void {
  activeJoinedRooms.delete(conversationId);
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