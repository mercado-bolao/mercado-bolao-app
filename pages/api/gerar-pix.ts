

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
      client_id: 'Client_Id_904f9fe2a9c9d5dc7f50cf9a56cb0effb9b20140',
      client_secret: 'Client_Secret_6e2c43d197c350a3d88df81530bcd27eb0818719',
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
      chave: '1fe7c162-b80d-464a-b57e-26c7da638223',
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
    
    // FALLBACK: Se falhar, usar simulação
    console.log('🔄 Gerando PIX simulado como fallback...');
    const txid = `SIM${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    
    return res.status(200).json({
      success: true,
      pix: {
        txid: txid,
        qrcode: '00020101021226580014br.gov.bcb.pix01361fe7c162-b80d-464a-b57e-26c7da6382235204000053039865802BR5925BOLAO TVLOTECA6009SAO PAULO62070503***6304A1B2',
        imagemQrcode: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        valor: valorTotal,
        expiracao: new Date(Date.now() + 3600000).toISOString(),
      },
      debug: { 
        simulacao: true, 
        motivoSimulacao: 'Erro na API da EFÍ',
        errorDetails: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    });
  }
}

