import { http, getStoredUser, API_BASE_URL } from "@/lib/api-client";
import { getSocket } from "@/lib/socket";

export interface ChatMessage {
  id: string;
  messageId?: string;
  conversationId?: string;
  senderId: string;
  receiverId?: string;
  jobId?: string;
  senderRole?: "WORKER" | "CUSTOMER" | "ADMIN";
  type?: "text" | "voice" | "image";
  messageType?: "text" | "voice" | "image";
  content: string;
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  durationSeconds?: number;
  createdAt: string;
  isRead?: boolean;
}

export interface ChatConversation {
  id: string;
  jobId: string;
  workerId: string;
  customerId: string;
  lastMessage?: string;
  lastMessageAt?: string;
  updatedAt?: string;
  unreadCount?: number;
  job?: { id: string; title: string; status: string };
  customer?: { id: string; name: string; avatarUrl: string | null };
  worker?: { id: string; name: string; avatarUrl: string | null };
}

export function normalizeChatMessage(raw: any): ChatMessage {
  const text = raw.text ?? raw.content ?? "";
  const user = getStoredUser();
  const currentUserId = user?.id;
  const isWorker = user?.role === "WORKER";
  const isFromMe = Boolean(raw.senderId && currentUserId && raw.senderId === currentUserId);

  let senderRole: "WORKER" | "CUSTOMER" | "ADMIN" = "CUSTOMER";
  if (raw.senderRole) {
    senderRole = raw.senderRole;
  } else if (isFromMe) {
    senderRole = isWorker ? "WORKER" : "CUSTOMER";
  } else {
    senderRole = isWorker ? "CUSTOMER" : "WORKER";
  }

  const voice = parseVoiceNote(text);
  const messageType: "text" | "voice" | "image" = voice ? "voice" : raw.imageUrl ? "image" : "text";
  const messageId = raw.id || raw.messageId || voice?.messageId || `msg-${Date.now()}`;

  return {
    id: messageId,
    messageId,
    conversationId: raw.conversationId,
    senderId: raw.senderId || voice?.senderId || currentUserId || "current-user",
    receiverId: raw.receiverId || voice?.receiverId,
    jobId: raw.jobId || voice?.jobId,
    senderRole,
    type: messageType,
    messageType,
    content: text,
    text: voice ? undefined : text,
    imageUrl: raw.imageUrl,
    audioUrl: voice?.audioUrl,
    durationSeconds: voice?.durationSeconds,
    createdAt: raw.createdAt || new Date().toISOString(),
    isRead: Boolean(raw.isRead),
  };
}

/**
 * List all active conversations for the authenticated user
 */
export async function listConversations(): Promise<ChatConversation[]> {
  const res = await http.get<ChatConversation[]>("/chat/conversations");
  const rawList = Array.isArray(res) ? res : (res as any)?.items ?? [];
  return rawList;
}

/**
 * Get messages inside a conversation by conversationId with pagination
 */
export async function getConversationMessages(
  conversationId: string,
  page: number = 1,
  limit: number = 30
): Promise<ChatMessage[]> {
  const res = await http.get<any>(`/chat/${conversationId}/messages?page=${page}&limit=${limit}`);
  const rawList: any[] = Array.isArray(res) ? res : (res?.items ?? []);
  // Backend orders desc by default, reverse to chronological ascending order
  return rawList.map(normalizeChatMessage).reverse();
}

/**
 * Get messages for a job directly by jobId with pagination
 */
export async function getMessagesByJob(
  jobId: string,
  page: number = 1,
  limit: number = 30
): Promise<ChatMessage[]> {
  const res = await http.get<any>(`/chat/${jobId}?page=${page}&limit=${limit}`);
  const rawList: any[] = Array.isArray(res) ? res : (res?.items ?? []);
  return rawList.map(normalizeChatMessage).reverse();
}

/**
 * Send a new chat message (supports either conversationId or jobId)
 */
