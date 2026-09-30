"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import {
  X,
  Phone,
  CheckCheck,
  ShieldCheck,
  ArrowLeft,
  MapPin,
  Sparkles,
} from "lucide-react";
import { JobRequest } from "@/types/job";
import { ChatInputBar } from "@/features/chat/components/chat-input-bar";
import { VoiceMessageBubble } from "@/features/chat/components/voice-message-bubble";
import { sendChatMessage } from "@/features/chat/api/chat-api";

interface WorkerChatModalProps {
  job: JobRequest;
  isOpen: boolean;
  onClose: () => void;
  onCallCustomer?: () => void;
}

interface ChatMessage {
  id: string;
  sender: "worker" | "customer";
  type?: "text" | "voice" | "image";
  text?: string;
  audioUrl?: string;
  durationSeconds?: number;
  imageUrl?: string;
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

  const defaultMessagesUrdu: ChatMessage[] = [
    {
      id: "wm-1",
      sender: "worker",
      type: "text",
      text: "السلام علیکم! میں تشخیصی آلات اور ٹول کٹ لے کر آپ کی طرف روانہ ہو چکا ہوں۔",
      time: "10:30 AM",
    },
    {
      id: "wm-2",
      sender: "customer",
      type: "text",
      text: "وعلیکم السلام۔ براہ کرم فلیٹ 402 پہنچ کر مین گیٹ پر کال کریں۔",
      time: "10:32 AM",
    },
    {
      id: "wm-3",
      sender: "worker",
      type: "voice",
      audioUrl: "https://actions.google.com/sounds/v1/speech/hello.ogg",
      durationSeconds: 12,
      time: "10:35 AM",
    },
    {
      id: "wm-4",
      sender: "customer",
      type: "text",
      text: "جی گیٹ کھلا ہے، آپ سیدھا چوتھی منزل پر آ جائیں۔",
      time: "10:36 AM",
    },
  ];

  const defaultMessagesEn: ChatMessage[] = [
    {
      id: "wm-1",
      sender: "worker",
      type: "text",
      text: "Assalam o Alaikum! I am on my way to your location with the diagnostic equipment.",
      time: "10:30 AM",
    },
    {
      id: "wm-2",
      sender: "customer",
      type: "text",
      text: "Walaikum Assalam. Please ring at Flat 402 when you reach the building.",
      time: "10:32 AM",
    },
    {
      id: "wm-3",
      sender: "worker",
      type: "voice",
      audioUrl: "https://actions.google.com/sounds/v1/speech/hello.ogg",
      durationSeconds: 12,
      time: "10:35 AM",
    },
    {
      id: "wm-4",
      sender: "customer",
      type: "text",
      text: "Main gate is open. You can come straight up to 4th floor.",
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
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSendTextMessage = (messageText: string) => {
    const newMsg: ChatMessage = {
      id: `wm-${Date.now()}`,
      sender: "worker",
      type: "text",
      text: messageText,
      time: isUrdu ? "ابھی" : "Just now",
    };

    setMessages((prev) => [...prev, newMsg]);

    sendChatMessage(job.id, messageText).catch((err) => {
      console.warn("sendChatMessage error fallback:", err);
    });
  };

  const handleSendVoiceNote = (audioUrl: string, durationSeconds: number) => {
    const newMsg: ChatMessage = {
      id: `wm-${Date.now()}`,
      sender: "worker",
      type: "voice",
      audioUrl,
      durationSeconds,
      time: isUrdu ? "ابھی" : "Just now",
    };

    setMessages((prev) => [...prev, newMsg]);
  };

  const handleSendImage = (file: File) => {
    const tempUrl = URL.createObjectURL(file);
    const newMsg: ChatMessage = {
      id: `wm-${Date.now()}`,
      sender: "worker",
      type: "image",
      imageUrl: tempUrl,
      time: isUrdu ? "ابھی" : "Just now",
    };

    setMessages((prev) => [...prev, newMsg]);
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
      <div className="w-full h-full lg:h-[86vh] lg:max-w-5xl xl:max-w-6xl bg-white lg:rounded-3xl lg:border lg:border-slate-200 lg:shadow-2xl overflow-hidden flex flex-col lg:flex-row relative animate-in zoom-in-95 duration-200">
        {/* ======================================================== */}
        {/* DESKTOP LEFT SIDEBAR: CUSTOMER & JOB DETAILS PANE */}
        {/* ======================================================== */}
        <aside className="hidden lg:flex lg:w-[320px] xl:w-[360px] border-r border-slate-200 bg-slate-50/70 p-5 flex-col justify-between overflow-y-auto shrink-0">
          <div className="space-y-5">
            {/* Top Label */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isUrdu ? "کسٹمر اور جاب کی تفصیل" : "Customer & Job Info"}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>ONLINE</span>
              </span>
            </div>

            {/* Customer Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3.5 shadow-2xs text-center">
              <div className="relative inline-block mx-auto">
                <div className="size-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-lg font-black text-[#123B5D] overflow-hidden shadow-2xs">
                  {job.customer.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={job.customer.avatarUrl}
                      alt={job.customer.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    job.customer.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 size-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>

              <div>
                <div className="flex items-center justify-center gap-1.5">
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    {job.customer.name}
                  </h4>
                  <ShieldCheck className="size-4 text-emerald-600" />
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  ⭐ {job.customer.rating} ({job.customer.totalReviews} reviews)
                </p>
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mt-1">
                  <MapPin className="size-3 text-[#0F8B8D]" />
                  <span>{job.location.area}</span>
                </p>
              </div>

              {/* Call Customer CTA Button */}
              {onCallCustomer && (
                <button
                  type="button"
                  onClick={onCallCustomer}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Phone className="size-3.5" />
                  <span>{isUrdu ? "کسٹمر کو کال کریں" : "Call Customer"}</span>
                </button>
              )}
            </div>

            {/* Job Context Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 space-y-2.5 shadow-2xs text-xs">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                {isUrdu ? "ایکٹیو جاب آرڈر" : "Active Job Request"}
              </span>
              <p className="font-bold text-[#123B5D] text-sm leading-snug">
                {job.title}
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-slate-600">
                <span>{isUrdu ? "کیٹیگری:" : "Category:"}</span>
                <span className="font-bold text-slate-800">{job.category}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>{isUrdu ? "طے شدہ وزٹ فیس:" : "Agreed Visit Fee:"}</span>
                <span className="font-black font-mono text-[#0F8B8D] text-xs">
                  Rs {job.visitCharge || job.customerSuggestedPrice || 600}
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
              Keep communication and payments on platform for safety guarantee.
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
                      className="size-full object-cover"
                    />
                  ) : (
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
                  className="size-9 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 shadow-2xs flex items-center justify-center transition-all active:scale-90 cursor-pointer"
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
            {messages.map((msg) => {
              const isMe = msg.sender === "worker";

              if (msg.type === "voice") {
                return (
                  <div
                    key={msg.id}
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
                      {isMe && <CheckCheck className="size-3.5 text-[#0F8B8D]" />}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
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
                      {isMe && <CheckCheck className="size-3.5 text-teal-300" />}
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
