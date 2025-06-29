import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { bilheteId, txid } = req.query;

  if (!bilheteId && !txid) {
    return res.status(400).json({ 
      error: 'bilheteId ou txid é obrigatório',
      details: 'Forneça pelo menos um dos parâmetros: bilheteId ou txid'
    });
  }

  try {
    console.log('🔍 Consultando bilhete:', { bilheteId, txid });

    // Buscar bilhete no banco
    const whereClause: any = {};

    if (bilheteId) {
      whereClause.id = bilheteId as string;
    } else if (txid) {
      whereClause.txid = txid as string;
    }

    const bilhete = await prisma.bilhete.findFirst({
      where: whereClause,
      include: {
        palpites: {
          include: {
            jogo: true
          }
        }
      }
    });

    if (!bilhete) {
      return res.status(404).json({
        error: 'Bilhete não encontrado',
        details: 'Não foi encontrado nenhum bilhete com os dados fornecidos'
      });
    }

    // Verificar se expirou
    const agora = new Date();
    const expirado = bilhete.expiresAt && agora > bilhete.expiresAt;

    if (expirado && bilhete.status === 'PENDENTE') {
      // Atualizar status no banco
      await prisma.bilhete.update({
        where: { id: bilhete.id },
        data: { status: 'EXPIRADO' }
      });
      bilhete.status = 'EXPIRADO';
    }

    return res.status(200).json({
      success: true,
      bilhete: {
        id: bilhete.id,
        txid: bilhete.txid,
        whatsapp: bilhete.whatsapp,
        valor: bilhete.valor,
        status: bilhete.status,
        expiresAt: bilhete.expiresAt?.toISOString(),
        expirado: expirado,
        totalPalpites: bilhete.palpites.length,
        createdAt: bilhete.createdAt.toISOString(),
        palpites: bilhete.palpites.map(p => ({
          id: p.id,
          resultado: p.resultado,
          jogo: {
            mandante: p.jogo.mandante,
            visitante: p.jogo.visitante
          }
        }))
      }
    });

  } catch (error) {
    console.error('❌ Erro ao consultar bilhete:', error);
    return res.status(500).json({
      error: 'Erro ao consultar bilhete',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}