const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, phone: true, role: true, createdAt: true },
    });
    const jobs = await prisma.serviceRequest.findMany({
      select: { id: true, title: true, status: true, city: true, createdAt: true },
    });
    const categories = await prisma.serviceCategory.findMany({
      select: { id: true, name: true, isActive: true },
    });

    console.log('=== DATABASE CONTENT REPORT ===');
    console.log(`TOTAL USERS: ${users.length}`);
    console.log(JSON.stringify(users, null, 2));

    console.log(`TOTAL JOBS: ${jobs.length}`);
    console.log(JSON.stringify(jobs, null, 2));

    console.log(`TOTAL CATEGORIES: ${categories.length}`);
    console.log(JSON.stringify(categories, null, 2));
  } catch (err) {
    console.error('DATABASE CONNECTION / QUERY ERROR:', err.message || err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