export async function sendChatMessage(
  targetId: string,
  content: string,
  options?: { isJobId?: boolean; imageKey?: string }
): Promise<ChatMessage> {
  const text = content?.trim() || "";

  // Fast-path: WebSocket emission if connected and text message (sub-10ms delivery)
  if (!options?.imageKey) {
    const socket = getSocket();
    if (socket?.connected) {
      try {
        const wsRes = await new Promise<any>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error("WS_TIMEOUT")), 300);
          socket.emit(
            "chat:send",
            {
              conversationId: targetId,
              jobId: targetId,
              text: text || undefined,
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
          return normalizeChatMessage(msgObj);
        }
      } catch {
        // Fallback to HTTP gracefully
      }
    }
  }

  // If designated as a jobId, send via POST /chat/send
  if (options?.isJobId) {
    try {
      const res = await http.post<any>("/chat/send", {
        jobId: targetId,
        text: text || undefined,
        imageKey: options?.imageKey,
      });
      return normalizeChatMessage(res);
    } catch (err) {
      console.warn(`[sendChatMessage] /chat/send failed for job ${targetId}, trying /chat/${targetId}/messages:`, err);
    }
  }

  // Otherwise send via POST /chat/:conversationId/messages
  try {
    const res = await http.post<any>(`/chat/${targetId}/messages`, {
      text: text || undefined,
      imageKey: options?.imageKey,
    });
    return normalizeChatMessage(res);
  } catch (err) {
    // If targetId was actually a jobId and /chat/:conversationId/messages failed, fallback to /chat/send
    if (!options?.isJobId) {
      try {
        const res = await http.post<any>("/chat/send", {
          jobId: targetId,
          text: text || undefined,
          imageKey: options?.imageKey,
        });
        return normalizeChatMessage(res);
      } catch {
        // Fall through
      }
    }
    console.error("[sendChatMessage] Backend request failed:", err);
    throw err;
  }
}

/**
 * Upload an image attachment in chat
 */
export async function uploadChatImage(
  file: File
): Promise<{ key: string; url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return await http.upload<{ key: string; url: string }>(
    "/uploads/chat-image",
    formData
  );
}

/**
 * Store base64 voice note data URL in localStorage cache
 */
export function storeVoiceInCache(voiceId: string, dataUrl: string): void {
  if (typeof window === "undefined" || !voiceId || !dataUrl) return;
  try {
    window.localStorage.setItem(`hunar_voice_${voiceId}`, dataUrl);
    const keysJson = window.localStorage.getItem("hunar_voice_keys");
    const keys: string[] = keysJson ? JSON.parse(keysJson) : [];
    if (!keys.includes(voiceId)) {
      keys.push(voiceId);
      if (keys.length > 50) {
        const oldest = keys.shift();
        if (oldest) window.localStorage.removeItem(`hunar_voice_${oldest}`);
      }
      window.localStorage.setItem("hunar_voice_keys", JSON.stringify(keys));
    }
  } catch (err) {
    console.warn("[storeVoiceInCache] Cache failed:", err);
  }
}

/**
 * Retrieve cached base64 voice note data URL from localStorage
 */
export function getVoiceFromCache(voiceId: string): string | null {
  if (typeof window === "undefined" || !voiceId) return null;
  try {
    return window.localStorage.getItem(`hunar_voice_${voiceId}`);
  } catch {
    return null;
  }
}

/**
 * Resolve backend origin without /api/v1 suffix
 */
export function getBackendOrigin(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/+$/, "");
  }
  return API_BASE_URL.replace(/\/api(\/v\d+)?\/?$/, "");
}

/**
 * Resolve relative or static audio URL to an accessible absolute URL
 */
