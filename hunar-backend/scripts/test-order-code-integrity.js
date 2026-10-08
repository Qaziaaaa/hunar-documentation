const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ORDER_CODE_REGEX = /^[A-Z]{2}[0-9]-[0-9]{2}[A-Z]$/;

function generateOrderCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const randomChar = () => chars[Math.floor(Math.random() * chars.length)];
  const randomDigit = () => digits[Math.floor(Math.random() * digits.length)];
  return `${randomChar()}${randomChar()}${randomDigit()}-${randomDigit()}${randomDigit()}${randomChar()}`;
}

async function run() {
  console.log('--- 1. VERIFY ALL EXISTING SERVICE REQUESTS IN DB ---');
  const allJobs = await prisma.serviceRequest.findMany({
    select: { id: true, title: true, status: true },
  });
  console.log(`Total jobs found in database: ${allJobs.length}`);
  let nonCompliantCount = 0;
  for (const job of allJobs) {
    if (!ORDER_CODE_REGEX.test(job.id)) {
      console.error(`Non-compliant job ID found: ${job.id}`);
      nonCompliantCount++;
    }
  }
  if (nonCompliantCount === 0) {
    console.log(`[PASS] All ${allJobs.length} database jobs strictly match LLD-DDL format!`);
  } else {
    throw new Error(`Found ${nonCompliantCount} non-compliant jobs!`);
  }

  console.log('\n--- 2. VERIFY FOREIGN KEYS IN RELATED TABLES ---');
  const offers = await prisma.jobOffer.findMany({ select: { id: true, jobId: true } });
  const visits = await prisma.visit.findMany({ select: { id: true, jobId: true } });
  const repairs = await prisma.repair.findMany({ select: { id: true, jobId: true } });
  const commissions = await prisma.commission.findMany({ select: { id: true, jobId: true } });
  const payments = await prisma.payment.findMany({ select: { id: true, jobId: true } });
  const reviews = await prisma.review.findMany({ select: { id: true, jobId: true } });
  const conversations = await prisma.conversation.findMany({ select: { id: true, jobId: true } });

  console.log(`Checked JobOffers (${offers.length}), Visits (${visits.length}), Repairs (${repairs.length}), Commissions (${commissions.length}), Payments (${payments.length}), Reviews (${reviews.length}), Conversations (${conversations.length})`);

  const allForeignKeys = [
    ...offers.map(o => ({ table: 'JobOffer', jobId: o.jobId })),
    ...visits.map(v => ({ table: 'Visit', jobId: v.jobId })),
    ...repairs.map(r => ({ table: 'Repair', jobId: r.jobId })),
    ...commissions.map(c => ({ table: 'Commission', jobId: c.jobId })),
    ...payments.map(p => ({ table: 'Payment', jobId: p.jobId })),
    ...reviews.map(rv => ({ table: 'Review', jobId: rv.jobId })),
    ...conversations.map(cv => ({ table: 'Conversation', jobId: cv.jobId })),
  ];

  let invalidFkCount = 0;
  for (const fk of allForeignKeys) {
    if (fk.jobId && !ORDER_CODE_REGEX.test(fk.jobId)) {
      console.error(`Invalid FK in ${fk.table}: ${fk.jobId}`);
      invalidFkCount++;
    }
  }
  if (invalidFkCount === 0) {
    console.log(`[PASS] All ${allForeignKeys.length} related records reference valid LLD-DDL Order Codes!`);
  } else {
    throw new Error(`Found ${invalidFkCount} invalid foreign keys!`);
  }

  console.log('\n--- 3. TEST DB-LEVEL FORMAT CHECK CONSTRAINT ENFORCEMENT ---');
  const testCustomer = await prisma.user.findFirst({ where: { role: 'CUSTOMER' }, select: { id: true } });
  const testCategory = await prisma.serviceCategory.findFirst({ select: { id: true } });

  if (testCustomer && testCategory) {
    // Attempt inserting invalid formats - MUST be rejected by DB constraint
    const invalidCodes = [
      'aw3-90w',
      'AW-390W',
      'AW390W',
      'AW3-9OW',
      '1846fe6e-8663-4aab-923f-eb2dc90ae68a',
      '123456',
    ];

    for (const invalid of invalidCodes) {
      try {
        await prisma.serviceRequest.create({
          data: {
            id: invalid,
            customerId: testCustomer.id,
            categoryId: testCategory.id,
            title: 'Constraint Test Job',
            description: 'Should fail constraint',
            address: 'Test Address',
            city: 'Peshawar',
          },
        });
        throw new Error(`Constraint test failed! Invalid code "${invalid}" was accepted!`);
      } catch (err) {
        if (err.message.includes('Constraint test failed')) throw err;
        console.log(`[PASS] Correctly rejected invalid code: "${invalid}" (${err.code || 'CHECK constraint triggered'})`);
      }
    }

    console.log('\n--- 4. TEST NEW ORDER CODE CREATION & LIFECYCLE ---');
    const validTestCode = generateOrderCode();
    const createdJob = await prisma.serviceRequest.create({
      data: {
        id: validTestCode,
        customerId: testCustomer.id,
        categoryId: testCategory.id,
        title: 'End-to-End Order Code Test Job',
        description: 'Verifying end-to-end foreign key referencing with new Order Code',
        address: 'Phase 5 Hayatabad',
        city: 'Peshawar',
        latitude: 34.0123,
        longitude: 71.5432,
        status: 'OPEN',
      },
    });
    console.log(`[PASS] Successfully created job with generated Order Code: ${createdJob.id}`);

    const testWorker = await prisma.user.findFirst({ where: { role: 'WORKER' }, select: { id: true } });
    if (testWorker) {
      // Create a JobOffer referencing this Order Code
      const createdOffer = await prisma.jobOffer.create({
        data: {
          jobId: createdJob.id,
          workerId: testWorker.id,
          visitCharge: 350,
          status: 'PENDING',
        },
      });
      console.log(`[PASS] Successfully created JobOffer referencing Order Code: offer.id=${createdOffer.id}, offer.jobId=${createdOffer.jobId}`);

      // Create a Conversation referencing this Order Code
      const createdConv = await prisma.conversation.create({
        data: {
          jobId: createdJob.id,
          customerId: testCustomer.id,
          workerId: testWorker.id,
        },
      });
      console.log(`[PASS] Successfully created Conversation referencing Order Code: conv.id=${createdConv.id}, conv.jobId=${createdConv.jobId}`);

      // Clean up test records
      await prisma.conversation.delete({ where: { id: createdConv.id } });
      await prisma.jobOffer.delete({ where: { id: createdOffer.id } });
    }
    await prisma.serviceRequest.delete({ where: { id: createdJob.id } });
    console.log(`[PASS] Cleaned up temporary test records.`);
  }

  console.log('\n=== ALL INTEGRITY TESTS PASSED SUCCESSFULLY! ===');
  await prisma.$disconnect();
}

run().catch((err) => {
  console.error('Test failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
