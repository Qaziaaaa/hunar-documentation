"use client";

import { useSyncExternalStore } from "react";

export type WorkerOfferToastType = "declined" | "expired" | "closed";

export interface WorkerOfferToastItem {
  id: string;
  type: WorkerOfferToastType;
  customMessage?: string;
}

let currentToast: WorkerOfferToastItem | null = null;
let dismissTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function showOfferToast(
  input: WorkerOfferToastType | { type: WorkerOfferToastType; customMessage?: string }
): void {
  if (dismissTimer) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }

  const type = typeof input === "string" ? input : input.type;
  const customMessage = typeof input === "object" ? input.customMessage : undefined;

  currentToast = {
    id: `offer-toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    customMessage,
  };

  notify();

  // Exactly 3 seconds auto-dismiss
  dismissTimer = setTimeout(() => {
    currentToast = null;
    dismissTimer = null;
    notify();
  }, 3000);
}

export function dismissOfferToast(): void {
  if (dismissTimer) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }
  currentToast = null;
  notify();
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): WorkerOfferToastItem | null {
  return currentToast;
}

export function useWorkerOfferToast(): WorkerOfferToastItem | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

