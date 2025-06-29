
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const clientId = process.env.EFI_CLIENT_ID;
    const clientSecret = process.env.EFI_CLIENT_SECRET;
    const sandbox = process.env.EFI_SANDBOX;

    console.log('🔍 Testando credenciais EFI...');
    console.log('- CLIENT_ID:', clientId);
    console.log('- CLIENT_SECRET:', clientSecret ? 'Definido' : 'Não definido');
    console.log('- SANDBOX:', sandbox);

    // Verificar se credenciais são de sandbox baseado no formato
    const isSandboxCredential = clientId?.includes('Client_Id_') || false;
    
    const EfiPay = require('sdk-node-apis-efi');

    // Teste com sandbox=true
    console.log('🧪 Testando com SANDBOX=true...');
    const efiConfigSandbox = {
      client_id: clientId,
      client_secret: clientSecret,
      sandbox: true
    };

    const efipayTest = new EfiPay(efiConfigSandbox);
    
    try {
      // Tentar uma operação simples que requer autenticação
      const testBody = {
        calendario: { expiracao: 3600 },
        valor: { original: '0.01' },
        chave: process.env.EFI_PIX_KEY || 'teste@email.com',
        solicitacaoPagador: 'Teste de credenciais'
      };

      await efipayTest.pixCreateImmediateCharge([], testBody);
      
      return res.status(200).json({
        success: true,
        message: 'Credenciais válidas para SANDBOX',
        credentialType: isSandboxCredential ? 'sandbox' : 'produção',
        recommendation: isSandboxCredential 
          ? 'Use EFI_SANDBOX=true nos Secrets'
          : 'Credenciais podem ser de produção, teste com EFI_SANDBOX=false',
        currentConfig: {
          CLIENT_ID: clientId,
          SANDBOX: sandbox,
          DETECTED_TYPE: isSandboxCredential ? 'sandbox' : 'produção'
        }
      });

    } catch (sandboxError: any) {
      console.error('❌ Erro no teste sandbox:', sandboxError);
      
      return res.status(400).json({
        success: false,
        error: 'Credenciais inválidas',
        details: sandboxError?.error_description || sandboxError?.message || 'Erro desconhecido',
        credentialType: isSandboxCredential ? 'sandbox' : 'produção',
        recommendation: 'Verifique se CLIENT_ID e CLIENT_SECRET estão corretos nos Secrets',
        currentConfig: {
          CLIENT_ID: clientId,
          SANDBOX: sandbox,
          DETECTED_TYPE: isSandboxCredential ? 'sandbox' : 'produção'
        }
      });
    }

  } catch (error: any) {
    console.error('❌ Erro geral:', error);
    return res.status(500).json({
      error: 'Erro ao testar credenciais',
      details: error.message
    });
  }
}
