import { prisma } from "../../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

// Função para converter formatos legados de resultado
function normalizarResultado(resultado: string): string | null {
  if (!resultado) return null;

  // Converter formatos antigos para o padrão atual
  switch (resultado.toUpperCase()) {
    case '1': return 'C'; // Casa
    case 'X': return 'E'; // Empate
    case '2': return 'F'; // Fora
    case 'C': return 'C'; // Casa (já no formato correto)
    case 'E': return 'E'; // Empate (já no formato correto)
    case 'F': return 'F'; // Fora (já no formato correto)
    default: return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    const { concursoId, mandante, visitante, horario, fotoMandante, fotoVisitante } = req.body;

    // Validar campos obrigatórios
    if (!concursoId || !mandante || !visitante || !horario) {
      return res.status(400).json({ 
        error: "Campos obrigatórios: concursoId, mandante, visitante, horario" 
      });
    }

    try {
      // Verificar se o concurso existe
      const concurso = await prisma.concurso.findUnique({
        where: { id: concursoId }
      });

      if (!concurso) {
        return res.status(404).json({ error: "Concurso não encontrado" });
      }

      // Converter a data do horário considerando o fuso horário do Brasil
      const horarioBrasil = new Date(horario);

      const jogo = await prisma.jogo.create({
        data: {
          concursoId,
          mandante: mandante.trim(),
          visitante: visitante.trim(),
          horario: horarioBrasil,
          fotoMandante: fotoMandante || null,
          fotoVisitante: fotoVisitante || null,
        },
      });
      return res.status(201).json(jogo);
    } catch (error) {
      console.error('Erro ao criar jogo:', error);
      return res.status(500).json({ 
        error: "Erro ao criar jogo",
        details: error.message 
      });
    }
  }

  if (req.method === "PUT") {
    const { id, mandante, visitante, horario, fotoMandante, fotoVisitante, resultado } = req.body;

    console.log('🎯 PUT request received:');
    console.log('  - ID:', id);
    console.log('  - Resultado:', resultado);
    console.log('  - Body completo:', req.body);

    if (!id) {
      console.error('❌ ID do jogo não fornecido');
      return res.status(400).json({ error: "ID do jogo é obrigatório" });
    }

    // Validar resultado se fornecido (agora aceita formato de placar como "2x1")
    let resultadoFinal = null;
    if (resultado) {
      // Se o resultado contém 'x', é um placar (ex: "2x1")
      if (resultado.includes('x')) {
        const [golsCasa, golsVisitante] = resultado.split('x');
        const gCasa = parseInt(golsCasa);
        const gVisitante = parseInt(golsVisitante);

        if (isNaN(gCasa) || isNaN(gVisitante)) {
          console.error('❌ Placar inválido:', resultado);
          return res.status(400).json({ error: "Placar deve estar no formato 'NxN' (ex: '2x1')" });
        }

        resultadoFinal = resultado; // Salva o placar completo
        console.log('✅ Placar válido:', resultado);
      } else {
        // Formato antigo (C/E/F/1/X/2)
        resultadoFinal = normalizarResultado(resultado);
        if (!resultadoFinal) {
          console.error('❌ Resultado inválido:', resultado);
          return res.status(400).json({ error: "Resultado deve ser um placar (ex: '2x1') ou 'C'/'E'/'F'" });
        }
        console.log('🔄 Resultado normalizado:', resultado, '=>', resultadoFinal);
      }
    }

    try {
      // Verificar se o jogo existe
      console.log('🔍 Buscando jogo com ID:', id);

      if (typeof id !== 'string' || id.length === 0) {
        console.error('❌ ID inválido:', id);
        return res.status(400).json({ error: "ID do jogo deve ser uma string válida" });
      }

      const jogoExistente = await prisma.jogo.findUnique({
        where: { id }
      });

      if (!jogoExistente) {
        console.error('❌ Jogo não encontrado para ID:', id);
        return res.status(404).json({ error: "Jogo não encontrado" });
      }

      console.log('✅ Jogo encontrado:', {
        id: jogoExistente.id,
        mandante: jogoExistente.mandante,
        visitante: jogoExistente.visitante,
        resultadoAtual: jogoExistente.resultado
      });

      console.log('🔄 Atualizando resultado para:', resultado);

      const updateData: any = {};

      if (mandante) updateData.mandante = mandante;
      if (visitante) updateData.visitante = visitante;
      if (horario) {
          // Converter horário brasileiro para UTC
          const horarioBrasil = new Date(horario);
          const horarioUTC = new Date(horarioBrasil.getTime() + (3 * 60 * 60 * 1000)); // Adicionar 3 horas
          updateData.horario = horarioUTC;
        }
      if (fotoMandante !== undefined) updateData.fotoMandante = fotoMandante;
      if (fotoVisitante !== undefined) updateData.fotoVisitante = fotoVisitante;
      if (resultadoFinal !== undefined) updateData.resultado = resultadoFinal;

      console.log('📦 Dados para atualização:', updateData);

      const jogo = await prisma.jogo.update({
        where: { id },
        data: updateData,
      });

      console.log('✅ Jogo atualizado com sucesso:', {
        id: jogo.id,
        mandante: jogo.mandante,
        visitante: jogo.visitante,
        resultado: jogo.resultado,
        resultadoOriginal: req.body.resultado,
        resultadoFinal: resultadoFinal
      });

      // Verificar se a atualização realmente aconteceu
      const jogoVerificacao = await prisma.jogo.findUnique({
        where: { id }
      });

      console.log('🔍 Verificação pós-update:', {
        id: jogoVerificacao?.id,
        resultado: jogoVerificacao?.resultado
      });

      return res.status(200).json({ 
        success: true, 
        message: 'Jogo atualizado com sucesso', 
        jogo: jogo,
        verificacao: jogoVerificacao
      });
    } catch (error) {
      console.error('❌ Erro detalhado ao atualizar jogo:', error);
      return res.status(500).json({ 
        success: false,
        error: "Erro interno do servidor ao atualizar jogo", 
        details: error.message
      });
    }
  }

  if (req.method === "GET") {
    const { concursoId } = req.query;

    try {
      const where: any = {};

      if (concursoId && concursoId !== "") {
        where.concursoId = concursoId as string;
      }

      const jogos = await prisma.jogo.findMany({
        where,
        include: {
          concurso: true,
        },
        orderBy: {
          horario: "asc"
        },
      });

      return res.status(200).json(jogos);
    } catch (error) {
      console.error('Erro ao buscar jogos:', error);
      return res.status(500).json({ error: "Erro ao buscar jogos", details: error.message });
    }
  }

  return res.status(405).json({ error: "Método não permitido" });
}