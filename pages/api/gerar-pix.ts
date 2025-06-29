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
    // Usar variáveis dos Secrets do Replit
    const efiSandbox = process.env.EFI_SANDBOX || 'false';
    const efiClientId = process.env.EFI_CLIENT_ID || 'Client_Id_904f9fe2a9c9d5dc7f50cf9a56cb0effb9b20140';
    const efiClientSecret = process.env.EFI_CLIENT_SECRET || 'Client_Secret_6e2c43d197c350a3d88df81530bcd27eb0818719';
    const efiPixKey = process.env.EFI_PIX_KEY || '1fe7c162-b80d-464a-b57e-26c7da638223';

    const isSandbox = efiSandbox === 'true';

    console.log(`🔄 Gerando PIX ${isSandbox ? 'SANDBOX' : 'PRODUÇÃO'} para:`, { whatsapp, valorTotal, totalBilhetes });
    console.log('📋 Configurações atuais:');
    console.log('- EFI_SANDBOX:', efiSandbox, '(from env:', process.env.EFI_SANDBOX, ')');
    console.log('- EFI_CLIENT_ID:', efiClientId);
    console.log('- EFI_CLIENT_SECRET:', efiClientSecret ? '✅ Definido' : '❌ Não definido');
    console.log('- EFI_PIX_KEY:', efiPixKey);
    console.log('🔍 Debug completo das variáveis:');
    console.log('- process.env.EFI_SANDBOX:', process.env.EFI_SANDBOX);
    console.log('- process.env.EFI_CLIENT_ID:', process.env.EFI_CLIENT_ID);
    console.log('- process.env.EFI_CLIENT_SECRET:', process.env.EFI_CLIENT_SECRET ? 'Existe' : 'Undefined');
    console.log('- process.env.EFI_PIX_KEY:', process.env.EFI_PIX_KEY);
    console.log('- process.env.EFI_CERTIFICATE_PATH:', process.env.EFI_CERTIFICATE_PATH);
    console.log('- process.env.EFI_CERTIFICATE_PASSPHRASE:', process.env.EFI_CERTIFICATE_PASSPHRASE ? 'Existe' : 'Undefined');

    const EfiPay = require('sdk-node-apis-efi');

    // Configuração para sandbox ou produção
    let efiConfig: any = {
      client_id: efiClientId,
      client_secret: efiClientSecret,
      sandbox: isSandbox,
    };

    // Para produção, é obrigatório o certificado
    if (!isSandbox) {
      console.log('🔐 Configurando certificado para PRODUÇÃO...');

      const certificatePath = process.env.EFI_CERTIFICATE_PATH || './certs/certificado-efi.p12';
      const certificatePassphrase = process.env.EFI_CERTIFICATE_PASSPHRASE || '';

      if (!fs.existsSync(certificatePath)) {
        throw new Error(`Certificado não encontrado em: ${certificatePath}`);
      }

      efiConfig.certificate = certificatePath;
      // Tratar senha vazia, espaço em branco ou undefined
      const senha = certificatePassphrase?.trim();
      efiConfig.passphrase = (senha && senha.length > 0) ? senha : ''; // Senha vazia se não configurada

      console.log('✅ Certificado configurado para produção');
      console.log('📁 Caminho do certificado:', certificatePath);
      console.log('🔑 Senha configurada:', certificatePassphrase ? 'Sim' : 'Não');
    } else {
      // Para sandbox não precisa de certificado
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
      chave: efiPixKey,
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