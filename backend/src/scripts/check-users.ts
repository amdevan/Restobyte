import prisma from '../db/prisma.js';

async function main() {
  console.log('Checking existing users in DB...');
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users:`);
  users.forEach(user => {
    console.log('-', {
      id: user.id,
      username: user.username,
      email: user.email,
      roleId: user.roleId,
      isActive: user.isActive,
      isSuperAdmin: user.isSuperAdmin,
      hasPassword: !!user.password
    });
  });

  console.log('\nChecking existing roles...');
  const roles = await prisma.role.findMany();
  console.log(`Found ${roles.length} roles:`);
  roles.forEach(role => {
    console.log('-', { id: role.id, name: role.name, tenantId: role.tenantId });
  });
}

main()
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
