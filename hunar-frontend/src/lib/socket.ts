import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "./api-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ??
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v\d+$/, "") ??
  "http://localhost:4000";

let socket: Socket | null = null;
let lastToken: string | null | undefined = undefined;
let connectionCount = 0;
let disconnectTimeout: ReturnType<typeof setTimeout> | null = null;

export function getSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  if (!socket) {
    const token = getAccessToken();
    lastToken = token;
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      auth: { token },
    });

    socket.on("connect", () => {
      console.log("[Socket.io] Connected successfully to:", SOCKET_URL, "socketId:", socket?.id);
    });

    socket.on("connect_error", (err) => {
      console.warn("[Socket.io] Connection error:", err.message);
    });
  }
  return socket;
}

export function connectSocket(): Socket | null {
  if (disconnectTimeout) {
    clearTimeout(disconnectTimeout);
    disconnectTimeout = null;
  }
  connectionCount++;

  const s = getSocket();
  if (!s) return null;

  const currentToken = getAccessToken();
  if (currentToken !== lastToken) {
    lastToken = currentToken;
    s.auth = { token: currentToken };
    if (s.connected) {
      s.disconnect();
    }
  }

  if (!s.connected) {
    s.auth = { token: currentToken };
    s.connect();
  }
  return s;
}

export function disconnectSocket(force = false): void {
  connectionCount = Math.max(0, connectionCount - 1);

  if (disconnectTimeout) {
    clearTimeout(disconnectTimeout);
    disconnectTimeout = null;
  }

  if (force) {
    connectionCount = 0;
    if (socket?.connected) {
      socket.disconnect();
    }
    socket = null;
    return;
  }

  if (connectionCount === 0) {
    disconnectTimeout = setTimeout(() => {
      if (connectionCount === 0 && socket) {
        if (socket.connected) {
          socket.disconnect();
        }
        socket = null;
      }
    }, 1200);
  }
}