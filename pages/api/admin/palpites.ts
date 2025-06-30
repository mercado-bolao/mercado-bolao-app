import { prisma } from "../../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from '../../../lib/auth-middleware';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { concursoId, jogoId, usuario } = req.query;

  try {
    const where: any = {};

    // Filtro por concurso
    if (concursoId && concursoId !== "") {
      where.jogo = {
        concursoId: concursoId as string
      };
    }

    // Filtro por jogo específico
    if (jogoId && jogoId !== "") {
      where.jogoId = jogoId as string;
    }

    // Filtro por usuário (nome ou whatsapp)
    if (usuario && usuario !== "") {
      where.OR = [
        { nome: { contains: usuario as string, mode: "insensitive" } },
        { whatsapp: { contains: usuario as string, mode: "insensitive" } },
      ];
    }

    console.log('Filtros aplicados:', where);

    const palpites = await prisma.palpite.findMany({
      where,
      include: {
        jogo: {
          include: {
            concurso: true,
          },
        },
      },
      orderBy: [
        { jogo: { concurso: { numero: "desc" } } },
        { jogo: { horario: "asc" } },
        { nome: "asc" }
      ],
    });

    console.log(`Encontrados ${palpites.length} palpites`);

    return res.status(200).json({
      success: true,
      palpites: palpites,
      total: palpites.length
    });
  } catch (error) {
    console.error('Erro ao buscar palpites:', error);
    return res.status(500).json({
      success: false,
      error: "Erro ao buscar palpites",
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

export default withAuth(handler);