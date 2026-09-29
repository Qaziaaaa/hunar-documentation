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
  MapPin,
  Sparkles,
} from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { ChatInputBar } from "./chat-input-bar";
import { VoiceMessageBubble } from "./voice-message-bubble";
import { sendChatMessage, uploadChatImage } from "../api/chat-api";
import { getCustomerVisits } from "@/features/customer-visits/api/customer-visits-api";
import { useQuery } from "@tanstack/react-query";

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
  const { data: visits } = useQuery({
    queryKey: ["customer", "visits"],
    queryFn: getCustomerVisits,
    staleTime: 30_000,
  });
  const activeVisit = (visits ?? [])[0];
  const technician = activeVisit?.technician || {
    name: "Technician",
    nameUr: "ٹیکنیشن",
    avatarUrl:
      "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
    businessName: "Orderworker Pro",
    businessNameUr: "آرڈر ورکر پرو",
    phone: "",
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
      sender: "customer",
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
      sender: "customer",
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

  const customerQuickSuggestions = isUrdu
    ? [
        "میں مین گیٹ پر موجود ہوں",
        "آپ کتنی دیر میں پہنچیں گے؟",
        "لوکیشن شیئر کر دی ہے",
        "کیا اضافی سامان کی ضرورت ہے؟",
      ]
    : [
        "I am waiting at the main gate",
        "How far are you?",
        "Location verified",
        "Do you need spare parts?",
      ];

  return (
    <div className="w-full h-[100dvh] md:h-[calc(100vh-64px)] flex flex-col bg-slate-100/60 lg:p-6 xl:p-8 overflow-hidden select-none">
      <div className="w-full h-full lg:max-w-5xl xl:max-w-6xl mx-auto bg-white lg:rounded-3xl lg:border lg:border-slate-200 lg:shadow-2xl overflow-hidden flex flex-col lg:flex-row relative">
        {/* ======================================================== */}
        {/* DESKTOP LEFT SIDEBAR: TECHNICIAN & JOB DETAILS PANE */}
        {/* ======================================================== */}
        <aside className="hidden lg:flex lg:w-[320px] xl:w-[360px] border-r border-slate-200 bg-slate-50/70 p-5 flex-col justify-between overflow-y-auto shrink-0">
          <div className="space-y-5">
            {/* Top Label */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isUrdu ? "کاریگر اور جاب کی تفصیل" : "Technician & Job Info"}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>ONLINE</span>
              </span>
            </div>

            {/* Technician Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3.5 shadow-2xs text-center">
              <div className="relative inline-block mx-auto">
                <div className="size-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-lg font-black text-[#123B5D] overflow-hidden shadow-2xs">
                  {technician.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={technician.avatarUrl}
                      alt={technician.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    technician.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 size-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>

              <div>
                <div className="flex items-center justify-center gap-1.5">
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    {isUrdu ? (technician.nameUr ?? technician.name) : technician.name}
                  </h4>
                  <ShieldCheck className="size-4 text-emerald-600" />
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  ⭐ {technician.rating || 4.9} ({technician.totalReviews || 18} reviews)
                </p>
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mt-1">
                  <MapPin className="size-3 text-[#0F8B8D]" />
                  <span>{technician.businessName || (isUrdu ? "آرڈر ورکر پرو" : "WorkerFIX Pro")}</span>
                </p>
              </div>

              {/* Call Technician CTA Button */}
              <a
                href={`tel:${technician.phone || "03001234567"}`}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Phone className="size-3.5" />
                <span>{isUrdu ? "کاریگر کو کال کریں" : "Call Technician"}</span>
              </a>
            </div>

            {/* Job Context Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 space-y-2.5 shadow-2xs text-xs">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                {isUrdu ? "ایکٹیو جاب آرڈر" : "Active Job Request"}
              </span>
              <p className="font-bold text-[#123B5D] text-sm leading-snug">
                {isUrdu
                  ? (activeVisit?.jobTitleUr ?? activeVisit?.jobTitle ?? "ہوم ریپئر سروس")
                  : (activeVisit?.jobTitle ?? "Home Repair Service")}
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-slate-600">
                <span>{isUrdu ? "کیٹیگری:" : "Category:"}</span>
                <span className="font-bold text-slate-800">{activeVisit?.category || "Maintenance"}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>{isUrdu ? "طے شدہ وزٹ فیس:" : "Agreed Visit Fee:"}</span>
                <span className="font-black font-mono text-[#0F8B8D] text-xs">
                  Rs {activeVisit?.visitCharges ?? 300}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Security Note */}
          <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-2xl text-[11px] text-teal-950 space-y-1">
            <span className="font-bold flex items-center gap-1 text-[#0F8B8D]">
              <Sparkles className="size-3.5" />
              <span>WorkerFIX Protection</span>
            </span>
            <p className="text-slate-600 leading-relaxed">
              {isUrdu
                ? "حفاظت اور وارنٹی کے لیے گفتگو اور ادائیگی پلیٹ فارم کے ذریعے ہی رکھیں۔"
                : "Keep communication and payments on platform for safety guarantee."}
            </p>
          </div>
        </aside>

        {/* ======================================================== */}
        {/* RIGHT PANE: CHAT STREAM & INPUT BAR */}
        {/* ======================================================== */}
        <div className="flex-1 flex flex-col h-full bg-white min-w-0">
          {/* 1. CHAT TOP HEADER BAR */}
          <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 py-3 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={handleGoBack}
                className="p-1.5 -ml-1 rtl:-ml-0 rtl:-mr-1 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title={isUrdu ? "واپس جائیں" : "Go Back"}
              >
                <ArrowLeft className="size-5 rtl:rotate-180" />
              </button>

              {/* Technician Avatar & Status */}
              <div className="relative">
                <div className="size-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-xs text-[#123B5D]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={technician.avatarUrl}
                    alt={technician.name}
                    className="size-full object-cover"
                  />
                </div>
                <span className="absolute bottom-0 right-0 rtl:right-auto rtl:left-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>

              <div className="min-w-0 leading-tight">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-slate-900 text-sm truncate">
                    {isUrdu ? (technician.nameUr ?? technician.name) : technician.name}
                  </h3>
                  <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                    {isUrdu ? "آن لائن" : "Online"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                  <MapPin className="size-3 text-[#0F8B8D] shrink-0" />
                  <span>{technician.businessName || (isUrdu ? "تصدیق شدہ کاریگر" : "Verified Technician")}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-400">Order #{activeVisit?.jobId || activeVisit?.id || "101"}</span>
                </p>
              </div>
            </div>

            {/* Direct Call Button */}
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`tel:${technician.phone || "03001234567"}`}
                className="size-9 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 shadow-2xs flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                title={isUrdu ? "کال کریں" : "Call Technician"}
              >
                <Phone className="size-4 stroke-[2.2]" />
              </a>
            </div>
          </header>

          {/* Safety & Job Notice Banner */}
          <div className="bg-teal-50/70 border-b border-teal-100 px-4 py-2 flex items-center justify-between text-xs text-slate-600">
            <span className="font-bold text-[#0F8B8D] truncate">
              {isUrdu
                ? (activeVisit?.jobTitleUr ?? activeVisit?.jobTitle ?? "ہوم ریپئر سروس")
                : (activeVisit?.jobTitle ?? "Home Repair Service")}
            </span>
            <span className="text-[11px] text-slate-500 shrink-0 font-medium hidden sm:inline">
              {isUrdu ? "اینڈ ٹو اینڈ انکرپٹڈ کسٹمر سپورٹ" : "End-to-End Encrypted Customer Support"}
            </span>
          </div>

          {/* 2. MESSAGES FEED */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 space-y-4 bg-slate-50/30">
            {messages.map((msg) => {
              const isCustomer = msg.sender === "customer";

              if (msg.type === "voice") {
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isCustomer ? "items-end rtl:items-start" : "items-start rtl:items-end"
                    }`}
                  >
                    <VoiceMessageBubble
                      audioUrl={msg.audioUrl}
                      durationSeconds={msg.durationSeconds}
                      isSender={isCustomer}
                      variant="navy"
                    />
                    <div className="flex items-center gap-1 mt-1 justify-end text-[10px] text-slate-400">
                      <span>{msg.time}</span>
                      {isCustomer && <CheckCheck className="size-3.5 text-[#0F8B8D]" />}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isCustomer ? "items-end rtl:items-start" : "items-start rtl:items-end"
                  }`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 shadow-2xs ${
                      isCustomer
                        ? "bg-[#123B5D] text-white rounded-br-xs rtl:rounded-br-2xl rtl:rounded-bl-xs"
                        : "bg-white text-slate-900 border border-slate-200/90 rounded-bl-xs rtl:rounded-bl-2xl rtl:rounded-br-xs"
                    }`}
                  >
                    {/* Photo Message */}
                    {msg.type === "image" && msg.imageUrl && (
                      <div className="rounded-xl overflow-hidden border border-black/10 my-1 max-w-[260px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={msg.imageUrl}
                          alt="Shared photo"
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
                        isCustomer ? "text-slate-300" : "text-slate-400"
                      }`}
                    >
                      <span>{msg.time}</span>
                      {isCustomer && <CheckCheck className="size-3.5 text-teal-300" />}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* 3. CHAT INPUT BAR WITH PRESETS */}
          <div className="sticky bottom-0 bg-white border-t border-slate-200/90 shadow-lg">
            <ChatInputBar
              onSendMessage={handleSendMessage}
              onSendVoiceNote={handleSendVoiceNote}
              onSendImage={handleSendImage}
              quickSuggestions={customerQuickSuggestions}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
