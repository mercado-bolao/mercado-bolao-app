
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
    console.log('🔄 Teste: Regenerar token EFÍ e consultar PIX');
    console.log('🎯 TXID:', txid);

    const efiClientId = process.env.EFI_CLIENT_ID;
    const efiClientSecret = process.env.EFI_CLIENT_SECRET;

    if (!efiClientId || !efiClientSecret) {
      return res.status(400).json({
        success: false,
        error: 'Credenciais EFI não configuradas'
      });
    }

    // FORÇAR SANDBOX para evitar bloqueios do Replit
    const isSandbox = true;
    const baseUrl = 'https://pix-h.api.efipay.com.br';
    
    console.log('🏖️ USANDO SANDBOX obrigatoriamente (Replit bloqueia produção)');
    console.log('🌐 Base URL:', baseUrl);

    // PASSO 1: Gerar novo token de acesso
    console.log('🔑 PASSO 1: Gerando novo token de acesso...');
    
    const authString = Buffer.from(`${efiClientId}:${efiClientSecret}`).toString('base64');
    
    const tokenStartTime = Date.now();
    
    const tokenResponse = await fetch(`${baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`,
        'User-Agent': 'Replit-Token-Test/1.0',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'client_credentials'
      })
    });

    const tokenEndTime = Date.now();
    const tokenDuration = tokenEndTime - tokenStartTime;

    console.log(`⏱️ Tempo para obter token: ${tokenDuration}ms`);
    console.log(`📊 Status do token: ${tokenResponse.status}`);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Erro ao obter token:', errorText);
      
      return res.status(400).json({
        success: false,
        error: 'Erro ao obter novo token de acesso',
        details: errorText,
        statusCode: tokenResponse.status,
        tempoTentativa: `${tokenDuration}ms`
      });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in;
    
    console.log('✅ Novo token obtido com sucesso!');
    console.log(`🕐 Token válido por: ${expiresIn} segundos`);
    console.log(`🔑 Token (primeiros 20 chars): ${accessToken?.substring(0, 20)}...`);

    // PASSO 2: Testar token com consulta PIX
    console.log('🧪 PASSO 2: Testando token com consulta PIX...');
    
    const txidLimpo = txid.trim().replace(/[^a-zA-Z0-9]/g, '');
    console.log(`🔧 TXID limpo: ${txidLimpo} (${txidLimpo.length} chars)`);

    const pixStartTime = Date.now();
    
    const pixResponse = await fetch(`${baseUrl}/v2/pix/${txidLimpo}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Replit-Token-Test/1.0',
        'Accept': 'application/json'
      }
    });

    const pixEndTime = Date.now();
    const pixDuration = pixEndTime - pixStartTime;

    console.log(`⏱️ Tempo para consulta PIX: ${pixDuration}ms`);
    console.log(`📊 Status da consulta PIX: ${pixResponse.status}`);

    const pixResponseText = await pixResponse.text();
    console.log('📋 Resposta PIX (raw):', pixResponseText.substring(0, 500));

    if (pixResponse.ok) {
      const pixData = JSON.parse(pixResponseText);
      
      return res.status(200).json({
        success: true,
        message: '✅ Token regenerado e PIX consultado com sucesso!',
        tokenInfo: {
          geradoEm: new Date().toISOString(),
          validoPor: `${expiresIn} segundos`,
          tempoGeracao: `${tokenDuration}ms`,
          tokenPrefix: accessToken?.substring(0, 20) + '...'
        },
        pixInfo: {
          txid: txidLimpo,
          status: pixData.status || 'N/A',
          tempoConsulta: `${pixDuration}ms`,
          pixData: pixData
        },
        ambiente: 'SANDBOX',
        recomendacao: 'Token regenerado com sucesso! Use SANDBOX no Replit.'
      });

    } else {
      let errorData;
      try {
        errorData = JSON.parse(pixResponseText);
      } catch {
        errorData = { message: pixResponseText };
      }

      // Mesmo com erro PIX, o token foi gerado com sucesso
      return res.status(200).json({
        success: true,
        message: '✅ Token regenerado com sucesso, mas PIX não encontrado',
        tokenInfo: {
          geradoEm: new Date().toISOString(),
          validoPor: `${expiresIn} segundos`,
          tempoGeracao: `${tokenDuration}ms`,
          tokenPrefix: accessToken?.substring(0, 20) + '...',
          tokenValido: true
        },
        pixInfo: {
          txid: txidLimpo,
          erro: 'PIX não encontrado ou inválido',
          statusCode: pixResponse.status,
          tempoConsulta: `${pixDuration}ms`,
          errorData: errorData
        },
        ambiente: 'SANDBOX',
        conclusao: 'Token funcionou, mas este TXID não existe no sandbox'
      });
    }

  } catch (error) {
    console.error('❌ Erro no teste de token:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Erro no teste de regeneração de token',
      details: error instanceof Error ? error.message : String(error),
      tipo: error instanceof Error ? error.name : 'UnknownError'
    });
  }
}
