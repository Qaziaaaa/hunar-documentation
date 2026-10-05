"use client";

import { useLocale } from "next-intl";
import { useState, useEffect } from "react";
import { Check, CheckCheck, User, X, Phone, ShieldCheck } from "lucide-react";
import { sendChatMessage, uploadChatImage, getMessagesByJob, parseVoiceNote, encodeVoiceNote, uploadVoiceNote } from "@/features/chat/api/chat-api";
import { joinConversationRoom, subscribeToMessages } from "@/services/worker/chat.service";
import { isMockMode } from "@/lib/data-source";
import { getStoredUser } from "@/lib/api-client";
import { ChatInputBar } from "@/features/chat/components/chat-input-bar";
import { VoiceMessageBubble } from "@/features/chat/components/voice-message-bubble";
import type { ScheduledVisit } from "../types";

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
}

export function QuickChatDrawer({ visit, isOpen, onClose }: QuickChatDrawerProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  const defaultMessagesUrdu: ChatMessage[] = [
    {
      id: "m-1",
      sender: "technician",
      type: "text",
      text: "السلام علیکم! میں تشخیصی آلات لے کر یونیورسٹی روڈ سے آپ کی طرف روانہ ہو چکا ہوں۔",
      time: "10 منٹ پہلے",
    },
    {
      id: "m-2",
      sender: "customer",
      type: "text",
      text: "وعلیکم السلام۔ براہ کرم مکان نمبر 45 پہنچ کر مین گیٹ پر کال کریں۔",
      time: "8 منٹ پہلے",
    },
    {
      id: "m-3",
      sender: "customer",
      type: "voice",
      audioUrl: "https://actions.google.com/sounds/v1/speech/hello.ogg",
      durationSeconds: 14,
      time: "2 منٹ پہلے",
    },
  ];

  const defaultMessagesEn: ChatMessage[] = [
    {
      id: "m-1",
      sender: "technician",
      type: "text",
      text: "Assalam o Alaikum! I am on my way via University Road with diagnostic tools.",
      time: "10 mins ago",
    },
    {
      id: "m-2",
      sender: "customer",
      type: "text",
      text: "Walaikum Assalam. Please call on gate when you reach House 45.",
      time: "8 mins ago",
    },
    {
      id: "m-3",
      sender: "customer",
      type: "voice",
      audioUrl: "https://actions.google.com/sounds/v1/speech/hello.ogg",
      durationSeconds: 14,
      time: "2 mins ago",
    },
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(
    isUrdu ? defaultMessagesUrdu : defaultMessagesEn
  );

  // Load real messages for visit when drawer opens
  useEffect(() => {
    if (!isOpen || !visit?.jobId) return;
    let isCancelled = false;

    // Immediately join the job room so real-time socket events flow immediately
    joinConversationRoom(visit.jobId);

    getMessagesByJob(visit.jobId)
      .then((backendMsgs) => {
        if (isCancelled || !backendMsgs || backendMsgs.length === 0) return;
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
            time: new Date(m.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            createdAt: m.createdAt,
          };
        });
        setMessages(formatted);
        if (backendMsgs[0]?.conversationId) {
          joinConversationRoom(backendMsgs[0].conversationId);
        }
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [isOpen, visit?.jobId]);

  // Real-time socket listener for incoming messages
  useEffect(() => {
    if (!isOpen || !visit?.jobId) return;
    const unsubscribe = subscribeToMessages((msg) => {
      const currentUserId = getStoredUser()?.id;
      const isFromMe = currentUserId ? msg.senderId === currentUserId : msg.senderRole === "customer";
      const voice = parseVoiceNote(msg.text || (msg as any).content);
      const msgType: "text" | "voice" | "image" = voice ? "voice" : msg.imageUrl ? "image" : "text";

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
          time: new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          createdAt: msg.createdAt,
        };
        return [...prev, newMsg];
      });
    });
    return () => {
      unsubscribe();
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
      time: isUrdu ? "ابھی" : "Just now",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);

    sendChatMessage(visit.jobId, messageText, { isJobId: true })
      .then((sent) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, id: sent.id, messageId: sent.id } : m))
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
    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: "customer",
      type: "image",
      imageUrl: previewUrl,
      time: isUrdu ? "ابھی" : "Just now",
    };

    setMessages((prev) => [...prev, newMsg]);

    uploadChatImage(file)
      .then((res) => {
        if (res?.key) {
          sendChatMessage(visit.jobId, "", { isJobId: true, imageKey: res.key });
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
            <div className="relative size-10 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={visit.technician.avatarUrl}
                alt={visit.technician.name}
                className="w-full h-full object-cover"
              />
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
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/30">
          {messages.map((msg) => {
            const isCustomer = msg.sender === "customer";
            return (
              <div
                key={msg.id}
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
                  {isCustomer && <CheckCheck className="size-3.5 text-teal-300" />}
                </div>
              </div>
            );
          })}
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
