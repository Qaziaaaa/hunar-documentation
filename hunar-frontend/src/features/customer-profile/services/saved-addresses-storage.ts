"use client";

import { MOCK_CUSTOMER_PROFILE } from "../data/mock-profile-data";
import type { SavedAddress } from "../types";

const STORAGE_KEY = "hunar_customer_saved_addresses";

export function getSavedAddresses(): SavedAddress[] {
  if (typeof window === "undefined") {
    return MOCK_CUSTOMER_PROFILE.savedAddresses || [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[SavedAddressesStorage] Error reading addresses:", err);
  }
  return MOCK_CUSTOMER_PROFILE.savedAddresses || [];
}

export function saveSavedAddresses(addresses: SavedAddress[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
  } catch (err) {
    console.warn("[SavedAddressesStorage] Error saving addresses:", err);
  }
}

export function getDefaultSavedAddress(): SavedAddress | undefined {
  const addresses = getSavedAddresses();
  return addresses.find((a) => a.isDefault) || addresses[0];
}

export function addOrUpdateSavedAddress(address: SavedAddress): SavedAddress[] {
  const current = getSavedAddresses();
  
  // De-duplicate: check if exists by id OR by matching normalized fullAddress and area
  const existingIndex = current.findIndex(
    (a) =>
      a.id === address.id ||
      (a.fullAddress.trim().toLowerCase() === address.fullAddress.trim().toLowerCase() &&
        a.area.trim().toLowerCase() === address.area.trim().toLowerCase())
  );

  let updated: SavedAddress[];
  if (existingIndex >= 0) {
    // Update existing address details while preserving stable id
    const existingId = current[existingIndex].id;
    updated = current.map((a, idx) =>
      idx === existingIndex ? { ...a, ...address, id: existingId } : a
    );
  } else {
    // New address
    updated = [...current, address];
  }

  // Ensure first address or isDefault is handled
  if (address.isDefault || updated.length === 1) {
    const targetId = existingIndex >= 0 ? current[existingIndex].id : address.id;
    updated = updated.map((a) => ({
      ...a,
      isDefault: a.id === targetId,
    }));
  }

  saveSavedAddresses(updated);
  return updated;
}

export function deleteSavedAddress(id: string): SavedAddress[] {
  const current = getSavedAddresses();
  const updated = current.filter((a) => a.id !== id);
  if (updated.length > 0 && !updated.some((a) => a.isDefault)) {
    updated[0].isDefault = true;
  }
  saveSavedAddresses(updated);
  return updated;
}
