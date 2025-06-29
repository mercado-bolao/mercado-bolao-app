
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import { prisma } from '../../../lib/prisma';

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

  // Sanitizar TXID antes da validação
  const txidLimpo = txid.trim().replace(/[^a-zA-Z0-9]/g, '');
  
  console.log('🔍 Debug TXID:', {
    original: txid,
    limpo: txidLimpo,
    comprimentoOriginal: txid.length,
    comprimentoLimpo: txidLimpo.length,
    caracteresInvalidos: txid.match(/[^a-zA-Z0-9]/g) || 'nenhum',
    hexDump: Buffer.from(txid).toString('hex')
  });

  // Validar formato do TXID (26-35 caracteres alfanuméricos)
  const txidPattern = /^[a-zA-Z0-9]{26,35}$/;
  if (!txidPattern.test(txidLimpo)) {
    return res.status(400).json({
      success: false,
      error: `TXID inválido. Deve ter 26-35 caracteres alfanuméricos.`,
      debug: {
        txidOriginal: txid,
        txidLimpo: txidLimpo,
        comprimento: txidLimpo.length,
        caracteresInvalidos: txid.match(/[^a-zA-Z0-9]/g) || 'nenhum'
      }
    });
  }

  try {
    console.log('🔍 Verificando status do PIX na EFÍ:', txid);

    // Configurar EFÍ Pay
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
    const EfiPay = require('sdk-node-apis-efi');

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
      } else {
        return res.status(400).json({
          success: false,
          error: 'Certificado não configurado para produção'
        });
      }
    }

    const efipay = new EfiPay(efiConfig);

    // Log detalhado da requisição
    console.log('🔧 Preparando requisição para EFÍ:', {
      txidOriginal: txid,
      txidLimpo: txidLimpo,
      comprimento: txidLimpo.length,
      encoding: Buffer.from(txidLimpo).toString('hex'),
      isValidPattern: /^[a-zA-Z0-9]{26,35}$/.test(txidLimpo),
      parametros: { txid: txidLimpo }
    });

    // Consultar PIX na EFÍ usando TXID limpo
    console.log('📡 Consultando PIX na EFÍ Pay...', { txidLimpo });
    const pixResponse = await efipay.pixDetailCharge([], { txid: txidLimpo });

    console.log('📋 Resposta da EFÍ:', JSON.stringify(pixResponse, null, 2));

    const statusEfi = pixResponse.status;
    let statusLocal = 'ATIVA';
    let mensagem = '';

    // Mapear status da EFÍ para status local
    switch (statusEfi) {
      case 'ATIVA':
        statusLocal = 'ATIVA';
        mensagem = 'PIX está ativo, aguardando pagamento';
        break;
      case 'CONCLUIDA':
        statusLocal = 'PAGA';
        mensagem = 'PIX foi pago com sucesso';
        break;
      case 'REMOVIDA_PELO_USUARIO_RECEBEDOR':
        statusLocal = 'CANCELADA';
        mensagem = 'PIX foi cancelado pelo recebedor';
        break;
      case 'REMOVIDA_PELO_PSP':
        statusLocal = 'CANCELADA';
        mensagem = 'PIX foi cancelado pelo PSP';
        break;
      default:
        statusLocal = statusEfi;
        mensagem = `Status retornado pela EFÍ: ${statusEfi}`;
    }

    // Atualizar status no banco se necessário
    if (statusEfi === 'CONCLUIDA') {
      console.log('✅ PIX confirmado como pago, atualizando banco...');
      
      // Buscar bilhete pelo TXID (tentar ambos: original e limpo)
      let bilhete = await prisma.bilhete.findFirst({
        where: { txid: txid },
        include: { palpites: true, pix: true }
      });

      // Se não encontrou, tentar com TXID limpo
      if (!bilhete) {
        bilhete = await prisma.bilhete.findFirst({
          where: { txid: txidLimpo },
          include: { palpites: true, pix: true }
        });
      }

      if (bilhete && bilhete.status !== 'PAGO') {
        // Atualizar bilhete
        await prisma.bilhete.update({
          where: { id: bilhete.id },
          data: { status: 'PAGO', updatedAt: new Date() }
        });

        // Atualizar palpites
        await prisma.palpite.updateMany({
          where: { bilheteId: bilhete.id },
          data: { status: 'pago' }
        });

        // Atualizar PIX
        if (bilhete.pix) {
          await prisma.pixPagamento.update({
            where: { id: bilhete.pix.id },
            data: { status: 'PAGA' }
          });
        }

        mensagem += '\n\nBilhete e palpites foram atualizados para PAGO no sistema.';
      }
    }

    return res.status(200).json({
      success: true,
      status: statusLocal,
      statusEfi: statusEfi,
      message: mensagem,
      dadosCompletos: pixResponse
    });

  } catch (error) {
    console.error('❌ Erro ao verificar status na EFÍ:', error);
    
    let mensagemErro = 'Erro ao consultar EFÍ Pay';
    
    if (error && typeof error === 'object' && 'error_description' in error) {
      mensagemErro = error.error_description as string;
    } else if (error instanceof Error) {
      mensagemErro = error.message;
    }

    return res.status(500).json({
      success: false,
      error: mensagemErro,
      details: error instanceof Error ? error.stack : String(error)
    });
  } finally {
    await prisma.$disconnect();
  }
}
