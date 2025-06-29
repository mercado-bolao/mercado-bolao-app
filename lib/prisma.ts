import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error', 'warn'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Connect to database and handle errors
prisma.$connect()
  .then(() => {
    console.log('[DEBUG] Prisma conectado com sucesso');
  })
  .catch((error) => {
    console.error('[ERROR] Falha ao conectar com Prisma:', error);
  });