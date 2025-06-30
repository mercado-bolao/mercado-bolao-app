import { prisma } from "../../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from '../../../lib/auth-middleware';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    console.log('🗑️ Iniciando limpeza completa do sistema...');

    // Usar transação para garantir que tudo seja deletado corretamente
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Deletar todos os palpites
      const palpitesDeleted = await tx.palpite.deleteMany({});
      console.log(`✅ Todos os palpites deletados: ${palpitesDeleted.count}`);

      // 2. Deletar todos os jogos
      const jogosDeleted = await tx.jogo.deleteMany({});
      console.log(`✅ Todos os jogos deletados: ${jogosDeleted.count}`);

      // 3. Deletar todos os concursos
      const concursosDeleted = await tx.concurso.deleteMany({});
      console.log(`✅ Todos os concursos deletados: ${concursosDeleted.count}`);

      // 4. Deletar todos os usuários (opcional - descomente se quiser)
      // const usersDeleted = await tx.user.deleteMany({});
      // console.log(`✅ Todos os usuários deletados: ${usersDeleted.count}`);

      return {
        palpites: palpitesDeleted.count,
        jogos: jogosDeleted.count,
        concursos: concursosDeleted.count,
        // users: usersDeleted.count
      };
    });

    console.log('🎉 Limpeza completa do sistema finalizada!');

    return res.status(200).json({
      message: "Sistema completamente limpo! Todos os dados foram removidos.",
      deletedCounts: resultado
    });

  } catch (error: any) {
    console.error('❌ Erro ao limpar sistema:', error);
    return res.status(500).json({
      error: "Erro ao limpar sistema",
      details: error.message
    });
  }
}

export default withAuth(handler);
