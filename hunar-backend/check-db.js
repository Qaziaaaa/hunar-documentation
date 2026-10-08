const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  try {
    const workers = await prisma.user.findMany({
      where: { role: 'WORKER' },
      select: {
        id: true,
        name: true,
        phone: true,
        wallet: true,
        commissions: {
          select: { id: true, visitCharge: true, amount: true, status: true },
        },
        selectedJobs: {
          select: { id: true, title: true, status: true, lockedVisitCharge: true, suggestedVisitCharge: true },
        },
      },
    });

    console.log('=== DETAILED WORKER EARNINGS IN DB ===');
    workers.forEach((w) => {
      const commEarned = w.commissions.reduce((acc, c) => acc + Number(c.visitCharge || 0), 0);
      const jobsEarned = w.selectedJobs
        .filter((j) => ['COMPLETED', 'PAID', 'REVIEWED'].includes(j.status))
        .reduce((acc, j) => acc + Number(j.lockedVisitCharge || j.suggestedVisitCharge || 0), 0);

      console.log({
        id: w.id,
        name: w.name,
        phone: w.phone,
        walletBalance: w.wallet?.balance,
        commissionsCount: w.commissions.length,
        commEarned,
        completedJobsCount: w.selectedJobs.filter((j) => ['COMPLETED', 'PAID', 'REVIEWED'].includes(j.status)).length,
        jobsEarned,
      });
    });
  } catch (err) {
    console.error('ERROR:', err.message || err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
