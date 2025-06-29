
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('🔍 Buscando bilhetes no banco de dados...');

    const bilhetes = await prisma.bilhete.findMany({
      include: {
        pix: {
          select: {
            id: true,
            status: true,
            ambiente: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Encontrados ${bilhetes.length} bilhetes`);

    return res.status(200).json({
      success: true,
      bilhetes: bilhetes
    });

  } catch (error) {
    console.error('❌ Erro ao buscar bilhetes:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar bilhetes',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  } finally {
    await prisma.$disconnect();
  }
}
