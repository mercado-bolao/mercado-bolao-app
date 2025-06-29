import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { APIResponse, Bilhete } from '../../types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse>
) {
  try {
    // Configurar headers para evitar cache
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const { bilheteId } = req.query;

    if (!bilheteId || typeof bilheteId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'ID do bilhete não fornecido ou inválido'
      });
    }

    console.log('🔍 Verificando status do bilhete:', bilheteId);

    const bilheteCompleto = await prisma.bilhete.findUnique({
      where: { id: bilheteId },
      include: {
        palpites: {
          include: {
            jogo: {
              include: {
                concurso: true
              }
            }
          }
        },
        pix: true
      }
    });

    if (!bilheteCompleto) {
      return res.status(404).json({
        success: false,
        error: 'Bilhete não encontrado'
      });
    }

    // Se o bilhete tem TXID, verificar na EFI
    if (bilheteCompleto.txid && bilheteCompleto.status !== 'PAGO') {
      try {
        console.log('🔍 Verificando status na EFI...');
        const efiResponse = await fetch(`${BASE_URL}/api/admin/verificar-status-efi?txid=${bilheteCompleto.txid}`);
        const efiData = await efiResponse.json();

        if (efiData.success && efiData.status === 'CONCLUIDA') {
          console.log('✅ Pagamento confirmado na EFI!');
          // O status já foi atualizado pelo endpoint verificar-status-efi
        }
      } catch (efiError) {
        console.error('⚠️ Erro ao verificar na EFI:', efiError);
      }

      // Buscar bilhete novamente para ter status atualizado
      const bilheteAtualizado = await prisma.bilhete.findUnique({
        where: { id: bilheteId },
        include: {
          palpites: {
            include: {
              jogo: {
                include: {
                  concurso: true
                }
              }
            }
          }
        }
      });

      if (bilheteAtualizado) {
        return res.status(200).json({
          success: true,
          data: {
            id: bilheteAtualizado.id,
            txid: bilheteAtualizado.txid,
            valorTotal: bilheteAtualizado.valorTotal,
            whatsapp: bilheteAtualizado.whatsapp,
            nome: bilheteAtualizado.nome,
            status: bilheteAtualizado.status,
            createdAt: bilheteAtualizado.createdAt.toISOString(),
            palpites: bilheteAtualizado.palpites.map(palpite => ({
              id: palpite.id,
              resultado: palpite.resultado,
              jogo: {
                id: palpite.jogo.id,
                mandante: palpite.jogo.mandante,
                visitante: palpite.jogo.visitante
              }
            })),
            concurso: bilheteAtualizado.palpites.length > 0 ? {
              nome: bilheteAtualizado.palpites[0].jogo.concurso.nome,
              numero: bilheteAtualizado.palpites[0].jogo.concurso.numero
            } : null
          }
        });
      }
    }

    // Retornar os dados do bilhete
    return res.status(200).json({
      success: true,
      data: {
        id: bilheteCompleto.id,
        txid: bilheteCompleto.txid,
        valorTotal: bilheteCompleto.valorTotal,
        whatsapp: bilheteCompleto.whatsapp,
        nome: bilheteCompleto.nome,
        status: bilheteCompleto.status,
        createdAt: bilheteCompleto.createdAt.toISOString(),
        palpites: bilheteCompleto.palpites.map(palpite => ({
          id: palpite.id,
          resultado: palpite.resultado,
          jogo: {
            id: palpite.jogo.id,
            mandante: palpite.jogo.mandante,
            visitante: palpite.jogo.visitante
          }
        })),
        concurso: bilheteCompleto.palpites.length > 0 ? {
          nome: bilheteCompleto.palpites[0].jogo.concurso.nome,
          numero: bilheteCompleto.palpites[0].jogo.concurso.numero
        } : null
      }
    });

  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao verificar status do pagamento'
    });
  } finally {
    await prisma.$disconnect();
  }
}