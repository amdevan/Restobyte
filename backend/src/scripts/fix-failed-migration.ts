import prisma from '../db/prisma.js';

async function checkColumnExists(tableName: string, columnName: string): Promise<boolean> {
    const result = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
        `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
        tableName, columnName
    );
    return result.length > 0;
}

async function checkIndexExists(indexName: string, tableName?: string): Promise<boolean> {
    let query = `SELECT indexname FROM pg_indexes WHERE indexname = $1`;
    const params: any[] = [indexName];
    if (tableName) {
        query += ` AND tablename = $2`;
        params.push(tableName);
    }
    const result = await prisma.$queryRawUnsafe<{ indexname: string }[]>(query, ...params);
    return result.length > 0;
}

async function checkTableExists(tableName: string): Promise<boolean> {
    const result = await prisma.$queryRawUnsafe<{ tablename: string }[]>(
        `SELECT tablename FROM pg_tables WHERE tablename = $1`,
        tableName
    );
    return result.length > 0;
}

async function applySlugMigration() {
    const migrationName = '20260708000000_add_outlet_slug';
    console.log(`Checking migration ${migrationName}...`);
    
    const slugColumnExists = await checkColumnExists('Outlet', 'slug');
    const indexExists = await checkIndexExists('Outlet_slug_key', 'Outlet');
    
    if (!slugColumnExists) {
        console.log('Adding slug column...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "Outlet" ADD COLUMN "slug" TEXT`);
        await prisma.$executeRawUnsafe(`UPDATE "Outlet" SET "slug" = id WHERE "slug" IS NULL`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "Outlet" ALTER COLUMN "slug" SET NOT NULL`);
        console.log('Slug column fully added');
    } else {
        const nullCheck = await prisma.$queryRawUnsafe<{ count: number }[]>(
            `SELECT COUNT(*) as count FROM "Outlet" WHERE "slug" IS NULL`
        );
        const nullSlugs = nullCheck[0]?.count ?? 0;
        if (nullSlugs > 0) {
            console.log(`Fixing ${nullSlugs} NULL slugs...`);
            await prisma.$executeRawUnsafe(`UPDATE "Outlet" SET "slug" = id WHERE "slug" IS NULL`);
        }
    }
    
    if (!indexExists) {
        console.log('Creating Outlet_slug_key index...');
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "Outlet_slug_key" ON "Outlet"("slug")`);
    }
    
    await markMigrationApplied(migrationName);
}

