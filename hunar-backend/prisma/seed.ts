/* eslint-disable no-console */
// HUNAR seed — dev/demo data for Shafqat Ullah's Module 1 worker-flow modules.
// Creates: service categories, platform settings, and test users (WORKER / CUSTOMER / ADMIN)
// plus a couple of sample open jobs around Peshawar so the nearby-jobs feed can be exercised.
// Run with: npm run prisma:seed

import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PHONE = {
  worker: '03120000001',
  customer: '03120000002',
  admin: '03120000000',
};

const SAMPLE_JOBS = [
  {
    title: 'Kitchen sink pipe leaking',
    description: 'Water dripping from under-sink pipe since morning. Need a plumber.',
    category: 'Plumbing',
    latitude: 33.9955,
    longitude: 71.4379,
    address: 'House 12, Street 5, Phase 5',
    city: 'Peshawar',
    area: 'Hayatabad',
    suggestedVisitCharge: 500,
    preferredVisitTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'AC not cooling',
    description: 'Split AC runs but does not cool. Gas leakage suspected.',
    category: 'AC & Refrigeration',
    latitude: 34.0045,
    longitude: 71.477,
    address: 'Office 3, University Road',
    city: 'Peshawar',
    area: 'University Town',
    suggestedVisitCharge: 700,
    preferredVisitTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
  },
];

async function upsertCategory(name: string, nameUrdu: string, sortOrder: number): Promise<string> {
  const cat = await prisma.serviceCategory.upsert({
    where: { id: `seed-category-${sortOrder}` },
    update: { name, nameUrdu, isActive: true },
    create: {
      id: `seed-category-${sortOrder}`,
      name,
      nameUrdu,
      isActive: true,
      sortOrder,
    },
  });
  return cat.id;
}

async function main(): Promise<void> {
  console.log('Seeding platform settings...');
  await prisma.platformSetting.upsert({
    where: { key: 'commission_rate' },
    update: {},
    create: { key: 'commission_rate', value: '0.10' },
  });

  console.log('Seeding service categories...');
  const categories: Record<string, string> = {};
  categories.Plumbing = await upsertCategory('Plumbing', 'پلمبرنگ', 1);
  await upsertCategory('Electrical', 'الیکٹریکل', 2);
  await upsertCategory('AC & Refrigeration', 'ایئر کنڈیشن اور ریفریجریشن', 3);
  await upsertCategory('Carpentry', 'لکڑ کا کام', 4);
  await upsertCategory('Painting', 'پینٹنگ', 5);
  await upsertCategory('Cleaning', 'صفائی', 6);
  await upsertCategory('Masonry', 'دھاتی', 7);
  await upsertCategory('Pest Control', 'کیڑے مار دوا', 8);
  await upsertCategory('General Handyman', 'عمومی مہارت', 9);

  console.log('Seeding test users...');
  const hash = (pw: string): string => bcrypt.hashSync(pw, 10);

  await prisma.user.upsert({
    where: { phone: PHONE.worker },
    update: {},
    create: {
      phone: PHONE.worker,
      passwordHash: hash('worker123'),
      name: 'Test Worker',
      role: Role.WORKER,
      isVerified: true,
    },
  });
  await prisma.user.upsert({
    where: { phone: PHONE.customer },
    update: {},
    create: {
      phone: PHONE.customer,
      passwordHash: hash('customer123'),
      name: 'Test Customer',
      role: Role.CUSTOMER,
    },
  });
  await prisma.user.upsert({
    where: { phone: PHONE.admin },
    update: {},
    create: {
      phone: PHONE.admin,
      passwordHash: hash('admin123'),
      name: 'Test Admin',
      role: Role.ADMIN,
    },
  });

  console.log('Seeding sample open jobs + PostGIS locations...');
  for (const job of SAMPLE_JOBS) {
    const customer = await prisma.user.findUnique({ where: { phone: PHONE.customer } });
    if (!customer) {
      continue;
    }
    const created = await prisma.serviceRequest.upsert({
      where: { id: `seed-job-${job.area.replace(/\s+/g, '').toLowerCase()}` },
      update: {},
      create: {
        id: `seed-job-${job.area.replace(/\s+/g, '').toLowerCase()}`,
        customerId: customer.id,
        categoryId: categories[job.category],
        title: job.title,
        description: job.description,
        latitude: job.latitude,
        longitude: job.longitude,
        address: job.address,
        city: job.city,
        area: job.area,
        suggestedVisitCharge: job.suggestedVisitCharge,
        preferredVisitTime: job.preferredVisitTime,
        status: 'OPEN',
      },
    });
    await prisma.$executeRaw`
      UPDATE "ServiceRequest"
      SET location = ST_SetSRID(ST_MakePoint(${job.longitude}, ${job.latitude}), 4326)
      WHERE id = ${created.id}
    `;
  }

  console.log('Seed complete.');
  console.log('Test logins (TEMPORARY auth):');
  console.log(`  Worker   -> ${PHONE.worker} / worker123`);
  console.log(`  Customer -> ${PHONE.customer} / customer123`);
  console.log(`  Admin    -> ${PHONE.admin} / admin123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
