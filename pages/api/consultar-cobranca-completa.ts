import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { TxidUtils } from '../../lib/txid-utils';
import EfiPay from 'sdk-node-apis-efi';
import path from 'path';
import fs from 'fs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { txid, revisao } = req.query;

  if (!txid || typeof txid !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'TXID é obrigatório',
      formato: 'Deve ter 26-35 caracteres alfanuméricos'
    });
  }

  // Analisar e validar TXID
  const analise = TxidUtils.analisarTxid(txid);

  if (!analise.valido) {
    return res.status(400).json({
      success: false,
      error: 'TXID inválido',
      analise: analise
    });
  }

  const txidLimpo = analise.sanitizado;

  try {
    console.log('🔍 Consultando cobrança completa para TXID:', txidLimpo);

    // 1. Consultar no banco local primeiro
    const dadosLocais = await prisma.pixPagamento.findFirst({
      where: { txid: txidLimpo },
      include: {
        palpites: {
          include: {
            jogo: true
          }
        }
      }
    });

    // 2. Consultar na EFI Pay
    let dadosEfi = null;
    let statusEfi = null;

    try {
      const efiClientId = process.env.EFI_CLIENT_ID;
      const efiClientSecret = process.env.EFI_CLIENT_SECRET;
      const efiSandbox = process.env.EFI_SANDBOX;

      if (!efiClientId || !efiClientSecret) {
        throw new Error('Credenciais EFI não configuradas');
      }

      const isSandbox = efiSandbox === 'true';

      let efiConfig: any = {
        sandbox: isSandbox,
        client_id: process.env.EFI_CLIENT_ID,
        client_secret: process.env.EFI_CLIENT_SECRET
      };

      const certificatePath = path.resolve('./certs/certificado-efi.p12');
      if (fs.existsSync(certificatePath) && process.env.EFI_CERTIFICATE_PASSPHRASE) {
        efiConfig.certificate = certificatePath;
        efiConfig.passphrase = process.env.EFI_CERTIFICATE_PASSPHRASE;
      }

      const efipay = new EfiPay(efiConfig);

      // Consultar cobrança PIX na EFI
      const params = revisao ? { revisao: parseInt(revisao as string) } : {};
      dadosEfi = await efipay.pixDetailCharge([], { txid: txidLimpo, ...params });
      statusEfi = dadosEfi.status;

      console.log('✅ Consulta EFI realizada com sucesso');

    } catch (efiError) {
      console.log('⚠️ Erro na consulta EFI (continuando com dados locais):', efiError);
    }

    // 3. Verificar expiração
    let expirado = false;
    if (dadosLocais) {
      const agora = new Date();
      expirado = agora > dadosLocais.expiracao;

      if (expirado && dadosLocais.status === 'ATIVA') {
        await prisma.pixPagamento.update({
          where: { id: dadosLocais.id },
          data: { status: 'EXPIRADA' }
        });
      }
    }

    // 4. Consolidar resposta
    const response: any = {
      success: true,
      txid: txidLimpo,
      analise: analise,
      consultas: {
        bancoLocal: !!dadosLocais,
        efiPay: !!dadosEfi
      }
    };

    if (dadosLocais) {
      response.dadosLocais = {
        id: dadosLocais.id,
        status: dadosLocais.status,
        valor: dadosLocais.valor,
        expiracao: dadosLocais.expiracao.toISOString(),
        expirado: expirado,
        qrcode: dadosLocais.pixCopiaECola,
        imagemQrcode: dadosLocais.imagemQrcode,
        totalPalpites: dadosLocais.palpites.length,
        createdAt: dadosLocais.createdAt.toISOString()
      };
    }

    if (dadosEfi) {
      response.dadosEfi = {
        status: statusEfi,
        calendario: dadosEfi.calendario,
        valor: dadosEfi.valor,
        chave: dadosEfi.chave,
        location: dadosEfi.location,
        pixCopiaECola: dadosEfi.pixCopiaECola,
        revisao: dadosEfi.revisao
      };
    }

    // Status consolidado
    if (statusEfi && dadosLocais) {
      response.statusConsolidado = statusEfi === 'CONCLUIDA' ? 'PAGO' : statusEfi;

      // Atualizar status local se necessário
      if (statusEfi === 'CONCLUIDA' && dadosLocais.status !== 'CONCLUIDA') {
        await prisma.pixPagamento.update({
          where: { id: dadosLocais.id },
          data: { status: 'CONCLUIDA' }
        });
      }
    } else if (dadosLocais) {
      response.statusConsolidado = dadosLocais.status;
    } else if (dadosEfi) {
      response.statusConsolidado = statusEfi;
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Erro na consulta completa:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao consultar cobrança',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      txid: txidLimpo
    });
  }
}
