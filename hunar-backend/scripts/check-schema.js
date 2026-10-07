const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  const r = await p.$queryRawUnsafe(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE column_name IN ('id', 'job_id', 'jobId')
      AND table_name IN ('ServiceRequest', 'JobOffer', 'Visit', 'Repair', 'Commission', 'Payment', 'Review', 'Conversation', 'Dispute', 'LocationTracking')
  `);
  console.log(JSON.stringify(r, null, 2));
  await p.$disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
