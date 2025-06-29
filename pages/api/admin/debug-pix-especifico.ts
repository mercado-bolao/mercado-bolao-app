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
    console.log('🔍 Investigando PIX de 29/06/2025, 15:46:20...');

    // 1. BUSCAR PIX PENDENTES NO PERÍODO
    const dataInicio = new Date('2025-06-29T14:00:00.000Z');
    const dataFim = new Date('2025-06-29T17:00:00.000Z');

    console.log('📅 Período de busca:', {
      inicio: dataInicio.toISOString(),
      fim: dataFim.toISOString()
    });

    const bilhetesPeriodo = await prisma.bilhete.findMany({
      where: {
        createdAt: {
          gte: dataInicio,
          lte: dataFim
        }
      },
      include: {
        palpites: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📋 Encontrados ${bilhetesPeriodo.length} bilhetes no período`);

    // 2. BUSCAR PIX PENDENTES ESPECIFICAMENTE
    const pixPendentes = await prisma.bilhete.findMany({
      where: {
        status: 'PENDENTE',
        createdAt: {
          gte: dataInicio,
          lte: dataFim
        }
      },
      include: {
        palpites: true
      }
    });

    console.log(`⏳ ${pixPendentes.length} bilhetes pendentes no período`);

    // 3. BUSCAR LOGS DE WEBHOOK NO PERÍODO
    const webhookLogs = await prisma.webhookLog.findMany({
      where: {
        createdAt: {
          gte: dataInicio,
          lte: dataFim
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📨 ${webhookLogs.length} webhooks recebidos no período`);

    // 4. VERIFICAR NA EFI TODOS OS PIX PENDENTES
    const resultadosVerificacao = [];

    for (const bilhete of pixPendentes) {
      if (!bilhete.txid) {
        resultadosVerificacao.push({
          bilheteId: bilhete.id,
          erro: 'TXID não encontrado',
          createdAt: bilhete.createdAt
        });
        continue;
      }

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
        if (isSandbox) {
          const certificatePath = path.resolve('./certs/certificado-efi.p12');
          if (fs.existsSync(certificatePath) && process.env.EFI_CERTIFICATE_PASSPHRASE) {
            efiConfig.certificate = certificatePath;
            efiConfig.passphrase = process.env.EFI_CERTIFICATE_PASSPHRASE;
          }
        }

        const efipay = new EfiPay(efiConfig);
        const pixResponse = await efipay.pixDetailCharge([], { txid: bilhete.txid });

        console.log(`📋 Status na EFI para ${bilhete.txid}: ${pixResponse.status}`);

        resultadosVerificacao.push({
          bilheteId: bilhete.id,
          txid: bilhete.txid,
          statusBanco: bilhete.status,
          statusEfi: pixResponse.status,
          createdAt: bilhete.createdAt,
          valor: bilhete.valorTotal,
          whatsapp: bilhete.whatsapp,
          devePagar: pixResponse.status === 'CONCLUIDA' && bilhete.status === 'PENDENTE'
        });

        // Se está pago na EFI mas pendente no banco, atualizar
        if (pixResponse.status === 'CONCLUIDA' && bilhete.status === 'PENDENTE') {
          console.log(`✅ Atualizando bilhete ${bilhete.id} para PAGO`);

          await prisma.bilhete.update({
            where: { id: bilhete.id },
            data: { status: 'PAGO' }
          });

          // Atualizar palpites
          await prisma.palpite.updateMany({
            where: { bilheteId: bilhete.id },
            data: { status: 'pago' }
          });
        }

      } catch (efiError) {
        console.error(`❌ Erro ao verificar PIX ${bilhete.txid}:`, efiError);
        resultadosVerificacao.push({
          bilheteId: bilhete.id,
          txid: bilhete.txid,
          erro: efiError instanceof Error ? efiError.message : 'Erro na EFI',
          createdAt: bilhete.createdAt
        });
      }
    }

    // 5. BUSCAR PIX QUE PODEM TER SIDO PAGOS MAS NÃO PROCESSADOS
    const pixNaoProcessados = await prisma.pixPagamento.findMany({
      where: {
        createdAt: {
          gte: dataInicio,
          lte: dataFim
        },
        status: 'ATIVA'
      }
    });

    return res.status(200).json({
      success: true,
      periodo: {
        inicio: dataInicio.toISOString(),
        fim: dataFim.toISOString()
      },
      resumo: {
        totalBilhetes: bilhetesPeriodo.length,
        bilhetesPendentes: pixPendentes.length,
        webhooksRecebidos: webhookLogs.length,
        pixNaoProcessados: pixNaoProcessados.length
      },
      bilhetesPeriodo: bilhetesPeriodo.map(b => ({
        id: b.id,
        status: b.status,
        valor: b.valorTotal,
        whatsapp: b.whatsapp,
        txid: b.txid,
        createdAt: b.createdAt,
        palpites: b.palpites?.length || 0
      })),
      pixPendentes: pixPendentes.map(b => ({
        id: b.id,
        txid: b.txid,
        valor: b.valorTotal,
        whatsapp: b.whatsapp,
        createdAt: b.createdAt
      })),
      webhookLogs: webhookLogs.map(w => ({
        id: w.id,
        evento: w.evento,
        txid: w.txid,
        processado: w.processado,
        createdAt: w.createdAt,
        dados: w.dados
      })),
      verificacaoEfi: resultadosVerificacao,
      pixNaoProcessados: pixNaoProcessados.map(p => ({
        id: p.id,
        txid: p.txid,
        status: p.status,
        valor: p.valor,
        whatsapp: p.whatsapp,
        createdAt: p.createdAt
      }))
    });

  } catch (error) {
    console.error('❌ Erro na investigação:', error);
    return res.status(500).json({
      error: 'Erro na investigação',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  } finally {
    await prisma.$disconnect();
  }
}