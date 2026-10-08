const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  const ledgers = await p.walletLedger.findMany({
    where: { referenceType: 'job' },
    take: 5
  });
  console.log('Sample Job Ledgers:', ledgers);

  const notifs = await p.workerNotification.findMany({
    take: 5
  });
  console.log('Sample Worker Notifications:', notifs);

  await p.$disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
