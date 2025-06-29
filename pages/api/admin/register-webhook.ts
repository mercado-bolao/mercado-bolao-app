import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('🔗 Registrando webhook com EFÍ...');

    // Configurar EFI
    const efiSandbox = process.env.EFI_SANDBOX || 'false';
    const isSandbox = efiSandbox === 'true';

    const EfiPay = require('sdk-node-apis-efi');

    let efiConfig: any = {
      sandbox: isSandbox,
      client_id: process.env.EFI_CLIENT_ID,
      client_secret: process.env.EFI_CLIENT_SECRET
    };

    const certificatePath = path.resolve('./certs/certificado-efi.p12');
    if (fs.existsSync(certificatePath) && process.env.EFI_CERTIFICATE_PASSPHRASE) {
      efiConfig.certificate = certificatePath;
      efiConfig.passphrase = process.env.EFI_CERTIFICATE_PASSPHRASE;
    }

    const efipay = new EfiPay(efiConfig);
    const pixKey = process.env.EFI_PIX_KEY;

    if (!pixKey) {
      return res.status(400).json({
        success: false,
        error: 'Chave PIX não configurada'
      });
    }

    // URL do webhook (ajuste conforme seu domínio)
    const webhookUrl = isSandbox
      ? `https://${req.headers.host}/api/webhook-pix`
      : `https://${req.headers.host}/api/webhook-pix`;

    console.log('📡 Registrando webhook URL:', webhookUrl);
    console.log('🔑 Chave PIX:', pixKey);

    // Registrar webhook
    const webhookData = {
      webhookUrl: webhookUrl
    };

    const response = await efipay.pixConfigWebhook(
      { chave: pixKey },
      webhookData
    );

    console.log('✅ Webhook registrado com sucesso:', response);

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
