
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

    // 3. Contar palpites corretos (através da relação com jogo)
    const palpitesCorretos = await prisma.palpite.count({
      where: {
        jogo: {
          concursoId: concurso03.id
        }
      }
    });

    // 4. Contar palpites únicos por usuário
    const usuariosUnicos = await prisma.palpite.groupBy({
      by: ['nome', 'whatsapp'],
      where: {
        jogo: {
          concursoId: concurso03.id
        }
      },
      _count: {
        id: true
      }
    });

    // 5. Buscar alguns exemplos
    const exemplosPalpites = await prisma.palpite.findMany({
      where: {
        jogo: {
          concursoId: concurso03.id
        }
      },
      take: 10,
      select: {
        id: true,
        nome: true,
        whatsapp: true,
        resultado: true,
        jogo: {
          select: {
            mandante: true,
            visitante: true
          }
        }
      }
    });

    return res.status(200).json({
      concurso: {
        id: concurso03.id,
        numero: concurso03.numero,
        nome: concurso03.nome
      },
      jogos: {
        total: jogos.length,
        lista: jogos
      },
      palpites: {
        totalCorreto: palpitesCorretos,
        usuariosUnicos: usuariosUnicos.length,
        exemplos: exemplosPalpites
      },
      resumo: {
        totalJogos: jogos.length,
        totalPalpites: palpitesCorretos,
        totalUsuarios: usuariosUnicos.length,
        mediaPalpitesPorUsuario: usuariosUnicos.length > 0 ? (palpitesCorretos / usuariosUnicos.length).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('Erro no debug count:', error);
    return res.status(500).json({ error: "Erro no debug count", details: error.message });
  }
}
