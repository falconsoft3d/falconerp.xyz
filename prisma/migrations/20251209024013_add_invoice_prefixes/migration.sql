-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "purchaseInvoicePrefix" TEXT NOT NULL DEFAULT 'INVO',
ADD COLUMN     "salesInvoicePrefix" TEXT NOT NULL DEFAULT 'INV';
