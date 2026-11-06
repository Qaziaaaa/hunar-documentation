"use client";

import { useLocale } from "next-intl";
import { useState, useEffect } from "react";
import { Check, CheckCheck, Loader2, User, X, Phone, ShieldCheck } from "lucide-react";
import { sendChatMessage, uploadChatImage, getMessagesByJob, parseVoiceNote, encodeVoiceNote, uploadVoiceNote } from "@/features/chat/api/chat-api";
import { joinConversationRoom, subscribeToMessages, markConversationRead, subscribeToReadReceipts } from "@/services/worker/chat.service";
import { getStoredUser } from "@/lib/api-client";
import { ChatInputBar } from "@/features/chat/components/chat-input-bar";
import { VoiceMessageBubble } from "@/features/chat/components/voice-message-bubble";
import type { ScheduledVisit } from "../types";

// Module-level in-memory cache so reopening quick chat loads instantly in 0ms
const quickChatCache: Record<string, ChatMessage[]> = {};

interface QuickChatDrawerProps {
  visit: ScheduledVisit | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  messageId?: string;
  senderId?: string;
  receiverId?: string;
  jobId?: string;
  sender: "customer" | "technician";
  type?: "text" | "voice" | "image";
  messageType?: "text" | "voice" | "image";
  text?: string;
  audioUrl?: string;
  durationSeconds?: number;
  imageUrl?: string;
  time: string;
  createdAt?: string;
  isRead?: boolean;
}

