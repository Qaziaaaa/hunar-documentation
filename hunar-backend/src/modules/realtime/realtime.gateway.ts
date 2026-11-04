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
import { jobRoom, LOCATION_EVENTS, WORKERS_ROOM } from '../jobs/jobs.events';
import { PrismaService } from '../../prisma/prisma.service';

@WebSocketGateway()
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly realtimeService: RealtimeService,
    private readonly moduleRef: ModuleRef,
    private readonly prisma: PrismaService,
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
    // Marketplace fan-out: job:new goes to every connected worker feed.
    if (payload.role === 'WORKER') {
      this.realtimeService.joinRoom(client, WORKERS_ROOM);
    }
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
  async handleTrackStart(client: Socket, payload: { jobId: string }): Promise<void> {
    const user: JwtPayload | undefined = client.data?.user;
    if (!user || !payload?.jobId) {
      return;
    }

    try {
      const job = await this.prisma.serviceRequest.findUnique({
        where: { id: payload.jobId },
        select: { customerId: true, selectedWorkerId: true },
      });

      if (!job) {
        this.logger.warn(`User ${user.sub} attempted to track non-existent job ${payload.jobId}`);
        client.emit('error', { message: 'Job not found' });
        return;
      }

      const isCustomer = user.role === 'CUSTOMER' && job.customerId === user.sub;
      const isAssignedWorker = user.role === 'WORKER' && job.selectedWorkerId === user.sub;
      const isAdmin = user.role === 'ADMIN';

      if (!isCustomer && !isAssignedWorker && !isAdmin) {
        this.logger.warn(
          `Unauthorized tracking attempt: user ${user.sub} (${user.role}) attempted to join jobRoom ${payload.jobId}`,
        );
        client.emit('error', { message: 'Unauthorized room subscription' });
        return;
      }

      this.realtimeService.joinRoom(client, jobRoom(payload.jobId));
      this.logger.debug(`User ${user.sub} joined room ${jobRoom(payload.jobId)}`);
    } catch (err: any) {
      this.logger.error(`Error authorizing room subscription: ${err?.message}`);
      client.emit('error', { message: 'Failed to authorize room subscription' });
    }
  }

  @SubscribeMessage(LOCATION_EVENTS.locationTrackStop)
  handleTrackStop(client: Socket, payload: { jobId: string }): void {
    if (payload?.jobId) {
      this.realtimeService.leaveRoom(client, jobRoom(payload.jobId));
    }
  }
}
