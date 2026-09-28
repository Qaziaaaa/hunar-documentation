import { http } from "@/lib/api-client";
import { isMockMode } from "@/lib/data-source";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: "WORKER" | "CUSTOMER" | "ADMIN";
  content: string;
  createdAt: string;
  isRead?: boolean;
}

export interface ChatConversation {
  id: string;
  jobId: string;
  workerId: string;
  customerId: string;
  lastMessage?: string;
  updatedAt: string;
}

/**
 * List all active conversations for the authenticated user
 */
export async function listConversations(): Promise<ChatConversation[]> {
  try {
    const res = await http.get<ChatConversation[]>("/chat/conversations");
    return Array.isArray(res) ? res : [];
  } catch (err) {
    console.warn("[listConversations] Backend offline, using local conversations:", err);
    return [];
  }
}

/**
 * Get messages inside a conversation
 */
export async function getConversationMessages(
  conversationId: string
): Promise<ChatMessage[]> {
  try {
    const res = await http.get<ChatMessage[]>(`/chat/${conversationId}/messages`);
    return Array.isArray(res) ? res : [];
  } catch (err) {
    console.warn(`[getConversationMessages] Backend offline for ${conversationId}:`, err);
    return [];
  }
}

/**
 * Send a new chat message
 */
export async function sendChatMessage(
  conversationId: string,
  content: string
): Promise<ChatMessage> {
  if (isMockMode()) {
    return {
      id: `msg-${Date.now()}`,
      senderId: "current-user",
      senderRole: "CUSTOMER",
      content,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  }
  try {
    return await http.post<ChatMessage>(`/chat/${conversationId}/messages`, {
      content,
    });
  } catch (err) {
    console.warn("[sendChatMessage] Backend offline, creating optimistic message:", err);
    return {
      id: `msg-${Date.now()}`,
      senderId: "current-user",
      senderRole: "CUSTOMER",
      content,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }
}

/**
 * Upload an image attachment in chat
 */
export async function uploadChatImage(
  file: File
): Promise<{ key: string; url: string }> {
  if (isMockMode()) {
    return { key: `chat-img-${Date.now()}`, url: URL.createObjectURL(file) };
  }
  try {
    const formData = new FormData();
    formData.append("file", file);
    return await http.upload<{ key: string; url: string }>(
      "/uploads/chat-image",
      formData
    );
  } catch (err) {
    console.warn("[uploadChatImage] Backend offline, using local preview URL:", err);
    return {
      key: `chat-img-${Date.now()}`,
      url: URL.createObjectURL(file),
    };
  }
}
