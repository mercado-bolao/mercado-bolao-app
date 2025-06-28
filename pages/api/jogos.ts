
import { prisma } from "../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { concursoId } = req.query;

  if (!concursoId) {
    return res.status(400).json({ error: "concursoId é obrigatório" });
  }

  try {
    const concurso = await prisma.concurso.findUnique({
      where: { id: concursoId as string },
      include: {
        jogos: {
          orderBy: { horario: "asc" },
        },
      },
    });

    if (!concurso) {
      return res.status(404).json({ error: "Concurso não encontrado" });
    }

    res.status(200).json(concurso);
  } catch (error) {
    console.error("Erro ao buscar jogos:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}
