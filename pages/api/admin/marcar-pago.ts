
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { bilheteId, senhaAdmin } = req.body;

  if (!bilheteId || !senhaAdmin) {
    return res.status(400).json({
      success: false,
      error: 'bilheteId e senhaAdmin são obrigatórios'
    });
  }

  // Verificar senha do admin (você pode definir uma senha específica)
  const SENHA_ADMIN = process.env.ADMIN_PASSWORD || 'admin123'; // Configure nos Secrets
  
  if (senhaAdmin !== SENHA_ADMIN) {
    return res.status(401).json({
      success: false,
      error: 'Senha de administrador incorreta'
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

    // Log da operação manual
    await prisma.webhookLog.create({
      data: {
        tipo: 'manual_payment',
        txid: bilhete.txid,
        payload: JSON.stringify({
          bilheteId: bilheteId,
          adminAction: 'MARCADO_COMO_PAGO_MANUALMENTE',
          timestamp: new Date().toISOString()
        }),
        status: 'SUCCESS',
        processedAt: new Date()
      }
    });

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
