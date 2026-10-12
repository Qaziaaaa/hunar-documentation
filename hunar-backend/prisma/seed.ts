/* eslint-disable no-console */
// HUNAR seed — dev/demo data for Shafqat Ullah's Module 1 worker-flow modules.
// Creates: service categories, platform settings, and test users (WORKER / CUSTOMER / ADMIN)
// plus a couple of sample open jobs around Peshawar so the nearby-jobs feed can be exercised.
// Run with: npm run prisma:seed

import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PHONE = {
  worker: '03120000001',
  customer: '03120000002',
  admin: '03120000000',
};

// Admin panel authenticates by email (see auth.service.ts loginAdmin), so the
// seeded admin needs an email in addition to a phone number.
const ADMIN_EMAIL = 'admin@hunar.pk';

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

async function upsertCategory(name: string, nameUrdu: string, sortOrder: number, defaultVisitCharge: number = 800): Promise<string> {
  const cat = await prisma.serviceCategory.upsert({
    where: { id: `seed-category-${sortOrder}` },
    update: { name, nameUrdu, isActive: true, defaultVisitCharge },
    create: {
      id: `seed-category-${sortOrder}`,
      name,
      nameUrdu,
      isActive: true,
      sortOrder,
      defaultVisitCharge,
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
  categories.Plumbing = await upsertCategory('Plumbing', 'پلمبرنگ', 1, 500);
  categories.Electrical = await upsertCategory('Electrical', 'الیکٹریکل', 2, 500);
  categories['AC & Refrigeration'] = await upsertCategory(
    'AC & Refrigeration',
    'ایئر کنڈیشن اور ریفریجریشن',
    3,
    500,
  );
  categories.Carpentry = await upsertCategory('Carpentry', 'لکڑ کا کام', 4, 500);
  categories.Painting = await upsertCategory('Painting', 'پینٹنگ', 5, 500);
  categories.Cleaning = await upsertCategory('Cleaning', 'صفائی', 6, 500);
  categories.Masonry = await upsertCategory('Masonry', 'دھاتی', 7, 500);
  categories['Pest Control'] = await upsertCategory('Pest Control', 'کیڑے مار دوا', 8, 500);
  categories['General Handyman'] = await upsertCategory('General Handyman', 'عمومی مہارت', 9, 500);

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
    update: { email: ADMIN_EMAIL },
    create: {
      phone: PHONE.admin,
      email: ADMIN_EMAIL,
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
    const seedJobCode = job.area === 'Hayatabad' ? 'HT1-01P' : 'UT2-02P';
    const created = await prisma.serviceRequest.upsert({
      where: { id: seedJobCode },
      update: {},
      create: {
        id: seedJobCode,
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
    await prisma.$executeRawUnsafe(`SELECT 1`); // PostGIS disabled
  }

  console.log('Seed complete.');
  console.log('Test logins (TEMPORARY auth):');
  console.log(`  Worker   -> ${PHONE.worker} / worker123`);
  console.log(`  Customer -> ${PHONE.customer} / customer123`);
  console.log(`  Admin    -> ${ADMIN_EMAIL} / admin123 (panel login uses email)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
