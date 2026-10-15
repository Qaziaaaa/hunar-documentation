const { PrismaClient, Role, WorkerVerificationStatus, VerificationDocumentType } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

const PEOPLE = [
  { name: 'Farhan', skills: ['Plumbing', 'General Handyman'] },
  { name: 'Faizan', skills: ['Electrical', 'AC & Refrigeration'] },
  { name: 'Hakim', skills: ['Carpentry', 'General Handyman'] },
  { name: 'Hashim', skills: ['Painting', 'Masonry'] },
  { name: 'Shafqat', skills: ['Electrical', 'Plumbing'] },
  { name: 'Shazad', skills: ['AC & Refrigeration', 'Electrical'] },
  { name: 'Abdullah', skills: ['Cleaning', 'General Handyman'] },
];

const DEFAULT_PASSWORD = 'Password@123';
const INITIAL_WORKER_BALANCE = 500;

async function setupAccounts() {
  console.log('--- Step 1: Hashing default password ---');
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const accounts = [];

  for (let i = 0; i < PEOPLE.length; i++) {
    const person = PEOPLE[i];
    const indexStr = String(i + 1).padStart(2, '0');

    // Customer phone: 030110000XX
    const customerPhone = `030110000${indexStr}`;
    const customerEmail = `${person.name.toLowerCase()}.customer@hunar.pk`;

    // Worker phone: 030220000XX
    const workerPhone = `030220000${indexStr}`;
    const workerEmail = `${person.name.toLowerCase()}.worker@hunar.pk`;

    accounts.push({
      person: person.name,
      type: 'Customer',
      name: `${person.name} (Customer)`,
      phone: customerPhone,
      email: customerEmail,
      role: Role.CUSTOMER,
      password: DEFAULT_PASSWORD,
    });

    accounts.push({
      person: person.name,
      type: 'Worker',
      name: `${person.name} (Worker)`,
      phone: workerPhone,
      email: workerEmail,
      role: Role.WORKER,
      skills: person.skills,
      password: DEFAULT_PASSWORD,
      walletBalance: INITIAL_WORKER_BALANCE,
    });
  }

  console.log(`Total accounts to create/update: ${accounts.length}`);

  for (const acc of accounts) {
    if (acc.role === Role.CUSTOMER) {
      console.log(`Setting up Customer: ${acc.person} (${acc.phone})...`);
      await prisma.user.upsert({
        where: { phone: acc.phone },
        update: {
          name: acc.name,
          email: acc.email,
          passwordHash,
          role: Role.CUSTOMER,
          isVerified: true,
          isActive: true,
        },
        create: {
          phone: acc.phone,
          email: acc.email,
          name: acc.name,
          passwordHash,
          role: Role.CUSTOMER,
          isVerified: true,
          isActive: true,
        },
      });
    } else {
      console.log(`Setting up Worker: ${acc.person} (${acc.phone})...`);
      const defaultAvatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80";
      const user = await prisma.user.upsert({
        where: { phone: acc.phone },
        update: {
          name: acc.name,
          email: acc.email,
          passwordHash,
          role: Role.WORKER,
          isVerified: true,
          isActive: true,
          avatarUrl: defaultAvatar,
        },
        create: {
          phone: acc.phone,
          email: acc.email,
          name: acc.name,
          passwordHash,
          role: Role.WORKER,
          isVerified: true,
          isActive: true,
          avatarUrl: defaultAvatar,
        },
      });

      // 1. Worker Profile
      await prisma.workerProfile.upsert({
        where: { userId: user.id },
        update: {
          skills: acc.skills,
          experienceYears: 5,
          bio: `Verified professional technician specializing in ${acc.skills.join(', ')}.`,
          isAvailable: true,
          serviceRadiusKm: 15,
          verificationStatus: WorkerVerificationStatus.APPROVED,
          verifiedAt: new Date(),
          submittedAt: new Date(),
        },
        create: {
          userId: user.id,
          skills: acc.skills,
          experienceYears: 5,
          bio: `Verified professional technician specializing in ${acc.skills.join(', ')}.`,
          isAvailable: true,
          serviceRadiusKm: 15,
          verificationStatus: WorkerVerificationStatus.APPROVED,
          verifiedAt: new Date(),
          submittedAt: new Date(),
        },
      });

      // 2. Verification documents (CNIC_FRONT & CNIC_BACK)
      await prisma.verificationDocument.upsert({
        where: { userId_type: { userId: user.id, type: VerificationDocumentType.CNIC_FRONT } },
        update: {
          url: 'https://placehold.co/600x400/png?text=CNIC+Front',
          fileName: 'cnic_front.jpg',
          mimeType: 'image/jpeg',
        },
        create: {
          userId: user.id,
          type: VerificationDocumentType.CNIC_FRONT,
          url: 'https://placehold.co/600x400/png?text=CNIC+Front',
          fileName: 'cnic_front.jpg',
          mimeType: 'image/jpeg',
        },
      });

      await prisma.verificationDocument.upsert({
        where: { userId_type: { userId: user.id, type: VerificationDocumentType.CNIC_BACK } },
        update: {
          url: 'https://placehold.co/600x400/png?text=CNIC+Back',
          fileName: 'cnic_back.jpg',
          mimeType: 'image/jpeg',
        },
        create: {
          userId: user.id,
          type: VerificationDocumentType.CNIC_BACK,
          url: 'https://placehold.co/600x400/png?text=CNIC+Back',
          fileName: 'cnic_back.jpg',
          mimeType: 'image/jpeg',
        },
      });

      // 3. Service Area
      const existingArea = await prisma.serviceArea.findFirst({ where: { userId: user.id } });
      if (!existingArea) {
        await prisma.serviceArea.create({
          data: {
            userId: user.id,
            label: 'Peshawar Central',
            address: 'Peshawar, Khyber Pakhtunkhwa, Pakistan',
            latitude: 34.0151,
            longitude: 71.5249,
          },
        });
      }

      // 4. Worker Wallet (Balance = Rs. 500)
      await prisma.workerWallet.upsert({
        where: { userId: user.id },
        update: {
          balance: acc.walletBalance,
          heldBalance: 0,
          isFrozen: false,
        },
        create: {
          userId: user.id,
          balance: acc.walletBalance,
          heldBalance: 0,
          isFrozen: false,
        },
      });

      // 5. Wallet Ledger entry for audit
      const idemKey = `seed_wallet_credit_${user.id}`;
      await prisma.walletLedger.upsert({
        where: { idempotencyKey: idemKey },
        update: {
          amount: acc.walletBalance,
          balanceAfter: acc.walletBalance,
        },
        create: {
          userId: user.id,
          type: 'TOPUP_CREDIT',
          amount: acc.walletBalance,
          balanceAfter: acc.walletBalance,
          referenceType: 'initial_grant',
          referenceId: 'seed_init_500',
          note: 'Initial verified worker signup credit of Rs. 500',
          idempotencyKey: idemKey,
        },
      });
    }
  }

  console.log('--- Step 2: Database setup completed successfully! ---');
  return accounts;
}

