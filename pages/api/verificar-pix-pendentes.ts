import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('🔍 Verificando PIX pendentes automaticamente...');

    // Buscar bilhetes pendentes com TXID dos últimos 10 minutos
    const bilhetesPendentes = await prisma.bilhete.findMany({
      where: {
        status: 'PENDENTE',
        txid: { not: null },
        createdAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000) // últimos 10 minutos
        }
      },
      include: {
        pix: true,
        palpites: true
      }
    });

    console.log(`📊 Encontrados ${bilhetesPendentes.length} bilhetes pendentes para verificar`);

    let atualizados = 0;
    const resultados = [];

    for (const bilhete of bilhetesPendentes) {
      if (!bilhete.txid) continue;

      // Validar formato do TXID antes de consultar
      const txidPattern = /^[a-zA-Z0-9]{26,35}$/;
      if (!txidPattern.test(bilhete.txid)) {
        console.log(`⚠️ TXID inválido ignorado: ${bilhete.txid} (${bilhete.txid.length} caracteres)`);
        resultados.push({
          bilheteId: bilhete.id,
          txid: bilhete.txid,
          erro: 'TXID com formato inválido'
        });
        continue;
      }

      console.log(`🔍 Verificando TXID: ${bilhete.txid}`);

      try {
        // Verificar status na EFÍ
        const efiResponse = await fetch(`${req.headers.origin}/api/admin/verificar-status-efi?txid=${bilhete.txid}`);
        const efiData = await efiResponse.json();

        if (efiData.success) {
          resultados.push({
            bilheteId: bilhete.id,
            txid: bilhete.txid,
            statusAnterior: bilhete.status,
            statusEfi: efiData.status,
            atualizado: efiData.status === 'CONCLUIDA'
          });

          if (efiData.status === 'CONCLUIDA') {
            atualizados++;
            console.log(`✅ PIX confirmado como pago: ${bilhete.txid}`);
          }
        }

      } catch (error) {
        console.error(`❌ Erro ao verificar PIX ${bilhete.txid}:`, error);
        resultados.push({
          bilheteId: bilhete.id,
          txid: bilhete.txid,
          erro: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    console.log(`✅ Verificação concluída: ${atualizados} PIX atualizados`);

    return res.status(200).json({
      success: true,
      message: `Verificação concluída: ${atualizados} PIX atualizados`,
      bilhetesVerificados: bilhetesPendentes.length,
      pixAtualizados: atualizados,
      resultados
    });

  } catch (error) {
    console.error('❌ Erro ao verificar PIX pendentes:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao verificar PIX pendentes',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}