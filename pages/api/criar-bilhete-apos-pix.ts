
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

interface PalpiteData {
  jogoId: string;
  resultado: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { nome, whatsapp, palpites, txid, orderId, valorTotal, pixId } = req.body;

    console.log('🔄 Criando bilhetes após PIX gerado...');
    console.log('📥 Dados recebidos:', { nome, whatsapp, palpitesCount: palpites?.length, txid, orderId });

    // Validar dados obrigatórios
    if (!nome || !whatsapp || !palpites || !Array.isArray(palpites) || palpites.length === 0) {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos',
        details: 'Nome, WhatsApp e palpites são obrigatórios'
      });
    }

    if (!txid) {
      return res.status(400).json({
        error: 'TXID não fornecido',
        details: 'O TXID do PIX é obrigatório para criar os bilhetes'
      });
    }

    // Buscar concurso ativo
    const concursoAtivo = await prisma.concurso.findFirst({
      where: { status: 'ativo' },
      include: { jogos: true }
    });

    if (!concursoAtivo) {
      return res.status(400).json({ error: 'Nenhum concurso ativo encontrado' });
    }

    console.log('✅ Concurso ativo encontrado:', concursoAtivo.id);

    // Validar se todos os jogos existem
    const jogoIds = palpites.map((p: PalpiteData) => p.jogoId);
    const jogosExistentes = await prisma.jogo.findMany({
      where: {
        id: { in: jogoIds },
        concursoId: concursoAtivo.id
      }
    });

    if (jogosExistentes.length !== jogoIds.length) {
      return res.status(400).json({
        error: 'Alguns jogos não foram encontrados',
        details: `${jogosExistentes.length} de ${jogoIds.length} jogos encontrados`
      });
    }

    console.log('✅ Todos os jogos validados');

    // Criar data de expiração (5 minutos a partir de agora)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Criar um bilhete para cada palpite
    const bilhetesCriados = [];

    for (const palpite of palpites) {
      const bilhete = await prisma.bilhete.create({
        data: {
          whatsapp,
          nome,
          valorTotal: 10.0, // R$ 10,00 por bilhete
          quantidadePalpites: 1,
          status: 'PENDENTE',
          txid,
          orderId,
          expiresAt,
          pixId
        }
      });

      // Criar o palpite associado ao bilhete
      await prisma.palpite.create({
        data: {
          nome,
          whatsapp,
          resultado: palpite.resultado,
          valor: 10.0,
          status: 'pendente',
          jogoId: palpite.jogoId,
          concursoId: concursoAtivo.id,
          bilheteId: bilhete.id,
          pixId
        }
      });

      bilhetesCriados.push(bilhete);
      console.log('✅ Bilhete criado:', bilhete.id);
    }

    console.log(`✅ ${bilhetesCriados.length} bilhetes criados com sucesso`);

    return res.status(200).json({
      success: true,
      message: `${bilhetesCriados.length} bilhete(s) criado(s) com sucesso`,
      bilhetes: bilhetesCriados.map(b => ({
        id: b.id,
        status: b.status,
        valorTotal: b.valorTotal,
        expiresAt: b.expiresAt
      }))
    });

  } catch (error) {
    console.error('❌ Erro ao criar bilhetes após PIX:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
