
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const prisma = new PrismaClient();

  try {
    const { bilheteId, whatsapp, forcarAtualizacao = false } = req.body;

    if (!bilheteId && !whatsapp) {
      return res.status(400).json({ 
        error: 'bilheteId ou whatsapp é obrigatório' 
      });
    }

    console.log('🔍 Forçando verificação de pagamento...', { bilheteId, whatsapp, forcarAtualizacao });

    // Buscar bilhete
    let bilhete;
    if (bilheteId) {
      bilhete = await prisma.bilhete.findUnique({
        where: { id: bilheteId },
        include: { pix: true, palpites: true }
      });
    } else if (whatsapp) {
      bilhete = await prisma.bilhete.findFirst({
        where: { 
          whatsapp: whatsapp,
          status: 'PENDENTE'
        },
        include: { pix: true, palpites: true },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (!bilhete) {
      return res.status(404).json({ 
        error: 'Bilhete não encontrado',
        detalhes: 'Nenhum bilhete pendente encontrado para este WhatsApp ou ID'
      });
    }

    console.log('📋 Bilhete encontrado:', {
      id: bilhete.id,
      status: bilhete.status,
      txid: bilhete.txid,
      valor: bilhete.valorTotal,
      whatsapp: bilhete.whatsapp
    });

    // Se forçar atualização ou já tem confirmação manual, marcar como pago
    if (forcarAtualizacao) {
      console.log('🔧 Forçando marcação como PAGO...');

      // Atualizar bilhete
      await prisma.bilhete.update({
        where: { id: bilhete.id },
        data: { 
          status: 'PAGO',
          updatedAt: new Date()
        }
      });

      // Atualizar PIX se existir
      if (bilhete.pix) {
        await prisma.pixPagamento.update({
          where: { id: bilhete.pix.id },
          data: { 
            status: 'PAGA',
            updatedAt: new Date()
          }
        });
      }

      // Atualizar palpites
      if (bilhete.palpites && bilhete.palpites.length > 0) {
        await prisma.palpite.updateMany({
          where: { bilheteId: bilhete.id },
          data: { status: 'pago' }
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Bilhete marcado como PAGO com sucesso!',
        metodo: 'forcado_manual',
        bilhete: {
          id: bilhete.id,
          status: 'PAGO',
          valorTotal: bilhete.valorTotal,
          txid: bilhete.txid,
          palpitesAtualizados: bilhete.palpites?.length || 0
        }
      });
    }

    // Tentar verificar via EFÍ se tem TXID
    if (bilhete.txid) {
      try {
        console.log('🔍 Tentando verificar via EFÍ Pay...');

        // Configurar EFÍ
        const efiSandbox = process.env.EFI_SANDBOX || 'false';
        const isSandbox = efiSandbox === 'true';

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

        const EfiPay = require('sdk-node-apis-efi');
        const efipay = new EfiPay(efiConfig);

        // Limpar TXID
        const txidLimpo = bilhete.txid.trim().replace(/[^a-zA-Z0-9]/g, '');
        console.log('🔗 Consultando TXID na EFÍ:', txidLimpo);

        const pixResponse = await efipay.pixDetailCharge({ txid: txidLimpo });
        console.log('📋 Resposta EFÍ:', pixResponse.status);

        if (pixResponse.status === 'CONCLUIDA') {
          console.log('✅ PIX confirmado como pago na EFÍ!');

          // Atualizar status
          await prisma.bilhete.update({
            where: { id: bilhete.id },
            data: { status: 'PAGO', updatedAt: new Date() }
          });

          if (bilhete.pix) {
            await prisma.pixPagamento.update({
              where: { id: bilhete.pix.id },
              data: { status: 'PAGA', updatedAt: new Date() }
            });
          }

          await prisma.palpite.updateMany({
            where: { bilheteId: bilhete.id },
            data: { status: 'pago' }
          });

          return res.status(200).json({
            success: true,
            message: 'Pagamento confirmado via EFÍ Pay!',
            metodo: 'efi_verificacao',
            bilhete: {
              id: bilhete.id,
              status: 'PAGO',
              valorTotal: bilhete.valorTotal,
              txid: bilhete.txid
            }
          });
        } else {
          return res.status(200).json({
            success: false,
            message: `PIX ainda não foi pago. Status na EFÍ: ${pixResponse.status}`,
            statusEfi: pixResponse.status,
            bilhete: {
              id: bilhete.id,
              status: bilhete.status,
              valorTotal: bilhete.valorTotal,
              txid: bilhete.txid
            }
          });
        }

      } catch (efiError: any) {
        console.error('❌ Erro ao verificar na EFÍ:', efiError);

        if (efiError?.nome === 'cobranca_nao_encontrada') {
          return res.status(200).json({
            success: false,
            message: 'PIX não encontrado na EFÍ Pay. Pode ter expirado ou TXID inválido.',
            erro: 'cobranca_nao_encontrada',
            solucao: 'Use forcarAtualizacao=true se confirmou o pagamento manualmente',
            bilhete: {
              id: bilhete.id,
              status: bilhete.status,
              valorTotal: bilhete.valorTotal,
              txid: bilhete.txid
            }
          });
        }

        throw efiError;
      }
    }

    // Se não tem TXID, só retornar informações
    return res.status(200).json({
      success: false,
      message: 'Bilhete sem TXID. Use forcarAtualizacao=true para marcar como pago manualmente.',
      bilhete: {
        id: bilhete.id,
        status: bilhete.status,
        valorTotal: bilhete.valorTotal,
        txid: bilhete.txid || 'Não informado'
      }
    });

  } catch (error) {
    console.error('❌ Erro na verificação forçada:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  } finally {
    await prisma.$disconnect();
  }
}
