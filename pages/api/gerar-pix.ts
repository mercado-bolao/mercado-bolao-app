
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { whatsapp, valorTotal, totalBilhetes } = req.body;

  if (!whatsapp || !valorTotal || !totalBilhetes) {
    return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' });
  }

  try {
    const isSandbox = process.env.EFI_SANDBOX === 'true';
    
    console.log(`🔄 Gerando PIX ${isSandbox ? 'SANDBOX' : 'PRODUÇÃO'} para:`, { whatsapp, valorTotal, totalBilhetes });
    console.log('📋 Variáveis de ambiente:');
    console.log('- EFI_SANDBOX:', process.env.EFI_SANDBOX);
    console.log('- EFI_CLIENT_ID:', process.env.EFI_CLIENT_ID ? '✅ Definido' : '❌ Não definido');
    console.log('- EFI_CLIENT_SECRET:', process.env.EFI_CLIENT_SECRET ? '✅ Definido' : '❌ Não definido');
    console.log('- EFI_PIX_KEY:', process.env.EFI_PIX_KEY ? '✅ Definido' : '❌ Não definido');
    
    const EfiPay = require('sdk-node-apis-efi');
    
    // Configuração para sandbox ou produção
    let efiConfig: any = {
      client_id: process.env.EFI_CLIENT_ID,
      client_secret: process.env.EFI_CLIENT_SECRET,
      sandbox: isSandbox,
    };

    // Para produção, é obrigatório o certificado
    if (!isSandbox) {
      console.log('🔐 Configurando certificado para PRODUÇÃO...');
      
      const certificatePath = process.env.EFI_CERTIFICATE_PATH || './certs/certificado-efi.p12';
      const certificatePassphrase = process.env.EFI_CERTIFICATE_PASSPHRASE;
      
      if (!fs.existsSync(certificatePath)) {
        throw new Error(`Certificado não encontrado em: ${certificatePath}`);
      }
      
      if (!certificatePassphrase) {
        throw new Error('Senha do certificado não configurada (EFI_CERTIFICATE_PASSPHRASE)');
      }
      
      efiConfig.certificate = certificatePath;
      efiConfig.passphrase = certificatePassphrase;
      
      console.log('✅ Certificado configurado para produção');
    } else {
      // Para sandbox não precisa de certificado
      efiConfig.certificate = false;
      console.log('✅ Modo sandbox - sem certificado');
    }

    const efipay = new EfiPay(efiConfig);

    // Gerar TXID único
    const txid = `PIX${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    console.log('🆔 TXID gerado:', txid);

    const body = {
      calendario: {
        expiracao: 3600, // 1 hora
      },
      devedor: {
        nome: `Cliente WhatsApp ${whatsapp}`,
        cpf: '12345678909', // Em produção, você pode pedir o CPF real
      },
      valor: {
        original: valorTotal.toFixed(2),
      },
      chave: process.env.EFI_PIX_KEY,
      solicitacaoPagador: `Pagamento de ${totalBilhetes} bilhete(s) - Bolão TVLoteca`,
      infoAdicionais: [
        {
          nome: 'WhatsApp',
          valor: whatsapp,
        },
        {
          nome: 'Bilhetes',
          valor: totalBilhetes.toString(),
        },
        {
          nome: 'Ambiente',
          valor: isSandbox ? 'Sandbox' : 'Produção',
        },
      ],
    };

    console.log('🔄 Criando cobrança PIX na EFÍ...');
    const pixResponse = await efipay.pixCreateImmediateCharge([], body);

    if (!pixResponse || !pixResponse.txid) {
      throw new Error('Erro ao gerar cobrança PIX');
    }

    console.log('✅ Cobrança PIX criada:', pixResponse.txid);
    console.log('🔄 Gerando QR Code...');

    const qrCodeResponse = await efipay.pixGenerateQRCode({
      id: pixResponse.loc.id,
    });

    console.log('✅ QR Code gerado com sucesso!');

    return res.status(200).json({
      success: true,
      pix: {
        txid: pixResponse.txid,
        qrcode: qrCodeResponse.qrcode,
        imagemQrcode: qrCodeResponse.imagemQrcode,
        valor: valorTotal,
        expiracao: new Date(Date.now() + 3600000).toISOString(),
        ambiente: isSandbox ? 'sandbox' : 'produção',
      },
    });

  } catch (error) {
    console.error('❌ ERRO DETALHADO AO GERAR PIX:');
    console.error('📄 Tipo do erro:', typeof error);
    console.error('📝 Erro completo:', JSON.stringify(error, null, 2));

    if (error instanceof Error) {
      console.error('📋 Mensagem do erro:', error.message);
      console.error('📍 Stack trace:', error.stack);
    }

    // Se for erro da API da EFÍ
    if (error && typeof error === 'object' && 'response' in error) {
      console.error('🌐 Resposta da API EFÍ:', JSON.stringify(error.response?.data, null, 2));
      console.error('📊 Status da resposta:', error.response?.status);
      console.error('🔗 URL da requisição:', error.config?.url);
    }

    return res.status(500).json({ 
      error: 'Erro ao gerar cobrança PIX', 
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      ambiente: process.env.EFI_SANDBOX === 'true' ? 'sandbox' : 'produção'
    });
  }
}
