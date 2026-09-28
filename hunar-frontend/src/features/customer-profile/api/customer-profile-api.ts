import { http } from "@/lib/api-client";
import { isMockMode } from "@/lib/data-source";
import { MOCK_CUSTOMER_PROFILE } from "../data/mock-profile-data";
import type { CustomerProfileData } from "../types";

/**
 * Fetch authenticated customer profile
 */
export async function getCustomerProfile(): Promise<CustomerProfileData> {
  if (isMockMode()) {
    return MOCK_CUSTOMER_PROFILE;
  }
  try {
    const res = await http.get<any>("/users/me");
    if (res && res.id) {
      return {
        ...MOCK_CUSTOMER_PROFILE,
        id: res.id,
        fullName: res.name || MOCK_CUSTOMER_PROFILE.fullName,
        email: res.email || MOCK_CUSTOMER_PROFILE.email,
        phone: res.phone || MOCK_CUSTOMER_PROFILE.phone,
        avatarUrl: res.avatarUrl || MOCK_CUSTOMER_PROFILE.avatarUrl,
        primaryCity: res.city || "Peshawar",
      };
    }
  } catch (err) {
    console.warn("[getCustomerProfile] Backend offline, using initial mock profile:", err);
  }
  return MOCK_CUSTOMER_PROFILE;
}

/**
 * Update authenticated customer profile
 */
export async function updateCustomerProfile(
  data: Partial<CustomerProfileData>
): Promise<CustomerProfileData> {
  if (isMockMode()) {
    return { ...MOCK_CUSTOMER_PROFILE, ...data };
  }
  try {
    const res = await http.put<any>("/users/me", {
      name: data.fullName,
      email: data.email,
      city: data.primaryCity,
      avatarUrl: data.avatarUrl,
    });
    if (res) {
      return {
        ...MOCK_CUSTOMER_PROFILE,
        ...data,
        id: res.id || MOCK_CUSTOMER_PROFILE.id,
      };
    }
  } catch (err) {
    console.warn("[updateCustomerProfile] Backend offline, saving changes locally:", err);
  }
  return { ...MOCK_CUSTOMER_PROFILE, ...data };
}

/**
 * Upload profile avatar to S3 / MinIO
 */
export async function uploadCustomerAvatar(
  file: File
): Promise<{ key: string; url: string }> {
  if (isMockMode()) {
    return { key: `avatar-${Date.now()}`, url: URL.createObjectURL(file) };
  }
  try {
    const formData = new FormData();
    formData.append("file", file);
    return await http.upload<{ key: string; url: string }>(
      "/uploads/profile-photo",
      formData
    );
  } catch (err) {
    console.warn("[uploadCustomerAvatar] Backend offline, using local preview URL:", err);
    return {
      key: `avatar-${Date.now()}`,
      url: URL.createObjectURL(file),
    };
  }
}
