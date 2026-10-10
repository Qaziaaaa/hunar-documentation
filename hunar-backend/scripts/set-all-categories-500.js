const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function setAllCategoriesTo500() {
  try {
    const result = await prisma.serviceCategory.updateMany({
      data: {
        defaultVisitCharge: 500,
      },
    });

    console.log(`Updated ${result.count} categories to Rs. 500.`);

    const categories = await prisma.serviceCategory.findMany({
      select: {
        id: true,
        name: true,
        defaultVisitCharge: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    console.log('Current categories in database:');
    categories.forEach((cat) => {
      console.log(`- ${cat.name}: Rs. ${cat.defaultVisitCharge}`);
    });
  } catch (error) {
    console.error('Failed to update categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setAllCategoriesTo500();
