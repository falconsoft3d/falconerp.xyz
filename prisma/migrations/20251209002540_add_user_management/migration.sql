-- AlterTable
ALTER TABLE "User" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "defaultCompanyId" TEXT,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user';

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_defaultCompanyId_fkey" FOREIGN KEY ("defaultCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
