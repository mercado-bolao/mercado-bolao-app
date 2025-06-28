
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('🔧 Criando concurso de teste...');

    // Verificar se já existe algum concurso
    const concursoExistente = await prisma.concurso.findFirst();
    
    if (concursoExistente) {
      return res.status(200).json({
        message: 'Já existe um concurso no banco',
        concurso: concursoExistente
      });
    }

    // Criar um novo concurso
    const novoConcurso = await prisma.concurso.create({
      data: {
        numero: 1,
        nome: 'Concurso Teste',
        dataInicio: new Date(),
        dataFim: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        status: 'ativo',
        premioEstimado: 10000,
        fechamentoPalpites: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 dias
      }
    });

    // Criar alguns jogos de teste
    const jogos = [
      {
        mandante: 'Palmeiras',
        visitante: 'Corinthians',
        horario: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 horas
        concursoId: novoConcurso.id
      },
      {
        mandante: 'Flamengo',
        visitante: 'Fluminense',
        horario: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 horas
        concursoId: novoConcurso.id
      }
    ];

    for (const jogo of jogos) {
      await prisma.jogo.create({ data: jogo });
    }

    console.log('✅ Concurso de teste criado com sucesso!');

    res.status(200).json({
      success: true,
      message: 'Concurso de teste criado com sucesso!',
      concurso: novoConcurso
    });

  } catch (error) {
    console.error('❌ Erro ao criar concurso de teste:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar concurso de teste',
      message: error.message
    });
  }
}
