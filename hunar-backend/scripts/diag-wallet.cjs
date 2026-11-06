const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ log: [{ level: 'query', emit: 'event' }] });
const queries = [];
p.$on('query', (e) => queries.push({ d: e.duration, sql: e.query.replace(/\s+/g, ' ').slice(0, 100) }));
const time = async (label, fn) => {
  queries.length = 0;
  const s = Date.now();
  const r = await fn();
  console.log(label, Date.now() - s + 'ms', '| SQL:', queries.map((q) => q.d + 'ms ' + q.sql).join(' || ') || 'none');
  return r;
};
(async () => {
  const u = await p.user.findUnique({ where: { phone: '03120000001' } });
  await p.$queryRaw`SELECT 1`;
  for (let i = 0; i < 3; i++) {
    await time('upsert  ', () => p.workerWallet.upsert({ where: { userId: u.id }, update: {}, create: { userId: u.id } }));
    await time('findUniq', () => p.workerWallet.findUnique({ where: { userId: u.id } }));
  }
  await p.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
