
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { txid, whatsapp } = req.query;

  if (!txid && !whatsapp) {
    return res.status(400).json({ 
      error: 'TXID ou WhatsApp é obrigatório',
      details: 'Forneça pelo menos um dos parâmetros: txid ou whatsapp'
    });
  }

  try {
    console.log('🔍 Consultando PIX:', { txid, whatsapp });

    // Buscar PIX no banco
    const whereClause: any = {};
    
    if (txid) {
      whereClause.txid = txid as string;
    } else if (whatsapp) {
      whereClause.whatsapp = whatsapp as string;
      // Buscar o PIX mais recente se for por whatsapp
    }

    const pixData = await prisma.pixPagamento.findFirst({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        palpites: {
          include: {
            jogo: true
          }
        }
      }
    });

    if (!pixData) {
      return res.status(404).json({
        error: 'PIX não encontrado',
        details: 'Não foi encontrado nenhum PIX com os dados fornecidos'
      });
    }

    // Verificar se expirou
    const agora = new Date();
    const expirado = agora > pixData.expiracao;

    if (expirado && pixData.status === 'ATIVA') {
      // Atualizar status no banco
      await prisma.pixPagamento.update({
        where: { id: pixData.id },
        data: { status: 'EXPIRADA' }
      });
      pixData.status = 'EXPIRADA';
    }

    return res.status(200).json({
      success: true,
      pix: {
        id: pixData.id,
        txid: pixData.txid,
        valor: pixData.valor,
        status: pixData.status,
        ambiente: pixData.ambiente,
        expiracao: pixData.expiracao.toISOString(),
        expirado: expirado,
        totalPalpites: pixData.palpites.length,
        createdAt: pixData.createdAt.toISOString(),
        qrcode: pixData.pixCopiaECola,
        imagemQrcode: pixData.imagemQrcode
      }
    });

  } catch (error) {
    console.error('❌ Erro ao consultar PIX:', error);
    return res.status(500).json({
      error: 'Erro ao consultar PIX',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
