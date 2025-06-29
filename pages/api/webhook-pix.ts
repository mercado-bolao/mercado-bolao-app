
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('🔔 Webhook PIX recebido');
    console.log('📥 Headers:', JSON.stringify(req.headers, null, 2));
    console.log('📥 Body:', JSON.stringify(req.body, null, 2));

    const webhookData = req.body;
    
    // Log do webhook recebido
    const webhookLog = await prisma.webhookLog.create({
      data: {
        tipo: 'pix_webhook',
        payload: JSON.stringify(webhookData),
        status: 'RECEIVED',
        txid: webhookData.pix?.[0]?.txid || null
      }
    });

    console.log('📝 Webhook log criado:', webhookLog.id);

    // Extrair dados do PIX do webhook
    const pixArray = webhookData.pix;
    
    if (!pixArray || !Array.isArray(pixArray) || pixArray.length === 0) {
      console.log('⚠️ Webhook sem dados de PIX válidos');
      
      await prisma.webhookLog.update({
        where: { id: webhookLog.id },
        data: {
          status: 'ERROR',
          errorMessage: 'Webhook sem dados de PIX válidos',
          processedAt: new Date()
        }
      });

      return res.status(400).json({ 
        error: 'Dados de PIX não encontrados no webhook',
        received: true 
      });
    }

    // Processar cada PIX no webhook
    for (const pixInfo of pixArray) {
      const { txid, valor, horario, status } = pixInfo;
      
      console.log('💰 Processando PIX:', { txid, valor, status });

      if (!txid) {
        console.log('⚠️ PIX sem TXID, pulando...');
        continue;
      }

      try {
        // Buscar bilhete pelo TXID
        const bilhete = await prisma.bilhete.findFirst({
          where: { txid: txid },
          include: {
            palpites: true,
            pix: true
          }
        });

        if (!bilhete) {
          console.log(`⚠️ Bilhete não encontrado para TXID: ${txid}`);
          continue;
        }

        console.log(`📋 Bilhete encontrado: ${bilhete.id} - Status atual: ${bilhete.status}`);

        // Se o PIX foi pago
        if (status === 'CONCLUIDA' || status === 'PAGA') {
          console.log(`✅ PIX pago confirmado para bilhete: ${bilhete.id}`);

          // Atualizar status do bilhete
          await prisma.bilhete.update({
            where: { id: bilhete.id },
            data: { 
              status: 'PAGO',
              updatedAt: new Date()
            }
          });

          // Atualizar status dos palpites
          await prisma.palpite.updateMany({
            where: { bilheteId: bilhete.id },
            data: { status: 'pago' }
          });

          // Atualizar status do PIX se existir
          if (bilhete.pix) {
            await prisma.pixPagamento.update({
              where: { id: bilhete.pix.id },
              data: { status: 'PAGA' }
            });
          }

          console.log(`✅ Bilhete ${bilhete.id} e palpites marcados como PAGO`);

          // Log de sucesso
          await prisma.webhookLog.create({
            data: {
              tipo: 'pix_payment',
              txid: txid,
              payload: JSON.stringify({
                bilheteId: bilhete.id,
                valorPago: valor,
                horarioPagamento: horario,
                quantidadePalpites: bilhete.quantidadePalpites
              }),
              status: 'SUCCESS',
              processedAt: new Date()
            }
          });

        } else {
          console.log(`ℹ️ Status do PIX não é de pagamento confirmado: ${status}`);
        }

      } catch (pixError) {
        console.error(`❌ Erro ao processar PIX ${txid}:`, pixError);
        
        await prisma.webhookLog.create({
          data: {
            tipo: 'pix_error',
            txid: txid,
            payload: JSON.stringify(pixInfo),
            status: 'ERROR',
            errorMessage: pixError instanceof Error ? pixError.message : 'Erro desconhecido',
            processedAt: new Date()
          }
        });
      }
    }

    // Atualizar log principal como processado
    await prisma.webhookLog.update({
      where: { id: webhookLog.id },
      data: {
        status: 'PROCESSED',
        processedAt: new Date()
      }
    });

    console.log('✅ Webhook processado com sucesso');

    return res.status(200).json({ 
      success: true,
      message: 'Webhook processado com sucesso',
      processedPixCount: pixArray.length
    });

  } catch (error) {
    console.error('❌ Erro ao processar webhook PIX:', error);

    try {
      await prisma.webhookLog.create({
        data: {
          tipo: 'webhook_error',
          payload: JSON.stringify(req.body),
          status: 'ERROR',
          errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
          processedAt: new Date()
        }
      });
    } catch (logError) {
      console.error('❌ Erro ao salvar log de erro:', logError);
    }

    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      received: true
    });
  } finally {
    await prisma.$disconnect();
  }
}
