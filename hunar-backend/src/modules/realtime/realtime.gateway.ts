import { Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RealtimeService } from './realtime.service';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { jobRoom, LOCATION_EVENTS } from '../jobs/jobs.events';

@WebSocketGateway()
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly realtimeService: RealtimeService,
    private readonly moduleRef: ModuleRef,
  ) {}

  afterInit(): void {
    this.realtimeService.setServer(this.server);
  }

  private async authenticateClient(client: Socket): Promise<JwtPayload | null> {
    const token =
      client.handshake.auth?.token ?? client.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return null;
    try {
      const jwt = this.moduleRef.get(JwtService, { strict: false });
      const config = this.moduleRef.get(ConfigService, { strict: false });
      const payload: JwtPayload = await jwt.verifyAsync(token, {
        secret: config.get<string>('jwt.secret'),
      });
      client.data.user = payload;
      return payload;
    } catch {
      return null;
    }
  }

  async handleConnection(client: Socket): Promise<void> {
    const payload = await this.authenticateClient(client);
    if (!payload) {
      client.disconnect(true);
      return;
    }
    this.realtimeService.register(client, payload.sub);
    this.logger.debug(`Client connected: ${client.id} (user: ${payload.sub})`);
  }

  handleDisconnect(client: Socket): void {
    const user: JwtPayload | undefined = client.data.user;
    if (user) {
      this.realtimeService.unregister(client, user.sub);
    }
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage(LOCATION_EVENTS.locationTrackStart)
  handleTrackStart(client: Socket, payload: { jobId: string }): void {
    if (payload?.jobId) {
      this.realtimeService.joinRoom(client, jobRoom(payload.jobId));
    }
  }

  @SubscribeMessage(LOCATION_EVENTS.locationTrackStop)
  handleTrackStop(client: Socket, payload: { jobId: string }): void {
    if (payload?.jobId) {
      this.realtimeService.leaveRoom(client, jobRoom(payload.jobId));
    }
  }
}
