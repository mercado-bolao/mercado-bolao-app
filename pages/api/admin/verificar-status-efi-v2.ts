import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { bilheteId } = req.query;

  if (!bilheteId || typeof bilheteId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'ID do bilhete é obrigatório'
    });
  }

  try {
    console.log('🔍 Verificando status do bilhete na EFÍ:', bilheteId);

    // Buscar bilhete com PIX associado
    const bilhete = await prisma.bilhete.findUnique({
      where: { id: bilheteId },
      include: { pix: true }
    });

    if (!bilhete || !bilhete.pix) {
      return res.status(404).json({
        success: false,
        error: 'Bilhete ou PIX não encontrado'
      });
    }

    // Configurar EFÍ Pay
    const efiSandbox = process.env.EFI_SANDBOX || 'false';
    const efiClientId = process.env.EFI_CLIENT_ID;
    const efiClientSecret = process.env.EFI_CLIENT_SECRET;

    if (!efiClientId || !efiClientSecret) {
      return res.status(400).json({
        success: false,
        error: 'Credenciais EFI não configuradas'
      });
    }

    const isSandbox = efiSandbox === 'true';
    const EfiPay = require('sdk-node-apis-efi');

    // Usar a função auxiliar para obter a configuração
    const { getEfiConfig } = await import('../../../lib/certificate-utils');
    const efiConfig = getEfiConfig(isSandbox);

    const efipay = new EfiPay(efiConfig);

    // Usar locationId para buscar o PIX
    console.log('📡 Consultando PIX na EFÍ Pay usando locationId:', bilhete.pix.locationId);

    const pixResponse = await efipay.pixDetailLocation([], { id: bilhete.pix.locationId });

    console.log('📋 Resposta da EFÍ:', JSON.stringify(pixResponse, null, 2));

    const statusEfi = pixResponse.status;
    let statusLocal = 'ATIVA';
    let mensagem = '';

    // Mapear status da EFÍ para status local
    switch (statusEfi) {
      case 'ATIVA':
        statusLocal = 'ATIVA';
        mensagem = 'PIX está ativo, aguardando pagamento';
        break;
      case 'CONCLUIDA':
        statusLocal = 'PAGA';
        mensagem = 'PIX foi pago com sucesso';
        break;
      case 'REMOVIDA_PELO_USUARIO_RECEBEDOR':
        statusLocal = 'CANCELADA';
        mensagem = 'PIX foi cancelado pelo recebedor';
        break;
      case 'REMOVIDA_PELO_PSP':
        statusLocal = 'CANCELADA';
        mensagem = 'PIX foi cancelado pelo PSP';
        break;
      default:
        statusLocal = statusEfi;
        mensagem = `Status retornado pela EFÍ: ${statusEfi}`;
    }

    // Atualizar status no banco se necessário
    if (statusEfi === 'CONCLUIDA' && bilhete.status !== 'PAGO') {
      console.log('✅ PIX confirmado como pago, atualizando banco...');

      // Atualizar bilhete
      await prisma.bilhete.update({
        where: { id: bilhete.id },
        data: { status: 'PAGO', updatedAt: new Date() }
      });

      // Atualizar palpites
      await prisma.palpite.updateMany({
        where: { bilheteId: bilhete.id },
        data: { status: 'pago' }
      });

      // Atualizar PIX
      await prisma.pixPagamento.update({
        where: { id: bilhete.pix.id },
        data: { status: 'PAGA' }
      });

      mensagem += '\n\nBilhete e palpites foram atualizados para PAGO no sistema.';
    }

    return res.status(200).json({
      success: true,
      status: statusLocal,
      statusEfi: statusEfi,
      message: mensagem,
      bilheteId: bilhete.id,
      dadosCompletos: pixResponse
    });

  } catch (error) {
    console.error('❌ Erro ao verificar status na EFÍ:', error);

    let mensagemErro = 'Erro ao consultar EFÍ Pay';

    if (error && typeof error === 'object' && 'error_description' in error) {
      mensagemErro = error.error_description as string;
    } else if (error instanceof Error) {
      mensagemErro = error.message;
    }

    return res.status(500).json({
      success: false,
      error: mensagemErro,
      details: error instanceof Error ? error.stack : String(error)
    });
  } finally {
    await prisma.$disconnect();
  }
}