async function markMigrationApplied(migrationName: string) {
    const migrationCheck = await prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM "_prisma_migrations" WHERE "migration_name" = $1`,
        migrationName
    );
    const migrationEntry = migrationCheck[0];
    
    if (migrationEntry) {
        if (!migrationEntry.finished_at) {
            console.log(`Marking ${migrationName} as applied...`);
            await prisma.$executeRawUnsafe(
                `UPDATE "_prisma_migrations" SET "finished_at" = NOW() WHERE "migration_name" = $1`,
                migrationName
            );
        }
    } else {
        console.log(`Inserting ${migrationName} entry...`);
        const otherMigrations = await prisma.$queryRawUnsafe<any[]>(
            `SELECT checksum FROM "_prisma_migrations" LIMIT 1`
        );
        const checksum = otherMigrations[0]?.checksum || 'dummy-checksum';
        await prisma.$executeRawUnsafe(
            `INSERT INTO "_prisma_migrations" (
                "id", "checksum", "finished_at", "migration_name", 
                "logs", "rolled_back_at", "started_at", "applied_steps_count"
            ) VALUES (gen_random_uuid(), $1, NOW(), $2, '', NULL, NOW(), 1)`,
            checksum, migrationName
        );
    }
}

async function applyTenantMigration() {
    const migrationName = '20260710163537_add_missing_tenant_columns';
    console.log(`Checking migration ${migrationName}...`);

    // --- Fix User table ---
    const userEmailExists = await checkColumnExists('User', 'email');
    const userPhoneExists = await checkColumnExists('User', 'phone');
    const userOutletIdsExists = await checkColumnExists('User', 'outletIds');
    const userEmailIndexExists = await checkIndexExists('User_email_key', 'User');
    const userPhoneIndexExists = await checkIndexExists('User_phone_key', 'User');

    if (!userEmailExists) {
        console.log('Adding User.email column...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "email" TEXT`);
    }
    if (!userPhoneExists) {
        console.log('Adding User.phone column...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "phone" TEXT`);
    }
    if (!userOutletIdsExists) {
        console.log('Adding User.outletIds column...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "outletIds" JSONB`);
    }
    if (!userEmailIndexExists) {
        console.log('Creating User_email_key index...');
        try {
            await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "User_email_key" ON "User"("email")`);
        } catch (e) {
            console.log('Index User_email_key might already exist or duplicates found, skipping unique constraint for safety');
        }
    }
    if (!userPhoneIndexExists) {
        console.log('Creating User_phone_key index...');
        try {
            await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone")`);
        } catch (e) {
            console.log('Index User_phone_key might already exist or duplicates found, skipping unique constraint for safety');
        }
    }

    // --- Fix Category table ---
    const categoryDescExists = await checkColumnExists('Category', 'description');
    const categoryImageUrlExists = await checkColumnExists('Category', 'imageUrl');
    if (!categoryDescExists) {
        console.log('Adding Category.description column...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "Category" ADD COLUMN "description" TEXT`);
    }
    if (!categoryImageUrlExists) {
        console.log('Adding Category.imageUrl column...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "Category" ADD COLUMN "imageUrl" TEXT`);
    }

    // --- Fix Customer table ---
    const customerLastPaymentDateExists = await checkColumnExists('Customer', 'lastPaymentDate');
    const customerTotalPaidAmountExists = await checkColumnExists('Customer', 'totalPaidAmount');
    const customerTotalPurchaseAmountExists = await checkColumnExists('Customer', 'totalPurchaseAmount');
    if (!customerLastPaymentDateExists) {
        console.log('Adding Customer.lastPaymentDate column...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "Customer" ADD COLUMN "lastPaymentDate" TIMESTAMP(3)`);
    }
    if (!customerTotalPaidAmountExists) {
        console.log('Adding Customer.totalPaidAmount column...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "Customer" ADD COLUMN "totalPaidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0`);
    }
    if (!customerTotalPurchaseAmountExists) {
        console.log('Adding Customer.totalPurchaseAmount column...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "Customer" ADD COLUMN "totalPurchaseAmount" DOUBLE PRECISION NOT NULL DEFAULT 0`);
    }

    // --- Fix Order table ---
    const orderSaleDataExists = await checkColumnExists('Order', 'saleData');
    if (!orderSaleDataExists) {
        console.log('Adding Order.saleData column...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN "saleData" JSONB`);
    }

    // --- Fix Outlet table ---
    const outletEmailExists = await checkColumnExists('Outlet', 'email');
    const outletFonepayCurrencyExists = await checkColumnExists('Outlet', 'fonepayCurrency');
    const outletFonepayIsEnabledExists = await checkColumnExists('Outlet', 'fonepayIsEnabled');
    const outletFonepayMerchantCodeExists = await checkColumnExists('Outlet', 'fonepayMerchantCode');
    const outletFonepayTerminalIdExists = await checkColumnExists('Outlet', 'fonepayTerminalId');
    const outletLogoUrlExists = await checkColumnExists('Outlet', 'logoUrl');
    const outletOutletTypeExists = await checkColumnExists('Outlet', 'outletType');
    const outletPlanExists = await checkColumnExists('Outlet', 'plan');
    const outletPlanExpiryDateExists = await checkColumnExists('Outlet', 'planExpiryDate');
    const outletRestaurantNameExists = await checkColumnExists('Outlet', 'restaurantName');
    const outletSubscriptionStatusExists = await checkColumnExists('Outlet', 'subscriptionStatus');
    const outletTaxesExists = await checkColumnExists('Outlet', 'taxes');
    const outletWhatsappDefaultMessageExists = await checkColumnExists('Outlet', 'whatsappDefaultMessage');
    const outletWhatsappNumberExists = await checkColumnExists('Outlet', 'whatsappNumber');
    const outletWhatsappOrderingEnabledExists = await checkColumnExists('Outlet', 'whatsappOrderingEnabled');

    if (!outletEmailExists) await prisma.$executeRawUnsafe(`ALTER TABLE "Outlet" ADD COLUMN "email" TEXT`);
    if (!outletFonepayCurrencyExists) await prisma.$executeRawUnsafe(`ALTER TABLE "Outlet" ADD COLUMN "fonepayCurrency" TEXT`);
    if (!outletFonepayIsEnabledExists) await prisma.$executeRawUnsafe(`ALTER TABLE "Outlet" ADD COLUMN "fonepayIsEnabled" BOOLEAN NOT NULL DEFAULT false`);
    if (!outletFonepayMerchantCodeExists) await prisma.$executeRawUnsafe(`ALTER TABLE "Outlet" ADD COLUMN "fonepayMerchantCode" TEXT`);
    if (!outletFonepayTerminalIdExists) await prisma.$executeRawUnsafe(`ALTER TABLE "Outlet" ADD COLUMN "fonepayTerminalId" TEXT`);
    if (!outletLogoUrlExists) await prisma.$executeRawUnsafe(`ALTER TABLE "Outlet" ADD COLUMN "logoUrl" TEXT`);
    if (!outletOutletTypeExists) await prisma.$executeRawUnsafe(`ALTER TABLE "Outlet" ADD COLUMN "outletType" TEXT NOT NULL DEFAULT 'Restaurant'`);
    if (!outletPlanExists) await prisma.$executeRawUnsafe(`ALTER TABLE "Outlet" ADD COLUMN "plan" TEXT`);
    if (!outletPlanExpiryDateExists) await prisma.$executeRawUnsafe(`ALTER TABLE "Outlet" ADD COLUMN "planExpiryDate" TIMESTAMP(3)`);
    if (!outletRestaurantNameExists) await prisma.$executeRawUnsafe(`ALTER TABLE "Outlet" ADD COLUMN "restaurantName" TEXT`);
    if (!outletSubscriptionStatusExists) await prisma.$executeRawUnsafe(`ALTER TABLE "Outlet" ADD COLUMN "subscriptionStatus" TEXT`);
    if (!outletTaxesExists) await prisma.$executeRawUnsafe(`ALTER TABLE "Outlet" ADD COLUMN "taxes" JSONB`);
    if (!outletWhatsappDefaultMessageExists) await prisma.$executeRawUnsafe(`ALTER TABLE "Outlet" ADD COLUMN "whatsappDefaultMessage" TEXT`);
    if (!outletWhatsappNumberExists) await prisma.$executeRawUnsafe(`ALTER TABLE "Outlet" ADD COLUMN "whatsappNumber" TEXT`);
    if (!outletWhatsappOrderingEnabledExists) await prisma.$executeRawUnsafe(`ALTER TABLE "Outlet" ADD COLUMN "whatsappOrderingEnabled" BOOLEAN NOT NULL DEFAULT false`);

    // --- Fix Tenant table ---
    const tenantAdminEmailExists = await checkColumnExists('Tenant', 'adminEmail');
    const tenantTrialDaysExists = await checkColumnExists('Tenant', 'trialDays');
    const tenantTrialEndsAtExists = await checkColumnExists('Tenant', 'trialEndsAt');
    if (!tenantAdminEmailExists) await prisma.$executeRawUnsafe(`ALTER TABLE "Tenant" ADD COLUMN "adminEmail" TEXT`);
    if (!tenantTrialDaysExists) await prisma.$executeRawUnsafe(`ALTER TABLE "Tenant" ADD COLUMN "trialDays" INTEGER DEFAULT 14`);
    if (!tenantTrialEndsAtExists) await prisma.$executeRawUnsafe(`ALTER TABLE "Tenant" ADD COLUMN "trialEndsAt" TIMESTAMP(3)`);

    // --- Create missing tables ---
    const tablesToCreate = [
        {
            name: 'OutletAppData',
            sqlStatements: [
                `CREATE TABLE IF NOT EXISTS "OutletAppData" (
                    "id" TEXT NOT NULL,
                    "outletId" TEXT NOT NULL,
                    "key" TEXT NOT NULL,
                    "data" JSONB NOT NULL,
                    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" TIMESTAMP(3) NOT NULL,
                    CONSTRAINT "OutletAppData_pkey" PRIMARY KEY ("id")
                )`,
                `CREATE UNIQUE INDEX IF NOT EXISTS "OutletAppData_outletId_key_key" ON "OutletAppData"("outletId", "key")`
            ]
        },
        {
            name: 'UserAppData',
            sqlStatements: [
                `CREATE TABLE IF NOT EXISTS "UserAppData" (
                    "id" TEXT NOT NULL,
                    "userId" TEXT NOT NULL,
                    "key" TEXT NOT NULL,
                    "data" JSONB NOT NULL,
                    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" TIMESTAMP(3) NOT NULL,
                    CONSTRAINT "UserAppData_pkey" PRIMARY KEY ("id")
                )`,
                `CREATE UNIQUE INDEX IF NOT EXISTS "UserAppData_userId_key_key" ON "UserAppData"("userId", "key")`
            ]
        },
        {
            name: 'GlobalAppData',
            sqlStatements: [
                `CREATE TABLE IF NOT EXISTS "GlobalAppData" (
                    "id" TEXT NOT NULL,
                    "key" TEXT NOT NULL,
                    "data" JSONB NOT NULL,
                    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" TIMESTAMP(3) NOT NULL,
                    CONSTRAINT "GlobalAppData_pkey" PRIMARY KEY ("id")
                )`,
                `CREATE UNIQUE INDEX IF NOT EXISTS "GlobalAppData_key_key" ON "GlobalAppData"("key")`
            ]
        },
        {
            name: 'PlanDefinition',
            sqlStatements: [
                `CREATE TABLE IF NOT EXISTS "PlanDefinition" (
                    "id" TEXT NOT NULL,
                    "name" TEXT NOT NULL,
                    "price" DOUBLE PRECISION NOT NULL,
                    "period" TEXT NOT NULL DEFAULT 'yearly',
                    "features" JSONB,
                    "featureKeys" JSONB,
                    "limits" JSONB,
                    "trialDays" INTEGER NOT NULL DEFAULT 14,
                    "isPublic" BOOLEAN NOT NULL DEFAULT true,
                    "isActive" BOOLEAN NOT NULL DEFAULT true,
                    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
                    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" TIMESTAMP(3) NOT NULL,
                    CONSTRAINT "PlanDefinition_pkey" PRIMARY KEY ("id")
                )`,
                `CREATE UNIQUE INDEX IF NOT EXISTS "PlanDefinition_name_key" ON "PlanDefinition"("name")`
            ]
        },
        {
            name: 'Role',
            sqlStatements: [
                `CREATE TABLE IF NOT EXISTS "Role" (
                    "id" TEXT NOT NULL,
                    "name" TEXT NOT NULL,
                    "permissions" JSONB,
                    "tenantId" TEXT,
                    "isSystem" BOOLEAN NOT NULL DEFAULT false,
                    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" TIMESTAMP(3) NOT NULL,
                    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
                )`,
                `CREATE UNIQUE INDEX IF NOT EXISTS "Role_tenantId_name_key" ON "Role"("tenantId", "name")`,
                `ALTER TABLE "Role" DROP CONSTRAINT IF EXISTS "Role_tenantId_fkey"`,
                `ALTER TABLE "Role" ADD CONSTRAINT "Role_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE`
            ]
        },
        {
            name: 'SubscriptionInvoice',
            sqlStatements: [
                `CREATE TABLE IF NOT EXISTS "SubscriptionInvoice" (
                    "id" TEXT NOT NULL,
                    "invoiceNumber" TEXT NOT NULL,
                    "tenantId" TEXT NOT NULL,
                    "paymentId" TEXT,
                    "amount" DOUBLE PRECISION NOT NULL,
                    "currencyCode" TEXT NOT NULL DEFAULT 'NPR',
                    "status" TEXT NOT NULL DEFAULT 'issued',
                    "method" TEXT,
                    "notes" TEXT,
                    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "paidAt" TIMESTAMP(3),
                    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" TIMESTAMP(3) NOT NULL,
                    CONSTRAINT "SubscriptionInvoice_pkey" PRIMARY KEY ("id")
                )`,
                `CREATE UNIQUE INDEX IF NOT EXISTS "SubscriptionInvoice_invoiceNumber_key" ON "SubscriptionInvoice"("invoiceNumber")`,
                `CREATE UNIQUE INDEX IF NOT EXISTS "SubscriptionInvoice_paymentId_key" ON "SubscriptionInvoice"("paymentId")`,
                `ALTER TABLE "SubscriptionInvoice" DROP CONSTRAINT IF EXISTS "SubscriptionInvoice_tenantId_fkey"`,
                `ALTER TABLE "SubscriptionInvoice" ADD CONSTRAINT "SubscriptionInvoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
                `ALTER TABLE "SubscriptionInvoice" DROP CONSTRAINT IF EXISTS "SubscriptionInvoice_paymentId_fkey"`,
                `ALTER TABLE "SubscriptionInvoice" ADD CONSTRAINT "SubscriptionInvoice_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE`
            ]
        },
        {
            name: 'Invoice',
            sqlStatements: [
                `CREATE TABLE IF NOT EXISTS "Invoice" (
                    "id" TEXT NOT NULL,
                    "invoiceNumber" TEXT NOT NULL,
                    "orderId" TEXT NOT NULL,
                    "customerId" TEXT,
                    "outletId" TEXT NOT NULL,
                    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
                    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
                    "dueAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
                    "paymentStatus" TEXT NOT NULL DEFAULT 'DUE',
                    "paymentMethod" TEXT,
                    "items" JSONB,
                    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
                    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
                    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" TIMESTAMP(3) NOT NULL,
                    "paidAt" TIMESTAMP(3),
                    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
                )`,
                `CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber")`,
                `ALTER TABLE "Invoice" DROP CONSTRAINT IF EXISTS "Invoice_orderId_fkey"`,
                `ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
                `ALTER TABLE "Invoice" DROP CONSTRAINT IF EXISTS "Invoice_customerId_fkey"`,
                `ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
                `ALTER TABLE "Invoice" DROP CONSTRAINT IF EXISTS "Invoice_outletId_fkey"`,
                `ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE`
            ]
        },
        {
            name: 'PaymentHistory',
            sqlStatements: [
                `CREATE TABLE IF NOT EXISTS "PaymentHistory" (
                    "id" TEXT NOT NULL,
                    "invoiceId" TEXT NOT NULL,
                    "customerId" TEXT,
                    "amount" DOUBLE PRECISION NOT NULL,
                    "method" TEXT NOT NULL,
                    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT "PaymentHistory_pkey" PRIMARY KEY ("id")
                )`,
                `ALTER TABLE "PaymentHistory" DROP CONSTRAINT IF EXISTS "PaymentHistory_invoiceId_fkey"`,
                `ALTER TABLE "PaymentHistory" ADD CONSTRAINT "PaymentHistory_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
                `ALTER TABLE "PaymentHistory" DROP CONSTRAINT IF EXISTS "PaymentHistory_customerId_fkey"`,
                `ALTER TABLE "PaymentHistory" ADD CONSTRAINT "PaymentHistory_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE`
            ]
        },
        {
            name: 'TenantLoginHistory',
            sqlStatements: [
                `CREATE TABLE IF NOT EXISTS "TenantLoginHistory" (
                    "id" TEXT NOT NULL,
                    "tenantId" TEXT NOT NULL,
                    "userId" TEXT,
                    "username" TEXT NOT NULL,
                    "ipAddress" TEXT,
                    "userAgent" TEXT,
                    "deviceLabel" TEXT,
                    "loginType" TEXT NOT NULL DEFAULT 'password',
                    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT "TenantLoginHistory_pkey" PRIMARY KEY ("id")
                )`,
                `ALTER TABLE "TenantLoginHistory" DROP CONSTRAINT IF EXISTS "TenantLoginHistory_tenantId_fkey"`,
                `ALTER TABLE "TenantLoginHistory" ADD CONSTRAINT "TenantLoginHistory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
                `ALTER TABLE "TenantLoginHistory" DROP CONSTRAINT IF EXISTS "TenantLoginHistory_userId_fkey"`,
                `ALTER TABLE "TenantLoginHistory" ADD CONSTRAINT "TenantLoginHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`
            ]
        }
    ];

    for (const table of tablesToCreate) {
        const exists = await checkTableExists(table.name);
        if (!exists) {
            console.log(`Creating table ${table.name}...`);
            for (const stmt of table.sqlStatements) {
                if (stmt.trim()) {
                    try {
                        await prisma.$executeRawUnsafe(stmt);
                    } catch (e) {
                        console.log(`Warning: Failed to execute statement for table ${table.name}, continuing...`, e);
                    }
                }
            }
        }
    }

    // --- Add missing foreign key to Order (outletId) ---
    try {
        const orderOutletFkExists = await prisma.$queryRawUnsafe<any[]>(`
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'Order_outletId_fkey' AND table_name = 'Order'
        `);
        if (!orderOutletFkExists.length) {
            console.log('Adding Order_outletId_fkey foreign key...');
            await prisma.$executeRawUnsafe(`ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_outletId_fkey"`);
            await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD CONSTRAINT "Order_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
        }
    } catch (e) {
        console.log('Error checking/adding Order_outletId_fkey:', e);
    }

    // --- Add Customer.userId column and foreign key if not exists ---
    const customerUserIdExists = await checkColumnExists('Customer', 'userId');
    if (!customerUserIdExists) {
        console.log('Adding Customer.userId column...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "Customer" ADD COLUMN "userId" TEXT UNIQUE`);
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "Customer" DROP CONSTRAINT IF EXISTS "Customer_userId_fkey"`);
            await prisma.$executeRawUnsafe(`ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
        } catch (e) {
            console.log('Error adding Customer_userId_fkey:', e);
        }
    }

    // Mark migration as applied
    await markMigrationApplied(migrationName);
}

async function applyInitMigration() {
    const migrationName = '20260225065717_init';
    console.log(`Checking migration ${migrationName}...`);

    // Check if key tables from init migration exist
    const requiredTables = ['Tenant', 'Outlet', 'Category', 'MenuItem', 'Variation', 'Table', 'Customer', 'Order', 'OrderItem', 'User', 'Currency', 'Payment', 'Lead', 'LeadNote', 'SaasEmailConfig'];
    let allTablesExist = true;
    for (const tableName of requiredTables) {
        const exists = await checkTableExists(tableName);
        if (!exists) {
            console.log(`Table ${tableName} does not exist, will not mark init migration as applied`);
            allTablesExist = false;
            break;
        }
    }

    if (allTablesExist) {
        console.log('All init tables exist, marking migration as applied');
        await markMigrationApplied(migrationName);
    }
}

async function applyReservationsMigration() {
    const migrationName = '20260225072526_add_reservations_and_user_link';
    console.log(`Checking migration ${migrationName}...`);

    const reservationTableExists = await checkTableExists('Reservation');
    if (reservationTableExists) {
        console.log('Reservation table exists, marking migration as applied');
        await markMigrationApplied(migrationName);
    }
}

async function applyBillingAddressMigration() {
    const migrationName = '20260225073428_add_billing_address';
    console.log(`Checking migration ${migrationName}...`);

    const billingAddressExists = await checkColumnExists('Customer', 'billingAddress');
    if (billingAddressExists) {
        console.log('Customer.billingAddress exists, marking migration as applied');
        await markMigrationApplied(migrationName);
    }
}

async function applySaasWebsiteContentMigration() {
    const migrationName = '20260324122524_add_saas_website_content';
    console.log(`Checking migration ${migrationName}...`);

    const saasWebsiteContentTableExists = await checkTableExists('SaasWebsiteContent');
    if (saasWebsiteContentTableExists) {
        console.log('SaasWebsiteContent table exists, marking migration as applied');
        await markMigrationApplied(migrationName);
    }
}

async function applyPrinterMigration() {
    const migrationName = '20260711_add_printer_model'; // We'll create this migration folder
    console.log(`Checking migration ${migrationName}...`);
    
    const printerTableExists = await checkTableExists('Printer');
    
    if (!printerTableExists) {
        console.log('Creating Printer table...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "Printer" (
                "id" TEXT NOT NULL,
                "name" TEXT NOT NULL,
                "type" TEXT NOT NULL DEFAULT 'Receipt',
                "interfaceType" TEXT NOT NULL DEFAULT 'Network (IP/Ethernet)',
                "isActive" BOOLEAN NOT NULL DEFAULT true,
                "ipAddress" TEXT,
                "port" TEXT,
                "usbPath" TEXT,
                "bluetoothMac" TEXT,
                "serialPort" TEXT,
                "baudRate" INTEGER,
                "paperSize" TEXT DEFAULT '80mm',
                "printerModel" TEXT,
                "timeoutMs" INTEGER DEFAULT 5000,
                "retries" INTEGER DEFAULT 3,
                "autoPrintReceipt" BOOLEAN NOT NULL DEFAULT false,
                "autoPrintKOT" BOOLEAN NOT NULL DEFAULT false,
                "autoPrintLabel" BOOLEAN NOT NULL DEFAULT false,
                "notes" TEXT,
                "outletId" TEXT NOT NULL,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL,
                CONSTRAINT "Printer_pkey" PRIMARY KEY ("id")
            )
        `);
        console.log('Printer table created!');
    }
    
    await markMigrationApplied(migrationName);
}

async function applyUsbPrintBridgeMigration() {
    const migrationName = '20260711133000_add_usb_print_bridge';
    console.log(`Checking migration ${migrationName}...`);

    const printerJobTableExists = await checkTableExists('PrinterJob');
    const outletStatusIndexExists = await checkIndexExists('PrinterJob_outletId_interfaceType_status_createdAt_idx', 'PrinterJob');
    const printerStatusIndexExists = await checkIndexExists('PrinterJob_printerId_status_createdAt_idx', 'PrinterJob');

    if (!printerJobTableExists) {
        console.log('Creating PrinterJob table...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "PrinterJob" (
                "id" TEXT NOT NULL,
                "printerId" TEXT NOT NULL,
                "outletId" TEXT NOT NULL,
                "printerName" TEXT NOT NULL,
                "interfaceType" TEXT NOT NULL,
                "printType" TEXT NOT NULL,
                "content" TEXT NOT NULL,
                "status" TEXT NOT NULL DEFAULT 'pending',
                "attempts" INTEGER NOT NULL DEFAULT 0,
                "maxRetries" INTEGER NOT NULL DEFAULT 3,
                "timeoutMs" INTEGER NOT NULL DEFAULT 5000,
                "claimedBy" TEXT,
                "claimedAt" TIMESTAMP(3),
                "completedAt" TIMESTAMP(3),
                "failedAt" TIMESTAMP(3),
                "errorMessage" TEXT,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PrinterJob_pkey" PRIMARY KEY ("id")
            )
        `);
        console.log('PrinterJob table created!');
    }

    if (!outletStatusIndexExists) {
        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "PrinterJob_outletId_interfaceType_status_createdAt_idx"
            ON "PrinterJob"("outletId", "interfaceType", "status", "createdAt")
        `);
    }

    if (!printerStatusIndexExists) {
        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "PrinterJob_printerId_status_createdAt_idx"
            ON "PrinterJob"("printerId", "status", "createdAt")
        `);
    }

    await markMigrationApplied(migrationName);
}

async function main() {
    console.log('Starting comprehensive migration fix script (idempotent)...');
    await applyInitMigration();
    await applyReservationsMigration();
    await applyBillingAddressMigration();
    await applySaasWebsiteContentMigration();
    await applySlugMigration();
    await applyTenantMigration();
    await applyPrinterMigration();
    await applyUsbPrintBridgeMigration();
    console.log('✅ All migration fixes complete!');
    await prisma.$disconnect();
}

main().catch(error => {
    console.error('❌ Error fixing migrations:', error);
    process.exit(1);
});
