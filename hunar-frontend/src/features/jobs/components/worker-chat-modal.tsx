"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useLocale } from "next-intl";
import {
  X,
  Phone,
  Check,
  CheckCheck,
  Loader2,
  ShieldCheck,
  ArrowLeft,
  MapPin,
  Sparkles,
} from "lucide-react";
import { JobRequest } from "@/types/job";
import { ChatInputBar } from "@/features/chat/components/chat-input-bar";
import { VoiceMessageBubble } from "@/features/chat/components/voice-message-bubble";
import { sendChatMessage, getMessagesByJob, uploadChatImage, parseVoiceNote, encodeVoiceNote, uploadVoiceNote, storeVoiceInCache, blobToBase64 } from "@/features/chat/api/chat-api";
import { joinConversationRoom, subscribeToMessages, markConversationRead, subscribeToReadReceipts } from "@/services/worker/chat.service";
import { getStoredUser } from "@/lib/api-client";

// Module-level in-memory cache so reopening a chat loads instantly in 0ms
const workerChatCache: Record<string, ChatMessage[]> = {};

interface WorkerChatModalProps {
  job: JobRequest;
  isOpen: boolean;
  onClose: () => void;
  onCallCustomer?: () => void;
}

interface ChatMessage {
  id: string;
  messageId?: string;
  sender: "worker" | "customer";
  senderId?: string;
  receiverId?: string;
  jobId?: string;
  messageType?: "text" | "voice" | "image";
  type?: "text" | "voice" | "image";
  text?: string;
  audioUrl?: string;
  durationSeconds?: number;
  imageUrl?: string;
  createdAt?: string;
  isRead?: boolean;
  time: string;
}

