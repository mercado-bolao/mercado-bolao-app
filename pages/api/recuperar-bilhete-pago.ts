
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Definir headers para JSON
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { whatsapp, txid } = req.query;

    if (!whatsapp && !txid) {
      return res.status(400).json({
        success: false,
        error: 'WhatsApp ou TXID é obrigatório'
      });
    }

    console.log('🔍 Buscando bilhete pago:', { whatsapp, txid });

    // Buscar bilhete pago
    let bilhete;
    
    if (txid) {
      bilhete = await prisma.bilhete.findFirst({
        where: { 
          txid: txid as string,
          status: 'PAGO'
        },
        include: {
          palpites: {
            include: {
              jogo: {
                include: {
                  concurso: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (whatsapp) {
      bilhete = await prisma.bilhete.findFirst({
        where: { 
          whatsapp: whatsapp as string,
          status: 'PAGO'
        },
        include: {
          palpites: {
            include: {
              jogo: {
                include: {
                  concurso: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (!bilhete) {
      return res.status(404).json({
        success: false,
        error: 'Nenhum bilhete pago encontrado'
      });
    }

    console.log('✅ Bilhete pago encontrado:', {
      id: bilhete.id,
      status: bilhete.status,
      whatsapp: bilhete.whatsapp,
      valorTotal: bilhete.valorTotal
    });

    // Formatar dados para o comprovante
    const bilheteConfirmado = {
      id: bilhete.id,
      txid: bilhete.txid,
      valorTotal: bilhete.valorTotal,
      whatsapp: bilhete.whatsapp,
      nome: bilhete.nome,
      status: bilhete.status,
      createdAt: bilhete.createdAt.toISOString(),
      palpites: bilhete.palpites.map(palpite => ({
        id: palpite.id,
        resultado: palpite.resultado,
        jogo: {
          mandante: palpite.jogo.mandante,
          visitante: palpite.jogo.visitante,
          horario: palpite.jogo.horario.toISOString()
        }
      })),
      concurso: bilhete.palpites.length > 0 ? {
        nome: bilhete.palpites[0].jogo.concurso.nome,
        numero: bilhete.palpites[0].jogo.concurso.numero
      } : null
    };

    return res.status(200).json({
      success: true,
      bilhete: bilheteConfirmado,
      redirectTo: '/bilhete-confirmado'
    });

  } catch (error) {
    console.error('❌ Erro ao recuperar bilhete pago:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  } finally {
    await prisma.$disconnect();
  }
}
