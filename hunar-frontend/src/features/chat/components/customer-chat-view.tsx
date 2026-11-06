"use client";

import { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { useLocale } from "next-intl";
import { formatJobDate } from "@/lib/format";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Loader2,
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
import {
  sendChatMessage,
  uploadChatImage,
  getMessagesByJob,
  parseVoiceNote,
  encodeVoiceNote,
  uploadVoiceNote,
  storeVoiceInCache,
  blobToBase64,
  listConversations,
} from "../api/chat-api";
import {
  joinConversationRoom,
  subscribeToMessages,
  subscribeToReadReceipts,
  subscribeToTyping,
  sendTyping,
  sendStopTyping,
  markConversationRead,
} from "@/services/worker/chat.service";
import { getStoredUser, getAccessToken, getRefreshToken } from "@/lib/api-client";
import { getCustomerVisits } from "@/features/customer-visits/api/customer-visits-api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  isRead?: boolean;
  createdAt?: string;
}

function getVisitStateBadge(rawStatus?: string | null, isUrdu = false) {
  const s = rawStatus?.toUpperCase() || "";

  if (s === "VISIT_IN_PROGRESS" || s === "IN_PROGRESS" || s === "STARTED") {
    return {
      label: isUrdu ? "وزٹ جاری ہے" : "Visit in Progress",
      className: "text-amber-800 bg-amber-50 border-amber-300/80",
      dotColor: "bg-amber-500 animate-pulse",
    };
  }

  if (s === "EN_ROUTE" || s === "DISPATCHED") {
    return {
      label: isUrdu ? "راستے میں ہے" : "Heading to Location",
      className: "text-sky-800 bg-sky-50 border-sky-300/80",
      dotColor: "bg-sky-500 animate-pulse",
    };
  }

  if (s === "ARRIVED") {
    return {
      label: isUrdu ? "دہلیز پر پہنچ گئے" : "Arrived at Doorstep",
      className: "text-purple-800 bg-purple-50 border-purple-300/80",
      dotColor: "bg-purple-500 animate-pulse",
    };
  }

  if (s === "SCHEDULED" || s === "VISIT_SCHEDULED") {
    return {
      label: isUrdu ? "شیڈول وزٹ" : "Visit Scheduled",
      className: "text-[#0F8B8D] bg-[#0F8B8D]/10 border-[#0F8B8D]/25",
      dotColor: "bg-[#0F8B8D]",
    };
  }

  if (s === "WORKER_ASSIGNED" || s === "OFFER_ACCEPTED") {
    return {
      label: isUrdu ? "کاریگر مقرر" : "Technician Assigned",
      className: "text-blue-800 bg-blue-50 border-blue-300/80",
      dotColor: "bg-blue-500",
    };
  }

  if (s === "INSPECTION_DONE") {
    return {
      label: isUrdu ? "معائنہ مکمل" : "Inspection Done",
      className: "text-emerald-800 bg-emerald-50 border-emerald-300/80",
      dotColor: "bg-emerald-500",
    };
  }

  if (s === "REPAIR_NEGOTIATING") {
    return {
      label: isUrdu ? "تخمینہ زیر جائزہ" : "Quote Review",
      className: "text-orange-800 bg-orange-50 border-orange-300/80",
      dotColor: "bg-orange-500 animate-pulse",
    };
  }

  if (s === "REPAIR_APPROVED") {
    return {
      label: isUrdu ? "مرمت جاری ہے" : "Repair in Progress",
      className: "text-teal-800 bg-teal-50 border-teal-300/80",
      dotColor: "bg-teal-500 animate-pulse",
    };
  }

  const clean = s
    ? s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
    : isUrdu
    ? "فعال وزٹ"
    : "Active Visit";

  return {
    label: clean,
    className: "text-slate-700 bg-slate-100 border-slate-300/70",
    dotColor: "bg-slate-400",
  };
}

