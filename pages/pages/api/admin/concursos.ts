import { prisma } from "../../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    try {
      // Buscar concursos básicos
      const concursos = await prisma.concurso.findMany({
        orderBy: { dataInicio: "desc" },
      });

      // Para cada concurso, buscar contagens precisas usando uma abordagem diferente
      const concursosComContagem = await Promise.all(
        concursos.map(async (concurso) => {
          // Contar jogos diretamente relacionados ao concurso
          const totalJogos = await prisma.jogo.count({
            where: { concursoId: concurso.id }
          });

          // Contar bilhetes únicos (usuários únicos que fizeram palpites neste concurso)
          const bilhetesUnicos = await prisma.palpite.groupBy({
            by: ['nome', 'whatsapp'],
            where: {
              jogo: {
                concursoId: concurso.id
              }
            },
            _count: {
              id: true
            }
          });

          // Contar palpites totais baseado nos IDs dos jogos
          const totalPalpites = await prisma.palpite.count({
            where: { 
              jogo: {
                concursoId: concurso.id
              }
            }
          });

          return {
            ...concurso,
            _count: {
              jogos: totalJogos,
              palpites: totalPalpites,
              bilhetes: bilhetesUnicos.length,
            },
          };
        })
      );

      return res.status(200).json(concursosComContagem);
    } catch (error) {
      console.error('Erro ao buscar concursos:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  if (req.method === "POST") {
    const { nome, numero, dataInicio, dataFim, status, premioEstimado, fechamentoPalpites } = req.body;

    try {
      const concurso = await prisma.concurso.create({
        data: {
          nome,
          numero: parseInt(numero),
          dataInicio: new Date(dataInicio),
          dataFim: new Date(dataFim),
          status,
          premioEstimado: premioEstimado ? parseFloat(premioEstimado) : null,
          fechamentoPalpites: fechamentoPalpites ? new Date(fechamentoPalpites) : null,
        },
      });
      return res.status(201).json(concurso);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao criar concurso" });
    }
  }

  if (req.method === "PUT") {
    const { id, nome, numero, dataInicio, dataFim, status, premioEstimado, fechamentoPalpites } = req.body;

    try {
      const concurso = await prisma.concurso.update({
        where: { id },
        data: {
          ...(nome && { nome }),
          ...(numero && { numero: parseInt(numero) }),
          ...(dataInicio && { dataInicio: new Date(dataInicio) }),
          ...(dataFim && { dataFim: new Date(dataFim) }),
          ...(status && { status }),
          ...(premioEstimado !== undefined && { premioEstimado: premioEstimado ? parseFloat(premioEstimado) : null }),
          ...(fechamentoPalpites !== undefined && { fechamentoPalpites: fechamentoPalpites ? new Date(fechamentoPalpites) : null }),
        },
      });
      return res.status(200).json(concurso);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao atualizar concurso" });
    }
  }

  return res.status(405).json({ error: "Método não permitido" });
}