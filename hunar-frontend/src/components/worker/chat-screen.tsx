"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CheckCheck, Loader2, Search, Wifi, WifiOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import {
  getConversations,
  getMessages,
  joinConversationRoom,
  leaveConversationRoom,
  markConversationRead,
  sendMessage,
  subscribeToMessages,
  subscribeToReadReceipts,
  subscribeToTyping,
  sendTyping,
  sendStopTyping,
  queryKeys,
} from "@/services/worker/chat.service";
import type { ChatMessage } from "@/types/chat";
import { formatDateTime } from "@/lib/format";
import { VoiceMessageBubble } from "@/features/chat/components/voice-message-bubble";
import {
  parseVoiceNote,
  uploadChatImage,
  uploadVoiceNote,
  encodeVoiceNote,
} from "@/features/chat/api/chat-api";
import { ChatInputBar } from "@/features/chat/components/chat-input-bar";
import { getStoredUser } from "@/lib/api-client";

export function ChatScreen({ conversationId }: { conversationId?: string }) {
  const t = useTranslations("Worker");
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const client = useQueryClient();

  const [activeId, setActiveId] = useState(conversationId);
  const [conversationSearch, setConversationSearch] = useState("");
  const [attachmentError, setAttachmentError] = useState("");
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);
  const [latestMessages, setLatestMessages] = useState<
    Record<string, { text: string; time: string; timestamp: number }>
  >({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const connected = true;

  const conversations = useQuery({
    queryKey: queryKeys.conversations,
    queryFn: getConversations,
  });

  const isScheduledOrActive = (status?: string | null): boolean => {
    if (!status) return true;
    const s = status.toUpperCase();
    return !["COMPLETED", "CANCELLED", "PAID", "REVIEWED", "DISPUTED"].includes(s);
  };

  const selected = useMemo(() => {
    if (!conversations.data || !activeId) return null;
    return (
      conversations.data.find(
        (item) => item.id === activeId || item.jobId === activeId
      ) ?? null
    );
  }, [conversations.data, activeId]);

  // If conversationId was a jobId, align activeId to conversation.id
  useEffect(() => {
    if (selected && selected.id !== activeId) {
      setActiveId(selected.id);
    }
  }, [selected, activeId]);

  // If no conversation is selected yet, default to the first conversation
  useEffect(() => {
    if (!activeId && conversations.data && conversations.data.length > 0) {
      setActiveId(conversations.data[0].id);
    }
  }, [activeId, conversations.data]);

  // Pre-join all active conversation rooms so worker receives messages instantly across all jobs
  useEffect(() => {
    for (const c of conversations.data ?? []) {
      if (c.id) joinConversationRoom(c.id);
      if (c.jobId && c.jobId !== c.id) joinConversationRoom(c.jobId);
    }
  }, [conversations.data]);

  // Sync server unread counts into local state
  useEffect(() => {
    if (!conversations.data) return;
    setUnreadCounts((prev) => {
      const next = { ...prev };
      for (const c of conversations.data) {
        if (c.id === activeId || (selected?.jobId && c.jobId === selected.jobId)) {
          next[c.id] = 0;
          if (c.jobId) next[c.jobId] = 0;
          continue;
        }
        const serverCount = c.unreadCount ?? 0;
        const currentCount = prev[c.id] ?? (c.jobId ? prev[c.jobId] : undefined) ?? 0;
        const count = Math.max(serverCount, currentCount);
        next[c.id] = count;
        if (c.jobId) next[c.jobId] = count;
      }
      return next;
    });
  }, [conversations.data, activeId, selected?.jobId]);

  const messages = useQuery({
    enabled: Boolean(activeId),
    queryKey: queryKeys.messages(activeId ?? ""),
    queryFn: () => getMessages(activeId ?? ""),
  });

  const send = useMutation({
    mutationFn: sendMessage,
    onSuccess: (persisted) => {
      if (activeId) {
        client.setQueryData<ChatMessage[]>(
          queryKeys.messages(activeId),
          (old = []) =>
            old.map((m) =>
              m.id.startsWith("temp-") &&
              (m.text === persisted.text || (m.imageUrl && persisted.imageUrl))
                ? { ...m, id: persisted.id, status: "sent", createdAt: persisted.createdAt }
                : m
            )
        );
      }
      void client.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });

  useEffect(() => {
    if (!activeId) return;
    setUnreadCounts((prev) => ({
      ...prev,
      [activeId]: 0,
      ...(selected?.jobId ? { [selected.jobId]: 0 } : {}),
    }));
    setIsCustomerTyping(false);
    joinConversationRoom(activeId);
    void markConversationRead(activeId);

    const unsubMsg = subscribeToMessages((message) => {
      const msgKey = message.id || (message as any).messageId;
      if (msgKey) {
        if (seenMessageIdsRef.current.has(msgKey)) return;
        seenMessageIdsRef.current.add(msgKey);
      }

      void client.invalidateQueries({ queryKey: queryKeys.conversations });

      const voice = parseVoiceNote(message.text || (message as any).content);
      const textPreview = voice
        ? (isUrdu ? "وائس میسج 🎤" : "Voice message 🎤")
        : message.imageUrl
        ? (isUrdu ? "تصویر 📷" : "Photo 📷")
        : message.text || (message as any).content || "";
      const timeStr = new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const ts = new Date(message.createdAt).getTime();

      if (message.conversationId) {
        setLatestMessages((prev) => ({
          ...prev,
          [message.conversationId]: { text: textPreview, time: timeStr, timestamp: ts },
        }));
      }
      if (message.jobId) {
        setLatestMessages((prev) => ({
          ...prev,
          [message.jobId!]: { text: textPreview, time: timeStr, timestamp: ts },
        }));
      }

      const isCurrentActive =
        message.conversationId === activeId ||
        (selected?.jobId && message.jobId === selected.jobId);

      if (isCurrentActive) {
        if (message.senderRole === "customer") {
          setIsCustomerTyping(false);
          setUnreadCounts((prev) => ({
            ...prev,
            [activeId]: 0,
            ...(selected?.jobId ? { [selected.jobId]: 0 } : {}),
          }));
          void markConversationRead(activeId);
        }

        // Direct in-memory cache update in 0ms (no slow HTTP refetch!)
        client.setQueryData<ChatMessage[]>(
          queryKeys.messages(activeId),
          (old = []) => {
            const alreadyExists = old.some(
              (m) =>
                m.id === message.id ||
                (m.id.startsWith("temp-") &&
                  (m.text === message.text || (m.imageUrl && m.imageUrl === message.imageUrl)))
            );
            if (alreadyExists) {
              return old.map((m) =>
                m.id === message.id ||
                (m.id.startsWith("temp-") &&
                  (m.text === message.text || (m.imageUrl && m.imageUrl === message.imageUrl)))
                  ? { ...m, ...message, status: "sent" }
                  : m
              );
            }
            return [...old, message];
          }
        );
      } else {
        // Incoming message for another conversation -> increment unread badge cleanly by 1
        if (message.senderRole === "customer") {
          const targetKey = message.conversationId || message.jobId;
          if (targetKey) {
            setUnreadCounts((prev) => {
              const currentCount =
                (message.conversationId ? prev[message.conversationId] : undefined) ??
                (message.jobId ? prev[message.jobId] : undefined) ??
                0;
              const newCount = currentCount + 1;
              return {
                ...prev,
                [targetKey]: newCount,
                ...(message.conversationId ? { [message.conversationId]: newCount } : {}),
                ...(message.jobId ? { [message.jobId]: newCount } : {}),
              };
            });
          }
        }
      }
    });

    const unsubRead = subscribeToReadReceipts((receipt) => {
      const currentUserId = getStoredUser()?.id;
      // Do not mark own worker sent messages as read when own client triggers read receipt
      if (receipt.readerId && currentUserId && receipt.readerId === currentUserId) {
        return;
      }

      const matchConv = Boolean(
        (receipt.conversationId && (receipt.conversationId === activeId || receipt.conversationId === selected?.id)) ||
        (receipt.jobId && (receipt.jobId === activeId || (selected?.jobId && receipt.jobId === selected.jobId)))
      );
      if (matchConv) {
        client.setQueryData<ChatMessage[]>(
          queryKeys.messages(activeId),
          (old = []) =>
            old.map((m) => (m.senderRole === "worker" ? { ...m, isRead: true } : m))
        );
      }
    });

    const unsubTyping = subscribeToTyping((payload) => {
      if (payload.role === "WORKER") return;
      const matchConv = payload.conversationId && payload.conversationId === activeId;
      const matchJob = payload.jobId && selected?.jobId && payload.jobId === selected.jobId;
      if (matchConv || matchJob) {
        setIsCustomerTyping(payload.isTyping);
      }
    });

    return () => {
      leaveConversationRoom(activeId);
      unsubMsg();
      unsubRead();
      unsubTyping();
    };
  }, [activeId, client, selected?.jobId, isUrdu]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data?.length, isCustomerTyping]);

  const filteredConversations = useMemo(() => {
    const rawList = conversations.data ?? [];
    // Only show active and scheduled jobs (exclude completed/cancelled)
    const list = rawList.filter((c) => isScheduledOrActive(c.jobStatus));
    const sorted = [...list].sort((a, b) => {
      const timeA =
        latestMessages[a.id]?.timestamp ||
        (a.jobId ? latestMessages[a.jobId]?.timestamp : 0) ||
        (a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0);
      const timeB =
        latestMessages[b.id]?.timestamp ||
        (b.jobId ? latestMessages[b.jobId]?.timestamp : 0) ||
        (b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0);
      return timeB - timeA;
    });

    if (!conversationSearch.trim()) return sorted;
    const q = conversationSearch.toLowerCase();
    return sorted.filter(
      (c) =>
        c.customerName.toLowerCase().includes(q) ||
        (c.jobTitle && c.jobTitle.toLowerCase().includes(q))
    );
  }, [conversations.data, conversationSearch, latestMessages]);

  const workerQuickSuggestions = isUrdu
    ? [
        "میں راستے میں ہوں",
        "میں لوکیشن پر پہنچ گیا ہوں",
        "برائے مہربانی او ٹی پی بتا دیں",
        "کیا اضافی سامان درکار ہے؟",
      ]
    : [
        "I am on the way",
        "I have arrived at the location",
        "Please share the OTP",
        "Do you have spare parts ready?",
      ];

  const handleSendMessage = (msgText: string) => {
    if (!activeId || !msgText.trim()) return;
    setAttachmentError("");
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const tempId = `temp-${Date.now()}`;

    // Instant 0ms optimistic message in UI:
    const optimisticMsg: ChatMessage = {
      id: tempId,
      conversationId: activeId,
      jobId: selected?.jobId,
      senderId: "worker",
      senderRole: "worker",
      text: msgText.trim(),
      status: "sending",
      isRead: false,
      createdAt: now.toISOString(),
    };

    client.setQueryData<ChatMessage[]>(
      queryKeys.messages(activeId),
      (old = []) => [...old, optimisticMsg]
    );

    // Instant 0ms scroll to bottom
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "auto" });
    }

    setLatestMessages((prev) => ({
      ...prev,
      [activeId]: { text: msgText.trim(), time: timeStr, timestamp: now.getTime() },
      ...(selected?.jobId ? { [selected.jobId]: { text: msgText.trim(), time: timeStr, timestamp: now.getTime() } } : {}),
    }));

    send.mutate({ conversationId: activeId, text: msgText.trim() });
  };

  const handleSendVoiceNote = async (audioUrl: string, durationSeconds: number) => {
    if (!activeId) return;
    try {
      setAttachmentError("");
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const voiceLabel = isUrdu ? "وائس میسج 🎤" : "Voice message 🎤";
      const tempId = `temp-voice-${Date.now()}`;

      // Instant 0ms optimistic voice message in UI:
      const optimisticVoice: ChatMessage = {
        id: tempId,
        conversationId: activeId,
        jobId: selected?.jobId,
        senderId: "worker",
        senderRole: "worker",
        text: encodeVoiceNote(audioUrl, durationSeconds, { jobId: selected?.jobId }),
        status: "sending",
        isRead: false,
        createdAt: now.toISOString(),
      };

      client.setQueryData<ChatMessage[]>(
        queryKeys.messages(activeId),
        (old = []) => [...old, optimisticVoice]
      );

      setLatestMessages((prev) => ({
        ...prev,
        [activeId]: { text: voiceLabel, time: timeStr, timestamp: now.getTime() },
        ...(selected?.jobId ? { [selected.jobId]: { text: voiceLabel, time: timeStr, timestamp: now.getTime() } } : {}),
      }));

      let serverAudioUrl = audioUrl;
      if (audioUrl.startsWith("blob:") || audioUrl.startsWith("data:")) {
        const blob = await fetch(audioUrl).then((r) => r.blob());
        const uploaded = await uploadVoiceNote(blob);
        if (uploaded?.url) {
          serverAudioUrl = uploaded.url;
        }
      }
      const payloadText = encodeVoiceNote(serverAudioUrl, durationSeconds, {
        jobId: selected?.jobId,
      });
      send.mutate({ conversationId: activeId, text: payloadText });
    } catch (err) {
      console.error("Failed to upload/send worker voice note:", err);
      setAttachmentError(t("chat.uploadFailed"));
    }
  };

  const handleSendImage = async (file: File) => {
    if (!activeId) return;
    try {
      setAttachmentError("");
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const photoLabel = isUrdu ? "تصویر 📷" : "Photo 📷";
      const tempId = `temp-img-${Date.now()}`;
      const previewUrl = URL.createObjectURL(file);

      // Instant 0ms optimistic image in UI:
      const optimisticImg: ChatMessage = {
        id: tempId,
        conversationId: activeId,
        jobId: selected?.jobId,
        senderId: "worker",
        senderRole: "worker",
        imageUrl: previewUrl,
        status: "sending",
        isRead: false,
        createdAt: now.toISOString(),
      };

      client.setQueryData<ChatMessage[]>(
        queryKeys.messages(activeId),
        (old = []) => [...old, optimisticImg]
      );

      setLatestMessages((prev) => ({
        ...prev,
        [activeId]: { text: photoLabel, time: timeStr, timestamp: now.getTime() },
        ...(selected?.jobId ? { [selected.jobId]: { text: photoLabel, time: timeStr, timestamp: now.getTime() } } : {}),
      }));
      const uploaded = await uploadChatImage(file);
      if (uploaded?.key) {
        send.mutate({
          conversationId: activeId,
          imageKey: uploaded.key,
          imageUrl: uploaded.url,
        });
      }
    } catch (err) {
      console.error("Failed to upload/send worker image:", err);
      setAttachmentError(t("chat.uploadFailed"));
    }
  };

  if (conversations.isPending) return <LoadingState label={t("common.loading")} />;
  if (conversations.isError)
    return (
      <ErrorState
        title={t("empty.errorTitle")}
        description={t("empty.errorDescription")}
        onRetry={() => void conversations.refetch()}
      />
    );

  return (
    <div className="space-y-6 max-w-6xl xl:max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <PageHeader title={t("chat.title")} description={t("chat.description")} />
      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <Card className="h-fit">
          <CardHeader className="space-y-3 pb-3">
            <CardTitle>{t("chat.conversations")}</CardTitle>
            <div className="relative">
              <Search className="size-4 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={conversationSearch}
                onChange={(e) => setConversationSearch(e.target.value)}
                placeholder={isUrdu ? "گاہک یا جاب تلاش کریں..." : "Search customers or jobs..."}
                className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-1.5 rounded-lg text-xs bg-muted/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/30 border border-border text-foreground font-medium transition-all"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[34rem] overflow-y-auto scrollbar-none no-scrollbar">
            {filteredConversations.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {conversationSearch ? (isUrdu ? "کوئی گفتگو نہیں ملی" : "No conversations found") : t("chat.emptyDescription")}
              </p>
            ) : (
              filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setActiveId(conversation.id)}
                  className={`w-full rounded-lg p-3 text-start outline-none focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors cursor-pointer ${
                    activeId === conversation.id || selected?.id === conversation.id
                      ? "bg-teal/10 border-l-4 border-teal shadow-2xs"
                      : "hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Avatar className="size-9">
                      <AvatarFallback>{conversation.customerName.slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-navy">
                        {conversation.customerName}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {conversation.jobTitle}
                      </span>
                      {(() => {
                        const override = latestMessages[conversation.id] || (conversation.jobId ? latestMessages[conversation.jobId] : null);
                        const displayMsg = override?.text || conversation.lastMessage;
                        if (!displayMsg) return null;
                        return (
                          <span className="block truncate text-[11px] text-muted-foreground/80 mt-0.5">
                            {displayMsg.startsWith("{") && displayMsg.includes('"type":"voice"')
                              ? (isUrdu ? "وائس میسج 🎤" : "Voice message 🎤")
                              : displayMsg}
                          </span>
                        );
                      })()}
                    </span>
                    {(() => {
                      const isSelected = activeId === conversation.id || selected?.id === conversation.id;
                      const unread = isSelected
                        ? 0
                        : (unreadCounts[conversation.id] ?? (conversation.jobId ? unreadCounts[conversation.jobId] : undefined) ?? conversation.unreadCount ?? 0);
                      if (unread <= 0) return null;
                      return (
                        <span className="min-w-5 h-5 px-1.5 rounded-full bg-orange text-[11px] font-bold text-white flex items-center justify-center shrink-0">
                          {unread > 99 ? "99+" : unread}
                        </span>
                      );
                    })()}
                  </span>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="flex min-h-[36rem] lg:min-h-[42rem] flex-col overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-slate-100 py-3 sm:py-4">
            <div>
              <CardTitle className="text-base sm:text-lg">
                {selected?.customerName ?? t("chat.selectConversation")}
              </CardTitle>
              {selected?.jobTitle ? (
                <p className="text-xs text-muted-foreground mt-0.5">{selected.jobTitle}</p>
              ) : null}
            </div>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              {connected ? (
                <Wifi className="size-3 text-teal" aria-hidden="true" />
              ) : (
                <WifiOff className="size-3 text-error" aria-hidden="true" />
              )}
              {connected ? t("chat.connected") : t("chat.offline")}
            </span>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col p-0">
            {!activeId ? (
              <p className="m-auto text-sm text-muted-foreground p-8">{t("chat.selectConversation")}</p>
            ) : messages.isPending ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <LoadingState label={t("common.loading")} />
              </div>
            ) : messages.isError ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <ErrorState title={t("empty.errorTitle")} onRetry={() => void messages.refetch()} />
              </div>
            ) : (
              <div className="flex flex-col flex-1 min-h-0">
                <div
                  className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-6 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {messages.data.length === 0 ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">
                      {t("chat.emptyMessages")}
                    </p>
                  ) : (
                    messages.data.map((message) => (
                      <MessageBubble key={message.id} message={message} />
                    ))
                  )}
                  {isCustomerTyping && (
                    <div className="flex items-center gap-2 p-2 px-3 rounded-2xl bg-muted/60 text-muted-foreground text-xs w-fit animate-in fade-in-50">
                      <div className="flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-teal animate-bounce [animation-delay:-0.3s]" />
                        <span className="size-1.5 rounded-full bg-teal animate-bounce [animation-delay:-0.15s]" />
                        <span className="size-1.5 rounded-full bg-teal animate-bounce" />
                      </div>
                      <span className="text-[11px] font-medium">
                        {isUrdu
                          ? `${selected?.customerName || "گاہک"} لکھ رہے ہیں...`
                          : `${selected?.customerName || "Customer"} is typing...`}
                      </span>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                <div className="px-4 py-2 bg-muted/40 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>{t("chat.paymentSafetyNotice")}</span>
                </div>

                {attachmentError ? (
                  <div role="alert" className="px-4 py-1.5 bg-red-50 text-xs text-red-600 border-t border-red-100">
                    {attachmentError}
                  </div>
                ) : null}

                <ChatInputBar
                  onSendMessage={handleSendMessage}
                  onSendVoiceNote={handleSendVoiceNote}
                  onSendImage={handleSendImage}
                  onTyping={() => {
                    if (activeId) {
                      sendTyping(activeId, selected?.jobId);
                    }
                  }}
                  onStopTyping={() => {
                    if (activeId) {
                      sendStopTyping(activeId, selected?.jobId);
                    }
                  }}
                  quickSuggestions={workerQuickSuggestions}
                  disabled={false}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const own = message.senderRole === "worker";
  const voice = parseVoiceNote(message.text || (message as any).content);
  const isRead = Boolean(message.isRead || message.status === "read");

  if (voice) {
    return (
      <div className={`flex ${own ? "justify-end" : "justify-start"}`}>
        <div className="max-w-[85%]">
          <VoiceMessageBubble
            audioUrl={voice.audioUrl}
            durationSeconds={voice.durationSeconds}
            isSender={own}
            variant="teal"
          />
          <span className={`mt-1 flex items-center justify-end gap-1 text-[0.65rem] ${own ? "text-slate-500" : "text-muted-foreground"}`}>
            <time>{formatDateTime(message.createdAt)}</time>
            {own ? (
              isRead ? (
                <CheckCheck className="size-3.5 text-sky-500" aria-label="read" />
              ) : (
                <Check className="size-3.5 text-slate-400" aria-label="sent" />
              )
            ) : null}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${own ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-xl px-3 py-2 ${own ? "bg-teal text-white" : "bg-muted text-foreground"}`}>
        {message.imageUrl ? (
          <img
            src={message.imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="mb-2 max-h-48 rounded-lg object-cover"
          />
        ) : null}
        {message.text ? <p className="text-sm">{message.text}</p> : null}
        <span className={`mt-1 flex items-center justify-end gap-1 text-[0.65rem] ${own ? "text-white/75" : "text-muted-foreground"}`}>
          <time>{formatDateTime(message.createdAt)}</time>
          {own ? (
            isRead ? (
              <CheckCheck className="size-3.5 text-[#38bdf8]" aria-label="read" />
            ) : (
              <Check className="size-3.5 text-white/70" aria-label="sent" />
            )
          ) : null}
        </span>
      </div>
    </div>
  );
}