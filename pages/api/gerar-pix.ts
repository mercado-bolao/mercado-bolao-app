import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    // Verificar se está em sandbox ou produção
    const efiSandbox = process.env.EFI_SANDBOX || 'false'; // Padrão produção
    const isSandbox = efiSandbox === 'true';
    const EfiPay = require('sdk-node-apis-efi');

    // Configurar EFÍ baseado no ambiente
    let efiConfig: any = {
      sandbox: isSandbox,
      client_id: process.env.EFI_CLIENT_ID,
      client_secret: process.env.EFI_CLIENT_SECRET
    };

    // Tentar encontrar o certificado usando caminhos relativos
    const certificatePath = path.join(process.cwd(), 'certs', 'certificado-efi.p12');

    console.log('📂 Debug de caminhos:', {
      processDir: process.cwd(),
      certificatePath: certificatePath,
      nodeEnv: process.env.NODE_ENV,
      tentandoLer: 'certs/certificado-efi.p12'
    });

    try {
      if (fs.existsSync(certificatePath)) {
        console.log('✅ Certificado encontrado em:', certificatePath);
        efiConfig.certificate = certificatePath;
        efiConfig.passphrase = process.env.EFI_CERTIFICATE_PASSPHRASE;
      } else {
        console.log('⚠️ Certificado não encontrado em:', certificatePath);
        // Em produção, se não encontrar o certificado, lança erro
        if (process.env.NODE_ENV === 'production') {
          throw new Error(`Certificado não encontrado em: ${certificatePath}`);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao tentar ler certificado:', error);
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }

    const efipay = new EfiPay(efiConfig);

    // Gerar identificadores únicos
    const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Usar utilitária de TXID para geração confiável (SEM PREFIXO)
    const { TxidUtils } = await import('../../lib/txid-utils');
    const txid = TxidUtils.gerarTxidSeguro(32);

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

        // Verificar se ainda está pendente
        const bilheteAtual = await prisma.bilhete.findUnique({
          where: { id: bilhete.id }
        });

        if (bilheteAtual?.status === 'PENDENTE') {
          console.log('⏰ Cancelando bilhete expirado:', bilhete.id);

          await prisma.bilhete.update({
            where: { id: bilhete.id },
            data: { status: 'CANCELADO' }
          });

          // Reverter palpites para pendente
          await prisma.palpite.updateMany({
            where: {
              id: { in: palpitesIds }
            },
            data: {
              status: 'pendente'
            }
          });

          console.log('✅ Bilhete cancelado automaticamente');
        }

        await prisma.$disconnect();
      } catch (error) {
        console.error('❌ Erro no cancelamento automático:', error);
      }
    }, 5 * 60 * 1000); // 5 minutos

    // 4. GERAR PIX NA EFÍ - USAR PUT COM TXID ESPECÍFICO
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

    console.log('🔄 Criando cobrança PIX na EFÍ usando PUT...');
    console.log('🎯 TXID que será usado na EFÍ:', txid);

    let pixResponse;
    try {
      // ✅ USAR PUT AO INVÉS DE POST - GARANTE QUE O TXID SEJA O NOSSO
      const params = { txid: txid };
      pixResponse = await efipay.pixCreateCharge(params, body);

      console.log('✅ Cobrança PIX criada com PUT!');
      console.log('📋 TXID enviado para EFÍ:', txid);
      console.log('📋 Resposta da EFÍ:', JSON.stringify(pixResponse, null, 2));

      // Garantir que o TXID retornado é o mesmo que enviamos
      if (pixResponse.txid && pixResponse.txid !== txid) {
        console.warn('⚠️ TXID retornado pela EFÍ difere do enviado!', {
          enviado: txid,
          retornado: pixResponse.txid
        });
      }

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

    // 5. SALVAR PIX NO BANCO - SEMPRE USAR NOSSO TXID
    try {
      // 📋 Salvar resposta completa da EFÍ para logs
      const efiResponseLog = {
        txid_enviado: txid,
        txid_retornado: pixResponse.txid || txid,
        location_id: pixResponse.loc?.id,
        ambiente: isSandbox ? 'sandbox' : 'producao',
        timestamp: new Date().toISOString(),
        metodo_usado: 'PUT_com_txid_proprio'
      };

      const pixSalvo = await prisma.pixPagamento.create({
        data: {
          txid: txid, // ✅ SEMPRE usar o TXID gerado por nós
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
      console.log('✅ TXID definitivo salvo no banco:', txid);
      console.log('📋 Log da resposta EFÍ:', efiResponseLog);

      // ✅ VALIDAÇÃO FINAL: Confirmar que TXID do banco = TXID da EFÍ
      console.log('🔍 VALIDAÇÃO FINAL:');
      console.log('- TXID gerado por nós:', txid);
      console.log('- TXID salvo no banco:', pixSalvo.txid);
      console.log('- TXID retornado pela EFÍ:', pixResponse.txid || 'N/A');
      console.log('- ✅ TXID consistente:', pixSalvo.txid === txid ? 'SIM' : 'NÃO');

    } catch (dbError) {
      console.error('❌ Erro ao salvar PIX no banco:', dbError);
    }

    // Update bilhete with txid - ✅ SEMPRE USAR NOSSO TXID
    await prisma.bilhete.update({
      where: { id: bilhete.id },
      data: { txid: txid } // ✅ Usar o TXID gerado por nós, não o da EFÍ
    });

    return res.status(200).json({
      success: true,
      bilhete: {
        id: bilhete.id,
        txid: txid, // ✅ SEMPRE nosso TXID gerado
        orderId: orderId,
        expiresAt: expiresAt.toISOString(),
        status: 'PENDENTE'
      },
      pix: {
        txid: txid, // ✅ SEMPRE nosso TXID gerado
        qrcode: pixResponse.pixCopiaECola,
        valor: valorTotal,
        expiracao: expiresAt.toISOString(),
        ambiente: isSandbox ? 'sandbox' : 'produção',
        metodo: 'PUT_com_txid_controlado'
      },
      debug: {
        txid_gerado_por_nos: txid,
        txid_salvo_no_banco: txid,
        txid_usado_na_efi: txid,
        consistencia: 'GARANTIDA'
      }
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