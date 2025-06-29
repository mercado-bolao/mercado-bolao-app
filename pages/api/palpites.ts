import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== API PALPITES INICIADA ===');
  console.log('Método:', req.method);
  console.log('Body recebido:', req.body);

  if (req.method === 'POST') {
    // Nova estrutura: recebe bilhetes completos
    const { nome, whatsapp, bilhetes } = req.body;

    // Fallback para compatibilidade com requests antigos (palpite individual)
    const { jogoId, resultado } = req.body;

    // Validações básicas
    if (!nome || !whatsapp) {
      console.error('Dados obrigatórios ausentes:', { nome: !!nome, whatsapp: !!whatsapp });
      return res.status(400).json({ 
        error: 'Nome e WhatsApp são obrigatórios',
        required: { nome, whatsapp }
      });
    }

    // Verificar se é request de bilhetes completos ou palpite individual
    if (bilhetes && Array.isArray(bilhetes)) {
      // Novo formato: processar bilhetes completos
      return await processarBilhetesCompletos(req, res, nome, whatsapp, bilhetes);
    } else if (jogoId && resultado) {
      // Formato antigo: processar palpite individual (fallback)
      return await processarPalpiteIndividual(req, res, nome, whatsapp, jogoId, resultado);
    } else {
      console.error('Formato de dados inválido');
      return res.status(400).json({ 
        error: 'Dados inválidos. Envie bilhetes completos ou palpite individual.',
        received: { bilhetes: !!bilhetes, jogoId: !!jogoId, resultado: !!resultado }
      });
    }
  } else {
    console.log('Método não permitido:', req.method);
    res.status(405).json({ error: 'Método não permitido' });
  }
}

