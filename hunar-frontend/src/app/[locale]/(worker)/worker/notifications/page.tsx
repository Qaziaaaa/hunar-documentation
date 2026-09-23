"use client";

import { createElement, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { notificationCategory, notificationIcon } from "@/lib/notification-meta";
import { getNotifications, markAllNotificationsRead, markNotificationRead, subscribeToNotifications, queryKeys } from "@/services/worker/notification.service";
import type { AppNotification } from "@/types/notification";

export default function NotificationsPage() {
  const t = useTranslations("Worker");
  const client = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const notifications = useQuery({ queryKey: queryKeys.notifications, queryFn: getNotifications });
  useEffect(() => subscribeToNotifications(() => { void client.invalidateQueries({ queryKey: queryKeys.notifications }); void client.invalidateQueries({ queryKey: queryKeys.unreadCount }); }), [client]);
  const markRead = useMutation({ mutationFn: markNotificationRead, onSuccess: () => { void client.invalidateQueries({ queryKey: queryKeys.notifications }); void client.invalidateQueries({ queryKey: queryKeys.unreadCount }); } });
  const markAll = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: () => { void client.invalidateQueries({ queryKey: queryKeys.notifications }); void client.invalidateQueries({ queryKey: queryKeys.unreadCount }); } });
  if (notifications.isPending) return <LoadingState label={t("common.loading")} />;
  if (notifications.isError) return <ErrorState title={t("empty.errorTitle")} description={t("empty.errorDescription")} onRetry={() => void notifications.refetch()} />;
  const visible = notifications.data.filter((item) => filter === "all" || !item.read);
  return <div className="space-y-6"><PageHeader title={t("notifications.title")} description={t("notifications.description")} actions={<Button variant="outline" disabled={markAll.isPending || notifications.data.every((item) => item.read)} onClick={() => markAll.mutate()}><CheckCheck className="size-4" aria-hidden="true" />{markAll.isPending ? t("notifications.markingAllRead") : t("notifications.markAllRead")}</Button>} /><div className="flex gap-2 border-b border-border">{(["all", "unread"] as const).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`border-b-2 px-3 py-2 text-sm font-medium ${filter === item ? "border-teal text-teal" : "border-transparent text-muted-foreground"}`}>{item === "all" ? t("notifications.filterAll") : t("notifications.filterUnread")}</button>)}</div>{visible.length === 0 ? <EmptyState title={t("notifications.emptyTitle")} description={t("notifications.emptyDescription")} icon={Bell} /> : <div className="space-y-3">{visible.map((item) => <NotificationItem key={item.id} item={item} onRead={() => !item.read && markRead.mutate(item.id)} />)}</div>}</div>;
}

function NotificationItem({ item, onRead }: { item: AppNotification; onRead: () => void }) {
  const t = useTranslations("Worker");
  const Icon = notificationIcon(item.type);
  const content = <div className={`flex gap-3 rounded-xl border p-4 ${item.read ? "border-border bg-card" : "border-teal/30 bg-teal/5"}`}><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal">{createElement(Icon, { className: "size-4" })}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-navy">{item.title}</p>{!item.read ? <span className="text-xs font-medium text-teal">{t("notifications.unread")}</span> : null}</div><p className="mt-1 text-sm text-muted-foreground">{item.message}</p><div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span>{t(`notifications.category.${notificationCategory(item.type)}`)}</span><time>{formatDateTime(item.createdAt)}</time>{!item.read ? <button type="button" onClick={(event) => { event.preventDefault(); onRead(); }} className="font-medium text-teal hover:underline">{t("notifications.markRead")}</button> : null}</div></div></div>;
  return item.href ? <Link href={item.href} onClick={onRead} className="block outline-none focus-visible:ring-3 focus-visible:ring-ring/50">{content}</Link> : content;
}