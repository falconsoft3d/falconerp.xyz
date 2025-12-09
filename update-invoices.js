const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Contar registros existentes
    const count = await prisma.invoice.count();
    console.log(`Total de facturas: ${count}`);

    if (count === 0) {
      console.log('No hay facturas para actualizar.');
      return;
    }

    // Actualizar todos los registros para usar DRAFT
    const updated = await prisma.$executeRaw`
      UPDATE "Invoice" 
      SET status = 'DRAFT'
      WHERE status IN ('SENT', 'PAID', 'OVERDUE', 'CANCELLED')
    `;
    
    console.log(`Facturas actualizadas: ${updated}`);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

main()
  .then(() => {
    console.log('Actualización completada');
    prisma.$disconnect();
  })
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
