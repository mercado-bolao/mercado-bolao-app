
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔍 Verificando concurso 03...');

    // Buscar o concurso 03
    const concurso = await prisma.concurso.findFirst({
      where: { numero: 3 },
      include: {
        _count: {
          select: {
            jogos: true,
            palpites: true
          }
        }
      }
    });

    if (!concurso) {
      return res.status(404).json({
        success: false,
        error: 'Concurso 03 não encontrado!',
        solution: 'Execute o script de restauração'
      });
    }

    // Buscar jogos
    const jogos = await prisma.jogo.findMany({
      where: { concursoId: concurso.id },
      select: {
        id: true,
        mandante: true,
        visitante: true,
        resultado: true,
        horario: true
      },
      orderBy: { horario: 'asc' }
    });

    // Buscar palpites
    const palpites = await prisma.palpite.findMany({
      where: { concursoId: concurso.id },
      select: {
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

    // Agrupar palpites por apostador
    const apostadores = palpites.reduce((acc, palpite) => {
      if (!acc[palpite.nome]) {
        acc[palpite.nome] = {
          nome: palpite.nome,
          whatsapp: palpite.whatsapp,
          palpites: []
        };
      }
      acc[palpite.nome].palpites.push({
        jogo: `${palpite.jogo.mandante} vs ${palpite.jogo.visitante}`,
        palpite: palpite.resultado
      });
      return acc;
    }, {});

    const totalApostadores = Object.keys(apostadores).length;
    const totalPalpites = palpites.length;
    const palpitesEsperados = jogos.length * totalApostadores;

    // Status da verificação
    const status = {
      concursoEncontrado: !!concurso,
      jogosCompletos: jogos.length === 8,
      palpitesCompletos: totalPalpites === palpitesEsperados,
      apostadoresEsperados: totalApostadores >= 24
    };

    const tudoOk = Object.values(status).every(Boolean);

    console.log(`✅ Concurso 03 verificado: ${tudoOk ? 'TUDO OK' : 'PROBLEMAS ENCONTRADOS'}`);

    res.status(200).json({
      success: true,
      concurso: {
        id: concurso.id,
        numero: concurso.numero,
        nome: concurso.nome,
        status: concurso.status
      },
      contadores: {
        jogos: jogos.length,
        jogosEsperados: 8,
        palpites: totalPalpites,
        palpitesEsperados,
        apostadores: totalApostadores,
        apostadoresMinimos: 24
      },
      status,
      todosOsDadosOk: tudoOk,
      jogos: jogos.map(j => ({
        jogo: `${j.mandante} vs ${j.visitante}`,
        resultado: j.resultado,
        horario: j.horario
      })),
      apostadoresReais: [
        'Alexandre Ferraz',
        'An Beatriz Pereira Rufino', 
        'Bruno Henrique',
        'Cabeça',
        'Caio Luis Cardoso de Oliveira'
      ].map(nome => ({
        nome,
        encontrado: !!apostadores[nome],
        palpites: apostadores[nome]?.palpites?.length || 0
      }))
    });

  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro na verificação',
      message: error.message
    });
  }
}
