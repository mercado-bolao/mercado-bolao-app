
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { txid, bilheteId } = req.query;

  if (!txid && !bilheteId) {
    return res.status(400).json({
      error: 'TXID ou bilheteId é obrigatório'
    });
  }

  try {
    console.log('🔍 Consultando resultado do teste...');

    // Buscar bilhete
    let bilhete;
    if (bilheteId) {
      bilhete = await prisma.bilhete.findUnique({
        where: { id: bilheteId as string },
        include: {
          palpites: {
            include: {
              jogo: {
                select: {
                  mandante: true,
                  visitante: true
                }
              }
            }
          }
        }
      });
    } else if (txid) {
      bilhete = await prisma.bilhete.findFirst({
        where: { txid: txid as string },
        include: {
          palpites: {
            include: {
              jogo: {
                select: {
                  mandante: true,
                  visitante: true
                }
              }
            }
          }
        }
      });
    }

    if (!bilhete) {
      return res.status(404).json({
        success: false,
        error: 'Bilhete de teste não encontrado'
      });
    }

    // Buscar PIX associado
    const pix = await prisma.pixPagamento.findFirst({
      where: { txid: bilhete.txid || undefined }
    });

    // Buscar logs de webhook
    const webhookLogs = await prisma.webhookLog.findMany({
      where: { txid: bilhete.txid || undefined },
      orderBy: { createdAt: 'desc' }
    });

    // Análise do status
    const analise = {
      bilheteStatus: bilhete.status,
      pixStatus: pix?.status || 'NÃO_ENCONTRADO',
      palpitesStatus: bilhete.palpites.map(p => ({
        jogo: `${p.jogo.mandante} x ${p.jogo.visitante}`,
        palpite: p.palpite,
        status: p.status
      })),
      webhooksRecebidos: webhookLogs.length,
      webhooksProcessados: webhookLogs.filter(w => w.processado).length,
      testeCompleto: bilhete.status === 'PAGO' && 
                     pix?.status === 'PAGA' && 
                     bilhete.palpites.every(p => p.status === 'pago')
    };

    console.log('📊 Análise do teste:', analise);

    return res.status(200).json({
      success: true,
      dados: {
        bilhete: {
          id: bilhete.id,
          orderId: bilhete.orderId,
          txid: bilhete.txid,
          status: bilhete.status,
          valor: bilhete.valorTotal,
          whatsapp: bilhete.whatsapp,
          expiresAt: bilhete.expiresAt.toISOString(),
          createdAt: bilhete.createdAt.toISOString()
        },
        pix: pix ? {
          id: pix.id,
          status: pix.status,
          valor: pix.valor,
          ambiente: pix.ambiente,
          createdAt: pix.createdAt.toISOString()
        } : null,
        palpites: bilhete.palpites.map(p => ({
          id: p.id,
          jogo: `${p.jogo.mandante} x ${p.jogo.visitante}`,
          palpite: p.palpite,
          status: p.status,
          valor: p.valor
        })),
        webhooks: webhookLogs.map(w => ({
          id: w.id,
          evento: w.evento,
          processado: w.processado,
          createdAt: w.createdAt.toISOString()
        }))
      },
      analise: analise,
      recomendacoes: analise.testeCompleto ? 
        ['✅ Teste passou! Sistema está funcionando corretamente.'] :
        [
          '⚠️ Teste não passou completamente.',
          bilhete.status !== 'PAGO' ? '- Bilhete não foi marcado como PAGO' : '',
          pix?.status !== 'PAGA' ? '- PIX não foi marcado como PAGA' : '',
          !bilhete.palpites.every(p => p.status === 'pago') ? '- Nem todos os palpites foram marcados como pagos' : '',
          webhookLogs.length === 0 ? '- Nenhum webhook foi recebido' : ''
        ].filter(Boolean)
    });

  } catch (error) {
    console.error('❌ Erro na consulta do teste:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao consultar teste',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
