import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const emailLower = 'mohamed.osama5060@gmail.com';
  const password = 'Craft@Osama2026!';
  const hashedPassword = await bcrypt.hash(password, 10);

  // 1. Delete any case variations if exist
  await prisma.user.deleteMany({
    where: {
      email: {
        in: ['Mohamed.osama5060@gmail.com', 'mohamed.osama5060@gmail.com', 'MOHAMED.OSAMA5060@GMAIL.COM'],
      },
    },
  });

  // 2. Ensure SUPER_ADMIN role exists
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

  // 3. Create user with strictly lowercase email
  const user = await prisma.user.create({
    data: {
      email: emailLower,
      fullName: 'Mohamed Osama',
      passwordHash: hashedPassword,
      isActive: true,
    },
  });

  // 4. Link role
  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: role.id,
    },
  });

  console.log('✅ Success! User created with lowercase email:');
  console.log(`Email: ${emailLower}`);
  console.log(`Password: ${password}`);

  // Also verify user list
  const users = await prisma.user.findMany({ select: { id: true, email: true, isActive: true } });
  console.log('Current users in database:', users);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
