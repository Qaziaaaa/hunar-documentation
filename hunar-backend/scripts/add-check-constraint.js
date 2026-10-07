const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'service_request_order_code_format_check'
      ) THEN
        ALTER TABLE "ServiceRequest"
        ADD CONSTRAINT "service_request_order_code_format_check"
        CHECK ("id" ~ '^[A-Z]{2}[0-9]-[0-9]{2}[A-Z]$');
      END IF;
    END $$;
  `);
  console.log('Database CHECK constraint service_request_order_code_format_check created successfully!');
  await prisma.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
