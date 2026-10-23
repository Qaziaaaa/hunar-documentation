import { http, getStoredUser, setTokens, getAccessToken, getRefreshToken } from "@/lib/api-client";
import type { CustomerProfileData, NotificationPreferences, SavedAddress } from "../types";
import {
  getSavedAddresses,
  saveSavedAddresses,
  deleteSavedAddress,
  getSavedNotificationPreferences,
  saveNotificationPreferences,
} from "../services/saved-addresses-storage";

const defaultCustomerProfile: CustomerProfileData = {
  id: "",
  customerIdBadge: "CUST-000",
  fullName: "",
  email: "",
  isEmailVerified: false,
  phone: "",
  isPhoneVerified: true,
  isCnicVerified: false,
  avatarUrl: "",
  avatarInitials: "C",
  memberTier: "Standard Member",
  joinedDate: "Recently",
  completedJobsCount: 0,
  trustScore: "Unrated",
  rating: 0,
  primaryCity: "",
  preferredLanguage: "ur",
  preferredServiceHours: "anytime",
  savedAddresses: [],
  notifications: {
    instantQuotesSms: true,
    instantQuotesWhatsapp: true,
    technicianArrivalPush: true,
    technicianArrivalInApp: true,
    directPaymentReceiptsEmail: true,
    directPaymentReceiptsSms: false,
    marketingAndTips: false,
  },
  activeDevices: [],
};

