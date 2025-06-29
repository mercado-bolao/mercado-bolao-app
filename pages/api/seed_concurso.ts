import { prisma } from "../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const concurso = await prisma.concurso.create({
      data: {
        numero: Math.floor(Math.random() * 1000) + 1,
        dataInicio: new Date(),
        dataFim: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias depois
        status: 'ativo'
      }
    });

    const jogos = [
      { 
        mandante: 'Palmeiras', 
        visitante: 'Corinthians',
        fotoMandante: 'https://logoeps.com/wp-content/uploads/2013/03/palmeiras-vector-logo.png',
        fotoVisitante: 'https://logoeps.com/wp-content/uploads/2013/03/corinthians-vector-logo.png'
      },
      { 
        mandante: 'Flamengo', 
        visitante: 'Botafogo',
        fotoMandante: 'https://logoeps.com/wp-content/uploads/2013/03/flamengo-vector-logo.png',
        fotoVisitante: 'https://logoeps.com/wp-content/uploads/2013/03/botafogo-vector-logo.png'
      },
      { 
        mandante: 'Grêmio', 
        visitante: 'Internacional',
        fotoMandante: 'https://logoeps.com/wp-content/uploads/2013/03/gremio-vector-logo.png',
        fotoVisitante: 'https://logoeps.com/wp-content/uploads/2013/03/internacional-vector-logo.png'
      },
      { 
        mandante: 'São Paulo', 
        visitante: 'Santos',
        fotoMandante: 'https://logoeps.com/wp-content/uploads/2013/03/sao-paulo-vector-logo.png',
        fotoVisitante: 'https://logoeps.com/wp-content/uploads/2013/03/santos-vector-logo.png'
      }
    ];

    for (const jogo of jogos) {
      await prisma.jogo.create({
        data: {
          mandante: jogo.mandante,
          visitante: jogo.visitante,
          horario: new Date(Date.now() + 1 * 60 * 60 * 1000), // daqui 1h
          concursoId: concurso.id,
          fotoMandante: jogo.fotoMandante,
          fotoVisitante: jogo.fotoVisitante
        }
      });
    }

    res.status(200).json({ 
      message: 'Concurso e jogos criados com sucesso!', 
      concurso: concurso 
    });
  } catch (error) {
    console.error('Erro ao criar concurso:', error);
    res.status(500).json({ error: 'Erro ao criar concurso' });
  }
}
