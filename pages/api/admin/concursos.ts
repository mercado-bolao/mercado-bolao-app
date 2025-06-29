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
      // Validar campos obrigatórios
      if (!nome || !numero || !dataInicio || !dataFim || !status) {
        return res.status(400).json({
          error: "Campos obrigatórios faltando",
          details: "nome, numero, dataInicio, dataFim e status são obrigatórios"
        });
      }

      // Validar e converter datas
      let dataInicioObj: Date;
      let dataFimObj: Date;
      let fechamentoPalpitesObj: Date | null = null;

      try {
        dataInicioObj = new Date(dataInicio);
        dataFimObj = new Date(dataFim);
        if (fechamentoPalpites) {
          fechamentoPalpitesObj = new Date(fechamentoPalpites);
        }

        // Validar se as datas são válidas
        if (isNaN(dataInicioObj.getTime())) {
          throw new Error("Data de início inválida");
        }
        if (isNaN(dataFimObj.getTime())) {
          throw new Error("Data de fim inválida");
        }
        if (fechamentoPalpitesObj && isNaN(fechamentoPalpitesObj.getTime())) {
          throw new Error("Data de fechamento de palpites inválida");
        }

        // Validar a ordem das datas
        if (dataFimObj <= dataInicioObj) {
          throw new Error("A data de fim deve ser posterior à data de início");
        }
        if (fechamentoPalpitesObj && fechamentoPalpitesObj <= dataInicioObj) {
          throw new Error("A data de fechamento de palpites deve ser posterior à data de início");
        }
        if (fechamentoPalpitesObj && fechamentoPalpitesObj >= dataFimObj) {
          throw new Error("A data de fechamento de palpites deve ser anterior à data de fim");
        }
      } catch (error) {
        return res.status(400).json({
          error: "Erro na validação das datas",
          details: error instanceof Error ? error.message : "Formato de data inválido"
        });
      }

      const concurso = await prisma.concurso.create({
        data: {
          nome,
          numero: parseInt(numero),
          dataInicio: dataInicioObj,
          dataFim: dataFimObj,
          status,
          premioEstimado: premioEstimado ? parseFloat(premioEstimado) : null,
          fechamentoPalpites: fechamentoPalpitesObj,
        },
      });
      return res.status(201).json(concurso);
    } catch (error) {
      console.error('Erro ao criar concurso:', error);
      return res.status(500).json({
        error: "Erro ao criar concurso",
        details: error instanceof Error ? error.message : "Erro interno do servidor"
      });
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