export function WorkerChatModal({
  job,
  isOpen,
  onClose,
  onCallCustomer,
}: WorkerChatModalProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return job?.id && workerChatCache[job.id] ? workerChatCache[job.id] : [];
  });
  const [isLoading, setIsLoading] = useState(false);

  // Deduplicate messages by id or messageId so duplicate server/socket broadcasts never collide
  const uniqueMessages = useMemo(() => {
    const seen = new Set<string>();
    const list: ChatMessage[] = [];
    for (const m of messages) {
      const key = m.id || m.messageId;
      if (key && seen.has(key)) {
        continue;
      }
      if (key) {
        seen.add(key);
      }
      list.push(m);
    }
    return list;
  }, [messages]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, uniqueMessages]);

  // Load real messages for job when modal opens
  useEffect(() => {
    if (!isOpen || !job?.id) {
      return;
    }
    let isCancelled = false;

    // Fast-path: if we already have cached messages, display them immediately in 0ms!
    if (workerChatCache[job.id]?.length) {
      setMessages(workerChatCache[job.id]);
      setIsLoading(false);
    } else {
      setMessages([]);
      setIsLoading(true);
    }

    // Immediately join the job room so real-time socket events flow immediately
    joinConversationRoom(job.id);
    void markConversationRead(job.id);

    getMessagesByJob(job.id)
      .then((backendMsgs) => {
        if (isCancelled) return;
        setIsLoading(false);
        if (!backendMsgs || backendMsgs.length === 0) {
          workerChatCache[job.id] = [];
          setMessages([]);
          return;
        }
        const currentUserId = getStoredUser()?.id;
        const formatted: ChatMessage[] = backendMsgs.map((m) => {
          const isFromMe = currentUserId ? m.senderId === currentUserId : String(m.senderRole || "").toUpperCase() === "WORKER";
          const voice = parseVoiceNote(m.text || m.content);
          const msgType: "text" | "voice" | "image" = voice ? "voice" : m.imageUrl ? "image" : "text";
          return {
            id: m.id,
            messageId: m.id,
            sender: isFromMe ? "worker" : "customer",
            senderId: m.senderId,
            receiverId: m.receiverId,
            jobId: m.jobId || job.id,
            messageType: msgType,
            type: msgType,
            text: voice ? undefined : (m.text || m.content),
            audioUrl: voice?.audioUrl,
            durationSeconds: voice?.durationSeconds,
            imageUrl: m.imageUrl,
            createdAt: m.createdAt,
            isRead: Boolean(m.isRead),
            time: new Date(m.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
        });

        // Deduplicate any repeated IDs from backend
        const seenIds = new Set<string>();
        const uniqueFormatted = formatted.filter((m) => {
          const key = m.id || m.messageId;
          if (key && seenIds.has(key)) return false;
          if (key) seenIds.add(key);
          return true;
        });

        workerChatCache[job.id] = uniqueFormatted;
        setMessages(uniqueFormatted);
        if (backendMsgs[0]?.conversationId) {
          joinConversationRoom(backendMsgs[0].conversationId);
          void markConversationRead(backendMsgs[0].conversationId);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setIsLoading(false);
          setMessages(workerChatCache[job.id] || []);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, job?.id]);

  // Real-time socket listener for incoming messages
  useEffect(() => {
    if (!isOpen || !job?.id) return;
    const unsubscribe = subscribeToMessages((msg) => {
      // STRICT JOB ISOLATION: ignore messages from any other job
      if (msg.jobId && msg.jobId !== job.id) return;

      const currentUserId = getStoredUser()?.id;
      const roleStr = String(msg.senderRole || "").toLowerCase();
      const isFromMe = currentUserId ? msg.senderId === currentUserId : roleStr === "worker";

      // If from customer while modal is open, mark as read immediately
      if (!isFromMe) {
        void markConversationRead(job.id);
      }

      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id || (m.messageId && m.messageId === msg.id))) return prev;

        const voice = parseVoiceNote(msg.text || (msg as any).content);
        const msgType: "text" | "voice" | "image" = voice ? "voice" : msg.imageUrl ? "image" : "text";

        // If from me, it's already shown optimistically. Reconcile temporary message if present.
        if (isFromMe) {
          const tempIndex = prev.findIndex(
            (m) =>
              (m.id.startsWith("wm-") || (m.messageId && m.messageId.startsWith("wm-"))) &&
              (m.text?.trim() === msg.text?.trim() || (m.type === "voice" && voice))
          );
          if (tempIndex !== -1) {
            const copy = [...prev];
            copy[tempIndex] = {
              ...copy[tempIndex],
              id: msg.id,
              messageId: msg.id,
              senderId: msg.senderId || copy[tempIndex].senderId,
              receiverId: msg.receiverId || copy[tempIndex].receiverId,
              audioUrl: voice?.audioUrl || copy[tempIndex].audioUrl,
              durationSeconds: voice?.durationSeconds || copy[tempIndex].durationSeconds,
              messageType: msgType,
              isRead: Boolean(msg.isRead),
            };
            return copy;
          }
          return prev;
        }

        // It is from the customer!
        const newMsg: ChatMessage = {
          id: msg.id,
          messageId: msg.id,
          sender: "customer",
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          jobId: msg.jobId || job.id,
          messageType: msgType,
          type: msgType,
          text: voice ? undefined : msg.text,
          audioUrl: voice?.audioUrl,
          durationSeconds: voice?.durationSeconds,
          imageUrl: msg.imageUrl,
          createdAt: msg.createdAt,
          isRead: true, // Worker is viewing the chat modal right now
          time: new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        return [...prev, newMsg];
      });
    });

    // Real-time socket listener for read receipts (updates single tick to double tick)
    const unsubscribeRead = subscribeToReadReceipts((receipt) => {
      const currentUserId = getStoredUser()?.id;
      // Do not mark worker's own sent messages as read when own client triggers read receipt
      if (receipt.readerId && currentUserId && receipt.readerId === currentUserId) {
        return;
      }

      const isThisJob =
        (receipt.jobId && receipt.jobId === job.id) ||
        (receipt.conversationId && (receipt.conversationId === job.id || (job as any).conversationId === receipt.conversationId));

      if (isThisJob) {
        setMessages((prev) =>
          prev.map((m) => (m.sender === "worker" ? { ...m, isRead: true } : m))
        );
      }
    });

    return () => {
      unsubscribe();
      unsubscribeRead();
    };
  }, [isOpen, job?.id]);

  if (!isOpen) return null;

  const handleSendTextMessage = (messageText: string) => {
    const currentUserId = getStoredUser()?.id;
    const tempId = `wm-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: tempId,
      messageId: tempId,
      sender: "worker",
      senderId: currentUserId,
      receiverId: (job as any).customerId,
      jobId: job.id,
      messageType: "text",
      type: "text",
      text: messageText,
      isRead: false,
      time: isUrdu ? "ابھی" : "Just now",
    };

    setMessages((prev) => [...prev, newMsg]);

    sendChatMessage(job.id, messageText, { isJobId: true })
      .then((sent) => {
        setMessages((prev) => {
          const alreadyExists = prev.some((m) => m.id === sent.id || m.messageId === sent.id);
          if (alreadyExists) {
            return prev.filter((m) => m.id !== tempId);
          }
          return prev.map((m) =>
            m.id === tempId
              ? {
                  ...m,
                  id: sent.id,
                  messageId: sent.id,
                  isRead: Boolean(sent.isRead),
                }
              : m
          );
        });
        if (sent.conversationId) {
          joinConversationRoom(sent.conversationId);
        }
      })
      .catch((err) => {
        console.warn("sendChatMessage error fallback:", err);
      });
  };

  const handleSendVoiceNote = async (audioUrl: string, durationSeconds: number) => {
    const currentUserId = getStoredUser()?.id;
    const receiverId = (job as any).customerId;
    const tempId = `wm-${Date.now()}`;
    const voiceId = `vn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Upload recorded audio file to server storage to get persistent URL
    let remoteAudioUrl = "";
    if (audioUrl.startsWith("blob:") || audioUrl.startsWith("data:")) {
      try {
        const blob = await fetch(audioUrl).then((r) => r.blob());
        const uploaded = await uploadVoiceNote(blob);
        if (uploaded?.url) {
          remoteAudioUrl = uploaded.url;
        }
      } catch (err) {
        console.warn("Failed to upload audio to backend, using local audio:", err);
      }
    } else {
      remoteAudioUrl = audioUrl;
    }

    const effectiveAudioUrl = remoteAudioUrl || audioUrl;

    const newMsg: ChatMessage = {
      id: tempId,
      messageId: tempId,
      sender: "worker",
      senderId: currentUserId,
      receiverId: receiverId,
      jobId: job.id,
      messageType: "voice",
      type: "voice",
      audioUrl: effectiveAudioUrl,
      durationSeconds,
      isRead: false,
      time: isUrdu ? "ابھی" : "Just now",
    };

    setMessages((prev) => [...prev, newMsg]);

    const payloadText = encodeVoiceNote(effectiveAudioUrl, durationSeconds, {
      voiceId,
      jobId: job.id,
      senderId: currentUserId,
      receiverId: receiverId,
    });

    sendChatMessage(job.id, payloadText, { isJobId: true })
      .then((sent) => {
        setMessages((prev) => {
          const alreadyExists = prev.some((m) => m.id === sent.id || m.messageId === sent.id);
          if (alreadyExists) {
            return prev.filter((m) => m.id !== tempId);
          }
          return prev.map((m) =>
            m.id === tempId
              ? {
                  ...m,
                  id: sent.id,
                  messageId: sent.id,
                  audioUrl: effectiveAudioUrl,
                  isRead: Boolean(sent.isRead),
                }
              : m
          );
        });
        if (sent.conversationId) {
          joinConversationRoom(sent.conversationId);
        }
      })
      .catch((err) => {
        console.warn("sendChatMessage voice fallback:", err);
      });
  };

  const handleSendImage = (file: File) => {
    const tempUrl = URL.createObjectURL(file);
    const tempId = `wm-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: tempId,
      messageId: tempId,
      sender: "worker",
      type: "image",
      imageUrl: tempUrl,
      isRead: false,
      time: isUrdu ? "ابھی" : "Just now",
    };

    setMessages((prev) => [...prev, newMsg]);

    uploadChatImage(file)
      .then((res) => {
        if (res?.key) {
          sendChatMessage(job.id, "", { isJobId: true, imageKey: res.key })
            .then((sent) => {
              setMessages((prev) => {
                const alreadyExists = prev.some((m) => m.id === sent.id || m.messageId === sent.id);
                if (alreadyExists) {
                  return prev.filter((m) => m.id !== tempId);
                }
                return prev.map((m) =>
                  m.id === tempId ? { ...m, id: sent.id, messageId: sent.id } : m
                );
              });
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  };

  const workerQuickSuggestions = isUrdu
    ? [
        "میں دہلیز پر پہنچ گیا ہوں",
        "برائے مہربانی ڈور اسٹیپ پن بتائیں",
        "5 منٹ میں پہنچ رہا ہوں",
        "کیا مین بریکر پینل کھلا ہے؟",
      ]
    : [
        "I have arrived at your doorstep",
        "Please confirm doorstep PIN",
        "Arriving in ~5 minutes",
        "Is the breaker box accessible?",
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs lg:p-6 xl:p-8 animate-in fade-in">
      <div className="w-full h-full lg:h-[88vh] lg:max-w-3xl xl:max-w-4xl bg-white lg:rounded-3xl lg:border lg:border-slate-200 lg:shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
        {/* ======================================================== */}
        {/* CHAT STREAM & INPUT BAR */}
        {/* ======================================================== */}
        <div className="flex-1 flex flex-col h-full bg-white min-w-0">
          {/* 1. CHAT TOP HEADER BAR */}
          <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 py-3 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 -ml-1 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close chat"
              >
                <ArrowLeft className="size-5" />
              </button>

              {/* Customer Avatar & Status */}
              <div className="relative">
                <div className="size-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-xs text-[#123B5D]">
                  {job.customer.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={job.customer.avatarUrl}
                      alt={job.customer.name}
                      loading="lazy"
                      decoding="async"
                      className="size-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : null}
                  {(!job.customer.avatarUrl) && (
                    job.customer.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>

              <div className="min-w-0 leading-tight">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-slate-900 text-sm truncate">
                    {job.customer.name}
                  </h3>
                  <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
                  <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                    Online
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                  <MapPin className="size-3 text-[#0F8B8D] shrink-0" />
                  <span>{job.location.area}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-400">Order #{job.id}</span>
                </p>
              </div>
            </div>

            {/* Action Buttons: Direct Call & Close */}
            <div className="flex items-center gap-2 shrink-0">
              {onCallCustomer && (
                <button
                  type="button"
                  onClick={onCallCustomer}
                  className="size-9 rounded-full bg-success/10 text-success hover:bg-success hover:text-white border border-success/20 shadow-2xs flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                  title="Call Customer"
                >
                  <Phone className="size-4 stroke-[2.2]" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="size-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X className="size-4" />
              </button>
            </div>
          </header>

          {/* Safety & Job Notice Banner */}
          <div className="bg-teal-50/70 border-b border-teal-100 px-4 py-2 flex items-center justify-between text-xs text-slate-600">
            <span className="font-bold text-[#0F8B8D] truncate">
              {job.title}
            </span>
            <span className="text-[11px] text-slate-500 shrink-0 font-medium hidden sm:inline">
              End-to-End Encrypted Customer Support
            </span>
          </div>

          {/* 2. MESSAGES FEED */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 space-y-4 bg-slate-50/30">
            {isLoading && uniqueMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[220px] text-center p-6 space-y-3">
                <Loader2 className="size-8 text-[#0F8B8D] animate-spin" />
                <p className="text-xs font-semibold text-slate-500">
                  {isUrdu ? "پیغامات لوڈ ہو رہے ہیں..." : "Loading messages..."}
                </p>
              </div>
            ) : uniqueMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[220px] text-center p-6 space-y-2">
                <div className="size-12 rounded-2xl bg-teal-50 border border-teal-200 text-[#0F8B8D] flex items-center justify-center">
                  <Sparkles className="size-6 text-[#0F8B8D]" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  {isUrdu ? "کوئی پرانا پیغام نہیں ہے" : "No messages yet"}
                </h4>
                <p className="text-xs text-slate-500 max-w-xs">
                  {isUrdu
                    ? "کسٹمر سے رابطہ شروع کرنے کے لیے نیچے پیغام یا وائس نوٹ بھیجیں۔"
                    : "Send a message or voice note below to start coordinating with the customer."}
                </p>
              </div>
            ) : (
              uniqueMessages.map((msg, idx) => {
              const isMe = msg.sender === "worker";
              const itemKey = msg.id ? `${msg.id}-${idx}` : `msg-${idx}`;

              if (msg.type === "voice") {
                return (
                  <div
                    key={itemKey}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <VoiceMessageBubble
                      audioUrl={msg.audioUrl}
                      durationSeconds={msg.durationSeconds}
                      isSender={isMe}
                    />
                    <div
                      className={`flex items-center gap-1 mt-1 justify-end text-[10px] text-slate-400`}
                    >
                      <span>{msg.time}</span>
                      {isMe && (
                        msg.isRead ? (
                          <CheckCheck className="size-3.5 text-[#0F8B8D]" aria-label="Read" />
                        ) : (
                          <Check className="size-3.5 text-slate-400" aria-label="Sent" />
                        )
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={itemKey}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 shadow-2xs ${
                      isMe
                        ? "bg-[#123B5D] text-white rounded-br-xs"
                        : "bg-white text-slate-900 border border-slate-200/90 rounded-bl-xs"
                    }`}
                  >
                    {/* Photo Message */}
                    {msg.type === "image" && msg.imageUrl && (
                      <div className="rounded-xl overflow-hidden border border-black/10 my-1 max-w-[260px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={msg.imageUrl}
                          alt="Shared photo"
                          loading="lazy"
                          decoding="async"
                          className="w-full object-cover max-h-64"
                        />
                      </div>
                    )}

                    {/* Text Message */}
                    {msg.text && (
                      <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.text}
                      </p>
                    )}

                    {/* Timestamp & Read Tick */}
                    <div
                      className={`flex items-center gap-1 mt-1.5 justify-end text-[10px] ${
                        isMe ? "text-slate-300" : "text-slate-400"
                      }`}
                    >
                      <span>{msg.time}</span>
                      {isMe && (
                        msg.isRead ? (
                          <CheckCheck className="size-3.5 text-teal-300" aria-label="Read" />
                        ) : (
                          <Check className="size-3.5 text-slate-300" aria-label="Sent" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
          </div>

          {/* 3. CHAT INPUT BAR WITH PRESETS */}
          <div className="sticky bottom-0 bg-white border-t border-slate-200/90 shadow-lg">
            <ChatInputBar
              onSendMessage={handleSendTextMessage}
              onSendVoiceNote={handleSendVoiceNote}
              onSendImage={handleSendImage}
              quickSuggestions={workerQuickSuggestions}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
