
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔍 Debug: Verificando concursos no banco...');

    // Buscar todos os concursos
    const concursos = await prisma.concurso.findMany({
      select: {
        id: true,
        numero: true,
        nome: true,
        status: true,
        dataInicio: true,
        dataFim: true,
        premioEstimado: true,
        fechamentoPalpites: true,
        _count: {
          select: {
            jogos: true,
            palpites: true
          }
        }
      },
      orderBy: { numero: 'desc' }
    });

    // Contar total de registros
    const totalConcursos = await prisma.concurso.count();
    const totalJogos = await prisma.jogo.count();
    const totalPalpites = await prisma.palpite.count();

    console.log(`📊 Total no banco: ${totalConcursos} concursos, ${totalJogos} jogos, ${totalPalpites} palpites`);

    res.status(200).json({
      success: true,
      database: {
        connected: true,
        totalConcursos,
        totalJogos,
        totalPalpites
      },
      concursos: concursos.map(c => ({
        id: c.id,
        numero: c.numero,
        nome: c.nome || `Concurso #${c.numero}`,
        status: c.status,
        dataInicio: c.dataInicio,
        dataFim: c.dataFim,
        premioEstimado: c.premioEstimado,
        fechamentoPalpites: c.fechamentoPalpites,
        jogos: c._count.jogos,
        palpites: c._count.palpites
      }))
    });

  } catch (error: any) {
    console.error('❌ Erro no debug dos concursos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao conectar com o banco de dados',
      message: error.message,
      database: {
        connected: false
      }
    });
  }
}
