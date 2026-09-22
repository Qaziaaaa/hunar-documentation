"use client";

import { useLocale } from "next-intl";
import { useState } from "react";
import { Check, CheckCheck, User, X, Phone, ShieldCheck } from "lucide-react";
import { sendChatMessage, uploadChatImage } from "@/features/chat/api/chat-api";
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
  sender: "customer" | "technician";
  type?: "text" | "voice" | "image";
  text?: string;
  audioUrl?: string;
  durationSeconds?: number;
  imageUrl?: string;
  time: string;
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
      sender: "technician",
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
      sender: "technician",
      type: "voice",
      audioUrl: "https://actions.google.com/sounds/v1/speech/hello.ogg",
      durationSeconds: 14,
      time: "2 mins ago",
    },
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(
    isUrdu ? defaultMessagesUrdu : defaultMessagesEn
  );

  if (!isOpen || !visit) return null;

  const handleSendTextMessage = (messageText: string) => {
    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: "customer",
      type: "text",
      text: messageText,
      time: isUrdu ? "ابھی" : "Just now",
    };

    setMessages((prev) => [...prev, newMsg]);

    sendChatMessage(visit.jobId, messageText).catch((err) => {
      console.warn("sendChatMessage fallback:", err);
    });

    // Simulated technician response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now() + 1}`,
          sender: "technician",
          type: "text",
          text: isUrdu ? "موصول ہو گیا! میں پہنچ رہا ہوں۔" : "Received! Almost there.",
          time: isUrdu ? "ابھی" : "Just now",
        },
      ]);
    }, 1500);
  };

  const handleSendVoiceNote = (audioUrl: string, durationSeconds: number) => {
    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: "customer",
      type: "voice",
      audioUrl,
      durationSeconds,
      time: isUrdu ? "ابھی" : "Just now",
    };

    setMessages((prev) => [...prev, newMsg]);

    sendChatMessage(visit.jobId, `[Voice Note: ${durationSeconds}s]`).catch((err) => {
      console.warn("sendChatMessage voice fallback:", err);
    });

    // Simulated technician voice reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now() + 1}`,
          sender: "technician",
          type: "voice",
          audioUrl: "https://actions.google.com/sounds/v1/speech/hello.ogg",
          durationSeconds: 8,
          time: isUrdu ? "ابھی" : "Just now",
        },
      ]);
    }, 2000);
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

    try {
      await uploadChatImage(file);
    } catch (err) {
      console.warn("uploadChatImage fallback:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end rtl:justify-start animate-in fade-in-50 duration-200">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right rtl:slide-in-from-left duration-300">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-[#123B5D] text-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative size-10 rounded-full overflow-hidden border-2 border-white shrink-0">
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
                <h4 className="text-sm font-bold truncate">{visit.technician.name}</h4>
                <ShieldCheck className="size-3.5 text-teal-300 shrink-0" />
              </div>
              <p className="text-[10.5px] text-teal-200 truncate">
                {visit.technician.businessName} • {isUrdu ? "آن لائن / لائیو" : "Online / Live"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`tel:${visit.technician.phone}`}
              className="size-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
              title={isUrdu ? "کال کریں" : "Call"}
            >
              <Phone className="size-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="size-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-white"
            >
              <X className="size-4.5" />
            </button>
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50">
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
                        ? "bg-[#0F766E] text-white rounded-br-xs rtl:rounded-br-2xl rtl:rounded-bl-xs"
                        : "bg-white text-[#123B5D] border border-slate-200 rounded-bl-xs rtl:rounded-bl-2xl rtl:rounded-br-xs"
                    }`}
                  >
                    <p>{msg.text}</p>
                  </div>
                )}

                <span className="text-[10px] text-slate-400 mt-1 px-1 flex items-center gap-1">
                  <span>{msg.time}</span>
                  {isCustomer && <CheckCheck className="size-3 text-[#0F766E]" />}
                </span>
              </div>
            );
          })}
        </div>

        {/* Rich Input Bar (Text Typing + Voice Recording) */}
        <ChatInputBar
          onSendMessage={handleSendTextMessage}
          onSendVoiceNote={handleSendVoiceNote}
          onSendImage={handleSendImage}
        />
      </div>
    </div>
  );
}
