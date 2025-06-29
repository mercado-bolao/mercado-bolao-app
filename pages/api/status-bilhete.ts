
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { id, txid } = req.query;

    if (!id && !txid) {
      return res.status(400).json({ error: 'ID ou TXID do bilhete é obrigatório' });
    }

    let bilhete;

    if (id) {
      bilhete = await prisma.bilhete.findUnique({
        where: { id: id as string },
        include: {
          palpites: true,
          pix: true
        }
      });
    } else if (txid) {
      bilhete = await prisma.bilhete.findFirst({
        where: { txid: txid as string },
        include: {
          palpites: true,
          pix: true
        }
      });
    }

    if (!bilhete) {
      return res.status(404).json({ error: 'Bilhete não encontrado' });
    }

    // Verificar se o PIX expirou
    const agora = new Date();
    const expirou = bilhete.pix && new Date(bilhete.pix.expiracao) < agora;

    let status = bilhete.status;
    
    // Se expirou e ainda está pendente, marcar como cancelado
    if (expirou && status === 'PENDENTE') {
      status = 'CANCELADO';
      
      // Atualizar no banco
      await prisma.bilhete.update({
        where: { id: bilhete.id },
        data: { status: 'CANCELADO', updatedAt: new Date() }
      });

      if (bilhete.pix) {
        await prisma.pixPagamento.update({
          where: { id: bilhete.pix.id },
          data: { status: 'EXPIRADA' }
        });
      }
    }

    return res.status(200).json({
      success: true,
      bilhete: {
        id: bilhete.id,
        status: status,
        valor: bilhete.valor,
        quantidadePalpites: bilhete.quantidadePalpites,
        whatsapp: bilhete.whatsapp,
        txid: bilhete.txid,
        expirado: expirou,
        expiracao: bilhete.pix?.expiracao,
        createdAt: bilhete.createdAt,
        updatedAt: bilhete.updatedAt
      }
    });

  } catch (error) {
    console.error('Erro ao verificar status do bilhete:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    await prisma.$disconnect();
  }
}
