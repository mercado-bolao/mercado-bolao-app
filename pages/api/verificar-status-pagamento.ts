import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const prisma = new PrismaClient();

  try {
    const { bilheteId, txid } = req.query;

    if (!bilheteId && !txid) {
      return res.status(400).json({ error: 'bilheteId ou txid é obrigatório' });
    }

    // Buscar bilhete
    let bilhete;
    if (bilheteId) {
      bilhete = await prisma.bilhete.findUnique({
        where: { id: bilheteId as string },
        include: {
          pix: true
        }
      });
    } else if (txid) {
      bilhete = await prisma.bilhete.findFirst({
        where: { txid: txid as string },
        include: {
          pix: true
        }
      });
    }

    if (!bilhete) {
      return res.status(404).json({ error: 'Bilhete não encontrado' });
    }

    // Se já está pago, retornar status
    if (bilhete.status === 'PAGO') {
      return res.status(200).json({
        success: true,
        status: 'PAGO',
        bilhete: {
          id: bilhete.id,
          status: bilhete.status,
          valorTotal: bilhete.valorTotal,
          txid: bilhete.txid
        }
      });
    }

    // Se tem TXID, verificar na EFI (apenas se TXID for válido)
    if (bilhete.txid) {
      // Validar formato do TXID antes de consultar a EFÍ  
      const txidPattern = /^[A-Z0-9]{32}$/;
      const txidValido = txidPattern.test(bilhete.txid);

      if (!txidValido) {
        console.log(`⚠️ TXID com formato inválido (${bilhete.txid.length} caracteres): ${bilhete.txid}`);
        console.log(`📌 Este bilhete foi criado com TXID no formato antigo. Para consultar na EFÍ, será necessário gerar um novo PIX.`);
        
        // Retornar status informativo para TXIDs inválidos
        return res.status(200).json({
          success: true,
          status: bilhete.status,
          warning: 'TXID_FORMATO_ANTIGO',
          message: 'Este bilhete possui TXID no formato antigo. Para verificar na EFÍ, gere um novo PIX.',
          bilhete: {
            id: bilhete.id,
            status: bilhete.status,
            valorTotal: bilhete.valorTotal,
            txid: bilhete.txid,
            expiresAt: bilhete.expiresAt.toISOString()
          }
        });
      } else {
        try {
          console.log(`🔍 Verificando PIX na EFI: ${bilhete.txid}`);

          // Configurar EFI
          const efiSandbox = process.env.EFI_SANDBOX || 'false';
          const isSandbox = efiSandbox === 'true';

          const EfiPay = require('sdk-node-apis-efi');

          let efiConfig: any = {
            sandbox: isSandbox,
            client_id: process.env.EFI_CLIENT_ID,
            client_secret: process.env.EFI_CLIENT_SECRET
          };

          // Configurar certificado para produção
          if (!isSandbox) {
            const certificatePath = path.resolve('./certs/certificado-efi.p12');

            if (fs.existsSync(certificatePath) && process.env.EFI_CERTIFICATE_PASSPHRASE) {
              efiConfig.certificate = certificatePath;
              efiConfig.passphrase = process.env.EFI_CERTIFICATE_PASSPHRASE;
            }
          }

          const efipay = new EfiPay(efiConfig);

          // Consultar PIX na EFÍ
          const pixResponse = await efipay.pixDetailCharge([], { txid: bilhete.txid });

          console.log(`📋 Status na EFI: ${pixResponse.status}`);

          // Se foi pago na EFI, atualizar no banco
          if (pixResponse.status === 'CONCLUIDA') {
            console.log(`✅ PIX confirmado como pago: ${bilhete.txid}`);

            // Atualizar bilhete
            await prisma.bilhete.update({
              where: { id: bilhete.id },
              data: { status: 'PAGO' }
            });

            // Atualizar PIX se existir
            if (bilhete.pix) {
              await prisma.pixPagamento.update({
                where: { id: bilhete.pix.id },
                data: { status: 'PAGA' }
              });
            }

            // Atualizar palpites
            await prisma.palpite.updateMany({
              where: { 
                bilheteId: bilhete.id
              },
              data: { status: 'pago' }
            });

            return res.status(200).json({
              success: true,
              status: 'PAGO',
              statusAtualizado: true,
              bilhete: {
                id: bilhete.id,
                status: 'PAGO',
                valorTotal: bilhete.valorTotal,
                txid: bilhete.txid
              }
            });
          }

        } catch (efiError) {
          console.error('❌ Erro ao consultar EFI:', efiError);
          // Não retornar erro, continuar com status atual
        }
      }
    }

    // Verificar se expirou
    const agora = new Date();
    const expirado = bilhete.expiresAt < agora;

    if (expirado && bilhete.status === 'PENDENTE') {
      // Atualizar como cancelado
      await prisma.bilhete.update({
        where: { id: bilhete.id },
        data: { status: 'CANCELADO' }
      });

      // Reverter palpites
      await prisma.palpite.updateMany({
        where: { 
          bilheteId: bilhete.id
        },
        data: { status: 'pendente' }
      });

      return res.status(200).json({
        success: true,
        status: 'EXPIRADO',
        bilhete: {
          id: bilhete.id,
          status: 'CANCELADO',
          valorTotal: bilhete.valorTotal,
          txid: bilhete.txid
        }
      });
    }

    // Retornar status atual
    return res.status(200).json({
      success: true,
      status: bilhete.status,
      bilhete: {
        id: bilhete.id,
        status: bilhete.status,
        valorTotal: bilhete.valorTotal,
        txid: bilhete.txid,
        expiresAt: bilhete.expiresAt.toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
    return res.status(500).json({
      error: 'Erro ao verificar status do pagamento',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  } finally {
    await prisma.$disconnect();
  }
}