export async function getCustomerProfile(): Promise<CustomerProfileData> {
  const res = await http.get<any>("/users/me");
  const u = res?.user ?? res;
  if (!u || !u.id) {
    throw new Error("UNAUTHORIZED");
  }
  const name = u.name || "";
  const initials = name
    ? name
        .split(" ")
        .map((p: string) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "C";

  // Keep stored user synchronized with database profile
  const stored = getStoredUser("CUSTOMER") ?? getStoredUser();
  if (stored) {
    const nextAvatar = u.avatarUrl !== undefined ? (u.avatarUrl || undefined) : stored.avatarUrl;
    const nextName = name || stored.name;
    if (nextAvatar !== stored.avatarUrl || nextName !== stored.name) {
      setTokens(getAccessToken("CUSTOMER") || "", getRefreshToken("CUSTOMER") || "", {
        ...stored,
        name: nextName,
        avatarUrl: nextAvatar,
      });
    }
  }

  const joinedDate = u.createdAt
    ? new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "2026";
  const completedJobsCount = typeof u.completedJobsCount === "number" ? u.completedJobsCount : 0;

  return {
    ...defaultCustomerProfile,
    id: u.id,
    customerIdBadge: `CUST-${u.id.slice(0, 6).toUpperCase()}`,
    fullName: name,
    email: u.email || "",
    phone: u.phone || "",
    avatarUrl: u.avatarUrl || "",
    avatarInitials: initials,
    primaryCity: u.city || "",
    joinedDate,
    completedJobsCount,
    isEmailVerified: Boolean(u.isEmailVerified || u.emailVerified),
    isPhoneVerified: Boolean(u.isPhoneVerified || u.phoneVerified || u.isVerified || u.phone),
  };
}

/**
 * Update authenticated customer profile
 */
export async function updateCustomerProfile(
  data: Partial<CustomerProfileData>
): Promise<CustomerProfileData> {
  try {
    const res = await http.put<any>("/users/me", {
      name: data.fullName,
      email: data.email,
      avatarUrl: data.avatarUrl,
    });
    const u = res?.user ?? res;
    const name = u?.name || data.fullName || "";
    const initials = name
      ? name
          .split(" ")
          .map((p: string) => p[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "C";

    const nextAvatar = u?.avatarUrl !== undefined ? (u?.avatarUrl || undefined) : (data.avatarUrl || undefined);
    const stored = getStoredUser("CUSTOMER") ?? getStoredUser();
    if (stored) {
      setTokens(getAccessToken("CUSTOMER") || "", getRefreshToken("CUSTOMER") || "", {
        ...stored,
        name: name || stored.name,
        avatarUrl: nextAvatar !== undefined ? nextAvatar : stored.avatarUrl,
      });
    }

    return {
      ...defaultCustomerProfile,
      ...data,
      id: u?.id || data.id || "",
      fullName: name,
      email: u?.email || data.email || "",
      phone: u?.phone || data.phone || "",
      avatarUrl: u?.avatarUrl || data.avatarUrl || "",
      avatarInitials: initials,
      primaryCity: u?.city || data.primaryCity || "Peshawar",
    };
  } catch (err) {
    console.warn("[updateCustomerProfile] Backend update failed:", err);
    throw err;
  }
}

/**
 * Upload profile avatar to S3 / MinIO
 */
export async function uploadCustomerAvatar(
  file: File
): Promise<{ key: string; url: string }> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    return await http.upload<{ key: string; url: string }>(
      "/uploads/profile-photo",
      formData
    );
  } catch (err) {
    console.warn("[uploadCustomerAvatar] Backend upload failed:", err);
    throw err;
  }
}

/**
 * Change customer password via backend auth endpoint
 */
export async function changeCustomerPassword(dto: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean; message?: string }> {
  return http.put<{ success: boolean; message?: string }>("/auth/change-password", dto);
}

/**
 * Invalidate all other active customer sessions
 */
export async function revokeCustomerSessions(): Promise<{ success: boolean }> {
  try {
    await http.post<{ success: boolean }>("/auth/logout");
  } catch (err) {
    console.warn("[revokeCustomerSessions] Backend logout call:", err);
  }
  return { success: true };
}

/**
 * Retrieve customer saved addresses (synced with database ServiceArea & Redis, with localStorage fallback)
 */
export async function getCustomerAddresses(): Promise<SavedAddress[]> {
  try {
    const res = await http.get<SavedAddress[]>("/users/me/addresses");
    if (Array.isArray(res)) {
      saveSavedAddresses(res);
      return res;
    }
  } catch (err) {
    console.warn("[getCustomerAddresses] API failed, falling back to local storage cache:", err);
  }
  return getSavedAddresses();
}

/**
 * Persist customer saved addresses to database & Redis, updating localStorage offline cache
 */
export async function saveCustomerAddresses(
  addresses: SavedAddress[]
): Promise<SavedAddress[]> {
  // Update offline cache immediately
  saveSavedAddresses(addresses);
  try {
    const res = await http.post<SavedAddress[]>("/users/me/addresses", addresses);
    if (Array.isArray(res)) {
      saveSavedAddresses(res);
      return res;
    }
  } catch (err) {
    console.warn("[saveCustomerAddresses] API failed, relying on local storage cache:", err);
  }
  return addresses;
}

/**
 * Delete a customer saved address from database, Redis, and localStorage
 */
export async function deleteCustomerAddressApi(
  id: string
): Promise<SavedAddress[]> {
  deleteSavedAddress(id);
  try {
    const res = await http.delete<SavedAddress[]>(`/users/me/addresses/${id}`);
    if (Array.isArray(res)) {
      saveSavedAddresses(res);
      return res;
    }
  } catch (err) {
    console.warn("[deleteCustomerAddressApi] API failed, relying on local storage cache:", err);
  }
  return getSavedAddresses();
}

/**
 * Retrieve customer notification preferences from Redis / backend
 */
export async function getCustomerNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const res = await http.get<NotificationPreferences>("/users/me/notification-preferences");
    if (res && typeof res === "object") {
      saveNotificationPreferences(res);
      return res;
    }
  } catch (err) {
    console.warn("[getCustomerNotificationPreferences] API failed, falling back to local cache:", err);
  }
  const cached = getSavedNotificationPreferences();
  return (
    cached || {
      instantQuotesSms: true,
      instantQuotesWhatsapp: true,
      technicianArrivalPush: true,
      technicianArrivalInApp: true,
      directPaymentReceiptsEmail: true,
      directPaymentReceiptsSms: false,
      marketingAndTips: false,
    }
  );
}

/**
 * Update and persist customer notification preferences
 */
export async function updateCustomerNotificationPreferences(
  prefs: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const current = await getCustomerNotificationPreferences();
  const next = { ...current, ...prefs };
  saveNotificationPreferences(next);
  try {
    const res = await http.put<NotificationPreferences>("/users/me/notification-preferences", next);
    if (res && typeof res === "object") {
      saveNotificationPreferences(res);
      return res;
    }
  } catch (err) {
    console.warn("[updateCustomerNotificationPreferences] API failed, saved locally:", err);
  }
  return next;
}

