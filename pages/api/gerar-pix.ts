
import { NextApiRequest, NextApiResponse } from 'next';
const EfiPay = require('sdk-node-apis-efi');

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

    // Configuração da EFÍ
    const efipay = new EfiPay({
      client_id: process.env.EFI_CLIENT_ID,
      client_secret: process.env.EFI_CLIENT_SECRET,
      sandbox: true, // Mude para false em produção
    });

    // Dados do PIX
    const body = {
      calendario: {
        expiracao: 3600, // 1 hora para expirar
      },
      devedor: {
        nome: `Cliente WhatsApp ${whatsapp}`,
        cpf: '12345678909', // CPF genérico para teste, você pode pedir o CPF real depois
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

    // Gerar cobrança PIX
    const pixResponse = await efipay.pixCreateImmediateCharge([], body);
    
    if (!pixResponse || !pixResponse.txid) {
      throw new Error('Erro ao gerar cobrança PIX');
    }

    // Gerar QR Code
    const qrCodeResponse = await efipay.pixGenerateQRCode({
      id: pixResponse.loc.id,
    });

    console.log('✅ PIX gerado com sucesso:', {
      txid: pixResponse.txid,
      valor: valorTotal,
    });

    return res.status(200).json({
      success: true,
      pix: {
        txid: pixResponse.txid,
        qrcode: qrCodeResponse.qrcode,
        imagemQrcode: qrCodeResponse.imagemQrcode,
        valor: valorTotal,
        expiracao: new Date(Date.now() + 3600000).toISOString(), // 1 hora
      },
    });

  } catch (error) {
    console.error('❌ Erro ao gerar PIX:', error);
    return res.status(500).json({
      error: 'Erro ao gerar pagamento PIX',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
}