export function CustomerChatView() {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const jobIdParam = searchParams.get("jobId");
  const visitIdParam = searchParams.get("visitId");
  const isFromSpecificOrder = Boolean(jobIdParam || visitIdParam);

  // Local real-time latest message cache to update sidebar immediately without page refresh
  const [latestMessages, setLatestMessages] = useState<
    Record<string, { text: string; time: string; timestamp: number }>
  >({});

  const hasCustomerAuth = Boolean(getAccessToken("CUSTOMER") || getRefreshToken("CUSTOMER"));

  // Fetch all customer visits
  const { data: visits, isLoading: isVisitsLoading } = useQuery({
    queryKey: ["customer", "visits"],
    queryFn: getCustomerVisits,
    staleTime: 30_000,
    enabled: hasCustomerAuth,
  });

  // Fetch all conversations from /chat/conversations
  const { data: rawConversations, isLoading: isConvsLoading } = useQuery({
    queryKey: ["customer", "conversations"],
    queryFn: listConversations,
    staleTime: 30_000,
    enabled: hasCustomerAuth,
  });

  const isLoadingList =
    (isVisitsLoading || isConvsLoading) &&
    (!visits || visits.length === 0) &&
    (!rawConversations || rawConversations.length === 0);

  // Helper: Strictly filter out completed, cancelled, paid, reviewed, disputed jobs
  const isCompletedOrInactive = (status?: string | null): boolean => {
    if (!status) return false;
    const s = status.toUpperCase();
    return (
      s === "COMPLETED" ||
      s.includes("COMPLETE") ||
      s === "CANCELLED" ||
      s === "PAID" ||
      s === "REVIEWED" ||
      s === "DISPUTED"
    );
  };

  // Unified chat targets list (ONLY active and ongoing visits & conversations)
  const rawChatTargets = useMemo(() => {
    const list: Array<{
      id: string;
      jobId: string;
      visitId?: string;
      jobTitle: string;
      jobTitleUr?: string;
      scheduledDate?: string;
      scheduledTimeSlot?: string;
      technician: {
        id: string;
        name: string;
        nameUr?: string;
        avatarUrl?: string | null;
        phone?: string;
        businessName?: string;
      };
      status: string;
      isActiveVisit: boolean;
      lastMessage?: string;
      lastMessageAt?: string;
      unreadCount?: number;
    }> = [];

    const seenJobIds = new Set<string>();

    // 1. Add visits that have an assigned technician and are NOT completed
    for (const v of visits ?? []) {
      const matchingConv = (rawConversations ?? []).find(
        (c) => c.jobId === v.jobId
      );
      const effectiveJobStatus = matchingConv?.job?.status;

      // Filter out if visit or job is completed/cancelled
      if (isCompletedOrInactive(v.status) || isCompletedOrInactive(effectiveJobStatus)) {
        continue;
      }

      seenJobIds.add(v.jobId);
      list.push({
        id: v.id,
        jobId: v.jobId,
        visitId: v.id,
        jobTitle: v.jobTitle,
        jobTitleUr: v.jobTitleUr,
        scheduledDate: v.scheduledDate,
        scheduledTimeSlot: v.scheduledTimeSlot,
        technician: {
          id: v.technician.id,
          name: v.technician.name,
          nameUr: v.technician.nameUr,
          avatarUrl: v.technician.avatarUrl,
          phone: v.technician.phone,
          businessName: v.technician.businessName,
        },
        status: effectiveJobStatus || v.status,
        isActiveVisit: true,
        unreadCount: matchingConv?.unreadCount ?? 0,
        lastMessage: matchingConv?.lastMessage,
        lastMessageAt: matchingConv?.lastMessageAt,
      });
    }

    // 2. Add active / scheduled conversations that don't have a visit row
    for (const c of rawConversations ?? []) {
      const jobStatus = c.job?.status;
      if (isCompletedOrInactive(jobStatus)) {
        continue;
      }

      if (seenJobIds.has(c.jobId)) {
        const match = list.find((t) => t.jobId === c.jobId);
        if (match) {
          if (c.unreadCount !== undefined) match.unreadCount = c.unreadCount;
          if (!match.lastMessage && c.lastMessage) match.lastMessage = c.lastMessage;
          if (!match.lastMessageAt && c.lastMessageAt) match.lastMessageAt = c.lastMessageAt;
          if (jobStatus) match.status = jobStatus;
        }
        continue;
      }

      seenJobIds.add(c.jobId);
      list.push({
        id: c.jobId || c.id,
        jobId: c.jobId,
        jobTitle: c.job?.title || "Service Request",
        technician: {
          id: c.workerId,
          name: c.worker?.name || "Technician",
          avatarUrl: c.worker?.avatarUrl,
        },
        status: jobStatus || "SCHEDULED",
        isActiveVisit: false,
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt || c.updatedAt,
        unreadCount: c.unreadCount ?? 0,
      });
    }

    return list;
  }, [visits, rawConversations]);

  // Sort targets dynamically by latest real-time message activity
  const allChatTargets = useMemo(() => {
    return [...rawChatTargets].sort((a, b) => {
      const timeA =
        latestMessages[a.id]?.timestamp ||
        latestMessages[a.jobId]?.timestamp ||
        (a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0);

      const timeB =
        latestMessages[b.id]?.timestamp ||
        latestMessages[b.jobId]?.timestamp ||
        (b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0);

      if (timeA && timeB && timeA !== timeB) {
        return timeB - timeA;
      }
      if (a.isActiveVisit && !b.isActiveVisit) return -1;
      if (!a.isActiveVisit && b.isActiveVisit) return 1;
      return 0;
    });
  }, [rawChatTargets, latestMessages]);

  // Selected visit ID state
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(() => {
    if (jobIdParam || visitIdParam) {
      const match = (visits ?? []).find(
        (v) => v.jobId === jobIdParam || v.id === visitIdParam
      );
      if (match) return match.id;
    }
    return null;
  });

  // Keep selectedVisitId in sync if URL params change or allChatTargets load
  useEffect(() => {
    if (jobIdParam || visitIdParam) {
      const match = allChatTargets.find(
        (t) => t.jobId === jobIdParam || t.visitId === visitIdParam || t.id === visitIdParam
      );
      if (match) {
        setSelectedVisitId(match.id);
        return;
      }
    }
    // Auto-select first conversation on desktop if none selected
    if (
      !selectedVisitId &&
      allChatTargets.length > 0 &&
      typeof window !== "undefined" &&
      window.innerWidth >= 1024
    ) {
      setSelectedVisitId(allChatTargets[0].id);
    }
  }, [jobIdParam, visitIdParam, allChatTargets, selectedVisitId]);

  // Pre-join conversation rooms for all scheduled/active targets so incoming messages are received in 0ms
  useEffect(() => {
    for (const target of allChatTargets) {
      if (target.jobId) joinConversationRoom(target.jobId);
      if (target.id && target.id !== target.jobId) joinConversationRoom(target.id);
    }
  }, [allChatTargets]);

  // Active visit / target object
  const currentVisit = useMemo(() => {
    if (!selectedVisitId) return null;
    return allChatTargets.find((v) => v.id === selectedVisitId) || null;
  }, [selectedVisitId, allChatTargets]);

  // Search query for filtering technician list
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVisits = useMemo(() => {
    if (!searchQuery.trim()) return allChatTargets;
    const q = searchQuery.toLowerCase();
    return allChatTargets.filter(
      (v) =>
        v.technician.name.toLowerCase().includes(q) ||
        (v.technician.nameUr && v.technician.nameUr.toLowerCase().includes(q)) ||
        v.jobTitle.toLowerCase().includes(q) ||
        (v.jobTitleUr && v.jobTitleUr.toLowerCase().includes(q)) ||
        v.id.toLowerCase().includes(q)
    );
  }, [allChatTargets, searchQuery]);

  // Messages state grouped by visit ID
  const [messagesByVisit, setMessagesByVisit] = useState<Record<string, ChatMessage[]>>({});
  const [chatPages, setChatPages] = useState<Record<string, number>>({});
  const [hasOlderMsgs, setHasOlderMsgs] = useState<Record<string, boolean>>({});
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [loadingVisits, setLoadingVisits] = useState<Record<string, boolean>>({});

  // Unread badge counts per visit / conversation
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const hasFetchedRef = useRef<Set<string>>(new Set());
  // Real-time technician typing state
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  // Scroll compensation refs for pagination & message arrivals
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const isPrependingOlderRef = useRef(false);
  const prevScrollHeightRef = useRef(0);
  const prevScrollTopRef = useRef(0);
  const prevSelectedVisitIdRef = useRef<string | null>(null);

  // Synchronized refs so socket callbacks never have stale closures
  const allChatTargetsRef = useRef(allChatTargets);
  useEffect(() => {
    allChatTargetsRef.current = allChatTargets;
  }, [allChatTargets]);

  const selectedVisitIdRef = useRef(selectedVisitId);
  useEffect(() => {
    selectedVisitIdRef.current = selectedVisitId;
  }, [selectedVisitId]);

  const currentVisitRef = useRef(currentVisit);
  useEffect(() => {
    currentVisitRef.current = currentVisit;
  }, [currentVisit]);

  // Background pre-fetching: pre-load top chat targets so clicking any conversation opens in 0ms
  useEffect(() => {
    if (!allChatTargets.length) return;
    for (const target of allChatTargets.slice(0, 6)) {
      const targetJobId = target.jobId || target.id;
      if (!targetJobId || hasFetchedRef.current.has(targetJobId)) continue;
      hasFetchedRef.current.add(targetJobId);
      hasFetchedRef.current.add(target.id);

      getMessagesByJob(targetJobId, 1, 30)
        .then((backendMsgs) => {
          if (!backendMsgs || backendMsgs.length === 0) {
            setMessagesByVisit((prev) => ({
              ...prev,
              [target.id]: prev[target.id] || [],
              [targetJobId]: prev[targetJobId] || [],
            }));
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
              jobId: m.jobId || voice?.jobId || targetJobId,
              sender: isFromMe ? "customer" : "technician",
              type: msgType,
              messageType: msgType,
              text: voice ? undefined : (m.text || m.content),
              audioUrl: voice?.audioUrl,
              durationSeconds: voice?.durationSeconds,
              imageUrl: m.imageUrl,
              isRead: Boolean((m as any).isRead),
              time: new Date(m.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              createdAt: m.createdAt,
            };
          });
          const seenIds = new Set<string>();
          const uniqueFormatted = formatted.filter((m) => {
            if (m.id && seenIds.has(m.id)) return false;
            if (m.id) seenIds.add(m.id);
            return true;
          });
          setMessagesByVisit((prev) => ({
            ...prev,
            [target.id]: uniqueFormatted,
            [targetJobId]: uniqueFormatted,
          }));
        })
        .catch(() => {});
    }
  }, [allChatTargets]);

  // Sync server unread counts directly into local state without clobbering real-time badge increments
  useEffect(() => {
    if (!rawChatTargets.length) return;
    setUnreadCounts((prev) => {
      const next = { ...prev };
      for (const t of rawChatTargets) {
        if (selectedVisitId && (t.id === selectedVisitId || t.jobId === selectedVisitId)) {
          next[t.id] = 0;
          if (t.jobId) next[t.jobId] = 0;
          continue;
        }
        const serverCount = t.unreadCount ?? 0;
        const currentCount = prev[t.id] ?? (t.jobId ? prev[t.jobId] : undefined) ?? 0;
        const finalCount = Math.max(serverCount, currentCount);
        next[t.id] = finalCount;
        if (t.jobId) next[t.jobId] = finalCount;
      }
      return next;
    });
  }, [rawChatTargets, selectedVisitId]);

  // When a technician chat is opened, clear their unread count and inform backend
  useEffect(() => {
    if (selectedVisitId) {
      setUnreadCounts((prev) => {
        const next = { ...prev, [selectedVisitId]: 0 };
        const active = allChatTargets.find((t) => t.id === selectedVisitId);
        if (active?.jobId) next[active.jobId] = 0;
        return next;
      });
      setIsPartnerTyping(false);
    }
    if (currentVisit?.jobId) {
      void markConversationRead(currentVisit.jobId);
    }
  }, [selectedVisitId, currentVisit?.jobId, allChatTargets]);

  const messages = useMemo(() => {
    if (!currentVisit) return [];
    const raw =
      messagesByVisit[currentVisit.id] ||
      (currentVisit.jobId ? messagesByVisit[currentVisit.jobId] : undefined) ||
      [];
    const seen = new Set<string>();
    const unique: ChatMessage[] = [];
    for (const m of raw) {
      const key = m.id || m.messageId;
      if (key && seen.has(key)) continue;
      if (key) seen.add(key);
      unique.push(m);
    }
    return unique;
  }, [currentVisit, messagesByVisit]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    } else if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useLayoutEffect(() => {
    // 1. If older messages were prepended, compensate scrollTop so the viewport stays on the same message
    if (isPrependingOlderRef.current && messagesContainerRef.current) {
      isPrependingOlderRef.current = false;
      const newScrollHeight = messagesContainerRef.current.scrollHeight;
      const diff = newScrollHeight - prevScrollHeightRef.current;
      messagesContainerRef.current.scrollTop = prevScrollTopRef.current + diff;
      return;
    }

    if (!selectedVisitId) return;

    // 2. If switched conversation, instantly jump to bottom
    if (selectedVisitId !== prevSelectedVisitIdRef.current) {
      prevSelectedVisitIdRef.current = selectedVisitId;
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      } else {
        scrollToBottom("auto");
      }
      return;
    }

    // 3. If new message was sent/received or partner typing status changed:
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 220;
      const lastMsg = messages[messages.length - 1];
      const isMyMessage = lastMsg?.sender === "customer";

      // Auto-scroll if user is already near bottom or if it's their own message
      if (isMyMessage || isNearBottom) {
        scrollToBottom("smooth");
      }
    }
  }, [messages, selectedVisitId, isPartnerTyping]);

  // Load real messages for current visit with instant optimistic render
  useEffect(() => {
    if (!currentVisit?.jobId) return;
    let isCancelled = false;
    const targetId = currentVisit.id;
    const targetJobId = currentVisit.jobId;

    // Immediately join the job room so real-time socket events flow immediately
    joinConversationRoom(targetJobId);
    void markConversationRead(targetJobId);

    const existing = messagesByVisit[targetId] || messagesByVisit[targetJobId];
    const isAlreadyFetched = hasFetchedRef.current.has(targetId) || hasFetchedRef.current.has(targetJobId);

    // If chat has a known lastMessage and nothing loaded yet, seed optimistic message in 0ms
    if (!existing?.length && currentVisit.lastMessage) {
      const voice = parseVoiceNote(currentVisit.lastMessage);
      const msgType: "text" | "voice" | "image" = voice ? "voice" : "text";
      const optimisticSeed: ChatMessage = {
        id: `seed-${targetId}`,
        sender: "technician",
        type: msgType,
        messageType: msgType,
        text: voice ? undefined : currentVisit.lastMessage,
        audioUrl: voice?.audioUrl,
        durationSeconds: voice?.durationSeconds,
        isRead: true,
        time: currentVisit.lastMessageAt
          ? new Date(currentVisit.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "",
        createdAt: currentVisit.lastMessageAt || new Date().toISOString(),
      };
      setMessagesByVisit((prev) => ({
        ...prev,
        [targetId]: [optimisticSeed],
        [targetJobId]: [optimisticSeed],
      }));
    }

    // Only set loading indicator if this chat has never been fetched and has no existing messages
    if (!existing?.length && !currentVisit.lastMessage && !isAlreadyFetched) {
      setLoadingVisits((prev) => ({ ...prev, [targetId]: true, [targetJobId]: true }));
    }

    hasFetchedRef.current.add(targetId);
    hasFetchedRef.current.add(targetJobId);

    getMessagesByJob(targetJobId, 1, 30)
      .then((backendMsgs) => {
        if (isCancelled) return;
        setLoadingVisits((prev) => ({ ...prev, [targetId]: false, [targetJobId]: false }));
        setChatPages((prev) => ({ ...prev, [targetId]: 1, [targetJobId]: 1 }));
        setHasOlderMsgs((prev) => ({
          ...prev,
          [targetId]: (backendMsgs?.length ?? 0) >= 30,
          [targetJobId]: (backendMsgs?.length ?? 0) >= 30,
        }));

        if (!backendMsgs || backendMsgs.length === 0) {
          setMessagesByVisit((prev) => ({
            ...prev,
            [targetId]: (prev[targetId] || []).filter((m) => !m.id.startsWith("seed-")),
            [targetJobId]: (prev[targetJobId] || []).filter((m) => !m.id.startsWith("seed-")),
          }));
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
            jobId: m.jobId || voice?.jobId || targetJobId,
            sender: isFromMe ? "customer" : "technician",
            type: msgType,
            messageType: msgType,
            text: voice ? undefined : (m.text || m.content),
            audioUrl: voice?.audioUrl,
            durationSeconds: voice?.durationSeconds,
            imageUrl: m.imageUrl,
            isRead: Boolean((m as any).isRead),
            time: new Date(m.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            createdAt: m.createdAt,
          };
        });

        const seenIds = new Set<string>();
        const uniqueFormatted = formatted.filter((m) => {
          if (m.id && seenIds.has(m.id)) return false;
          if (m.id) seenIds.add(m.id);
          return true;
        });

        setMessagesByVisit((prev) => {
          const existingForVisit = prev[targetId] || prev[targetJobId] || [];
          const tempMsgs = existingForVisit.filter((m) => m.id.startsWith("msg-"));
          const merged = [...uniqueFormatted, ...tempMsgs.filter((t) => !seenIds.has(t.id))];
          return {
            ...prev,
            [targetId]: merged,
            [targetJobId]: merged,
          };
        });

        if (backendMsgs[0]?.conversationId) {
          joinConversationRoom(backendMsgs[0].conversationId);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setLoadingVisits((prev) => ({ ...prev, [targetId]: false, [targetJobId]: false }));
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [currentVisit?.id, currentVisit?.jobId]);

  const handleLoadOlder = async () => {
    if (!currentVisit?.jobId || isLoadingOlder) return;
    const targetId = currentVisit.id;
    const targetJobId = currentVisit.jobId;
    const curPage = chatPages[targetId] || chatPages[targetJobId] || 1;
    setIsLoadingOlder(true);

    if (messagesContainerRef.current) {
      prevScrollHeightRef.current = messagesContainerRef.current.scrollHeight;
      prevScrollTopRef.current = messagesContainerRef.current.scrollTop;
      isPrependingOlderRef.current = true;
    }

    try {
      const olderMsgs = await getMessagesByJob(targetJobId, curPage + 1, 30);
      if (!olderMsgs || olderMsgs.length === 0) {
        setHasOlderMsgs((prev) => ({
          ...prev,
          [targetId]: false,
          [targetJobId]: false,
        }));
        isPrependingOlderRef.current = false;
      } else {
        const currentUserId = getStoredUser()?.id;
        const formattedOlder: ChatMessage[] = olderMsgs.map((m) => {
          const isFromMe = currentUserId ? m.senderId === currentUserId : m.senderRole === "CUSTOMER";
          const voice = parseVoiceNote(m.text || m.content);
          const msgType: "text" | "voice" | "image" = voice ? "voice" : m.imageUrl ? "image" : "text";
          return {
            id: m.id,
            messageId: m.id,
            senderId: m.senderId,
            receiverId: m.receiverId || voice?.receiverId,
            jobId: m.jobId || voice?.jobId || targetJobId,
            sender: isFromMe ? "customer" : "technician",
            type: msgType,
            messageType: msgType,
            text: voice ? undefined : (m.text || m.content),
            audioUrl: voice?.audioUrl,
            durationSeconds: voice?.durationSeconds,
            imageUrl: m.imageUrl,
            isRead: Boolean((m as any).isRead),
            time: new Date(m.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            createdAt: m.createdAt,
          };
        });
        setMessagesByVisit((prev) => {
          const existing = prev[targetId] || prev[targetJobId] || [];
          const existingIds = new Set(existing.map((m) => m.id || m.messageId));
          const uniqueOlder = formattedOlder.filter((m) => !existingIds.has(m.id));
          const merged = [...uniqueOlder, ...existing];
          return {
            ...prev,
            [targetId]: merged,
            [targetJobId]: merged,
          };
        });
        setChatPages((prev) => ({
          ...prev,
          [targetId]: curPage + 1,
          [targetJobId]: curPage + 1,
        }));
        if (olderMsgs.length < 30) {
          setHasOlderMsgs((prev) => ({
            ...prev,
            [targetId]: false,
            [targetJobId]: false,
          }));
        }
      }
    } catch (err) {
      console.warn("Failed to load older messages:", err);
      isPrependingOlderRef.current = false;
    } finally {
      setIsLoadingOlder(false);
    }
  };

  // Real-time incoming message, read receipt, and typing listeners for active conversation
  useEffect(() => {
    const unsubMsg = subscribeToMessages((msg) => {
      // Deduplicate incoming messages so same socket packet isn't processed twice
      const msgKey = msg.id || (msg as any).messageId;
      if (msgKey) {
        if (seenMessageIdsRef.current.has(msgKey)) return;
        seenMessageIdsRef.current.add(msgKey);
      }

      // Invalidate queries so conversation snippet and unread badges sync with backend
      void queryClient.invalidateQueries({ queryKey: ["customer", "conversations"] });

      const voice = parseVoiceNote(msg.text || (msg as any).content);
      const textPreview = voice
        ? (isUrdu ? "وائس نوٹ 🎤" : "Voice Note 🎤")
        : msg.imageUrl
        ? (isUrdu ? "تصویر 📷" : "Photo 📷")
        : msg.text || (msg as any).content || "";
      const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const ts = new Date(msg.createdAt).getTime();

      const targets = allChatTargetsRef.current;
      const curSelected = selectedVisitIdRef.current;
      const curVisit = currentVisitRef.current;

      // Match against active visit or any target in the chat list
      const matchedTarget = targets.find(
        (t) =>
          (msg.jobId && (t.jobId === msg.jobId || t.id === msg.jobId)) ||
          (msg.conversationId && (t.id === msg.conversationId || t.jobId === msg.conversationId))
      );

      const targetId =
        matchedTarget?.id ||
        (curVisit && (curVisit.jobId === msg.jobId || curVisit.id === msg.conversationId || curVisit.jobId === msg.conversationId)
          ? curVisit.id
          : msg.jobId || msg.conversationId || null);

      const targetJobId = matchedTarget?.jobId || msg.jobId || null;

      // Record latest message in real-time map for instant sidebar update
      const latestObj = { text: textPreview, time: timeStr, timestamp: ts };
      setLatestMessages((prev) => {
        const next = { ...prev };
        if (msg.jobId) next[msg.jobId] = latestObj;
        if (msg.conversationId) next[msg.conversationId] = latestObj;
        if (targetId) next[targetId] = latestObj;
        if (targetJobId) next[targetJobId] = latestObj;
        return next;
      });

      const currentUserId = getStoredUser()?.id;
      const isFromMe = currentUserId
        ? msg.senderId === currentUserId
        : String(msg.senderRole).toUpperCase() === "CUSTOMER";

      const isCurrentlyWatching = Boolean(
        curSelected && (
          (targetId && curSelected === targetId) ||
          (targetJobId && curSelected === targetJobId) ||
          (matchedTarget && (curSelected === matchedTarget.id || (matchedTarget.jobId && curSelected === matchedTarget.jobId)))
        )
      );

      // If technician sent a message while we are watching, mark it read immediately and reset typing
      if (!isFromMe && isCurrentlyWatching) {
        setIsPartnerTyping(false);
        if (targetJobId) {
          void markConversationRead(targetJobId);
        }
      } else if (!isFromMe && !isCurrentlyWatching) {
        // Increment unread count badge for this technician card cleanly by exactly 1
        setUnreadCounts((prev) => {
          const next = { ...prev };
          const existingCount = Math.max(
            targetId ? (prev[targetId] ?? 0) : 0,
            targetJobId ? (prev[targetJobId] ?? 0) : 0,
            matchedTarget?.unreadCount ?? 0
          );
          const newCount = existingCount + 1;

          if (targetId) next[targetId] = newCount;
          if (targetJobId) next[targetJobId] = newCount;
          if (msg.jobId) next[msg.jobId] = newCount;
          if (msg.conversationId) next[msg.conversationId] = newCount;
          return next;
        });
      }

      if (targetId) {
        setMessagesByVisit((prev) => {
          const existing = prev[targetId] || (targetJobId ? prev[targetJobId] : undefined) || [];
          if (existing.some((m) => m.id === msg.id || (m.messageId && m.messageId === msg.id))) return prev;

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
                isRead: Boolean(msg.isRead),
                audioUrl: voice?.audioUrl || copy[tempIdx].audioUrl,
              };
              const res: Record<string, ChatMessage[]> = { ...prev, [targetId]: copy };
              if (targetJobId) res[targetJobId] = copy;
              return res;
            }
            return prev;
          }

          // It is from the technician!
          const newMsg: ChatMessage = {
            id: msg.id,
            messageId: msg.id,
            senderId: msg.senderId,
            receiverId: msg.receiverId || voice?.receiverId,
            jobId: msg.jobId || voice?.jobId || targetJobId || undefined,
            sender: "technician",
            type: msgType,
            messageType: msgType,
            text: voice ? undefined : msg.text || (msg as any).content,
            audioUrl: voice?.audioUrl,
            durationSeconds: voice?.durationSeconds,
            imageUrl: msg.imageUrl,
            isRead: Boolean(msg.isRead),
            time: timeStr,
            createdAt: msg.createdAt,
          };
          const nextList = [...existing, newMsg];
          const res: Record<string, ChatMessage[]> = {
            ...prev,
            [targetId]: nextList,
          };
          if (targetJobId) res[targetJobId] = nextList;
          return res;
        });
      }
    });

    const unsubRead = subscribeToReadReceipts((receipt) => {
      const currentUserId = getStoredUser()?.id;
      // Do not mark own sent messages as read when own client emits/triggers a read receipt
      if (receipt.readerId && currentUserId && receipt.readerId === currentUserId) {
        return;
      }

      const curVisit = currentVisitRef.current;
      const targets = allChatTargetsRef.current;

      const isCurrent = Boolean(
        (receipt.jobId && curVisit?.jobId && receipt.jobId === curVisit.jobId) ||
        (receipt.conversationId && curVisit?.id && receipt.conversationId === curVisit.id) ||
        (receipt.conversationId && curVisit?.jobId && receipt.conversationId === curVisit.jobId) ||
        (receipt.conversationId && targets.some(
          (t) =>
            curVisit &&
            (t.id === curVisit.id || t.jobId === curVisit.jobId) &&
            (t.id === receipt.conversationId || t.jobId === receipt.conversationId)
        ))
      );

      if (isCurrent && curVisit?.id) {
        setMessagesByVisit((prev) => {
          const next = { ...prev };
          const keys = [curVisit.id, curVisit.jobId].filter(Boolean) as string[];
          let updatedAny = false;
          for (const k of keys) {
            if (next[k]) {
              next[k] = next[k].map((m) =>
                m.sender === "customer" ? { ...m, isRead: true } : m
              );
              updatedAny = true;
            }
          }
          return updatedAny ? next : prev;
        });
      }
    });

    const unsubTyping = subscribeToTyping((payload) => {
      const currentUserId = getStoredUser()?.id;
      if (payload.userId && payload.userId === currentUserId) return;
      if (payload.role === "CUSTOMER") return;

      const curVisit = currentVisitRef.current;
      const matchJob = payload.jobId && curVisit?.jobId && payload.jobId === curVisit.jobId;
      const matchConv = payload.conversationId && curVisit?.jobId && payload.conversationId === curVisit.jobId;
      if (matchJob || matchConv) {
        setIsPartnerTyping(payload.isTyping);
      }
    });

    return () => {
      unsubMsg();
      unsubRead();
      unsubTyping();
    };
  }, [isUrdu, queryClient]);

  const handleSendMessage = (text: string) => {
    if (!currentVisit) return;
    const visitId = currentVisit.id;
    const tempId = `msg-${Date.now()}`;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Update real-time latest message cache immediately
    setLatestMessages((prev) => ({
      ...prev,
      [visitId]: { text, time: timeStr, timestamp: now.getTime() },
      [currentVisit.jobId]: { text, time: timeStr, timestamp: now.getTime() },
    }));

    const newMsg: ChatMessage = {
      id: tempId,
      sender: "customer",
      type: "text",
      text,
      isRead: false,
      time: timeStr,
    };

    setMessagesByVisit((prev) => ({
      ...prev,
      [visitId]: [...(prev[visitId] || []), newMsg],
    }));

    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }

    sendChatMessage(currentVisit.jobId || "job-1", text, { isJobId: true })
      .then((sent) => {
        setMessagesByVisit((prev) => {
          const existing = prev[visitId] || [];
          return {
            ...prev,
            [visitId]: existing.map((m) =>
              m.id === tempId ? { ...m, id: sent.id, isRead: Boolean(sent.isRead) } : m
            ),
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
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const voiceLabel = isUrdu ? "وائس نوٹ 🎤" : "Voice Note 🎤";

    // Update real-time latest message cache immediately
    setLatestMessages((prev) => ({
      ...prev,
      [visitId]: { text: voiceLabel, time: timeStr, timestamp: now.getTime() },
      [currentVisit.jobId]: { text: voiceLabel, time: timeStr, timestamp: now.getTime() },
    }));

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
      isRead: false,
      time: timeStr,
      createdAt: now.toISOString(),
    };

    setMessagesByVisit((prev) => ({
      ...prev,
      [visitId]: [...(prev[visitId] || []), optimisticMsg],
    }));

    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }

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
                  isRead: Boolean(sent.isRead),
                }
              : m
          ),
        };
      });

      if (sent.conversationId) {
        joinConversationRoom(sent.conversationId);
      }
      void queryClient.invalidateQueries({ queryKey: ["customer", "conversations"] });
    } catch (err) {
      console.error("Failed to upload/send customer voice note:", err);
    }
  };

  const handleSendImage = async (file: File) => {
    if (!currentVisit) return;
    const visitId = currentVisit.id;
    const previewUrl = URL.createObjectURL(file);
    const tempId = `msg-${Date.now()}`;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const imageLabel = isUrdu ? "تصویر 📷" : "Photo 📷";

    // Update real-time latest message cache immediately
    setLatestMessages((prev) => ({
      ...prev,
      [visitId]: { text: imageLabel, time: timeStr, timestamp: now.getTime() },
      [currentVisit.jobId]: { text: imageLabel, time: timeStr, timestamp: now.getTime() },
    }));

    const newMsg: ChatMessage = {
      id: tempId,
      sender: "customer",
      type: "image",
      imageUrl: previewUrl,
      isRead: false,
      time: timeStr,
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
        void queryClient.invalidateQueries({ queryKey: ["customer", "conversations"] });
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

  // Helper for technician card last message (checks reactive override first, then loaded messages, then backend)
  const getLastMessage = (target: { id: string; jobId: string; lastMessage?: string }) => {
    const override = latestMessages[target.id] || latestMessages[target.jobId];
    if (override?.text) return override.text;

    const list = messagesByVisit[target.id] || messagesByVisit[target.jobId];
    if (list && list.length > 0) {
      const last = list[list.length - 1];
      if (last.type === "voice") return isUrdu ? "وائس نوٹ 🎤" : "Voice Note 🎤";
      if (last.type === "image") return isUrdu ? "تصویر 📷" : "Photo 📷";
      return last.text || "";
    }

    if (target.lastMessage) {
      if (target.lastMessage.startsWith("{") && target.lastMessage.includes('"type":"voice"')) {
        return isUrdu ? "وائس نوٹ 🎤" : "Voice Note 🎤";
      }
      return target.lastMessage;
    }

    return isUrdu ? "کوئی نیا پیغام نہیں" : "No messages yet";
  };

  const getLastMessageTime = (target: { id: string; jobId: string; lastMessageAt?: string }) => {
    const override = latestMessages[target.id] || latestMessages[target.jobId];
    if (override?.time) return override.time;

    const list = messagesByVisit[target.id] || messagesByVisit[target.jobId];
    if (list && list.length > 0) {
      return list[list.length - 1].time;
    }

    if (target.lastMessageAt) {
      try {
        return new Date(target.lastMessageAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return "";
      }
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
                    {allChatTargets.length} {isUrdu ? "گفتگو" : "Chats"}
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
            {isLoadingList ? (
              <div className="space-y-2.5 p-1">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="w-full p-3.5 rounded-2xl bg-white border border-slate-200/80 animate-pulse flex items-start gap-3"
                  >
                    <div className="size-12 rounded-2xl bg-slate-200 shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3.5 bg-slate-200 rounded w-2/3" />
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                      <div className="h-2.5 bg-slate-100 rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredVisits.length > 0 ? (
              filteredVisits.map((visit) => {
                const isSelected = selectedVisitId === visit.id || (visit.jobId && selectedVisitId === visit.jobId);
                const unread = isSelected
                  ? 0
                  : Math.max(
                      unreadCounts[visit.id] ?? 0,
                      unreadCounts[visit.jobId] ?? 0,
                      visit.unreadCount ?? 0
                    );
                const lastMsg = getLastMessage(visit);
                const lastTime = getLastMessageTime(visit);

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
                            loading="lazy"
                            decoding="async"
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

                      {/* Visit State Pill (Always state, never date) */}
                      <div className="flex items-center gap-1.5 pt-0.5">
                        {(() => {
                          const badge = getVisitStateBadge(visit.status, isUrdu);
                          return (
                            <span
                              className={`inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2 py-0.5 rounded-md border truncate ${badge.className}`}
                            >
                              <span className={`size-1.5 rounded-full shrink-0 ${badge.dotColor}`} />
                              <span className="truncate">{badge.label}</span>
                            </span>
                          );
                        })()}
                      </div>

                      {/* Last Message Preview & Unread Badge */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <p className="text-[11px] text-slate-500 truncate">
                          {lastMsg}
                        </p>
                        {unread > 0 && (
                          <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#0F8B8D] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 shadow-2xs">
                            {unread > 99 ? "99+" : unread}
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
                ? "تمام کاریگر 100% تصدیق شدہ ہیں"
                : "100% Verified Technicians"}
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
                        loading="lazy"
                        decoding="async"
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
              {(() => {
                const badge = getVisitStateBadge(currentVisit.status, isUrdu);
                return (
                  <span
                    className={`inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${badge.className}`}
                  >
                    <span className={`size-1.5 rounded-full shrink-0 ${badge.dotColor}`} />
                    <span>{badge.label}</span>
                  </span>
                );
              })()}
            </div>

            {/* 2. MESSAGES FEED */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 space-y-4 bg-slate-50/30 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {/* Incremental Chat History Pagination */}
              {currentVisit && (hasOlderMsgs[currentVisit.id] ?? (currentVisit.jobId ? hasOlderMsgs[currentVisit.jobId] : false)) && (
                <div className="flex justify-center pb-2">
                  <button
                    type="button"
                    onClick={handleLoadOlder}
                    disabled={isLoadingOlder}
                    className="text-xs font-semibold text-[#0F8B8D] hover:underline py-1.5 px-3 rounded-xl bg-teal-50 hover:bg-teal-100/60 border border-teal-200/60 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {isLoadingOlder && (
                      <span className="size-3 rounded-full border-2 border-teal border-t-transparent animate-spin" />
                    )}
                    <span>{isUrdu ? "پرانے پیغامات دیکھیں" : "Load older messages"}</span>
                  </button>
                </div>
              )}

              {currentVisit && loadingVisits[currentVisit.id] && messages.length === 0 ? (
                <div className="space-y-4 p-4 animate-pulse">
                  <div className="flex justify-start">
                    <div className="h-10 w-48 bg-slate-200/80 rounded-2xl rounded-tl-sm" />
                  </div>
                  <div className="flex justify-end">
                    <div className="h-10 w-40 bg-teal-100/70 rounded-2xl rounded-tr-sm" />
                  </div>
                  <div className="flex justify-start">
                    <div className="h-10 w-56 bg-slate-200/80 rounded-2xl rounded-tl-sm" />
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[240px] text-center p-6 space-y-2">
                  <div className="size-12 rounded-2xl bg-teal-50 border border-teal-200 text-[#0F8B8D] flex items-center justify-center">
                    <ShieldCheck className="size-6 text-[#0F8B8D]" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {isUrdu ? "کوئی پرانا پیغام نہیں ہے" : "No messages yet"}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs">
                    {isUrdu
                      ? "کاریگر سے رابطہ شروع کرنے کے لیے نیچے پیغام یا وائس نوٹ بھیجیں۔"
                      : "Send a message or voice note below to start communicating with your technician."}
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                const isCustomer = msg.sender === "customer";
                const itemKey = msg.id ? `${msg.id}-${idx}` : `msg-${idx}`;

                if (msg.type === "voice") {
                  return (
                    <div
                      key={itemKey}
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
                        {isCustomer && (
                          msg.isRead ? (
                            <CheckCheck className="size-3.5 text-sky-400" aria-label={isUrdu ? "پڑھ لیا گیا" : "Read"} />
                          ) : (
                            <Check className="size-3.5 text-slate-400" aria-label={isUrdu ? "بھیج دیا گیا" : "Sent"} />
                          )
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={itemKey}
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
                          isCustomer ? "text-slate-300" : "text-slate-400"
                        }`}
                      >
                        <span>{msg.time}</span>
                        {isCustomer && (
                          msg.isRead ? (
                            <CheckCheck className="size-3.5 text-sky-400" aria-label={isUrdu ? "پڑھ لیا گیا" : "Read"} />
                          ) : (
                            <Check className="size-3.5 text-slate-300" aria-label={isUrdu ? "بھیج دیا گیا" : "Sent"} />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            {/* Real-time typing indicator */}
            {isPartnerTyping && (
              <div className="flex items-center gap-2 p-2 px-3 rounded-2xl bg-white border border-slate-200/90 text-slate-500 text-xs w-fit shadow-2xs animate-in fade-in-50 duration-150">
                <div className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-[#0F8B8D] animate-bounce [animation-delay:-0.3s]" />
                  <span className="size-1.5 rounded-full bg-[#0F8B8D] animate-bounce [animation-delay:-0.15s]" />
                  <span className="size-1.5 rounded-full bg-[#0F8B8D] animate-bounce" />
                </div>
                <span className="text-[11px] font-medium text-slate-600">
                  {isUrdu
                    ? `${currentVisit.technician.nameUr || currentVisit.technician.name} لکھ رہے ہیں...`
                    : `${currentVisit.technician.name} is typing...`}
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
            </div>

            {/* 3. CHAT INPUT BAR WITH PRESETS */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200/90 shadow-lg shrink-0">
              <ChatInputBar
                onSendMessage={handleSendMessage}
                onSendVoiceNote={handleSendVoiceNote}
                onSendImage={handleSendImage}
                onTyping={() => {
                  if (currentVisit?.jobId) {
                    sendTyping(currentVisit.jobId, currentVisit.jobId);
                  }
                }}
                onStopTyping={() => {
                  if (currentVisit?.jobId) {
                    sendStopTyping(currentVisit.jobId, currentVisit.jobId);
                  }
                }}
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