// Função para processar bilhetes completos (NOVA LÓGICA)
async function processarBilhetesCompletos(req: NextApiRequest, res: NextApiResponse, nome: string, whatsapp: string, bilhetes: any[]) {
  console.log('=== PROCESSANDO BILHETES COMPLETOS ===');
  console.log('Total de bilhetes:', bilhetes.length);
  console.log('Bilhetes:', bilhetes);

  try {
    let totalSalvos = 0;
    let totalErros = 0;
    let mensagensErro: string[] = [];

    // Criar ou encontrar usuário
    let user = await prisma.user.findUnique({
      where: { whatsapp }
    });

    if (!user) {
      console.log('Criando novo usuário:', nome, whatsapp);
      user = await prisma.user.create({
        data: { nome, whatsapp }
      });
      console.log('Usuário criado com ID:', user.id);
    } else {
      console.log('Usuário existente encontrado:', user.id);
    }

    // Processar cada bilhete completo
    for (let bilheteIndex = 0; bilheteIndex < bilhetes.length; bilheteIndex++) {
      const bilhete = bilhetes[bilheteIndex];
      console.log(`\n--- PROCESSANDO BILHETE ${bilheteIndex + 1}/${bilhetes.length} ---`);
      console.log('Palpites do bilhete:', bilhete);

      if (!bilhete || typeof bilhete !== 'object') {
        console.error(`Bilhete ${bilheteIndex + 1} inválido:`, bilhete);
        totalErros++;
        mensagensErro.push(`Bilhete ${bilheteIndex + 1}: formato inválido`);
        continue;
      }

      // Processar cada palpite do bilhete
      for (const jogoId of Object.keys(bilhete)) {
        const resultado = bilhete[jogoId];
        
        // Converte '0' para 'X' se necessário
        const resultadoFinal = resultado === '0' ? 'X' : resultado;
        
        if (!['1', 'X', '2'].includes(resultadoFinal)) {
          console.error(`Resultado inválido para jogo ${jogoId}:`, resultado);
          totalErros++;
          mensagensErro.push(`Bilhete ${bilheteIndex + 1}, Jogo ${jogoId}: resultado inválido`);
          continue;
        }

        try {
          console.log(`Salvando palpite: Jogo ${jogoId} = ${resultadoFinal}`);

          // Buscar o jogo para pegar o concursoId
          const jogo = await prisma.jogo.findUnique({
            where: { id: jogoId },
            include: { concurso: true }
          });

          if (!jogo) {
            console.error('Jogo não encontrado:', jogoId);
            totalErros++;
            mensagensErro.push(`Bilhete ${bilheteIndex + 1}: Jogo ${jogoId} não encontrado`);
            continue;
          }

          const concursoId = jogo.concursoId;

          // Verificar se o concurso existe e se as apostas ainda estão abertas
          const concurso = await prisma.concurso.findUnique({
            where: { id: concursoId }
          });

          if (!concurso) {
            console.error('Concurso não encontrado:', concursoId);
            totalErros++;
            mensagensErro.push(`Bilhete ${bilheteIndex + 1}: Concurso não encontrado`);
            continue;
          }

          // Verificar se o período de apostas está encerrado
          if (concurso.fechamentoPalpites && new Date() > new Date(concurso.fechamentoPalpites)) {
            console.error('Palpites encerrados em:', concurso.fechamentoPalpites);
            totalErros++;
            mensagensErro.push(`Bilhete ${bilheteIndex + 1}: Período de apostas encerrado`);
            continue;
          }

          // Criar novo palpite (não usar upsert para permitir múltiplos bilhetes)
          const palpiteSalvo = await prisma.palpite.create({
            data: {
              userId: user.id,
              jogoId: jogoId,
              resultado: resultadoFinal,
              nome: nome,
              whatsapp: whatsapp,
              concursoId: concursoId,
              valor: 10.0 // Valor fixo de R$ 10,00 por bilhete completo
            }
          });

          console.log(`✅ Palpite salvo: ${palpiteSalvo.id}`);
          totalSalvos++;

        } catch (error) {
          console.error(`Erro ao salvar palpite do jogo ${jogoId}:`, error);
          totalErros++;
          mensagensErro.push(`Bilhete ${bilheteIndex + 1}, Jogo ${jogoId}: erro interno`);
        }
      }
    }

    console.log(`\n=== RESULTADO FINAL ===`);
    console.log(`✅ Palpites salvos: ${totalSalvos}`);
    console.log(`❌ Erros: ${totalErros}`);

    if (totalSalvos > 0) {
      const totalBilhetes = bilhetes.length;
      res.status(200).json({ 
        success: true, 
        message: `${totalBilhetes} bilhete(s) processado(s) com sucesso!`,
        detalhes: {
          bilhetesEnviados: totalBilhetes,
          palpitesSalvos: totalSalvos,
          erros: totalErros,
          mensagensErro: mensagensErro
        }
      });
    } else {
      res.status(400).json({ 
        error: 'Não foi possível salvar nenhum palpite',
        detalhes: {
          erros: totalErros,
          mensagensErro: mensagensErro
        }
      });
    }

  } catch (error) {
    console.error('=== ERRO GERAL AO PROCESSAR BILHETES ===');
    console.error('Erro completo:', error);
    
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

// Função para processar palpite individual (COMPATIBILIDADE)
async function processarPalpiteIndividual(req: NextApiRequest, res: NextApiResponse, nome: string, whatsapp: string, jogoId: string, resultado: string) {
  console.log('=== PROCESSANDO PALPITE INDIVIDUAL (MODO COMPATIBILIDADE) ===');

    // Converte '0' para 'X' se necessário (compatibilidade com frontend)
  const resultadoFinal = resultado === '0' ? 'X' : resultado;
  
  if (!['1', 'X', '2'].includes(resultadoFinal)) {
    console.error('Resultado inválido:', resultado);
    return res.status(400).json({ error: 'Resultado deve ser 1, X ou 2' });
  }

  try {
    console.log('Buscando jogo com ID:', jogoId);

    // Buscar o jogo para pegar o concursoId
    const jogo = await prisma.jogo.findUnique({
      where: { id: jogoId },
      include: { concurso: true }
    });

    if (!jogo) {
      console.error('Jogo não encontrado:', jogoId);
      return res.status(404).json({ error: 'Jogo não encontrado' });
    }

    console.log('Jogo encontrado:', jogo.id, 'Concurso:', jogo.concursoId);

    const concursoId = jogo.concursoId;

    // Verificar se o concurso existe e se as apostas ainda estão abertas
    const concurso = await prisma.concurso.findUnique({
      where: { id: concursoId }
    });

    if (!concurso) {
      console.error('Concurso não encontrado:', concursoId);
      return res.status(404).json({ error: 'Concurso não encontrado' });
    }

    console.log('Concurso encontrado:', concurso.numero, 'Status:', concurso.status);

    // Verificar se o período de apostas está encerrado
    if (concurso.fechamentoPalpites && new Date() > new Date(concurso.fechamentoPalpites)) {
      console.error('Palpites encerrados em:', concurso.fechamentoPalpites);
      return res.status(400).json({ 
        error: 'Período de palpites encerrado para este concurso',
        fechamentoPalpites: concurso.fechamentoPalpites
      });
    }

    console.log('Buscando usuário com WhatsApp:', whatsapp);

    // Criar ou encontrar usuário
    let user = await prisma.user.findUnique({
      where: { whatsapp }
    });

    if (!user) {
      console.log('Criando novo usuário:', nome, whatsapp);
      user = await prisma.user.create({
        data: { nome, whatsapp }
      });
      console.log('Usuário criado com ID:', user.id);
    } else {
      console.log('Usuário existente encontrado:', user.id);
    }

    console.log('Salvando palpite...');

    // Criar ou atualizar palpite
    const palpiteSalvo = await prisma.palpite.upsert({
      where: {
        userId_jogoId: {
          userId: user.id,
          jogoId: jogoId
        }
      },
      update: {
        resultado: resultadoFinal,
        nome: nome,
        whatsapp: whatsapp,
        concursoId: concursoId,
        valor: 10.0 // Valor fixo de R$ 10,00 por bilhete completo
      },
      create: {
        userId: user.id,
        jogoId: jogoId,
        resultado: resultadoFinal,
        nome: nome,
        whatsapp: whatsapp,
        concursoId: concursoId,
        valor: 10.0 // Valor fixo de R$ 10,00 por bilhete completo
      }
    });

    console.log('Palpite salvo com sucesso:', palpiteSalvo.id);
    console.log('=== API PALPITES FINALIZADA COM SUCESSO ===');

    res.status(200).json({ 
      success: true, 
      palpiteId: palpiteSalvo.id,
      message: 'Palpite salvo com sucesso'
    });
  } catch (error) {
    console.error('=== ERRO NA API PALPITES ===');
    console.error('Erro completo:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');

    // Verificar se é erro de conexão com banco
    if (error instanceof Error && error.message.includes('connect')) {
      return res.status(503).json({ 
        error: 'Erro de conexão com o banco de dados',
        details: 'Tente novamente em alguns segundos'
      });
    }

    // Verificar se é erro de constraint (chave única, etc)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      console.error('Erro de constraint única detectado');
      return res.status(409).json({ 
        error: 'Palpite já existe para este jogo',
        details: 'Tente atualizar a página e enviar novamente'
      });
    }

    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}