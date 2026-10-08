const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ORDER_CODE_REGEX = /^[A-Z]{2}[0-9]-[0-9]{2}[A-Z]$/;

async function run() {
  const jobs = await prisma.serviceRequest.findMany({ select: { id: true } });
  const bad = jobs.filter(j => !ORDER_CODE_REGEX.test(j.id));
  console.log('Bad jobs:', JSON.stringify(bad, null, 2));
  await prisma.$disconnect();
}
run();
