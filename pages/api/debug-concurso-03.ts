
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
    console.log('=== DEBUG DETALHADO CONCURSO 03 ===');

    // 1. Buscar o concurso 03
    const concurso03 = await prisma.concurso.findFirst({
      where: { numero: 3 }
    });

    if (!concurso03) {
      return res.status(404).json({ error: "Concurso 03 não encontrado" });
    }

    console.log('Concurso 03 ID:', concurso03.id);

    // 2. Contar palpites usando diferentes métodos
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

    // 3. Buscar jogos do concurso 03
    const jogosConcurso03 = await prisma.jogo.findMany({
      where: { concursoId: concurso03.id },
      select: { id: true, mandante: true, visitante: true }
    });

    // 4. Contar palpites por jogo
    const palpitesPorJogo = await Promise.all(
      jogosConcurso03.map(async (jogo) => {
        const count = await prisma.palpite.count({
          where: { jogoId: jogo.id }
        });
        return {
          jogoId: jogo.id,
          jogo: `${jogo.mandante} vs ${jogo.visitante}`,
          palpites: count
        };
      })
    );

    // 5. Verificar se há palpites com concursoId incorreto
    const palpitesComConcursoErrado = await prisma.palpite.findMany({
      where: {
        jogo: {
          concursoId: concurso03.id
        },
        NOT: {
          concursoId: concurso03.id
        }
      },
      select: {
        id: true,
        nome: true,
        concursoId: true,
        jogoId: true,
        jogo: {
          select: {
            mandante: true,
            visitante: true,
            concursoId: true
          }
        }
      }
    });

    // 6. Contar usuários únicos que fizeram palpites
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

    // 7. Total correto baseado nos jogos
    const totalCorreto = palpitesPorJogo.reduce((acc, curr) => acc + curr.palpites, 0);

    // 8. Buscar alguns exemplos de palpites
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
        concursoId: true,
        jogoId: true,
        resultado: true,
        jogo: {
          select: {
            mandante: true,
            visitante: true,
            concursoId: true
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
      contagens: {
        palpitesPorConcursoId: contagem1,
        palpitesPorJogoRelacao: contagem2,
        totalCorretoBaseadoEmJogos: totalCorreto
      },
      jogos: {
        total: jogosConcurso03.length,
        lista: jogosConcurso03
      },
      palpitesPorJogo,
      usuariosUnicos: {
        quantidade: usuariosUnicos.length,
        detalhes: usuariosUnicos.map(u => ({
          nome: u.nome,
          whatsapp: u.whatsapp,
          totalPalpites: u._count.id
        }))
      },
      palpitesComConcursoErrado: {
        quantidade: palpitesComConcursoErrado.length,
        exemplos: palpitesComConcursoErrado
      },
      exemplosPalpites,
      analise: {
        diferencaContagem: contagem1 - totalCorreto,
        problemaIdentificado: contagem1 !== totalCorreto ? 'Há inconsistência na contagem' : 'Contagem está correta'
      }
    });
  } catch (error: any) {
    console.error('Erro no debug do concurso 03:', error);
    return res.status(500).json({ error: "Erro no debug", details: error.message });
  }
}
