
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';

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
    console.log('🧪 Teste direto da API EFÍ (sem SDK):', txid);

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

    // Primeiro, obter token de acesso
    console.log('🔑 Obtendo token de acesso...');
    
    const authString = Buffer.from(`${efiClientId}:${efiClientSecret}`).toString('base64');
    
    const tokenResponse = await fetch(`${baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify({
        grant_type: 'client_credentials'
      })
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text();
      console.error('❌ Erro ao obter token:', tokenError);
      return res.status(400).json({
        success: false,
        error: 'Erro ao obter token de acesso',
        details: tokenError
      });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    console.log('✅ Token obtido com sucesso');

    // Agora consultar o PIX usando o TXID
    console.log('📡 Consultando PIX diretamente na API...');
    console.log('🔍 URL da requisição:', `${baseUrl}/v2/pix/${txid}`);
    console.log('🔍 TXID sendo enviado:', txid);

    const pixResponse = await fetch(`${baseUrl}/v2/pix/${txid}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const pixResponseText = await pixResponse.text();
    console.log('📋 Resposta da EFÍ (raw):', pixResponseText);

    if (pixResponse.ok) {
      const pixData = JSON.parse(pixResponseText);
      
      return res.status(200).json({
        success: true,
        message: '✅ API direta funcionou! O problema estava no SDK.',
        txid: txid,
        status: pixData.status,
        pixData: pixData
      });

    } else {
      let errorData;
      try {
        errorData = JSON.parse(pixResponseText);
      } catch {
        errorData = { message: pixResponseText };
      }

      console.log('❌ Erro da API EFÍ:', errorData);

      return res.status(400).json({
        success: false,
        error: 'TXID rejeitado pela API direta da EFÍ',
        statusCode: pixResponse.status,
        errorData: errorData,
        txidTentado: txid,
        urlUsada: `${baseUrl}/v2/pix/${txid}`
      });
    }

  } catch (error) {
    console.error('❌ Erro no teste direto:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Erro no teste da API direta',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
