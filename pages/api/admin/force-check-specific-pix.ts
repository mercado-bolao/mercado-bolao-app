import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { txid, bilheteId, whatsapp } = req.body;

    console.log('🔍 Forçando verificação para:', { txid, bilheteId, whatsapp });

    // Buscar bilhete por diferentes critérios
    let bilhete;

    if (bilheteId) {
      bilhete = await prisma.bilhete.findUnique({
        where: { id: bilheteId }
      });
    } else if (txid) {
      bilhete = await prisma.bilhete.findFirst({
        where: { txid: txid }
      });
    } else if (whatsapp) {
      // Buscar bilhetes pendentes do WhatsApp
      const bilhetes = await prisma.bilhete.findMany({
        where: {
          whatsapp: whatsapp,
          status: 'PENDENTE'
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (bilhetes.length > 0) {
        bilhete = bilhetes[0]; // Pegar o mais recente
      }
    }

    if (!bilhete) {
      return res.status(404).json({ error: 'Bilhete não encontrado' });
    }

    if (!bilhete.txid) {
      return res.status(400).json({ error: 'Bilhete não possui TXID' });
    }

    console.log('📋 Bilhete encontrado:', {
      id: bilhete.id,
      txid: bilhete.txid,
      status: bilhete.status,
      valor: bilhete.valorTotal,
      whatsapp: bilhete.whatsapp,
      createdAt: bilhete.createdAt
    });

    // Verificar na EFI
    const efiSandbox = process.env.EFI_SANDBOX || 'false';
    const isSandbox = efiSandbox === 'true';
    const EfiPay = require('sdk-node-apis-efi');

    // Usar a função auxiliar para obter a configuração
    const { getEfiConfig } = await import('../../../lib/certificate-utils');
    const efiConfig = getEfiConfig(isSandbox);

    const efipay = new EfiPay(efiConfig);

    try {
      // Verificar PIX na EFI usando método correto
      const params = { txid: bilhete.txid };
      const pixResponse = await efipay.pixDetailCharge(params);

      console.log('📋 Resposta da EFI:', JSON.stringify(pixResponse, null, 2));

      const statusEfi = pixResponse.status;
      const foiPago = statusEfi === 'CONCLUIDA';

      console.log('💰 Status na EFI:', statusEfi);
      console.log('✅ Foi pago:', foiPago);

      if (foiPago && bilhete.status === 'PENDENTE') {
        console.log('🔄 Atualizando bilhete para PAGO...');

        // Atualizar bilhete
        await prisma.bilhete.update({
          where: { id: bilhete.id },
          data: { status: 'PAGO' }
        });

        // Atualizar palpites
        const palpitesAtualizados = await prisma.palpite.updateMany({
          where: { bilheteId: bilhete.id },
          data: { status: 'pago' }
        });

        console.log('✅ Pagamento confirmado!');
        console.log('📊 Palpites atualizados:', palpitesAtualizados.count);

        return res.status(200).json({
          success: true,
          message: 'Pagamento confirmado e atualizado!',
          bilhete: {
            id: bilhete.id,
            txid: bilhete.txid,
            statusAnterior: 'PENDENTE',
            statusAtual: 'PAGO',
            valor: bilhete.valorTotal,
            whatsapp: bilhete.whatsapp,
            createdAt: bilhete.createdAt
          },
          efi: {
            status: statusEfi,
            ambiente: isSandbox ? 'sandbox' : 'producao'
          },
          palpitesAtualizados: palpitesAtualizados.count
        });
      } else {
        return res.status(200).json({
          success: false,
          message: foiPago ? 'Bilhete já estava marcado como pago' : 'PIX ainda não foi pago na EFI',
          bilhete: {
            id: bilhete.id,
            txid: bilhete.txid,
            status: bilhete.status,
            valor: bilhete.valorTotal,
            whatsapp: bilhete.whatsapp,
            createdAt: bilhete.createdAt
          },
          efi: {
            status: statusEfi,
            ambiente: isSandbox ? 'sandbox' : 'producao'
          }
        });
      }

    } catch (efiError) {
      console.error('❌ Erro na EFI:', efiError);

      return res.status(500).json({
        success: false,
        error: 'Erro ao consultar EFI',
        details: efiError instanceof Error ? efiError.message : 'Erro desconhecido',
        bilhete: {
          id: bilhete.id,
          txid: bilhete.txid,
          status: bilhete.status
        }
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  } finally {
    await prisma.$disconnect();
  }
}