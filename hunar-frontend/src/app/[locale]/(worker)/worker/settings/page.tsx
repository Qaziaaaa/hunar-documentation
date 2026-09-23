"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ConfirmationModal } from "@/components/shared/confirmation-modal";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  changePassword,
  deleteAccount,
  getPrivacySettings,
  queryKeys as settingsKeys,
  signOut,
  updatePrivacySettings,
} from "@/services/worker/settings.service";
import {
  getNotificationPreferences,
  queryKeys as notificationKeys,
  updateNotificationPreferences,
} from "@/services/worker/notification.service";
import type { NotificationChannelType } from "@/types/settings";

export default function SettingsPage() {
  const t = useTranslations("Worker");
  const router = useRouter();
  const client = useQueryClient();
  const privacy = useQuery({ queryKey: settingsKeys.privacy, queryFn: getPrivacySettings });
  const preferences = useQuery({ queryKey: notificationKeys.preferences, queryFn: getNotificationPreferences });
  const [password, setPassword] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const passwordMutation = useMutation({
    mutationFn: () => changePassword({ currentPassword: password.currentPassword, newPassword: password.newPassword }),
    onSuccess: () => setPassword({ currentPassword: "", newPassword: "", confirmPassword: "" }),
  });
  const preferenceMutation = useMutation({ mutationFn: updateNotificationPreferences, onSuccess: (data) => client.setQueryData(notificationKeys.preferences, data) });
  const privacyMutation = useMutation({ mutationFn: updatePrivacySettings, onSuccess: (data) => client.setQueryData(settingsKeys.privacy, data) });
  const deleteMutation = useMutation({
    mutationFn: () => deleteAccount({ confirmationText: deleteText }),
    onSuccess: () => { setDeleteOpen(false); signOut(); router.push("/"); },
  });

  if (privacy.isPending || preferences.isPending) return <LoadingState label={t("common.loading")} />;
  if (privacy.isError || preferences.isError) return <ErrorState title={t("empty.errorTitle")} description={t("empty.errorDescription")} onRetry={() => { void privacy.refetch(); void preferences.refetch(); }} />;

  const updatePreference = (key: NotificationChannelType, checked: boolean) => preferenceMutation.mutate({ enabled: { ...preferences.data.enabled, [key]: checked } });
  const passwordValid = password.currentPassword && password.newPassword.length >= 8 && password.newPassword === password.confirmPassword;
  const consequences = t.raw("settings.deleteConsequences") as string[];

  return (
    <div className="space-y-6">
      <PageHeader title={t("settings.title")} description={t("settings.description")} />
      <Card>
        <CardHeader><CardTitle>{t("settings.security")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <PasswordField id="current-password" label={t("settings.currentPassword")} value={password.currentPassword} onChange={(value) => setPassword({ ...password, currentPassword: value })} />
          <PasswordField id="new-password" label={t("settings.newPassword")} value={password.newPassword} onChange={(value) => setPassword({ ...password, newPassword: value })} />
          <PasswordField id="confirm-password" label={t("settings.confirmPassword")} value={password.confirmPassword} onChange={(value) => setPassword({ ...password, confirmPassword: value })} />
          {password.newPassword && password.newPassword.length < 8 ? <p className="text-sm text-error">{t("settings.passwordTooShort")}</p> : null}
          {password.confirmPassword && password.newPassword !== password.confirmPassword ? <p className="text-sm text-error">{t("settings.passwordMismatch")}</p> : null}
          <Button className="bg-teal hover:bg-teal/85" disabled={!passwordValid || passwordMutation.isPending} onClick={() => passwordMutation.mutate()}>{t("settings.changePassword")}</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{t("settings.notificationPreferences")}</CardTitle><p className="text-sm text-muted-foreground">{t("settings.notificationsDescription")}</p></CardHeader>
        <CardContent className="divide-y divide-border">
          {Object.entries(preferences.data.enabled).map(([key, checked]) => <div key={key} className="flex items-center justify-between gap-3 py-3"><p className="text-sm font-medium text-navy">{t(`settings.notifTypes.${key}`)}</p><Switch checked={checked} onCheckedChange={(value) => updatePreference(key as NotificationChannelType, value)} aria-label={t(`settings.notifTypes.${key}`)} /></div>)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{t("settings.privacy")}</CardTitle><p className="text-sm text-muted-foreground">{t("settings.privacyDescription")}</p></CardHeader>
        <CardContent className="divide-y divide-border">
          <PrivacyRow title={t("settings.profileVisibility")} description={t("settings.profileVisibilityDescription")} checked={privacy.data.profileVisible} onChange={(checked) => privacyMutation.mutate({ profileVisible: checked })} />
          <PrivacyRow title={t("settings.showVisitCharge")} description={t("settings.showVisitChargeDescription")} checked={privacy.data.showVisitCharge} onChange={(checked) => privacyMutation.mutate({ showVisitCharge: checked })} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{t("settings.account")}</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3"><Button variant="outline" onClick={() => { signOut(); router.push("/"); }}>{t("settings.logout")}</Button><Button variant="destructive" onClick={() => setDeleteOpen(true)}>{t("settings.deleteAccount")}</Button></CardContent>
      </Card>
      <ConfirmationModal open={deleteOpen} onOpenChange={setDeleteOpen} title={t("settings.deleteConfirmTitle")} description={<div className="space-y-2"><p>{t("settings.deleteConfirmDescription")}</p><ul className="list-disc ps-5">{consequences.map((item) => <li key={item}>{item}</li>)}</ul><Label htmlFor="delete-confirm">{t("settings.deleteConfirmHint")}</Label><Input id="delete-confirm" placeholder={t("settings.deletePlaceholder")} value={deleteText} onChange={(event) => setDeleteText(event.target.value)} /></div>} confirmLabel={t("settings.deleteConfirmLabel")} variant="destructive" loading={deleteMutation.isPending} onConfirm={() => deleteMutation.mutate()} />
    </div>
  );
}

function PasswordField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return <div className="grid gap-2"><Label htmlFor={id}>{label}</Label><Input id={id} type="password" value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}

function PrivacyRow({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <div className="flex items-center justify-between gap-4 py-4"><div><p className="text-sm font-medium text-navy">{title}</p><p className="mt-1 text-xs text-muted-foreground">{description}</p></div><Switch checked={checked} onCheckedChange={onChange} aria-label={title} /></div>;
}
