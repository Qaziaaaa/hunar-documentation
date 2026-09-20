"use client";

import { useLocale } from "next-intl";
import { useState } from "react";
import { Check, CheckCheck, Send, User, X } from "lucide-react";
import type { ScheduledVisit } from "../types";

interface QuickChatDrawerProps {
  visit: ScheduledVisit | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: "customer" | "technician";
  text: string;
  time: string;
}

export function QuickChatDrawer({ visit, isOpen, onClose }: QuickChatDrawerProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  const defaultMessagesUrdu: ChatMessage[] = [
    {
      id: "m-1",
      sender: "technician",
      text: "السلام علیکم! میں تشخیصی آلات لے کر یونیورسٹی روڈ سے آپ کی طرف روانہ ہو چکا ہوں۔",
      time: "10 منٹ پہلے",
    },
    {
      id: "m-2",
      sender: "customer",
      text: "وعلیکم السلام۔ براہ کرم مکان نمبر 45 پہنچ کر مین گیٹ پر کال کریں۔",
      time: "8 منٹ پہلے",
    },
    {
      id: "m-3",
      sender: "technician",
      text: "جی ضرور، اسلامیہ کالج گیٹ کراس کر لیا ہے۔ تقریباً 15 منٹ میں پہنچ جاؤں گا۔",
      time: "2 منٹ پہلے",
    },
  ];

  const defaultMessagesEn: ChatMessage[] = [
    {
      id: "m-1",
      sender: "technician",
      text: "Assalam o Alaikum! I am on my way via University Road with the diagnostic equipment.",
      time: "10 mins ago",
    },
    {
      id: "m-2",
      sender: "customer",
      text: "Walaikum Assalam. Please call on gate when you reach House 45.",
      time: "8 mins ago",
    },
    {
      id: "m-3",
      sender: "technician",
      text: "Sure, passing Islamia College gate now. Will be there in ~15 mins.",
      time: "2 mins ago",
    },
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(
    isUrdu ? defaultMessagesUrdu : defaultMessagesEn
  );
  const [inputText, setInputText] = useState("");

  if (!isOpen || !visit) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: "customer",
      text: inputText.trim(),
      time: isUrdu ? "ابھی" : "Just now",
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");

    // Auto technician response after 1.5 seconds
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now() + 1}`,
          sender: "technician",
          text: isUrdu ? "موصول ہو گیا! میں راستے میں ہوں۔" : "Received! On my way.",
          time: isUrdu ? "ابھی" : "Just now",
        },
      ]);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end rtl:justify-start animate-in fade-in-50 duration-200">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right rtl:slide-in-from-left duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-[#123B5D] text-white">
          <div className="flex items-center gap-3">
            <div className="relative size-10 rounded-full overflow-hidden border-2 border-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={visit.technician.avatarUrl}
                alt={visit.technician.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 right-0 rtl:right-auto rtl:left-0 size-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
            </div>
            <div>
              <h4 className="text-sm font-bold">{visit.technician.name}</h4>
              <p className="text-[10.5px] text-teal-200">
                {visit.technician.businessName} • {isUrdu ? "راستے میں فعال" : "Active En Route"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="size-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
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
                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                    isCustomer
                      ? "bg-[#0F766E] text-white rounded-br-xs rtl:rounded-br-2xl rtl:rounded-bl-xs"
                      : "bg-white text-[#123B5D] border border-slate-200 rounded-bl-xs rtl:rounded-bl-2xl rtl:rounded-br-xs"
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1 flex items-center gap-1">
                  <span>{msg.time}</span>
                  {isCustomer && <CheckCheck className="size-3 text-[#0F766E]" />}
                </span>
              </div>
            );
          })}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isUrdu
                ? "کاریگر کو اپنا پیغام لکھیں..."
                : "Type your message to technician..."
            }
            className="flex-1 py-2.5 px-3.5 rounded-xl border border-slate-200 text-xs text-[#123B5D] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 bg-slate-50 focus:bg-white rtl:text-right"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="size-10 rounded-xl bg-[#0F766E] hover:bg-[#115E59] disabled:opacity-50 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
          >
            <Send className="size-4 rtl:rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
}

