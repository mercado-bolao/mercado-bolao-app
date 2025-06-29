import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔄 Handler iniciado - método:', req.method);

  const prisma = new PrismaClient();

  try {
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
      console.log('❌ Método não permitido:', req.method);
      return res.status(405).json({ error: 'Método não permitido' });
    }

    const { whatsapp, valorTotal, totalBilhetes, palpites, nome } = req.body;

    console.log('🔄 Iniciando geração de PIX...');
    console.log('📥 Dados recebidos:', { whatsapp, nome, valorTotal, totalBilhetes, palpites: palpites?.length });

    if (!whatsapp || !valorTotal || !totalBilhetes || !palpites || palpites.length === 0) {
      console.error('❌ Dados obrigatórios não fornecidos');
      return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' });
    }

    // Se nome não foi fornecido, usar um padrão
    const nomeUsuario = nome || `Cliente ${whatsapp}`;

    // Usar variáveis dos Secrets do Replit
    const efiSandbox = process.env.EFI_SANDBOX || 'false';
    const efiClientId = process.env.EFI_CLIENT_ID;
    const efiClientSecret = process.env.EFI_CLIENT_SECRET;
    const efiPixKey = process.env.EFI_PIX_KEY;

    // Validar credenciais obrigatórias
    if (!efiClientId || !efiClientSecret || !efiPixKey) {
      console.error('❌ Credenciais EFI não configuradas');
      return res.status(400).json({
        error: 'Credenciais EFI Pay não configuradas',
        details: 'Configure EFI_CLIENT_ID, EFI_CLIENT_SECRET e EFI_PIX_KEY nos Secrets'
      });
    }

    const isSandbox = efiSandbox === 'true';
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

      if (fs.existsSync(certificatePath) && process.env.EFI_CERTIFICATE_PASSPHRASE) {
        efiConfig.certificate = certificatePath;
        efiConfig.passphrase = process.env.EFI_CERTIFICATE_PASSPHRASE;
        console.log('✅ Certificado configurado para produção');
      } else {
        return res.status(400).json({
          error: 'Certificado não configurado para PRODUÇÃO'
        });
      }
    }

    console.log('🔧 Criando instância EFI Pay...');
    let efipay;
    try {
      efipay = new EfiPay(efiConfig);
      console.log('✅ Instância EFI criada com sucesso');
    } catch (instanceError) {
      console.error('❌ Erro ao criar instância EFI:', instanceError);
      return res.status(500).json({
        error: 'Erro ao criar instância EFI Pay',
        details: instanceError instanceof Error ? instanceError.message : 'Erro desconhecido'
      });
    }

    // Gerar identificadores únicos
    const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Gerar TXID válido conforme padrão EFÍ (26-35 caracteres alfanuméricos)
    const generateValidTxid = (): string => {
      const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let txid = '';
      
      // Gerar exatamente 32 caracteres (meio do range 26-35)
      for (let i = 0; i < 32; i++) {
        txid += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
      }
      
      // Sanitizar para garantir que não há caracteres inválidos
      txid = txid.replace(/[^a-zA-Z0-9]/g, '');
      
      // Se por algum motivo ficou menor que 32, completar
      while (txid.length < 32) {
        txid += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
      }
      
      // Garantir exatamente 32 caracteres
      if (txid.length > 32) {
        txid = txid.substring(0, 32);
      }
      
      console.log('🔧 TXID gerado limpo:', {
        txid: txid,
        comprimento: txid.length,
        somenteAlfanumerico: /^[a-zA-Z0-9]+$/.test(txid),
        dentroDoRange: txid.length >= 26 && txid.length <= 35
      });
      
      return txid;
    };

    const txid = generateValidTxid();

    // 🔒 VALIDAÇÃO: Verificar se TXID está no formato correto
    const txidPattern = /^[a-zA-Z0-9]{26,35}$/;
    if (!txidPattern.test(txid)) {
      console.error('❌ TXID gerado está inválido:', {
        txid: txid,
        comprimento: txid.length,
        caracteresInvalidos: txid.match(/[^a-zA-Z0-9]/g) || 'nenhum',
        hexDump: Buffer.from(txid).toString('hex')
      });
      throw new Error(`TXID inválido gerado: ${txid} (${txid.length} chars)`);
    }

    console.log('🔑 IDs gerados:', { orderId, txid, txidLength: txid.length });
    console.log('✅ TXID validado com sucesso:', {
      txid: txid,
      comprimento: txid.length,
      formato: 'alfanumérico mixed case 32 chars',
      valido: txidPattern.test(txid),
      regexMatch: txid.match(/^[a-zA-Z0-9]{26,35}$/) !== null
    });

    // 1. CRIAR BILHETE PRIMEIRO (antes do PIX)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

    // Buscar o concurso ativo para associar ao bilhete
    const concursoAtivo = await prisma.concurso.findFirst({
      where: { status: 'ativo' },
      orderBy: { dataInicio: 'desc' }
    });

    if (!concursoAtivo) {
      console.error('❌ Nenhum concurso ativo encontrado');
      return res.status(400).json({ error: 'Nenhum concurso ativo encontrado' });
    }

    console.log('💾 Criando bilhete...');
    const bilhete = await prisma.bilhete.create({
      data: {
        whatsapp: whatsapp,
        nome: nomeUsuario,
        valorTotal: valorTotal,
        status: 'PENDENTE',
        orderId: orderId,
        expiresAt: expiresAt,
        quantidadePalpites: palpites.length,
        concursoId: concursoAtivo.id
      }
    });

    console.log('✅ Bilhete criado com ID:', bilhete.id);

    // 2. ASSOCIAR PALPITES AO BILHETE
    const palpitesIds = palpites.map((p: any) => p.id);
    const palpitesAtualizados = await prisma.palpite.updateMany({
      where: {
        id: { in: palpitesIds },
        whatsapp: whatsapp,
        status: 'pendente'
      },
      data: {
        status: 'pendente_pagamento'
      }
    });

    console.log('✅ Palpites associados:', palpitesAtualizados.count);

    // 3. PROGRAMAR CANCELAMENTO AUTOMÁTICO EM 5 MINUTOS
    setTimeout(async () => {
      try {
        const prismaTimeout = new PrismaClient();

        // Verificar se ainda está pendente
        const bilheteAtual = await prismaTimeout.bilhete.findUnique({
          where: { id: bilhete.id }
        });

        if (bilheteAtual?.status === 'PENDENTE') {
          console.log('⏰ Cancelando bilhete expirado:', bilhete.id);

          await prismaTimeout.bilhete.update({
            where: { id: bilhete.id },
            data: { status: 'CANCELADO' }
          });

          // Reverter palpites para pendente
          await prismaTimeout.palpite.updateMany({
            where: {
              id: { in: palpitesIds }
            },
            data: {
              status: 'pendente'
            }
          });

          console.log('✅ Bilhete cancelado automaticamente');
        }

        await prismaTimeout.$disconnect();
      } catch (error) {
        console.error('❌ Erro no cancelamento automático:', error);
      }
    }, 5 * 60 * 1000); // 5 minutos

    // 4. GERAR PIX NA EFÍ
    const body = {
      calendario: {
        expiracao: 300, // 5 minutos
      },
      devedor: {
        nome: `Cliente WhatsApp ${whatsapp}`,
        cpf: '12345678909',
      },
      valor: {
        original: valorTotal.toFixed(2),
      },
      chave: efiPixKey,
      solicitacaoPagador: `Bolão TVLoteca - ${totalBilhetes} bilhete(s) - Order: ${orderId}`,
      infoAdicionais: [
        {
          nome: 'WhatsApp',
          valor: whatsapp,
        },
        {
          nome: 'OrderID',
          valor: orderId,
        },
        {
          nome: 'Bilhetes',
          valor: totalBilhetes.toString(),
        },
        {
          nome: 'TXID',
          valor: txid,
        }
      ],
    };

    console.log('🔄 Criando cobrança PIX na EFÍ...');

    let pixResponse;
    try {
      pixResponse = await efipay.pixCreateImmediateCharge([{ txid }], body);
      console.log('✅ Cobrança PIX criada com sucesso!');
      console.log('📋 TXID usado:', txid);
      console.log('📋 TXID retornado pela EFÍ:', pixResponse.txid);
    } catch (cobrancaError) {
      console.error('❌ ERRO AO CRIAR COBRANÇA PIX:', cobrancaError);

      // Se falhar, cancelar bilhete
      await prisma.bilhete.update({
        where: { id: bilhete.id },
        data: { status: 'CANCELADO' }
      });

      throw cobrancaError;
    }

    if (!pixResponse || !pixResponse.pixCopiaECola) {
      console.error('❌ Resposta da cobrança inválida');
      await prisma.bilhete.update({
        where: { id: bilhete.id },
        data: { status: 'CANCELADO' }
      });
      throw new Error('Erro ao gerar cobrança PIX - resposta inválida');
    }

    // 5. SALVAR PIX NO BANCO
    try {
      // 📋 Salvar resposta completa da EFÍ para logs
      const efiResponseLog = {
        txid_enviado: txid,
        txid_retornado: pixResponse.txid,
        location_id: pixResponse.loc?.id,
        ambiente: isSandbox ? 'sandbox' : 'producao',
        timestamp: new Date().toISOString()
      };

      const pixSalvo = await prisma.pixPagamento.create({
        data: {
          txid: txid, // Usar o TXID gerado localmente
          whatsapp: whatsapp,
          valor: valorTotal,
          status: 'ATIVA',
          pixCopiaECola: pixResponse.pixCopiaECola,
          pixLocationUrl: pixResponse.loc?.location,
          locationId: pixResponse.loc?.id?.toString(),
          ambiente: isSandbox ? 'sandbox' : 'producao',
          expiracao: expiresAt,
        }
      });

      console.log('✅ PIX salvo no banco com ID:', pixSalvo.id);
      console.log('✅ TXID salvo:', txid);
      console.log('📋 Log da resposta EFÍ:', efiResponseLog);
    } catch (dbError) {
      console.error('❌ Erro ao salvar PIX no banco:', dbError);
    }

    // Update bilhete with txid
    await prisma.bilhete.update({
        where: { id: bilhete.id },
        data: { txid: txid } // Usar o TXID gerado localmente
    });

    return res.status(200).json({
      success: true,
      bilhete: {
        id: bilhete.id,
        txid: txid, // Usar o TXID gerado localmente
        orderId: orderId,
        expiresAt: expiresAt.toISOString(),
        status: 'PENDENTE'
      },
      pix: {
        txid: txid, // Usar o TXID gerado localmente
        qrcode: pixResponse.pixCopiaECola,
        valor: valorTotal,
        expiracao: expiresAt.toISOString(),
        ambiente: isSandbox ? 'sandbox' : 'produção'
      },
    });

  } catch (error: any) {
    console.error('❌ ERRO DETALHADO AO GERAR PIX:', error);

    let mensagemErro = 'Erro desconhecido ao gerar PIX';
    let statusCode = 500;

    if (error?.error_description) {
      mensagemErro = error.error_description;
    } else if (error?.message) {
      mensagemErro = error.message;
    }

    return res.status(statusCode).json({
      success: false,
      error: 'Erro ao gerar PIX',
      details: mensagemErro
    });
  } finally {
    await prisma.$disconnect();
  }
}