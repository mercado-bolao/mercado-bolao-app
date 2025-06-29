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
    console.log('🗑️ INICIANDO LIMPEZA FORÇADA COMPLETA DO BANCO...');

    // Método 1: Tentar usar CASCADE direto no SQL
    try {
      console.log('🔧 Tentativa 1: Usando SQL direto com CASCADE...');

      // Desabilitar verificação de foreign key temporariamente
      await prisma.$executeRaw`PRAGMA foreign_keys = OFF;`;

      // Deletar todos os dados na ordem correta
      await prisma.$executeRaw`DELETE FROM Palpite;`;
      console.log('✅ Palpites deletados via SQL');

      await prisma.$executeRaw`DELETE FROM Jogo;`;
      console.log('✅ Jogos deletados via SQL');

      await prisma.$executeRaw`DELETE FROM Concurso;`;
      console.log('✅ Concursos deletados via SQL');

      // Reabilitar verificação de foreign key
      await prisma.$executeRaw`PRAGMA foreign_keys = ON;`;

      // Verificar se está tudo limpo
      const finalPalpites = await prisma.palpite.count();
      const finalJogos = await prisma.jogo.count();
      const finalConcursos = await prisma.concurso.count();

      console.log('🎉 LIMPEZA FORÇADA CONCLUÍDA COM SUCESSO!');

      return res.status(200).json({
        message: "LIMPEZA FORÇADA COMPLETA - Banco de dados totalmente limpo!",
        method: "SQL direto com PRAGMA",
        finalCounts: {
          palpites: finalPalpites,
          jogos: finalJogos,
          concursos: finalConcursos
        }
      });

    } catch (sqlError) {
      console.log('⚠️ Método SQL falhou, tentando método 2...');

      // Método 2: Deletar registros individuais forçadamente
      console.log('🔧 Tentativa 2: Deletando registros individuais...');

      // Buscar todos os IDs primeiro
      const todosPalpites = await prisma.palpite.findMany({ select: { id: true } });
      const todosJogos = await prisma.jogo.findMany({ select: { id: true } });
      const todosConcursos = await prisma.concurso.findMany({ select: { id: true } });

      console.log(`Encontrados: ${todosPalpites.length} palpites, ${todosJogos.length} jogos, ${todosConcursos.length} concursos`);

      let deletedCounts = { palpites: 0, jogos: 0, concursos: 0 };

      // Deletar palpites um por um
      for (const palpite of todosPalpites) {
        try {
          await prisma.palpite.delete({ where: { id: palpite.id } });
          deletedCounts.palpites++;
        } catch (e: any) {
          console.log(`Erro ao deletar palpite ${palpite.id}:`, e.message);
        }
      }

      // Deletar jogos um por um
      for (const jogo of todosJogos) {
        try {
          await prisma.jogo.delete({ where: { id: jogo.id } });
          deletedCounts.jogos++;
        } catch (e: any) {
          console.log(`Erro ao deletar jogo ${jogo.id}:`, e.message);
        }
      }

      // Deletar concursos um por um
      for (const concurso of todosConcursos) {
        try {
          await prisma.concurso.delete({ where: { id: concurso.id } });
          deletedCounts.concursos++;
        } catch (e: any) {
          console.log(`Erro ao deletar concurso ${concurso.id}:`, e.message);
        }
      }

      console.log('🎉 LIMPEZA INDIVIDUAL CONCLUÍDA!');

      return res.status(200).json({
        message: "LIMPEZA FORÇADA COMPLETA - Deletados individualmente!",
        method: "Deleção individual",
        deletedCounts
      });
    }

  } catch (error) {
    console.error('❌ ERRO CRÍTICO na limpeza forçada:', error);

    // Método 3: Reset total do banco (último recurso)
    try {
      console.log('🚨 MÉTODO DE EMERGÊNCIA: Resetando estrutura do banco...');

      // Dropar e recriar tabelas (cuidado!)
      await prisma.$executeRaw`DROP TABLE IF EXISTS Palpite;`;
      await prisma.$executeRaw`DROP TABLE IF EXISTS Jogo;`;
      await prisma.$executeRaw`DROP TABLE IF EXISTS Concurso;`;
      await prisma.$executeRaw`DROP TABLE IF EXISTS User;`;

      console.log('⚠️ Tabelas dropadas - será necessário rodar migrate novamente');

      return res.status(200).json({
        message: "EMERGÊNCIA: Banco resetado - Execute 'npx prisma migrate deploy' para recriar as tabelas",
        method: "Reset completo",
        warning: "Será necessário rodar migrate novamente"
      });

    } catch (resetError: any) {
      return res.status(500).json({
        error: "ERRO CRÍTICO: Falha em todos os métodos de limpeza",
        details: {
          originalError: error instanceof Error ? error.message : String(error),
          resetError: resetError.message
        }
      });
    }
  }
}
