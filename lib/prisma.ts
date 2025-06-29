
import { PrismaClient } from '@prisma/client'

declare global {
  var __prisma: PrismaClient | undefined
}

// Log de inicialização
console.log('🔧 Inicializando Prisma Client...')

// Criar instância única do Prisma com configuração robusta
export const prisma = globalThis.__prisma ?? new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  errorFormat: 'pretty',
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

// Em desenvolvimento, manter a instância na variável global para evitar múltiplas conexões
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

// Log de sucesso
console.log('✅ Prisma Client inicializado com sucesso')

// Verificar conexão ao inicializar
prisma.$connect()
  .then(() => {
    console.log('✅ Prisma conectado ao banco de dados')
  })
  .catch((error) => {
    console.error('❌ Erro ao conectar Prisma:', error)
  })

// Função para conectar explicitamente se necessário
export async function connectPrisma() {
  try {
    await prisma.$connect()
    console.log('✅ Prisma conectado com sucesso')
  } catch (error) {
    console.error('❌ Erro ao conectar Prisma:', error)
    throw error
  }
}

// Função para desconectar
export async function disconnectPrisma() {
  try {
    await prisma.$disconnect()
    console.log('✅ Prisma desconectado com sucesso')
  } catch (error) {
    console.error('❌ Erro ao desconectar Prisma:', error)
  }
}

// Interceptar eventos de fechamento do processo
process.on('beforeExit', () => {
  prisma.$disconnect()
})
