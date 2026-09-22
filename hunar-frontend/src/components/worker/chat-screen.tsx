"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CheckCheck, ImagePlus, Loader2, Send, Wifi, WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { getConversations, getMessages, joinConversationRoom, leaveConversationRoom, markConversationRead, sendMessage, subscribeToMessages, queryKeys } from "@/services/worker/chat.service";
import { uploadImage, validateImage } from "@/services/worker/upload.service";
import type { ChatMessage } from "@/types/chat";
import { formatDateTime } from "@/lib/format";

export function ChatScreen({ conversationId }: { conversationId?: string }) {
  const t = useTranslations("Worker");
  const client = useQueryClient();
  const [activeId, setActiveId] = useState(conversationId);
  const conversations = useQuery({ queryKey: queryKeys.conversations, queryFn: getConversations });
  const messages = useQuery({ enabled: Boolean(activeId), queryKey: queryKeys.messages(activeId ?? ""), queryFn: () => getMessages(activeId ?? "") });
  const [text, setText] = useState("");
  const connected = true;
  const [attachmentError, setAttachmentError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const send = useMutation({ mutationFn: sendMessage, onSuccess: () => { setText(""); void client.invalidateQueries({ queryKey: queryKeys.messages(activeId ?? "") }); void client.invalidateQueries({ queryKey: queryKeys.conversations }); } });

  useEffect(() => { if (!activeId) return; joinConversationRoom(activeId); void markConversationRead(activeId); const unsubscribe = subscribeToMessages((message) => { if (message.conversationId === activeId) void client.invalidateQueries({ queryKey: queryKeys.messages(activeId) }); }); return () => { leaveConversationRoom(activeId); unsubscribe(); }; }, [activeId, client]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.data?.length]);

  if (conversations.isPending) return <LoadingState label={t("common.loading")} />;
  if (conversations.isError) return <ErrorState title={t("empty.errorTitle")} description={t("empty.errorDescription")} onRetry={() => void conversations.refetch()} />;
  const selected = conversations.data.find((item) => item.id === activeId);

  return <div className="space-y-6"><PageHeader title={t("chat.title")} description={t("chat.description")} /><div className="grid gap-4 lg:grid-cols-[18rem_1fr]"><Card className="h-fit"><CardHeader><CardTitle>{t("chat.conversations")}</CardTitle></CardHeader><CardContent className="space-y-2">{conversations.data.length === 0 ? <p className="text-sm text-muted-foreground">{t("chat.emptyDescription")}</p> : conversations.data.map((conversation) => <button key={conversation.id} type="button" onClick={() => setActiveId(conversation.id)} className={`w-full rounded-lg p-3 text-start outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${activeId === conversation.id ? "bg-teal/10" : "hover:bg-muted"}`}><span className="flex items-center gap-2"><Avatar className="size-8"><AvatarFallback>{conversation.customerName.slice(0, 1)}</AvatarFallback></Avatar><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-navy">{conversation.customerName}</span><span className="block truncate text-xs text-muted-foreground">{conversation.jobTitle}</span></span>{conversation.unreadCount > 0 ? <span className="rounded-full bg-orange px-2 py-0.5 text-xs text-white">{conversation.unreadCount}</span> : null}</span></button>)}</CardContent></Card><Card className="flex min-h-[32rem] flex-col"><CardHeader className="flex flex-row items-center justify-between gap-2"><CardTitle>{selected?.customerName ?? t("chat.selectConversation")}</CardTitle><span className="flex items-center gap-1 text-xs text-muted-foreground">{connected ? <Wifi className="size-3 text-teal" aria-hidden="true" /> : <WifiOff className="size-3 text-error" aria-hidden="true" />}{connected ? t("chat.connected") : t("chat.offline")}</span></CardHeader><CardContent className="flex min-h-0 flex-1 flex-col gap-3">{!activeId ? <p className="m-auto text-sm text-muted-foreground">{t("chat.selectConversation")}</p> : messages.isPending ? <LoadingState label={t("common.loading")} /> : messages.isError ? <ErrorState title={t("empty.errorTitle")} onRetry={() => void messages.refetch()} /> : <><div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">{messages.data.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">{t("chat.emptyMessages")}</p> : messages.data.map((message) => <MessageBubble key={message.id} message={message} />)}<div ref={bottomRef} /></div><p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">{t("chat.paymentSafetyNotice")}</p><form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); if (activeId && text.trim()) send.mutate({ conversationId: activeId, text: text.trim() }); }}><Input value={text} onChange={(event) => setText(event.target.value)} placeholder={t("chat.messagePlaceholder")} disabled={send.isPending} aria-label={t("chat.messagePlaceholder")} /><input type="file" accept="image/*" className="sr-only" id="chat-image" onChange={async (event) => { const file = event.target.files?.[0]; if (!file || !activeId) return; const validation = validateImage(file); if (validation) { setAttachmentError(t("chat.uploadFailed")); return; } try { const uploaded = await uploadImage(file); send.mutate({ conversationId: activeId, imageUrl: uploaded.url }); setAttachmentError(""); } catch { setAttachmentError(t("chat.uploadFailed")); } }} /><label htmlFor="chat-image" className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted" title={t("chat.attachImage")}><ImagePlus className="size-4" aria-hidden="true" /></label><Button type="submit" size="icon" className="shrink-0 bg-teal hover:bg-teal/85" disabled={!text.trim() || send.isPending} aria-label={t("chat.send")}>{send.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}</Button></form>{attachmentError ? <p role="alert" className="text-xs text-error">{attachmentError}</p> : null}</>}</CardContent></Card></div></div>;
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const own = message.senderRole === "worker";
  return <div className={`flex ${own ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-xl px-3 py-2 ${own ? "bg-teal text-white" : "bg-muted text-foreground"}`}>{message.imageUrl ? <img src={message.imageUrl} alt="" className="mb-2 max-h-48 rounded-lg object-cover" /> : null}{message.text ? <p className="text-sm">{message.text}</p> : null}<span className={`mt-1 flex items-center justify-end gap-1 text-[0.65rem] ${own ? "text-white/75" : "text-muted-foreground"}`}><time>{formatDateTime(message.createdAt)}</time>{own ? message.status === "read" ? <CheckCheck className="size-3" aria-label={message.status} /> : <Check className="size-3" aria-label={message.status} /> : null}</span></div></div>;
}