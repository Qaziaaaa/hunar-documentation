"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import {
  ArrowLeft,
  CheckCheck,
  ChevronLeft,
  Phone,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { ChatInputBar } from "./chat-input-bar";
import { VoiceMessageBubble } from "./voice-message-bubble";
import { sendChatMessage, uploadChatImage } from "../api/chat-api";
import { MOCK_SCHEDULED_VISITS } from "@/features/customer-visits/data/mock-customer-visits";

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

export function CustomerChatView() {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const router = useRouter();

  // Active Job & Assigned Technician
  const activeVisit = MOCK_SCHEDULED_VISITS[0];
  const technician = activeVisit?.technician || {
    name: "Tariq Khan",
    nameUr: "طارق خان",
    avatarUrl:
      "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
    businessName: "Tariq Electrical Services",
    businessNameUr: "طارق الیکٹریکل سروسز",
    phone: "0300-1234567",
  };

  const defaultMessagesUrdu: ChatMessage[] = [
    {
      id: "m-1",
      sender: "technician",
      type: "text",
      text: "السلام علیکم! میں تشخیصی آلات لے کر یونیورسٹی روڈ سے آپ کی طرف روانہ ہو چکا ہوں۔",
      time: "10:30 AM",
    },
    {
      id: "m-2",
      sender: "customer",
      type: "text",
      text: "وعلیکم السلام۔ براہ کرم مکان نمبر 45 پہنچ کر مین گیٹ پر کال کریں۔",
      time: "10:32 AM",
    },
    {
      id: "m-3",
      sender: "technician",
      type: "voice",
      audioUrl: "https://actions.google.com/sounds/v1/speech/hello.ogg",
      durationSeconds: 12,
      time: "10:35 AM",
    },
    {
      id: "m-4",
      sender: "technician",
      type: "text",
      text: "جی ضرور، اسلامیہ کالج گیٹ کراس کر لیا ہے۔ تقریباً 10 منٹ میں پہنچ جاؤں گا۔",
      time: "10:36 AM",
    },
  ];

  const defaultMessagesEn: ChatMessage[] = [
    {
      id: "m-1",
      sender: "technician",
      type: "text",
      text: "Assalam o Alaikum! I am on my way via University Road with the diagnostic equipment.",
      time: "10:30 AM",
    },
    {
      id: "m-2",
      sender: "customer",
      type: "text",
      text: "Walaikum Assalam. Please call on gate when you reach House 45.",
      time: "10:32 AM",
    },
    {
      id: "m-3",
      sender: "technician",
      type: "voice",
      audioUrl: "https://actions.google.com/sounds/v1/speech/hello.ogg",
      durationSeconds: 12,
      time: "10:35 AM",
    },
    {
      id: "m-4",
      sender: "technician",
      type: "text",
      text: "Sure, passing Islamia College gate now. Will be there in ~10 mins.",
      time: "10:36 AM",
    },
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(
    isUrdu ? defaultMessagesUrdu : defaultMessagesEn
  );

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (text: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "customer",
      type: "text",
      text,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMsg]);

    sendChatMessage(activeVisit?.jobId || "job-1", text).catch(() => {});

    // Simulated reply
    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "technician",
        type: "text",
        text: isUrdu ? "شکریہ! موصول ہو گیا۔" : "Thank you, received!",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, replyMsg]);
    }, 1500);
  };

  const handleSendVoiceNote = (audioUrl: string, durationSeconds: number) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "customer",
      type: "voice",
      audioUrl,
      durationSeconds,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMsg]);

    sendChatMessage(
      activeVisit?.jobId || "job-1",
      `[Voice Note: ${durationSeconds}s]`
    ).catch(() => {});
  };

  const handleSendImage = async (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "customer",
      type: "image",
      imageUrl: previewUrl,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMsg]);

    try {
      await uploadChatImage(file);
    } catch {}
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/customer/dashboard");
    }
  };

  return (
    <div className="w-full h-[100dvh] md:h-[calc(100vh-64px)] flex flex-col bg-white overflow-hidden select-none">
      <div className="flex-1 flex flex-col overflow-hidden w-full max-w-4xl mx-auto md:my-2 md:rounded-2xl md:border md:border-slate-200 md:shadow-md min-h-0 bg-[#F8FAFC]">
        {/* ========================================================= */}
        {/* 1. WHATSAPP TOP APP BAR (Fixed with Back Arrow)           */}
        {/* ========================================================= */}
        <div className="p-3 sm:p-3.5 bg-[#123B5D] text-white flex items-center justify-between gap-3 shrink-0 shadow-xs z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Back Button -> Navigates directly back to the active job screen */}
            <button
              type="button"
              onClick={handleGoBack}
              className="p-1.5 -ml-1 rtl:-ml-0 rtl:-mr-1 rounded-full hover:bg-white/15 text-white transition-colors cursor-pointer"
              title={isUrdu ? "واپس جائیں" : "Go Back"}
            >
              <ArrowLeft className="size-5 rtl:rotate-180" />
            </button>

            {/* Assigned Technician Avatar */}
            <div className="relative size-10 rounded-full overflow-hidden border-2 border-white shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={technician.avatarUrl}
                alt={technician.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 right-0 rtl:right-auto rtl:left-0 size-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
            </div>

            {/* Technician Info */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {isUrdu
                    ? (technician.nameUr ?? technician.name)
                    : technician.name}
                </h3>
                <ShieldCheck className="size-3.5 text-teal-300 shrink-0" />
              </div>
              <span className="text-[11px] text-teal-200 truncate block">
                {isUrdu
                  ? (activeVisit?.jobTitleUr ?? "ماہر کاریگر")
                  : (activeVisit?.jobTitle ?? "Assigned Pro")}{" "}
                • <span className="text-emerald-300 font-semibold">{isUrdu ? "آن لائن" : "Online"}</span>
              </span>
            </div>
          </div>

          {/* Call Button */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`tel:${technician.phone}`}
              className="size-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title={isUrdu ? "کال کریں " : "Call "}
            >
              <Phone className="size-4" />
            </a>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. SCROLLABLE MESSAGE FEED (Middle Chat Container)        */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 min-h-0 bg-[#F8FAFC]">
          {/* Active Job Context Pill */}
          <div className="flex justify-center my-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white border border-slate-200 text-[#123B5D] shadow-2xs">
              <Wrench className="size-3 text-[#0F766E]" />
              <span>
                {isUrdu
                  ? `فعال جاب: ${activeVisit?.jobTitleUr ?? activeVisit?.jobTitle ?? "پنکھے کی تنصیب"}`
                  : `Active Job: ${activeVisit?.jobTitle ?? "Ceiling Fan Repair"}`}
              </span>
            </div>
          </div>

          {/* Message List */}
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
                  <div className="max-w-[75%] sm:max-w-[60%] rounded-2xl overflow-hidden border border-slate-200 shadow-2xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={msg.imageUrl}
                      alt="Attachment"
                      className="w-full h-auto object-cover max-h-64"
                    />
                  </div>
                ) : (
                  <div
                    className={`max-w-[82%] sm:max-w-[70%] px-3.5 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
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
                  {isCustomer && (
                    <CheckCheck className="size-3 text-[#0F766E]" />
                  )}
                </span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* ========================================================= */}
        {/* 3. FIXED BOTTOM INPUT BAR (Write Text + Record Voice)     */}
        {/* ========================================================= */}
        <div className="shrink-0 bg-white border-t border-slate-200">
          <ChatInputBar
            onSendMessage={handleSendMessage}
            onSendVoiceNote={handleSendVoiceNote}
            onSendImage={handleSendImage}
          />
        </div>
      </div>
    </div>
  );
}
