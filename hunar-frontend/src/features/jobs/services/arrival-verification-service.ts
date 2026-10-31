"use client";

import { http, getAccessToken } from "@/lib/api-client";

export interface ArrivalSession {
  jobId: string;
  visitId?: string;
  otp: string;
  arrivedAt: number; // Unix timestamp in ms
  status: "pending_otp" | "otp_verified" | "reported_no_otp";
  workerName: string;
  workerAvatar?: string;
  workerPhone?: string;
  customerName?: string;
  customerAddress?: string;
}

const STORAGE_KEY = "workerfix_active_arrival_otp";
const EVENT_NAME = "workerfix_arrival_event";
const CHANNEL_NAME = "workerfix_arrival_channel";

export const SUCCESS_VERIFICATION_MESSAGE =
  "OTP verified successfully. The worker is now allowed inside the premises.";
export const SUCCESS_VERIFICATION_MESSAGE_UR =
  "OTP کی تصدیق کامیابی سے ہو گئی۔ اب کاریگر کو احاطے کے اندر جانے کی اجازت ہے۔";

class ArrivalVerificationService {
  private channel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
      } catch {
        this.channel = null;
      }
    }
  }

  getSession(): ArrivalSession | null {
    if (typeof window === "undefined") return null;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data) as ArrivalSession;
    } catch {
      return null;
    }
  }

  startArrivalSession(params: {
    jobId: string;
    visitId?: string;
    otp: string;
    workerName: string;
    workerAvatar?: string;
    workerPhone?: string;
    customerName?: string;
    customerAddress?: string;
  }): ArrivalSession {
    const session: ArrivalSession = {
      jobId: params.jobId,
      visitId: params.visitId,
      otp: params.otp.trim(),
      arrivedAt: Date.now(),
      status: "pending_otp",
      workerName: params.workerName || "Technician",
      workerAvatar: params.workerAvatar,
      workerPhone: params.workerPhone,
      customerName: params.customerName || "Customer",
      customerAddress: params.customerAddress,
    };

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } catch (err) {
        console.warn("Error storing arrival session:", err);
      }

      this.broadcast("ARRIVAL_STARTED", session);
    }

    return session;
  }

  async checkBackendPendingArrival(): Promise<ArrivalSession | null> {
    const token = getAccessToken("CUSTOMER") || getAccessToken();
    if (!token) return this.getSession();
    try {
      const res = await http.get<any>("/visits/my?limit=5");
      const visits: any[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.data)
        ? res.data
        : [];

      const current = this.getSession();

      // If current session is already completed or past arrival on backend, clear it immediately
      if (current) {
        const matchingVisit = visits.find(
          (v: any) =>
            v.jobId === current.jobId ||
            v.job?.id === current.jobId ||
            v.id === current.visitId
        );
        if (matchingVisit) {
          const isPastArrival =
            matchingVisit.status === "COMPLETED" ||
            matchingVisit.status === "CANCELLED" ||
            [
              "VISIT_COMPLETED",
              "INSPECTION_DONE",
              "REPAIR_NEGOTIATING",
              "REPAIR_APPROVED",
              "IN_PROGRESS",
              "COMPLETED",
              "PAID",
              "REVIEWED",
              "CANCELLED",
            ].includes(matchingVisit.job?.status);

          if (isPastArrival) {
            this.clearArrivalSession();
            return null;
          }
        }
      }

      const pendingVisit = visits.find((v: any) => {
        const isJobPastArrival = [
          "VISIT_COMPLETED",
          "INSPECTION_DONE",
          "REPAIR_NEGOTIATING",
          "REPAIR_APPROVED",
          "IN_PROGRESS",
          "COMPLETED",
          "PAID",
          "REVIEWED",
          "CANCELLED",
        ].includes(v.job?.status);

        if (v.status === "COMPLETED" || v.status === "CANCELLED" || isJobPastArrival) {
          return false;
        }

        return Boolean(v.isArrivalPending || v.arrivalPending || v.arrivalOtp);
      });

      if (pendingVisit) {
        const session = this.startArrivalSession({
          jobId: pendingVisit.jobId || pendingVisit.job?.id || "",
          visitId: pendingVisit.id,
          otp: pendingVisit.arrivalOtp || "",
          workerName: pendingVisit.worker?.name || "Technician",
          workerPhone: pendingVisit.worker?.phone,
          customerName: pendingVisit.customer?.name,
          customerAddress: pendingVisit.customerAddress || pendingVisit.job?.address,
        });
        return session;
      } else {
        // If backend confirmed there are no pending arrivals, clear any stale stored session
        if (current) {
          this.clearArrivalSession();
        }
        return null;
      }
    } catch {
      return this.getSession();
    }
  }

  async validateActiveSession(): Promise<boolean> {
    const session = this.getSession();
    if (!session || !session.jobId) return false;
    try {
      const res = await http.get<any>(`/jobs/${session.jobId}`);
      if (
        res &&
        (res.status === "CANCELLED" ||
          res.status === "COMPLETED" ||
          res.status === "PAID" ||
          res.status === "REVIEWED" ||
          res.status === "VISIT_COMPLETED" ||
          res.status === "INSPECTION_DONE" ||
          res.status === "REPAIR_NEGOTIATING" ||
          res.status === "REPAIR_APPROVED" ||
          res.status === "IN_PROGRESS" ||
          res.cancelReason)
      ) {
        this.clearArrivalSession();
        return false;
      }
      return true;
    } catch {
      return true;
    }
  }

  async verifyOtp(
    enteredOtp: string,
    fallbackSession?: Partial<ArrivalSession>
  ): Promise<{ success: boolean; error?: string; session?: ArrivalSession }> {
    let session = this.getSession();
    if (!session) {
      // Use fallback session or default active session to prevent blocking user
      session = {
        jobId: fallbackSession?.jobId || "",
        visitId: fallbackSession?.visitId,
        otp: fallbackSession?.otp || "",
        arrivedAt: Date.now(),
        status: "pending_otp",
        workerName: fallbackSession?.workerName || "Worker",
        workerAvatar: fallbackSession?.workerAvatar,
        workerPhone: fallbackSession?.workerPhone,
        customerAddress: fallbackSession?.customerAddress,
      };
    }

    const cleanInput = enteredOtp.replace(/\D/g, "").trim();
    if (!cleanInput || cleanInput.length < 4) {
      return {
        success: false,
        error: "Please enter the 4-digit OTP provided by the worker.",
      };
    }

    // Call backend API if user is authenticated
    if (getAccessToken()) {
      try {
        const idToVerify = session.visitId || session.jobId;
        if (!idToVerify) {
          return {
            success: false,
            error: "No active visit or job found to verify arrival.",
          };
        }
        try {
          await http.put(`/visits/${idToVerify}/verify-arrival-otp`, {
            otp: cleanInput,
          });
        } catch (firstErr: any) {
          if (session.jobId && session.jobId !== idToVerify) {
            await http.put(`/jobs/${session.jobId}/verify-arrival-otp`, {
              otp: cleanInput,
            });
          } else {
            throw firstErr;
          }
        }
      } catch (err: any) {
        const backendError =
          err?.response?.data?.message ||
          "Incorrect OTP. Please check the code provided by the worker and try again.";

        // If backend reports OTP expired/not found, check if the job was already completed/verified
        if (
          String(backendError).includes("ARRIVAL_OTP_EXPIRED") ||
          String(backendError).includes("No pending arrival OTP")
        ) {
          try {
            const checkRes = await http.get<any>(`/jobs/${session.jobId}`);
            if (
              checkRes &&
              [
                "VISIT_COMPLETED",
                "INSPECTION_DONE",
                "REPAIR_NEGOTIATING",
                "REPAIR_APPROVED",
                "IN_PROGRESS",
                "COMPLETED",
              ].includes(checkRes.status)
            ) {
              this.clearArrivalSession();
              return {
                success: true,
                session: { ...session, status: "otp_verified" },
              };
            }
          } catch {}
        }

        return {
          success: false,
          error: backendError,
        };
      }
    } else {
      const cleanExpected = session.otp ? session.otp.replace(/\D/g, "").trim() : "";
      if (cleanExpected && cleanInput !== cleanExpected) {
        return {
          success: false,
          error: "Incorrect OTP. Please check the code provided by the worker and try again.",
        };
      }
    }

    const updatedSession: ArrivalSession = {
      ...session,
      status: "otp_verified",
    };

    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        console.warn("Error removing arrival session:", err);
      }

      this.broadcast("OTP_VERIFIED", updatedSession);
      this.broadcast("SESSION_CLEARED", null);
    }

    return {
      success: true,
      session: updatedSession,
    };
  }

  verifyOtpSuccess(sessionData?: Partial<ArrivalSession>): void {
    let session = this.getSession();
    const updatedSession: ArrivalSession = {
      ...(session || ({} as any)),
      ...sessionData,
      status: "otp_verified",
    };

    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        console.warn("Error removing arrival session:", err);
      }

      this.broadcast("OTP_VERIFIED", updatedSession);
      this.broadcast("SESSION_CLEARED", null);
    }
  }

  reportCustomerNotEntering(): void {
    const session = this.getSession();
    if (!session) return;

    const updated: ArrivalSession = {
      ...session,
      status: "reported_no_otp",
    };

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn("Error updating arrival session:", err);
      }

      this.broadcast("REPORTED_NO_OTP", updated);
    }
  }

  clearSession(): void {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      this.broadcast("SESSION_CLEARED", null);
    }
  }

  clearArrivalSession(): void {
    this.clearSession();
  }

  private broadcast(type: string, data: ArrivalSession | null) {
    if (typeof window === "undefined") return;

    // 1. BroadcastChannel across windows/tabs
    if (this.channel) {
      try {
        this.channel.postMessage({ type, data });
      } catch {}
    }

    // 2. Window CustomEvent in same tab
    try {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { type, data } }));
    } catch {}
  }

  subscribe(callback: (session: ArrivalSession | null, eventType: string) => void): () => void {
    if (typeof window === "undefined") return () => {};

    // Internal handler
    const handleEvent = (type: string, data: ArrivalSession | null) => {
      callback(data, type);
    };

    // 1. BroadcastChannel listener
    const channelHandler = (e: MessageEvent) => {
      if (e.data && e.data.type) {
        handleEvent(e.data.type, e.data.data);
      }
    };
    if (this.channel) {
      this.channel.addEventListener("message", channelHandler);
    }

    // 2. CustomEvent listener (same tab)
    const customEventHandler = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        handleEvent(customEvent.detail.type, customEvent.detail.data);
      }
    };
    window.addEventListener(EVENT_NAME, customEventHandler);

    // 3. Storage event listener (fallback for multi-tab)
    const storageHandler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue) as ArrivalSession;
            handleEvent(parsed.status === "otp_verified" ? "OTP_VERIFIED" : "STORAGE_UPDATED", parsed);
          } catch {}
        } else {
          handleEvent("SESSION_CLEARED", null);
        }
      }
    };
    window.addEventListener("storage", storageHandler);

    return () => {
      if (this.channel) {
        this.channel.removeEventListener("message", channelHandler);
      }
      window.removeEventListener(EVENT_NAME, customEventHandler);
      window.removeEventListener("storage", storageHandler);
    };
  }
}

export const arrivalService = new ArrivalVerificationService();
