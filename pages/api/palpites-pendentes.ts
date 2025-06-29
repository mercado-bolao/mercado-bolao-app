
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { whatsapp } = req.query;

  if (!whatsapp || typeof whatsapp !== 'string') {
    return res.status(400).json({ error: 'WhatsApp é obrigatório' });
  }

  try {
    console.log('🔍 Buscando palpites pendentes para:', whatsapp);

    // Buscar palpites pendentes do usuário
    const palpites = await prisma.palpite.findMany({
      where: {
        whatsapp: whatsapp,
        status: 'pendente'
      },
      include: {
        jogo: {
          select: {
            id: true,
            mandante: true,
            visitante: true,
            horario: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('📊 Palpites encontrados:', palpites.length);

    if (palpites.length === 0) {
      return res.status(200).json({
        palpites: [],
        totalPalpites: 0,
        valorTotal: 0,
        usuario: { nome: '', whatsapp: whatsapp }
      });
    }

    // Calcular totais
    const totalPalpites = palpites.length;
    const valorTotal = palpites.reduce((total, palpite) => total + palpite.valor, 0);

    // Pegar informações do usuário do primeiro palpite
    const usuario = {
      nome: palpites[0].nome,
      whatsapp: palpites[0].whatsapp
    };

    console.log('💰 Valor total calculado:', valorTotal);

    return res.status(200).json({
      palpites,
      totalPalpites,
      valorTotal,
      usuario
    });

  } catch (error) {
    console.error('❌ Erro ao buscar palpites pendentes:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
