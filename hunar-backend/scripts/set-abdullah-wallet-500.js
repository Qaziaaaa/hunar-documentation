require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function executeWithRetry(fn, retries = 5, delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      console.warn(`Attempt ${attempt} failed: ${err.message}`);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

async function main() {
  const prisma = new PrismaClient();

  try {
    await executeWithRetry(async () => {
      const abdullahWorkers = await prisma.user.findMany({
        where: {
          role: 'WORKER',
          OR: [
            { name: { contains: 'Abdullah', mode: 'insensitive' } },
            { email: { contains: 'abdullah', mode: 'insensitive' } },
            { phone: '03118078000' },
          ],
        },
        include: {
          wallet: true,
        },
      });

      console.log(`Found ${abdullahWorkers.length} Abdullah worker account(s).`);

      for (const worker of abdullahWorkers) {
        console.log(`\nProcessing worker: ${worker.name} (ID: ${worker.id}, Phone: ${worker.phone}, Email: ${worker.email})`);
        const currentBalance = worker.wallet ? Number(worker.wallet.balance) : 0;
        console.log(`Current wallet balance: Rs. ${currentBalance}`);

        const targetBalance = 500;
        const diff = targetBalance - currentBalance;

        // 1. Upsert WorkerWallet
        await prisma.workerWallet.upsert({
          where: { userId: worker.id },
          update: {
            balance: targetBalance,
            isFrozen: false,
          },
          create: {
            userId: worker.id,
            balance: targetBalance,
            heldBalance: 0,
            isFrozen: false,
          },
        });

        // 2. Add Ledger entry for audit tracking
        const idemKey = `manual_set_wallet_500_${worker.id}_${Date.now()}`;
        await prisma.walletLedger.create({
          data: {
            userId: worker.id,
            type: 'TOPUP_CREDIT',
            amount: diff !== 0 ? diff : targetBalance,
            balanceAfter: targetBalance,
            referenceType: 'admin_adjustment',
            referenceId: `wallet_set_500_${worker.id}`,
            note: `Admin wallet adjustment to Rs. 500 (previous balance: Rs. ${currentBalance})`,
            idempotencyKey: idemKey,
          },
        });

        console.log(`✅ Successfully updated wallet for ${worker.name} (${worker.phone}) to Rs. ${targetBalance}!`);
      }

      // Verification step
      console.log('\n--- Verification ---');
      for (const worker of abdullahWorkers) {
        const verifiedWallet = await prisma.workerWallet.findUnique({
          where: { userId: worker.id },
        });
        console.log(`Worker ${worker.name} (${worker.phone}) wallet balance: Rs. ${verifiedWallet?.balance}`);
      }
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Fatal error updating worker wallet:', err);
  process.exit(1);
});
