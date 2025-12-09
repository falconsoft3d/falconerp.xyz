const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  const companies = await prisma.company.findMany();
  const contacts = await prisma.contact.findMany();
  const products = await prisma.product.findMany();
  const invoices = await prisma.invoice.findMany();
  
  console.log('Usuarios:', users.length);
  console.log('Empresas:', companies.length);
  console.log('Contactos:', contacts.length);
  console.log('Productos:', products.length);
  console.log('Facturas:', invoices.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
