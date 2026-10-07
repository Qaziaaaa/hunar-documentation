const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const ORDER_CODE_REGEX = /^[A-Z]{2}[0-9]-[0-9]{2}[A-Z]$/;

function generateOrderCode() {
  const randChar = (set) => set[crypto.randomInt(0, set.length)];
  return `${randChar(LETTERS)}${randChar(LETTERS)}${randChar(DIGITS)}-${randChar(DIGITS)}${randChar(DIGITS)}${randChar(LETTERS)}`;
}

async function run() {
  console.log('--- STARTING ORDER CODE DATA MIGRATION ---');

  const allJobs = await prisma.serviceRequest.findMany({
    select: { id: true, title: true }
  });
  console.log(`Found ${allJobs.length} total jobs in database.`);

  const usedCodes = new Set();
  for (const job of allJobs) {
    if (ORDER_CODE_REGEX.test(job.id)) {
      usedCodes.add(job.id);
    }
  }

  const jobsToMigrate = allJobs.filter((j) => !ORDER_CODE_REGEX.test(j.id));
  console.log(`${jobsToMigrate.length} jobs need migration to new Order Code format (LLD-DDL).`);

  if (jobsToMigrate.length === 0) {
    console.log('All jobs are already using the new Order Code format!');
    await prisma.$disconnect();
    return;
  }

  const idMap = new Map(); // oldId -> newOrderCode
  for (const job of jobsToMigrate) {
    let newCode;
    do {
      newCode = generateOrderCode();
    } while (usedCodes.has(newCode));
    usedCodes.add(newCode);
    idMap.set(job.id, newCode);
  }

  console.log('Executing atomic database updates for each job...');

  for (const [oldId, newCode] of idMap.entries()) {
    console.log(`Migrating ${oldId} -> ${newCode}`);

    // Update ServiceRequest directly (cascades to all 9 FK tables)
    await prisma.$executeRawUnsafe(
      `UPDATE "ServiceRequest" SET "id" = $1 WHERE "id" = $2`,
      newCode,
      oldId
    );

    // Update WalletLedger
    await prisma.$executeRawUnsafe(
      `UPDATE "WalletLedger"
       SET "referenceId" = $1,
           "idempotencyKey" = REPLACE("idempotencyKey", $2, $1),
           "note" = REPLACE("note", $2, $1)
       WHERE "referenceType" = 'job' AND "referenceId" = $2`,
      newCode,
      oldId
    );

    // Update AuditLog
    await prisma.$executeRawUnsafe(
      `UPDATE "AuditLog"
       SET "targetId" = $1
       WHERE ("targetType" = 'JOB' OR "targetType" = 'SERVICE_REQUEST') AND "targetId" = $2`,
      newCode,
      oldId
    );

    // Update WorkerNotification data and body
    await prisma.$executeRawUnsafe(
      `UPDATE "WorkerNotification"
       SET "data" = jsonb_set("data"::jsonb, '{jobId}', to_jsonb($1::text)),
           "body" = REPLACE("body", $2, $1)
       WHERE "data" IS NOT NULL AND "data"->>'jobId' = $2`,
      newCode,
      oldId
    );

    // Update AdminNotification data and body
    await prisma.$executeRawUnsafe(
      `UPDATE "AdminNotification"
       SET "data" = jsonb_set("data"::jsonb, '{jobId}', to_jsonb($1::text)),
           "body" = REPLACE("body", $2, $1)
       WHERE "data" IS NOT NULL AND "data"->>'jobId' = $2`,
      newCode,
      oldId
    );
  }

  console.log('--- VERIFYING REFERENTIAL INTEGRITY ---');
  const postJobs = await prisma.serviceRequest.findMany({ select: { id: true } });
  const invalidJobs = postJobs.filter((j) => !ORDER_CODE_REGEX.test(j.id));
  if (invalidJobs.length > 0) {
    throw new Error(`Referential integrity failure: ${invalidJobs.length} jobs still have invalid IDs: ${JSON.stringify(invalidJobs)}`);
  }

  const [offers, visits, repairs, commissions, payments, reviews, convs] = await Promise.all([
    prisma.jobOffer.findMany({ select: { jobId: true } }),
    prisma.visit.findMany({ select: { jobId: true } }),
    prisma.repair.findMany({ select: { jobId: true } }),
    prisma.commission.findMany({ select: { jobId: true } }),
    prisma.payment.findMany({ select: { jobId: true } }),
    prisma.review.findMany({ select: { jobId: true } }),
    prisma.conversation.findMany({ select: { jobId: true } }),
  ]);

  const allFkJobIds = [
    ...offers.map(o => o.jobId),
    ...visits.map(v => v.jobId),
    ...repairs.map(r => r.jobId),
    ...commissions.map(c => c.jobId),
    ...payments.map(p => p.jobId),
    ...reviews.map(r => r.jobId),
    ...convs.map(c => c.jobId),
  ];

  const invalidFk = allFkJobIds.filter(id => !ORDER_CODE_REGEX.test(id));
  if (invalidFk.length > 0) {
    throw new Error(`Foreign key integrity failure: ${invalidFk.length} foreign keys have invalid IDs: ${JSON.stringify(invalidFk)}`);
  }

  console.log(`SUCCESS! All ${postJobs.length} jobs and all ${allFkJobIds.length} foreign key relations are now 100% migrated to valid Order Codes (LLD-DDL)!`);
  console.log('Sample migrated Order Codes:', postJobs.slice(0, 5).map(j => j.id));

  await prisma.$disconnect();
}

run().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
