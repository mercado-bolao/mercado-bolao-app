
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { jogoId } = req.body;

  if (!jogoId) {
    return res.status(400).json({ error: 'ID do jogo é obrigatório' });
  }

  try {
    console.log('🗑️ Limpando resultado do jogo:', jogoId);

    // Verificar se o jogo existe
    const jogoExistente = await prisma.jogo.findUnique({
      where: { id: jogoId },
      include: {
        concurso: true
      }
    });

    if (!jogoExistente) {
      return res.status(404).json({ error: 'Jogo não encontrado' });
    }

    console.log('✅ Jogo encontrado:', {
      id: jogoExistente.id,
      mandante: jogoExistente.mandante,
      visitante: jogoExistente.visitante,
      resultadoAtual: jogoExistente.resultado,
      concurso: jogoExistente.concurso.numero
    });

    // Limpar o resultado (definir como null)
    const jogoAtualizado = await prisma.jogo.update({
      where: { id: jogoId },
      data: {
        resultado: null
      }
    });

    console.log('✅ Resultado limpo com sucesso:', {
      id: jogoAtualizado.id,
      mandante: jogoAtualizado.mandante,
      visitante: jogoAtualizado.visitante,
      resultado: jogoAtualizado.resultado
    });

    return res.status(200).json({
      success: true,
      message: 'Resultado limpo com sucesso',
      jogo: jogoAtualizado
    });

  } catch (error) {
    console.error('❌ Erro ao limpar resultado:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}
