import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      console.log('🔍 Buscando concursos no banco de dados...');

      const concursos = await prisma.concurso.findMany({
        include: {
          jogos: {
            select: {
              id: true,
              mandante: true,
              visitante: true,
              horario: true
            }
          },
          _count: {
            select: {
              jogos: true,
              palpites: true
            }
          }
        },
        orderBy: { numero: 'desc' }
      });

      console.log(`📊 Encontrados ${concursos.length} concursos:`, concursos.map(c => ({
        id: c.id,
        numero: c.numero,
        nome: c.nome,
        status: c.status,
        jogos: c._count.jogos
      })));

      // Cache headers para melhor performance
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      res.status(200).json({
        success: true,
        concursos: concursos
      });
    } catch (error: any) {
      console.error('❌ Erro ao buscar concursos:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar concursos',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno do servidor'
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({
      success: false,
      error: `Método ${req.method} não permitido`
    });
  }
}
