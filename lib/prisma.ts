
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

console.log('🔧 Inicializando Prisma...');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- Prisma global existe:', !!globalForPrisma.prisma);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

console.log('✅ Prisma inicializado:', !!prisma);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  console.log('✅ Prisma salvo na variável global');
}

// Testar conexão na inicialização
prisma.$connect()
  .then(() => console.log('✅ Prisma conectado com sucesso'))
  .catch((error) => console.error('❌ Erro ao conectar Prisma:', error));
