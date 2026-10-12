import { http, getStoredUser, setTokens, getAccessToken, getRefreshToken } from "@/lib/api-client";
import type { CustomerProfileData } from "../types";

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
    isEmailVerified: Boolean(u.isEmailVerified || u.emailVerified),
    isPhoneVerified: Boolean(u.isPhoneVerified || u.phoneVerified || u.isVerified),
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

    const nextAvatar = u?.avatarUrl || data.avatarUrl;
    const stored = getStoredUser();
    if (stored) {
      setTokens(getAccessToken() || "", getRefreshToken() || "", {
        ...stored,
        name: name || stored.name,
        avatarUrl: nextAvatar !== undefined ? (nextAvatar || undefined) : stored.avatarUrl,
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
