const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const invoices = await prisma.invoice.findMany({
    include: {
      contact: true,
      items: true,
    }
  });
  
  console.log('Total de facturas:', invoices.length);
  console.log('Facturas:', JSON.stringify(invoices, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
