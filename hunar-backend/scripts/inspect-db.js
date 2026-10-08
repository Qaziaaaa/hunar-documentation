const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  const [jobs, offers, visits, repairs, commissions, payments, reviews, convs, disputes, tracks, ledgers, wNotifs, aNotifs, audits] = await Promise.all([
    p.serviceRequest.findMany({ select: { id: true, title: true } }),
    p.jobOffer.findMany({ select: { id: true, jobId: true } }),
    p.visit.findMany({ select: { id: true, jobId: true } }),
    p.repair.findMany({ select: { id: true, jobId: true } }),
    p.commission.findMany({ select: { id: true, jobId: true } }),
    p.payment.findMany({ select: { id: true, jobId: true } }),
    p.review.findMany({ select: { id: true, jobId: true } }),
    p.conversation.findMany({ select: { id: true, jobId: true } }),
    p.dispute.findMany({ select: { id: true, jobId: true } }),
    p.locationTracking.findMany({ select: { id: true, jobId: true } }),
    p.walletLedger.findMany({ select: { id: true, referenceType: true, referenceId: true } }),
    p.workerNotification.findMany({ select: { id: true, data: true } }),
    p.adminNotification.findMany({ select: { id: true, data: true } }),
    p.auditLog.findMany({ select: { id: true, targetType: true, targetId: true } }),
  ]);
  console.log(JSON.stringify({
    jobsCount: jobs.length,
    offersCount: offers.length,
    visitsCount: visits.length,
    repairsCount: repairs.length,
    commissionsCount: commissions.length,
    paymentsCount: payments.length,
    reviewsCount: reviews.length,
    convsCount: convs.length,
    disputesCount: disputes.length,
    tracksCount: tracks.length,
    ledgersCount: ledgers.length,
    wNotifsCount: wNotifs.length,
    aNotifsCount: aNotifs.length,
    auditsCount: audits.length,
    jobs: jobs.map(j => j.id)
  }, null, 2));
  await p.$disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
