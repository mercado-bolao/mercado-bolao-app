
import { prisma } from "../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { step } = req.query;

  try {
    console.log('🔧 Iniciando debug step-by-step...');
    
    if (step === "palpites") {
      console.log('1️⃣ STEP 1: Deletando APENAS os palpites...');
      
      const palpitesDeleted = await prisma.palpite.deleteMany({});
      console.log(`✅ Todos os palpites deletados: ${palpitesDeleted.count}`);
      
      return res.status(200).json({ 
        message: "Step 1: Palpites deletados com sucesso!",
        deletedCounts: {
          palpites: palpitesDeleted.count
        }
      });
      
    } else if (step === "jogos") {
      console.log('2️⃣ STEP 2: Deletando APENAS os jogos...');
      
      const jogosDeleted = await prisma.jogo.deleteMany({});
      console.log(`✅ Todos os jogos deletados: ${jogosDeleted.count}`);
      
      return res.status(200).json({ 
        message: "Step 2: Jogos deletados com sucesso!",
        deletedCounts: {
          jogos: jogosDeleted.count
        }
      });
      
    } else if (step === "concursos") {
      console.log('3️⃣ STEP 3: Deletando APENAS os concursos...');
      
      const concursosDeleted = await prisma.concurso.deleteMany({});
      console.log(`✅ Todos os concursos deletados: ${concursosDeleted.count}`);
      
      return res.status(200).json({ 
        message: "Step 3: Concursos deletados com sucesso!",
        deletedCounts: {
          concursos: concursosDeleted.count
        }
      });
      
    } else if (step === "count") {
      console.log('📊 Contando registros...');
      
      const totalPalpites = await prisma.palpite.count();
      const totalJogos = await prisma.jogo.count();
      const totalConcursos = await prisma.concurso.count();
      
      console.log('Total palpites:', totalPalpites);
      console.log('Total jogos:', totalJogos);
      console.log('Total concursos:', totalConcursos);
      
      return res.status(200).json({ 
        message: "Contagem atual:",
        counts: {
          palpites: totalPalpites,
          jogos: totalJogos,
          concursos: totalConcursos
        }
      });
      
    } else {
      return res.status(400).json({ 
        error: "Step inválido. Use: ?step=palpites, ?step=jogos, ?step=concursos ou ?step=count" 
      });
    }
    
  } catch (error) {
    console.error('❌ Erro no debug step-by-step:', error);
    return res.status(500).json({ 
      error: "Erro no debug step-by-step", 
      details: error.message 
    });
  }
}
