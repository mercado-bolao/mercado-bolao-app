
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('🔧 Restaurando concurso 03...');

    // 1. Verificar se já existe
    let concurso03 = await prisma.concurso.findFirst({
      where: { numero: 3 }
    });

    // 2. Criar concurso se não existir
    if (!concurso03) {
      concurso03 = await prisma.concurso.create({
        data: {
          numero: 3,
          nome: 'Concurso 03 - Copa Internacional',
          dataInicio: new Date('2025-06-28T10:00:00.000Z'),
          dataFim: new Date('2025-07-01T23:59:59.000Z'),
          status: 'finalizado',
          premioEstimado: 25000.00,
          fechamentoPalpites: new Date('2025-06-28T12:59:59.000Z')
        }
      });
    }

    // 3. Deletar jogos existentes
    await prisma.jogo.deleteMany({
      where: { concursoId: concurso03.id }
    });

    // 4. Criar jogos
    const jogos = await prisma.jogo.createMany({
      data: [
        {
          mandante: 'Palmeiras',
          visitante: 'Botafogo',
          horario: new Date('2025-06-28T13:00:00.000Z'),
          resultado: '1x0',
          placarCasa: 1,
          placarVisitante: 0,
          concursoId: concurso03.id
        },
        {
          mandante: 'Benfica',
          visitante: 'Chelsea',
          horario: new Date('2025-06-28T17:00:00.000Z'),
          resultado: '2x1',
          placarCasa: 2,
          placarVisitante: 1,
          concursoId: concurso03.id
        },
        {
          mandante: 'PSG',
          visitante: 'Inter Miami',
          horario: new Date('2025-06-29T13:00:00.000Z'),
          resultado: '3x1',
          placarCasa: 3,
          placarVisitante: 1,
          concursoId: concurso03.id
        },
        {
          mandante: 'Flamengo',
          visitante: 'Bayern de Munique',
          horario: new Date('2025-06-29T17:00:00.000Z'),
          resultado: '0x2',
          placarCasa: 0,
          placarVisitante: 2,
          concursoId: concurso03.id
        },
        {
          mandante: 'Inter de Milão',
          visitante: 'Fluminense',
          horario: new Date('2025-06-30T16:00:00.000Z'),
          resultado: '1x1',
          placarCasa: 1,
          placarVisitante: 1,
          concursoId: concurso03.id
        },
        {
          mandante: 'Manchester City',
          visitante: 'Al-Hilal',
          horario: new Date('2025-06-30T22:00:00.000Z'),
          resultado: '4x1',
          placarCasa: 4,
          placarVisitante: 1,
          concursoId: concurso03.id
        },
        {
          mandante: 'Real Madrid',
          visitante: 'Juventus',
          horario: new Date('2025-07-01T16:00:00.000Z'),
          resultado: '2x0',
          placarCasa: 2,
          placarVisitante: 0,
          concursoId: concurso03.id
        },
        {
          mandante: 'Borussia Dortmund',
          visitante: 'Monterrey',
          horario: new Date('2025-07-01T22:00:00.000Z'),
          resultado: '3x2',
          placarCasa: 3,
          placarVisitante: 2,
          concursoId: concurso03.id
        }
      ]
    });

    // 5. Buscar jogos criados
    const jogosCompletos = await prisma.jogo.findMany({
      where: { concursoId: concurso03.id },
      orderBy: { horario: 'asc' }
    });

    // 6. Deletar palpites existentes
    await prisma.palpite.deleteMany({
      where: { concursoId: concurso03.id }
    });

    // 7. Criar palpites dos principais apostadores
    const apostadores = [
      {
        nome: 'Alexandre Ferraz',
        whatsapp: '+5511999001001',
        palpites: ['C', 'C', 'C', 'F', 'E', 'C', 'C', 'C']
      },
      {
        nome: 'An Beatriz Pereira Rufino',
        whatsapp: '+5511999001002',
        palpites: ['F', 'C', 'C', 'F', 'E', 'C', 'C', 'C']
      },
      {
        nome: 'Bruno Henrique',
        whatsapp: '+5511999001003',
        palpites: ['F', 'C', 'C', 'F', 'E', 'C', 'C', 'C']
      },
      {
        nome: 'Cabeça',
        whatsapp: '+5511999001004',
        palpites: ['C', 'C', 'E', 'F', 'F', 'C', 'C', 'E']
      },
      {
        nome: 'Caio Luis Cardoso de Oliveira',
        whatsapp: '+5511999001005',
        palpites: ['C', 'F', 'C', 'F', 'E', 'C', 'C', 'C']
      }
    ];

    // Inserir palpites
    for (const apostador of apostadores) {
      for (let i = 0; i < jogosCompletos.length; i++) {
        await prisma.palpite.create({
          data: {
            nome: apostador.nome,
            whatsapp: apostador.whatsapp,
            resultado: apostador.palpites[i],
            jogoId: jogosCompletos[i].id,
            concursoId: concurso03.id,
            createdAt: new Date('2024-12-29T14:30:00.000Z')
          }
        });
      }
    }

    // 8. Verificar restauração
    const totalJogos = await prisma.jogo.count({
      where: { concursoId: concurso03.id }
    });

    const totalPalpites = await prisma.palpite.count({
      where: { concursoId: concurso03.id }
    });

    console.log('✅ Concurso 03 restaurado!');

    res.status(200).json({
      success: true,
      message: 'Concurso 03 restaurado com sucesso!',
      concurso: concurso03,
      estatisticas: {
        totalJogos,
        totalPalpites,
        apostadores: apostadores.length
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao restaurar concurso 03:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao restaurar concurso 03',
      message: error.message
    });
  }
}
