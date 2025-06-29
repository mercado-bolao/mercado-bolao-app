
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { bilheteId, txid } = req.query;

  if (!bilheteId && !txid) {
    return res.status(400).json({ 
      error: 'bilheteId ou txid é obrigatório' 
    });
  }

  const prisma = new PrismaClient();

  try {
    let bilhete;

    if (bilheteId) {
      bilhete = await prisma.bilhete.findUnique({
        where: { id: bilheteId as string },
        include: {
          palpites: {
            include: {
              jogo: true,
              concurso: true
            }
          }
        }
      });
    } else if (txid) {
      bilhete = await prisma.bilhete.findFirst({
        where: { txid: txid as string },
        include: {
          palpites: {
            include: {
              jogo: true,
              concurso: true
            }
          }
        }
      });
    }

    if (!bilhete) {
      return res.status(404).json({ 
        error: 'Bilhete não encontrado' 
      });
    }

    // Verificar se expirou e ainda está pendente
    const agora = new Date();
    const expirou = agora > bilhete.expiresAt;

    let statusAtual = bilhete.status;

    if (expirou && statusAtual === 'PENDENTE') {
      // Atualizar para cancelado se expirou
      await prisma.bilhete.update({
        where: { id: bilhete.id },
        data: { status: 'CANCELADO' }
      });

      // Reverter palpites
      await prisma.palpite.updateMany({
        where: {
          id: { in: bilhete.palpites.map(p => p.id) }
        },
        data: { status: 'pendente' }
      });

      statusAtual = 'CANCELADO';
    }

    const tempoRestante = expirou ? 0 : Math.max(0, bilhete.expiresAt.getTime() - agora.getTime());

    return res.status(200).json({
      success: true,
      bilhete: {
        id: bilhete.id,
        status: statusAtual,
        valor: bilhete.valor,
        whatsapp: bilhete.whatsapp,
        txid: bilhete.txid,
        orderId: bilhete.orderId,
        expiresAt: bilhete.expiresAt.toISOString(),
        createdAt: bilhete.createdAt.toISOString(),
        tempoRestanteMs: tempoRestante,
        expirou: expirou,
        palpites: bilhete.palpites.map(p => ({
          id: p.id,
          resultado: p.resultado,
          jogo: `${p.jogo.mandante} x ${p.jogo.visitante}`,
          concurso: p.concurso.nome || `Concurso ${p.concurso.numero}`
        }))
      }
    });

  } catch (error) {
    console.error('❌ Erro ao consultar bilhete:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  } finally {
    await prisma.$disconnect();
  }
}
