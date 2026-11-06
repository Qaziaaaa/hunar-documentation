import { RealtimeGateway } from './realtime.gateway';
import { RealtimeService } from './realtime.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ModuleRef } from '@nestjs/core';
import { Socket } from 'socket.io';
import { jobRoom } from '../jobs/jobs.events';

describe('RealtimeGateway (AUDIT-017 Authorization Checks)', () => {
  let gateway: RealtimeGateway;
  let realtimeService: jest.Mocked<RealtimeService>;
  let prisma: any;
  let moduleRef: jest.Mocked<ModuleRef>;

  beforeEach(() => {
    realtimeService = {
      setServer: jest.fn(),
      register: jest.fn(),
      unregister: jest.fn(),
      joinRoom: jest.fn(),
      leaveRoom: jest.fn(),
      emitToRoom: jest.fn(),
      emitToUser: jest.fn(),
    } as any;

    prisma = {
      serviceRequest: {
        findUnique: jest.fn(),
      },
    };

    moduleRef = {
      get: jest.fn(),
    } as any;

    gateway = new RealtimeGateway(realtimeService, moduleRef, prisma as PrismaService);
  });

  function createMockSocket(user?: { sub: string; role: string }): jest.Mocked<Socket> {
    return {
      id: 'sock-123',
      data: { user },
      emit: jest.fn(),
    } as unknown as jest.Mocked<Socket>;
  }

  it('rejects tracking when client has no authenticated user', async () => {
    const socket = createMockSocket(undefined);
    await gateway.handleTrackStart(socket, { jobId: 'job-1' });

    expect(prisma.serviceRequest.findUnique).not.toHaveBeenCalled();
    expect(realtimeService.joinRoom).not.toHaveBeenCalled();
  });

  it('emits error and rejects when job does not exist', async () => {
    prisma.serviceRequest.findUnique.mockResolvedValue(null);
    const socket = createMockSocket({ sub: 'user-1', role: 'CUSTOMER' });

    await gateway.handleTrackStart(socket, { jobId: 'job-nonexistent' });

    expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Job not found' });
    expect(realtimeService.joinRoom).not.toHaveBeenCalled();
  });

  it('rejects unauthorized customer from joining another customer\'s job room', async () => {
    prisma.serviceRequest.findUnique.mockResolvedValue({
      customerId: 'customer-owner',
      selectedWorkerId: 'worker-assigned',
    });
    const socket = createMockSocket({ sub: 'attacker-customer', role: 'CUSTOMER' });

    await gateway.handleTrackStart(socket, { jobId: 'job-1' });

    expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Unauthorized room subscription' });
    expect(realtimeService.joinRoom).not.toHaveBeenCalled();
  });

  it('rejects unassigned worker from joining private job room', async () => {
    prisma.serviceRequest.findUnique.mockResolvedValue({
      customerId: 'customer-owner',
      selectedWorkerId: 'worker-assigned',
    });
    const socket = createMockSocket({ sub: 'unassigned-worker', role: 'WORKER' });

    await gateway.handleTrackStart(socket, { jobId: 'job-1' });

    expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Unauthorized room subscription' });
    expect(realtimeService.joinRoom).not.toHaveBeenCalled();
  });

  it('allows authorized customer owner to join the job room', async () => {
    prisma.serviceRequest.findUnique.mockResolvedValue({
      customerId: 'customer-owner',
      selectedWorkerId: 'worker-assigned',
    });
    const socket = createMockSocket({ sub: 'customer-owner', role: 'CUSTOMER' });

    await gateway.handleTrackStart(socket, { jobId: 'job-1' });

    expect(realtimeService.joinRoom).toHaveBeenCalledWith(socket, jobRoom('job-1'));
    expect(socket.emit).not.toHaveBeenCalledWith('error', expect.anything());
  });

  it('allows assigned technician to join the job room', async () => {
    prisma.serviceRequest.findUnique.mockResolvedValue({
      customerId: 'customer-owner',
      selectedWorkerId: 'worker-assigned',
    });
    const socket = createMockSocket({ sub: 'worker-assigned', role: 'WORKER' });

    await gateway.handleTrackStart(socket, { jobId: 'job-1' });

    expect(realtimeService.joinRoom).toHaveBeenCalledWith(socket, jobRoom('job-1'));
    expect(socket.emit).not.toHaveBeenCalledWith('error', expect.anything());
  });

  it('allows ADMIN to join any job room', async () => {
    prisma.serviceRequest.findUnique.mockResolvedValue({
      customerId: 'customer-owner',
      selectedWorkerId: 'worker-assigned',
    });
    const socket = createMockSocket({ sub: 'admin-1', role: 'ADMIN' });

    await gateway.handleTrackStart(socket, { jobId: 'job-1' });

    expect(realtimeService.joinRoom).toHaveBeenCalledWith(socket, jobRoom('job-1'));
    expect(socket.emit).not.toHaveBeenCalledWith('error', expect.anything());
  });
});

