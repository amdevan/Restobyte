
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany();
  console.log('Categories:', JSON.stringify(categories, null, 2));
  
  const menuItems = await prisma.menuItem.findMany({
    include: { category: true, variations: true }
  });
  console.log('Menu Items:', JSON.stringify(menuItems, null, 2));

  const outlets = await prisma.outlet.findMany();
  console.log('Outlets:', JSON.stringify(outlets, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
