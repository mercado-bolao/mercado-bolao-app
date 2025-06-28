
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
    // Buscar todos os jogos com resultados definidos
    const jogosComResultado = await prisma.jogo.findMany({
      where: {
        resultado: { not: null }
      },
      select: {
        id: true,
        resultado: true,
        mandante: true,
        visitante: true,
        concurso: {
          select: {
            numero: true
          }
        }
      }
    });

    if (jogosComResultado.length === 0) {
      return res.status(200).json({ 
        ranking: [],
        totalJogos: 0,
        message: "Nenhum jogo finalizado ainda"
      });
    }

    // Buscar todos os palpites desses jogos
    const palpites = await prisma.palpite.findMany({
      where: {
        jogoId: { in: jogosComResultado.map(j => j.id) }
      },
      select: {
        nome: true,
        whatsapp: true,
        jogoId: true,
        resultado: true
      }
    });

    // Calcular acertos por usuário (geral)
    const usuariosMap = new Map<string, {
      nome: string;
      whatsapp: string;
      acertos: number;
      totalPalpites: number;
      percentual: number;
    }>();

    palpites.forEach(palpite => {
      const jogo = jogosComResultado.find(j => j.id === palpite.jogoId);
      if (!jogo) return;

      const chaveUsuario = `${palpite.nome}-${palpite.whatsapp}`;
      
      if (!usuariosMap.has(chaveUsuario)) {
        usuariosMap.set(chaveUsuario, {
          nome: palpite.nome,
          whatsapp: palpite.whatsapp,
          acertos: 0,
          totalPalpites: 0,
          percentual: 0
        });
      }

      const usuario = usuariosMap.get(chaveUsuario)!;
      usuario.totalPalpites++;

      // Verificar se o palpite está correto
      if (palpite.resultado === jogo.resultado) {
        usuario.acertos++;
      }
    });

    // Calcular percentuais e ordenar
    const ranking = Array.from(usuariosMap.values())
      .map(usuario => ({
        ...usuario,
        percentual: usuario.totalPalpites > 0 
          ? (usuario.acertos / usuario.totalPalpites) * 100
          : 0
      }))
      .sort((a, b) => {
        if (b.acertos !== a.acertos) {
          return b.acertos - a.acertos; // Mais acertos primeiro
        }
        if (b.percentual !== a.percentual) {
          return b.percentual - a.percentual; // Maior percentual
        }
        return a.nome.localeCompare(b.nome); // Desempate por nome
      })
      .map((usuario, index) => ({
        posicao: index + 1,
        ...usuario,
        percentualFormatado: usuario.percentual.toFixed(1)
      }));

    return res.status(200).json({
      ranking,
      totalJogos: jogosComResultado.length,
      totalParticipantes: ranking.length
    });

  } catch (error) {
    console.error("Erro ao calcular ranking geral:", error);
    return res.status(500).json({ error: "Erro ao calcular ranking geral" });
  }
}