export function resolveAudioUrl(url?: string | null): string {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  const origin = getBackendOrigin();
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${origin}${cleanPath}`;
}

/**
 * Upload a voice note audio attachment in chat
 */
export async function uploadVoiceNote(
  fileOrBlob: File | Blob
): Promise<{ key: string; url: string }> {
  try {
    const rawMime = (fileOrBlob as any).type || "audio/webm";
    const baseMime = rawMime.split(";")[0].trim().toLowerCase() || "audio/webm";
    const ext = baseMime.includes("wav") ? "wav" : baseMime.includes("mp4") ? "m4a" : "webm";
    const file =
      fileOrBlob instanceof File
        ? fileOrBlob
        : new File([fileOrBlob], `voice-${Date.now()}.${ext}`, { type: baseMime });

    const formData = new FormData();
    formData.append("file", file);
    const result = await http.upload<{ key: string; url: string }>(
      "/uploads/voice-note",
      formData
    );
    let resolvedUrl = result.url;
    if (resolvedUrl) {
      resolvedUrl = resolveAudioUrl(resolvedUrl);
    }
    return {
      key: result.key,
      url: resolvedUrl,
    };
  } catch (err) {
    console.error("[uploadVoiceNote] Failed to upload voice note to backend:", err);
    throw err;
  }
}

export interface VoiceNoteMetaOptions {
  jobId?: string;
  senderId?: string;
  receiverId?: string;
  messageId?: string;
  voiceId?: string;
}

/**
 * Encode voice note metadata into a structured JSON string for chat messages
 */
export function encodeVoiceNote(
  audioUrl: string,
  durationSeconds: number,
  options?: VoiceNoteMetaOptions | string
): string {
  const opts = typeof options === "string" ? { voiceId: options } : options || {};

  return JSON.stringify({
    type: "voice",
    messageType: "voice",
    audioUrl,
    durationSeconds: Math.max(1, Math.round(durationSeconds) || 1),
    jobId: opts.jobId,
    senderId: opts.senderId,
    receiverId: opts.receiverId,
    messageId: opts.messageId,
    voiceId: opts.voiceId,
  });
}

export interface ParsedVoiceNote {
  audioUrl: string;
  durationSeconds: number;
  messageType: "voice";
  messageId?: string;
  senderId?: string;
  receiverId?: string;
  jobId?: string;
  voiceId?: string;
}

/**
 * Parse structured voice note into playable audio URL and metadata
 */
export function parseVoiceNote(
  text?: string | null
): ParsedVoiceNote | null {
  if (!text) return null;
  const trimmed = text.trim();

  // 1. JSON format: {"type":"voice",...} or {"messageType":"voice",...}
  if (
    trimmed.startsWith("{") &&
    (trimmed.includes('"type":"voice"') ||
      trimmed.includes('"type": "voice"') ||
      trimmed.includes('"messageType":"voice"') ||
      trimmed.includes('"messageType": "voice"'))
  ) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.type === "voice" || parsed.messageType === "voice") {
        const durationSeconds = Math.max(
          1,
          Math.round(Number(parsed.durationSeconds || parsed.duration || 1))
        );
        let audioUrl = parsed.audioUrl || "";

        // If audioUrl is relative, e.g. /uploads/..., resolve to full backend URL
        if (audioUrl) {
          audioUrl = resolveAudioUrl(audioUrl);
        }

        // If voiceId is provided and no audioUrl, check cache
        if (!audioUrl && parsed.voiceId) {
          const cached = getVoiceFromCache(parsed.voiceId);
          if (cached) {
            audioUrl = cached;
          }
        }

        return {
          audioUrl,
          durationSeconds,
          messageType: "voice",
          messageId: parsed.messageId,
          senderId: parsed.senderId,
          receiverId: parsed.receiverId,
          jobId: parsed.jobId,
          voiceId: parsed.voiceId,
        };
      }
    } catch {}
  }

  // 2. Prefix format: VOICE_NOTE:<url>:<duration>
  if (trimmed.startsWith("VOICE_NOTE:")) {
    const parts = trimmed.split(":");
    const duration = Math.max(1, Math.round(Number(parts[parts.length - 1]) || 1));
    let audioUrl = parts.slice(1, parts.length - 1).join(":");
    if (audioUrl) {
      audioUrl = resolveAudioUrl(audioUrl);
    }
    return {
      audioUrl,
      durationSeconds: duration,
      messageType: "voice",
    };
  }

  return null;
}

/**
 * Converts a Blob to a Base64 data URL string
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
