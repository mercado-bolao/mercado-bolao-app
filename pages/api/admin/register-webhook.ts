import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('🔗 Registrando webhook com EFI...');

    // Configurar EFI
    const efiSandbox = process.env.EFI_SANDBOX || 'false';
    const isSandbox = efiSandbox === 'true';
    const EfiPay = require('sdk-node-apis-efi');

    // Usar a função auxiliar para obter a configuração
    const { getEfiConfig } = await import('../../../lib/certificate-utils');
    const efiConfig = getEfiConfig(isSandbox);

    const efipay = new EfiPay(efiConfig);
    const pixKey = process.env.EFI_PIX_KEY;

    if (!pixKey) {
      console.error('❌ Chave PIX não configurada');
      return res.status(400).json({
        success: false,
        error: 'Chave PIX não configurada'
      });
    }

    // URL do webhook (usando o domínio correto)
    const domain = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const webhookUrl = `${protocol}://${domain}/api/webhook-pix`;

    console.log('📡 Registrando webhook URL:', webhookUrl);
    console.log('🔑 Chave PIX:', pixKey);

    // Primeiro, verificar se já existe webhook configurado
    try {
      console.log('🔍 Verificando webhooks existentes...');
      const webhookList = await efipay.pixListWebhook();
      console.log('📋 Webhooks existentes:', JSON.stringify(webhookList, null, 2));

      // Se já existe webhook para esta chave, deletar
      if (webhookList[pixKey]) {
        console.log('🗑️ Removendo webhook existente...');
        await efipay.pixDeleteWebhook({ chave: pixKey });
        console.log('✅ Webhook existente removido');
      }
    } catch (listError) {
      console.warn('⚠️ Erro ao listar webhooks:', listError);
    }

    // Registrar novo webhook
    console.log('📝 Registrando novo webhook...');
    const webhookData = {
      webhookUrl: webhookUrl
    };

    const response = await efipay.pixConfigWebhook(
      { chave: pixKey },
      webhookData
    );

    console.log('✅ Webhook registrado com sucesso:', response);

    // Verificar se o registro foi bem sucedido
    try {
      console.log('🔍 Verificando registro do webhook...');
      const webhookList = await efipay.pixListWebhook();

      if (webhookList[pixKey] === webhookUrl) {
        console.log('✅ Webhook verificado com sucesso');
      } else {
        console.warn('⚠️ Webhook registrado mas URL não confere:', {
          registrado: webhookList[pixKey],
          esperado: webhookUrl
        });
      }
    } catch (verifyError) {
      console.warn('⚠️ Erro ao verificar webhook:', verifyError);
    }

    return res.status(200).json({
      success: true,
      message: 'Webhook registrado com sucesso',
      data: {
        webhookUrl: webhookUrl,
        pixKey: pixKey,
        ambiente: isSandbox ? 'sandbox' : 'producao',
        response: response
      }
    });

  } catch (error) {
    console.error('❌ Erro ao registrar webhook:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao registrar webhook',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
