
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { whatsapp, valorTotal, totalBilhetes } = req.body;

  if (!whatsapp || !valorTotal || !totalBilhetes) {
    return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' });
  }

  try {
    console.log('🔄 Gerando PIX para:', { whatsapp, valorTotal, totalBilhetes });

    // SIMULAÇÃO DE PIX PARA TESTE
    // Remova este bloco quando a EFÍ estiver funcionando
    const pixSimulado = {
      txid: `PIX${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      qrcode: '00020101021226580014br.gov.bcb.pix0136' + process.env.EFI_PIX_KEY + '5204000053039865802BR5925BOLAO TVLOTECA6009SAO PAULO62070503***6304' + Math.random().toString().substr(2, 4),
      imagemQrcode: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', // Imagem 1x1 transparente em base64
    };

    console.log('✅ PIX simulado gerado com sucesso:', {
      txid: pixSimulado.txid,
      valor: valorTotal,
    });

    return res.status(200).json({
      success: true,
      pix: {
        txid: pixSimulado.txid,
        qrcode: pixSimulado.qrcode,
        imagemQrcode: pixSimulado.imagemQrcode,
        valor: valorTotal,
        expiracao: new Date(Date.now() + 3600000).toISOString(), // 1 hora
      },
      debug: {
        simulacao: true,
        hasClientId: !!process.env.EFI_CLIENT_ID,
        hasClientSecret: !!process.env.EFI_CLIENT_SECRET,
        hasPixKey: !!process.env.EFI_PIX_KEY,
      }
    });

    /* 
    // CÓDIGO REAL DA EFÍ - USE QUANDO RESOLVER O PROBLEMA DO CERTIFICADO
    const EfiPay = require('sdk-node-apis-efi');
    
    const efipay = new EfiPay({
      client_id: process.env.EFI_CLIENT_ID,
      client_secret: process.env.EFI_CLIENT_SECRET,
      sandbox: true,
      certificate: false,
    });

    const body = {
      calendario: {
        expiracao: 3600,
      },
      devedor: {
        nome: `Cliente WhatsApp ${whatsapp}`,
        cpf: '12345678909',
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

    const pixResponse = await efipay.pixCreateImmediateCharge([], body);
    
    if (!pixResponse || !pixResponse.txid) {
      throw new Error('Erro ao gerar cobrança PIX');
    }

    const qrCodeResponse = await efipay.pixGenerateQRCode({
      id: pixResponse.loc.id,
    });

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
    */

  } catch (error) {
    console.error('❌ Erro ao gerar PIX:', error);
    
    if (error instanceof Error) {
      console.error('Mensagem do erro:', error.message);
      console.error('Stack:', error.stack);
    }
    
    return res.status(500).json({
      error: 'Erro ao gerar pagamento PIX',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      debug: {
        hasClientId: !!process.env.EFI_CLIENT_ID,
        hasClientSecret: !!process.env.EFI_CLIENT_SECRET,
        hasPixKey: !!process.env.EFI_PIX_KEY,
      }
    });
  }
}
