-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('SALE', 'PURCHASE');

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "type" "InvoiceType" NOT NULL DEFAULT 'SALE',
ADD COLUMN "supplierReference" TEXT;
