
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { bilheteId } = req.body;

  if (!bilheteId) {
    return res.status(400).json({
      success: false,
      error: 'bilheteId é obrigatório'
    });
  }

  try {
    console.log('🔧 Marcando bilhete como PAGO manualmente:', bilheteId);

    // Buscar bilhete
    const bilhete = await prisma.bilhete.findUnique({
      where: { id: bilheteId },
      include: { palpites: true, pix: true }
    });

    if (!bilhete) {
      return res.status(404).json({
        success: false,
        error: 'Bilhete não encontrado'
      });
    }

    if (bilhete.status === 'PAGO') {
      return res.status(400).json({
        success: false,
        error: 'Bilhete já está marcado como PAGO'
      });
    }

    // Atualizar bilhete para PAGO
    await prisma.bilhete.update({
      where: { id: bilheteId },
      data: {
        status: 'PAGO',
        updatedAt: new Date()
      }
    });

    // Atualizar palpites para pago
    await prisma.palpite.updateMany({
      where: { bilheteId: bilheteId },
      data: { status: 'pago' }
    });

    // Atualizar PIX se existir
    if (bilhete.pix) {
      await prisma.pixPagamento.update({
        where: { id: bilhete.pix.id },
        data: { status: 'PAGA' }
      });
    }

    console.log('✅ Bilhete marcado como PAGO manualmente com sucesso');

    return res.status(200).json({
      success: true,
      message: 'Bilhete marcado como PAGO com sucesso',
      bilheteId: bilheteId,
      quantidadePalpites: bilhete.quantidadePalpites
    });

  } catch (error) {
    console.error('❌ Erro ao marcar bilhete como pago:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao processar operação',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  } finally {
    await prisma.$disconnect();
  }
}
