
import prisma from '../db/prisma.js';

async function main() {
  console.log('Checking for existing outlets...');

  const existingOutlets = await prisma.outlet.findMany();
  
  if (existingOutlets.length > 0) {
    console.log(`✅ Found ${existingOutlets.length} outlet(s):`);
    existingOutlets.forEach(outlet => {
      console.log(`  - ${outlet.name} (ID: ${outlet.id})`);
    });
    return;
  }

  console.log('❌ No outlets found. Creating default outlet...');

  // Check if we have a tenant first!
  let tenant = await prisma.tenant.findFirst();
  
  if (!tenant) {
    console.log('Creating default tenant...');
    tenant = await prisma.tenant.create({
      data: {
        name: 'Default Tenant',
      },
    });
    console.log(`✅ Created tenant: ${tenant.name} (ID: ${tenant.id})`);
  }

  // Check if we have roles!
  const adminRole = await prisma.role.findUnique({ where: { id: 'role-admin' } });
  if (!adminRole) {
    console.log('Creating default admin role...');
    await prisma.role.create({
      data: {
        id: 'role-admin',
        name: 'Admin',
        isSystem: true,
        tenantId: tenant.id,
      },
    });
  }

  // Create outlet!
  const outlet = await prisma.outlet.create({
    data: {
      name: 'Main Branch',
      restaurantName: 'RestoByte Main',
      slug: 'main-branch',
      outletType: 'Restaurant',
      address: '123 Main St, Anytown',
      phone: '555-111-2222',
      taxes: [
        { id: 'tax-1', name: 'VAT', rate: 5 },
      ],
      tenantId: tenant.id,
    },
  });
  console.log(`✅ Created outlet: ${outlet.name} (ID: ${outlet.id})`);

  // Check if we have a user! If not, create a default admin user!
  const existingUser = await prisma.user.findFirst();
  if (!existingUser) {
    console.log('Creating default admin user...');
    const user = await prisma.user.create({
      data: {
        username: 'admin',
        password: 'admin123', // In real life, you'd hash this, but for dev, plaintext is okay!
        roleId: 'role-admin',
        outletId: outlet.id,
        outletIds: [outlet.id],
        isActive: true,
        isSuperAdmin: true,
        tenantId: tenant.id,
      },
    });
    console.log(`✅ Created admin user: ${user.username}`);
  }

  console.log('All done!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

