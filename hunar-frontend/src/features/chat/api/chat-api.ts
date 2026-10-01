import { http, getStoredUser } from "@/lib/api-client";
import { isMockMode } from "@/lib/data-source";

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
  try {
    const res = await http.get<ChatConversation[]>("/chat/conversations");
    const rawList = Array.isArray(res) ? res : (res as any)?.items ?? [];
    return rawList;
  } catch (err) {
    console.warn("[listConversations] Backend offline, using local conversations:", err);
    return [];
  }
}

/**
 * Get messages inside a conversation by conversationId
 */
export async function getConversationMessages(
  conversationId: string
): Promise<ChatMessage[]> {
  try {
    const res = await http.get<any>(`/chat/${conversationId}/messages`);
    const rawList: any[] = Array.isArray(res) ? res : (res?.items ?? []);
    // Backend orders desc by default, reverse to chronological ascending order
    return rawList.map(normalizeChatMessage).reverse();
  } catch (err) {
    console.warn(`[getConversationMessages] Backend offline for ${conversationId}:`, err);
    return [];
  }
}

/**
 * Get messages for a job directly by jobId
 */
export async function getMessagesByJob(
  jobId: string
): Promise<ChatMessage[]> {
  try {
    const res = await http.get<any>(`/chat/${jobId}`);
    const rawList: any[] = Array.isArray(res) ? res : (res?.items ?? []);
    return rawList.map(normalizeChatMessage).reverse();
  } catch (err) {
    console.warn(`[getMessagesByJob] Backend error for job ${jobId}:`, err);
    return [];
  }
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
  if (isMockMode()) {
    return {
      id: `msg-${Date.now()}`,
      conversationId: targetId,
      senderId: "current-user",
      senderRole: "CUSTOMER",
      content: text,
      text: text,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
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
    console.warn("[sendChatMessage] Backend offline or request failed, creating optimistic message:", err);
    return {
      id: `msg-${Date.now()}`,
      conversationId: targetId,
      senderId: "current-user",
      senderRole: "CUSTOMER",
      content: text,
      text: text,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
    if (resolvedUrl && resolvedUrl.startsWith("/uploads/")) {
      resolvedUrl = `http://localhost:4000${resolvedUrl}`;
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
        if (audioUrl && audioUrl.startsWith("/uploads/")) {
          audioUrl = `http://localhost:4000${audioUrl}`;
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
    if (audioUrl && audioUrl.startsWith("/uploads/")) {
      audioUrl = `http://localhost:4000${audioUrl}`;
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

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Builds an audible synthetic speech-like WAV array buffer
 */
function buildSampleWavBuffer(durationSeconds = 3): ArrayBuffer {
  const sampleRate = 8000;
  const numChannels = 1;
  const safeDuration = Math.max(1, Math.min(30, durationSeconds));
  const numSamples = Math.floor(sampleRate * safeDuration);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(view, 8, "WAVE");

  // fmt subchunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true); // 16-bit

  // data subchunk
  writeString(view, 36, "data");
  view.setUint32(40, numSamples * 2, true);

  // Generates speech-like harmonic vocal tone with natural conversational syllable rhythm
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Conversational syllable envelope (~3-4 syllables per second)
    const syllable = Math.pow(Math.max(0, Math.sin(2 * Math.PI * 3.5 * t)), 2);
    const overallEnv = Math.sin((Math.PI * t) / safeDuration);
    const envelope = overallEnv * (0.3 + 0.7 * syllable);

    // Vocal tract harmonics (pitch ~185Hz fundamental, with 2nd and 3rd formants)
    const pitch = 185 + 25 * Math.sin(2 * Math.PI * 1.2 * t);
    const wave =
      0.55 * Math.sin(2 * Math.PI * pitch * t) +
      0.30 * Math.sin(2 * Math.PI * (pitch * 2) * t) +
      0.15 * Math.sin(2 * Math.PI * (pitch * 3) * t);

    const intSample = Math.max(-32768, Math.min(32767, Math.floor(wave * envelope * 22000)));
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return buffer;
}

/**
 * Generates an audible synthetic voice WAV audio blob as fallback
 */
export function createSampleVoiceBlob(durationSeconds = 3): Blob {
  const buffer = buildSampleWavBuffer(durationSeconds);
  return new Blob([buffer], { type: "audio/wav" });
}

/**
 * Generates an audible synthetic voice WAV data URL as fallback
 */
export function createSampleVoiceDataUrl(durationSeconds = 3): string {
  const buffer = buildSampleWavBuffer(durationSeconds);
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = typeof btoa !== "undefined" ? btoa(binary) : "";
  return `data:audio/wav;base64,${base64}`;
}
