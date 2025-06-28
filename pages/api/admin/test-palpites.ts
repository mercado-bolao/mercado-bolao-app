import { prisma } from "../../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    // Contar total de palpites
    const totalPalpites = await prisma.palpite.count();

    // Buscar alguns palpites para teste
    const palpitesSimples = await prisma.palpite.findMany({
      take: 10,
      select: {
        id: true,
        nome: true,
        whatsapp: true,
        resultado: true,
        jogoId: true
      }
    });

    // Buscar palpites com relacionamentos
    const palpitesCompletos = await prisma.palpite.findMany({
      take: 5,
      include: {
        jogo: {
          include: {
            concurso: true
          }
        }
      }
    });

    // Verificar concursos disponíveis
    const concursos = await prisma.concurso.findMany({
      select: {
        id: true,
        numero: true,
        _count: {
          select: {
            palpites: true
          }
        }
      }
    });

    return res.status(200).json({
      totalPalpites,
      palpitesSimples,
      palpitesCompletos,
      concursos,
      message: `Total de ${totalPalpites} palpites encontrados no banco de dados`
    });
  } catch (error) {
    console.error('Erro ao testar palpites:', error);
    return res.status(500).json({ error: "Erro ao testar palpites", details: error.message });
  }
}