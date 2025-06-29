import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔄 Handler iniciado - método:', req.method);
  
  try {
    // Definir headers JSON primeiro
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method !== 'POST') {
      console.log('❌ Método não permitido:', req.method);
      return res.status(405).json({ error: 'Método não permitido' });
    }

  const { whatsapp, valorTotal, totalBilhetes } = req.body;

  console.log('🔄 Iniciando geração de PIX...');
  console.log('📥 Dados recebidos:', { whatsapp, valorTotal, totalBilhetes });

  if (!whatsapp || !valorTotal || !totalBilhetes) {
    console.error('❌ Dados obrigatórios não fornecidos:', { whatsapp, valorTotal, totalBilhetes });
    return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' });
  }

  console.log('✅ Método POST confirmado');

    // Usar variáveis dos Secrets do Replit
    const efiSandbox = process.env.EFI_SANDBOX || 'false';
    const efiClientId = process.env.EFI_CLIENT_ID || 'Client_Id_904f9fe2a9c9d5dc7f50cf9a56cb0effb9b20140';
    const efiClientSecret = process.env.EFI_CLIENT_SECRET || 'Client_Secret_6e2c43d197c350a3d88df81530bcd27eb0818719';
    const efiPixKey = process.env.EFI_PIX_KEY || '1fe7c162-b80d-464a-b57e-26c7da638223';

    const isSandbox = efiSandbox === 'true';

    console.log(`🔄 Gerando PIX ${isSandbox ? 'SANDBOX' : 'PRODUÇÃO'} para:`, { whatsapp, valorTotal, totalBilhetes });
    console.log('📋 Configurações atuais:');
    console.log('- EFI_SANDBOX:', efiSandbox, '(from env:', process.env.EFI_SANDBOX, ')');
    console.log('- EFI_CLIENT_ID:', efiClientId);
    console.log('- EFI_CLIENT_SECRET:', efiClientSecret ? '✅ Definido' : '❌ Não definido');
    console.log('- EFI_PIX_KEY:', efiPixKey);
    console.log('🔍 Debug completo das variáveis:');
    console.log('- process.env.EFI_SANDBOX:', process.env.EFI_SANDBOX);
    console.log('- process.env.EFI_CLIENT_ID:', process.env.EFI_CLIENT_ID);
    console.log('- process.env.EFI_CLIENT_SECRET:', process.env.EFI_CLIENT_SECRET ? 'Existe' : 'Undefined');
    console.log('- process.env.EFI_PIX_KEY:', process.env.EFI_PIX_KEY);
    console.log('- process.env.EFI_CERTIFICATE_PATH:', process.env.EFI_CERTIFICATE_PATH);
    console.log('- process.env.EFI_CERTIFICATE_PASSPHRASE:', process.env.EFI_CERTIFICATE_PASSPHRASE ? 'Existe' : 'Undefined');

    const EfiPay = require('sdk-node-apis-efi');

    // Verificar se certificado está disponível
  const certificadoDisponivel = process.env.EFI_CERTIFICATE_PASSPHRASE && 
                                 process.env.EFI_CERTIFICATE_PASSPHRASE.trim() !== '';

  // TEMPORÁRIO: Forçar sandbox para testar credenciais
  const isProducao = false; // certificadoDisponivel;

  console.log('🔄 Gerando PIX para:', { whatsapp, valorTotal, totalBilhetes });
  console.log('🔐 Certificado disponível:', certificadoDisponivel ? '✅' : '❌');
  console.log('🏷️ Modo:', isProducao ? 'PRODUÇÃO' : 'SANDBOX');

  // Configurações baseadas na disponibilidade do certificado
  const configuracoes = {
    EFI_SANDBOX: !isProducao,
    EFI_CLIENT_ID: process.env.EFI_CLIENT_ID,
    EFI_CLIENT_SECRET: process.env.EFI_CLIENT_SECRET,
    EFI_PIX_KEY: process.env.EFI_PIX_KEY,
    EFI_CERTIFICATE_PATH: process.env.EFI_CERTIFICATE_PATH || './certs/certificado-efi.p12',
    EFI_CERTIFICATE_PASSPHRASE: process.env.EFI_CERTIFICATE_PASSPHRASE
  };

  console.log('📋 Configurações:');
  console.log('- EFI_SANDBOX:', configuracoes.EFI_SANDBOX);
  console.log('- EFI_CLIENT_ID:', configuracoes.EFI_CLIENT_ID);
  console.log('- EFI_CLIENT_SECRET:', configuracoes.EFI_CLIENT_SECRET ? '✅ Definido' : '❌ Vazio');
  console.log('- EFI_PIX_KEY:', configuracoes.EFI_PIX_KEY);

    // Configuração para sandbox ou produção
    let efiConfig: any = {
      client_id: efiClientId,
      client_secret: efiClientSecret,
      sandbox: isSandbox,
    };

    // Configurar EFÍ baseado no ambiente
  let efiConfig2: any = {
    sandbox: !isProducao,
    client_id: configuracoes.EFI_CLIENT_ID,
    client_secret: configuracoes.EFI_CLIENT_SECRET
  };

  // Só adicionar certificado se estiver em PRODUÇÃO
  if (isProducao) {
    console.log('🔐 Configurando certificado para PRODUÇÃO...');

    if (fs.existsSync(configuracoes.EFI_CERTIFICATE_PATH) && configuracoes.EFI_CERTIFICATE_PASSPHRASE) {
      efiConfig2.certificate = configuracoes.EFI_CERTIFICATE_PATH;
      efiConfig2.passphrase = configuracoes.EFI_CERTIFICATE_PASSPHRASE;
      console.log('✅ Certificado configurado para produção');
    } else {
      console.log('❌ Certificado não disponível, não é possível usar PRODUÇÃO');
      return res.status(400).json({
        error: 'Certificado não configurado',
        details: 'Para usar produção, configure o certificado e senha nos Secrets',
        suggestion: 'Configure EFI_CERTIFICATE_PASSPHRASE nos Secrets'
      });
    }
  } else {
    console.log('🧪 Modo SANDBOX - certificado não necessário');
  }

  console.log('⚙️ Config EFI final:');
  console.log('- sandbox:', efiConfig2.sandbox);
  console.log('- client_id:', efiConfig2.client_id);
  console.log('- client_secret:', efiConfig2.client_secret ? '✅' : '❌');
  console.log('- certificate:', efiConfig2.certificate ? '✅' : '❌');
    const efipay = new EfiPay(efiConfig2);

    // Gerar TXID único
    const txid = `PIX${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    console.log('🆔 TXID gerado:', txid);

    const body = {
      calendario: {
        expiracao: 3600, // 1 hora
      },
      devedor: {
        nome: `Cliente WhatsApp ${whatsapp}`,
        cpf: '12345678909', // Em produção, você pode pedir o CPF real
      },
      valor: {
        original: valorTotal.toFixed(2),
      },
      chave: efiPixKey,
      solicitacaoPagador: `Pagamento de ${totalBilhetes} bilhete(s) - Bolão TVLoteca`,
      infoAdicionais: [
        {
          nome: 'WhatsApp',
          valor: whatsapp,
        },
        {
          nome: 'Bilhetes',
          valor: totalBilhetes.toString(),
        },
        {
          nome: 'Ambiente',
          valor: isSandbox ? 'Sandbox' : 'Produção',
        },
      ],
    };

    console.log('🔄 Criando cobrança PIX na EFÍ...');
    const pixResponse = await efipay.pixCreateImmediateCharge([], body);

    if (!pixResponse || !pixResponse.txid) {
      throw new Error('Erro ao gerar cobrança PIX');
    }

    console.log('✅ Cobrança PIX criada:', pixResponse.txid);
    console.log('🔄 Gerando QR Code...');

    const qrCodeResponse = await efipay.pixGenerateQRCode({
      id: pixResponse.loc.id,
    });

    console.log('✅ QR Code gerado com sucesso!');

    return res.status(200).json({
      success: true,
      pix: {
        txid: pixResponse.txid,
        qrcode: qrCodeResponse.qrcode,
        imagemQrcode: qrCodeResponse.imagemQrcode,
        valor: valorTotal,
        expiracao: new Date(Date.now() + 3600000).toISOString(),
        ambiente: isSandbox ? 'sandbox' : 'produção',
      },
    });

  } catch (error: any) {
    console.error('❌ ERRO DETALHADO AO GERAR PIX:');
    console.error('📄 Tipo do erro:', typeof error);
    console.error('📝 Erro completo:', error);

    // Tratamento mais específico do erro
    let mensagemErro = 'Erro desconhecido ao gerar PIX';
    let statusCode = 500;

    if (typeof error === 'string') {
      mensagemErro = error;
      // Se for erro de certificado, forçar sandbox
      if (error.includes('certificate') || error.includes('sandbox')) {
        statusCode = 400;
        mensagemErro = 'Certificado não configurado. Operação em modo sandbox desabilitada.';
      }
    } else if (error?.error === 'invalid_client') {
      // Erro específico de credenciais inválidas
      statusCode = 401;
      mensagemErro = 'Credenciais EFI Pay inválidas ou inativas. Verifique CLIENT_ID e CLIENT_SECRET nos Secrets.';
    } else if (error?.error_description) {
      mensagemErro = error.error_description;
      // Determinar status code baseado no tipo de erro
      if (error.error_description.includes('Invalid or inactive credentials')) {
        statusCode = 401;
        mensagemErro = 'Credenciais EFI Pay inválidas ou inativas. Verifique CLIENT_ID e CLIENT_SECRET nos Secrets.';
      } else if (error.error_description.includes('certificate')) {
        statusCode = 400;
        mensagemErro = 'Erro de certificado EFI Pay. Verifique o certificado e senha nos Secrets.';
      }
    } else if (error?.message) {
      mensagemErro = error.message;
    }

    // Garantir que sempre retornamos JSON válido
    try {
      return res.status(statusCode).json({
        error: 'Erro ao gerar PIX',
        details: mensagemErro,
        suggestion: statusCode === 400 ? 'Configure o certificado EFI nas variáveis de ambiente' : 'Verifique os logs do servidor para mais detalhes',
        tipo: typeof error,
        timestamp: new Date().toISOString()
      });
    } catch (jsonError) {
      console.error('❌ Erro ao enviar resposta JSON:', jsonError);
      res.status(500).send('Erro interno do servidor');
    }
  }
}