
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
    console.log('🧪 Teste específico do TXID:', txid);

    // Análise detalhada do TXID
    const analysis = {
      original: txid,
      length: txid.length,
      chars: txid.split(''),
      charCodes: txid.split('').map(c => c.charCodeAt(0)),
      hexDump: Buffer.from(txid).toString('hex'),
      isAlphanumeric: /^[a-zA-Z0-9]+$/.test(txid),
      hasSpecialChars: /[^a-zA-Z0-9]/.test(txid),
      matchesPattern: /^[a-zA-Z0-9]{26,35}$/.test(txid)
    };

    console.log('🔍 Análise completa do TXID:');
    console.log(JSON.stringify(analysis, null, 2));

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
    if (!isSandbox) {
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

    console.log('🚀 Tentando consultar na EFÍ com TXID exato:', txid);

    // Teste 1: TXID exato como recebido
    try {
      const pixResponse1 = await efipay.pixDetailCharge([], { txid: txid });
      
      return res.status(200).json({
        success: true,
        message: 'TXID aceito pela EFÍ!',
        analysis: analysis,
        response: pixResponse1
      });

    } catch (error1) {
      console.log('❌ Erro com TXID original:', error1);

      // Teste 2: TXID sanitizado
      const txidLimpo = txid.trim().replace(/[^a-zA-Z0-9]/g, '');
      
      if (txidLimpo !== txid) {
        console.log('🔄 Tentando com TXID sanitizado:', txidLimpo);
        
        try {
          const pixResponse2 = await efipay.pixDetailCharge([], { txid: txidLimpo });
          
          return res.status(200).json({
            success: true,
            message: 'TXID aceito após sanitização!',
            analysis: analysis,
            txidSanitizado: txidLimpo,
            response: pixResponse2
          });

        } catch (error2) {
          console.log('❌ Erro com TXID sanitizado:', error2);
        }
      }

      // Retornar detalhes do erro
      return res.status(400).json({
        success: false,
        error: 'TXID rejeitado pela EFÍ',
        analysis: analysis,
        erroOriginal: error1,
        erroSanitizado: txidLimpo !== txid ? 'Também falhou' : 'Não aplicável'
      });
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Erro no teste',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
