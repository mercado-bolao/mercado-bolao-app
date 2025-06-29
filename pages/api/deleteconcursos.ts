
import { prisma } from "../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") return res.status(405).end();

  const { concursoIds } = req.body;

  try {
    if (concursoIds && Array.isArray(concursoIds) && concursoIds.length > 0) {
      // Delete specific concursos usando transação com ordem correta
      const resultado = await prisma.$transaction(async (tx) => {
        let totalPalpitesDeleted = 0;
        let totalJogosDeleted = 0;
        let totalConcursosDeleted = 0;

        for (const concursoId of concursoIds) {
          console.log(`Deletando concurso: ${concursoId}`);

          // 1. PRIMEIRO: Delete all palpites (dependem de jogo E concurso)
          const palpitesDeleted = await tx.palpite.deleteMany({
            where: { concursoId }
          });
          console.log(`✅ Palpites deletados: ${palpitesDeleted.count}`);
          totalPalpitesDeleted += palpitesDeleted.count;

          // 2. SEGUNDO: Delete all jogos (dependem de concurso)
          const jogosDeleted = await tx.jogo.deleteMany({
            where: { concursoId }
          });
          console.log(`✅ Jogos deletados: ${jogosDeleted.count}`);
          totalJogosDeleted += jogosDeleted.count;

          // 3. TERCEIRO: Delete o concurso (não tem dependências)
          await tx.concurso.delete({
            where: { id: concursoId }
          });
          console.log(`✅ Concurso deletado: ${concursoId}`);
          totalConcursosDeleted++;
        }

        return {
          palpites: totalPalpitesDeleted,
          jogos: totalJogosDeleted,
          concursos: totalConcursosDeleted
        };
      });

      res.status(200).json({
        message: `${concursoIds.length} concurso(s) deletado(s) com sucesso!`,
        deletedCounts: resultado,
        deletedIds: concursoIds
      });
    } else {
      // Delete all concursos - ordem: PALPITES → JOGOS → CONCURSOS
      const resultado = await prisma.$transaction(async (tx) => {
        console.log('🗑️ Deletando TODOS os dados seguindo ordem de dependências...');

        // 1. PRIMEIRO: Deletar TODOS os palpites (dependem de jogo e concurso)
        const palpitesDeleted = await tx.palpite.deleteMany({});
        console.log(`✅ Todos os palpites deletados: ${palpitesDeleted.count}`);

        // 2. SEGUNDO: Deletar TODOS os jogos (dependem de concurso)
        const jogosDeleted = await tx.jogo.deleteMany({});
        console.log(`✅ Todos os jogos deletados: ${jogosDeleted.count}`);

        // 3. TERCEIRO: Deletar TODOS os concursos (não têm dependências)
        const concursosDeleted = await tx.concurso.deleteMany({});
        console.log(`✅ Todos os concursos deletados: ${concursosDeleted.count}`);

        return {
          palpites: palpitesDeleted.count,
          jogos: jogosDeleted.count,
          concursos: concursosDeleted.count
        };
      });

      res.status(200).json({
        message: "Todos os concursos foram deletados com sucesso!",
        deletedCounts: resultado
      });
    }
  } catch (error: any) {
    console.error('❌ Erro ao deletar concursos:', error);
    res.status(500).json({
      error: 'Erro ao deletar concursos',
      details: error.message
    });
  }
}
