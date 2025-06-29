
import { NextApiRequest, NextApiResponse } from 'next';
import https from 'https';
import { URL } from 'url';

function makeHttpsRequest(url: string, options: any, postData?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 30000
    };

    console.log('🌐 Fazendo requisição HTTPS para:', url);
    console.log('🔧 Opções da requisição:', requestOptions);

    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📡 Status da resposta:', res.statusCode);
        console.log('📋 Dados recebidos:', data);
        
        try {
          const jsonData = JSON.parse(data);
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: jsonData,
            text: data
          });
        } catch (err) {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: null,
            text: data
          });
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Erro na requisição HTTPS:', err);
      reject(err);
    });

    req.on('timeout', () => {
      console.error('⏰ Timeout na requisição HTTPS');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
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
    console.log('🧪 Teste direto da API EFÍ usando HTTPS nativo:', txid);

    // Configurações da EFÍ
    const efiSandbox = process.env.EFI_SANDBOX || 'false';
    const efiClientId = process.env.EFI_CLIENT_ID;
    const efiClientSecret = process.env.EFI_CLIENT_SECRET;

    if (!efiClientId || !efiClientSecret) {
      return res.status(400).json({
        success: false,
        error: 'Credenciais EFI não configuradas',
        env_check: {
          EFI_SANDBOX: !!process.env.EFI_SANDBOX,
          EFI_CLIENT_ID: !!process.env.EFI_CLIENT_ID,
          EFI_CLIENT_SECRET: !!process.env.EFI_CLIENT_SECRET
        }
      });
    }

    const isSandbox = efiSandbox === 'true';
    const baseUrl = isSandbox 
      ? 'https://pix-h.api.efipay.com.br'
      : 'https://pix.api.efipay.com.br';

    console.log('🏗️ Usando ambiente:', isSandbox ? 'SANDBOX' : 'PRODUÇÃO');
    console.log('🌐 Base URL:', baseUrl);

    // Primeiro, obter token de acesso
    console.log('🔑 Obtendo token de acesso...');
    
    const authString = Buffer.from(`${efiClientId}:${efiClientSecret}`).toString('base64');
    
    const tokenResponse = await makeHttpsRequest(`${baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      }
    }, JSON.stringify({
      grant_type: 'client_credentials'
    }));

    if (!tokenResponse.ok) {
      console.error('❌ Erro ao obter token:', tokenResponse);
      return res.status(400).json({
        success: false,
        error: 'Erro ao obter token de acesso',
        details: tokenResponse.text,
        statusCode: tokenResponse.status
      });
    }

    const accessToken = tokenResponse.data.access_token;
    console.log('✅ Token obtido com sucesso');

    // Agora consultar o PIX usando o TXID
    console.log('📡 Consultando PIX diretamente na API...');
    console.log('🔍 URL da requisição:', `${baseUrl}/v2/pix/${txid}`);
    console.log('🔍 TXID sendo enviado:', txid);

    const pixResponse = await makeHttpsRequest(`${baseUrl}/v2/pix/${txid}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📋 Resposta da EFÍ:', pixResponse);

    if (pixResponse.ok) {
      return res.status(200).json({
        success: true,
        message: '✅ API direta com HTTPS nativo funcionou!',
        txid: txid,
        status: pixResponse.data.status,
        pixData: pixResponse.data,
        environment: isSandbox ? 'sandbox' : 'production'
      });

    } else {
      console.log('❌ Erro da API EFÍ:', pixResponse);

      return res.status(400).json({
        success: false,
        error: 'TXID rejeitado pela API direta da EFÍ',
        statusCode: pixResponse.status,
        errorData: pixResponse.data || pixResponse.text,
        txidTentado: txid,
        urlUsada: `${baseUrl}/v2/pix/${txid}`,
        environment: isSandbox ? 'sandbox' : 'production'
      });
    }

  } catch (error) {
    console.error('❌ Erro no teste direto:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Erro no teste da API direta',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
