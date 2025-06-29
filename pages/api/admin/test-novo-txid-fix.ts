
import { NextApiRequest, NextApiResponse } from 'next';
import { TxidUtils } from '../../../lib/txid-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('🧪 Testando novo gerador de TXID...');

    // Gerar 10 TXIDs de teste
    const txidsGerados = [];
    
    for (let i = 0; i < 10; i++) {
      const txid = TxidUtils.gerarTxidSeguro(32);
      const analise = TxidUtils.analisarTxid(txid);
      
      txidsGerados.push({
        txid: txid,
        comprimento: txid.length,
        valido: analise.valido,
        caracteresInvalidos: analise.caracteresInvalidos,
        recomendacao: analise.recomendacao
      });
    }

    // Testar diferentes comprimentos
    const testesComprimento = [];
    for (const length of [26, 28, 30, 32, 35]) {
      try {
        const txid = TxidUtils.gerarTxidSeguro(length);
        const analise = TxidUtils.analisarTxid(txid);
        
        testesComprimento.push({
          comprimento: length,
          txid: txid,
          valido: analise.valido,
          sucesso: true
        });
      } catch (error) {
        testesComprimento.push({
          comprimento: length,
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
          sucesso: false
        });
      }
    }

    const relatorio = {
      sucesso: true,
      timestamp: new Date().toISOString(),
      txidsGerados: txidsGerados,
      testesComprimento: testesComprimento,
      estatisticas: {
        totalGerados: txidsGerados.length,
        todosValidos: txidsGerados.every(t => t.valido),
        comprimentoPadrao: 32,
        caracteresPermitidos: 'a-z, A-Z, 0-9 (62 caracteres)'
      }
    };

    console.log('✅ Teste de TXID concluído:', {
      gerados: txidsGerados.length,
      validos: txidsGerados.filter(t => t.valido).length
    });

    return res.status(200).json(relatorio);

  } catch (error) {
    console.error('❌ Erro no teste de TXID:', error);
    return res.status(500).json({
      sucesso: false,
      error: 'Erro ao testar gerador de TXID',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
