"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/api-client";
import { isMockMode } from "@/lib/data-source";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/lib/socket-events";

const REFRESH_EVENTS = [
  SOCKET_EVENTS.jobOffer,
  SOCKET_EVENTS.jobOfferAccepted,
  SOCKET_EVENTS.jobStatusChanged,
  SOCKET_EVENTS.jobClosed,
  SOCKET_EVENTS.jobCancelled,
] as const;

/**
 * Keeps the customer portal in sync with backend realtime events:
 * connects the socket on mount and invalidates customer queries
 * (jobs list, offers hub) when an offer/status change arrives.
 */
export function CustomerRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isMockMode() || !getAccessToken()) return;
    const socket = connectSocket();
    if (!socket) return;

    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ["customer"] });
    };
    for (const event of REFRESH_EVENTS) {
      socket.on(event, refresh);
    }

    return () => {
      for (const event of REFRESH_EVENTS) {
        socket.off(event, refresh);
      }
      disconnectSocket();
    };
  }, [queryClient]);

  return null;
}
