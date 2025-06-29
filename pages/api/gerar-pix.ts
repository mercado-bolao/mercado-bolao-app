import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { whatsapp, valorTotal, totalBilhetes } = req.body;

  if (!whatsapp || !valorTotal || !totalBilhetes) {
    return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' });
  }

  try {
    console.log('🔄 Gerando PIX REAL para:', { whatsapp, valorTotal, totalBilhetes });
    console.log('📋 Variáveis de ambiente:');
    console.log('- EFI_CLIENT_ID:', process.env.EFI_CLIENT_ID ? '✅ Definido' : '❌ Não definido');
    console.log('- EFI_CLIENT_SECRET:', process.env.EFI_CLIENT_SECRET ? '✅ Definido' : '❌ Não definido');
    console.log('- EFI_PIX_KEY:', process.env.EFI_PIX_KEY ? '✅ Definido' : '❌ Não definido');

    // USAR SEMPRE SANDBOX COM AS NOVAS CREDENCIAIS
    console.log('🔄 Usando credenciais de sandbox da EFÍ...');

    // INTEGRAÇÃO COM EFÍ - SANDBOX
    const EfiPay = require('sdk-node-apis-efi');

    const efipay = new EfiPay({
      client_id: process.env.EFI_CLIENT_ID,
      client_secret: process.env.EFI_CLIENT_SECRET,
      sandbox: true, // SANDBOX para testes
      certificate: false, // Para sandbox não precisa de certificado
    });

    // Gerar TXID único
    const txid = `PIX${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    console.log('🆔 TXID gerado:', txid);

    const body = {
      calendario: {
        expiracao: 3600, // 1 hora
      },
      devedor: {
        nome: `Cliente WhatsApp ${whatsapp}`,
        cpf: '12345678909', // Você pode pedir o CPF no formulário se necessário
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

    return res.status(500).json({ error: 'Erro ao gerar cobrança PIX', details: error });
  }
}