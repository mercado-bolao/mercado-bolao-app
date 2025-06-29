
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('🔍 Verificando bilhetes expirados...');

    const agora = new Date();

    // Buscar bilhetes pendentes que expiraram
    const bilhetesExpirados = await prisma.bilhete.findMany({
      where: {
        status: 'PENDENTE',
        expiresAt: {
          lt: agora
        }
      },
      include: {
        palpites: true
      }
    });

    console.log(`📋 Encontrados ${bilhetesExpirados.length} bilhetes expirados`);

    if (bilhetesExpirados.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Nenhum bilhete expirado encontrado',
        bilhetesProcessados: 0
      });
    }

    let bilhetesProcessados = 0;

    for (const bilhete of bilhetesExpirados) {
      try {
        console.log(`🔴 Expirando bilhete: ${bilhete.id}`);

        // Atualizar status do bilhete
        await prisma.bilhete.update({
          where: { id: bilhete.id },
          data: { 
            status: 'EXPIRADO',
            updatedAt: agora
          }
        });

        // Cancelar palpites associados
        await prisma.palpite.updateMany({
          where: { bilheteId: bilhete.id },
          data: { status: 'cancelado' }
        });

        // Atualizar PIX se existir
        if (bilhete.pixId) {
          await prisma.pixPagamento.update({
            where: { id: bilhete.pixId },
            data: { status: 'EXPIRADA' }
          });
        }

        bilhetesProcessados++;
        console.log(`✅ Bilhete ${bilhete.id} expirado com sucesso`);

      } catch (error) {
        console.error(`❌ Erro ao expirar bilhete ${bilhete.id}:`, error);
      }
    }

    console.log(`✅ ${bilhetesProcessados} bilhetes processados`);

    return res.status(200).json({
      success: true,
      message: `${bilhetesProcessados} bilhetes expirados processados`,
      bilhetesProcessados
    });

  } catch (error) {
    console.error('❌ Erro ao verificar bilhetes expirados:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
