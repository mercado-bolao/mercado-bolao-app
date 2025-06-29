
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
    // 1. Buscar o concurso 03
    const concurso03 = await prisma.concurso.findFirst({
      where: { numero: 3 }
    });

    if (!concurso03) {
      return res.status(404).json({ error: "Concurso 03 não encontrado" });
    }

    // 2. Buscar jogos do concurso 03
    const jogos = await prisma.jogo.findMany({
      where: { concursoId: concurso03.id },
      select: { id: true, mandante: true, visitante: true }
    });

    // 3. Contar palpites usando diferentes métodos
    const contagem1 = await prisma.palpite.count({
      where: { concursoId: concurso03.id }
    });

    const contagem2 = await prisma.palpite.count({
      where: {
        jogo: {
          concursoId: concurso03.id
        }
      }
    });

    // 4. Buscar todos os palpites relacionados aos jogos
    const palpitesTodos = await prisma.palpite.findMany({
      where: {
        jogoId: {
          in: jogos.map(j => j.id)
        }
      },
      select: {
        id: true,
        nome: true,
        whatsapp: true,
        concursoId: true,
        jogoId: true
      }
    });

    // 5. Agrupar por usuário
    const usuariosUnicos = new Set();
    palpitesTodos.forEach(p => {
      usuariosUnicos.add(`${p.nome}-${p.whatsapp}`);
    });

    // 6. Verificar se há palpites com concursoId diferente
    const palpitesComConcursoErrado = palpitesTodos.filter(p => p.concursoId !== concurso03.id);

    return res.status(200).json({
      concurso: {
        id: concurso03.id,
        numero: concurso03.numero
      },
      jogos: {
        total: jogos.length,
        ids: jogos.map(j => j.id)
      },
      palpites: {
        totalPorConcursoId: contagem1,
        totalPorJogoRelacao: contagem2,
        totalEncontrados: palpitesTodos.length,
        usuariosUnicos: usuariosUnicos.size
      },
      inconsistencias: {
        palpitesComConcursoErrado: palpitesComConcursoErrado.length,
        exemplos: palpitesComConcursoErrado.slice(0, 5)
      },
      analise: {
        problema: contagem1 !== palpitesTodos.length ? "Há palpites com concursoId incorreto" : "Contagem correta"
      }
    });
  } catch (error: any) {
    console.error('Erro no debug:', error);
    return res.status(500).json({ error: "Erro no debug", details: error.message });
  }
}
