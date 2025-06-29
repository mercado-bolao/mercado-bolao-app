
import { NextApiRequest, NextApiResponse } from 'next';

// Função para fazer requisições com timeout customizado
async function fetchWithTimeout(url: string, options: any, timeoutMs: number = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options.headers,
        'User-Agent': 'Replit-Test/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

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
    console.log('🧪 Teste com FETCH nativo:', txid);

    // Configurações da EFÍ
    const efiSandbox = process.env.EFI_SANDBOX || 'false';
    const efiClientId = process.env.EFI_CLIENT_ID;
    const efiClientSecret = process.env.EFI_CLIENT_SECRET;

    if (!efiClientId || !efiClientSecret) {
      return res.status(400).json({
        success: false,
        error: 'Credenciais EFI não configuradas'
      });
    }

    const isSandbox = efiSandbox === 'true';
    const baseUrl = isSandbox 
      ? 'https://pix-h.api.efipay.com.br'
      : 'https://pix.api.efipay.com.br';

    console.log('🏗️ Ambiente:', isSandbox ? 'SANDBOX' : 'PRODUÇÃO');

    // Obter token de acesso usando fetch
    console.log('🔑 Obtendo token com fetch...');
    
    const authString = Buffer.from(`${efiClientId}:${efiClientSecret}`).toString('base64');
    
    const tokenResponse = await fetchWithTimeout(`${baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify({
        grant_type: 'client_credentials'
      })
    }, 15000);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Erro ao obter token:', errorText);
      return res.status(400).json({
        success: false,
        error: 'Erro ao obter token de acesso',
        details: errorText,
        statusCode: tokenResponse.status
      });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    console.log('✅ Token obtido com fetch');

    // Consultar PIX
    console.log('📡 Consultando PIX com fetch...');
    
    const pixResponse = await fetchWithTimeout(`${baseUrl}/v2/pix/${txid}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }, 15000);

    const pixResponseText = await pixResponse.text();
    console.log('📋 Resposta PIX:', pixResponseText);

    if (pixResponse.ok) {
      const pixData = JSON.parse(pixResponseText);
      
      return res.status(200).json({
        success: true,
        message: '✅ Fetch nativo funcionou!',
        txid: txid,
        status: pixData.status,
        pixData: pixData,
        method: 'fetch'
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
        error: 'TXID rejeitado pela API (usando fetch)',
        statusCode: pixResponse.status,
        errorData: errorData,
        txidTentado: txid
      });
    }

  } catch (error) {
    console.error('❌ Erro no teste fetch:', error);
    
    // Analisar tipo de erro
    let errorType = 'desconhecido';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorDetails = error.message;
      
      if (error.name === 'AbortError') {
        errorType = 'timeout';
      } else if (error.message.includes('fetch')) {
        errorType = 'network';
      } else if (error.message.includes('ENOTFOUND')) {
        errorType = 'dns';
      }
    }
    
    return res.status(500).json({
      success: false,
      error: 'Erro no teste fetch',
      details: errorDetails,
      errorType,
      suggestions: {
        timeout: 'A API EFÍ demorou muito para responder',
        network: 'Problema de rede ou conectividade',
        dns: 'Não conseguiu resolver o nome efipay.com.br',
        desconhecido: 'Erro não identificado'
      }
    });
  }
}
