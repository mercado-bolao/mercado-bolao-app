
import { NextApiRequest, NextApiResponse } from 'next';
import https from 'https';
import { URL } from 'url';

function makeHttpsRequestWithRetry(url: string, options: any, postData?: string, retries = 3): Promise<any> {
  return new Promise((resolve, reject) => {
    const attemptRequest = (attempt: number) => {
      const parsedUrl = new URL(url);
      
      const requestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || 'GET',
        headers: {
          ...options.headers,
          'Connection': 'close', // Força fechar conexão após uso
          'User-Agent': 'Replit-API-Test/1.0'
        },
        timeout: 15000, // Timeout menor
        // Configurações SSL mais permissivas
        rejectUnauthorized: false,
        secureProtocol: 'TLSv1_2_method'
      };

      console.log(`🌐 Tentativa ${attempt}/${retries} para: ${url}`);

      const req = https.request(requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          console.log(`✅ Tentativa ${attempt} - Status: ${res.statusCode}`);
          
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
        console.error(`❌ Tentativa ${attempt} falhou:`, err.message);
        
        if (attempt < retries) {
          console.log(`🔄 Tentando novamente em 2 segundos...`);
          setTimeout(() => attemptRequest(attempt + 1), 2000);
        } else {
          reject(new Error(`Falha após ${retries} tentativas: ${err.message}`));
        }
      });

      req.on('timeout', () => {
        console.error(`⏰ Timeout na tentativa ${attempt}`);
        req.destroy();
        
        if (attempt < retries) {
          console.log(`🔄 Tentando novamente após timeout...`);
          setTimeout(() => attemptRequest(attempt + 1), 2000);
        } else {
          reject(new Error(`Timeout após ${retries} tentativas`));
        }
      });

      if (postData) {
        req.write(postData);
      }
      
      req.end();
    };

    attemptRequest(1);
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
    console.log('🧪 Teste ROBUSTO da API EFÍ com retry:', txid);

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
    console.log('🌐 Base URL:', baseUrl);

    // Testar conectividade primeiro
    console.log('🔌 Testando conectividade...');
    
    try {
      // Primeiro, obter token de acesso com retry
      console.log('🔑 Obtendo token de acesso com retry...');
      
      const authString = Buffer.from(`${efiClientId}:${efiClientSecret}`).toString('base64');
      
      const tokenResponse = await makeHttpsRequestWithRetry(`${baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authString}`
        }
      }, JSON.stringify({
        grant_type: 'client_credentials'
      }), 2); // 2 tentativas para o token

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

      // Consultar o PIX usando o TXID com retry
      console.log('📡 Consultando PIX com retry...');
      
      const pixResponse = await makeHttpsRequestWithRetry(`${baseUrl}/v2/pix/${txid}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }, undefined, 3); // 3 tentativas para a consulta PIX

      if (pixResponse.ok) {
        return res.status(200).json({
          success: true,
          message: '✅ API com retry funcionou!',
          txid: txid,
          status: pixResponse.data.status,
          pixData: pixResponse.data,
          environment: isSandbox ? 'sandbox' : 'production'
        });

      } else {
        return res.status(400).json({
          success: false,
          error: 'TXID rejeitado pela API EFÍ (com retry)',
          statusCode: pixResponse.status,
          errorData: pixResponse.data || pixResponse.text,
          txidTentado: txid,
          environment: isSandbox ? 'sandbox' : 'production'
        });
      }

    } catch (connectivityError) {
      console.error('❌ Erro de conectividade:', connectivityError);
      
      return res.status(503).json({
        success: false,
        error: 'Problema de conectividade com a API EFÍ',
        details: connectivityError instanceof Error ? connectivityError.message : String(connectivityError),
        possibleCauses: [
          'Firewall do Replit bloqueando conexões HTTPS',
          'DNS não resolvendo efipay.com.br',
          'Timeout de rede',
          'Instabilidade temporária da API EFÍ'
        ],
        nextSteps: [
          'Tente novamente em alguns minutos',
          'Verifique se as credenciais estão corretas',
          'Considere usar ambiente SANDBOX se estiver em produção'
        ]
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Erro no teste da API',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
