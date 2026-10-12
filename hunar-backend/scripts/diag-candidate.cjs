const { PrismaClient, Prisma } = require('@prisma/client');
const p = new PrismaClient();

async function candidateA(customerId) {
  const t = [];
  const mark = (name, s) => t.push([name, Date.now() - s]);
  const where = { customerId };

  let s = Date.now();
  const [rows, total, categories] = await Promise.all([
    p.serviceRequest.findMany({
      where, skip: 0, take: 50, orderBy: { createdAt: 'desc' },
      include: { _count: { select: { offers: true } } },
    }),
    p.serviceRequest.count({ where }),
    p.serviceCategory.findMany({ select: { id: true, name: true } }),
  ]);
  mark('wave1(list+count+cats)', s);
  if (rows.length === 0) return { t, total: 0, items: 0 };
  const jobIds = rows.map((r) => r.id);
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  s = Date.now();
  const [offers] = await Promise.all([
    p.jobOffer.findMany({
      where: { jobId: { in: jobIds } },
      orderBy: { visitCharge: 'asc' },
      select: {
        id: true, jobId: true, workerId: true, visitCharge: true,
        message: true, status: true, negotiationRound: true, lockedAt: true, createdAt: true,
      },
    }),
    p.$executeRaw`UPDATE "JobOffer" SET status = 'VIEWING' WHERE status = 'PENDING' AND "jobId" IN (${Prisma.join(jobIds)})`,
  ]);
  mark('wave2(offers+rawUpdate)', s);

  s = Date.now();
  const workerIds = [...new Set(offers.map((o) => o.workerId))];
  const [workers, ratingRows, completedRows] = await Promise.all([
    workerIds.length
      ? p.user.findMany({
          where: { id: { in: workerIds } },
          select: { id: true, name: true, avatarUrl: true, phone: true },
        })
      : Promise.resolve([]),
    workerIds.length
      ? p.review.groupBy({
          by: ['revieweeId'], where: { revieweeId: { in: workerIds }, isVisible: true },
          _avg: { rating: true }, _count: { _all: true },
        })
      : Promise.resolve([]),
    workerIds.length
      ? p.serviceRequest.groupBy({
          by: ['selectedWorkerId'],
          where: { selectedWorkerId: { in: workerIds }, status: { in: ['COMPLETED', 'PAID', 'REVIEWED'] } },
          _count: { _all: true },
        })
      : Promise.resolve([]),
  ]);
  mark('wave3(workers+aggs)', s);

  const workerMap = new Map(workers.map((w) => [w.id, w]));
  const ratingMap = new Map(ratingRows.map((r) => [r.revieweeId, r]));
  const completedMap = new Map(completedRows.map((c) => [c.selectedWorkerId, c]));
  const offersByJob = new Map();
  for (const o of offers) {
    const list = offersByJob.get(o.jobId);
    if (list) list.push(o);
    else offersByJob.set(o.jobId, [o]);
  }
  const items = rows.map((j) => ({
    id: j.id, categoryName: catMap.get(j.categoryId) ?? null,
    offerCount: j._count.offers,
    offers: (offersByJob.get(j.id) ?? []).map((o) => ({
      worker: workerMap.get(o.workerId),
      avgRating: ratingMap.get(o.workerId)?._avg.rating ?? null,
      visitCharge: Number(o.visitCharge),
    })),
  }));
  return { t, total, items: items.length, withOffers: items.filter((i) => i.offers.length).length };
}

async function currentShape(customerId) {
  const t = [];
  const where = { customerId };
  let s = Date.now();
  const [rows, total] = await Promise.all([
    p.serviceRequest.findMany({
      where, skip: 0, take: 50, orderBy: { createdAt: 'desc' },
      include: { category: { select: { id: true, name: true } }, _count: { select: { offers: true } } },
    }),
    p.serviceRequest.count({ where }),
  ]);
  t.push(['wave1', Date.now() - s]);
  if (rows.length === 0) return { t, total: 0, items: 0 };
  const jobIds = rows.map((r) => r.id);

  s = Date.now();
  const offersP = p.jobOffer.findMany({
    where: { jobId: { in: jobIds } }, orderBy: { visitCharge: 'asc' },
    include: { worker: { select: { id: true, name: true, avatarUrl: true, phone: true } } },
  });
  const viewP = p.jobOffer.updateMany({
    where: { jobId: { in: jobIds }, status: 'PENDING' }, data: { status: 'VIEWING' },
  });
  const offers = await offersP;
  await viewP;
  t.push(['wave2', Date.now() - s]);

  s = Date.now();
  const workerIds = [...new Set(offers.map((o) => o.workerId))];
  if (workerIds.length) {
    await Promise.all([
      p.review.groupBy({
        by: ['revieweeId'], where: { revieweeId: { in: workerIds }, isVisible: true },
        _avg: { rating: true }, _count: { _all: true },
      }),
      p.serviceRequest.groupBy({
        by: ['selectedWorkerId'],
        where: { selectedWorkerId: { in: workerIds }, status: { in: ['COMPLETED', 'PAID', 'REVIEWED'] } },
        _count: { _all: true },
      }),
    ]);
  }
  t.push(['wave3', Date.now() - s]);
  return { t, total, items: rows.length };
}

(async () => {
  const customer = await p.user.findUnique({ where: { phone: '03120000002' } });
  await p.$queryRaw`SELECT 1`;
  for (let round = 1; round <= 4; round++) {
    const cur = await currentShape(customer.id);
    const a = await candidateA(customer.id);
    const sum = (r) => r.t.reduce((x, [, ms]) => x + ms, 0);
    console.log(
      `round ${round} | current ${sum(cur)}ms [${cur.t.map(([n, ms]) => n + ':' + ms).join(' ')}] ` +
      `| candidateA ${sum(a)}ms [${a.t.map(([n, ms]) => n + ':' + ms).join(' ')}] items=${a.items} withOffers=${a.withOffers} total=${a.total}`,
    );
  }
  await p.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
