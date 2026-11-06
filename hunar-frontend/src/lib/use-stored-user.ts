"use client";

import { useSyncExternalStore } from "react";
import {
  AUTH_USER_CHANGED_EVENT,
  getStoredUser,
  getStoredUserRaw,
  type StoredUser,
} from "@/lib/api-client";

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("focus", onStoreChange);
  window.addEventListener(AUTH_USER_CHANGED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("focus", onStoreChange);
    window.removeEventListener(AUTH_USER_CHANGED_EVENT, onStoreChange);
  };
}

// Cache parse result by raw string so the snapshot object stays referentially stable
let parsedRaw: string | null | undefined;
let parsedUser: StoredUser | null = null;

function parseCached(raw: string | null): StoredUser | null {
  if (raw !== parsedRaw) {
    parsedRaw = raw;
    parsedUser = raw ? getStoredUser() : null;
  }
  return parsedUser;
}

/**
 * Returns the signed-in user from localStorage without a hydration mismatch:
 * SSR and the first client render both yield null, then the real value is read
 * from the local store (and kept in sync afterwards).
 */
export function useStoredUser(): StoredUser | null {
  const raw = useSyncExternalStore(subscribe, getStoredUserRaw, () => null);
  return parseCached(raw);
}
