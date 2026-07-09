import prisma from "../db/prisma.js";

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function generateUniqueSlug(
  name: string,
  tenantId: string,
  excludeId?: string
): Promise<string> {
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