export function QuickChatDrawer({ visit, isOpen, onClose }: QuickChatDrawerProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return visit?.jobId && quickChatCache[visit.jobId] ? quickChatCache[visit.jobId] : [];
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load real messages for visit when drawer opens
  useEffect(() => {
    if (!isOpen || !visit?.jobId) {
      return;
    }
    let isCancelled = false;

    // Fast-path: if we already have cached messages, display them immediately in 0ms!
    if (quickChatCache[visit.jobId]?.length) {
      setMessages(quickChatCache[visit.jobId]);
      setIsLoading(false);
    } else {
      setMessages([]);
      setIsLoading(true);
    }

    // Immediately join the job room so real-time socket events flow immediately
    joinConversationRoom(visit.jobId);
    void markConversationRead(visit.jobId);

    getMessagesByJob(visit.jobId)
      .then((backendMsgs) => {
        if (isCancelled) return;
        setIsLoading(false);
        if (!backendMsgs || backendMsgs.length === 0) {
          quickChatCache[visit.jobId] = [];
          setMessages([]);
          return;
        }
        const currentUserId = getStoredUser()?.id;
        const formatted: ChatMessage[] = backendMsgs.map((m) => {
          const isFromMe = currentUserId ? m.senderId === currentUserId : m.senderRole === "CUSTOMER";
          const voice = parseVoiceNote(m.text || m.content);
          const msgType: "text" | "voice" | "image" = voice ? "voice" : m.imageUrl ? "image" : "text";
          return {
            id: m.id,
            messageId: m.id,
            senderId: m.senderId,
            receiverId: m.receiverId || voice?.receiverId,
            jobId: m.jobId || voice?.jobId || visit.jobId,
            sender: isFromMe ? "customer" : "technician",
            type: msgType,
            messageType: msgType,
            text: voice ? undefined : (m.text || m.content),
            audioUrl: voice?.audioUrl,
            durationSeconds: voice?.durationSeconds,
            imageUrl: m.imageUrl,
            isRead: Boolean(m.isRead),
            time: new Date(m.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            createdAt: m.createdAt,
          };
        });
        quickChatCache[visit.jobId] = formatted;
        setMessages(formatted);
        if (backendMsgs[0]?.conversationId) {
          joinConversationRoom(backendMsgs[0].conversationId);
          void markConversationRead(backendMsgs[0].conversationId);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setIsLoading(false);
          setMessages(quickChatCache[visit.jobId] || []);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, visit?.jobId]);

  // Real-time socket listener for incoming messages
  useEffect(() => {
    if (!isOpen || !visit?.jobId) return;
    const unsubscribe = subscribeToMessages((msg) => {
      // STRICT JOB ISOLATION: ignore messages not belonging to this job
      if (msg.jobId && msg.jobId !== visit.jobId) return;

      const currentUserId = getStoredUser()?.id;
      const isFromMe = currentUserId ? msg.senderId === currentUserId : msg.senderRole === "customer";
      const voice = parseVoiceNote(msg.text || (msg as any).content);
      const msgType: "text" | "voice" | "image" = voice ? "voice" : msg.imageUrl ? "image" : "text";

      // If from technician while drawer is open, mark as read immediately
      if (!isFromMe) {
        void markConversationRead(visit.jobId);
      }

      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;

        // If from me, reconcile temporary message
        if (isFromMe) {
          const tempIdx = prev.findIndex(
            (m) =>
              m.id.startsWith("m-") &&
              (m.text === msg.text || (m.type === "voice" && voice))
          );
          if (tempIdx !== -1) {
            const copy = [...prev];
            copy[tempIdx] = {
              ...copy[tempIdx],
              id: msg.id,
              messageId: msg.id,
              audioUrl: voice?.audioUrl || copy[tempIdx].audioUrl,
              isRead: Boolean(msg.isRead),
            };
            return copy;
          }
          return prev;
        }

        // It is from the technician!
        const newMsg: ChatMessage = {
          id: msg.id,
          messageId: msg.id,
          senderId: msg.senderId,
          receiverId: msg.receiverId || voice?.receiverId,
          jobId: msg.jobId || voice?.jobId || visit.jobId,
          sender: "technician",
          type: msgType,
          messageType: msgType,
          text: voice ? undefined : msg.text,
          audioUrl: voice?.audioUrl,
          durationSeconds: voice?.durationSeconds,
          imageUrl: msg.imageUrl,
          isRead: true, // Customer is currently viewing the drawer
          time: new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          createdAt: msg.createdAt,
        };
        return [...prev, newMsg];
      });
    });

    // Real-time socket listener for read receipts (updates single tick to double tick)
    const unsubscribeRead = subscribeToReadReceipts((receipt) => {
      const currentUserId = getStoredUser()?.id;
      // Do not mark customer's own sent messages as read when own client triggers read receipt
      if (receipt.readerId && currentUserId && receipt.readerId === currentUserId) {
        return;
      }

      const isThisJob =
        (receipt.jobId && receipt.jobId === visit.jobId) ||
        (receipt.conversationId && receipt.conversationId === visit.jobId);

      if (isThisJob) {
        setMessages((prev) =>
          prev.map((m) => (m.sender === "customer" ? { ...m, isRead: true } : m))
        );
      }
    });

    return () => {
      unsubscribe();
      unsubscribeRead();
    };
  }, [isOpen, visit?.jobId]);

  if (!isOpen || !visit) return null;

  const handleSendTextMessage = (messageText: string) => {
    const tempId = `m-${Date.now()}`;
    const currentUserId = getStoredUser()?.id;
    const workerId = visit.technician.id;

    const newMsg: ChatMessage = {
      id: tempId,
      messageId: tempId,
      senderId: currentUserId,
      receiverId: workerId,
      jobId: visit.jobId,
      sender: "customer",
      type: "text",
      messageType: "text",
      text: messageText,
      isRead: false,
      time: isUrdu ? "ابھی" : "Just now",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);

    sendChatMessage(visit.jobId, messageText, { isJobId: true })
      .then((sent) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  ...m,
                  id: sent.id,
                  messageId: sent.id,
                  isRead: Boolean(sent.isRead),
                }
              : m
          )
        );
        if (sent.conversationId) {
          joinConversationRoom(sent.conversationId);
        }
      })
      .catch((err) => {
        console.warn("sendChatMessage fallback:", err);
      });
  };

  const handleSendVoiceNote = async (audioUrl: string, durationSeconds: number) => {
    const tempId = `m-${Date.now()}`;
    const currentUserId = getStoredUser()?.id;
    const workerId = visit.technician.id;

    const optimisticMsg: ChatMessage = {
      id: tempId,
      messageId: tempId,
      senderId: currentUserId,
      receiverId: workerId,
      jobId: visit.jobId,
      sender: "customer",
      type: "voice",
      messageType: "voice",
      audioUrl,
      durationSeconds,
      isRead: false,
      time: isUrdu ? "ابھی" : "Just now",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      let serverAudioUrl = audioUrl;
      if (audioUrl.startsWith("blob:") || audioUrl.startsWith("data:")) {
        const blob = await fetch(audioUrl).then((r) => r.blob());
        const uploaded = await uploadVoiceNote(blob);
        if (uploaded?.url) {
          serverAudioUrl = uploaded.url;
        }
      }

      const payloadText = encodeVoiceNote(serverAudioUrl, durationSeconds, {
        jobId: visit.jobId,
        senderId: currentUserId,
        receiverId: workerId,
      });

      const sent = await sendChatMessage(visit.jobId, payloadText, { isJobId: true });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? {
                ...m,
                id: sent.id,
                messageId: sent.id,
                audioUrl: serverAudioUrl,
                isRead: Boolean(sent.isRead),
              }
            : m
        )
      );

      if (sent.conversationId) {
        joinConversationRoom(sent.conversationId);
      }
    } catch (err) {
      console.error("Failed to upload/send customer voice note:", err);
    }
  };

  const handleSendImage = async (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    const tempId = `m-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: tempId,
      messageId: tempId,
      sender: "customer",
      type: "image",
      imageUrl: previewUrl,
      isRead: false,
      time: isUrdu ? "ابھی" : "Just now",
    };

    setMessages((prev) => [...prev, newMsg]);

    uploadChatImage(file)
      .then((res) => {
        if (res?.key) {
          sendChatMessage(visit.jobId, "", { isJobId: true, imageKey: res.key })
            .then((sent) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === tempId
                    ? {
                        ...m,
                        id: sent.id,
                        messageId: sent.id,
                        isRead: Boolean(sent.isRead),
                      }
                    : m
                )
              );
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end rtl:justify-start animate-in fade-in-50 duration-200">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right rtl:slide-in-from-left duration-300">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200/90 flex items-center justify-between bg-white text-slate-900 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative size-10 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0 flex items-center justify-center font-bold text-slate-700">
              {visit.technician.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={visit.technician.avatarUrl}
                  alt={visit.technician.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(visit.technician.name || "Tech")}&background=0F766E&color=fff`;
                  }}
                />
              ) : (
                <span className="text-xs font-bold text-[#0F766E]">
                  {(visit.technician.name || "T").slice(0, 2).toUpperCase()}
                </span>
              )}
              <span className="absolute bottom-0 right-0 rtl:right-auto rtl:left-0 size-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-extrabold text-slate-900 truncate">{visit.technician.name}</h4>
                <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
              </div>
              <p className="text-[10.5px] text-slate-500 truncate flex items-center gap-1">
                <span>{visit.technician.businessName}</span>
                <span className="text-slate-300">·</span>
                <span className="text-emerald-700 font-semibold">{isUrdu ? "آن لائن" : "Online"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`tel:${visit.technician.phone}`}
              className="size-8 rounded-full bg-success/10 hover:bg-success text-success hover:text-white border border-success/20 flex items-center justify-center transition-colors cursor-pointer"
              title={isUrdu ? "کال کریں" : "Call"}
            >
              <Phone className="size-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="size-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Safety & Job Notice Banner */}
        <div className="bg-teal-50/70 border-b border-teal-100 px-4 py-2 flex items-center justify-between text-xs text-slate-600">
          <span className="font-bold text-[#0F8B8D] truncate">
            {isUrdu ? (visit.jobTitleUr ?? visit.jobTitle) : visit.jobTitle}
          </span>
          <span className="text-[10.5px] text-slate-500 font-medium">
            Order #{visit.jobId || visit.id}
          </span>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/30 scrollbar-none no-scrollbar">
          {isLoading && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[220px] text-center p-6 space-y-3">
              <Loader2 className="size-8 text-[#0F8B8D] animate-spin" />
              <p className="text-xs font-semibold text-slate-500">
                {isUrdu ? "پیغامات لوڈ ہو رہے ہیں..." : "Loading messages..."}
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[220px] text-center p-6 space-y-2">
              <div className="size-12 rounded-2xl bg-teal-50 border border-teal-200 text-[#0F8B8D] flex items-center justify-center">
                <ShieldCheck className="size-6 text-[#0F8B8D]" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                {isUrdu ? "کوئی پرانا پیغام نہیں ہے" : "No messages yet"}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs">
                {isUrdu
                  ? "کاریگر سے رابطہ شروع کرنے کے لیے نیچے پیغام یا وائس نوٹ بھیجیں۔"
                  : "Send a message or voice note below to coordinate with your technician."}
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isCustomer = msg.sender === "customer";
              const itemKey = msg.id ? `${msg.id}-${idx}` : `msg-${idx}`;
              return (
                <div
                  key={itemKey}
                  className={`flex flex-col ${
                    isCustomer
                      ? "items-end rtl:items-start"
                      : "items-start rtl:items-end"
                  }`}
                >
                  {msg.type === "voice" ? (
                    <VoiceMessageBubble
                      audioUrl={msg.audioUrl}
                      durationSeconds={msg.durationSeconds}
                      isSender={isCustomer}
                      variant="navy"
                    />
                  ) : msg.type === "image" && msg.imageUrl ? (
                    <div className="max-w-[75%] rounded-2xl overflow-hidden border border-slate-200 shadow-2xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={msg.imageUrl}
                        alt="Attachment"
                        className="w-full h-auto object-cover max-h-60"
                      />
                    </div>
                  ) : (
                    <div
                      className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                        isCustomer
                          ? "bg-[#123B5D] text-white rounded-br-xs rtl:rounded-br-2xl rtl:rounded-bl-xs"
                          : "bg-white text-slate-900 border border-slate-200/90 rounded-bl-xs rtl:rounded-bl-2xl rtl:rounded-br-xs"
                      }`}
                    >
                      <p>{msg.text}</p>
                    </div>
                  )}

                  <div
                    className={`flex items-center gap-1 mt-1 justify-end text-[10px] ${
                      isCustomer ? "text-slate-300" : "text-slate-400"
                    }`}
                  >
                    <span>{msg.time}</span>
                    {isCustomer && (
                      msg.isRead ? (
                        <CheckCheck className="size-3.5 text-teal-300" aria-label="Read" />
                      ) : (
                        <Check className="size-3.5 text-slate-300" aria-label="Sent" />
                      )
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rich Input Bar (Text Typing + Voice Recording) */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200/90 shadow-lg">
          <ChatInputBar
            onSendMessage={handleSendTextMessage}
            onSendVoiceNote={handleSendVoiceNote}
            onSendImage={handleSendImage}
          />
        </div>
      </div>
    </div>
  );
}
