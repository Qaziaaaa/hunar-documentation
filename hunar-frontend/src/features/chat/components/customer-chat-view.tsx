"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useLocale } from "next-intl";
import { formatJobDate } from "@/lib/format";
import {
  ArrowLeft,
  CheckCheck,
  Phone,
  ShieldCheck,
  Wrench,
  MapPin,
  Clock,
  Sparkles,
  MessageSquare,
  Search,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { ChatInputBar } from "./chat-input-bar";
import { VoiceMessageBubble } from "./voice-message-bubble";
import { sendChatMessage, uploadChatImage, getMessagesByJob, parseVoiceNote, encodeVoiceNote, uploadVoiceNote, storeVoiceInCache, blobToBase64 } from "../api/chat-api";
import { joinConversationRoom, subscribeToMessages } from "@/services/worker/chat.service";
import { getStoredUser } from "@/lib/api-client";
import { getCustomerVisits } from "@/features/customer-visits/api/customer-visits-api";
import { useQuery } from "@tanstack/react-query";
import type { ScheduledVisit } from "@/features/customer-visits/types";

interface ChatMessage {
  id: string;
  messageId?: string;
  senderId?: string;
  receiverId?: string;
  jobId?: string;
  sender: "customer" | "technician";
  type: "text" | "voice" | "image";
  messageType?: "text" | "voice" | "image";
  text?: string;
  audioUrl?: string;
  durationSeconds?: number;
  imageUrl?: string;
  time: string;
  createdAt?: string;
}

export function CustomerChatView() {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const router = useRouter();
  const searchParams = useSearchParams();

  const jobIdParam = searchParams.get("jobId");
  const visitIdParam = searchParams.get("visitId");
  const isFromSpecificOrder = Boolean(jobIdParam || visitIdParam);

  // Fetch all customer visits
  const { data: visits, isLoading } = useQuery({
    queryKey: ["customer", "visits"],
    queryFn: getCustomerVisits,
    staleTime: 30_000,
  });

  // Filter ONLY technicians who have an active or scheduled visit
  // Old/completed/cancelled visits are strictly excluded
  const activeVisits = useMemo(() => {
    return (visits ?? []).filter(
      (v) =>
        v.status === "en_route" ||
        v.status === "dispatched" ||
        v.status === "arrived" ||
        v.status === "inspection_in_progress" ||
        v.status === "scheduled" ||
        v.status === "started" ||
        v.status === "in_progress"
    );
  }, [visits]);

  // Selected visit ID state
  // If opened from a specific order, directly open that technician's chat
  // If opened from sidebar, do NOT open chat directly (null -> show list first)
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(() => {
    if (jobIdParam || visitIdParam) {
      const match = (visits ?? []).find(
        (v) => v.jobId === jobIdParam || v.id === visitIdParam
      );
      if (match) return match.id;
    }
    return null;
  });

  // Keep selectedVisitId in sync if URL params change or activeVisits load
  useEffect(() => {
    if (jobIdParam || visitIdParam) {
      const match = (visits ?? []).find(
        (v) => v.jobId === jobIdParam || v.id === visitIdParam
      );
      if (match) {
        setSelectedVisitId(match.id);
      }
    }
  }, [jobIdParam, visitIdParam, visits]);

  // Active visit object
  const currentVisit = useMemo(() => {
    if (!selectedVisitId) return null;
    return activeVisits.find((v) => v.id === selectedVisitId) || null;
  }, [selectedVisitId, activeVisits]);

  // Search query for filtering technician list
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVisits = useMemo(() => {
    if (!searchQuery.trim()) return activeVisits;
    const q = searchQuery.toLowerCase();
    return activeVisits.filter(
      (v) =>
        v.technician.name.toLowerCase().includes(q) ||
        (v.technician.nameUr && v.technician.nameUr.toLowerCase().includes(q)) ||
        v.jobTitle.toLowerCase().includes(q) ||
        (v.jobTitleUr && v.jobTitleUr.toLowerCase().includes(q)) ||
        v.id.toLowerCase().includes(q)
    );
  }, [activeVisits, searchQuery]);

  // Messages state grouped by visit ID
  const [messagesByVisit, setMessagesByVisit] = useState<Record<string, ChatMessage[]>>({
    "VST-98214": isUrdu
      ? [
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
        ]
      : [
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
        ],
    "VST-98102": isUrdu
      ? [
          {
            id: "m-r1",
            sender: "technician",
            type: "text",
            text: "السلام علیکم! کل صبح 10 بجے کے لیے وزٹ طے ہو گیا ہے۔ میں پی پی آر سی سامان ساتھ لاؤں گا۔",
            time: "Yesterday",
          },
          {
            id: "m-r2",
            sender: "customer",
            type: "text",
            text: "وعلیکم السلام۔ بالکل ٹھیک، کل ملاقات ہو گی۔",
            time: "Yesterday",
          },
        ]
      : [
          {
            id: "m-r1",
            sender: "technician",
            type: "text",
            text: "Assalam o Alaikum! Your plumbing visit is confirmed for tomorrow at 10:00 AM. I will bring the PPRC fittings.",
            time: "Yesterday",
          },
          {
            id: "m-r2",
            sender: "customer",
            type: "text",
            text: "Walaikum Assalam. Sounds good, see you tomorrow.",
            time: "Yesterday",
          },
        ],
  });

  // Unread badge counts per visit
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({
    "VST-98214": 1,
    "VST-98102": 0,
  });

  // When a technician chat is opened, clear their unread count
  useEffect(() => {
    if (selectedVisitId && unreadCounts[selectedVisitId]) {
      setUnreadCounts((prev) => ({ ...prev, [selectedVisitId]: 0 }));
    }
  }, [selectedVisitId]);

  const messages = currentVisit
    ? messagesByVisit[currentVisit.id] || []
    : [];

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (selectedVisitId) {
      scrollToBottom();
    }
  }, [messages, selectedVisitId]);

  // Load real messages for current visit if available from backend
  useEffect(() => {
    if (!currentVisit?.jobId) return;
    let isCancelled = false;

    // Immediately join the job room so real-time socket events flow immediately
    joinConversationRoom(currentVisit.jobId);

    getMessagesByJob(currentVisit.jobId)
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
            jobId: m.jobId || voice?.jobId || currentVisit.jobId,
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
        setMessagesByVisit((prev) => ({
          ...prev,
          [currentVisit.id]: formatted,
        }));
        if (backendMsgs[0]?.conversationId) {
          joinConversationRoom(backendMsgs[0].conversationId);
        }
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [currentVisit?.id, currentVisit?.jobId]);

  // Real-time incoming message listener for active conversation
  useEffect(() => {
    if (!currentVisit) return;
    const unsubscribe = subscribeToMessages((msg) => {
      const currentUserId = getStoredUser()?.id;
      const isFromMe = currentUserId ? msg.senderId === currentUserId : msg.senderRole === "customer";

      setMessagesByVisit((prev) => {
        const existing = prev[currentVisit.id] || [];
        if (existing.some((m) => m.id === msg.id)) return prev;

        const voice = parseVoiceNote(msg.text || (msg as any).content);
        const msgType: "text" | "voice" | "image" = voice ? "voice" : msg.imageUrl ? "image" : "text";

        // If from me, reconcile temporary message
        if (isFromMe) {
          const tempIdx = existing.findIndex(
            (m) =>
              m.id.startsWith("msg-") &&
              (m.text === msg.text || (m.type === "voice" && voice))
          );
          if (tempIdx !== -1) {
            const copy = [...existing];
            copy[tempIdx] = {
              ...copy[tempIdx],
              id: msg.id,
              messageId: msg.id,
              audioUrl: voice?.audioUrl || copy[tempIdx].audioUrl,
            };
            return { ...prev, [currentVisit.id]: copy };
          }
          return prev;
        }

        // It is from the technician!
        const newMsg: ChatMessage = {
          id: msg.id,
          messageId: msg.id,
          senderId: msg.senderId,
          receiverId: msg.receiverId || voice?.receiverId,
          jobId: msg.jobId || voice?.jobId || currentVisit.jobId,
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
        return {
          ...prev,
          [currentVisit.id]: [...existing, newMsg],
        };
      });
    });
    return () => {
      unsubscribe();
    };
  }, [currentVisit?.id]);

  const handleSendMessage = (text: string) => {
    if (!currentVisit) return;
    const visitId = currentVisit.id;
    const tempId = `msg-${Date.now()}`;

    const newMsg: ChatMessage = {
      id: tempId,
      sender: "customer",
      type: "text",
      text,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessagesByVisit((prev) => ({
      ...prev,
      [visitId]: [...(prev[visitId] || []), newMsg],
    }));

    sendChatMessage(currentVisit.jobId || "job-1", text, { isJobId: true })
      .then((sent) => {
        setMessagesByVisit((prev) => {
          const existing = prev[visitId] || [];
          return {
            ...prev,
            [visitId]: existing.map((m) => (m.id === tempId ? { ...m, id: sent.id } : m)),
          };
        });
        if (sent.conversationId) {
          joinConversationRoom(sent.conversationId);
        }
      })
      .catch((err) => {
        console.warn("sendChatMessage failed:", err);
      });
  };

  const handleSendVoiceNote = async (audioUrl: string, durationSeconds: number) => {
    if (!currentVisit) return;
    const visitId = currentVisit.id;
    const tempId = `msg-${Date.now()}`;
    const currentUserId = getStoredUser()?.id;
    const workerId = currentVisit.technician?.id;

    const optimisticMsg: ChatMessage = {
      id: tempId,
      messageId: tempId,
      senderId: currentUserId,
      receiverId: workerId,
      jobId: currentVisit.jobId,
      sender: "customer",
      type: "voice",
      messageType: "voice",
      audioUrl,
      durationSeconds,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      createdAt: new Date().toISOString(),
    };

    setMessagesByVisit((prev) => ({
      ...prev,
      [visitId]: [...(prev[visitId] || []), optimisticMsg],
    }));

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
        jobId: currentVisit.jobId,
        senderId: currentUserId,
        receiverId: workerId,
      });

      const sent = await sendChatMessage(currentVisit.jobId || "job-1", payloadText, { isJobId: true });

      setMessagesByVisit((prev) => {
        const existing = prev[visitId] || [];
        return {
          ...prev,
          [visitId]: existing.map((m) =>
            m.id === tempId
              ? {
                  ...m,
                  id: sent.id,
                  messageId: sent.id,
                  audioUrl: serverAudioUrl,
                }
              : m
          ),
        };
      });

      if (sent.conversationId) {
        joinConversationRoom(sent.conversationId);
      }
    } catch (err) {
      console.error("Failed to upload/send customer voice note:", err);
    }
  };

  const handleSendImage = async (file: File) => {
    if (!currentVisit) return;
    const visitId = currentVisit.id;
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

    setMessagesByVisit((prev) => ({
      ...prev,
      [visitId]: [...(prev[visitId] || []), newMsg],
    }));

    try {
      const uploadRes = await uploadChatImage(file);
      if (uploadRes?.key) {
        await sendChatMessage(currentVisit.jobId || "job-1", "", {
          isJobId: true,
          imageKey: uploadRes.key,
        });
      }
    } catch {}
  };

  // Back button behavior
  const handleGoBack = () => {
    if (isFromSpecificOrder) {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/customer/jobs");
      }
    } else {
      // In sidebar flow, return to the Technician List view
      setSelectedVisitId(null);
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

  // Helper for technician card last message
  const getLastMessage = (visitId: string) => {
    const list = messagesByVisit[visitId];
    if (list && list.length > 0) {
      const last = list[list.length - 1];
      if (last.type === "voice") return isUrdu ? "وائس نوٹ 🎤" : "Voice Note 🎤";
      if (last.type === "image") return isUrdu ? "تصویر 📷" : "Photo 📷";
      return last.text || "";
    }
    return isUrdu ? "کوئی نیا پیغام نہیں" : "No messages yet";
  };

  const getLastMessageTime = (visitId: string) => {
    const list = messagesByVisit[visitId];
    if (list && list.length > 0) {
      return list[list.length - 1].time;
    }
    return "";
  };

  return (
    <div className="w-full h-[100dvh] md:h-[calc(100vh-64px)] flex flex-col bg-slate-100/60 lg:p-6 xl:p-8 overflow-hidden select-none">
      <div className="w-full h-full lg:max-w-5xl xl:max-w-6xl mx-auto bg-white lg:rounded-3xl lg:border lg:border-slate-200 lg:shadow-2xl overflow-hidden flex flex-col lg:flex-row relative">
        {/* ======================================================== */}
        {/* LEFT PANE: TECHNICIAN / CHAT LIST                        */}
        {/* (Visible on desktop always; on mobile when !selectedVisitId) */}
        {/* ======================================================== */}
        <aside
          className={`${
            selectedVisitId ? "hidden lg:flex" : "flex"
          } w-full lg:w-[340px] xl:w-[380px] border-r border-slate-200 bg-slate-50/70 flex-col shrink-0 h-full overflow-hidden`}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200/90 bg-white space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Link
                  href="/customer/dashboard"
                  className="lg:hidden p-1.5 -ml-1 rtl:-ml-0 rtl:-mr-1 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title={isUrdu ? "ڈیش بورڈ" : "Dashboard"}
                >
                  <ArrowLeft className="size-5 rtl:rotate-180" />
                </Link>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-extrabold text-[#123B5D]">
                    {isUrdu ? "پیغامات" : "Messages"}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#0F8B8D]/10 text-[#0F8B8D] border border-[#0F8B8D]/20">
                    {activeVisits.length} {isUrdu ? "فعال" : "Active"}
                  </span>
                </div>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="size-4 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isUrdu ? "کاریگر یا جاب تلاش کریں..." : "Search technicians or jobs..."}
                className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 rounded-xl text-xs bg-slate-100/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]/20 text-[#123B5D] font-medium border border-slate-200/80 transition-all"
              />
            </div>
          </div>

          {/* List of Active Technicians */}
          <div
            className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {filteredVisits.length > 0 ? (
              filteredVisits.map((visit) => {
                const isSelected = selectedVisitId === visit.id;
                const unread = unreadCounts[visit.id] || 0;
                const lastMsg = getLastMessage(visit.id);
                const lastTime = getLastMessageTime(visit.id);

                return (
                  <button
                    key={visit.id}
                    type="button"
                    onClick={() => setSelectedVisitId(visit.id)}
                    className={`w-full p-3.5 rounded-2xl text-left rtl:text-right transition-all cursor-pointer flex items-start gap-3 border ${
                      isSelected
                        ? "bg-teal-50/70 border-[#0F8B8D]/40 ring-1 ring-[#0F8B8D]/20 shadow-xs"
                        : "bg-white hover:bg-slate-100/70 border-slate-200/80 shadow-2xs"
                    }`}
                  >
                    {/* Technician Profile Image */}
                    <div className="relative shrink-0">
                      <div className="size-12 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-sm text-[#123B5D]">
                        {visit.technician.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={visit.technician.avatarUrl}
                            alt={visit.technician.name}
                            className="size-full object-cover"
                          />
                        ) : (
                          visit.technician.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 rtl:right-auto rtl:-left-0.5 size-3 rounded-full bg-[#16A34A] ring-2 ring-white" />
                    </div>

                    {/* Technician & Appointment Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="font-extrabold text-[#123B5D] text-xs sm:text-sm truncate">
                            {isUrdu ? (visit.technician.nameUr ?? visit.technician.name) : visit.technician.name}
                          </h4>
                          <ShieldCheck className="size-3.5 text-[#16A34A] shrink-0" />
                        </div>
                        {lastTime && (
                          <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                            {lastTime}
                          </span>
                        )}
                      </div>

                      {/* Related Job Title */}
                      <p className="text-[11px] font-semibold text-slate-700 truncate">
                        {isUrdu ? (visit.jobTitleUr ?? visit.jobTitle) : visit.jobTitle}
                      </p>

                      {/* Scheduled Visit Slot Pill */}
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#0F8B8D] bg-[#0F8B8D]/10 px-2 py-0.5 rounded-md border border-[#0F8B8D]/20 truncate">
                          <Clock className="size-3 shrink-0" />
                          <span className="truncate">
                            {visit.scheduledDate === "Today"
                              ? isUrdu
                                ? "آج"
                                : "Today"
                              : visit.scheduledDate === "Tomorrow"
                              ? isUrdu
                                ? "کل"
                                : "Tomorrow"
                              : formatJobDate(visit.scheduledDate)}{" "}
                            • {visit.scheduledTimeSlot}
                          </span>
                        </span>
                      </div>

                      {/* Last Message Preview & Unread Badge */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <p className="text-[11px] text-slate-500 truncate">
                          {lastMsg}
                        </p>
                        {unread > 0 && (
                          <span className="size-5 rounded-full bg-[#0F8B8D] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 shadow-2xs">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center space-y-3 bg-white rounded-2xl border border-slate-200/80 my-4">
                <div className="size-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <MessageSquare className="size-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-[#123B5D]">
                    {searchQuery
                      ? isUrdu
                        ? "کوئی نتیجہ نہیں ملا"
                        : "No matching technicians"
                      : isUrdu
                      ? "کوئی فعال شیڈول وزٹ نہیں ہے"
                      : "No active technician visits"}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {searchQuery
                      ? isUrdu
                        ? "دوسرا نام یا سروس تلاش کریں۔"
                        : "Try a different search term."
                      : isUrdu
                      ? "صرف شیڈول یا فعال وزٹس والے کاریگر یہاں ظاہر ہوتے ہیں۔"
                      : "Only technicians with a scheduled or active visit appear in your messages list."}
                  </p>
                </div>
                {!searchQuery && (
                  <Link
                    href="/customer/jobs"
                    className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#0F8B8D] text-white text-xs font-bold shadow-xs hover:bg-[#0F8B8D]/90 transition-all"
                  >
                    <span>{isUrdu ? "میری بکنگز دیکھیں" : "View My Bookings"}</span>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Bottom Trust Badge */}
          <div className="p-3 bg-slate-100/80 border-t border-slate-200/80 text-[11px] text-slate-500 flex items-center gap-2 shrink-0">
            <ShieldCheck className="size-4 text-[#16A34A] shrink-0" />
            <span className="truncate">
              {isUrdu
                ? "تمام کاریگر 100% نادرا تصدیق شدہ ہیں"
                : "100% NADRA CNIC Verified Technicians"}
            </span>
          </div>
        </aside>

        {/* ======================================================== */}
        {/* RIGHT PANE: ACTIVE CHAT STREAM OR EMPTY SELECTION        */}
        {/* (Visible on desktop always; on mobile only when selected) */}
        {/* ======================================================== */}
        {currentVisit ? (
          <div
            className={`${
              selectedVisitId ? "flex" : "hidden lg:flex"
            } flex-1 flex-col h-full bg-white min-w-0`}
          >
            {/* 1. CHAT TOP HEADER BAR */}
            <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 py-3 flex items-center justify-between shadow-2xs shrink-0">
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
                <div className="relative shrink-0">
                  <div className="size-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-xs text-[#123B5D]">
                    {currentVisit.technician.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={currentVisit.technician.avatarUrl}
                        alt={currentVisit.technician.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      currentVisit.technician.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 rtl:right-auto rtl:left-0 size-2.5 rounded-full bg-[#16A34A] ring-2 ring-white" />
                </div>

                <div className="min-w-0 leading-tight">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-slate-900 text-sm truncate">
                      {isUrdu ? (currentVisit.technician.nameUr ?? currentVisit.technician.name) : currentVisit.technician.name}
                    </h3>
                    <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                      {isUrdu ? "آن لائن" : "Online"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                    <MapPin className="size-3 text-[#0F8B8D] shrink-0" />
                    <span>{currentVisit.technician.businessName || (isUrdu ? "تصدیق شدہ کاریگر" : "Verified Technician")}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-400">Order #{currentVisit.jobId || currentVisit.id}</span>
                  </p>
                </div>
              </div>

              {/* Direct Call Button */}
              {currentVisit.technician.phone && (
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`tel:${currentVisit.technician.phone}`}
                    className="size-9 rounded-full bg-success/10 text-success hover:bg-success hover:text-white border border-success/20 shadow-2xs flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                    title={isUrdu ? "کال کریں" : "Call Technician"}
                  >
                    <Phone className="size-4 stroke-[2.2]" />
                  </a>
                </div>
              )}
            </header>

            {/* Scheduled Visit Details Bar */}
            <div className="bg-teal-50/70 border-b border-teal-100 px-4 py-2 flex items-center justify-between text-xs text-slate-600 shrink-0">
              <span className="font-bold text-[#0F8B8D] truncate">
                {isUrdu
                  ? (currentVisit.jobTitleUr ?? currentVisit.jobTitle)
                  : currentVisit.jobTitle}
              </span>
              <span className="text-[11px] text-[#123B5D] font-bold shrink-0 hidden sm:inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-teal-200">
                <Calendar className="size-3 text-[#0F8B8D]" />
                <span>
                  {formatJobDate(currentVisit.scheduledDate)} • {currentVisit.scheduledTimeSlot}
                </span>
              </span>
            </div>

            {/* 2. MESSAGES FEED */}
            <div
              className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 space-y-4 bg-slate-50/30 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
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
            <div className="sticky bottom-0 bg-white border-t border-slate-200/90 shadow-lg shrink-0">
              <ChatInputBar
                onSendMessage={handleSendMessage}
                onSendVoiceNote={handleSendVoiceNote}
                onSendImage={handleSendImage}
                quickSuggestions={customerQuickSuggestions}
              />
            </div>
          </div>
        ) : (
          /* DESKTOP EMPTY STATE (WHEN OPENED FROM SIDEBAR WITHOUT A SELECTED TECHNICIAN) */
          <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-8 bg-slate-50/50 text-center space-y-4">
            <div className="size-20 rounded-3xl bg-teal-50 border border-teal-200/70 text-[#0F8B8D] flex items-center justify-center shadow-xs">
              <MessageSquare className="size-10 stroke-[1.8]" />
            </div>
            <div className="space-y-1.5 max-w-md">
              <h2 className="text-lg font-extrabold text-[#123B5D]">
                {isUrdu ? "گفتگو کے لیے کاریگر منتخب کریں" : "Select a Technician to Chat"}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isUrdu
                  ? "اپنے بائیں جانب دی گئی شیڈول وزٹس کی فہرست میں سے کسی کاریگر کا انتخاب کریں تاکہ آپ ان کے ساتھ فوری میسج یا وائس نوٹ شیئر کر سکیں۔"
                  : "Choose an assigned technician from your scheduled visits on the left to start messaging or send voice notes directly."}
              </p>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-slate-200 text-xs text-slate-500 flex items-center gap-2 shadow-2xs">
              <Sparkles className="size-4 text-[#0F8B8D] shrink-0" />
              <span>
                {isUrdu
                  ? "صرف شیڈول اور فعال وزٹس والے کاریگر دستیاب ہوتے ہیں۔"
                  : "Only technicians with scheduled or active visits appear here."}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

