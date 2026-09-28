import { io, type Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function connectSocket(): Socket | null {
  const s = getSocket();
  if (!s) return null;

  const token =
    window.localStorage.getItem("workerfix.access_token") ??
    window.localStorage.getItem("workerfix.access_token") ??
    window.localStorage.getItem("hunar.access_token") ??
    undefined;
  s.auth = { token };
  s.connect();
  return s;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}