CREATE TABLE IF NOT EXISTS "Purchase" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "outletId" TEXT NOT NULL,
  "purchaseNumber" TEXT NOT NULL,
  date TIMESTAMPTZ DEFAULT now(),
  "supplierId" TEXT,
  "supplierName" TEXT,
  "supplierInvoiceNumber" TEXT,
  "subTotalAmount" DOUBLE PRECISION DEFAULT 0,
  "taxAmount" DOUBLE PRECISION DEFAULT 0,
  "discountAmount" DOUBLE PRECISION DEFAULT 0,
  "grandTotalAmount" DOUBLE PRECISION DEFAULT 0,
  "paidAmount" DOUBLE PRECISION DEFAULT 0,
  notes TEXT,
  "stockEntryId" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "PurchaseItem" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "purchaseId" TEXT NOT NULL REFERENCES "Purchase"(id) ON DELETE CASCADE,
  "stockItemId" TEXT,
  "itemName" TEXT NOT NULL,
  category TEXT DEFAULT '',
  unit TEXT DEFAULT 'pcs',
  "lowStockThreshold" DOUBLE PRECISION DEFAULT 0,
  "quantityPurchased" DOUBLE PRECISION NOT NULL,
  "costPerUnit" DOUBLE PRECISION NOT NULL,
  "subTotal" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "SupplierPayment" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "purchaseId" TEXT NOT NULL REFERENCES "Purchase"(id) ON DELETE CASCADE,
  "amountPaid" DOUBLE PRECISION NOT NULL,
  "paymentDate" TIMESTAMPTZ DEFAULT now(),
  "paymentMethod" TEXT NOT NULL,
  reference TEXT,
  notes TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ExpenseCategory" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "outletId" TEXT NOT NULL,
  name TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Expense" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "outletId" TEXT NOT NULL,
  date TIMESTAMPTZ DEFAULT now(),
  "categoryId" TEXT NOT NULL,
  "categoryName" TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  payee TEXT,
  description TEXT,
  "paymentMethod" TEXT NOT NULL,
  "referenceNumber" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_outlet ON "Purchase"("outletId");
CREATE INDEX IF NOT EXISTS idx_purchase_supplier ON "Purchase"("supplierId");
CREATE INDEX IF NOT EXISTS idx_purchase_item_purchase ON "PurchaseItem"("purchaseId");
CREATE INDEX IF NOT EXISTS idx_supplier_payment_purchase ON "SupplierPayment"("purchaseId");
CREATE INDEX IF NOT EXISTS idx_expense_category_outlet ON "ExpenseCategory"("outletId");
CREATE INDEX IF NOT EXISTS idx_expense_outlet ON "Expense"("outletId");
CREATE INDEX IF NOT EXISTS idx_expense_category ON "Expense"("categoryId");
