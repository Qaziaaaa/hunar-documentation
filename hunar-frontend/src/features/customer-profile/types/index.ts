export interface SavedAddress {
  id: string;
  label: string;
  tag: "home" | "office" | "parents" | "other";
  fullAddress: string;
  area: string;
  city: string;
  landmark: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export interface NotificationPreferences {
  instantQuotesSms: boolean;
  instantQuotesWhatsapp: boolean;
  technicianArrivalPush: boolean;
  technicianArrivalInApp: boolean;
  directPaymentReceiptsEmail: boolean;
  directPaymentReceiptsSms: boolean;
  marketingAndTips: boolean;
}

export interface ActiveDevice {
  id: string;
  deviceName: string;
  browser: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface CustomerProfileData {
  id: string;
  customerIdBadge: string;
  fullName: string;
  email: string;
  isEmailVerified: boolean;
  phone: string;
  isPhoneVerified: boolean;
  isCnicVerified: boolean;
  avatarUrl?: string;
  avatarInitials: string;
  memberTier: string;
  joinedDate: string;
  completedJobsCount: number;
  trustScore: string;
  rating: number;
  primaryCity: string;
  preferredLanguage: "en" | "ur";
  preferredServiceHours: "morning" | "evening" | "anytime";
  savedAddresses: SavedAddress[];
  notifications: NotificationPreferences;
  activeDevices: ActiveDevice[];
}
