import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { txid } = req.query;

  if (!txid || typeof txid !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'TXID é obrigatório'
    });
  }

  try {
    console.log('🏖️ Teste SANDBOX da EFÍ:', txid);

    // Forçar sandbox
    const efiClientId = process.env.EFI_CLIENT_ID;
    const efiClientSecret = process.env.EFI_CLIENT_SECRET;

    if (!efiClientId || !efiClientSecret) {
      return res.status(400).json({
        success: false,
        error: 'Credenciais EFI não configuradas'
      });
    }

    // URL SANDBOX
    const baseUrl = 'https://pix-h.api.efipay.com.br';
    
    console.log('🏗️ Usando SANDBOX obrigatoriamente');
    console.log('🌐 Base URL:', baseUrl);

    // Obter token de acesso
    console.log('🔑 Obtendo token no sandbox...');
    
    const authString = Buffer.from(`${efiClientId}:${efiClientSecret}`).toString('base64');
    
    const tokenResponse = await fetch(`${baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`,
        'User-Agent': 'Replit-Sandbox-Test/1.0'
      },
      body: JSON.stringify({
        grant_type: 'client_credentials'
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Erro ao obter token sandbox:', errorText);
      
      return res.status(400).json({
        success: false,
        error: 'Erro ao obter token de acesso no sandbox',
        details: errorText,
        statusCode: tokenResponse.status,
        ambiente: 'SANDBOX'
      });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    console.log('✅ Token sandbox obtido com sucesso');

    // Consultar PIX no sandbox
    console.log('📡 Consultando PIX no sandbox...');
    
    const pixResponse = await fetch(`${baseUrl}/v2/pix/${txid}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Replit-Sandbox-Test/1.0'
      }
    });

    const pixResponseText = await pixResponse.text();
    console.log('📋 Resposta PIX sandbox:', pixResponseText);

    if (pixResponse.ok) {
      const pixData = JSON.parse(pixResponseText);
      
      return res.status(200).json({
        success: true,
        message: '✅ SANDBOX funcionou! Conectividade OK.',
        txid: txid,
        status: pixData.status || 'N/A',
        pixData: pixData,
        ambiente: 'SANDBOX',
        recomendacao: 'Use SANDBOX no Replit para evitar bloqueios de rede'
      });

    } else {
      let errorData;
      try {
        errorData = JSON.parse(pixResponseText);
      } catch {
        errorData = { message: pixResponseText };
      }

      return res.status(400).json({
        success: false,
        error: 'TXID rejeitado pela API EFÍ (SANDBOX)',
        statusCode: pixResponse.status,
        errorData: errorData,
        txidTentado: txid,
        ambiente: 'SANDBOX'
      });
    }

  } catch (error) {
    console.error('❌ Erro no teste sandbox:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Erro no teste sandbox',
      details: error instanceof Error ? error.message : String(error),
      ambiente: 'SANDBOX'
    });
  }
}