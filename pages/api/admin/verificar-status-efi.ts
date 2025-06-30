import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Configurar headers para evitar cache
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method !== 'GET') {
    console.log('❌ Método inválido:', req.method);
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { txid } = req.query;

  if (!txid || typeof txid !== 'string') {
    console.log('❌ TXID não fornecido ou inválido');
    return res.status(400).json({
      success: false,
      error: 'TXID é obrigatório'
    });
  }

  // Limpar TXID
  const txidLimpo = txid.trim().replace(/[^a-zA-Z0-9]/g, '');

  // Validar formato do TXID
  const txidPattern = /^[a-zA-Z0-9]{26,35}$/;
  if (!txidPattern.test(txidLimpo)) {
    console.log('❌ TXID com formato inválido:', txidLimpo);
    return res.status(400).json({
      success: false,
      error: 'TXID com formato inválido',
      details: {
        txidOriginal: txid,
        txidLimpo: txidLimpo,
        tamanho: txidLimpo.length
      }
    });
  }

  // Buscar bilhete
  const bilhete = await prisma.bilhete.findFirst({
    where: { txid: txidLimpo },
    include: {
      palpites: true,
      pix: true
    }
  });

  try {
    console.log('🔍 Verificando status do PIX na EFI:', txidLimpo);

    // Configurar EFI Pay
    const efiSandbox = process.env.EFI_SANDBOX || 'false';
    const isSandbox = efiSandbox === 'true';
    const EfiPay = require('sdk-node-apis-efi');

    // Usar a função auxiliar para obter a configuração
    const { getEfiConfig } = await import('../../../lib/certificate-utils');
    const efiConfig = getEfiConfig(isSandbox);

    const efipay = new EfiPay(efiConfig);

    // Consultar PIX na EFI
    console.log('🔗 Consultando PIX na EFI...');
    const params = { txid: txidLimpo };
    const pixResponse = await efipay.pixDetailCharge(params);

    console.log('📋 Resposta da EFI:', JSON.stringify(pixResponse, null, 2));

    const statusEfi = pixResponse.status;
    let statusLocal = 'ATIVA';
    let mensagem = '';

    // Mapear status da EFI para status local
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
        mensagem = `Status retornado pela EFI: ${statusEfi}`;
    }

    // Se o PIX foi pago, atualizar no banco
    if (statusEfi === 'CONCLUIDA' && bilhete && bilhete.status !== 'PAGO') {
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

      // Atualizar PIX se existir
      if (bilhete.pix) {
        await prisma.pixPagamento.update({
          where: { id: bilhete.pix.id },
          data: { status: 'PAGA', updatedAt: new Date() }
        });
      }

      mensagem += '\n\nBilhete e palpites foram atualizados para PAGO no sistema.';
    }

    return res.status(200).json({
      success: true,
      status: statusLocal,
      statusEfi: statusEfi,
      message: mensagem,
      bilheteId: bilhete?.id,
      dadosCompletos: {
        ...pixResponse,
        bilheteEncontrado: !!bilhete,
        statusBanco: bilhete?.status
      }
    });

  } catch (error) {
    console.error('❌ Erro ao verificar status na EFI:', error);

    let mensagemErro = 'Erro ao consultar EFI Pay';
    let detalhesErro = null;

    if (error && typeof error === 'object') {
      if ('error_description' in error) {
        mensagemErro = error.error_description as string;
      } else if ('nome' in error && error.nome === 'cobranca_nao_encontrada') {
        mensagemErro = 'Cobrança não encontrada na EFI';
        detalhesErro = 'O PIX pode ter expirado ou o TXID pode estar inválido';
      }
    } else if (error instanceof Error) {
      mensagemErro = error.message;
      detalhesErro = error.stack;
    }

    return res.status(500).json({
      success: false,
      error: mensagemErro,
      details: detalhesErro || String(error)
    });
  } finally {
    await prisma.$disconnect();
  }
}