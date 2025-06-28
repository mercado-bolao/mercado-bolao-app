import { prisma } from "../../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    // Buscar o concurso 03
    const concurso03 = await prisma.concurso.findFirst({
      where: { numero: 3 }
    });

    if (!concurso03) {
      return res.status(404).json({ error: "Concurso 03 não encontrado" });
    }

    // Atualizar status para ativo
    const concursoAtualizado = await prisma.concurso.update({
      where: { id: concurso03.id },
      data: {
        status: "ativo"
      },
    });

    return res.status(200).json({ 
      success: true, 
      concurso: concursoAtualizado,
      message: 'Status do concurso 03 atualizado para ativo'
    });
  } catch (error) {
    console.error('Erro ao atualizar status do concurso 03:', error);
    return res.status(500).json({ error: "Erro ao atualizar status do concurso" });
  }
}