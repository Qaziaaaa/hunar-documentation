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
      const workers = await prisma.user.findMany({
        where: {
          role: 'WORKER',
          name: { contains: 'Faizan Ahmed', mode: 'insensitive' },
        },
        include: {
          wallet: true,
        },
      });

      console.log(`Found ${workers.length} matching worker account(s).`);

      for (const worker of workers) {
        console.log(`\nProcessing worker: ${worker.name} (ID: ${worker.id}, Phone: ${worker.phone})`);
        const currentBalance = worker.wallet ? Number(worker.wallet.balance) : 0;
        console.log(`Current wallet balance: Rs. ${currentBalance}`);

        const targetBalance = 10;
        const diff = targetBalance - currentBalance;

        // 1. Upsert WorkerWallet
        const updatedWallet = await prisma.workerWallet.upsert({
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
        const idemKey = `manual_set_wallet_10_${worker.id}_${Date.now()}`;
        const ledgerEntry = await prisma.walletLedger.create({
          data: {
            userId: worker.id,
            type: diff < 0 ? 'WITHDRAWAL' : 'TOPUP_CREDIT',
            amount: diff,
            balanceAfter: targetBalance,
            referenceType: 'admin_adjustment',
            referenceId: `wallet_set_10_${worker.id}`,
            note: `Admin wallet adjustment to Rs. ${targetBalance} (previous balance: Rs. ${currentBalance})`,
            idempotencyKey: idemKey,
          },
        });

        console.log(`✅ Successfully updated wallet for ${worker.name} (${worker.phone}) to Rs. ${targetBalance}!`);
        console.log('Ledger created:', ledgerEntry);
      }

      // Verification step
      console.log('\n--- Verification ---');
      for (const worker of workers) {
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

