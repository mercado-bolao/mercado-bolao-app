import { prisma } from "../../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { concursoId } = req.query;

  if (!concursoId) {
    return res.status(400).json({ error: "ID do concurso é obrigatório" });
  }

  try {
    // Buscar todos os jogos do concurso (finalizados e não finalizados)
    const todosJogos = await prisma.jogo.findMany({
      where: {
        concursoId: concursoId as string,
      },
      select: {
        id: true,
        resultado: true,
        mandante: true,
        visitante: true,
        horario: true,
        fotoMandante: true,
        fotoVisitante: true
      },
      orderBy: { horario: "asc" }
    });

    // Separar jogos finalizados
    const jogosFinalizados = todosJogos.filter(j => j.resultado !== null);

    // Verificar se apostas encerraram
    const concurso = await prisma.concurso.findUnique({
      where: { id: concursoId as string },
      select: { fechamentoPalpites: true, dataFim: true }
    });

    const dataFechamento = concurso?.fechamentoPalpites || concurso?.dataFim;
    const apostasEncerradas = dataFechamento ? new Date() > new Date(dataFechamento) : false;

    // Se não há jogos finalizados E apostas ainda não encerraram
    if (jogosFinalizados.length === 0 && !apostasEncerradas) {
      return res.status(200).json({ 
        ranking: [],
        jogosFinalizados: [],
        todosJogos,
        tabelaPalpites: [],
        distribuicaoPontos: {},
        totalJogos: todosJogos.length,
        totalJogosFinalizados: 0,
        message: "Aguardando encerramento das apostas para exibir o ranking detalhado"
      });
    }

    // Buscar todos os palpites do concurso
    const todosPalpites = await prisma.palpite.findMany({
      where: {
        concursoId: concursoId as string,
      },
      select: {
        nome: true,
        whatsapp: true,
        jogoId: true,
        resultado: true
      }
    });

    // Criar mapa de usuários únicos
    const usuariosMap = new Map<string, {
      nome: string;
      whatsapp: string;
      palpites: { [jogoId: string]: string };
      acertos: number;
      totalPalpitesFinalizados: number;
    }>();

    // Processar todos os palpites
    todosPalpites.forEach(palpite => {
      const chaveUsuario = `${palpite.nome}-${palpite.whatsapp}`;

      if (!usuariosMap.has(chaveUsuario)) {
        usuariosMap.set(chaveUsuario, {
          nome: palpite.nome,
          whatsapp: palpite.whatsapp,
          palpites: {},
          acertos: 0,
          totalPalpitesFinalizados: 0
        });
      }

      const usuario = usuariosMap.get(chaveUsuario)!;
      usuario.palpites[palpite.jogoId] = palpite.resultado;
    });

    // Calcular acertos para jogos finalizados
    usuariosMap.forEach(usuario => {
      jogosFinalizados.forEach(jogo => {
        if (usuario.palpites[jogo.id]) {
          usuario.totalPalpitesFinalizados++;
          
          // Convert palpite to standard format
          let palpiteResultado = usuario.palpites[jogo.id];
            if (palpiteResultado === '1') palpiteResultado = 'C';
            else if (palpiteResultado === 'X') palpiteResultado = 'E';
            else if (palpiteResultado === '2') palpiteResultado = 'F';

            // Convert jogo result to standard format if it is a score
            let jogoResultado = jogo.resultado;
            if (jogo.resultado.includes('x')) {
              const [golsCasa, golsVisitante] = jogo.resultado.split('x').map(Number);
              const diferenca = golsCasa - golsVisitante;
              if (diferenca === 0) jogoResultado = 'E';
              else if (diferenca > 0) jogoResultado = 'C';
              else jogoResultado = 'F';
            }

          if (palpiteResultado === jogoResultado) {
            usuario.acertos++;
          }
        }
      });
      
      // Se apostas encerraram mas não há jogos finalizados ainda, 
      // contar total de palpites do usuário para fins de exibição
      if (apostasEncerradas && jogosFinalizados.length === 0) {
        usuario.totalPalpitesFinalizados = Object.keys(usuario.palpites).length;
      }
    });

    // Criar tabela de palpites detalhada
    const tabelaPalpites = Array.from(usuariosMap.values())
      .map(usuario => ({
        nome: usuario.nome,
        whatsapp: usuario.whatsapp,
        acertos: usuario.acertos,
        totalPalpitesFinalizados: usuario.totalPalpitesFinalizados,
        palpitesPorJogo: todosJogos.map(jogo => {
          const temPalpite = usuario.palpites[jogo.id];
          const jogoFinalizado = jogo.resultado !== null;
          let acertou = null;
          
          if (jogoFinalizado && temPalpite) {
            // Convert palpite to standard format
            let palpiteResultado = temPalpite;
            if (palpiteResultado === '1') palpiteResultado = 'C';
            else if (palpiteResultado === 'X') palpiteResultado = 'E';
            else if (palpiteResultado === '2') palpiteResultado = 'F';

            // Convert jogo result to standard format if it is a score
            let jogoResultado = jogo.resultado;
            if (jogo.resultado.includes('x')) {
              const [golsCasa, golsVisitante] = jogo.resultado.split('x').map(Number);
              const diferenca = golsCasa - golsVisitante;
              if (diferenca === 0) jogoResultado = 'E';
              else if (diferenca > 0) jogoResultado = 'C';
              else jogoResultado = 'F';
            }
            
            acertou = palpiteResultado === jogoResultado;
          }
          
          return {
            jogoId: jogo.id,
            palpite: temPalpite || null,
            resultado: jogo.resultado,
            acertou,
            finalizado: jogoFinalizado
          };
        })
      }))
      .sort((a, b) => {
        if (b.acertos !== a.acertos) {
          return b.acertos - a.acertos;
        }
        return a.nome.localeCompare(b.nome);
      })
      .map((usuario, index) => ({
        posicao: index + 1,
        ...usuario,
        percentual: usuario.totalPalpitesFinalizados > 0 
          ? ((usuario.acertos / usuario.totalPalpitesFinalizados) * 100).toFixed(1)
          : "0.0"
      }));

    // Calcular distribuição de pontos
    const distribuicaoPontos: { [pontos: number]: number } = {};
    tabelaPalpites.forEach(usuario => {
      const pontos = usuario.acertos;
      distribuicaoPontos[pontos] = (distribuicaoPontos[pontos] || 0) + 1;
    });

    // Ranking simplificado (compatibilidade)
    const ranking = tabelaPalpites.map(usuario => ({
      posicao: usuario.posicao,
      nome: usuario.nome,
      whatsapp: usuario.whatsapp,
      acertos: usuario.acertos,
      totalPalpites: usuario.totalPalpitesFinalizados,
      percentual: usuario.percentual,
      jogosAcertados: jogosFinalizados
        .filter(jogo => usuario.palpitesPorJogo.find(p => p.jogoId === jogo.id)?.acertou)
        .map(jogo => `${jogo.mandante} x ${jogo.visitante}`)
    }));

    return res.status(200).json({
      ranking,
      jogosFinalizados,
      todosJogos,
      tabelaPalpites,
      distribuicaoPontos,
      totalJogos: todosJogos.length,
      totalJogosFinalizados: jogosFinalizados.length,
      totalParticipantes: tabelaPalpites.length
    });

  } catch (error) {
    console.error("Erro ao calcular ranking:", error);
    return res.status(500).json({ error: "Erro ao calcular ranking" });
  }
}