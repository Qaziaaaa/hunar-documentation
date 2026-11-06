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

let lastErrorLogged = 0;

export function getSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  return connectSocket();
}

function initSocketInstance(): Socket | null {
  if (typeof window === "undefined") return null;
  if (!socket) {
    const token = getAccessToken();
    lastToken = token;
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket"],
      auth: { token },
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 5000,
    });

    socket.on("connect", () => {
      console.log("[Socket.io] Connected successfully to:", SOCKET_URL, "socketId:", socket?.id);
    });

    socket.on("connect_error", (err) => {
      const now = Date.now();
      if (now - lastErrorLogged > 10000) {
        lastErrorLogged = now;
        console.warn("[Socket.io] Connection notice:", err.message);
      }
    });
  }
  return socket;
}

export function connectSocket(): Socket | null {
  if (disconnectTimeout) {
    clearTimeout(disconnectTimeout);
    disconnectTimeout = null;
  }

  const currentToken = getAccessToken();
  if (!currentToken) {
    return null;
  }

  connectionCount++;
  const s = initSocketInstance();
  if (!s) return null;

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

  // Only fully disconnect when forced (e.g. user logout)
  if (force) {
    connectionCount = 0;
    if (socket?.connected) {
      socket.disconnect();
    }
    socket = null;
  }
}