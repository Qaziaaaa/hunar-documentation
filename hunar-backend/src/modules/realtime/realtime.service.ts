import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@Injectable()
export class RealtimeService {
  private server: Server | null = null;
  private socketsByUser = new Map<string, Set<Socket>>();

  setServer(server: Server): void {
    this.server = server;
  }

  register(socket: Socket, userId: string): void {
    let set = this.socketsByUser.get(userId);
    if (!set) {
      set = new Set();
      this.socketsByUser.set(userId, set);
    }
    set.add(socket);
    socket.join(`user:${userId}`);
  }

  unregister(socket: Socket, userId: string): void {
    const set = this.socketsByUser.get(userId);
    if (set) {
      set.delete(socket);
      if (set.size === 0) this.socketsByUser.delete(userId);
    }
    socket.leave(`user:${userId}`);
  }

  emitToRoom(room: string, event: string, data: unknown): void {
    this.server?.to(room).emit(event, data);
  }

  emitToUsers(userIds: string[], event: string, data: unknown): void {
    for (const uid of userIds) {
      this.emitToRoom(`user:${uid}`, event, data);
    }
  }

  joinRoom(socket: Socket, room: string): void {
    socket.join(room);
  }

  leaveRoom(socket: Socket, room: string): void {
    socket.leave(room);
  }
}
