-- AlterTable
ALTER TABLE "Company" ADD COLUMN "salesInvoiceNextNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "purchaseInvoiceNextNumber" INTEGER NOT NULL DEFAULT 1;
