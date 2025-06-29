import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { whatsapp, nome, palpites } = req.body;

    if (!whatsapp || !nome || !palpites || !Array.isArray(palpites) || palpites.length === 0) {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos',
        details: 'whatsapp, nome e palpites são obrigatórios'
      });
    }

    // Buscar concurso ativo
    const concursoAtivo = await prisma.concurso.findFirst({
      where: {
        status: 'ATIVO',
        dataFim: {
          gt: new Date()
        }
      }
    });

    if (!concursoAtivo) {
      return res.status(400).json({
        error: 'Nenhum concurso ativo encontrado',
        details: 'Não é possível criar bilhetes no momento'
      });
    }

    console.log('🎫 Criando bilhete:', { whatsapp, nome, quantidadePalpites: palpites.length });

    // Capturar informações do cliente
    const userAgent = req.headers['user-agent'] || 'Não informado';

    // Captura mais robusta do IP
    let ipAddress = null;

    if (req.headers['x-forwarded-for']) {
      // Pega o primeiro IP da lista se houver múltiplos
      ipAddress = req.headers['x-forwarded-for'].toString().split(',')[0].trim();
    } else if (req.headers['x-real-ip']) {
      ipAddress = req.headers['x-real-ip'].toString();
    } else if (req.connection?.remoteAddress) {
      ipAddress = req.connection.remoteAddress;
    } else if (req.socket?.remoteAddress) {
      ipAddress = req.socket.remoteAddress;
    } else if (req.headers['cf-connecting-ip']) {
      // Para Cloudflare
      ipAddress = req.headers['cf-connecting-ip'].toString();
    } else {
      ipAddress = 'IP não detectado';
    }

    console.log('📱 Informações do cliente capturadas:', {
      userAgent: userAgent,
      ipAddress: ipAddress,
      headers: {
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'x-real-ip': req.headers['x-real-ip'],
        'cf-connecting-ip': req.headers['cf-connecting-ip']
      }
    });

    // Calcular valor total (R$ 1,00 por palpite)
    const valorTotal = palpites.length * 1.0;

    // Data de expiração: 5 minutos a partir de agora
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Criar bilhete no banco
    const bilhete = await prisma.bilhete.create({
      data: {
        whatsapp,
        nome,
        valorTotal,
        quantidadePalpites: palpites.length,
        status: 'PENDENTE',
        expiresAt,
        ipAddress: ipAddress,
        userAgent: userAgent,
        concursoId: concursoAtivo.id
      }
    });

    console.log('✅ Bilhete criado:', bilhete.id);

    // Atualizar palpites para associar ao bilhete
    const palpiteIds = palpites.map((p: any) => p.id);
    await prisma.palpite.updateMany({
      where: {
        id: { in: palpiteIds },
        whatsapp: whatsapp
      },
      data: {
        bilheteId: bilhete.id,
        nome: nome,
        status: 'pendente'
      }
    });

    console.log('✅ Palpites associados ao bilhete');

    // Gerar PIX
    console.log('💰 Gerando PIX para o bilhete...');

    const pixResponse = await fetch(`${req.headers.origin}/api/gerar-pix`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        whatsapp,
        valorTotal,
        totalBilhetes: palpites.length,
        bilheteId: bilhete.id
      })
    });

    const pixData = await pixResponse.json();

    if (!pixData.success) {
      // Se falhou ao gerar PIX, cancelar bilhete
      await prisma.bilhete.update({
        where: { id: bilhete.id },
        data: { status: 'CANCELADO' }
      });

      return res.status(500).json({
        error: 'Erro ao gerar PIX',
        details: pixData.details || 'Falha na geração do PIX'
      });
    }

    // Atualizar bilhete com dados do PIX
    const bilheteAtualizado = await prisma.bilhete.update({
      where: { id: bilhete.id },
      data: {
        txid: pixData.pix.txid,
        orderId: pixData.pix.locationId
      },
      include: {
        palpites: {
          include: {
            jogo: true
          }
        }
      }
    });

    console.log('✅ Bilhete atualizado com dados do PIX');

    // Programar cancelamento automático após 5 minutos
    setTimeout(async () => {
      try {
        console.log(`⏰ Verificando expiração do bilhete ${bilhete.id}...`);

        const bilheteAtual = await prisma.bilhete.findUnique({
          where: { id: bilhete.id }
        });

        if (bilheteAtual && bilheteAtual.status === 'PENDENTE') {
          console.log(`🔴 Cancelando bilhete expirado: ${bilhete.id}`);

          await prisma.bilhete.update({
            where: { id: bilhete.id },
            data: { status: 'EXPIRADO' }
          });

          // Cancelar palpites associados
          await prisma.palpite.updateMany({
            where: { bilheteId: bilhete.id },
            data: { status: 'cancelado' }
          });

          console.log(`✅ Bilhete ${bilhete.id} marcado como expirado`);
        }
      } catch (error) {
        console.error('❌ Erro ao cancelar bilhete expirado:', error);
      }
    }, 5 * 60 * 1000); // 5 minutos

    return res.status(200).json({
      success: true,
      bilhete: {
        id: bilheteAtualizado.id,
        status: bilheteAtualizado.status,
        valorTotal: bilheteAtualizado.valorTotal,
        quantidadePalpites: bilheteAtualizado.quantidadePalpites,
        expiresAt: bilheteAtualizado.expiresAt.toISOString(),
        txid: bilheteAtualizado.txid,
        palpites: bilheteAtualizado.palpites
      },
      pix: pixData.pix
    });

  } catch (error) {
    console.error('❌ Erro ao criar bilhete:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  } finally {
    await prisma.$disconnect();
  }
}
