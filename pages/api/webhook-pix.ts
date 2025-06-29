import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { APIResponse, WebhookLog } from '../../types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse>
) {
  console.log('📥 Webhook PIX recebido');
  console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));

  try {
    // Verificar método
    if (req.method !== 'POST') {
      console.log('❌ Método inválido:', req.method);
      return res.status(405).json({
        success: false,
        error: 'Método não permitido'
      });
    }

    // Log do payload recebido
    console.log('📦 Payload recebido:', JSON.stringify(req.body, null, 2));

    // Extrair dados do webhook
    const { txid, pix } = req.body;

    if (!txid) {
      console.log('❌ TXID não fornecido no webhook');
      return res.status(400).json({
        success: false,
        error: 'TXID não fornecido'
      });
    }

    // Registrar log do webhook antes de qualquer processamento
    console.log('📝 Registrando log do webhook...');
    await prisma.webhookLog.create({
      data: {
        evento: 'pix.received',
        txid: txid,
        dados: req.body,
        processado: false
      }
    });

    console.log('🔍 Buscando bilhete com TXID:', txid);

    // Buscar bilhete
    const bilhete = await prisma.bilhete.findFirst({
      where: { txid },
      include: {
        palpites: true,
        pix: true
      }
    });

    if (!bilhete) {
      console.log('❌ Bilhete não encontrado para TXID:', txid);
      return res.status(404).json({
        success: false,
        error: 'Bilhete não encontrado'
      });
    }

    // Verificar se já está pago
    if (bilhete.status === 'PAGO') {
      console.log('⚠️ Bilhete já está marcado como pago:', bilhete.id);

      // Atualizar log como processado
      await prisma.webhookLog.updateMany({
        where: { txid: txid, processado: false },
        data: { processado: true }
      });

      return res.status(200).json({
        success: true,
        message: 'Bilhete já processado anteriormente',
        data: {
          id: bilhete.id,
          status: 'PAGO',
          valorTotal: bilhete.valorTotal,
          whatsapp: bilhete.whatsapp
        }
      });
    }

    // Verificar status na EFI antes de processar
    try {
      console.log('🔍 Verificando status na EFI antes de processar...');
      const efiResponse = await fetch(`${req.headers.origin}/api/admin/verificar-status-efi?txid=${txid}`);
      const efiData = await efiResponse.json();

      if (!efiData.success || efiData.status !== 'CONCLUIDA') {
        console.log('⚠️ Status na EFI não é CONCLUIDA:', efiData.status);
        return res.status(200).json({
          success: false,
          error: 'Pagamento ainda não confirmado na EFI',
          data: {
            statusEfi: efiData.status
          }
        });
      }
    } catch (efiError) {
      console.error('⚠️ Erro ao verificar na EFI:', efiError);
    }

    console.log('💾 Atualizando status do bilhete para PAGO...');

    // Atualizar status do bilhete
    await prisma.bilhete.update({
      where: { id: bilhete.id },
      data: {
        status: 'PAGO',
        updatedAt: new Date()
      }
    });

    console.log('💾 Atualizando status dos palpites...');

    // Atualizar status dos palpites
    await prisma.palpite.updateMany({
      where: { bilheteId: bilhete.id },
      data: { status: 'pago' }
    });

    // Atualizar PIX se existir
    if (bilhete.pix) {
      console.log('💾 Atualizando registro do PIX...');
      await prisma.pixPagamento.update({
        where: { id: bilhete.pix.id },
        data: {
          status: 'PAGA',
          updatedAt: new Date()
        }
      });
    }

    // Marcar webhook como processado
    await prisma.webhookLog.updateMany({
      where: { txid: txid, processado: false },
      data: { processado: true }
    });

    console.log('✅ Webhook processado com sucesso!');

    return res.status(200).json({
      success: true,
      message: 'Pagamento processado com sucesso',
      data: {
        id: bilhete.id,
        status: 'PAGO',
        valorTotal: bilhete.valorTotal,
        whatsapp: bilhete.whatsapp
      }
    });

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    const err = error as Error;
    return res.status(500).json({
      success: false,
      error: 'Erro ao processar webhook',
      details: err.message
    });
  } finally {
    await prisma.$disconnect();
  }
}
