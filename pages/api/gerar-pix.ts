import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔄 Handler iniciado - método:', req.method);
  console.log('📥 Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('📥 Request body:', JSON.stringify(req.body, null, 2));

  try {
    // Definir headers JSON primeiro
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
      console.log('❌ Método não permitido:', req.method);
      return res.status(405).json({ error: 'Método não permitido' });
    }

  const { whatsapp, valorTotal, totalBilhetes, bilheteId } = req.body;

  console.log('🔄 Iniciando geração de PIX...');
  console.log('📥 Dados recebidos:', { whatsapp, valorTotal, totalBilhetes, bilheteId });

  if (!whatsapp || !valorTotal || !totalBilhetes) {
    console.error('❌ Dados obrigatórios não fornecidos:', { whatsapp, valorTotal, totalBilhetes });
    return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' });
  }

  console.log('✅ Método POST confirmado');

    // Usar variáveis dos Secrets do Replit - PRODUÇÃO REAL
    const efiSandbox = process.env.EFI_SANDBOX || 'false'; // Produção real
    const efiClientId = process.env.EFI_CLIENT_ID;
    const efiClientSecret = process.env.EFI_CLIENT_SECRET;
    const efiPixKey = process.env.EFI_PIX_KEY;

  // Validar credenciais obrigatórias
  if (!efiClientId || !efiClientSecret || !efiPixKey) {
    console.error('❌ Credenciais EFI não configuradas:', {
      clientId: !!efiClientId,
      clientSecret: !!efiClientSecret,
      pixKey: !!efiPixKey
    });
    return res.status(400).json({
      error: 'Credenciais EFI Pay não configuradas',
      details: 'Configure EFI_CLIENT_ID, EFI_CLIENT_SECRET e EFI_PIX_KEY nos Secrets',
      missing: {
        EFI_CLIENT_ID: !efiClientId,
        EFI_CLIENT_SECRET: !efiClientSecret,
        EFI_PIX_KEY: !efiPixKey
      }
    });
  }

  const isSandbox = efiSandbox === 'true';
  const certificadoDisponivel = process.env.EFI_CERTIFICATE_PASSPHRASE && 
                                process.env.EFI_CERTIFICATE_PASSPHRASE.trim() !== '';
  const isProducao = efiSandbox === 'false' && certificadoDisponivel;

  console.log('🔄 Gerando PIX para:', { whatsapp, valorTotal, totalBilhetes });
  console.log('📋 Configurações:');
  console.log('- Ambiente:', isSandbox ? 'SANDBOX' : 'PRODUÇÃO');
  console.log('- EFI_CLIENT_ID:', efiClientId ? '✅' : '❌');
  console.log('- EFI_CLIENT_SECRET:', efiClientSecret ? '✅' : '❌');
  console.log('- EFI_PIX_KEY:', efiPixKey ? '✅' : '❌');
  console.log('- Certificado:', certificadoDisponivel ? '✅' : '❌');

  const EfiPay = require('sdk-node-apis-efi');

    // Configurar EFÍ baseado no ambiente
  let efiConfig: any = {
    sandbox: isSandbox,
    client_id: efiClientId,
    client_secret: efiClientSecret
  };

  // Configurar certificado para produção
  if (!isSandbox) {
    const certificatePath = path.resolve('./certs/certificado-efi.p12');

    console.log('🔍 Verificando certificado:');
    console.log('- Caminho:', certificatePath);
    console.log('- Existe:', fs.existsSync(certificatePath));
    console.log('- Passphrase configurada:', !!process.env.EFI_CERTIFICATE_PASSPHRASE);

    if (fs.existsSync(certificatePath) && process.env.EFI_CERTIFICATE_PASSPHRASE) {
      efiConfig.certificate = certificatePath;
      efiConfig.passphrase = process.env.EFI_CERTIFICATE_PASSPHRASE;
      console.log('✅ Certificado configurado para produção');
    } else {
      return res.status(400).json({
        error: 'Certificado não configurado para PRODUÇÃO',
        details: 'Para usar produção, o certificado deve estar na pasta certs/certificado-efi.p12 e a senha EFI_CERTIFICATE_PASSPHRASE nos Secrets',
        debug: {
          certificateExists: fs.existsSync(certificatePath),
          hasPassphrase: !!process.env.EFI_CERTIFICATE_PASSPHRASE,
          certificatePath: certificatePath
        }
      });
    }
  } else {
    // Para sandbox, não configurar certificado
    console.log('✅ Modo sandbox - sem certificado');
  }

  console.log('⚙️ Config EFI final:');
  console.log('- sandbox:', efiConfig.sandbox);
  console.log('- client_id:', efiConfig.client_id);
  console.log('- client_secret:', efiConfig.client_secret ? '✅' : '❌');
  console.log('- certificate:', efiConfig.certificate || 'Não configurado');
  console.log('- passphrase:', efiConfig.passphrase ? '✅' : 'Não configurado');

  console.log('🔧 Criando instância EFI Pay...');
  let efipay;
  try {
    efipay = new EfiPay(efiConfig);
    console.log('✅ Instância EFI criada com sucesso');
  } catch (instanceError) {
    console.error('❌ Erro ao criar instância EFI:', instanceError);
    return res.status(500).json({
      error: 'Erro ao criar instância EFI Pay',
      details: instanceError instanceof Error ? instanceError.message : 'Erro desconhecido',
      debug: { config: efiConfig }
    });
  }

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
    console.log('📤 Body da requisição:', JSON.stringify(body, null, 2));

    let pixResponse;
    try {
      pixResponse = await efipay.pixCreateImmediateCharge([], body);
      console.log('✅ Cobrança PIX criada com sucesso!');
      console.log('📋 Resposta COMPLETA da cobrança PIX:', JSON.stringify(pixResponse, null, 2));
    } catch (cobrancaError) {
      console.error('❌ ERRO AO CRIAR COBRANÇA PIX:');
      console.error('📝 Erro completo:', JSON.stringify(cobrancaError, null, 2));
      console.error('📝 Response data:', JSON.stringify(cobrancaError?.response?.data, null, 2));
      console.error('📝 Status:', cobrancaError?.response?.status);
      console.error('📝 Message:', cobrancaError?.message);
      throw cobrancaError;
    }

    if (!pixResponse || !pixResponse.txid) {
      console.error('❌ Resposta da cobrança inválida:', pixResponse);
      throw new Error('Erro ao gerar cobrança PIX - resposta inválida');
    }

    console.log('🆔 TXID da cobrança:', pixResponse.txid);

    // Verificar se loc.id está presente
    const locationId = pixResponse.loc?.id;
    console.log('📍 Verificando locationId:');
    console.log('- locationId extraído:', locationId);
    console.log('- Tipo do locationId:', typeof locationId);
    console.log('- loc completo:', JSON.stringify(pixResponse.loc, null, 2));

    if (!locationId) {
      console.error('❌ CRÍTICO: loc.id não foi retornado na resposta da cobrança');
      console.error('🔍 Análise da resposta:');
      console.error('- pixResponse existe:', !!pixResponse);
      console.error('- pixResponse.loc existe:', !!pixResponse.loc);
      console.error('- Chaves em pixResponse:', Object.keys(pixResponse));
      console.error('- Chaves em pixResponse.loc:', pixResponse.loc ? Object.keys(pixResponse.loc) : 'N/A');
      console.error('📋 Resposta COMPLETA:', JSON.stringify(pixResponse, null, 2));

      return res.status(500).json({
        error: 'Cobrança PIX criada, mas loc.id não foi retornado',
        details: 'A EFÍ Pay criou a cobrança mas não retornou o campo loc.id necessário para gerar o QR Code',
        debug: {
          hasPixResponse: !!pixResponse,
          hasLoc: !!pixResponse?.loc,
          txid: pixResponse?.txid,
          locKeys: pixResponse?.loc ? Object.keys(pixResponse.loc) : null,
          responseKeys: pixResponse ? Object.keys(pixResponse) : null
        }
      });
    }

    // Usar PIX Copia e Cola da própria cobrança (disponível no retorno)
    console.log('🔄 Usando PIX Copia e Cola da cobrança...');
    const pixCopiaCola = pixResponse.pixCopiaECola;

    if (!pixCopiaCola) {
      console.error('❌ PIX Copia e Cola não disponível na resposta');
      return res.status(500).json({
        error: 'PIX Copia e Cola não disponível',
        details: 'A EFÍ Pay não retornou o código PIX Copia e Cola'
      });
    }

    console.log('✅ PIX Copia e Cola obtido com sucesso!');
    console.log('📋 PIX Copia e Cola:', pixCopiaCola);

    // Criar resposta simulando QR Code para manter compatibilidade
    const qrCodeResponse = {
      qrcode: pixCopiaCola,
      imagemQrcode: null // Será null até conseguir gerar QR Code
    };

    // Salvar dados do PIX no banco de dados
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // Verificar se o Prisma foi carregado corretamente
    if (!prisma || !prisma.pixPagamento) {
      console.error('❌ Prisma não carregado corretamente');
      console.log('✅ PIX gerado com sucesso, mas não foi salvo no banco');

      return res.status(200).json({
        success: true,
        pix: {
          txid: pixResponse.txid,
          locationId: locationId,
          qrcode: qrCodeResponse.qrcode,
          imagemQrcode: qrCodeResponse.imagemQrcode,
          valor: valorTotal,
          expiracao: new Date(Date.now() + 300000).toISOString(),
          ambiente: isSandbox ? 'sandbox' : 'produção',
          aviso: qrCodeResponse.imagemQrcode ? null : 'Imagem QR Code não disponível - use o código PIX',
          dbWarning: 'PIX não foi salvo no banco de dados'
        },
      });
    }

    try {
      console.log('💾 Salvando dados do PIX no banco...');

      const pixSalvo = await prisma.pixPagamento.create({
        data: {
          txid: pixResponse.txid,
          whatsapp: whatsapp,
          valor: valorTotal,
          status: 'ATIVA',
          pixCopiaECola: qrCodeResponse.qrcode,
          pixLocationUrl: pixResponse.loc?.location,
          imagemQrcode: qrCodeResponse.imagemQrcode,
          locationId: locationId.toString(),
          ambiente: isSandbox ? 'sandbox' : 'producao',
          expiracao: new Date(Date.now() + 3600000), // 1 hora
        }
      });

      console.log('✅ PIX salvo no banco com ID:', pixSalvo.id);

      // Se foi fornecido bilheteId, associar o PIX ao bilhete
      if (bilheteId) {
        await prisma.bilhete.update({
          where: { id: bilheteId },
          data: { pixId: pixSalvo.id }
        });
        console.log('✅ PIX associado ao bilhete:', bilheteId);
      }

      // Associar palpites pendentes a este PIX
      const palpitesAtualizados = await prisma.palpite.updateMany({
        where: {
          whatsapp: whatsapp,
          status: 'pendente'
        },
        data: {
          pixId: pixSalvo.id
        }
      });

      console.log('✅ Palpites associados ao PIX:', palpitesAtualizados.count);

    } catch (dbError) {
      console.error('❌ Erro ao salvar PIX no banco:', dbError);
      // Continuar mesmo com erro no banco, pois o PIX foi gerado
    } finally {
      await prisma.$disconnect();
    }

    return res.status(200).json({
      success: true,
      pixId: pixSalvo ? pixSalvo.id : null,
      pix: {
        txid: pixResponse.txid,
        locationId: locationId,
        qrcode: qrCodeResponse.qrcode,
        imagemQrcode: qrCodeResponse.imagemQrcode,
        valor: valorTotal,
        expiracao: new Date(Date.now() + 300000).toISOString(),
        ambiente: isSandbox ? 'sandbox' : 'produção',
        aviso: qrCodeResponse.imagemQrcode ? null : 'Imagem QR Code não disponível - use o código PIX'
      },
    });

  } catch (error: any) {
    console.error('❌ ERRO DETALHADO AO GERAR PIX:');
    console.error('📄 Tipo do erro:', typeof error);
    console.error('📝 Erro completo:', JSON.stringify(error, null, 2));
    console.error('📝 Response data completa:', JSON.stringify(error?.response?.data, null, 2));
    console.error('📝 Response status:', error?.response?.status);
    console.error('📝 Response headers:', JSON.stringify(error?.response?.headers, null, 2));
    console.error('📝 Request config:', JSON.stringify(error?.config, null, 2));
    console.error('📝 Error message:', error?.message);
    console.error('📝 Error stack:', error?.stack);

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
      } else if (error.error_description.includes('insufficient scope')) {
        statusCode = 403;
        mensagemErro = `🔒 PERMISSÕES INSUFICIENTES

Sua conta EFI Pay não tem as permissões de PIX habilitadas para PRODUÇÃO.

📞 AÇÕES NECESSÁRIAS:
1. Entre em contato com a EFI Pay: 0800 775 0040
2. Solicite habilitação das APIs de PIX para PRODUÇÃO
3. Informe que você tem certificado digital válido

💡 TEMPORÁRIO: Volte para SANDBOX configurando EFI_SANDBOX=true nos Secrets`;
      }
    } else if (error?.message) {
      mensagemErro = error.message;

      // Tratamento específico para erros de loc.id
      if (error.message.includes('loc.id não foi retornado')) {
        statusCode = 502;
        mensagemErro = '🔗 Erro na API EFÍ Pay: A cobrança foi criada mas o campo loc.id não foi retornado. Isso pode indicar um problema na API da EFÍ ou na configuração da conta.';
      } else if (error.message.includes('QR Code não foi gerado')) {
        statusCode = 502;
        mensagemErro = '📱 Erro ao gerar QR Code: A cobrança foi criada mas o QR Code não pôde ser gerado. Verifique se o locationId está correto.';
      }
    }

    // Garantir que sempre retornamos JSON válido
    try {
      const errorResponse = {
        success: false,
        error: 'Erro ao gerar PIX',
        details: mensagemErro,
        suggestion: statusCode === 400 ? 'Configure o certificado EFI nas variáveis de ambiente' : 'Verifique os logs do servidor para mais detalhes',
        debug: {
          tipo: typeof error,
          timestamp: new Date().toISOString(),
          statusCode: statusCode,
          hasResponseData: !!(error?.response?.data),
          errorKeys: error && typeof error === 'object' ? Object.keys(error) : []
        }
      };

      console.log('📤 Enviando resposta de erro:', JSON.stringify(errorResponse, null, 2));
      return res.status(statusCode).json(errorResponse);
    } catch (jsonError) {
      console.error('❌ Erro ao enviar resposta JSON:', jsonError);
      res.status(500).json({ error: 'Erro crítico no servidor', details: 'Falha ao processar resposta' });
    }
  }
}