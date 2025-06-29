
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { whatsapp } = req.body;

  if (!whatsapp) {
    return res.status(400).json({ error: 'WhatsApp é obrigatório' });
  }

  try {
    console.log('🗑️ Limpando carrinho para:', whatsapp);

    // Deletar todos os palpites pendentes do usuário
    const result = await prisma.palpite.deleteMany({
      where: {
        whatsapp: whatsapp,
        status: 'pendente'
      }
    });

    console.log('✅ Palpites pendentes removidos:', result.count);

    return res.status(200).json({
      success: true,
      message: `${result.count} palpite(s) pendente(s) removido(s) com sucesso`,
      palpitesRemovidos: result.count
    });

  } catch (error) {
    console.error('❌ Erro ao limpar carrinho:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
