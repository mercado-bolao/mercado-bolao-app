
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('🧪 Testando integração EFÍ...');
    
    // Verificar variáveis de ambiente
    const hasClientId = !!process.env.EFI_CLIENT_ID;
    const hasClientSecret = !!process.env.EFI_CLIENT_SECRET;
    const hasPixKey = !!process.env.EFI_PIX_KEY;
    
    console.log('📋 Verificação de variáveis:');
    console.log('- EFI_CLIENT_ID:', hasClientId ? '✅' : '❌');
    console.log('- EFI_CLIENT_SECRET:', hasClientSecret ? '✅' : '❌');
    console.log('- EFI_PIX_KEY:', hasPixKey ? '✅' : '❌');
    
    if (!hasClientId || !hasClientSecret || !hasPixKey) {
      return res.status(400).json({
        error: 'Variáveis de ambiente não configuradas',
        missing: {
          clientId: !hasClientId,
          clientSecret: !hasClientSecret,
          pixKey: !hasPixKey
        }
      });
    }
    
    // Tentar importar o SDK da EFÍ
    let EfiPay;
    try {
      EfiPay = require('sdk-node-apis-efi');
      console.log('✅ SDK da EFÍ importado com sucesso');
    } catch (importError) {
      console.error('❌ Erro ao importar SDK da EFÍ:', importError);
      return res.status(500).json({
        error: 'SDK da EFÍ não encontrado',
        details: 'Execute: npm install sdk-node-apis-efi',
        importError: importError instanceof Error ? importError.message : 'Erro desconhecido'
      });
    }
    
    // Tentar criar instância da EFÍ
    let efipay;
    try {
      efipay = new EfiPay({
        client_id: process.env.EFI_CLIENT_ID,
        client_secret: process.env.EFI_CLIENT_SECRET,
        sandbox: true, // Sempre true para teste
        certificate: false, // Para sandbox não precisa
      });
      console.log('✅ Instância EFÍ criada com sucesso');
    } catch (instanceError) {
      console.error('❌ Erro ao criar instância EFÍ:', instanceError);
      return res.status(500).json({
        error: 'Erro ao criar instância EFÍ',
        details: instanceError instanceof Error ? instanceError.message : 'Erro desconhecido'
      });
    }
    
    // Tentar gerar um PIX de teste
    try {
      const testBody = {
        calendario: {
          expiracao: 3600,
        },
        devedor: {
          nome: 'Teste PIX',
          cpf: '12345678909',
        },
        valor: {
          original: '0.01', // R$ 0,01 para teste
        },
        chave: process.env.EFI_PIX_KEY,
        solicitacaoPagador: 'Teste de integração PIX',
      };
      
      console.log('🔄 Criando cobrança PIX de teste...');
      const pixResponse = await efipay.pixCreateImmediateCharge([], testBody);
      
      console.log('✅ PIX de teste criado:', pixResponse.txid);
      
      return res.status(200).json({
        success: true,
        message: 'Integração EFÍ funcionando!',
        testResult: {
          txid: pixResponse.txid,
          pixKey: process.env.EFI_PIX_KEY,
          sandbox: true
        }
      });
      
    } catch (pixError) {
      console.error('❌ Erro ao criar PIX de teste:', pixError);
      return res.status(500).json({
        error: 'Erro ao criar PIX de teste',
        details: pixError instanceof Error ? pixError.message : 'Erro desconhecido',
        apiResponse: pixError?.response?.data || null
      });
    }
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
    return res.status(500).json({
      error: 'Erro geral no teste de integração',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
