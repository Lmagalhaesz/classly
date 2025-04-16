const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  // configuração via env (opcional)
  const aiId    = process.env.AI_USER_ID    || '00000000-0000-0000-0000-000000000001'
  const aiEmail = process.env.AI_USER_EMAIL || 'ai@linfox.internal'
  const aiName  = process.env.AI_USER_NAME  || 'AI Bot'
  const aiRole  = process.env.AI_USER_ROLE  || 'ADMIN'
  const aiRawPassword = process.env.AI_USER_PASS || 'changeme'

  // faz hash da senha (troque o saltRounds se precisar)
  const passwordHash = await bcrypt.hash(aiRawPassword, 10)

  // upsert idempotente: se já existe, não altera nada; senão, cria
  await prisma.user.upsert({
    where: { email: aiEmail },
    update: {},  // aqui, você pode colocar campos a atualizar, se quiser
    create: {
      id:       aiId,
      name:     aiName,
      email:    aiEmail,
      password: passwordHash,
      role:     aiRole,
      // omita outros campos obrigatórios ou use defaults
    },
  })

  console.log(`✅ Usuário AI Bot garantido: ${aiEmail} (id=${aiId})`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })