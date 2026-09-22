export type MessageSenderRole = "worker" | "customer";

export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: MessageSenderRole;
  text?: string;
  imageUrl?: string;
  status: MessageStatus;
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
}