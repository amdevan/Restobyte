import prisma from '../src/db/prisma.js';
import bcrypt from 'bcryptjs';

async function run() {
  console.log('Seeding database...');

  // Create default users
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const superAdminPassword = await bcrypt.hash('superadmin123', salt);

  const existingAdmin = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        username: 'admin',
        password: adminPassword,
        roleId: 'role-admin',
        outletId: 'outlet-1',
        isSuperAdmin: false,
      },
    });
    console.log('Created admin user');
  }

  const existingSuperAdmin = await prisma.user.findUnique({ where: { username: 'superadmin' } });
  if (!existingSuperAdmin) {
    await prisma.user.create({
      data: {
        username: 'superadmin',
        password: superAdminPassword,
        roleId: 'role-admin',
        outletId: 'outlet-1',
        isSuperAdmin: true,
      },
    });
    console.log('Created superadmin user');
  }

  const existingMain = await prisma.category.findFirst({ where: { name: 'Main Course' } });
  const catMain = existingMain ?? await prisma.category.create({
    data: { name: 'Main Course' },
  });

  const existingDrinks = await prisma.category.findFirst({ where: { name: 'Drinks' } });
  const catDrinks = existingDrinks ?? await prisma.category.create({
    data: { name: 'Drinks' },
  });

  const burger = await prisma.menuItem.create({
    data: {
      name: 'Classic Burger',
      description: 'Beef patty with lettuce, tomato, and cheese',
      categoryId: catMain.id,
      price: 9.99,
      imageUrl: null,
      isVegetarian: false,
      variations: {
        create: [
          { name: 'Single', price: 9.99 },
          { name: 'Double', price: 12.99 },
        ],
      },
    },
    include: { category: true, variations: true },
  });

  const cola = await prisma.menuItem.create({
    data: {
      name: 'Cola',
      description: 'Chilled soft drink',
      categoryId: catDrinks.id,
      price: 2.5,
      imageUrl: null,
      isVegetarian: true,
    },
    include: { category: true },
  });

  const customer = await prisma.customer.create({
    data: { name: 'John Doe', email: 'john@example.com', phone: '123-456-7890' },
  });

  const order = await prisma.order.create({
    data: {
      customerId: customer.id,
      status: 'PENDING',
      items: {
        create: [
          { menuItemId: burger.id, quantity: 1, unitPrice: 9.99 },
          { menuItemId: cola.id, quantity: 2, unitPrice: 2.5 },
        ],
      },
    },
    include: { items: true },
  });

  const total = order.items.reduce(
    (sum: number, it: { unitPrice: number; quantity: number }) => sum + it.unitPrice * it.quantity,
    0
  );
  await prisma.order.update({ where: { id: order.id }, data: { total } });

  console.log('Seed complete.');
}

export async function seed() {
  console.log('Seeding database...');

  // Create default users
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const superAdminPassword = await bcrypt.hash('superadmin123', salt);

  const existingAdmin = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        username: 'admin',
        password: adminPassword,
        roleId: 'role-admin',
        outletId: 'outlet-1',
        isSuperAdmin: false,
      },
    });
    console.log('Created admin user');
  }

  const existingSuperAdmin = await prisma.user.findUnique({ where: { username: 'superadmin' } });
  if (!existingSuperAdmin) {
    await prisma.user.create({
      data: {
        username: 'superadmin',
        password: superAdminPassword,
        roleId: 'role-admin',
        outletId: 'outlet-1',
        isSuperAdmin: true,
      },
    });
    console.log('Created superadmin user');
  }

  const existingMain = await prisma.category.findFirst({ where: { name: 'Main Course' } });
  const catMain = existingMain ?? await prisma.category.create({
    data: { name: 'Main Course' },
  });

  const existingDrinks = await prisma.category.findFirst({ where: { name: 'Drinks' } });
  const catDrinks = existingDrinks ?? await prisma.category.create({
    data: { name: 'Drinks' },
  });

  const burger = await prisma.menuItem.create({
    data: {
      name: 'Classic Burger',
      description: 'Beef patty with lettuce, tomato, and cheese',
      categoryId: catMain.id,
      price: 9.99,
      imageUrl: null,
      isVegetarian: false,
      variations: {
        create: [
          { name: 'Single', price: 9.99 },
          { name: 'Double', price: 12.99 },
        ],
      },
    },
    include: { category: true, variations: true },
  });

  const cola = await prisma.menuItem.create({
    data: {
      name: 'Cola',
      description: 'Chilled soft drink',
      categoryId: catDrinks.id,
      price: 2.5,
      imageUrl: null,
      isVegetarian: true,
    },
    include: { category: true },
  });

  const customer = await prisma.customer.create({
    data: { name: 'John Doe', email: 'john@example.com', phone: '123-456-7890' },
  });

  const order = await prisma.order.create({
    data: {
      customerId: customer.id,
      status: 'PENDING',
      items: {
        create: [
          { menuItemId: burger.id, quantity: 1, unitPrice: 9.99 },
          { menuItemId: cola.id, quantity: 2, unitPrice: 2.5 },
        ],
      },
    },
    include: { items: true },
  });

  const total = order.items.reduce(
    (sum: number, it: { unitPrice: number; quantity: number }) => sum + it.unitPrice * it.quantity,
    0
  );
  await prisma.order.update({ where: { id: order.id }, data: { total } });

  console.log('Seed complete.');
  return { success: true, message: 'Seeding completed' };
}

// Support running directly with tsx
if (import.meta.url.endsWith('seed.ts')) {
  seed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
