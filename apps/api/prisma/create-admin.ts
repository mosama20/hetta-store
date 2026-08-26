import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'Mohamed.osama5060@gmail.com';
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

  // 2. Upsert user
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      fullName: 'Mohamed Osama',
      passwordHash: hashedPassword,
      isActive: true,
    },
    create: {
      email,
      fullName: 'Mohamed Osama',
      passwordHash: hashedPassword,
      isActive: true,
    },
  });

  // 3. Link role
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

  console.log(`✅ Admin user created successfully:`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

main()
  .catch((e) => {
    console.error('Error creating admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
