import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

module.exports = async () => {
  console.log('\n🔄 Resetando banco de dados de testes...');

  try {
    // Dropa tudo e aplica migrations
    execSync('npx prisma migrate reset --force --skip-seed --schema=prisma/schema.prisma', {
      stdio: 'inherit',
    });

    // Se você quiser rodar o seed:
    // execSync('npx prisma db seed --schema=prisma/schema.prisma', { stdio: 'inherit' });

    // Limpa redis se necessário
    // await redis.flushall();
  } catch (err) {
    console.error('Erro ao resetar o banco de dados:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  console.log('✅ Banco de dados pronto para testes.\n');
};
