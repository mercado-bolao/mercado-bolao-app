
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { TxidUtils } from '../../../lib/txid-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const prisma = new PrismaClient();

  try {
    console.log('🔧 Iniciando organização de TXIDs...');

    // 1. Buscar todos os bilhetes com TXID
    const bilhetes = await prisma.bilhete.findMany({
      where: {
        txid: {
          not: null
        }
      },
      include: {
        pix: true
      }
    });

    console.log(`📊 Encontrados ${bilhetes.length} bilhetes com TXID`);

    const relatorio = {
      total: bilhetes.length,
      validos: 0,
      invalidos: 0,
      corrigidos: 0,
      erros: 0,
      detalhes: [] as any[]
    };

    // 2. Analisar cada TXID
    for (const bilhete of bilhetes) {
      try {
        const analise = TxidUtils.analisarTxid(bilhete.txid!);
        
        const detalhe = {
          bilheteId: bilhete.id,
          txidOriginal: bilhete.txid,
          analise: analise,
          acao: 'nenhuma'
        };

        if (analise.valido) {
          relatorio.validos++;
          detalhe.acao = 'válido - mantido';
        } else {
          relatorio.invalidos++;
          
          // Tentar corrigir TXID inválido
          if (analise.sanitizado && analise.sanitizado.length >= 26 && analise.sanitizado.length <= 35) {
            // TXID pode ser salvo após sanitização
            await prisma.bilhete.update({
              where: { id: bilhete.id },
              data: { txid: analise.sanitizado }
            });

            // Atualizar PIX também se existir
            if (bilhete.pix) {
              await prisma.pixPagamento.update({
                where: { id: bilhete.pix.id },
                data: { txid: analise.sanitizado }
              });
            }

            relatorio.corrigidos++;
            detalhe.acao = 'corrigido - sanitizado';
            detalhe.txidCorrigido = analise.sanitizado;
          } else {
            // TXID não pode ser salvo - gerar novo
            const novoTxid = TxidUtils.gerarTxidUnico('FIX');
            
            await prisma.bilhete.update({
              where: { id: bilhete.id },
              data: { txid: novoTxid }
            });

            // Atualizar PIX também se existir
            if (bilhete.pix) {
              await prisma.pixPagamento.update({
                where: { id: bilhete.pix.id },
                data: { txid: novoTxid }
              });
            }

            relatorio.corrigidos++;
            detalhe.acao = 'substituído - novo TXID gerado';
            detalhe.txidCorrigido = novoTxid;
          }
        }

        relatorio.detalhes.push(detalhe);

      } catch (error) {
        console.error(`❌ Erro ao processar bilhete ${bilhete.id}:`, error);
        relatorio.erros++;
        
        relatorio.detalhes.push({
          bilheteId: bilhete.id,
          txidOriginal: bilhete.txid,
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
          acao: 'erro'
        });
      }
    }

    console.log('✅ Organização de TXIDs concluída:', relatorio);

    return res.status(200).json({
      success: true,
      message: 'TXIDs organizados com sucesso!',
      relatorio: relatorio
    });

  } catch (error) {
    console.error('❌ Erro na organização de TXIDs:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Erro ao organizar TXIDs',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  } finally {
    await prisma.$disconnect();
  }
}
