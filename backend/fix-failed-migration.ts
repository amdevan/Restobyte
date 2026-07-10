import prisma from './src/db/prisma.js';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log('Checking migration state...');
    
    // 1. Check if slug column exists on Outlet
    const checkColumnQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'Outlet' AND column_name = 'slug'
    `;
    const columnCheck = await prisma.$queryRawUnsafe<any[]>(checkColumnQuery);
    const slugColumnExists = columnCheck.length > 0;

    console.log('slug column exists:', slugColumnExists);

    // 2. Check _prisma_migrations table for failed migration
    const migrationName = '20260708000000_add_outlet_slug';
    const migrationCheck = await prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM "_prisma_migrations" WHERE "migration_name" = $1`,
        migrationName
    );
    const migrationEntry = migrationCheck[0];
    console.log('Migration entry:', migrationEntry);

    if (!slugColumnExists) {
        console.log('Running our fixed migration SQL...');
        const sql = `
            ALTER TABLE "Outlet" ADD COLUMN "slug" TEXT NOT NULL DEFAULT '';
            UPDATE "Outlet" SET "slug" = id;
            CREATE UNIQUE INDEX "Outlet_slug_key" ON "Outlet"("slug");
        `;
        await prisma.$executeRawUnsafe(sql);
        console.log('Successfully ran migration SQL!');
    }

    // If migration entry exists but isn't marked as finished, mark it as finished
    if (migrationEntry && !migrationEntry.finished_at) {
        console.log('Marking migration as applied...');
        const markSql = `
            UPDATE "_prisma_migrations" 
            SET "finished_at" = NOW()
            WHERE "migration_name" = $1
        `;
        await prisma.$executeRawUnsafe(markSql, migrationName);
        console.log('Marked migration as applied!');
    } else if (!migrationEntry) {
        // If no migration entry at all, insert it (we'll use dummy checksum for now, but user can adjust)
        console.log('Inserting migration entry...');
        const insertSql = `
            INSERT INTO "_prisma_migrations" (
                "id", 
                "checksum", 
                "finished_at", 
                "migration_name", 
                "logs", 
                "rolled_back_at", 
                "started_at", 
                "applied_steps_count"
            ) VALUES (
                gen_random_uuid(),
                $1,
                NOW(),
                $2,
                '',
                NULL,
                NOW(),
                1
            )
        `;
        // Get checksum from another migration
        const otherMigration = await prisma.$queryRawUnsafe<any[]>(
            `SELECT checksum FROM "_prisma_migrations" LIMIT 1`
        );
        const checksum = otherMigration[0]?.checksum || 'dummy-checksum';
        await prisma.$executeRawUnsafe(insertSql, checksum, migrationName);
        console.log('Inserted migration entry!');
    }

    console.log('Migration fix complete!');
    await prisma.$disconnect();
}

main().catch(error => {
    console.error('Error fixing migration:', error);
    process.exit(1);
});
