import type { NotificationType } from "./notification";

export type NotificationChannelType = "system" | NotificationType;

export interface NotificationPreferences {
  enabled: Record<NotificationChannelType, boolean>;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface AccountDeleteInput {
  confirmationText: string;
}

export type LanguageCode = "en";

export interface PrivacySettings {
  profileVisible: boolean;
  showVisitCharge: boolean;
}