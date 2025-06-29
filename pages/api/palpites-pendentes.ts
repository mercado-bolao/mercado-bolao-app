
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Definir headers JSON primeiro
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { whatsapp } = req.query;

  console.log('📥 Query recebida:', req.query);
  console.log('📱 WhatsApp extraído:', whatsapp);
  console.log('📱 Tipo do WhatsApp:', typeof whatsapp);

  if (!whatsapp || typeof whatsapp !== 'string') {
    console.error('❌ WhatsApp inválido ou não fornecido');
    return res.status(400).json({ error: 'WhatsApp é obrigatório' });
  }

  try {
    console.log('🔍 Buscando palpites pendentes para:', whatsapp);

    // DEBUGGING: Primeiro vamos ver TODOS os palpites deste usuário
    const todosPalpites = await prisma.palpite.findMany({
      where: {
        whatsapp: whatsapp
      },
      select: {
        id: true,
        status: true,
        resultado: true,
        createdAt: true,
        jogo: {
          select: {
            mandante: true,
            visitante: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('🔍 TODOS os palpites do usuário:', todosPalpites.length);
    console.log('📋 Status dos palpites:', todosPalpites.map(p => ({ 
      id: p.id.substring(0, 8), 
      status: p.status, 
      jogo: `${p.jogo.mandante} x ${p.jogo.visitante}`,
      created: p.createdAt
    })));

    // Buscar palpites pendentes do usuário
    const palpites = await prisma.palpite.findMany({
      where: {
        whatsapp: whatsapp,
        status: 'pendente'
      },
      include: {
        jogo: {
          select: {
            id: true,
            mandante: true,
            visitante: true,
            horario: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('📊 Palpites PENDENTES encontrados:', palpites.length);

    if (palpites.length === 0) {
      return res.status(200).json({
        palpites: [],
        totalPalpites: 0,
        valorTotal: 0,
        usuario: { nome: '', whatsapp: whatsapp }
      });
    }

    // Calcular totais
    const totalPalpites = palpites.length;
    
    // Calcular número de bilhetes: cada bilhete tem 8 palpites
    const totalBilhetes = Math.ceil(totalPalpites / 8);
    
    // Valor total: R$ 10,00 por bilhete (não por palpite)
    const valorTotal = totalBilhetes * 10;

    // Pegar informações do usuário do primeiro palpite
    const usuario = {
      nome: palpites[0].nome,
      whatsapp: palpites[0].whatsapp
    };

    console.log('💰 Total de palpites:', totalPalpites);
    console.log('🎫 Total de bilhetes:', totalBilhetes);
    console.log('💰 Valor total calculado:', valorTotal);

    return res.status(200).json({
      palpites,
      totalPalpites,
      totalBilhetes,
      valorTotal,
      usuario
    });

  } catch (error) {
    console.error('❌ Erro ao buscar palpites pendentes:', error);
    
    // Garantir que sempre retornamos JSON
    try {
      return res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } catch (jsonError) {
      // Se falhar ao enviar JSON, enviar resposta simples
      console.error('❌ Erro ao enviar JSON:', jsonError);
      res.status(500).send('Erro interno do servidor');
    }
  }
}
