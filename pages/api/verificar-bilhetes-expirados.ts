// Verificação automática de bilhetes expirados
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('🔍 Verificando bilhetes expirados...');

    // Buscar bilhetes pendentes que expiraram
    const bilhetesExpirados = await prisma.bilhete.findMany({
      where: {
        status: 'PENDENTE',
        expiresAt: {
          lt: new Date() // Menor que agora (expirados)
        }
      }
    });

    console.log(`📊 Encontrados ${bilhetesExpirados.length} bilhetes expirados`);

    if (bilhetesExpirados.length > 0) {
      // Atualizar status para EXPIRADO
      const resultado = await prisma.bilhete.updateMany({
        where: {
          id: {
            in: bilhetesExpirados.map(b => b.id)
          }
        },
        data: {
          status: 'EXPIRADO'
        }
      });

      console.log(`✅ ${resultado.count} bilhetes marcados como expirados`);

      // Atualizar palpites associados
      await prisma.palpite.updateMany({
        where: {
          bilheteId: {
            in: bilhetesExpirados.map(b => b.id)
          }
        },
        data: {
          status: 'EXPIRADO'
        }
      });

      console.log(`✅ Palpites dos bilhetes expirados também atualizados`);
    }

    return res.status(200).json({
      success: true,
      message: `${bilhetesExpirados.length} bilhetes expirados processados`,
      bilhetesExpirados: bilhetesExpirados.length
    });

  } catch (error) {
    console.error('❌ Erro ao verificar bilhetes expirados:', error);
    return res.status(500).json({
      error: 'Erro ao verificar bilhetes expirados',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}