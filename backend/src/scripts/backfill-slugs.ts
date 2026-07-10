
import prisma from '../db/prisma.js';

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
    const existing = await prisma.outlet.findFirst({
      where: {
        slug,
        tenantId,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });

    if (!existing) break;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

async function backfillSlugs() {
  console.log('Starting to backfill outlet slugs...');

  const outlets = await prisma.outlet.findMany();

  for (const outlet of outlets) {
    if (!outlet.slug) {
      const nameForSlug = outlet.restaurantName || outlet.name;
      const slug = await generateUniqueSlug(nameForSlug, outlet.tenantId, outlet.id);

      await prisma.outlet.update({
        where: { id: outlet.id },
        data: { slug },
      });

      console.log(`Updated outlet ${outlet.id} with slug ${slug}`);
    }
  }

  console.log('Backfill complete!');
  await prisma.$disconnect();
}

backfillSlugs().catch((error) => {
  console.error('Error backfilling slugs:', error);
  process.exit(1);
});
