import prisma from '../src/db/prisma.js';
import bcrypt from 'bcryptjs';

async function run() {
  console.log('Seeding database...');

  // 1. Create Default Tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: 'tenant-1' },
    update: {
      name: 'Demo Tenant',
      plan: 'Pro',
      subscriptionStatus: 'active'
    },
    create: {
      id: 'tenant-1',
      name: 'Demo Tenant',
      plan: 'Pro',
      subscriptionStatus: 'active'
    }
  });
  console.log('Tenant ready:', tenant.id);

  // 2. Create Default Outlet
  const outlet = await prisma.outlet.upsert({
    where: { id: 'outlet-1' },
    update: {
      name: 'Main Outlet',
      tenantId: tenant.id,
      address: '123 Main St',
      phone: '555-0123'
    },
    create: {
      id: 'outlet-1',
      name: 'Main Outlet',
      tenantId: tenant.id,
      address: '123 Main St',
      phone: '555-0123'
    }
  });
  console.log('Outlet ready:', outlet.id);

  // 3. Create Users
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
        outletId: outlet.id,
        tenantId: tenant.id,
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
        roleId: 'role-superadmin',
        outletId: outlet.id,
        tenantId: tenant.id,
        isSuperAdmin: true,
      },
    });
    console.log('Created superadmin user');
  }

  // 4. Create Categories & Items (linked to outlet if schema supported it, currently schema has outletId as String? on Category)
  let catMain = await prisma.category.findFirst({ where: { name: 'Main Course', outletId: outlet.id } });
  if (!catMain) {
    catMain = await prisma.category.create({
      data: { name: 'Main Course', outletId: outlet.id }
    });
  }

  let catDrinks = await prisma.category.findFirst({ where: { name: 'Drinks', outletId: outlet.id } });
  if (!catDrinks) {
    catDrinks = await prisma.category.create({
      data: { name: 'Drinks', outletId: outlet.id }
    });
  }

  const existingBurger = await prisma.menuItem.findFirst({ where: { name: 'Classic Burger', categoryId: catMain.id } });
  if (!existingBurger) {
    await prisma.menuItem.create({
      data: {
        name: 'Classic Burger',
        description: 'Beef patty with lettuce, tomato, and cheese',
        categoryId: catMain.id,
        price: 9.99,
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        isVegetarian: false,
        variations: {
          create: [
            { name: 'Single', price: 9.99 },
            { name: 'Double', price: 12.99 }
          ]
        }
      }
    });
  }

  const existingCola = await prisma.menuItem.findFirst({ where: { name: 'Cola', categoryId: catDrinks.id } });
  if (!existingCola) {
    await prisma.menuItem.create({
      data: {
        name: 'Cola',
        description: 'Chilled soft drink',
        categoryId: catDrinks.id,
        price: 2.5,
        imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        isVegetarian: true
      }
    });
  }

  // 5. Create Customer
  const existingCustomer = await prisma.customer.findFirst({ where: { email: 'john@example.com', outletId: outlet.id } });
  if (!existingCustomer) {
    await prisma.customer.create({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        outletId: outlet.id
      }
    });
  }

  // 6. Create Tables
  await prisma.table.createMany({
      data: [
          { name: 'T1', capacity: 2, outletId: outlet.id },
          { name: 'T2', capacity: 4, outletId: outlet.id },
          { name: 'T3', capacity: 6, outletId: outlet.id },
      ]
  });

  console.log('Seeding completed.');
}
run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
