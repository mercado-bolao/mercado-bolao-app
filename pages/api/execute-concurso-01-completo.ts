import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('🚀 Iniciando criação do Concurso 01 completo...');

    // 1. Verificar se o Concurso 01 já existe
    let concurso01 = await prisma.concurso.findFirst({
      where: { numero: 1 }
    });

    if (!concurso01) {
      // Criar o Concurso 01
      concurso01 = await prisma.concurso.create({
        data: {
          numero: 1,
          nome: 'Concurso 01 - Primeira Edição',
          dataInicio: new Date('2025-01-28T10:00:00Z'),
          dataFim: new Date('2025-02-15T23:59:59Z'),
          status: 'finalizado',
          premioEstimado: 15000.00,
          fechamentoPalpites: new Date('2025-01-28T12:59:59Z')
        }
      });
      console.log('✅ Concurso 01 criado:', concurso01.id);
    } else {
      console.log('✅ Concurso 01 já existe:', concurso01.id);
    }

    // 2. Limpar jogos existentes e criar os 8 jogos
    await prisma.jogo.deleteMany({
      where: { concursoId: concurso01.id }
    });

    const jogos = await prisma.jogo.createMany({
      data: [
        {
          mandante: 'Flamengo',
          visitante: 'Vasco',
          horario: new Date('2025-01-28T15:00:00Z'),
          resultado: '2x1',
          placarCasa: 2,
          placarVisitante: 1,
          concursoId: concurso01.id
        },
        {
          mandante: 'Palmeiras',
          visitante: 'Corinthians',
          horario: new Date('2025-01-28T17:00:00Z'),
          resultado: '1x0',
          placarCasa: 1,
          placarVisitante: 0,
          concursoId: concurso01.id
        },
        {
          mandante: 'Santos',
          visitante: 'São Paulo',
          horario: new Date('2025-01-29T15:00:00Z'),
          resultado: '0x2',
          placarCasa: 0,
          placarVisitante: 2,
          concursoId: concurso01.id
        },
        {
          mandante: 'Grêmio',
          visitante: 'Internacional',
          horario: new Date('2025-01-29T17:00:00Z'),
          resultado: '1x1',
          placarCasa: 1,
          placarVisitante: 1,
          concursoId: concurso01.id
        },
        {
          mandante: 'Cruzeiro',
          visitante: 'Atlético-MG',
          horario: new Date('2025-01-30T15:00:00Z'),
          resultado: '3x0',
          placarCasa: 3,
          placarVisitante: 0,
          concursoId: concurso01.id
        },
        {
          mandante: 'Botafogo',
          visitante: 'Fluminense',
          horario: new Date('2025-01-30T17:00:00Z'),
          resultado: '2x2',
          placarCasa: 2,
          placarVisitante: 2,
          concursoId: concurso01.id
        },
        {
          mandante: 'Bahia',
          visitante: 'Vitória',
          horario: new Date('2025-01-31T15:00:00Z'),
          resultado: '1x0',
          placarCasa: 1,
          placarVisitante: 0,
          concursoId: concurso01.id
        },
        {
          mandante: 'Ceará',
          visitante: 'Fortaleza',
          horario: new Date('2025-01-31T17:00:00Z'),
          resultado: '0x1',
          placarCasa: 0,
          placarVisitante: 1,
          concursoId: concurso01.id
        }
      ]
    });

    console.log('✅ 8 jogos criados!');

    // 3. Buscar IDs dos jogos criados em ordem
    const jogosCriados = await prisma.jogo.findMany({
      where: { concursoId: concurso01.id },
      orderBy: { horario: 'asc' }
    });

    // 4. Limpar palpites existentes
    await prisma.palpite.deleteMany({
      where: { concursoId: concurso01.id }
    });

    // 5. Criar todos os palpites dos 23 apostadores
    const apostadores = [
      { nome: 'Alexandre Ferraz', whatsapp: '11999887766', palpites: ['C', 'F', 'C', 'C', 'C', 'C', 'C', 'C'] },
      { nome: 'Ana Clara', whatsapp: '11888776655', palpites: ['C', 'C', 'F', 'E', 'C', 'E', 'C', 'F'] },
      { nome: 'Bruno Silva', whatsapp: '11777665544', palpites: ['F', 'C', 'F', 'E', 'C', 'E', 'C', 'F'] },
      { nome: 'Carlos Eduardo', whatsapp: '11666554433', palpites: ['C', 'C', 'F', 'C', 'C', 'C', 'C', 'F'] },
      { nome: 'Daniel Santos', whatsapp: '11555443322', palpites: ['C', 'C', 'C', 'E', 'C', 'E', 'C', 'F'] },
      { nome: 'Eduardo Lima', whatsapp: '11444332211', palpites: ['C', 'C', 'F', 'E', 'C', 'C', 'C', 'F'] },
      { nome: 'Fernando Costa', whatsapp: '11333221100', palpites: ['C', 'C', 'F', 'C', 'C', 'E', 'C', 'C'] },
      { nome: 'Gabriel Rocha', whatsapp: '11222110099', palpites: ['F', 'C', 'F', 'E', 'C', 'E', 'F', 'F'] },
      { nome: 'Helena Moura', whatsapp: '11111009988', palpites: ['C', 'F', 'F', 'E', 'F', 'E', 'C', 'F'] },
      { nome: 'Igor Pereira', whatsapp: '11000998877', palpites: ['C', 'C', 'F', 'C', 'C', 'C', 'F', 'F'] },
      { nome: 'Julia Martins', whatsapp: '10999888766', palpites: ['F', 'C', 'C', 'E', 'C', 'E', 'C', 'C'] },
      { nome: 'Kevin Alves', whatsapp: '10888777655', palpites: ['C', 'C', 'F', 'E', 'C', 'C', 'C', 'C'] },
      { nome: 'Laura Oliveira', whatsapp: '10777666544', palpites: ['C', 'F', 'F', 'C', 'F', 'E', 'C', 'F'] },
      { nome: 'Marcos Vieira', whatsapp: '10666555433', palpites: ['F', 'C', 'F', 'E', 'C', 'E', 'C', 'F'] },
      { nome: 'Natalia Gomes', whatsapp: '10555444322', palpites: ['C', 'C', 'C', 'E', 'C', 'C', 'F', 'F'] },
      { nome: 'Otavio Mendes', whatsapp: '10444333211', palpites: ['C', 'C', 'F', 'C', 'C', 'E', 'C', 'C'] },
      { nome: 'Patricia Cunha', whatsapp: '10333222100', palpites: ['F', 'F', 'F', 'E', 'F', 'E', 'C', 'F'] },
      { nome: 'Rafael Barros', whatsapp: '10222111099', palpites: ['C', 'C', 'F', 'E', 'C', 'C', 'C', 'F'] },
      { nome: 'Sandra Reis', whatsapp: '10111000988', palpites: ['C', 'F', 'C', 'C', 'F', 'E', 'F', 'C'] },
      { nome: 'Thiago Nunes', whatsapp: '10000999877', palpites: ['F', 'C', 'F', 'E', 'C', 'E', 'C', 'F'] },
      { nome: 'Vanessa Torres', whatsapp: '19999888766', palpites: ['C', 'C', 'F', 'C', 'C', 'C', 'C', 'F'] },
      { nome: 'Wagner Lopes', whatsapp: '19888777655', palpites: ['C', 'C', 'C', 'E', 'F', 'E', 'C', 'F'] },
      { nome: 'Yasmin Cardoso', whatsapp: '19777666544', palpites: ['F', 'F', 'F', 'E', 'C', 'C', 'C', 'F'] }
    ];

    let totalPalpites = 0;

    for (const apostador of apostadores) {
      for (let i = 0; i < jogosCriados.length; i++) {
        await prisma.palpite.create({
          data: {
            nome: apostador.nome,
            whatsapp: apostador.whatsapp,
            resultado: apostador.palpites[i],
            jogoId: jogosCriados[i].id,
            concursoId: concurso01.id,
            createdAt: new Date('2025-01-28T12:00:00Z')
          }
        });
        totalPalpites++;
      }
    }

    console.log(`✅ ${totalPalpites} palpites criados para ${apostadores.length} apostadores!`);

    // 6. Verificar totais
    const totalConcursos = await prisma.concurso.count();
    const totalJogos = await prisma.jogo.count();
    const totalPalpitesDb = await prisma.palpite.count();

    return res.status(200).json({
      success: true,
      message: 'Concurso 01 criado com sucesso!',
      data: {
        concurso: {
          id: concurso01.id,
          numero: concurso01.numero,
          nome: concurso01.nome
        },
        estatisticas: {
          totalConcursos,
          totalJogos,
          totalPalpites: totalPalpitesDb,
          apostadores: apostadores.length
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro ao criar Concurso 01:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}