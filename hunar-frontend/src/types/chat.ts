export type MessageSenderRole = "worker" | "customer";

export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

export interface ChatMessage {
  id: string;
  messageId?: string;
  conversationId: string;
  senderId: string;
  receiverId?: string;
  jobId?: string;
  senderRole: MessageSenderRole;
  text?: string;
  content?: string;
  imageUrl?: string;
  audioUrl?: string;
  durationSeconds?: number;
  messageType?: "text" | "voice" | "image";
  status: MessageStatus;
  isRead?: boolean;
  createdAt: string;
}

export interface ChatAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface Conversation {
  id: string;
  jobId: string;
  jobTitle?: string;
  jobStatus?: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  active: boolean;
}

export interface SendMessageInput {
  conversationId: string;
  text?: string;
  imageUrl?: string;
  imageKey?: string;
}