import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { APIResponse } from '../../types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse>
) {
  try {
    // Contar jogos por concurso
    const jogos = await prisma.jogo.groupBy({
      by: ['concursoId'],
      _count: {
        id: true
      },
      orderBy: {
        concursoId: 'asc'
      }
    });

    // Buscar detalhes dos concursos
    const concursos = await prisma.concurso.findMany({
      where: {
        id: {
          in: jogos.map(j => j.concursoId)
        }
      },
      select: {
        id: true,
        numero: true,
        nome: true
      }
    });

    // Combinar dados
    const resultado = jogos.map(jogo => {
      const concurso = concursos.find(c => c.id === jogo.concursoId);
      return {
        concursoId: jogo.concursoId,
        concursoNumero: concurso?.numero,
        concursoNome: concurso?.nome,
        quantidadeJogos: jogo._count.id
      };
    });

    return res.status(200).json({
      success: true,
      data: resultado
    });

  } catch (error) {
    const err = error as Error;
    return res.status(500).json({
      success: false,
      error: 'Erro ao verificar jogos',
      details: err.message
    });
  }
}
