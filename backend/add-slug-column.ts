
import prisma from './src/db/prisma.js';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateUniqueSlug(name: string, tenantId: string, excludeId?: string): Promise<string> {
  let baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    // Check using raw SQL since slug column doesn't exist yet for querying via Prisma model
    const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM "Outlet" WHERE slug = $1 AND "tenantId" = $2 ${excludeId ? 'AND id != $3' : ''}`,
      slug,
      tenantId,
      ...(excludeId ? [excludeId] : [])
    );

    if (existing.length === 0) break;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

async function main() {
  console.log('Step 1: Adding slug column with default value...');
  await prisma.$executeRawUnsafe(`ALTER TABLE "Outlet" ADD COLUMN IF NOT EXISTS slug TEXT NOT NULL DEFAULT 'temp-slug'`);

  console.log('Step 2: Backfilling slugs for existing outlets...');
  const outlets = await prisma.$queryRawUnsafe<{ id: string; name: string; restaurantName: string | null; tenantId: string }[]>(
    `SELECT id, name, "restaurantName", "tenantId" FROM "Outlet"`
  );

  for (const outlet of outlets) {
    const nameForSlug = outlet.restaurantName || outlet.name;
    const slug = await generateUniqueSlug(nameForSlug, outlet.tenantId, outlet.id);

    await prisma.$executeRawUnsafe(
      `UPDATE "Outlet" SET slug = $1 WHERE id = $2`,
      slug,
      outlet.id
    );

    console.log(`Updated outlet ${outlet.id} with slug ${slug}`);
  }

  console.log('Step 3: Adding unique index on slug...');
  try {
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Outlet_slug_key" ON "Outlet"(slug)`);
  } catch (e) {
    console.log('Unique index may already exist');
  }

  console.log('All steps complete!');
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
