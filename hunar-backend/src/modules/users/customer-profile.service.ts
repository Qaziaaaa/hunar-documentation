import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role, JobStatus } from '@prisma/client';

const PAID_JOB_STATUSES: JobStatus[] = [JobStatus.COMPLETED, JobStatus.PAID, JobStatus.REVIEWED];

@Injectable()
export class CustomerProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getCustomerProfile(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, role: Role.CUSTOMER },
      select: {
        id: true,
        phone: true,
        name: true,
        avatarUrl: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        _count: { select: { customerJobs: true } },
      },
    });
    if (!user) {
      throw new NotFoundException('Customer not found');
    }

    const [jobs, reviews, payments] = await Promise.all([
      this.prisma.serviceRequest.findMany({
        where: { customerId: userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          title: true,
          status: true,
          urgency: true,
          city: true,
          area: true,
          suggestedVisitCharge: true,
          lockedVisitCharge: true,
          selectedWorkerId: true,
          createdAt: true,
          completedAt: true,
          cancelledAt: true,
          category: { select: { id: true, name: true, nameUrdu: true } },
          selectedWorker: { select: { id: true, name: true, phone: true, avatarUrl: true } },
        },
      }),
      this.prisma.review.findMany({
        where: { reviewerId: userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          jobId: true,
          rating: true,
          comment: true,
          createdAt: true,
          reviewee: { select: { id: true, name: true, avatarUrl: true } },
          job: { select: { title: true } },
        },
      }),
      this.prisma.serviceRequest.findMany({
        where: {
          customerId: userId,
          status: { in: PAID_JOB_STATUSES },
        },
        orderBy: { completedAt: 'desc' },
        take: 20,
        select: {
          id: true,
          title: true,
          lockedVisitCharge: true,
          suggestedVisitCharge: true,
          status: true,
          completedAt: true,
          selectedWorker: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      profile: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
      stats: {
        jobsCount: user._count.customerJobs,
        reviewsCount: reviews.length,
        totalSpent: payments.reduce(
          (sum, job) => sum + Number(job.lockedVisitCharge ?? job.suggestedVisitCharge ?? 0),
          0,
        ),
      },
      recentJobs: jobs,
      recentReviews: reviews,
      paymentHistory: payments.map((p: any) => ({
        jobId: p.id,
        jobTitle: p.title,
        amount: p.lockedVisitCharge ?? p.suggestedVisitCharge ?? null,
        status: p.status,
        paidAt: p.completedAt,
        worker: p.selectedWorker,
      })),
    };
  }

  async updateCustomerProfile(userId: string, data: { name?: string; avatarUrl?: string | null }) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, role: Role.CUSTOMER },
    });
    if (!user) {
      throw new NotFoundException('Customer not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
      },
      select: {
        id: true,
        phone: true,
        name: true,
        avatarUrl: true,
        role: true,
      },
    });

    return { user: updated };
  }

  async getCustomerJobs(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      this.prisma.serviceRequest.findMany({
        where: { customerId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          status: true,
          urgency: true,
          city: true,
          area: true,
          suggestedVisitCharge: true,
          lockedVisitCharge: true,
          selectedWorkerId: true,
          createdAt: true,
          completedAt: true,
          cancelledAt: true,
          category: { select: { id: true, name: true, nameUrdu: true } },
          selectedWorker: { select: { id: true, name: true, phone: true, avatarUrl: true } },
        },
      }),
      this.prisma.serviceRequest.count({ where: { customerId: userId } }),
    ]);

    return {
      items: jobs,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getCustomerReviews(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { reviewerId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          jobId: true,
          rating: true,
          comment: true,
          createdAt: true,
          reviewee: { select: { id: true, name: true, avatarUrl: true } },
          job: { select: { title: true, category: { select: { name: true } } } },
        },
      }),
      this.prisma.review.count({ where: { reviewerId: userId } }),
    ]);

    return {
      items: reviews,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}