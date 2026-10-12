const { PrismaClient, Prisma } = require('@prisma/client');
const p = new PrismaClient();
const time = async (label, fn) => {
  const s = Date.now();
  await fn();
  console.log(label, Date.now() - s + 'ms');
};
(async () => {
  const customer = await p.user.findUnique({ where: { phone: '03120000002' } });
  await p.$queryRaw`SELECT 1`;
  const where = { customerId: customer.id };
  console.log('--- baseline singles ---');
  await time('findMany no-include', () =>
    p.serviceRequest.findMany({ where, take: 50, orderBy: { createdAt: 'desc' } }));
  await time('findMany with-include', () =>
    p.serviceRequest.findMany({
      where, take: 50, orderBy: { createdAt: 'desc' },
      include: { category: { select: { id: true, name: true } }, _count: { select: { offers: true } } },
    }));
  await time('count', () => p.serviceRequest.count({ where }));

  console.log('--- concurrency ---');
  await time('Promise.all(count,count)', () =>
    Promise.all([p.serviceRequest.count({ where }), p.serviceRequest.count({ where })]));
  await time('Promise.all(count,updateMany)', () =>
    Promise.all([
      p.serviceRequest.count({ where }),
      p.jobOffer.updateMany({ where: { status: 'VIEWING' }, data: { status: 'VIEWING' } }),
    ]));
  await time('Promise.all(count,executeRaw)', () =>
    Promise.all([
      p.serviceRequest.count({ where }),
      p.$executeRaw`UPDATE "JobOffer" SET status = 'VIEWING' WHERE status = 'VIEWING' AND "jobId" IN (SELECT id FROM "ServiceRequest" WHERE "customerId" = ${customer.id})`,
    ]));

  console.log('--- raw update alone ---');
  await time('executeRaw update a', () =>
    p.$executeRaw`UPDATE "JobOffer" SET status = 'VIEWING' WHERE status = 'VIEWING' AND "jobId" IN (SELECT id FROM "ServiceRequest" WHERE "customerId" = ${customer.id})`);
  await time('executeRaw update b', () =>
    p.$executeRaw`UPDATE "JobOffer" SET status = 'VIEWING' WHERE status = 'VIEWING' AND "jobId" IN (SELECT id FROM "ServiceRequest" WHERE "customerId" = ${customer.id})`);

  console.log('--- offers shapes ---');
  const rows = await p.serviceRequest.findMany({ where, take: 50 });
  const jobIds = rows.map((r) => r.id);
  const offerSelect = {
    id: true, jobId: true, workerId: true, visitCharge: true,
    message: true, status: true, negotiationRound: true, lockedAt: true, createdAt: true,
  };
  await time('offers select no-include', () =>
    p.jobOffer.findMany({ where: { jobId: { in: jobIds } }, orderBy: { visitCharge: 'asc' }, select: offerSelect }));
  await time('offers select no-include 2', () =>
    p.jobOffer.findMany({ where: { jobId: { in: jobIds } }, orderBy: { visitCharge: 'asc' }, select: offerSelect }));

  console.log('--- wave3 combo ---');
  const offers = await p.jobOffer.findMany({ where: { jobId: { in: jobIds } }, select: { workerId: true } });
  const wids = [...new Set(offers.map((o) => o.workerId))];
  await time('Promise.all(workers,raw-update,2 groupBys)', () =>
    Promise.all([
      p.user.findMany({ where: { id: { in: wids } }, select: { id: true, name: true, avatarUrl: true, phone: true } }),
      p.$executeRaw`UPDATE "JobOffer" SET status = 'VIEWING' WHERE status = 'PENDING' AND "jobId" IN (${Prisma.join(jobIds)})`,
      p.review.groupBy({
        by: ['revieweeId'], where: { revieweeId: { in: wids }, isVisible: true },
        _avg: { rating: true }, _count: { _all: true },
      }),
      p.serviceRequest.groupBy({
        by: ['selectedWorkerId'],
        where: { selectedWorkerId: { in: wids }, status: { in: ['COMPLETED', 'PAID', 'REVIEWED'] } },
        _count: { _all: true },
      }),
    ]));
  await p.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
