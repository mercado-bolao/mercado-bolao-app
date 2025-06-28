
import { prisma } from "../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    console.log('🌱 Criando dados de teste...');

    // Criar concurso
    const concurso = await prisma.concurso.create({
      data: {
        numero: 1,
        nome: 'Concurso Teste - Copa Internacional',
        dataInicio: new Date(),
        dataFim: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias depois
        status: 'ativo',
        premioEstimado: 10000.00,
        fechamentoPalpites: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 dias depois
      }
    });

    // Criar jogos
    const jogos = await Promise.all([
      prisma.jogo.create({
        data: {
          mandante: 'Palmeiras',
          visitante: 'Flamengo',
          horario: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          concursoId: concurso.id,
          statusJogo: 'agendado'
        }
      }),
      prisma.jogo.create({
        data: {
          mandante: 'São Paulo',
          visitante: 'Corinthians',
          horario: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
          concursoId: concurso.id,
          statusJogo: 'agendado'
        }
      }),
      prisma.jogo.create({
        data: {
          mandante: 'Santos',
          visitante: 'Botafogo',
          horario: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
          concursoId: concurso.id,
          statusJogo: 'agendado'
        }
      })
    ]);

    // Criar usuários de teste
    const usuarios = await Promise.all([
      prisma.user.create({
        data: {
          nome: 'João Silva',
          whatsapp: '11999999999',
          email: 'joao@teste.com'
        }
      }),
      prisma.user.create({
        data: {
          nome: 'Maria Santos',
          whatsapp: '11888888888',
          email: 'maria@teste.com'
        }
      })
    ]);

    // Criar palpites
    const resultados = ['1', 'X', '2'];
    for (const jogo of jogos) {
      for (const usuario of usuarios) {
        await prisma.palpite.create({
          data: {
            nome: usuario.nome,
            whatsapp: usuario.whatsapp,
            resultado: resultados[Math.floor(Math.random() * resultados.length)],
            jogoId: jogo.id,
            concursoId: concurso.id,
            userId: usuario.id
          }
        });
      }
    }

    console.log('✅ Dados de teste criados com sucesso!');
    
    res.status(200).json({ 
      success: true, 
      message: 'Dados de teste criados com sucesso!',
      concurso: {
        id: concurso.id,
        numero: concurso.numero,
        nome: concurso.nome
      },
      jogos: jogos.length,
      usuarios: usuarios.length
    });
  } catch (error) {
    console.error('❌ Erro ao criar dados de teste:', error);
    res.status(500).json({ 
      error: 'Erro ao criar dados de teste',
      details: error.message 
    });
  }
}
