
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔬 Teste detalhado EFI Pay iniciado...');

    // Verificar variáveis
    const config = {
      clientId: process.env.EFI_CLIENT_ID,
      clientSecret: process.env.EFI_CLIENT_SECRET,
      pixKey: process.env.EFI_PIX_KEY,
      sandbox: process.env.EFI_SANDBOX === 'true'
    };

    console.log('📋 Configurações:');
    console.log('- CLIENT_ID:', config.clientId);
    console.log('- CLIENT_SECRET:', config.clientSecret ? 'Definido' : 'Não definido');
    console.log('- PIX_KEY:', config.pixKey);
    console.log('- SANDBOX:', config.sandbox);

    if (!config.clientId || !config.clientSecret || !config.pixKey) {
      return res.status(400).json({
        error: 'Credenciais incompletas',
        missing: {
          clientId: !config.clientId,
          clientSecret: !config.clientSecret,
          pixKey: !config.pixKey
        }
      });
    }

    const EfiPay = require('sdk-node-apis-efi');

    // Configurar EFI
    let efiConfig = {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      sandbox: config.sandbox
    };

    console.log('🔧 Criando instância EFI...');
    const efipay = new EfiPay(efiConfig);

    // Teste 1: Criar cobrança PIX
    console.log('🧪 Teste 1: Criando cobrança PIX...');
    const txid = `TEST${Date.now()}`;
    const testBody = {
      calendario: { expiracao: 3600 },
      devedor: { nome: 'Teste Debug', cpf: '12345678909' },
      valor: { original: '0.01' },
      chave: config.pixKey,
      solicitacaoPagador: 'Teste detalhado de debug'
    };

    console.log('📤 Body do teste:', JSON.stringify(testBody, null, 2));

    let cobrancaResponse;
    try {
      cobrancaResponse = await efipay.pixCreateImmediateCharge([], testBody);
      console.log('✅ Cobrança criada com sucesso!');
      console.log('📋 Resposta da cobrança:', JSON.stringify(cobrancaResponse, null, 2));
    } catch (cobrancaError) {
      console.error('❌ Erro na cobrança:', cobrancaError);
      return res.status(500).json({
        error: 'Erro ao criar cobrança de teste',
        details: cobrancaError?.response?.data || cobrancaError?.message,
        step: 'pixCreateImmediateCharge'
      });
    }

    // Teste 2: Gerar QR Code
    const locationId = cobrancaResponse?.loc?.id;
    console.log('🧪 Teste 2: Gerando QR Code...');
    console.log('📍 LocationId:', locationId);

    if (!locationId) {
      return res.status(500).json({
        error: 'loc.id não retornado na cobrança',
        cobrancaResponse: cobrancaResponse,
        step: 'missing_location_id'
      });
    }

    let qrResponse;
    try {
      qrResponse = await efipay.pixGenerateQRCode({ id: locationId });
      console.log('✅ QR Code gerado com sucesso!');
      console.log('📋 Resposta do QR:', JSON.stringify(qrResponse, null, 2));
    } catch (qrError) {
      console.error('❌ Erro no QR Code:', qrError);
      return res.status(500).json({
        error: 'Erro ao gerar QR Code de teste',
        details: qrError?.response?.data || qrError?.message,
        locationId: locationId,
        step: 'pixGenerateQRCode'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Teste completo realizado com sucesso!',
      results: {
        cobranca: {
          txid: cobrancaResponse.txid,
          locationId: locationId,
          status: 'OK'
        },
        qrCode: {
          hasQrcode: !!qrResponse.qrcode,
          hasImage: !!qrResponse.imagemQrcode,
          status: 'OK'
        }
      },
      config: {
        sandbox: config.sandbox,
        environment: config.sandbox ? 'SANDBOX' : 'PRODUÇÃO'
      }
    });

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
    return res.status(500).json({
      error: 'Erro geral no teste detalhado',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
