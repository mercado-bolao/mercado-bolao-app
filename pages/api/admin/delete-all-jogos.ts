
import { prisma } from "../../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    console.log('🗑️ Iniciando limpeza de todos os jogos...');
    
    // Usar transação para garantir que tudo seja deletado corretamente
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Deletar todos os palpites (relacionados aos jogos)
      const palpitesDeleted = await tx.palpite.deleteMany({});
      console.log(`✅ Todos os palpites deletados: ${palpitesDeleted.count}`);
      
      // 2. Deletar todos os jogos
      const jogosDeleted = await tx.jogo.deleteMany({});
      console.log(`✅ Todos os jogos deletados: ${jogosDeleted.count}`);
      
      return {
        palpites: palpitesDeleted.count,
        jogos: jogosDeleted.count
      };
    });

    console.log('🎉 Limpeza de jogos finalizada!');
    
    return res.status(200).json({ 
      message: "Todos os jogos foram deletados com sucesso!",
      deletedCounts: resultado
    });
    
  } catch (error) {
    console.error('❌ Erro ao deletar jogos:', error);
    return res.status(500).json({ 
      error: "Erro ao deletar jogos", 
      details: error.message 
    });
  }
}
