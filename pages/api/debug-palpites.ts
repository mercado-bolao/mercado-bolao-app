
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
    console.log('=== DEBUG PALPITES ===');

    // 1. Verificar conexão com banco
    console.log('1. Testando conexão com banco...');
    const testConnection = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Conexão OK:', testConnection);

    // 2. Contar todas as tabelas
    console.log('2. Contando registros...');
    const totalConcursos = await prisma.concurso.count();
    const totalJogos = await prisma.jogo.count();
    const totalPalpites = await prisma.palpite.count();

    console.log('Total concursos:', totalConcursos);
    console.log('Total jogos:', totalJogos);
    console.log('Total palpites:', totalPalpites);

    // 3. Buscar últimos palpites com detalhes
    console.log('3. Buscando últimos palpites...');
    const palpitesDetalhados = await prisma.palpite.findMany({
      include: {
        jogo: {
          include: {
            concurso: true
          }
        }
      },
      orderBy: {
        id: 'desc'
      },
      take: 5
    });

    console.log('Palpites encontrados:', palpitesDetalhados.length);

    // 4. Verificar estrutura das tabelas
    console.log('4. Verificando estrutura...');
    const samplePalpite = await prisma.palpite.findFirst();
    const sampleJogo = await prisma.jogo.findFirst({
      include: { concurso: true }
    });

    console.log('Sample palpite:', samplePalpite);
    console.log('Sample jogo:', sampleJogo);

    // 5. Tentar criar um palpite de teste
    let testePalpite = null;
    if (totalJogos > 0) {
      console.log('5. Tentando criar palpite de teste...');
      const primeiroJogo = await prisma.jogo.findFirst();
      if (primeiroJogo) {
        try {
          testePalpite = await prisma.palpite.create({
            data: {
              nome: 'TESTE DEBUG',
              whatsapp: '11999999999',
              resultado: '1',
              jogoId: primeiroJogo.id,
              concursoId: primeiroJogo.concursoId,
            }
          });
          console.log('Palpite de teste criado:', testePalpite);

          // Remover o palpite de teste
          await prisma.palpite.delete({
            where: { id: testePalpite.id }
          });
          console.log('Palpite de teste removido');
        } catch (testError) {
          console.error('Erro ao criar palpite de teste:', testError);
        }
      }
    }

    return res.status(200).json({
      status: 'SUCCESS',
      database: {
        connection: 'OK',
        counts: {
          concursos: totalConcursos,
          jogos: totalJogos,
          palpites: totalPalpites
        }
      },
      samples: {
        palpite: samplePalpite,
        jogo: sampleJogo
      },
      recentPalpites: palpitesDetalhados,
      testPalpite: testePalpite ? 'CRIADO E REMOVIDO COM SUCESSO' : 'NÃO TESTADO'
    });

  } catch (error) {
    console.error('Erro no debug:', error);
    return res.status(500).json({ 
      status: 'ERROR',
      error: error.message,
      stack: error.stack
    });
  }
}
