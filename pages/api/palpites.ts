import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== API PALPITES INICIADA ===');
  console.log('Método:', req.method);
  console.log('Body recebido:', req.body);

  if (req.method === 'POST') {
    const { nome, whatsapp, jogoId, resultado } = req.body;

    // Validações básicas
    if (!nome || !whatsapp || !jogoId || !resultado) {
      console.error('Dados obrigatórios ausentes:', { nome: !!nome, whatsapp: !!whatsapp, jogoId: !!jogoId, resultado: !!resultado });
      return res.status(400).json({ 
        error: 'Dados obrigatórios ausentes',
        required: { nome, whatsapp, jogoId, resultado }
      });
    }

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
  } else {
    console.log('Método não permitido:', req.method);
    res.status(405).json({ error: 'Método não permitido' });
  }
}