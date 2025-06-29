
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const checks = {
    database: false,
    efi: false,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  };

  // Verificar conexão com banco
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    console.error('Database check failed:', error);
  }

  // Verificar configuração EFI
  try {
    const hasEfiConfig = !!(
      process.env.EFI_CLIENT_ID &&
      process.env.EFI_CLIENT_SECRET &&
      process.env.EFI_PIX_KEY
    );
    checks.efi = hasEfiConfig;
  } catch (error) {
    console.error('EFI check failed:', error);
  }

  const allHealthy = checks.database && checks.efi;

  res.status(allHealthy ? 200 : 500).json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    checks
  });
}
