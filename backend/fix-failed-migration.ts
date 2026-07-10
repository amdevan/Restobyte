import prisma from './src/db/prisma.js';

async function main() {
    console.log('Starting migration fix script (idempotent)...');

    const migrationName = '20260708000000_add_outlet_slug';

    // 1. Check if slug column exists on Outlet
    const checkColumn = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'Outlet' AND column_name = 'slug'`
    );
    const slugColumnExists = checkColumn.length > 0;
    console.log('slug column exists:', slugColumnExists);

    // 2. Check if Outlet_slug_key index exists
    const checkIndex = await prisma.$queryRawUnsafe<{ indexname: string }[]>(
        `SELECT indexname FROM pg_indexes WHERE tablename = 'Outlet' AND indexname = 'Outlet_slug_key'`
    );
    const indexExists = checkIndex.length > 0;
    console.log('Outlet_slug_key index exists:', indexExists);

    // 3. If column doesn't exist, create it safely
    if (!slugColumnExists) {
        console.log('Adding slug column...');
        // First add as nullable so we can populate it
        await prisma.$executeRawUnsafe(
            `ALTER TABLE "Outlet" ADD COLUMN "slug" TEXT`
        );
        console.log('Slug column added (nullable)');

        // Populate with unique temporary slugs (id)
        console.log('Populating temporary slugs using id...');
        await prisma.$executeRawUnsafe(
            `UPDATE "Outlet" SET "slug" = id WHERE "slug" IS NULL`
        );
        console.log('Temporary slugs populated');

        // Now set to NOT NULL
        console.log('Setting slug column to NOT NULL...');
        await prisma.$executeRawUnsafe(
            `ALTER TABLE "Outlet" ALTER COLUMN "slug" SET NOT NULL`
        );
        console.log('Slug column is now NOT NULL');
    } else {
        // If column exists but has NULLs, populate them
        console.log('Checking for NULL slugs...');
        const nullCheck = await prisma.$queryRawUnsafe<{ count: number }[]>(
            `SELECT COUNT(*) as count FROM "Outlet" WHERE "slug" IS NULL`
        );
        const nullSlugs = nullCheck[0]?.count ?? 0;
        if (nullSlugs > 0) {
            console.log(`Found ${nullSlugs} outlets with NULL slug, fixing...`);
            await prisma.$executeRawUnsafe(
                `UPDATE "Outlet" SET "slug" = id WHERE "slug" IS NULL`
            );
            console.log('Fixed NULL slugs');
        }
    }

    // 4. If index doesn't exist, create it
    if (!indexExists) {
        console.log('Creating unique index Outlet_slug_key...');
        await prisma.$executeRawUnsafe(
            `CREATE UNIQUE INDEX "Outlet_slug_key" ON "Outlet"("slug")`
        );
        console.log('Unique index created');
    }

    // 5. Check _prisma_migrations
    const migrationCheck = await prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM "_prisma_migrations" WHERE "migration_name" = $1`,
        migrationName
    );
    const migrationEntry = migrationCheck[0];

    if (migrationEntry) {
        if (!migrationEntry.finished_at) {
            console.log('Marking failed migration as finished...');
            await prisma.$executeRawUnsafe(
                `UPDATE "_prisma_migrations" SET "finished_at" = NOW() WHERE "migration_name" = $1`,
                migrationName
            );
            console.log('Migration marked as finished');
        }
    } else {
        // No entry at all, insert one
        console.log('Inserting migration entry...');
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
        console.log('Migration entry inserted');
    }

    console.log('✅ Migration fix complete (idempotent)!');
    await prisma.$disconnect();
}

main().catch(error => {
    console.error('❌ Error fixing migration:', error);
    process.exit(1);
});

