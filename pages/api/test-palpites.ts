
import { prisma } from "../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    // Buscar todos os palpites
    const palpites = await prisma.palpite.findMany({
      include: {
        jogo: {
          include: {
            concurso: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Contar total
    const total = await prisma.palpite.count();

    return res.status(200).json({
      total,
      palpites: palpites.slice(0, 10), // Últimos 10 palpites
      message: `Total de ${total} palpites encontrados`
    });
  } catch (error) {
    console.error('Erro ao buscar palpites:', error);
    return res.status(500).json({ error: "Erro ao buscar palpites", details: error.message });
  }
}
