
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { txid, bilheteId } = req.body;

    if (!txid && !bilheteId) {
      return res.status(400).json({ error: 'TXID ou bilheteId é obrigatório' });
    }

    console.log('🔍 Forçando verificação de pagamento:', { txid, bilheteId });

    // Buscar bilhete
    let bilhete;
    if (bilheteId) {
      bilhete = await prisma.bilhete.findUnique({
        where: { id: bilheteId }
      });
    } else if (txid) {
      bilhete = await prisma.bilhete.findFirst({
        where: { txid: txid }
      });
    }

    if (!bilhete) {
      return res.status(404).json({ error: 'Bilhete não encontrado' });
    }

    if (bilhete.status === 'PAGO') {
      return res.status(200).json({
        success: true,
        message: 'Bilhete já está marcado como pago',
        status: 'PAGO'
      });
    }

    // Verificar na EFI usando múltiplos métodos
    const efiSandbox = process.env.EFI_SANDBOX || 'false';
    const isSandbox = efiSandbox === 'true';

    console.log('🔄 Verificando na EFI Pay...');

    try {
      // Método 1: SDK EFI
      const EfiPay = require('sdk-node-apis-efi');

      let efiConfig: any = {
        sandbox: isSandbox,
        client_id: process.env.EFI_CLIENT_ID,
        client_secret: process.env.EFI_CLIENT_SECRET
      };

      if (isSandbox) {
        const certificatePath = path.resolve('./certs/certificado-efi.p12');
        if (fs.existsSync(certificatePath) && process.env.EFI_CERTIFICATE_PASSPHRASE) {
          efiConfig.certificate = certificatePath;
          efiConfig.passphrase = process.env.EFI_CERTIFICATE_PASSPHRASE;
        }
      }

      const efipay = new EfiPay(efiConfig);
      const pixResponse = await efipay.pixDetailCharge([], { txid: bilhete.txid });

      console.log('📋 Resposta EFI SDK:', pixResponse.status);

      if (pixResponse.status === 'CONCLUIDA') {
        // Marcar como pago
        await prisma.bilhete.update({
          where: { id: bilhete.id },
          data: { status: 'PAGO' }
        });

        // Atualizar palpites
        await prisma.palpite.updateMany({
          where: { bilheteId: bilhete.id },
          data: { status: 'pago' }
        });

        console.log('✅ Pagamento confirmado via SDK EFI');

        return res.status(200).json({
          success: true,
          message: 'Pagamento confirmado e atualizado!',
          status: 'PAGO',
          metodo: 'SDK_EFI'
        });
      }

    } catch (sdkError) {
      console.log('⚠️ Erro no SDK EFI:', sdkError);

      // Método 2: Fetch direto
      try {
        const baseUrl = isSandbox
          ? 'https://pix-h.api.efipay.com.br'
          : 'https://pix.api.efipay.com.br';

        const authString = Buffer.from(`${process.env.EFI_CLIENT_ID}:${process.env.EFI_CLIENT_SECRET}`).toString('base64');

        const tokenResponse = await fetch(`${baseUrl}/oauth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${authString}`
          },
          body: JSON.stringify({ grant_type: 'client_credentials' })
        });

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();

          const pixResponse = await fetch(`${baseUrl}/v2/pix/${bilhete.txid}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`,
              'Content-Type': 'application/json'
            }
          });

          if (pixResponse.ok) {
            const pixData = await pixResponse.json();
            console.log('📋 Resposta EFI Fetch:', pixData.status);

            if (pixData.status === 'CONCLUIDA') {
              // Marcar como pago
              await prisma.bilhete.update({
                where: { id: bilhete.id },
                data: { status: 'PAGO' }
              });

              // Atualizar palpites
              await prisma.palpite.updateMany({
                where: { bilheteId: bilhete.id },
                data: { status: 'pago' }
              });

              console.log('✅ Pagamento confirmado via Fetch EFI');

              return res.status(200).json({
                success: true,
                message: 'Pagamento confirmado e atualizado!',
                status: 'PAGO',
                metodo: 'FETCH_EFI'
              });
            }
          }
        }
      } catch (fetchError) {
        console.log('⚠️ Erro no Fetch EFI:', fetchError);
      }
    }

    // Se chegou até aqui, não foi possível confirmar o pagamento
    return res.status(200).json({
      success: false,
      message: 'Não foi possível confirmar o pagamento na EFI',
      status: bilhete.status,
      suggestion: 'Verifique se o PIX foi realmente pago ou entre em contato com o suporte'
    });

  } catch (error) {
    console.error('❌ Erro na verificação forçada:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  } finally {
    await prisma.$disconnect();
  }
}
