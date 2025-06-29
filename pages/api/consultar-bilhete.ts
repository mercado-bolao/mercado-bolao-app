import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'ID do bilhete é obrigatório'
      });
    }

    console.log('🔍 Consultando bilhete:', id);

    // Buscar bilhete completo
    const bilhete = await prisma.bilhete.findUnique({
      where: { id },
      include: {
        concurso: true,
        palpites: {
          include: {
            jogo: true
          }
        }
      }
    });

    if (!bilhete) {
      return res.status(404).json({
        success: false,
        error: 'Bilhete não encontrado'
      });
    }

    console.log('✅ Bilhete encontrado:', {
      id: bilhete.id,
      status: bilhete.status,
      whatsapp: bilhete.whatsapp,
      valorTotal: bilhete.valorTotal,
      palpites: bilhete.palpites.length
    });

    // Formatar dados para retorno
    const bilheteFormatado = {
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
      concurso: {
        nome: bilhete.concurso.nome,
        numero: bilhete.concurso.numero
      }
    };

    return res.status(200).json({
      success: true,
      bilhete: bilheteFormatado
    });

  } catch (error) {
    console.error('❌ Erro ao consultar bilhete:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  } finally {
    await prisma.$disconnect();
  }
}