
import { PrismaClient } from '@prisma/client'

declare global {
  var __prisma: PrismaClient | undefined
}

// Criar instância única do Prisma
export const prisma = globalThis.__prisma ?? new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

// Em desenvolvimento, manter a instância na variável global para evitar múltiplas conexões
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

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
