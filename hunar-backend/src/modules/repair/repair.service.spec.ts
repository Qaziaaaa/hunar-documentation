import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { JobStatus, Role } from '@prisma/client';
import { RepairService } from './repair.service';
import { JOB_EVENTS } from '../jobs/jobs.events';

describe('RepairService — rejectRepair (AUDIT-014)', () => {
  let service: RepairService;
  let prismaMock: any;
  let eventBusMock: any;
  let jobsServiceMock: any;
  let realtimeMock: any;
  let configMock: any;

  const mockCustomer = {
    sub: 'cust-1',
    phone: '+923001111111',
    role: Role.CUSTOMER,
  };

  const mockJob = {
    id: 'job-1',
    customerId: 'cust-1',
    status: JobStatus.REPAIR_NEGOTIATING,
    lockedVisitCharge: 500,
    suggestedVisitCharge: 500,
  };

  const mockRepair = {
    id: 'rep-1',
    jobId: 'job-1',
    workerId: 'worker-1',
    status: 'PROPOSED',
    amount: 1500,
    job: mockJob,
    revisions: [],
  };

  beforeEach(() => {
    prismaMock = {
      repair: {
        findUnique: jest.fn(async () => mockRepair),
        findFirst: jest.fn(async () => mockRepair),
        update: jest.fn(async ({ data }) => ({ id: 'rep-1', ...data })),
      },
      serviceRequest: {
        findUnique: jest.fn(async () => mockJob),
        update: jest.fn(async ({ data }) => ({ id: 'job-1', ...data })),
      },
    };

    eventBusMock = {
      emit: jest.fn(),
    };

    jobsServiceMock = {
      transitionJobState: jest.fn(),
      clearAvailableJobsCache: jest.fn(),
    };

    realtimeMock = {
      emitToRoom: jest.fn(),
    };

    configMock = {
      get: jest.fn((key: string, def: any) => def),
    };

    service = new RepairService(
      prismaMock,
      eventBusMock,
      jobsServiceMock,
      realtimeMock,
      configMock,
    );
  });

  it('throws ForbiddenException if a worker tries to reject the quote', async () => {
    const workerUser = { sub: 'worker-1', phone: '+923002222222', role: Role.WORKER };

    await expect(service.rejectRepair('rep-1', workerUser)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('throws BadRequestException if the repair is not in pending status', async () => {
    prismaMock.repair.findFirst.mockResolvedValue({
      ...mockRepair,
      status: 'ACCEPTED',
    });

    await expect(service.rejectRepair('rep-1', mockCustomer)).rejects.toThrow(
      'REPAIR_INVALID_STATE',
    );
  });

  it('transitions both repair to REJECTED and serviceRequest to REPAIR_DECLINED', async () => {
    const result = await service.rejectRepair('rep-1', mockCustomer);

    expect(result.status).toBe('REJECTED');

    // Verifies serviceRequest was updated in DB to valid schema enum
    expect(prismaMock.serviceRequest.update).toHaveBeenCalledWith({
      where: { id: 'job-1' },
      data: { status: JobStatus.REPAIR_DECLINED },
    });

    // Verifies job.statusChanged was emitted with JobStatus.REPAIR_DECLINED
    expect(eventBusMock.emit).toHaveBeenCalledWith('job.statusChanged', {
      jobId: 'job-1',
      oldStatus: JobStatus.REPAIR_NEGOTIATING,
      newStatus: JobStatus.REPAIR_DECLINED,
    });

    // Verifies WebSocket events emit valid JobStatus.REPAIR_DECLINED
    expect(realtimeMock.emitToRoom).toHaveBeenCalledWith(
      'user:worker-1',
      JOB_EVENTS.jobStatusChanged,
      expect.objectContaining({
        jobId: 'job-1',
        newStatus: JobStatus.REPAIR_DECLINED,
        repair: expect.objectContaining({
          status: 'REJECTED',
          repairCharge: 0,
          payableAmount: 500,
        }),
      }),
    );
  });
});
