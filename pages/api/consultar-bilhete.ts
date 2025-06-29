
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { id, txid, whatsapp } = req.query;

    if (!id && !txid && !whatsapp) {
      return res.status(400).json({
        error: 'Parâmetro obrigatório não fornecido',
        details: 'Forneça id, txid ou whatsapp para consultar o bilhete'
      });
    }

    console.log('🔍 Consultando bilhete:', { id, txid, whatsapp });

    let whereClause: any = {};

    if (id) {
      whereClause.id = id as string;
    } else if (txid) {
      whereClause.txid = txid as string;
    } else if (whatsapp) {
      whereClause.whatsapp = whatsapp as string;
    }

    const bilhete = await prisma.bilhete.findFirst({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
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

    if (!bilhete) {
      return res.status(404).json({
        error: 'Bilhete não encontrado',
        details: 'Não foi encontrado nenhum bilhete com os dados fornecidos'
      });
    }

    // Verificar se expirou
    const agora = new Date();
    const expirado = agora > bilhete.expiresAt;

    // Se estava pendente e expirou, atualizar para expirado
    if (bilhete.status === 'PENDENTE' && expirado) {
      await prisma.bilhete.update({
        where: { id: bilhete.id },
        data: { status: 'EXPIRADO' }
      });

      await prisma.palpite.updateMany({
        where: { bilheteId: bilhete.id },
        data: { status: 'cancelado' }
      });

      bilhete.status = 'EXPIRADO';
    }

    // Calcular tempo restante
    const tempoRestante = Math.max(0, bilhete.expiresAt.getTime() - agora.getTime());
    const minutosRestantes = Math.floor(tempoRestante / (1000 * 60));
    const segundosRestantes = Math.floor((tempoRestante % (1000 * 60)) / 1000);

    return res.status(200).json({
      success: true,
      bilhete: {
        id: bilhete.id,
        whatsapp: bilhete.whatsapp,
        nome: bilhete.nome,
        valorTotal: bilhete.valorTotal,
        quantidadePalpites: bilhete.quantidadePalpites,
        status: bilhete.status,
        txid: bilhete.txid,
        orderId: bilhete.orderId,
        expiresAt: bilhete.expiresAt.toISOString(),
        createdAt: bilhete.createdAt.toISOString(),
        expirado: expirado,
        tempoRestante: {
          total: tempoRestante,
          minutos: minutosRestantes,
          segundos: segundosRestantes,
          formatado: `${minutosRestantes}:${segundosRestantes.toString().padStart(2, '0')}`
        },
        palpites: bilhete.palpites,
        pix: bilhete.pix ? {
          txid: bilhete.pix.txid,
          status: bilhete.pix.status,
          valor: bilhete.pix.valor,
          qrcode: bilhete.pix.pixCopiaECola,
          imagemQrcode: bilhete.pix.imagemQrcode,
          ambiente: bilhete.pix.ambiente
        } : null
      }
    });

  } catch (error) {
    console.error('❌ Erro ao consultar bilhete:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
