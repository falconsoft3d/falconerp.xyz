-- AlterEnum: Cambiar los valores del enum InvoiceType de SALE/PURCHASE a invoice_out/invoice_in/refund_out/refund_in
-- Paso 1: Crear el nuevo enum
CREATE TYPE "InvoiceType_new" AS ENUM ('invoice_out', 'refund_out', 'invoice_in', 'refund_in');

-- Paso 2: Remover el valor por defecto temporalmente
ALTER TABLE "Invoice" 
  ALTER COLUMN "type" DROP DEFAULT;

-- Paso 3: Migrar los datos existentes
ALTER TABLE "Invoice" 
  ALTER COLUMN "type" TYPE "InvoiceType_new" 
  USING (
    CASE 
      WHEN "type"::text = 'SALE' THEN 'invoice_out'
      WHEN "type"::text = 'PURCHASE' THEN 'invoice_in'
      ELSE 'invoice_out'
    END
  )::"InvoiceType_new";

-- Paso 4: Eliminar el enum viejo
DROP TYPE "InvoiceType";

-- Paso 5: Renombrar el nuevo enum
ALTER TYPE "InvoiceType_new" RENAME TO "InvoiceType";

-- Paso 6: Actualizar el valor por defecto
ALTER TABLE "Invoice" 
  ALTER COLUMN "type" SET DEFAULT 'invoice_out';
