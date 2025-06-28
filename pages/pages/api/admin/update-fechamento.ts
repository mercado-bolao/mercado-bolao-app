
import { prisma } from "../../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { concursoId, fechamentoPalpites } = req.body;

  try {
    // First, find the concurso by numero to get its id
    const concursoExistente = await prisma.concurso.findFirst({
      where: { numero: 3 }
    });

    if (!concursoExistente) {
      return res.status(404).json({ error: "Concurso não encontrado" });
    }

    const concurso = await prisma.concurso.update({
      where: { 
        id: concursoExistente.id
      },
      data: {
        fechamentoPalpites: new Date(fechamentoPalpites)
      },
    });

    return res.status(200).json({ 
      success: true, 
      concurso,
      message: 'Fechamento de palpites atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar fechamento:', error);
    return res.status(500).json({ error: "Erro ao atualizar fechamento de palpites" });
  }
}
