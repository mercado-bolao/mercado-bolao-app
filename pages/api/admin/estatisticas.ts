import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { withAuth } from '../../../lib/auth-middleware';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const totalConcursos = await prisma.concurso.count();
    const totalJogos = await prisma.jogo.count();
    const totalPalpites = await prisma.palpite.count();

    const concursosAtivos = await prisma.concurso.count({
      where: { status: 'ativo' }
    });

    const usuariosUnicos = await prisma.palpite.findMany({
      select: { nome: true, whatsapp: true },
      distinct: ['whatsapp']
    });

    const estatisticas = {
      totalConcursos,
      totalJogos,
      totalPalpites,
      concursosAtivos,
      totalUsuarios: usuariosUnicos.length
    };

    return res.status(200).json(estatisticas);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export default withAuth(handler);
