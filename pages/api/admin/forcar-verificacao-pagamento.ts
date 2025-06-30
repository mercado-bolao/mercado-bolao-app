
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }


  try {
    const { txid, bilheteId } = req.body;

    if (!txid && !bilheteId) {
      return res.status(400).json({ error: 'TXID ou bilheteId é obrigatório' });
    }

    console.log('🔍 Verificação manual iniciada:', { txid, bilheteId });

    // Buscar bilhete
    let bilhete;
    if (bilheteId) {
      bilhete = await prisma.bilhete.findUnique({
        where: { id: bilheteId },
        include: { palpites: true }
      });
    } else {
      bilhete = await prisma.bilhete.findFirst({
        where: { txid: txid },
        include: { palpites: true }
      });
    }

    if (!bilhete) {
      return res.status(404).json({ error: 'Bilhete não encontrado' });
    }

    console.log('📋 Bilhete encontrado:', {
      id: bilhete.id,
      status: bilhete.status,
      txid: bilhete.txid,
      palpites: bilhete.palpites.length
    });

    // Se já está pago, não fazer nada
    if (bilhete.status === 'PAGO') {
      return res.status(200).json({
        success: true,
        message: 'Bilhete já está marcado como pago',
        bilhete: {
          id: bilhete.id,
          status: bilhete.status,
          valorTotal: bilhete.valorTotal
        }
      });
    }

    // FORÇAR ATUALIZAÇÃO PARA PAGO
    console.log('✅ Forçando atualização para PAGO...');

    // 1. Atualizar bilhete
    await prisma.bilhete.update({
      where: { id: bilhete.id },
      data: {
        status: 'PAGO',
        updatedAt: new Date()
      }
    });

    // 2. Atualizar palpites
    const palpitesAtualizados = await prisma.palpite.updateMany({
      where: { bilheteId: bilhete.id },
      data: { status: 'pago' }
    });

    // 3. Atualizar PIX se existir
    if (bilhete.txid) {
      await prisma.pixPagamento.updateMany({
        where: { txid: bilhete.txid },
        data: {
          status: 'PAGA',
          updatedAt: new Date()
        }
      });
    }

    console.log('🎉 Pagamento forçado com sucesso!');

    return res.status(200).json({
      success: true,
      message: 'Pagamento confirmado manualmente com sucesso',
      bilhete: {
        id: bilhete.id,
        status: 'PAGO',
        valorTotal: bilhete.valorTotal,
        txid: bilhete.txid
      },
      palpitesAtualizados: palpitesAtualizados.count
    });

  } catch (error) {
    console.error('❌ Erro na verificação manual:', error);
    return res.status(500).json({
      error: 'Erro na verificação manual',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  } finally {
    await prisma.$disconnect();
  }
}
