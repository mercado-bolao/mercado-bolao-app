
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔔 Webhook PIX recebido');
  console.log('📥 Method:', req.method);
  console.log('📥 Headers:', JSON.stringify(req.headers, null, 2));
  console.log('📥 Body:', JSON.stringify(req.body, null, 2));

  const prisma = new PrismaClient();

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método não permitido' });
    }

    // Extrair dados do webhook da EFÍ
    const { pix } = req.body;
    
    if (!pix || !pix[0]) {
      console.log('❌ Dados do PIX não encontrados no webhook');
      return res.status(400).json({ error: 'Dados do PIX não encontrados' });
    }

    const pixData = pix[0];
    const txid = pixData.txid;
    const valor = parseFloat(pixData.valor);
    const status = pixData.status; // "PAGA" quando pago

    console.log('💰 PIX recebido via webhook:');
    console.log('- TXID:', txid);
    console.log('- Valor:', valor);
    console.log('- Status:', status);

    // 1. REGISTRAR LOG DO WEBHOOK
    const webhookLog = await prisma.webhookLog.create({
      data: {
        evento: 'pix.received',
        txid: txid,
        dados: req.body,
        processado: false
      }
    });

    console.log('📝 Webhook log criado:', webhookLog.id);

    // 2. VERIFICAR SE É UM PAGAMENTO (status = PAGA)
    if (status !== 'PAGA') {
      console.log('ℹ️ Webhook recebido mas PIX não está pago ainda. Status:', status);
      return res.status(200).json({ 
        message: 'Webhook recebido, mas PIX não confirmado',
        status: status 
      });
    }

    // 3. BUSCAR BILHETE PELO TXID
    const bilhete = await prisma.bilhete.findFirst({
      where: {
        txid: txid,
        status: 'PENDENTE'
      },
      include: {
        palpites: true
      }
    });

    if (!bilhete) {
      console.log('❌ Bilhete não encontrado ou já processado para TXID:', txid);
      
      // Marcar webhook como processado mesmo assim
      await prisma.webhookLog.update({
        where: { id: webhookLog.id },
        data: { processado: true }
      });

      return res.status(404).json({ 
        error: 'Bilhete não encontrado ou já processado',
        txid: txid 
      });
    }

    console.log('🎫 Bilhete encontrado:', bilhete.id);
    console.log('👥 Palpites associados:', bilhete.palpites?.length || 0);

    // 4. ATUALIZAR STATUS DO BILHETE PARA PAGO
    const bilheteAtualizado = await prisma.bilhete.update({
      where: { id: bilhete.id },
      data: { 
        status: 'PAGO',
        updatedAt: new Date()
      }
    });

    console.log('✅ Bilhete atualizado para PAGO');

    // 5. ATUALIZAR PALPITES PARA PAGO
    if (bilhete.palpites && bilhete.palpites.length > 0) {
      const palpitesIds = bilhete.palpites.map(p => p.id);
      
      const palpitesAtualizados = await prisma.palpite.updateMany({
        where: {
          id: { in: palpitesIds }
        },
        data: {
          status: 'pago'
        }
      });

      console.log('✅ Palpites atualizados para PAGO:', palpitesAtualizados.count);
    }

    // 6. ATUALIZAR STATUS DO PIX
    await prisma.pixPagamento.updateMany({
      where: { txid: txid },
      data: { 
        status: 'PAGA',
        updatedAt: new Date()
      }
    });

    console.log('✅ PIX atualizado para PAGA');

    // 7. MARCAR WEBHOOK COMO PROCESSADO
    await prisma.webhookLog.update({
      where: { id: webhookLog.id },
      data: { processado: true }
    });

    console.log('🎉 PAGAMENTO CONFIRMADO COM SUCESSO!');
    console.log('📊 Resumo:');
    console.log('- Bilhete:', bilhete.id, '→ PAGO');
    console.log('- Palpites:', bilhete.palpites?.length || 0, '→ PAGOS');
    console.log('- Valor:', `R$ ${valor.toFixed(2)}`);
    console.log('- WhatsApp:', bilhete.whatsapp);

    // Retornar sucesso para a EFÍ
    return res.status(200).json({
      success: true,
      message: 'Pagamento confirmado com sucesso',
      bilhete: {
        id: bilhete.id,
        status: 'PAGO',
        valor: bilhete.valor,
        whatsapp: bilhete.whatsapp
      },
      palpites_confirmados: bilhete.palpites?.length || 0
    });

  } catch (error) {
    console.error('❌ ERRO NO WEBHOOK PIX:', error);

    try {
      // Tentar registrar erro no log
      await prisma.webhookLog.create({
        data: {
          evento: 'error',
          dados: { error: error instanceof Error ? error.message : 'Erro desconhecido', body: req.body },
          processado: false
        }
      });
    } catch (logError) {
      console.error('❌ Erro ao registrar log de erro:', logError);
    }

    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  } finally {
    await prisma.$disconnect();
  }
}
