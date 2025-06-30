import { prisma } from "../../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from '../../../lib/auth-middleware';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "ID do jogo é obrigatório" });
  }

  try {
    // Verificar se o jogo existe
    const jogo = await prisma.jogo.findUnique({
      where: { id },
      include: {
        palpites: true
      }
    });

    if (!jogo) {
      return res.status(404).json({ error: "Jogo não encontrado" });
    }

    // Deletar todos os palpites relacionados primeiro
    if (jogo.palpites.length > 0) {
      await prisma.palpite.deleteMany({
        where: { jogoId: id }
      });
    }

    // Deletar o jogo
    await prisma.jogo.delete({
      where: { id },
    });

    return res.status(200).json({
      message: "Jogo deletado com sucesso",
      palpitesRemovidos: jogo.palpites.length
    });
  } catch (error: any) {
    console.error('Erro ao deletar jogo:', error);
    return res.status(500).json({
      error: "Erro ao deletar jogo",
      details: error.message
    });
  }
}

export default withAuth(handler);