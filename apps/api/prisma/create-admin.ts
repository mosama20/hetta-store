import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'mohamed.osama5060@gmail.com';
  const password = 'Craft@Osama2026!';
  const hashedPassword = await bcrypt.hash(password, 10);

  // 1. Ensure SUPER_ADMIN role exists
  let role = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
  if (!role) {
    role = await prisma.role.create({
      data: {
        name: 'SUPER_ADMIN',
        displayNameAr: 'المدير العام',
        displayNameEn: 'Super Administrator',
        isSystem: true,
      },
    });
  }

  // 2. Ensure all permissions exist and are linked to SUPER_ADMIN
  const systemPermissions = [
    { name: 'products.manage', module: 'products', description: 'Full access to products' },
    { name: 'categories.manage', module: 'categories', description: 'Full access to categories' },
    { name: 'orders.manage', module: 'orders', description: 'Full access to orders' },
    { name: 'users.manage', module: 'users', description: 'Full access to users' },
    { name: 'settings.manage', module: 'settings', description: 'Full access to settings' },
    { name: 'cms.manage', module: 'cms', description: 'Full access to CMS' },
    { name: 'discounts.manage', module: 'discounts', description: 'Full access to discounts' },
    { name: 'analytics.view', module: 'analytics', description: 'View analytics' },
  ];

  for (const permData of systemPermissions) {
    const perm = await prisma.permission.upsert({
      where: { name: permData.name },
      update: {},
      create: permData,
    });

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: role.id,
        permissionId: perm.id,
      },
    });
  }

  // 3. Upsert user
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: {
      fullName: 'Mohamed Osama',
      passwordHash: hashedPassword,
      isActive: true,
    },
    create: {
      email: email.toLowerCase(),
      fullName: 'Mohamed Osama',
      passwordHash: hashedPassword,
      isActive: true,
    },
  });

  // 4. Link role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: role.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      roleId: role.id,
    },
  });

  console.log(`✅ Admin user created/updated successfully in Supabase:`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Emergency Recovery Code: CRAFT2026`);
}

main()
  .catch((e) => {
    console.error('Error creating admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
