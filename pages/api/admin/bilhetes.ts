import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('🔍 Buscando bilhetes no banco de dados...');

    const bilhetes = await prisma.bilhete.findMany({
      where: {
        status: { in: ["PENDENTE", "PAGO", "CANCELADO", "EXPIRADO"] }
      },
      select: {
        id: true,
        nome: true,
        whatsapp: true,
        status: true,
        valor: true,
        txid: true,
        createdAt: true,
        updatedAt: true,
        palpites: {
          include: {
            jogo: {
              include: {
                concurso: true
              }
            }
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
  }
}