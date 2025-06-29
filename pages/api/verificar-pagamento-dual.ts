import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { APIResponse } from '../../types';

const EfiPay = require('sdk-node-apis-efi');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse>
) {
  try {
    const { bilheteId } = req.query;

    if (!bilheteId || typeof bilheteId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'ID do bilhete não fornecido'
      });
    }

    // Buscar bilhete
    const bilhete = await prisma.bilhete.findUnique({
      where: { id: bilheteId }
    });

    if (!bilhete) {
      return res.status(404).json({
        success: false,
        error: 'Bilhete não encontrado'
      });
    }

    // Se não tem TXID, não pode verificar
    if (!bilhete.txid) {
      return res.status(400).json({
        success: false,
        error: 'Bilhete sem TXID'
      });
    }

    // Configurar EFI
    const efiSandbox = process.env.EFI_SANDBOX || 'false';
    const isSandbox = efiSandbox === 'true';

    const efiConfig = {
      sandbox: isSandbox,
      client_id: process.env.EFI_CLIENT_ID,
      client_secret: process.env.EFI_CLIENT_SECRET
    };

    const efipay = new EfiPay(efiConfig);

    // Consultar PIX na EFÍ
    const params = { txid: bilhete.txid };
    const sandboxResponse = await efipay.pixDetailCharge(params);

    return res.status(200).json({
      success: true,
      data: {
        id: bilhete.id,
        txid: bilhete.txid,
        status: sandboxResponse.status,
        valorTotal: bilhete.valorTotal,
        ambiente: isSandbox ? 'sandbox' : 'producao'
      }
    });

  } catch (error) {
    const err = error as Error;
    return res.status(500).json({
      success: false,
      error: 'Erro ao verificar pagamento',
      details: err.message
    });
  }
}
