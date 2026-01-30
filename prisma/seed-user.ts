import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = 'Shashvi';
  const password = 'sus123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.loginInfo.upsert({
    where: { username },
    update: {
      hashedPassword,
    },
    create: {
      username,
      hashedPassword,
    },
  });

  console.log('User created or updated:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
