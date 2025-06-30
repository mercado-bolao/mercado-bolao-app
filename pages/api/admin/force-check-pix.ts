import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { bilheteId, senhaAdmin } = req.body;

    // Verificar senha admin
    if (senhaAdmin !== 'admin123') {
      return res.status(401).json({ error: 'Senha administrativa incorreta' });
    }

    if (!bilheteId) {
      return res.status(400).json({ error: 'bilheteId é obrigatório' });
    }

    console.log(`🔧 Forçando verificação do bilhete: ${bilheteId}`);

    // Buscar bilhete
    const bilhete = await prisma.bilhete.findUnique({
      where: { id: bilheteId },
      include: {
        pix: true
      }
    });

    if (!bilhete) {
      return res.status(404).json({ error: 'Bilhete não encontrado' });
    }

    // Se já está pago, não fazer nada
    if (bilhete.status === 'PAGO') {
      return res.status(200).json({
        success: true,
        message: 'Bilhete já está marcado como PAGO',
        status: 'PAGO'
      });
    }

    console.log(`📋 Bilhete encontrado: ${bilhete.id}, TXID: ${bilhete.txid}`);

    // Tentar verificar via EFÍ usando locationId se disponível
    if (bilhete.pix?.locationId) {
      try {
        console.log(`🔍 Tentando verificar via locationId: ${bilhete.pix.locationId}`);

        // Configurar EFI
        const efiSandbox = process.env.EFI_SANDBOX || 'false';
        const isSandbox = efiSandbox === 'true';
        const EfiPay = require('sdk-node-apis-efi');

        // Usar a função auxiliar para obter a configuração
        const { getEfiConfig } = await import('../../../lib/certificate-utils');
        const efiConfig = getEfiConfig(isSandbox);

        const efipay = new EfiPay(efiConfig);

        // Consultar usando locationId
        const pixResponse = await efipay.pixDetailLocation([], { id: bilhete.pix.locationId });

        console.log(`📋 Status EFÍ (via locationId): ${pixResponse.status}`);

        // Se foi pago na EFI, atualizar no banco
        if (pixResponse.status === 'CONCLUIDA') {
          console.log(`✅ PIX confirmado como pago via locationId: ${bilhete.pix.locationId}`);

          // Atualizar bilhete
          await prisma.bilhete.update({
            where: { id: bilhete.id },
            data: { status: 'PAGO' }
          });

          // Atualizar PIX
          await prisma.pixPagamento.update({
            where: { id: bilhete.pix.id },
            data: { status: 'PAGA' }
          });

          // Atualizar palpites
          await prisma.palpite.updateMany({
            where: {
              bilheteId: bilhete.id
            },
            data: { status: 'pago' }
          });

          return res.status(200).json({
            success: true,
            message: 'PIX confirmado como pago via locationId!',
            metodo: 'locationId',
            bilhete: {
              id: bilhete.id,
              status: 'PAGO',
              valorTotal: bilhete.valorTotal,
              txid: bilhete.txid
            }
          });
        }

      } catch (locationError) {
        console.error('❌ Erro ao consultar via locationId:', locationError);
      }
    }

    // Se chegou aqui, marcar manualmente como pago
    console.log(`🔧 Marcando bilhete como PAGO manualmente: ${bilhete.id}`);

    // Atualizar bilhete
    await prisma.bilhete.update({
      where: { id: bilhete.id },
      data: { status: 'PAGO' }
    });

    // Atualizar PIX se existir
    if (bilhete.pix) {
      await prisma.pixPagamento.update({
        where: { id: bilhete.pix.id },
        data: { status: 'PAGA' }
      });
    }

    // Atualizar palpites
    await prisma.palpite.updateMany({
      where: {
        bilheteId: bilhete.id
      },
      data: { status: 'pago' }
    });

    return res.status(200).json({
      success: true,
      message: 'Bilhete marcado como PAGO manualmente (verificação forçada)',
      metodo: 'manual_force',
      bilhete: {
        id: bilhete.id,
        status: 'PAGO',
        valorTotal: bilhete.valorTotal,
        txid: bilhete.txid
      }
    });

  } catch (error) {
    console.error('❌ Erro na verificação forçada:', error);
    return res.status(500).json({
      error: 'Erro na verificação forçada',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  } finally {
    await prisma.$disconnect();
  }
}
