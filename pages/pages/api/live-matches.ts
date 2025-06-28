
import { prisma } from "../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { concursoId } = req.query;

  if (!concursoId) {
    return res.status(400).json({ error: "ID do concurso é obrigatório" });
  }

  try {
    // Buscar jogos do concurso que ainda não foram finalizados
    const jogosEmAndamento = await prisma.jogo.findMany({
      where: {
        concursoId: concursoId as string,
        resultado: null // Apenas jogos sem resultado definido
      },
      select: {
        id: true,
        mandante: true,
        visitante: true,
        horario: true,
        fotoMandante: true,
        fotoVisitante: true
      },
      orderBy: { horario: "asc" }
    });

    // Se não há jogos em andamento, retornar array vazio
    if (jogosEmAndamento.length === 0) {
      return res.status(200).json([]);
    }

    // Para cada jogo em andamento, calcular as percentuais de palpites
    const jogosComPercentuais = await Promise.all(
      jogosEmAndamento.map(async (jogo) => {
        // Buscar todos os palpites para este jogo
        const palpites = await prisma.palpite.findMany({
          where: {
            jogoId: jogo.id
          },
          select: {
            resultado: true
          }
        });

        // Contar palpites por resultado
        let totalPalpites = palpites.length;
        let palpitesCasa = 0;
        let palpitesEmpate = 0;
        let palpitesFora = 0;

        palpites.forEach(palpite => {
          switch(palpite.resultado) {
            case 'C':
            case '1':
              palpitesCasa++;
              break;
            case 'E':
            case 'X':
              palpitesEmpate++;
              break;
            case 'F':
            case '2':
              palpitesFora++;
              break;
          }
        });

        // Calcular percentuais
        const percentualCasa = totalPalpites > 0 ? ((palpitesCasa / totalPalpites) * 100).toFixed(1) : "0.0";
        const percentualEmpate = totalPalpites > 0 ? ((palpitesEmpate / totalPalpites) * 100).toFixed(1) : "0.0";
        const percentualFora = totalPalpites > 0 ? ((palpitesFora / totalPalpites) * 100).toFixed(1) : "0.0";

        return {
          id: jogo.id,
          mandante: jogo.mandante,
          visitante: jogo.visitante,
          horario: jogo.horario,
          fotoMandante: jogo.fotoMandante,
          fotoVisitante: jogo.fotoVisitante,
          totalPalpites,
          palpitesCasa,
          palpitesEmpate,
          palpitesFora,
          percentualCasa,
          percentualEmpate,
          percentualFora,
          status: 'em_andamento'
        };
      })
    );

    return res.status(200).json(jogosComPercentuais);

  } catch (error) {
    console.error("Erro ao buscar jogos ao vivo:", error);
    return res.status(500).json({ 
      error: "Erro ao buscar jogos ao vivo",
      details: error.message 
    });
  }
}
