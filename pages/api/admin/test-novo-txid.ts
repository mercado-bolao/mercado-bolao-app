
import { NextApiRequest, NextApiResponse } from 'next';
import { TxidUtils } from '../../../lib/txid-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('🧪 Testando novo formato de TXID...');

    // Gerar vários TXIDs de teste
    const testResults = [];
    
    for (let i = 0; i < 5; i++) {
      const txid = TxidUtils.gerarTxidSeguro(32);
      const analise = TxidUtils.analisarTxid(txid);
      
      testResults.push({
        tentativa: i + 1,
        txid: txid,
        comprimento: txid.length,
        valido: analise.valido,
        analise: analise
      });
    }

    // Testar diferentes comprimentos
    const lengthTests = [];
    for (const length of [26, 30, 32, 35]) {
      try {
        const txid = TxidUtils.gerarTxidSeguro(length);
        lengthTests.push({
          comprimento: length,
          txid: txid,
          valido: TxidUtils.validarTxid(txid),
          sucesso: true
        });
      } catch (error) {
        lengthTests.push({
          comprimento: length,
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
          sucesso: false
        });
      }
    }

    console.log('✅ Teste de novo formato de TXID concluído');

    return res.status(200).json({
      success: true,
      message: 'Teste de novo formato de TXID concluído',
      resultados: {
        testesBasicos: testResults,
        testesComprimento: lengthTests,
        recomendacao: 'Use TxidUtils.gerarTxidSeguro(32) para gerar TXIDs válidos'
      }
    });

  } catch (error) {
    console.error('❌ Erro no teste de TXID:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro no teste de TXID',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
