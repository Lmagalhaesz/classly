// exemplo simplificado do seed.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const bot = await prisma.user.upsert({
    where: { email: 'ai@bot.com' },
    update: {},
    create: {
      name: 'AI Bot',
      email: 'ai@bot.com',
      password: '–––alguma senha hash–––',
      role: 'ADMIN',       // ou TEACHER, conforme seu uso
      level: 'ADVANCED',
    },
  });

  console.log('✅ AI Bot seed concluído.');  
  console.log('🤖 AI_USER_ID:', bot.id);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
