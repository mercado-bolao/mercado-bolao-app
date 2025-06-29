
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { txid } = req.query;

  if (!txid || typeof txid !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'TXID é obrigatório'
    });
  }

  try {
    console.log('🧪 Teste de URL encoding para TXID:', txid);

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

    let efiConfig: any = {
      sandbox: isSandbox,
      client_id: efiClientId,
      client_secret: efiClientSecret
    };

    // Configurar certificado para produção
    if (isSandbox) {
      const certificatePath = path.resolve('./certs/certificado-efi.p12');

      if (fs.existsSync(certificatePath) && process.env.EFI_CERTIFICATE_PASSPHRASE) {
        efiConfig.certificate = certificatePath;
        efiConfig.passphrase = process.env.EFI_CERTIFICATE_PASSPHRASE;
      } else {
        return res.status(400).json({
          success: false,
          error: 'Certificado não configurado para produção'
        });
      }
    }

    const efipay = new EfiPay(efiConfig);

    // 1. Sanitizar TXID
    const txidLimpo = txid.trim().replace(/[^a-zA-Z0-9]/g, '');

    // 2. Aplicar encodeURIComponent
    const cleanTxid = encodeURIComponent(txidLimpo);

    // 3. Log detalhado
    console.log('🔍 Análise do TXID:', {
      original: txid,
      limpo: txidLimpo,
      encoded: cleanTxid,
      comprimento: txidLimpo.length,
      igual: txidLimpo === cleanTxid,
      hexOriginal: Buffer.from(txid).toString('hex'),
      hexLimpo: Buffer.from(txidLimpo).toString('hex'),
      hexEncoded: Buffer.from(cleanTxid).toString('hex')
    });

    // 4. Testar se o padrão está correto
    const txidPattern = /^[a-zA-Z0-9]{26,35}$/;
    if (!txidPattern.test(txidLimpo)) {
      return res.status(400).json({
        success: false,
        error: `TXID inválido após limpeza. Deve ter 26-35 caracteres alfanuméricos.`,
        debug: {
          txidOriginal: txid,
          txidLimpo: txidLimpo,
          txidEncoded: cleanTxid,
          comprimento: txidLimpo.length
        }
      });
    }

    // 5. Log da URL que será chamada
    console.log('🔗 URL final da EFÍ (teórica):', `v2/pix/${cleanTxid}`);
    console.log('🌍 Ambiente:', isSandbox ? 'SANDBOX' : 'PRODUÇÃO');

    // 6. Fazer a consulta PIX
    console.log('📡 Consultando PIX na EFÍ com URL encoding...');
    const pixResponse = await efipay.pixDetailCharge([], { txid: txidLimpo });

    console.log('📋 Resposta da EFÍ:', JSON.stringify(pixResponse, null, 2));

    return res.status(200).json({
      success: true,
      message: '✅ Consulta com URL encoding funcionou!',
      txidProcessing: {
        original: txid,
        limpo: txidLimpo,
        encoded: cleanTxid,
        comprimento: txidLimpo.length
      },
      pixStatus: pixResponse.status,
      pixData: pixResponse,
      ambiente: isSandbox ? 'SANDBOX' : 'PRODUÇÃO'
    });

  } catch (error) {
    console.error('❌ Erro ao testar URL encoding:', error);

    let mensagemErro = 'Erro ao consultar EFÍ Pay com URL encoding';
    let detalhesErro = null;

    if (error && typeof error === 'object' && 'error_description' in error) {
      mensagemErro = error.error_description as string;
      detalhesErro = error;
    } else if (error instanceof Error) {
      mensagemErro = error.message;
      detalhesErro = error.stack;
    }

    return res.status(500).json({
      success: false,
      error: mensagemErro,
      details: detalhesErro,
      txidTentado: txid
    });
  }
}
