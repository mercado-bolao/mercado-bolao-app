
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('🔧 Criando concurso ativo com 8 jogos...');

    // Verificar se já existe um concurso ativo
    const concursoAtivo = await prisma.concurso.findFirst({
      where: { status: 'ativo' }
    });
    
    if (concursoAtivo) {
      return res.status(400).json({
        error: 'Já existe um concurso ativo',
        concurso: concursoAtivo
      });
    }

    // Buscar o próximo número de concurso
    const ultimoConcurso = await prisma.concurso.findFirst({
      orderBy: { numero: 'desc' }
    });
    
    const numeroProximoConcurso = ultimoConcurso ? ultimoConcurso.numero + 1 : 1;

    // Criar um novo concurso ativo
    const novoConcurso = await prisma.concurso.create({
      data: {
        numero: numeroProximoConcurso,
        nome: `Concurso ${numeroProximoConcurso.toString().padStart(2, '0')} - Ativo`,
        dataInicio: new Date(),
        dataFim: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 dias
        status: 'ativo',
        premioEstimado: 50000,
        fechamentoPalpites: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 dias
      }
    });

    // Criar 8 jogos futuros sem resultado
    const agora = new Date();
    const jogos = [
      {
        mandante: 'Palmeiras',
        visitante: 'Botafogo',
        horario: new Date(agora.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 dias
        concursoId: novoConcurso.id,
        fotoMandante: '/uploads/mandante_1751138175815_Palmeiras.png',
        fotoVisitante: '/uploads/visitante_1751138175815_Botafogo.png'
      },
      {
        mandante: 'Benfica',
        visitante: 'Chelsea',
        horario: new Date(agora.getTime() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 2 dias + 4h
        concursoId: novoConcurso.id,
        fotoMandante: '/uploads/mandante_1751138206317_benfica.png',
        fotoVisitante: '/uploads/visitante_1751138206317_Chelsea.png'
      },
      {
        mandante: 'PSG',
        visitante: 'Inter Miami',
        horario: new Date(agora.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 dias
        concursoId: novoConcurso.id,
        fotoMandante: '/uploads/mandante_1751138229389_PSG.png',
        fotoVisitante: '/uploads/visitante_1751138229389_INTER MIAMI.png'
      },
      {
        mandante: 'Flamengo',
        visitante: 'Bayern de Munique',
        horario: new Date(agora.getTime() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 3 dias + 4h
        concursoId: novoConcurso.id,
        fotoMandante: '/uploads/mandante_1751138256479_Flamengo.png',
        fotoVisitante: '/uploads/visitante_1751138256479_Bayern de Munique.png'
      },
      {
        mandante: 'Inter de Milão',
        visitante: 'Fluminense',
        horario: new Date(agora.getTime() + 4 * 24 * 60 * 60 * 1000), // 4 dias
        concursoId: novoConcurso.id,
        fotoMandante: '/uploads/mandante_1751138278962_Inter de Milão.png',
        fotoVisitante: '/uploads/visitante_1751138278962_Fluminense.png'
      },
      {
        mandante: 'Manchester City',
        visitante: 'Al-Hilal',
        horario: new Date(agora.getTime() + 4 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 dias + 4h
        concursoId: novoConcurso.id,
        fotoMandante: '/uploads/mandante_1751138316621_Manchester City.png',
        fotoVisitante: '/uploads/visitante_1751138316621_Al-Hilal.png'
      },
      {
        mandante: 'Real Madrid',
        visitante: 'Juventus',
        horario: new Date(agora.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 dias
        concursoId: novoConcurso.id,
        fotoMandante: '/uploads/mandante_1751138350887_Real Madrid.png',
        fotoVisitante: '/uploads/visitante_1751138350887_Juventus.png'
      },
      {
        mandante: 'Borussia Dortmund',
        visitante: 'Monterrey',
        horario: new Date(agora.getTime() + 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 5 dias + 4h
        concursoId: novoConcurso.id,
        fotoMandante: '/uploads/mandante_1751138379580_Borussia Dortmund.png',
        fotoVisitante: '/uploads/visitante_1751138379580_Monterrey.png'
      }
    ];

    // Inserir todos os jogos
    for (const jogo of jogos) {
      await prisma.jogo.create({ data: jogo });
    }

    // Buscar o concurso criado com os jogos
    const concursoCriado = await prisma.concurso.findUnique({
      where: { id: novoConcurso.id },
      include: {
        jogos: {
          orderBy: { horario: 'asc' },
          select: {
            id: true,
            mandante: true,
            visitante: true,            horario: true,
            resultado: true,
            fotoMandante: true,
            fotoVisitante: true
          }
        }
      }
    });

    console.log('✅ Concurso ativo criado com sucesso!');

    res.status(200).json({
      success: true,
      message: 'Concurso ativo criado com sucesso!',
      concurso: concursoCriado
    });

  } catch (error) {
    console.error('❌ Erro ao criar concurso ativo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar concurso ativo',
      message: error.message
    });
  }
}
