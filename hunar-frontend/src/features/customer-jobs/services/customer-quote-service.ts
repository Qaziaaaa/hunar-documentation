"use client";

import { http, getAccessToken, ApiError } from "@/lib/api-client";
import { isMockMode } from "@/lib/data-source";

export interface PendingRepairQuote {
  repairId: string;
  jobId: string;
  visitId?: string;
  workerId: string;
  workerName: string;
  workerPhone?: string;
  workerAvatar?: string;
  jobTitle: string;
  jobAddress?: string;
  description: string;
  amount: number; // Repair estimate amount
  visitCharge: number; // Diagnostic visit fee
  totalAmount: number; // visitCharge + amount
  status: "PROPOSED" | "COUNTERED" | "ACCEPTED" | "REJECTED";
  createdAt?: string;
}

const STORAGE_KEY = "workerfix_active_repair_quote";
const CHANNEL_NAME = "workerfix_quote_channel";

type QuoteEventListener = (quote: PendingRepairQuote | null, event: "PROPOSED" | "DECIDED" | "CLEARED") => void;

class CustomerQuoteService {
  private listeners: Set<QuoteEventListener> = new Set();
  private channel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data?.type === "PROPOSED") {
            this.notifyListeners(event.data.quote, "PROPOSED");
          } else if (event.data?.type === "DECIDED") {
            this.notifyListeners(null, "DECIDED");
          } else if (event.data?.type === "CLEARED") {
            this.notifyListeners(null, "CLEARED");
          }
        };
      } catch {
        this.channel = null;
      }
    }
  }

  getActiveQuote(): PendingRepairQuote | null {
    if (typeof window === "undefined") return null;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      const parsed = JSON.parse(data) as PendingRepairQuote;
      if (parsed.status === "PROPOSED" || parsed.status === "COUNTERED") {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  async checkBackendPendingQuote(): Promise<PendingRepairQuote | null> {
    const customerToken = getAccessToken("CUSTOMER");
    if (isMockMode() || !customerToken) {
      return this.getActiveQuote();
    }
    try {
      const pending = await http.get<PendingRepairQuote | null>("/repairs/pending");
      if (pending && (pending.status === "PROPOSED" || pending.status === "COUNTERED")) {
        this.startQuoteSession(pending);
        return pending;
      } else {
        // If backend says no pending quote, clear local session if any
        if (this.getActiveQuote()) {
          this.clearQuoteSession();
        }
        return null;
      }
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        return this.getActiveQuote();
      }
      console.warn("[CustomerQuoteService] checkBackendPendingQuote error:", err);
      return this.getActiveQuote();
    }
  }

  startQuoteSession(quote: PendingRepairQuote): void {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(quote));
      } catch (err) {
        console.warn("[CustomerQuoteService] storage error:", err);
      }
    }
    this.notifyListeners(quote, "PROPOSED");
    try {
      this.channel?.postMessage({ type: "PROPOSED", quote });
    } catch {
      // ignore
    }
  }

  clearQuoteSession(): void {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
    this.notifyListeners(null, "CLEARED");
    try {
      this.channel?.postMessage({ type: "CLEARED" });
    } catch {
      // ignore
    }
  }

  subscribe(listener: QuoteEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(quote: PendingRepairQuote | null, event: "PROPOSED" | "DECIDED" | "CLEARED"): void {
    this.listeners.forEach((listener) => {
      try {
        listener(quote, event);
      } catch (err) {
        console.error("[CustomerQuoteService] listener error:", err);
      }
    });
  }
}

export const customerQuoteService = new CustomerQuoteService();
