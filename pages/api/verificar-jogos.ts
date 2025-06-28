
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔍 Verificando jogos no banco...');
    
    // Buscar todos os jogos
    const jogos = await prisma.jogo.findMany({
      include: {
        concurso: {
          select: {
            numero: true,
            nome: true
          }
        }
      },
      orderBy: { horario: 'desc' }
    });

    // Contar por concurso
    const jogosPorConcurso = await prisma.jogo.groupBy({
      by: ['concursoId'],
      _count: {
        id: true
      },
      include: {
        concurso: {
          select: {
            numero: true,
            nome: true
          }
        }
      }
    });

    const totalJogos = await prisma.jogo.count();

    console.log(`📊 Total de jogos: ${totalJogos}`);
    console.log(`🎯 Jogos encontrados:`, jogos.map(j => ({
      id: j.id,
      mandante: j.mandante,
      visitante: j.visitante,
      horario: j.horario,
      concurso: j.concurso?.numero,
      resultado: j.resultado
    })));

    return res.status(200).json({
      totalJogos,
      jogos: jogos.map(j => ({
        id: j.id,
        mandante: j.mandante,
        visitante: j.visitante,
        horario: j.horario,
        resultado: j.resultado,
        concurso: {
          numero: j.concurso?.numero,
          nome: j.concurso?.nome
        }
      })),
      jogosPorConcurso
    });
  } catch (error) {
    console.error('❌ Erro ao verificar jogos:', error);
    return res.status(500).json({ error: error.message });
  }
}