async function verifyAccountsViaApi(accounts) {
  console.log('\n--- Step 3: Verifying HTTP API Login & Wallet Balance ---');
  const baseUrl = 'http://localhost:4000/api/v1';

  let successCount = 0;
  let totalWalletSum = 0;

  for (const acc of accounts) {
    const isWorker = acc.role === Role.WORKER;
    const loginUrl = isWorker
      ? `${baseUrl}/auth/login`
      : `${baseUrl}/auth/customer/login`;

    try {
      const loginRes = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: acc.phone,
          password: acc.password,
        }),
      });

      if (!loginRes.ok) {
        const errorText = await loginRes.text();
        console.error(`❌ [${acc.type}] ${acc.person} (${acc.phone}) LOGIN FAILED (${loginRes.status}): ${errorText}`);
        continue;
      }

      const loginData = await loginRes.json();
      const payload = loginData.data || loginData;
      const token = payload.accessToken;

      if (!token) {
        console.error(`❌ [${acc.type}] ${acc.person} (${acc.phone}) missing accessToken in response:`, JSON.stringify(loginData));
        continue;
      }

      let walletBalance = null;
      if (isWorker) {
        const balanceRes = await fetch(`${baseUrl}/wallet/balance`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!balanceRes.ok) {
          const balErr = await balanceRes.text();
          console.error(`❌ [Worker] ${acc.person} Wallet check failed (${balanceRes.status}): ${balErr}`);
        } else {
          const balJson = await balanceRes.json();
          const balData = balJson.data || balJson;
          walletBalance = balData.balance;
          totalWalletSum += Number(walletBalance);
        }
      }

      successCount++;
      console.log(
        `✅ [${acc.type.padEnd(8)}] ${acc.person.padEnd(9)} | Phone: ${acc.phone} | Role: ${payload.user?.role} | Verified: ${payload.user?.isVerified}${
          isWorker ? ` | Wallet Balance: Rs. ${walletBalance}` : ''
        }`
      );
    } catch (err) {
      console.error(`❌ [${acc.type}] ${acc.person} Exception:`, err.message);
    }
  }

  console.log('\n================ VERIFICATION SUMMARY ================');
  console.log(`Total accounts created & tested: ${accounts.length}`);
  console.log(`Successful logins: ${successCount} / ${accounts.length}`);
  console.log(`Worker wallets total balance: Rs. ${totalWalletSum} (Expected: Rs. 3500)`);
  console.log('======================================================\n');
}

async function main() {
  try {
    const accounts = await setupAccounts();
    await verifyAccountsViaApi(accounts);
  } catch (error) {
    console.error('Fatal error during setup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
