import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      userRoles: {
        include: { role: true },
      },
    },
  });

  console.log('--- ALL USERS IN DB ---');
  for (const u of users) {
    console.log('ID:', u.id, 'Email:', u.email, 'Active:', u.isActive, 'Roles:', u.userRoles.map(r => r.role.name));
    const testAdminFashion = await bcrypt.compare('Admin@Fashion2026!', u.passwordHash);
    const testCraftOsama = await bcrypt.compare('Craft@Osama2026!', u.passwordHash);
    console.log('  Match Admin@Fashion2026! ->', testAdminFashion);
    console.log('  Match Craft@Osama2026! ->', testCraftOsama);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
